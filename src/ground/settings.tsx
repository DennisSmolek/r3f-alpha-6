import { useRef } from 'react';
import { button, folder, useControls } from 'leva';
import { backgroundControls, cameraControls, exportSettings, fractureControls, glassControls, gridControls, typographyControls } from '../controls';
import type { BackgroundSettings, CameraSettings, FractureSettings, GlassSettings, GridSettings, TypographySettings } from '../controls';

export type GroundSettings = CameraSettings & TypographySettings & BackgroundSettings & GridSettings & GlassSettings & FractureSettings & {
  shadowOpacity: number; copyStretch: number; footerOnGround: boolean;
  windup: number; gravity: number; bounce: number; friction: number; shardCollisions: boolean; cursorCollider: boolean; cursorSize: number;
};

export function useGroundSettings() {
  const actions = useRef({ export: () => {}, resetCamera: () => {} });
  const camera: CameraSettings = { cameraMode: 'Pointer', cameraYaw: 0, cameraPitch: 30, cameraZoom: 1, parallax: 1, pointerX: 8, pointerY: 5, cameraSmoothing: 6, orbitSpeed: 0.5 };
  const [values, set] = useControls(() => ({
    'Export settings': button(() => actions.current.export()),
    'Open flat layout': button(() => { location.href = 'flat.html'; }),
    Camera: folder(cameraControls(camera, [14, 70], () => actions.current.resetCamera())),
    Typography: folder(typographyControls(), { collapsed: true }),
    Ground: folder({
      ...backgroundControls(),
      ...gridControls(),
      shadowOpacity: { label: 'Shadow', value: 0.5, min: 0, max: 1, step: 0.01 },
      copyStretch: { label: 'Copy stretch', value: 0.35, min: 0, max: 1, step: 0.01 },
      footerOnGround: { label: 'Footer on ground', value: true },
    }, { collapsed: true }),
    'Glass & lighting': folder(glassControls(), { collapsed: true }),
    'Strike & shards': folder({
      ...fractureControls(),
      windup: { label: 'Wind-up (em)', value: 1.1, min: 0.3, max: 2.5, step: 0.05 },
      gravity: { label: 'Gravity', value: 9, min: 2, max: 25, step: 0.5 },
      bounce: { label: 'Bounce', value: 0.25, min: 0, max: 0.8, step: 0.01 },
      friction: { label: 'Friction', value: 0.6, min: 0, max: 1.5, step: 0.05 },
      shardCollisions: { label: 'Shard spheres', value: true },
      cursorCollider: { label: 'Cursor collider', value: true },
      cursorSize: { label: 'Cursor size (em)', value: 0.3, min: 0.1, max: 1, step: 0.05 },
    }, { collapsed: true }),
  }), []);
  const settings = values as GroundSettings;
  actions.current.export = () => exportSettings(settings, 'r3f-alpha-6-settings.json');
  actions.current.resetCamera = () => set(camera);
  return { settings, setCameraPose: (pose: Pick<CameraSettings, 'cameraYaw' | 'cameraPitch' | 'cameraZoom'>) => set(pose) };
}
