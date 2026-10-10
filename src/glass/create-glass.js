// Adapted from Anderson Mancini's webgpu-glass-drei. See ../CREDITS.md.
import * as THREE from 'three/webgpu';
import { uniform } from 'three/tsl';
import { buildTransmissionBackdropNode } from './transmissionNodes';
import { getTransmissionBackdropTextureNode, registerTransmissionGlassMaterial, unregisterTransmissionGlassMaterial } from './transmissionBackdrop';
import TransmissionPhysicalLightingModel from './TransmissionPhysicalLightingModel';

class GlassPhysicalNodeMaterial extends THREE.MeshPhysicalNodeMaterial {
  setupLightingModel() {
    return new TransmissionPhysicalLightingModel(this.useClearcoat, this.useSheen, this.useIridescence, this.useAnisotropy, this.useTransmission, this.transmissionBackdropNode);
  }
}

/** All letters and shards share one material and one backdrop capture. */
export function createGlass(renderer, scene, camera) {
  const params = {
    ior: uniform(1.65), thickness: uniform(0.6), backsideThickness: uniform(0.13),
    anisotropicBlur: uniform(0.035), distortion: uniform(0.015), distortionScale: uniform(0.007),
    temporalDistortion: uniform(0), attenuationDistance: uniform(0),
    attenuationColor: uniform(new THREE.Color('#ffffff')), time: uniform(0),
  };
  const material = new GlassPhysicalNodeMaterial({
    color: '#eff4ff', roughness: 0.035, metalness: 0, ior: 1.65,
    transmission: 0, dispersion: 5, clearcoat: 1, clearcoatRoughness: 0.08,
    envMapIntensity: 2.4, side: THREE.FrontSide,
  });
  material.transmissionUniforms = params;
  material.transmissionNode = uniform(1);
  material.thicknessNode = params.thickness;
  material.iorNode = params.ior;
  material.transmissionBackdropNode = buildTransmissionBackdropNode(getTransmissionBackdropTextureNode(renderer), params, 4);
  material.transmissionBackdropConfig = {
    backside: false, thickness: 0.6, backdropResolutionScale: 0.75,
    background: '#0b0b10',
  };
  registerTransmissionGlassMaterial(material, scene, camera, renderer);
  return { material, dispose() { unregisterTransmissionGlassMaterial(material, renderer); material.dispose(); } };
}
