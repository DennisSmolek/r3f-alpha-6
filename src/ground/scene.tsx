import { traceStartup } from '../startup';
import { use, useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { glyph } from '@pmndrs/glyph';
import { MathUtils, type PerspectiveCamera, type WebGPURenderer } from 'three/webgpu';
import { useCameraRig } from '../camera';
import { fontsReady } from '../typography';
import { createEnvironmentMap, studioReady } from '../environment';
import { createGlass } from '../glass/create-glass';
import { updateGlass } from '../glass/update-glass';
import { captureTransmissionBackdrop } from '../glass/transmissionBackdrop';
import { ease } from '../timeline';
import type { Playback } from '../shell/use-playback';
import { animationDuration, choreographyTime, impactTime } from './choreography';
import { groundLayout } from './layout';
import { createGround } from './ground';
import { createShadowLight } from './shadow-light';
import { createGlassTitle } from './glass-title';
import { createGroundCopy } from './ground-copy';
import { useGroundCursor } from './use-ground-cursor';
import type { GroundSettings } from './settings';

/**
 * Glass type standing on a gradient floor. The camera looks down at the floor, and the remaining copy is
 * printed flat on it. Each part is built in its own effect so a setting only rebuilds what depends on it.
 * After the intro the cursor sweeps the settled shards and a click pops them up.
 */
export function GroundScene({ playback, settings, onCameraPose, onReady, onError }: {
  playback: React.RefObject<Playback>;
  settings: GroundSettings;
  onCameraPose: (pose: Pick<GroundSettings, 'cameraYaw' | 'cameraPitch' | 'cameraZoom'>) => void;
  onReady: () => void;
  onError: (error: unknown) => void;
}) {
  const typography = use(fontsReady);
  const studio = use(studioReady);
  const { scene, camera, renderer, size, invalidate } = useThree();
  const live = useRef(settings);
  live.current = settings;
  const clock = useRef({ atmosphere: 0, flow: 0 });
  const parts = useRef<{
    ground?: ReturnType<typeof createGround>; title?: ReturnType<typeof createGlassTitle>;
    copy?: ReturnType<typeof createGroundCopy>; glass?: ReturnType<typeof createGlass>;
  }>({});
  const fov = (camera as PerspectiveCamera).fov;
  // At this distance one world unit at the target is one screen pixel.
  const distance = size.height / 2 / Math.tan(MathUtils.degToRad(fov / 2));
  const readCursor = useGroundCursor();
  const updateCamera = useCameraRig(settings, playback, onCameraPose, { distance, pitch: [14, 70], pointerPitch: [10, 80] });
  const { environment, displayFont, detailFont, depth, bevel, fractureSeed, fragmentCount, cameraPitch } = settings;
  const layout = groundLayout(size.width, size.height, fov, distance, cameraPitch);
  const titleAt = layout.at(0, size.height * (size.width < 650 ? 0.09 : 0.04));
  const titlePixel = layout.scale(titleAt);

  useEffect(() => { invalidate(); }, [settings, invalidate]);

  useLayoutEffect(() => {
    const map = createEnvironmentMap(renderer as WebGPURenderer, studio, environment);
    const previous = scene.environment;
    scene.environment = map.texture;
    return () => { scene.environment = previous; map.dispose(); };
  }, [renderer, scene, studio, environment]);

  useLayoutEffect(() => {
    const projection = camera as PerspectiveCamera;
    projection.near = distance * 0.02;
    projection.far = distance * 40;
    projection.updateProjectionMatrix();
    (renderer as WebGPURenderer).shadowMap.enabled = true;
    const ground = createGround(size.width, size.height, distance * 16);
    const light = createShadowLight(Math.max(size.width, size.height) * 1.2);
    scene.add(ground.root, light);
    parts.current.ground = ground;
    const previousBackground = scene.background;
    scene.background = ground.horizon;
    return () => {
      scene.remove(ground.root, light);
      light.dispose();
      ground.dispose();
      scene.background = previousBackground;
      parts.current.ground = undefined;
    };
  }, [scene, camera, size.width, size.height, distance]);

  useLayoutEffect(() => {
    const glass = createGlass(renderer, scene, camera);
    // The backdrop pass shows the horizon wherever no ground is drawn.
    glass.config.background = parts.current.ground?.horizon;
    const title = createGlassTitle(typography, glass.material, live.current, animationDuration(0) - impactTime, width => Math.min(size.width * 0.84 / width, 112, size.height * 0.15) * titlePixel);
    title.root.position.copy(titleAt);
    scene.add(title.root);
    parts.current.glass = glass;
    parts.current.title = title;
    return () => {
      scene.remove(title.root);
      title.dispose();
      glass.dispose();
      parts.current.title = parts.current.glass = undefined;
    };
  // Title rebuilds follow the geometry settings, not every panel change.
  }, [renderer, scene, camera, typography, size.width, size.height, displayFont, depth, bevel, fractureSeed, fragmentCount, titleAt.x, titleAt.z, titlePixel]);

  useLayoutEffect(() => {
    const copy = createGroundCopy(typography, live.current, onError, groundLayout(size.width, size.height, fov, distance, cameraPitch), size.width, size.height);
    scene.add(copy.root);
    parts.current.copy = copy;
    return () => {
      scene.remove(copy.root);
      copy.dispose();
      glyph.shape();
      parts.current.copy = undefined;
    };
  }, [scene, typography, onError, size.width, size.height, fov, distance, cameraPitch, displayFont, detailFont]);

  useLayoutEffect(() => {
    traceStartup('Compiling ground scene', 0.95);
    let alive = true;
    // Compile the complete page before releasing the intro clock.
    // Skip effects torn down by StrictMode before starting asynchronous GPU work.
    Promise.resolve().then(() => alive ? (renderer as WebGPURenderer).compileAsync(scene, camera) : undefined).then(() => {
      if (alive) { traceStartup('Scene ready', 1); onReady(); }
    }).catch(error => { if (alive) onError(error); });
    return () => { alive = false; };
  }, [renderer, scene, camera, onReady, onError]);

  useFrame(state => {
    const p = playback.current;
    const s = live.current;
    if (p.ready && p.playing && !document.hidden) p.time = Math.min(animationDuration(s.breakDelay), p.time + Math.min(state.delta, 0.05));
    if (s.animate && !p.reduced && !document.hidden) {
      clock.current.atmosphere += Math.min(state.delta, 0.05);
      clock.current.flow += Math.min(state.delta, 0.05) * s.speed;
      invalidate();
    }
    updateCamera(state.delta);
    const t = choreographyTime(p.time, s.breakDelay);
    const { ground, title, copy, glass } = parts.current;
    const light = ease(t, impactTime, impactTime + 2.1);
    ground?.update(s, light);
    if (ground) ground.time.value = clock.current.flow;
    scene.environmentRotation.set(0, s.environmentRotation * Math.PI / 180, 0);
    if (glass) updateGlass(glass, s, clock.current.atmosphere);
    const cursor = readCursor();
    if (title?.update(t, s, state.delta, s.cursorCollider ? cursor.point : undefined, s.cursorCollider ? cursor.press : undefined)) invalidate();
    copy?.update(t, Math.min(1, p.time / animationDuration(s.breakDelay)), s);
    copy?.follow(camera as PerspectiveCamera, renderer.domElement);
    glyph.shape();
    if (p.ready) captureTransmissionBackdrop(renderer, scene, camera, state.elapsed);
  }, { priority: 1 });
  return null;
}
