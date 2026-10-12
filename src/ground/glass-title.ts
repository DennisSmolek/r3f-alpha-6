import { Box3, Group, MeshBasicNodeMaterial, Mesh, Vector3, type BufferGeometry, type Material, type Object3D } from 'three/webgpu';
import { extrude, fractureGlyph, glyphShapes, random } from '../fracture';
import { ease } from '../timeline';
import { glide, impactTime, tagPose } from './choreography';
import { bakeShards, type ShardLive } from './shard-physics';
import type { Obstacle, Pusher } from './shard-world';
import { withShadow } from './shadow-light';
import type { Typography } from '../typography';
import type { GroundSettings } from './settings';

/**
 * `<Canvas renderer />` in glass, standing on the ground at y = 0 in em units. `/>` winds up and strikes
 * `renderer`, whose shards fall under a baked simulation while `<Canvas` glides over to meet `/>`.
 * `duration` is how long the choreography runs after the strike. `fit` gives the world scale for a word
 * width, so the title grows from fitting `<Canvas renderer />` to fitting `<Canvas />` on narrow screens. Once it ends the shards switch to a live
 * simulation where a cursor sphere sweeps them and a click pops them up.
 */
export function createGlassTitle(typography: Typography, material: Material, settings: GroundSettings, duration: number, fit: (width: number) => number) {
  const { displayFont, depth, bevel, fractureSeed, fragmentCount } = settings;
  const root = new Group(), intact = new Group(), shardGroup = new Group(), tag = new Group();
  root.add(intact, shardGroup, tag);
  const source = typography.handle.createText({ font: typography.display[displayFont], text: '<Canvas renderer />', style: { fontSize: 1 } });
  const layout = source.glyphs();
  const finalSource = typography.handle.createText({ font: typography.display[displayFont], text: '<Canvas />', style: { fontSize: 1 } });
  const finalLayout = finalSource.glyphs();
  const ink = layout.inkBounds!;
  // The lowest ink touches the ground and the extrusion is centered on z = 0.
  const offset = new Vector3(-layout.width / 2, ink.y + ink.height, -depth / 2);
  const geometries: BufferGeometry[] = [];
  const shadowMaterial = new MeshBasicNodeMaterial();
  const opening: { mesh: Object3D; travel: number; box: Box3 }[] = [];
  const tagBox = new Box3(), intactBox = new Box3();
  const fractureShapes: ReturnType<typeof glyphShapes> = [];
  let tagTravel = 0;
  for (let i = 0; i < layout.glyphCount; i++) {
    const cluster = layout.clusters[i];
    const shapes = glyphShapes(layout, i);
    if (!shapes.length) continue;
    const geometry = extrude(shapes, bevel, depth);
    geometries.push(geometry);
    const mesh = withShadow(new Mesh(geometry, material), shadowMaterial);
    mesh.position.copy(offset);
    const box = geometry.boundingBox!.clone().translate(offset);
    if (cluster >= 8 && cluster < 16) {
      intact.add(mesh);
      intactBox.union(box);
      fractureShapes.push(...shapes);
      continue;
    }
    const finalIndex = Array.from(finalLayout.clusters).indexOf(cluster > 15 ? cluster - 9 : cluster);
    const travel = finalLayout.x[finalIndex] - finalLayout.width / 2 - (layout.x[i] - layout.width / 2);
    if (cluster > 15) { tag.add(mesh); tagBox.union(box); tagTravel = travel; }
    else { root.add(mesh); opening.push({ mesh, travel, box }); }
  }
  const [startScale, endScale] = [fit(layout.width), fit(finalLayout.width)];
  source.dispose();
  finalSource.dispose();

  // `/>` pivots at the middle of its base so it can lean and squash like a spring toy.
  const pivot = (tagBox.min.x + tagBox.max.x) / 2;
  tag.position.x = pivot;
  tag.children.forEach(mesh => { mesh.position.x -= pivot; });
  const strike = intactBox.max.x - tagBox.min.x;

  const rng = random(fractureSeed * 31 + 7);
  const span = intactBox.max.x - intactBox.min.x;
  const pieces = fractureGlyph(fractureShapes, fractureSeed, { cells: fragmentCount, depth, impact: [1, 0.45] }).map(piece => {
    geometries.push(piece.geometry);
    const mesh = withShadow(new Mesh(piece.geometry, material), shadowMaterial);
    shardGroup.add(mesh);
    const position = piece.center.clone().add(offset);
    // 1 at the strike, 0 at the far end of the word.
    const near = Math.max(0, Math.min(1, 1 - (intactBox.max.x - position.x) / span));
    return {
      mesh, position, geometry: piece.geometry, spin: piece.spin,
      // Most pieces spray back behind the title so the copy in front stays readable.
      launch: new Vector3(-(0.4 + 2.4 * near * rng()), 1.4 + (1 + 2 * near) * rng(), rng() < 0.75 ? -(0.6 + 2 * rng()) : 0.3 + 0.9 * rng()),
      delay: (1 - near) * 0.08 + rng() * 0.02,
    };
  });

  let physics: ReturnType<typeof bakeShards> | undefined, physicsKey = '';
  let pose: ReturnType<typeof tagPose> | undefined, poseKey = '';
  let live: ShardLive | undefined, last: Vector3 | undefined;
  const pusher: Pusher = { center: new Vector3(), velocity: new Vector3(), radius: 1 };

  return { root,
    /**
     * Poses everything for choreography time `t`, re-simulating only when a motion setting changes.
     * `cursor` and `press` are world points on the ground. Returns true while live shards are moving.
     */
    update(t: number, settings: GroundSettings, delta = 0, cursor?: Vector3, press?: Vector3) {
      if (poseKey !== String(settings.windup)) {
        poseKey = String(settings.windup);
        pose = tagPose(settings.windup, strike, tagTravel);
        physicsKey = '';
      }
      const key = [settings.explosion, settings.gravity, settings.bounce, settings.friction, settings.shardCollisions].join();
      if (physicsKey !== key) {
        physicsKey = key;
        const obstacles: Obstacle[] = opening.map(({ box, travel }, i) => ({ min: box.min, max: box.max, offset: time => travel * glide(time + impactTime, i, opening.length) }));
        obstacles.push({ min: tagBox.min, max: tagBox.max, offset: time => pose!(time + impactTime).x });
        physics = bakeShards(pieces.map(piece => ({
          geometry: piece.geometry, position: piece.position, delay: piece.delay,
          velocity: piece.launch.clone().multiplyScalar(settings.explosion),
          spin: piece.spin.clone().multiplyScalar(settings.explosion),
        })), obstacles, { duration, gravity: settings.gravity, bounce: settings.bounce, friction: settings.friction, collide: settings.shardCollisions });
        live = undefined;
      }
      if (t - impactTime < duration - 1e-3) live = last = undefined;
      else live ??= physics!.live();
      if (live && cursor) {
        const point = root.worldToLocal(cursor.clone());
        if (last) pusher.velocity.subVectors(point, last).divideScalar(Math.max(delta, 1 / 60)).clampLength(0, 14);
        else pusher.velocity.set(0, 0, 0);
        pusher.center.copy(point);
        pusher.radius = settings.cursorSize;
        last = point;
      } else last = undefined;
      if (live && press) live.kick(root.worldToLocal(press.clone()), settings.cursorSize * 4, 1);
      live?.advance(Math.min(delta, 0.05), cursor && pusher);
      root.scale.setScalar(startScale + (endScale - startScale) * ease(t, impactTime + 0.1, impactTime + 1.2));
      opening.forEach(({ mesh, travel }, i) => { mesh.position.x = offset.x + travel * glide(t, i, opening.length); });
      const now = pose!(t);
      tag.position.x = pivot + now.x;
      tag.rotation.z = now.lean;
      tag.scale.set(1 + now.squash, 1 - now.squash * 0.6, 1);
      intact.visible = t < impactTime;
      shardGroup.visible = !intact.visible;
      if (shardGroup.visible) pieces.forEach(({ mesh }, i) => live ? live.pose(i, mesh.position, mesh.quaternion) : physics!.sample(t - impactTime, i, mesh.position, mesh.quaternion));
      return live?.awake() ?? false;
    },
    dispose() { geometries.forEach(geometry => geometry.dispose()); shadowMaterial.dispose(); },
  };
}
