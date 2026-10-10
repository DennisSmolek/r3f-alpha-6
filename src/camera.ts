import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { MathUtils, Vector2 } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CameraPose, SceneSettings } from './settings';
import type { Playback } from './scene';

/** Keep pointer animation separate from the saved camera pose. */
export function useCameraRig(settings: SceneSettings, playback: React.RefObject<Playback>, onPose: (pose: CameraPose) => void) {
  const { camera, renderer, invalidate } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  const pointer = useRef(new Vector2());
  const offset = useRef(new Vector2());
  const live = useRef({ settings, onPose });
  live.current = { settings, onPose };

  useEffect(() => {
    const orbit = new OrbitControls(camera, renderer.domElement);
    controls.current = orbit;
    orbit.enablePan = false;
    orbit.enableDamping = false;
    orbit.minAzimuthAngle = MathUtils.degToRad(-60);
    orbit.maxAzimuthAngle = MathUtils.degToRad(60);
    orbit.minPolarAngle = MathUtils.degToRad(45);
    orbit.maxPolarAngle = MathUtils.degToRad(135);
    orbit.minZoom = 0.65;
    orbit.maxZoom = 1.8;
    const save = () => live.current.onPose({
      cameraYaw: MathUtils.radToDeg(orbit.getAzimuthalAngle()),
      cameraPitch: 90 - MathUtils.radToDeg(orbit.getPolarAngle()),
      cameraZoom: camera.zoom,
    });
    const change = () => invalidate();
    orbit.addEventListener('change', change);
    orbit.addEventListener('end', save);
    const reset = () => { pointer.current.set(0, 0); invalidate(); };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || playback.current.reduced || live.current.settings.cameraMode !== 'Pointer') return;
      if (event.target instanceof Element && event.target.closest('[data-design-controls]')) { reset(); return; }
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.current.set(
        MathUtils.clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1),
        MathUtils.clamp(1 - (event.clientY - bounds.top) / bounds.height * 2, -1, 1),
      );
      invalidate();
    };
    window.addEventListener('pointermove', move, { passive: true });
    renderer.domElement.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    return () => {
      orbit.removeEventListener('change', change);
      orbit.removeEventListener('end', save);
      orbit.dispose();
      controls.current = null;
      window.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset);
      renderer.domElement.style.cursor = '';
    };
  }, [camera, renderer, invalidate, playback]);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    orbit.enabled = settings.cameraMode === 'Orbit';
    orbit.rotateSpeed = settings.orbitSpeed;
    renderer.domElement.style.cursor = orbit.enabled ? 'grab' : '';
    renderer.domElement.style.touchAction = orbit.enabled ? 'none' : 'auto';
    offset.current.set(0, 0);
    pointer.current.set(0, 0);
    camera.position.setFromSphericalCoords(1000, MathUtils.degToRad(90 - settings.cameraPitch), MathUtils.degToRad(settings.cameraYaw));
    camera.zoom = settings.cameraZoom;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
    orbit.update();
    invalidate();
  }, [camera, renderer, invalidate, settings.cameraMode, settings.cameraYaw, settings.cameraPitch, settings.cameraZoom, settings.orbitSpeed]);

  return (delta: number) => {
    const s = live.current.settings;
    if (s.cameraMode !== 'Orbit') {
      const strength = s.cameraMode === 'Pointer' && !playback.current.reduced ? s.parallax : 0;
      const blend = 1 - Math.exp(-s.cameraSmoothing * Math.min(delta, 0.05));
      offset.current.x = MathUtils.lerp(offset.current.x, pointer.current.x * s.pointerX * strength, blend);
      offset.current.y = MathUtils.lerp(offset.current.y, pointer.current.y * s.pointerY * strength, blend);
      camera.position.setFromSphericalCoords(1000,
        MathUtils.degToRad(90 - MathUtils.clamp(s.cameraPitch + offset.current.y, -75, 75)),
        MathUtils.degToRad(MathUtils.clamp(s.cameraYaw + offset.current.x, -80, 80)));
      camera.lookAt(0, 0, 0);
    }
    camera.updateMatrixWorld();
  };
}
