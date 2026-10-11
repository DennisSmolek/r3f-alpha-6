import { Box3, Group, MeshBasicNodeMaterial, Mesh, Vector3, type BufferGeometry, type Material, type Object3D } from 'three/webgpu';
import { extrude, fractureGlyph, glyphShapes, random } from '../fracture';
import { glide, impactTime, tagPose } from './choreography';
import { bakeShards, type Obstacle } from './shard-physics';
import { withShadow } from './shadow-light';
import type { Typography } from '../typography';
import type { GroundSettings } from './settings';

/**
 * `<Canvas renderer />` in glass, standing on the ground at y = 0 in em units. `/>` winds up and strikes
 * `renderer`, whose shards fall under a baked simulation while `<Canvas` glides over to meet `/>`.
 * `duration` is how long the choreography runs after the strike.
 */
export function createGlassTitle(typography: Typography, material: Material, settings: GroundSettings, duration: number) {
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

  return { root, width: layout.width,
    /** Poses everything for choreography time `t`, re-simulating only when a motion setting changes. */
    update(t: number, settings: GroundSettings) {
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
      }
      opening.forEach(({ mesh, travel }, i) => { mesh.position.x = offset.x + travel * glide(t, i, opening.length); });
      const now = pose!(t);
      tag.position.x = pivot + now.x;
      tag.rotation.z = now.lean;
      tag.scale.set(1 + now.squash, 1 - now.squash * 0.6, 1);
      intact.visible = t < impactTime;
      shardGroup.visible = !intact.visible;
      if (shardGroup.visible) pieces.forEach(({ mesh }, i) => physics!.sample(t - impactTime, i, mesh.position, mesh.quaternion));
    },
    dispose() { geometries.forEach(geometry => geometry.dispose()); shadowMaterial.dispose(); },
  };
}
