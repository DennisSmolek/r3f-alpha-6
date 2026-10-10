import { use, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei/core';
import { glyph } from '@pmndrs/glyph';
import { defineTextMaterial } from '@pmndrs/glyph/three';
import { Color, DoubleSide, Group, Mesh, MeshBasicNodeMaterial, PlaneGeometry, PMREMGenerator, Vector3, type WebGPURenderer } from 'three/webgpu';
import { credits } from './credits';
import { animationDuration, choreographyTime } from './timeline';
import { useCameraRig } from './camera';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { color, mix, uniform } from 'three/tsl';
import { fontsReady } from './typography';
import { studioReady } from './environment';
import { createStage } from './stage';
import type { CameraPose, SceneSettings } from './settings';
import { extrude, fractureGlyph, glyphShapes } from './fracture';
import { createBackground } from './background';
import { createGlass } from './glass/create-glass';
import { captureTransmissionBackdrop } from './glass/transmissionBackdrop';

export type Playback = { time: number; playing: boolean; ready: boolean; reduced: boolean };
export function ease(t: number, from: number, to: number) {
  const x = Math.max(0, Math.min(1, (t - from) / (to - from)));
  return x * x * (3 - 2 * x);
}

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
    const w = size.width, h = size.height;
    const compact = w < 650;
    const root = new Group();
    scene.add(root);
    const background = createBackground(w, h);
    root.add(background.mesh);
    const stage = createStage(w, h, typography);
    root.add(stage.root);
    const glass = createGlass(renderer, scene, camera);
    const pmrem = new PMREMGenerator(renderer as WebGPURenderer);
    const room = new RoomEnvironment();
    const environment = environmentChoice === 'Studio HDR' ? pmrem.fromEquirectangular(studio) : pmrem.fromScene(room, 0.04);
    const previousEnvironment = scene.environment;
    scene.environment = environment.texture;
    scene.environmentIntensity = 1;
    const geometries: { dispose(): void }[] = [];
    const materials: { dispose(): void }[] = [];
    const textObjects: { dispose(): void }[] = [];
    const theme = uniform(0), appear = uniform(0), alphaAppear = uniform(0);
    const ink = mix(color('#d1d0cd'), color('#24221f'), theme);
    const headingColor = uniform(new Color());
    const muted = mix(color('#818183'), color('#77716a'), theme);
    const makeTextMaterial = (tone: 'ink' | 'muted' | 'accent' | 'heading', opacity = uniform(1)) => defineTextMaterial(context => {
      const material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false, side: DoubleSide });
      material.positionNode = context.position;
      material.colorNode = tone === 'heading' ? headingColor : tone === 'accent' ? color('#ee5429') : tone === 'muted' ? muted : ink;
      material.opacityNode = context.shader.opacity.mul(opacity);
      materials.push(material);
      return material;
    });
    const label = (text: string, x: number, y: number, fontSize: number, options: { tone?: 'ink' | 'muted' | 'accent' | 'heading'; opacity?: typeof appear; bold?: boolean; depth?: number; align?: 'left' | 'center' | 'right' } = {}) => {
      const object = typography.handle.createText({
        font: options.bold ? typography.display[displayFont] : typography.detail[detailFont],
        text, style: { fontSize, lineHeight: 1.1 },
        material: makeTextMaterial(options.tone ?? 'ink', options.opacity),
      });
      object.onError = onError;
      const m = object.glyphs();
      const box = m.inkBounds!;
      object.position.set(x - (options.align === 'left' ? 0 : options.align === 'right' ? m.width : m.width / 2), y + box.y + box.height / 2, options.depth ?? -100);
      root.add(object);
      textObjects.push(object);
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

    label('Docs', -54, -h * 0.353, 14);
    label('Examples', 48, -h * 0.353, 14);
    label('/', -3, -h * 0.353, 12, { tone: 'muted' });

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
    const footSize = compact ? 9 : 11;
    const footY = -h / 2 + 29;
    credits.forEach(([text], i) => {
      const x = compact ? (i % 3 - 1) * (w - 32) / 3 : [-245, -165, -95, 15, 125, 225][i];
      const y = compact ? -h / 2 + (i < 3 ? 42 : 14) : footY;
      label(text, x, y, footSize, { tone: 'muted' });
    });
    label('BUILT WITH', -w / 2 + 32, footY, 9, { tone: 'muted', align: 'left' }).visible = w > 800;
    label('ALPHA 6', w / 2 - 32, footY, 9, { tone: 'muted', align: 'right' }).visible = w > 800;

    update.current = (elapsed) => {
      const settings = liveSettings.current;
      const time = choreographyTime(elapsed, settings.breakDelay);
      const light = ease(time, 2.15, 4.8);
      const close = ease(time, 3.05, 5.05);
      theme.value = ease(time, 2.2, 3.4);
      background.reveal.value = light;
      headingColor.value.set(settings.color2);
      background.update(settings);
      background.time.value = flowTime.current;
      stage.update(settings, atmosphereTime.current, light);
      scene.environmentRotation.set(0, settings.environmentRotation * Math.PI / 180, 0);
      glass.params.ior.value = liveSettings.current.ior;
      glass.params.thickness.value = liveSettings.current.thickness;
      glass.material.envMapIntensity = liveSettings.current.reflections;
      glass.material.color.set(settings.glassTint);
      glass.material.roughness = settings.roughness;
      glass.material.dispersion = settings.dispersion;
      glass.params.distortion.value = settings.distortion;
      glass.params.time.value = atmosphereTime.current;
      glass.config.backside = settings.backside;
      glass.config.backsideThickness = settings.thickness;
      glass.params.backsideThickness.value = settings.thickness;
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
      glyph.shape();
    };
    update.current(playback.current.time);
    let alive = true;
    // Compile the complete page before releasing the intro clock.
    // Skip effects torn down by StrictMode before starting asynchronous GPU work.
    Promise.resolve().then(() => alive ? (renderer as WebGPURenderer).compileAsync(scene, camera) : undefined).then(() => {
      if (alive) onReady();
    }).catch(error => { if (alive) onError(error); });
    return () => {
      alive = false;
      update.current = null;
      root.removeFromParent();
      textObjects.forEach(text => text.dispose());
      glyph.shape();
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      glass.dispose();
      stage.dispose();
      background.dispose();
      scene.environment = previousEnvironment;
      environment.dispose();
      room.dispose();
      pmrem.dispose();
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
  return <PoimandresMark playback={playback} breakDelay={settings.breakDelay} />;
}


function PoimandresMark({ playback, breakDelay }: { playback: React.RefObject<Playback>; breakDelay: number }) {
  const { size } = useThree();
  const [material, dark, light] = useMemo(() => [new MeshBasicNodeMaterial({ toneMapped: false }), new Color('#d1d0cd'), new Color('#24221f')], []);
  const unit = size.width < 650 ? 10 : 11;
  useFrame(() => { material.color.lerpColors(dark, light, ease(choreographyTime(playback.current.time, breakDelay), 2.2, 3.4)); });
  useLayoutEffect(() => () => material.dispose(), [material]);
  return <group position={[0, -size.height * 0.286, -30]}>
    {[[ -1.16, 0, 1, 1 ], [0, 0, 1, 1], [0, -1.16, 1, 1], [0.58, 1.16, 2.16, 1], [1.16, 0.58, 1, 2.16]].map(([x, y, w, h], i) => (
      <RoundedBox key={i} args={[w * unit, h * unit, 1]} radius={0.12} smoothness={2} position={[x * unit, y * unit, 0]} material={material} />
    ))}
  </group>;
}
