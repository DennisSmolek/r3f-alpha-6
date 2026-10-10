import { useRef } from 'react';
import { Leva, button, folder, useControls } from 'leva';
import type { DisplayFont, DetailFont } from './typography';

export type SceneSettings = {
  displayFont: DisplayFont; detailFont: DetailFont; parallax: number;
  cameraMode: 'Pointer' | 'Orbit' | 'Fixed'; cameraYaw: number; cameraPitch: number; cameraZoom: number;
  pointerX: number; pointerY: number; cameraSmoothing: number; orbitSpeed: number;
  animate: boolean; speed: number; shape: number; scale: number;
  baseColor: string; color1: string; color2: string; color3: string;
  softness: number; intensity: number; grain: number;
  environment: 'Studio HDR' | 'Soft room'; environmentRotation: number;
  ior: number; thickness: number; reflections: number; roughness: number;
  dispersion: number; glassTint: string; distortion: number; backside: boolean;
  depth: number; bevel: number; tiltX: number; tiltY: number;
  rearText: boolean; rearTextColor: string; rearTextOpacity: number; rearTextScale: number;
  rearTextY: number; rearTextDepth: number;
  objects: boolean; objectColor: string; objectScale: number; objectSpeed: number;
  grid: boolean; gridColor: string; gridOpacity: number; gridSize: number; crosshairs: boolean; crosshairSpacing: number;
  breakDelay: number; fragmentCount: number; fractureSeed: number; explosion: number;
};

export type CameraPose = Pick<SceneSettings, 'cameraYaw' | 'cameraPitch' | 'cameraZoom'>;

export function useSceneSettings() {
  const actions = useRef({ export: () => {}, resetCamera: () => {} });
  const [values, set] = useControls(() => ({
    'Export settings': button(() => actions.current.export()),
    Camera: folder({
      cameraMode: { label: 'Control mode', value: 'Pointer', options: { 'Follow cursor': 'Pointer', 'Drag to orbit': 'Orbit', 'Fixed view': 'Fixed' } },
      cameraYaw: { label: 'Yaw', value: 0, min: -60, max: 60, step: 0.1 },
      cameraPitch: { label: 'Pitch', value: 0, min: -45, max: 45, step: 0.1 },
      cameraZoom: { label: 'Zoom', value: 1, min: 0.65, max: 1.8, step: 0.01 },
      parallax: { label: 'Cursor strength', value: 1, min: 0, max: 3, step: 0.05 },
      pointerX: { label: 'Horizontal °', value: 8, min: 0, max: 20, step: 0.5 },
      pointerY: { label: 'Vertical °', value: 5, min: 0, max: 15, step: 0.5 },
      cameraSmoothing: { label: 'Follow speed', value: 6, min: 1, max: 20, step: 0.5 },
      orbitSpeed: { label: 'Drag speed', value: 0.5, min: 0.1, max: 2, step: 0.05 },
      'Reset camera': button(() => actions.current.resetCamera()),
    }),
    Typography: folder({
      displayFont: { label: 'Display font', value: 'Space Grotesk', options: ['Space Grotesk', 'Syne', 'Geist', 'Manrope', 'Outfit', 'Bodoni Moda', 'Azeret Mono', 'Chakra Petch', 'Unbounded', 'Space Mono', 'Oxanium'] },
      detailFont: { label: 'Small labels', value: 'IBM Plex Mono', options: ['IBM Plex Mono', 'Geist'] },
    }, { collapsed: true }),
    Background: folder({
      animate: { label: 'Animate scene', value: true },
      speed: { label: 'Flow speed', value: 0.55, min: 0, max: 2, step: 0.05 },
      shape: { label: 'Shape', value: 1, options: { Wave: 1, Ripple: 2, Blob: 3 } },
      scale: { label: 'Scale', value: 1.8, min: 0.3, max: 5, step: 0.05 },
      baseColor: { label: 'Base', value: '#eeede8' },
      color1: { label: 'Color 1', value: '#95aab4' },
      color2: { label: 'Orange / heading', value: '#d6a586' },
      color3: { label: 'Color 3', value: '#fff8e8' },
      softness: { label: 'Softness', value: 0.65, min: 0, max: 1, step: 0.01 },
      intensity: { label: 'Grain distortion', value: 0.22, min: 0, max: 1, step: 0.01 },
      grain: { label: 'Grain', value: 0.13, min: 0, max: 0.6, step: 0.01 },
    }, { collapsed: true }),
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
    Ground: folder({
      grid: { label: 'Show grid', value: true },
      gridColor: { label: 'Grid color', value: '#63727a' },
      gridOpacity: { label: 'Grid opacity', value: 0.2, min: 0, max: 0.7, step: 0.01 },
      gridSize: { label: 'Cell size', value: 48, min: 20, max: 100, step: 2 },
      crosshairs: { label: 'Crosshairs', value: true },
      crosshairSpacing: { label: 'Every N cells', value: 4, min: 2, max: 8, step: 1 },
    }, { collapsed: true }),
    'Glass & lighting': folder({
      environment: { label: 'Environment', value: 'Studio HDR', options: ['Studio HDR', 'Soft room'] },
      environmentRotation: { label: 'HDR rotation', value: 35, min: 0, max: 360, step: 1 },
      reflections: { label: 'Reflections', value: 1.3, min: 0, max: 4, step: 0.05 },
      ior: { label: 'Refraction', value: 1.4, min: 1.05, max: 2.4, step: 0.01 },
      thickness: { label: 'Optical depth', value: 1.4, min: 0.1, max: 4, step: 0.05 },
      roughness: { label: 'Roughness', value: 0.025, min: 0, max: 0.3, step: 0.005 },
      dispersion: { label: 'Dispersion', value: 6, min: 0, max: 16, step: 0.1 },
      glassTint: { label: 'Glass tint', value: '#ffffff' },
      distortion: { label: 'Distortion', value: 0.04, min: 0, max: 0.5, step: 0.01 },
      backside: { label: 'Back-face pass', value: true },
      depth: { label: 'Extrusion', value: 0.22, min: 0.05, max: 0.5, step: 0.01 },
      bevel: { label: 'Bevel', value: 0.012, min: 0.002, max: 0.035, step: 0.001 },
      tiltX: { label: 'Tilt X', value: 8, min: -25, max: 25, step: 1 },
      tiltY: { label: 'Tilt Y', value: -12, min: -25, max: 25, step: 1 },
    }, { collapsed: true }),
    Fracture: folder({
      breakDelay: { label: 'Break delay (s)', value: 0.7, min: 0, max: 4, step: 0.1 },
      fragmentCount: { label: 'Cell count', value: 48, min: 20, max: 90, step: 1 },
      fractureSeed: { label: 'Pattern seed', value: 177, min: 1, max: 999, step: 1 },
      explosion: { label: 'Impulse', value: 1, min: 0.3, max: 2, step: 0.05 },
    }, { collapsed: true }),
  }), []);
  const settings = values as SceneSettings;
  actions.current.export = () => {
    const data = JSON.stringify({ version: 1, settings }, null, 2) + '\n';
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'r3f-alpha-6-settings.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  actions.current.resetCamera = () => set({ cameraMode: 'Pointer', cameraYaw: 0, cameraPitch: 0, cameraZoom: 1, parallax: 1, pointerX: 8, pointerY: 5, cameraSmoothing: 6, orbitSpeed: 0.5 });
  return { settings, setCameraPose: (pose: CameraPose) => set(pose) };
}

export function DesignControls({ open }: { open: boolean }) {
  return <aside id="design-controls" className="design-controls" hidden={!open} data-design-controls aria-label="Design controls">
    <Leva hidden={!open} fill collapsed={false} titleBar={{ title: <span style={{ color: '#e7e8ef' }}>Type & scene</span>, drag: false, filter: false }} hideCopyButton
      theme={{ colors: { accent1: '#af482c', accent2: '#ed633d', accent3: '#f48b6e' }, sizes: { rootWidth: '320px', controlWidth: '150px' } }} />
  </aside>;
}
