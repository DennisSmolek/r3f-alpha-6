import { traceStartup } from '../startup';
import { use, useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { glyph } from '@pmndrs/glyph';
import { Group, Mesh, MeshBasicNodeMaterial, PlaneGeometry, Vector3, type WebGPURenderer } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { credits } from '../credits';
import { animationDuration, choreographyTime, ease } from '../timeline';
import { useCameraRig } from '../camera';
import { fontsReady } from '../typography';
import { createEnvironmentMap, studioReady } from '../environment';
import { createStage } from './stage';
import { createLabels, spreadRow, type LabelOptions } from '../labels';
import type { CameraPose, SceneSettings } from './settings';
import type { Playback } from '../shell/use-playback';
import { createHitAreas } from '../shell/hit-areas';
import { extrude, fractureGlyph, glyphShapes } from '../fracture';
import { createBackground } from './background';
import { createGlass } from '../glass/create-glass';
import { updateGlass } from '../glass/update-glass';
import { captureTransmissionBackdrop } from '../glass/transmissionBackdrop';

export function AnnouncementScene({ playback, settings, onCameraPose, onReady, onError }: {
  playback: React.RefObject<Playback>;
  settings: SceneSettings;
  onCameraPose: (pose: CameraPose) => void;
  onReady: () => void;
  onError: (error: unknown) => void;
}) {
  const typography = use(fontsReady);
  const studio = use(studioReady);
  const atmosphereTime = useRef(0);
  const flowTime = useRef(0);
  const { scene, camera, renderer, size, invalidate } = useThree();
  const liveSettings = useRef(settings);
  liveSettings.current = settings;
  const updateCamera = useCameraRig(settings, playback, onCameraPose);
  const { displayFont, detailFont, environment: environmentChoice, depth, bevel, fractureSeed, fragmentCount } = settings;

  useEffect(() => { invalidate(); }, [settings, invalidate]);
  const update = useRef<((time: number) => void) | null>(null);

  useLayoutEffect(() => {
    traceStartup('Building scene');
    const w = size.width, h = size.height;
    const compact = w < 650;
    const root = new Group();
    scene.add(root);
    const background = createBackground(w, h);
    root.add(background.mesh);
    const stage = createStage(w, h, typography);
    root.add(stage.root);
    const glass = createGlass(renderer, scene, camera);
    const environment = createEnvironmentMap(renderer as WebGPURenderer, studio, environmentChoice);
    const previousEnvironment = scene.environment;
    scene.environment = environment.texture;
    scene.environmentIntensity = 1;
    const geometries: { dispose(): void }[] = [];
    const materials: { dispose(): void }[] = [];
    const appear = uniform(0), alphaAppear = uniform(0);
    const labels = createLabels(typography, { displayFont, detailFont }, onError);
    const label = (text: string, x: number, y: number, fontSize: number, options: LabelOptions & { depth?: number } = {}) => {
      const object = labels.create(text, fontSize, options);
      object.position.x += x;
      object.position.y += y;
      object.position.z = options.depth ?? -100;
      root.add(object);
      return object;
    };

    label('-  B R E A K I N G   C H A N G E S  -', 0, h / 2 - 46, compact ? 9 : 10, { tone: 'heading' });
    label('REACT THREE FIBER', -w / 2 + 32, h / 2 - 46, 10, { tone: 'muted', align: 'left' }).visible = !compact;
    const titleY = h * 0.13;
    const title = new Group();
    title.position.set(0, titleY, 220);
    root.add(title);
    const source = typography.handle.createText({ font: typography.display[displayFont], text: '<Canvas renderer />', style: { fontSize: 1 } });
    const layout = source.glyphs();
    const fullWidth = layout.width;
    const finalSource = typography.handle.createText({ font: typography.display[displayFont], text: '<Canvas />', style: { fontSize: 1 } });
    const finalLayout = finalSource.glyphs();
    const finalWidth = finalLayout.width;
    const initialSize = Math.min(w * 0.87 / fullWidth, 112, h * 0.145);
    const finalSize = Math.min(w * 0.78 / finalWidth, 154, h * 0.2);
    const centerY = -(layout.inkBounds!.y + layout.inkBounds!.height / 2);
    const letters: { mesh: Mesh; start: number; end: number }[] = [];
    const doomed = new Group();
    const shards = new Group();
    title.add(doomed, shards);
    const fractureShapes: ReturnType<typeof glyphShapes> = [];
    const fragments: { mesh: Mesh; origin: Vector3; velocity: Vector3; spin: Vector3; delay: number }[] = [];
    for (let i = 0; i < layout.glyphCount; i++) {
      const cluster = layout.clusters[i];
      const shapes = glyphShapes(layout, i);
      if (!shapes.length) continue;
      const geometry = extrude(shapes, bevel, depth);
      geometries.push(geometry);
      const mesh = new Mesh(geometry, glass.material);
      mesh.position.set(-fullWidth / 2, -centerY, 0);
      if (cluster >= 8 && cluster < 16) {
        doomed.add(mesh);
        fractureShapes.push(...shapes);
      } else {
        title.add(mesh);
        const finalCluster = cluster > 15 ? cluster - 9 : cluster;
        const finalIndex = Array.from(finalLayout.clusters).indexOf(finalCluster);
        const end = finalIndex >= 0 ? finalLayout.x[finalIndex] - layout.x[i] - finalWidth / 2 : -finalWidth / 2;
        letters.push({ mesh, start: -fullWidth / 2, end });
      }
    }
    for (const piece of fractureGlyph(fractureShapes, fractureSeed, { cells: fragmentCount, depth })) {
      geometries.push(piece.geometry);
      const shard = new Mesh(piece.geometry, glass.material);
      const origin = piece.center.clone().add(new Vector3(-fullWidth / 2, -centerY, 0));
      shard.position.copy(origin);
      shards.add(shard);
      fragments.push({ mesh: shard, origin, velocity: piece.velocity, spin: piece.spin, delay: piece.delay });
    }
    source.dispose();
    finalSource.dispose();

    const versionSize = compact ? 17 : 21;
    const version = label('r3f v10', 0, -h * 0.067, versionSize, { depth: 110 });
    const alpha = label('Alpha 6', 0, -h * 0.067, versionSize, { depth: 110, tone: 'accent', opacity: alphaAppear });
    const versionWidth = version.measure().width;
    const alphaWidth = alpha.measure().width;
    const releaseWidth = versionWidth + 14 + alphaWidth;
    label('is now', 0, -h * 0.118, compact ? 14 : 16, { tone: 'muted', opacity: appear, depth: 20 });
    label('WebGPU First', 0, -h * 0.182, Math.min(compact ? w * 0.087 : 50, h * 0.065), { bold: true, opacity: appear, depth: 65 });

    const hits = createHitAreas();
    const links = ['Docs', '/', 'Examples', '/', 'WebGL'].map(text => text === '/' ? label(text, 0, -h * 0.353, 12, { tone: 'muted' }) : label(text, 0, -h * 0.353, 14));
    const centers = spreadRow(links, 18);
    ['docs', 'examples', 'webgl'].forEach((key, i) => hits.add(key, root, centers[i * 2], -h * 0.353, links[i * 2].measure().width + 28, 44, -100));

    const trackWidth = compact ? 190 : 226;
    const trackMaterial = new MeshBasicNodeMaterial({ color: '#77716a', transparent: true, opacity: 0.18, toneMapped: false });
    const progressMaterial = new MeshBasicNodeMaterial({ color: '#ed582c', toneMapped: false });
    materials.push(trackMaterial, progressMaterial);
    const trackGeometry = new PlaneGeometry(trackWidth, 2);
    const progressGeometry = new PlaneGeometry(trackWidth, 2);
    geometries.push(trackGeometry, progressGeometry);
    const track = new Mesh(trackGeometry, trackMaterial), progress = new Mesh(progressGeometry, progressMaterial);
    track.position.set(0, -h * 0.407, 100);
    progress.position.set(0, -h * 0.407, 101);
    root.add(track, progress);
    // The scrubber's thumb travels its width minus the 9 px thumb, so it spans the drawn track.
    hits.add('timeline', root, 0, -h * 0.407, trackWidth + 9, 24, 100);
    const footSize = compact ? 9 : 11;
    const footY = -h / 2 + 29;
    credits.forEach(([text], i) => {
      const x = compact ? (i < 3 ? (i - 1) * (w - 32) / 3 : (i - 3.5) * (w - 32) / 2) : [-210, -130, -20, 90, 190][i];
      const y = compact ? -h / 2 + (i < 3 ? 42 : 14) : footY;
      hits.add(`credit-${i}`, root, x, y, label(text, x, y, footSize, { tone: 'muted' }).measure().width + 20, compact ? 28 : 38, -100);
    });
    label('BUILT WITH', -w / 2 + 32, footY, 9, { tone: 'muted', align: 'left' }).visible = w > 800;
    label('ALPHA 6', w / 2 - 32, footY, 9, { tone: 'muted', align: 'right' }).visible = w > 800;

    update.current = (elapsed) => {
      const settings = liveSettings.current;
      const time = choreographyTime(elapsed, settings.breakDelay);
      const light = ease(time, 2.15, 4.8);
      const close = ease(time, 3.05, 5.05);
      labels.theme.value = ease(time, 2.2, 3.4);
      background.reveal.value = light;
      labels.headingColor.value.set(settings.color2);
      background.update(settings);
      background.time.value = flowTime.current;
      stage.update(settings, atmosphereTime.current, light);
      scene.environmentRotation.set(0, settings.environmentRotation * Math.PI / 180, 0);
      updateGlass(glass, settings, atmosphereTime.current);
      appear.value = ease(time, 4.35, 5.5);
      alphaAppear.value = ease(time, 3.65, 4.5);
      title.scale.setScalar(initialSize + (finalSize - initialSize) * close);
      title.rotation.set(settings.tiltX * Math.PI / 180, settings.tiltY * Math.PI / 180, -0.008 * (1 - close));
      letters.forEach(({ mesh, start, end }) => { mesh.position.x = start + (end - start) * close; });
      doomed.visible = time < 2.2;
      shards.visible = time >= 2.2 && time < 5.6;
      fragments.forEach(({ mesh, origin, velocity, spin, delay }) => {
        const t = Math.max(0, time - 2.2 - delay);
        mesh.position.copy(origin).addScaledVector(velocity, t * settings.explosion);
        mesh.position.y -= 2.8 * t * t;
        mesh.rotation.set(spin.x * t, spin.y * t, spin.z * t);
      });
      const slide = ease(time, 3.5, 4.55);
      version.position.x = -versionWidth / 2 + (-releaseWidth / 2 + versionWidth / 2) * slide;
      alpha.position.x = -releaseWidth / 2 + versionWidth + 14;
      const amount = Math.max(0.001, Math.min(1, elapsed / animationDuration(settings.breakDelay)));
      progress.scale.x = amount;
      progress.position.x = -trackWidth * (1 - amount) / 2;
      hits.update(camera, renderer.domElement);
      glyph.shape();
    };
    update.current(playback.current.time);
    traceStartup('Compiling scene', 0.95);
    let alive = true;
    // Compile the complete page before releasing the intro clock.
    // Skip effects torn down by StrictMode before starting asynchronous GPU work.
    Promise.resolve().then(() => alive ? (renderer as WebGPURenderer).compileAsync(scene, camera) : undefined).then(() => {
      if (alive) { traceStartup('Scene ready', 1); onReady(); }
    }).catch(error => { if (alive) onError(error); });
    return () => {
      alive = false;
      update.current = null;
      hits.dispose();
      root.removeFromParent();
      labels.dispose();
      glyph.shape();
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      glass.dispose();
      stage.dispose();
      background.dispose();
      scene.environment = previousEnvironment;
      environment.dispose();
    };
  }, [size.width, size.height, displayFont, detailFont, environmentChoice, depth, bevel, fractureSeed, fragmentCount, studio, typography, scene, camera, renderer, playback, onReady, onError]);

  useFrame(state => {
    const p = playback.current;
    if (p.ready && p.playing && !document.hidden) p.time = Math.min(animationDuration(liveSettings.current.breakDelay), p.time + Math.min(state.delta, 0.05));
    const animated = liveSettings.current.animate && !p.reduced && !document.hidden;
    if (animated) {
      atmosphereTime.current += Math.min(state.delta, 0.05);
      flowTime.current += Math.min(state.delta, 0.05) * liveSettings.current.speed;
      invalidate();
    }
    updateCamera(state.delta);
    update.current?.(p.time);
    if (p.ready) captureTransmissionBackdrop(renderer, scene, camera, state.elapsed);
  }, { priority: 1 });
  return null;
}
