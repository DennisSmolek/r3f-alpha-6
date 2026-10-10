import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import studioUrl from './assets/studio_small_09_1k.hdr?url';

/** Bundled Poly Haven studio used by Anderson's glass demo. */
export const studioReady = new HDRLoader().loadAsync(studioUrl);
