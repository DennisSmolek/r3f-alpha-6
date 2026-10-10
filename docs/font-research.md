# Glass type exploration: 20 additional fonts

Research date: October 10, 2026. These are new options beyond Space Grotesk, Syne, Geist, Manrope, Outfit, and Bodoni Moda.

The most useful change is a stronger typographic silhouette: a deliberately engineered mono, chamfered technical lettering, or a broad display face. Simply trying more neutral geometric sans faces is unlikely to change the atmosphere enough. That is a design judgment, not a claim from the font authors.

## Start with these five

1. **Azeret Mono 600**: strongest code-forward direction. Wide, deliberate, mechanical, with enough body for glass to read. The angle brackets feel integral to the lettering. [Official source and license](https://github.com/google/fonts/tree/main/ofl/azeretmono)
2. **Chakra Petch 600**: chamfered corners bring a machined-object quality before any bevel is added. A good fit for fractured, technical glass. [Official source and license](https://github.com/google/fonts/tree/main/ofl/chakrapetch)
3. **Unbounded 500**: broad, sculptural, assertive. Probably the biggest departure from the existing options without becoming a novelty face. Keep the weight moderate so counters stay open. [Official source and license](https://github.com/google/fonts/tree/main/ofl/unbounded)
4. **Space Mono 700**: an idiosyncratic code face with a retro research-lab character. It gives the hero a recognizable personality without losing its literal JSX reading. [Official source and license](https://github.com/google/fonts/tree/main/ofl/spacemono)
5. **Oxanium 600**: squared futuristic forms and angled cuts. More overtly technical than the current collection, with broad enough strokes to reflect the environment. [Official source and license](https://github.com/google/fonts/tree/main/ofl/oxanium)

## Full shortlist

The visual descriptions and glass-fit notes below are design judgments. Suggested weights are available in the current official files.

| Font | Starting weight / axes | Direction | Glass and fracture considerations |
| --- | --- | --- | --- |
| [Azeret Mono](https://github.com/google/fonts/tree/main/ofl/azeretmono) | 600 | Deliberate OCR / industrial terminal | Strong first choice; even strokes should give consistent bevel highlights. |
| [Space Mono](https://github.com/google/fonts/tree/main/ofl/spacemono) | 700 | Retro-futurist code, quirky and recognizable | Try bold first; regular has less reflective surface. A longer hero than proportional faces. |
| [JetBrains Mono](https://github.com/google/fonts/tree/main/ofl/jetbrainsmono) | 600 | Precise developer-tool identity | Literal coding reference with sturdy strokes; less surprising than Azeret or Space Mono. |
| [Spline Sans Mono](https://github.com/google/fonts/tree/main/ofl/splinesansmono) | 600 | Restrained mono with sharp interior details | Its thorn-like traps can make interesting highlights; inspect tiny corners after beveling. |
| [Fragment Mono](https://github.com/google/fonts/tree/main/ofl/fragmentmono) | 400 | Swiss typography turned into code | Quiet, architectural option. Only regular weight: use a smaller bevel rather than artificially emboldening. |
| [Martian Mono](https://github.com/google/fonts/tree/main/ofl/martianmono) | 600, width 100 | Broad, blunt, systematic | Robust glass volume; width 87.5 is worth comparing if the full intro feels cramped. |
| [Chivo Mono](https://github.com/google/fonts/tree/main/ofl/chivomono) | 600 | Dense, balanced technical lettering | A solid midpoint between a neutral sans and a visibly eccentric mono. |
| [Xanh Mono](https://github.com/google/fonts/tree/main/ofl/xanhmono) | 400 upright | Editorial mono-serif, delicate and unusual | Experimental: fine strokes and serifs need a much smaller bevel; fractured slivers may be fragile. |
| [Chakra Petch](https://github.com/google/fonts/tree/main/ofl/chakrapetch) | 600 | Machined, square, chamfered | The corner language naturally supports the glass object concept. |
| [Oxanium](https://github.com/google/fonts/tree/main/ofl/oxanium) | 600 | Futuristic instrumentation / HUD | Angled cuts give sharper changes of reflection; a strong alternative to rounded sans forms. |
| [Unbounded](https://github.com/google/fonts/tree/main/ofl/unbounded) | 500 | Wide sculptural display | Large reflective faces; needs a fit-to-width check in the full renderer state. |
| [Michroma](https://github.com/google/fonts/tree/main/ofl/michroma) | 400 | 1960s space-age, low and extended | Elegant long horizontal strokes. Only regular weight; avoid an oversized bevel. |
| [Orbitron](https://github.com/google/fonts/tree/main/ofl/orbitron) | 600 | Angular sci-fi title lettering | Bold change of atmosphere; its stylized lowercase should be judged on the exact JSX string. |
| [Audiowide](https://github.com/google/fonts/tree/main/ofl/audiowide) | 400 | Rounded tubular techno | Particularly promising for continuous curved reflections. Only regular weight. |
| [Rajdhani](https://github.com/google/fonts/tree/main/ofl/rajdhani) | 600 | Narrow technical signage | Gives the entire code phrase room to breathe. Slim proportions need a restrained bevel. |
| [Exo 2](https://github.com/google/fonts/tree/main/ofl/exo2) | 600 | Softer, organic futurism | Less severe than Oxanium; a useful halfway point toward a technical mood. |
| [Sora](https://github.com/google/fonts/tree/main/ofl/sora) | 600 | Early-screen cues, contemporary display | A cleaner fallback if the sci-fi faces become too literal. Lower novelty than the top five. |
| [Bricolage Grotesque](https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque) | 600, optical size 72, width 100 | Expressive editorial grotesque | An art-direction alternative to techno. Use a fixed optical-size instance for repeatable outlines. |
| [Doto](https://github.com/google/fonts/tree/main/ofl/doto) | 700, roundness 100 | Dot-matrix / modular digital sculpture | Highest-risk experiment: disconnected dots create many components, and the fracture may read as beads falling. Worth a separate preset, not the default. |
| [Tektur](https://github.com/google/fonts/tree/main/ofl/tektur) | 600, width 100 | Octagonal industrial lettering | Strong flat and chamfered surfaces; width 87.5 offers a denser, compact alternative. |

## What was verified

For all 20 fonts, I fetched the current `METADATA.pb`, the normal-style TTF referenced by it, and `OFL.txt` from the official Google Fonts repository. All report the SIL Open Font License and include actual nonzero character-map entries for every character in `<Canvas renderer />R3Fv10`, including `<`, `>`, slash, spaces, and lowercase. Each has distinct uppercase/lowercase C glyph entries. This verifies coverage, not successful extrusion or fracture rendering.

Metadata axes were checked before choosing the suggested weights and widths. The original OFL and copyright notices should accompany any redistributed font files. No fonts were installed, baked, or added to the application during this research.

## Suggested implementation pass

Start with the five leaders, compare the exact strings `<Canvas renderer />` and `<Canvas />` at the same cap height, and inspect both the intact and fractured states. Keep framing consistent rather than giving wider faces a misleadingly smaller appearance. Run the existing outline/counter-area tests for each baked font. Use a smaller bevel for Fragment Mono, Michroma, Rajdhani, and Xanh Mono; keep Doto separate until its disconnected contours have been tested.

For variable fonts, bake the exact chosen weight/width/optical-size instance. Continue preserving the literal character sequence so any coding ligatures do not unexpectedly merge the angle brackets or slash. If all 20 are eventually exposed in Leva, load the chosen face on demand instead of making the opening animation wait for 20 additional assets.
