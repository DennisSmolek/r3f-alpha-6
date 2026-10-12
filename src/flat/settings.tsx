import { useRef } from 'react';
import { button, folder, useControls } from 'leva';
import { backgroundControls, cameraControls, exportSettings, fractureControls, glassControls, gridControls, typographyControls } from '../controls';
import type { BackgroundSettings, CameraSettings, FractureSettings, GlassSettings, GridSettings, TypographySettings } from '../controls';

export type SceneSettings = CameraSettings & TypographySettings & BackgroundSettings & GridSettings & GlassSettings & FractureSettings & {
  tiltX: number; tiltY: number;
  rearText: boolean; rearTextColor: string; rearTextOpacity: number; rearTextScale: number;
  rearTextY: number; rearTextDepth: number;
  objects: boolean; objectColor: string; objectScale: number; objectSpeed: number;
};

export type CameraPose = Pick<SceneSettings, 'cameraYaw' | 'cameraPitch' | 'cameraZoom'>;

export function useSceneSettings() {
  const actions = useRef({ export: () => {}, resetCamera: () => {} });
  const camera: CameraSettings = { cameraMode: 'Pointer', cameraYaw: 0, cameraPitch: 0, cameraZoom: 1, parallax: 1, pointerX: 8, pointerY: 5, cameraSmoothing: 6, orbitSpeed: 0.5 };
  const [values, set] = useControls(() => ({
    'Export settings': button(() => actions.current.export()),
    'Open ground layout': button(() => { location.href = './'; }),
    Camera: folder(cameraControls(camera, [-45, 45], () => actions.current.resetCamera())),
    Typography: folder(typographyControls(), { collapsed: true }),
    Background: folder(backgroundControls(), { collapsed: true }),
    'Behind the glass': folder({
      rearText: { label: 'R3F V10', value: false },
      rearTextColor: { label: 'Text color', value: '#333e45' },
      rearTextOpacity: { label: 'Text opacity', value: 0.65, min: 0, max: 1, step: 0.01 },
      rearTextScale: { label: 'Text scale', value: 0.85, min: 0.4, max: 2, step: 0.05 },
      rearTextY: { label: 'Text height', value: 0.045, min: -0.15, max: 0.2, step: 0.005 },
      rearTextDepth: { label: 'Text depth', value: -80, min: -300, max: 180, step: 5 },
      objects: { label: 'Metal in glass', value: true },
      objectColor: { label: 'Metal tint', value: '#c4b8a9' },
      objectScale: { label: 'Shape scale', value: 0.75, min: 0.3, max: 2, step: 0.05 },
      objectSpeed: { label: 'Orbit speed', value: 0.3, min: 0, max: 1.5, step: 0.05 },
    }, { collapsed: true }),
    Ground: folder(gridControls(), { collapsed: true }),
    'Glass & lighting': folder({
      ...glassControls(),
      tiltX: { label: 'Tilt X', value: 8, min: -25, max: 25, step: 1 },
      tiltY: { label: 'Tilt Y', value: -12, min: -25, max: 25, step: 1 },
    }, { collapsed: true }),
    Fracture: folder(fractureControls(), { collapsed: true }),
  }), []);
  const settings = values as SceneSettings;
  actions.current.export = () => exportSettings(settings, 'r3f-alpha-6-flat-settings.json');
  actions.current.resetCamera = () => set(camera);
  return { settings, setCameraPose: (pose: CameraPose) => set(pose) };
}
