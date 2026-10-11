import { Color, Group, Mesh, MeshBasicNodeMaterial, PlaneGeometry, ShadowNodeMaterial } from 'three/webgpu';
import { color, float, mix, positionWorld, screenCoordinate, screenSize, smoothstep, uniform, vec2 } from 'three/tsl';
import { grainGradient } from '../grain-gradient';
import { gridPattern } from '../grid';
import type { GroundSettings } from './settings';

/**
 * The floor the glass stands on. It carries the grain gradient and grid in world space, fades into a flat
 * horizon, and catches shadows from the letters and shards.
 */
export function createGround(width: number, height: number, extent: number) {
  const root = new Group();
  const reveal = uniform(0), gridAlpha = uniform(0.2), cellSize = uniform(48), gridColor = uniform(new Color());
  const crosshairOpacity = uniform(1), crosshairSpacing = uniform(4), horizon = uniform(new Color()), base = new Color();
  const world = positionWorld.xz;
  // One unit per viewport height, with far ground at the top like the flat layout's gradient.
  const field = grainGradient(vec2(world.x, world.y.negate()).div(height), screenCoordinate.xy.div(screenSize).mul(vec2(width, height)).mul(0.7));
  // Calm the near ground where the copy sits.
  const calm = smoothstep(0.23, 0.55, world.y.negate().div(height).add(0.5)).mul(0.9).add(0.1);
  const colorField = mix(field.base, mix(field.base, field.gradient, field.mask), calm);
  const surface = mix(mix(color('#080a0e'), colorField.mul(0.065), float(0.7)), colorField, reveal);
  const reach = Math.max(width, height);
  const lines = gridPattern(world, cellSize, crosshairSpacing, crosshairOpacity).mul(smoothstep(reach, reach * 0.4, world.length())).mul(gridAlpha);
  const material = new MeshBasicNodeMaterial({ toneMapped: false });
  material.colorNode = mix(mix(surface, gridColor, lines), horizon, smoothstep(extent * 0.12, extent * 0.5, world.length()));
  const geometry = new PlaneGeometry(extent * 2, extent * 2);
  const floor = new Mesh(geometry, material);
  floor.rotation.x = -Math.PI / 2;
  const shadowMaterial = new ShadowNodeMaterial({ color: '#2c2620', transparent: true, opacity: 0.2, depthWrite: false });
  const shadows = new Mesh(geometry, shadowMaterial);
  shadows.rotation.x = -Math.PI / 2;
  shadows.position.y = 1;
  shadows.receiveShadow = true;
  shadows.renderOrder = 1;
  root.add(floor, shadows);
  return { root, time: field.time,
    /** The flat color the ground fades into, also used for the sky. */
    horizon: horizon.value,
    update(settings: GroundSettings, light: number) {
      field.update(settings);
      reveal.value = light;
      horizon.value.set('#0a0b0f').lerp(base.set(settings.baseColor), light);
      gridAlpha.value = settings.grid ? settings.gridOpacity * (0.45 + 0.55 * light) : 0;
      cellSize.value = settings.gridSize;
      gridColor.value.set(settings.gridColor);
      crosshairOpacity.value = settings.crosshairs ? 1 : 0;
      crosshairSpacing.value = settings.crosshairSpacing;
      shadowMaterial.opacity = settings.shadowOpacity * (0.35 + 0.65 * light);
    },
    dispose() { geometry.dispose(); material.dispose(); shadowMaterial.dispose(); },
  };
}
