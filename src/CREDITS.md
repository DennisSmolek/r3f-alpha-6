# Source credits

- [React Three Fiber](https://github.com/pmndrs/react-three-fiber), Poimandres, MIT.
- [Drei](https://github.com/pmndrs/drei), Poimandres, MIT.
- [Glyph](https://github.com/pmndrs/glyph), Justin Walsh and contributors, MIT. Used for Slug typography, shaping, metrics, and hero outlines.
- [WebGPU Glass](https://github.com/ektogamat/webgpu-glass-drei), Anderson Mancini. `glass/transmissionNodes.js`, `glass/TransmissionPhysicalLightingModel.js`, and `glass/transmissionBackdrop.js` originate in that repository. `glass/create-glass.js` adapts its material setup for one shared scene material. The backdrop manager additionally releases its render targets when its last material is removed. No license file was present in the referenced upstream repository at retrieval.
- [three-pinata](https://github.com/dgreenheck/three-pinata), David Greenheck. Fracture reference only. No source copied. The local implementation constructs 2D Voronoi cells and clips Glyph contours with polygon-clipping.
- [polygon-clipping](https://github.com/mfogel/polygon-clipping), MIT, used to retain letter holes and disconnected fragments.
- [Paper grain gradient](https://shaders.paper.design/grain-gradient), visual inspiration. The local TSL shader is original.
- Geist, Vercel, SIL Open Font License. The bundled font assets were baked from Geist Bold and Regular. The license is in `assets/OFL.txt`.
- Poimandres logo reference: `pmndrs/react-three-fiber` example asset, copied from the user's existing local checkout. The in-scene mark reconstructs its four-part silhouette.

The demo library supplied by the user was the starting reference for the WebGPU and typography approach. This project is independent of that library.
