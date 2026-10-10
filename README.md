# r3f v10 · Alpha 6

A WebGPU announcement portal. `<Canvas renderer />` fractures into `<Canvas />`, revealing the WebGPU-first release against a warm, grainy ivory background.

## Run

```sh
pnpm install
pnpm dev
```

Open the printed local URL in a WebGPU-capable browser. The scene uses the default v10 `<Canvas>` renderer and verifies that its backend is native WebGPU. There is no WebGL rendering fallback. An accessible static announcement remains available if the GPU cannot initialize.

```sh
pnpm build
pnpm test
pnpm preview
```

The build is a static Vite site in `dist/`. No API keys, remote fonts, or runtime asset services are needed.

## Rendering

- R3F `10.0.0-canary.87166dc`, pinned while Alpha 6 is being finalized.
- Glyph `0.1.0-canary-305e5ec9-20261010`, pinned for the public outline API.
- Every visible scene label uses Glyph's vector Slug renderer and TSL material. The hero uses the same Glyph layout and baked outline data, extruded into glass meshes.
- The word `renderer` is cut into deterministic 2D Voronoi cells, intersected with the actual letter contours and counters, then extruded. This is an original CPU geometry preparation step inspired by three-pinata, not its WebGL shaders. Motion is analytic gravity and angular velocity, with all drawing and materials using WebGPU/TSL.
- Anderson Mancini's transmission nodes, lighting model, and backdrop manager provide the glass. One material and one backdrop capture are shared across all letters and pieces. Studio cards are included only in the transmission capture to keep glass legible against the minimal background.
- The grain gradient is an original TSL field inspired by Paper Shaders. It uses pixel-locked grain rather than an image overlay.
- Drei's rounded-box geometry forms the Poimandres mark.

## Interaction and accessibility

The intro starts after fonts, geometry, and the scene's shaders are ready. Replay and pause controls sit at the top right. The bar below the links is a scrubber, including arrow, Page Up/Down, Home, and End keyboard support. Reduced-motion visitors begin at the final state. Completed and paused scenes render on demand. Semantic HTML and actual links accompany the canvas text for keyboard and screen-reader access.

## Editing

- `src/scene.tsx`: typography, layout, choreography, timing.
- `src/background.ts`: palette, grain, studio cards.
- `src/glass/create-glass.js`: refraction and glass parameters.
- `src/fracture.ts`: outline conversion and cell construction.
- `src/page.tsx`: URLs, semantic content, playback controls, GPU gate.
- `src/style.css`: interactive hit areas and fallback layout.

The final release number is announcement copy; the installed renderer is the pinned canary above. Docs and examples currently point to the public R3F introduction and examples pages. Update them if Alpha 6 gets dedicated destinations.

`pnpm test` checks that the actual Glyph outlines for `renderer` fracture into finite meshes without losing or filling letter area, including the holes in `e` and `d`.

See [source credits](src/CREDITS.md).
