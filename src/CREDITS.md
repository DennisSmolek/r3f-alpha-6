# Source credits

- [React Three Fiber](https://github.com/pmndrs/react-three-fiber), Poimandres, MIT.
- [Glyph](https://github.com/pmndrs/glyph), Justin Walsh and contributors, MIT. Used for Slug typography, shaping, metrics, and hero outlines.
- [WebGPU Glass](https://github.com/ektogamat/webgpu-glass-drei), Anderson Mancini. `glass/transmissionNodes.js`, `glass/TransmissionPhysicalLightingModel.js`, and `glass/transmissionBackdrop.js` originate in that repository. `glass/create-glass.js` adapts its material setup for one shared scene material. The backdrop manager additionally releases its render targets when its last material is removed. No license file was present in the referenced upstream repository at retrieval.
- [three-pinata](https://github.com/dgreenheck/three-pinata), David Greenheck. Fracture reference only. No source copied. The local implementation constructs 2D Voronoi cells and clips Glyph contours with polygon-clipping.
- [polygon-clipping](https://github.com/mfogel/polygon-clipping), MIT, used to retain letter holes and disconnected fragments.
- [Paper grain gradient](https://github.com/paper-design/shaders/blob/main/packages/shaders/src/shaders/grain-gradient.ts), Paper Design, Apache-2.0. `background.ts` is a modified TSL adaptation of its wave/ripple/blob shapes, grain distortion, and color-band mixing. Texture-based randomization and GLSL simplex noise are replaced with procedural TSL noise. Paper's license and NOTICE are distributed in `public/licenses/` and the production build.
- [Studio Small 09](https://polyhaven.com/a/studio_small_09), Sergej Majboroda / Poly Haven, CC0. The bundled 1K HDR is the same studio environment used by Anderson's reference.
- [Raleway](https://github.com/google/fonts/tree/main/ofl/raleway), SIL Open Font License. Weight 200 baked to Glyph for the rear text. License in `assets/Raleway-OFL.txt`.
- [1975 glass reference](https://codesandbox.io/p/sandbox/1975-glas-refraction-forked-zdpqx7), visual and bevel-setting reference. No GLSL material code is copied into this WebGPU project.
- [Space Grotesk](https://github.com/google/fonts/tree/main/ofl/spacegrotesk), Florian Karsten, SIL Open Font License. Bundled at weight 600 with Glyph outlines. License: `assets/SpaceGrotesk-OFL.txt`.
- [Syne](https://github.com/google/fonts/tree/main/ofl/syne), Bonjour Monde and contributors, SIL Open Font License. Bundled at weight 600 with Glyph outlines. License: `assets/Syne-OFL.txt`.
- [IBM Plex Mono](https://github.com/google/fonts/tree/main/ofl/ibmplexmono), IBM, SIL Open Font License. Bundled Regular as a Glyph Slug font. License: `assets/IBMPlexMono-OFL.txt`.
- [Leva](https://github.com/pmndrs/leva), Poimandres, MIT. Live art direction controls.
- Geist, Vercel, SIL Open Font License. The bundled font assets were baked from Geist Bold and Regular. The license is in `assets/OFL.txt`.
- Poimandres logo reference: `pmndrs/react-three-fiber` example asset, copied from the user's existing local checkout. An inline SVG reconstructs its four-part silhouette.

The demo library supplied by the user was the starting reference for the WebGPU and typography approach. This project is independent of that library.

- [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope), SIL Open Font License. Weight 600 baked with Glyph outlines. License: `assets/Manrope-OFL.txt`.
- [Outfit](https://github.com/google/fonts/tree/main/ofl/outfit), SIL Open Font License. Weight 500 baked with Glyph outlines. License: `assets/Outfit-OFL.txt`.
- [Bodoni Moda](https://github.com/google/fonts/tree/main/ofl/bodonimoda), SIL Open Font License. Weight 600 and optical size 48 baked with Glyph outlines. License: `assets/BodoniModa-OFL.txt`.

- [Azeret Mono](https://github.com/google/fonts/tree/main/ofl/azeretmono), SIL Open Font License. Weight 600 baked with Glyph outlines. License: `assets/AzeretMono-OFL.txt` and `public/licenses/AzeretMono-OFL.txt`.

- [Chakra Petch](https://github.com/google/fonts/tree/main/ofl/chakrapetch), SIL Open Font License. Weight 600 baked with Glyph outlines. License: `assets/ChakraPetch-OFL.txt` and `public/licenses/ChakraPetch-OFL.txt`.

- [Unbounded](https://github.com/google/fonts/tree/main/ofl/unbounded), SIL Open Font License. Weight 500 baked with Glyph outlines. License: `assets/Unbounded-OFL.txt` and `public/licenses/Unbounded-OFL.txt`.

- [Space Mono](https://github.com/google/fonts/tree/main/ofl/spacemono), SIL Open Font License. Weight 700 baked with Glyph outlines. License: `assets/SpaceMono-OFL.txt` and `public/licenses/SpaceMono-OFL.txt`.

- [Oxanium](https://github.com/google/fonts/tree/main/ofl/oxanium), SIL Open Font License. Weight 600 baked with Glyph outlines. License: `assets/Oxanium-OFL.txt` and `public/licenses/Oxanium-OFL.txt`.

- [JetBrains Mono](https://github.com/google/fonts/tree/main/ofl/jetbrainsmono), SIL Open Font License. Weight 600 baked with Glyph outlines. License: `assets/JetBrainsMono-OFL.txt` and `public/licenses/JetBrainsMono-OFL.txt`.
