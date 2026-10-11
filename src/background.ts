import { Mesh, MeshBasicNodeMaterial, PlaneGeometry } from 'three/webgpu';
import { color, float, mix, positionGeometry, screenCoordinate, screenSize, smoothstep, uniform, uv, vec2, vec4 } from 'three/tsl';
import { grainGradient } from './grain-gradient';

/** Full-screen grain gradient that fades up from the dark intro. */
export function createBackground(width: number, height: number) {
  const reveal = uniform(0);
  const field = grainGradient(uv().sub(0.5).mul(vec2(width / height, 1)), screenCoordinate.xy.div(screenSize).mul(vec2(width, height)).mul(0.7));
  // Let the stage carry the pattern while preserving the announcement's reading area.
  const colorField = mix(field.base, mix(field.base, field.gradient, field.mask), smoothstep(0.23, 0.55, uv().y).mul(0.9).add(0.1));
  const dark = mix(color('#080a0e'), colorField.mul(0.065), float(0.7));
  const material = new MeshBasicNodeMaterial({ depthWrite: false, depthTest: false, toneMapped: false });
  material.colorNode = mix(dark, colorField, reveal);
  material.vertexNode = vec4(positionGeometry.xy, 1, 1);
  const mesh = new Mesh(new PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.position.z = -700;
  mesh.renderOrder = -100;
  return { mesh, reveal, time: field.time, update: field.update,
    dispose() { mesh.geometry.dispose(); material.dispose(); },
  };
}
