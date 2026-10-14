import { Mesh, MeshBasicNodeMaterial, PlaneGeometry, type Vector3 } from 'three/webgpu';
import { abs, color, float, fract, mix, positionWorld, smoothstep, uniform, vec2 } from 'three/tsl';
import { TRANSMISSION_BACKDROP_LAYER, TRANSMISSION_BACKDROP_ONLY } from '../glass/transmissionBackdrop';

/**
 * Bold diagonal color bands with thin ink lines, drawn only into the glass backdrop. The floor stays calm
 * on screen while the glass refracts and disperses something with real contrast. The bands fade out toward
 * the edges so shards that wander off never show a border. `period` is the band width in world units.
 */
export function createGlassBackdrop(width: number, height: number, center: Vector3, period: number) {
  const time = uniform(0);
  const local = positionWorld.xz.sub(vec2(center.x, center.z));
  const u = local.x.add(local.y.mul(0.4)).div(period).add(time.mul(0.05));
  const wave = abs(fract(u).mul(2).sub(1));
  const bands = mix(mix(color('#ff5a2a'), color('#ff3d8b'), smoothstep(0, 0.5, wave)), color('#3a46ff'), smoothstep(0.5, 1, wave));
  const ink = float(1).sub(smoothstep(0, 0.07, abs(fract(u.mul(2)).sub(0.5))));
  const reach = local.div(vec2(width * 0.8, height * 0.8)).length();
  const material = new MeshBasicNodeMaterial({ toneMapped: false, transparent: true, depthWrite: false });
  material.colorNode = mix(bands, color('#140a1f'), ink.mul(0.85));
  material.opacityNode = float(1).sub(smoothstep(0.55, 1, reach));
  const geometry = new PlaneGeometry(width * 1.6, height * 1.6);
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(center.x, 2, center.z);
  mesh.layers.set(TRANSMISSION_BACKDROP_LAYER);
  mesh.userData[TRANSMISSION_BACKDROP_ONLY] = true;
  return { mesh, time, dispose() { geometry.dispose(); material.dispose(); } };
}
