# r3f v10 · Alpha 6

A WebGPU announcement portal. `<Canvas renderer />` fractures into `<Canvas />`, revealing the WebGPU-first release against a warm, grainy ivory background.

[Live demo](https://DennisSmolek.github.io/r3f-alpha-6/) · [Issues and feedback](https://github.com/DennisSmolek/r3f-alpha-6/issues)

This is a work in progress while Alpha 6 is being finalized. Feedback and contributions are welcome, especially around glass rendering, typography, animation, and WebGPU device compatibility.

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
- The word `renderer` is cut by a single deterministic, impact-clustered 2D Voronoi field across all letters, intersected with the actual letter contours and counters, then extruded. This is an original CPU geometry preparation step inspired by three-pinata, not its WebGL shaders. Motion is analytic gravity and angular velocity, with all drawing and materials using WebGPU/TSL.
- Anderson Mancini's transmission nodes, lighting model, and backdrop manager provide the glass. One material and one shared backdrop manager are shared across all letters and pieces. The glass uses smooth eight-segment bevels, 32-segment outline curves, front/back refraction passes, and a bundled Poly Haven studio HDR. It refracts the actual gradient, grid, rear Glyph text, and orbiting metal geometry. The metal geometry lives on the transmission capture layer and is hidden from the main camera.
- The grain gradient is a TSL adaptation of Paper Shaders wave, ripple, and blob modes. Grain distorts the gradient bands instead of being a uniform overlay. Procedural TSL noise replaces the original texture randomizer and simplex noise, so it is not a pixel-identical GLSL port. Attribution and Apache license notices ship in the build.
- The flat Poimandres mark is an inline SVG, with no 3D geometry or extra rendering dependency.

## Ground layout

The main page (`index.html`) sets the announcement on a floor. The gradient and grid become a ground plane seen from above, and the glass `<Canvas renderer />` stands on it. The Breaking Changes heading stays upright on the screen. The rest of the copy, the Poimandres mark, and the progress bar are printed flat on the floor at the same screen positions as the flat page.

- On narrow screens the title starts at the width of `<Canvas renderer />` and grows to fit `<Canvas />` after the strike, so the final word fills the phone. A tap pops nearby shards.

- `/>` winds up like a spring, leaning and compressing, then flings left. The word shatters at the moment it touches `renderer`. It keeps half its speed, springs into its slot, and `<Canvas` glides over to meet it.
- Shards fall under a small custom rigid-body simulation. Convex hull points resolve contact with the ground and the standing letters, so pieces settle flat and get pushed aside by the moving tag. Spheres keep the shards from passing through each other. The simulation is baked when the scene builds, so replay, scrubbing, and reduced motion stay exact.
- After the intro the shards switch to a live simulation. An invisible sphere under the cursor sweeps them along the floor and a click pops nearby shards into the air. Replaying or scrubbing returns to the baked motion.
- A key light casts soft shadows from the glass onto the floor. The glass casts through shadow-only stand-ins on their own layer, because the glass backdrop pass renders first each frame with the glass hidden.
- **Strike & shards** in the panel controls the wind-up distance, gravity, bounce, friction, the shard spheres, and the cursor collider and its size. **Ground** adds shadow strength, a road-marking stretch for distant copy, and whether the footer credits lie on the floor or stay on the screen.

## Flat layout

`flat.html` keeps the original take, with the title floating over parallax layers of gradient, grid, rear text, and metal objects. Its code lives in `src/flat/`.

## Interaction and accessibility

The intro starts after fonts, geometry, and the scene's shaders are ready. Replay and pause controls sit at the top right. The bar below the links is a scrubber, including arrow, Page Up/Down, Home, and End keyboard support. Reduced-motion visitors begin at the final state. A damped pointer orbit moves the hero, announcement, and utility text at slightly different depths. Its default range is 8° horizontally and 5° vertically. It is disabled for reduced motion and touch input. The background and stage have a separate animation clock and continue after the intro. Turn off Animate scene and select Fixed view or Drag to orbit to render on demand after the intro. Reduced motion freezes ambient animation as well as parallax. Semantic HTML and actual links accompany the canvas text for keyboard and screen-reader access. Each link's hit area is projected from its scene text every frame, so it stays over the text through parallax, perspective, and the footer toggle.

## Editing

- `src/ground/`: the main page. `choreography.ts` (timing and the `/>` spring), `shard-world.ts` (the rigid-body step), `shard-physics.ts` (bake and live play), `use-ground-cursor.ts`, `glass-title.ts`, `ground.ts`, `ground-copy.ts`, `layout.ts`, `shadow-light.ts`, `scene.tsx`, `page.tsx`.
- `src/flat/`: the flat page. `scene.tsx` (typography, layout, choreography, timing), `background.ts` (Paper-derived color shapes and grain), `stage.ts` (rear text, reflective objects, upright grid), `page.tsx`.
- `src/environment.ts`: bundled HDR loading.
- `src/glass/create-glass.js`: refraction and glass parameters.
- `src/fracture.ts`: outline conversion and cell construction.
- `src/shell/`: page pieces shared by both layouts. Playback clock, controls, links and their tracked hit areas, fallback copy, GPU gate.
- `src/controls.ts`: panel schemas shared by both layouts. `src/labels.ts`, `src/grain-gradient.ts`, `src/grid.ts`: shared Glyph labels and shaders.
- `src/style.css`: interactive hit areas and fallback layout.

The final release number is announcement copy; the installed renderer is the pinned canary above. Docs and examples currently point to the public R3F introduction and examples pages. Update them if Alpha 6 gets dedicated destinations.

`pnpm test` checks that the actual Glyph outlines for `renderer` fracture into finite meshes without losing or filling letter area, including the holes in `e` and `d`. It also checks that the ground layout's `/>` touches `renderer` exactly at the strike and settles in its slot, that the baked shards come to rest on the ground outside the standing letters, and that a cursor sweep and a click move resting shards that then settle again.

See [source credits](src/CREDITS.md).

## Art direction controls

Click the settings icon beside Replay at the upper right to open **Type & scene**. The panel is hidden initially and Escape closes it. The hero/headline dropdown offers JetBrains Mono SemiBold (default), Space Grotesk SemiBold, Syne SemiBold, Geist Bold, Manrope SemiBold, Outfit Medium, Bodoni Moda SemiBold, Azeret Mono SemiBold, Chakra Petch SemiBold, Unbounded Medium, Space Mono Bold, and Oxanium SemiBold. Small labels can use IBM Plex Mono or Geist. All choices are bundled Glyph assets, including fracture-ready display outlines. Font changes preserve the animation position. Use Replay to compare their fracture behavior.

The panel also controls background colors, shape, flow speed, softness and grain; rear text size, position, depth, color and opacity; metal objects and orbit speed; rear text starts off by default; upright grid with crosshair spacing; HDR environment and rotation; glass refraction, dispersion, roughness, tint, optical depth, back-face pass, bevel, extrusion and tilt; fracture seed, cell count, impulse, and the opening hold before the break (0.7 seconds by default). Timing changes keep the later choreography and scrubber synchronized. The orange background color also colors the Breaking Changes heading. `src/ground/settings.tsx` and `src/flat/settings.tsx` hold the defaults. The live choices last for the current page session. The visible scene continues to use Glyph; the development panel itself is Leva's standard HTML UI.

## Camera and export

Open the settings icon, then **Camera**. **Follow cursor** provides adjustable horizontal and vertical travel in degrees, overall cursor strength, and follow speed. **Drag to orbit** enables left-drag rotation and wheel/pinch zoom. Releasing a drag saves yaw, pitch, and zoom into the panel. **Fixed view** uses the saved pose without cursor motion. Numeric yaw, pitch, and zoom work in every mode. **Reset camera** restores the default pose and cursor settings. Reduced-motion preferences disable automatic cursor motion but still allow deliberate orbit interaction.

**Export settings** downloads `r3f-alpha-6-settings.json` (`r3f-alpha-6-flat-settings.json` on the flat page) with a versioned snapshot of all current scene controls and the saved camera pose. Transient cursor offsets are excluded, so exported settings describe a stable base view. Keep the file or share it to apply your preferred defaults in a later edit. Export does not change the source defaults.

## Font exploration

Compare 20 additional display and code faces in the self-contained [font specimen sheet](docs/font-specimens.html). The [research notes](docs/font-research.md) include official sources, license checks, and glass geometry considerations. JetBrains Mono and the five shortlisted faces are now included in the scene’s Display font dropdown alongside the original six choices.

## Contributing and deployment

Use Node.js 22 or newer and pnpm 10.33.0. Run `pnpm test` and `pnpm build` before opening a pull request. For visual feedback, include a screenshot, browser/device details, and an exported settings file from the scene panel.

Pushes to `main` run the font fracture tests, build the site, and deploy `dist/` through GitHub Actions to GitHub Pages. The Vite build uses relative asset URLs so it also works under the repository subpath.

For startup reports, append `?debug` to the site URL to log GPU, typography, environment, and shader readiness in the browser console.
