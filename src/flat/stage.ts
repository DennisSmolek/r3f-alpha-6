import { Color, DoubleSide, Group, Mesh, MeshBasicNodeMaterial, MeshPhysicalNodeMaterial, PlaneGeometry, SphereGeometry, TorusGeometry } from 'three/webgpu';
import { smoothstep, uniform, uv } from 'three/tsl';
import { defineTextMaterial } from '@pmndrs/glyph/three';
import { gridPattern } from '../grid';
import { TRANSMISSION_BACKDROP_LAYER } from '../glass/transmissionBackdrop';
import type { Typography } from '../typography';
import type { SceneSettings } from './settings';

/** Layered text and grid with metal geometry reserved for the refraction pass. */
export function createStage(width: number, height: number, typography: Typography) {
  const root = new Group();
  const textColor = uniform(new Color()), textOpacity = uniform(0.65);
  let rearMaterial: MeshBasicNodeMaterial | undefined;
  const textMaterial = defineTextMaterial(context => {
    const material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, depthTest: true, toneMapped: false, side: DoubleSide });
    rearMaterial = material;
    material.positionNode = context.position;
    material.colorNode = textColor;
    material.opacityNode = context.shader.opacity.mul(textOpacity);
    return material;
  });
  const text = typography.handle.createText({ font: typography.thin!, text: 'R3F V10', style: { fontSize: Math.min(width * 0.18, 225) }, material: textMaterial });
  const metrics = text.glyphs(), bounds = metrics.inkBounds!;
  const textGroup = new Group();
  text.position.set(-metrics.width / 2, bounds.y + bounds.height / 2, 0);
  textGroup.add(text); root.add(textGroup);
  const gridAlpha = uniform(0.2), cellSize = uniform(48), gridColor = uniform(new Color());
  const crosshairOpacity = uniform(1), crosshairSpacing = uniform(4);
  const gridMaterial = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: DoubleSide, toneMapped: false });
  const planeSize = Math.max(width, height) * 1.4;
  const axes = smoothstep(0.9, 0.5, uv().sub(0.5).length().mul(2));
  gridMaterial.colorNode = gridColor;
  gridMaterial.opacityNode = gridPattern(uv().sub(0.5).mul(planeSize), cellSize, crosshairSpacing, crosshairOpacity).mul(axes).mul(gridAlpha);
  const grid = new Mesh(new PlaneGeometry(planeSize, planeSize), gridMaterial);
  grid.position.set(0, height * 0.13 - Math.min(width * 0.08, 105), -140);
  root.add(grid);
  const metal = new MeshPhysicalNodeMaterial({ metalness: 1, roughness: 0.17, color: '#c4b8a9', clearcoat: 0.6 });
  const enamel = new MeshPhysicalNodeMaterial({ metalness: 0.35, roughness: 0.15, color: '#849cad', clearcoat: 1 });
  const radius = Math.min(width * 0.1, 135);
  const ring = new Mesh(new TorusGeometry(radius, radius * 0.15, 24, 96), metal);
  const sphere = new Mesh(new SphereGeometry(radius * 0.5, 32, 24), enamel);
  ring.layers.set(TRANSMISSION_BACKDROP_LAYER);
  sphere.layers.set(TRANSMISSION_BACKDROP_LAYER);
  root.add(ring, sphere);
  return { root,
    update(settings: SceneSettings, time: number, reveal: number) {
      textGroup.visible = settings.rearText;
      textGroup.scale.setScalar(settings.rearTextScale);
      textGroup.position.set(0, height * (0.13 + settings.rearTextY), settings.rearTextDepth);
      textColor.value.set(settings.rearTextColor);
      textOpacity.value = settings.rearTextOpacity * reveal;
      grid.visible = settings.grid;
      gridAlpha.value = settings.gridOpacity * reveal;
      crosshairOpacity.value = settings.crosshairs ? 1 : 0;
      crosshairSpacing.value = settings.crosshairSpacing;
      gridColor.value.set(settings.gridColor); cellSize.value = settings.gridSize;
      ring.visible = sphere.visible = settings.objects;
      metal.color.set(settings.objectColor);
      enamel.color.set(settings.color1);
      const phase = time * settings.objectSpeed;
      ring.position.set(width * 0.23 + Math.sin(phase * 0.7) * radius * 0.35, height * 0.13 + Math.cos(phase) * radius * 0.18, -180);
      ring.rotation.set(0.35 + phase * 0.35, 0.55 + Math.sin(phase) * 0.55, phase * 0.15);
      sphere.position.set(-width * 0.22 + Math.cos(phase * 0.8) * radius * 0.3, height * 0.13 - radius * 0.2 + Math.sin(phase) * radius * 0.4, -210);
      ring.scale.setScalar(settings.objectScale); sphere.scale.setScalar(settings.objectScale);
      metal.envMapIntensity = enamel.envMapIntensity = settings.reflections;
    },
    dispose() {
      text.dispose(); rearMaterial?.dispose();
      grid.geometry.dispose(); gridMaterial.dispose();
      ring.geometry.dispose(); sphere.geometry.dispose(); metal.dispose(); enamel.dispose();
    },
  };
}
