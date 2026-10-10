import { Mesh, MeshBasicNodeMaterial, PlaneGeometry } from 'three/webgpu';
import { color, float, mix, mx_noise_float, screenCoordinate, sin, smoothstep, uniform, uv, vec2, vec3 } from 'three/tsl';

/** Pixel-locked grain and slow color fields, rendered entirely with TSL. */
export function createBackground(width: number, height: number) {
  const reveal = uniform(0), time = uniform(0);
  const p = uv();
  const warp = mx_noise_float(vec3(p.mul(2.4), time.mul(0.035))).mul(0.14);
  const field = p.sub(vec2(0.28, 0.47)).mul(vec2(width / height, 1)).length();
  const glow = smoothstep(0.85, 0.05, field.add(warp));
  const noise = mx_noise_float(vec3(screenCoordinate.xy.mul(0.65), 0)).mul(0.042);
  const warm = smoothstep(0.1, 0.9, p.x.add(p.y.mul(0.32)).add(warp));
  const dark = mix(color('#090a0e'), color('#5b4440'), glow.mul(0.24));
  const light = mix(color('#f3f1e9'), color('#e9ded2'), warm.mul(0.5));
  const coral = smoothstep(0.72, 0.02, p.sub(vec2(0.04, 0.5)).length()).mul(0.24);
  const blue = smoothstep(0.7, 0.04, p.sub(vec2(0.88, 0.72)).length()).mul(0.22);
  const final = mix(mix(light, color('#dba283'), coral.mul(1.5)), color('#a8b5ca'), blue);
  const material = new MeshBasicNodeMaterial({ depthWrite: false, depthTest: false, toneMapped: false });
  material.colorNode = mix(dark, final, reveal).add(noise.mul(mix(float(0.16), float(1), reveal)));
  const mesh = new Mesh(new PlaneGeometry(width, height), material);
  mesh.position.z = -450;
  mesh.renderOrder = -100;
  // Studio cards are captured only in transmission, like off-camera light cards in product photography.
  const studioMaterial = new MeshBasicNodeMaterial({ depthWrite: false, toneMapped: false });
  const wave = p.y.add(sin(p.x.mul(8).add(0.4)).mul(0.014));
  const stripe = smoothstep(0.586, 0.612, wave).sub(smoothstep(0.645, 0.67, wave));
  const opticalColor = mix(color('#e7e9e5'), color('#303c4b'), stripe.mul(0.70));
  studioMaterial.colorNode = mix(opticalColor.mul(0.58), opticalColor, reveal);
  const studio = new Mesh(new PlaneGeometry(width, height), studioMaterial);
  studio.position.z = -300;
  studio.visible = false;
  studio.userData.transmissionBackdropOnly = true;
  return { mesh, studio, reveal, time, dispose() { mesh.geometry.dispose(); material.dispose(); studio.geometry.dispose(); studioMaterial.dispose(); } };
}
