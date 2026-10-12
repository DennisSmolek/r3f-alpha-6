import { traceStartup } from './startup';
import { glyph, slug } from '@pmndrs/glyph';
import { ThreeConfig } from '@pmndrs/glyph/three';
import geistBoldUrl from './assets/Geist-Bold.font.glb?url';
import geistRegularUrl from './assets/Geist-Regular.font.glb?url';
import spaceUrl from './assets/SpaceGrotesk-SemiBold.font.glb?url';
import syneUrl from './assets/Syne-SemiBold.font.glb?url';
import thinUrl from './assets/Raleway-ExtraLight.font.glb?url';
import plexUrl from './assets/IBMPlexMono-Regular.font.glb?url';

import manropeUrl from './assets/Manrope-SemiBold.font.glb?url';
import outfitUrl from './assets/Outfit-Medium.font.glb?url';
import bodoniUrl from './assets/BodoniModa-SemiBold.font.glb?url';

import azeretUrl from './assets/AzeretMono-SemiBold.font.glb?url';
import chakraUrl from './assets/ChakraPetch-SemiBold.font.glb?url';
import unboundedUrl from './assets/Unbounded-Medium.font.glb?url';
import spaceMonoUrl from './assets/SpaceMono-Bold.font.glb?url';
import oxaniumUrl from './assets/Oxanium-SemiBold.font.glb?url';

import jetBrainsUrl from './assets/JetBrainsMono-SemiBold.font.glb?url';

export type DisplayFont = 'Space Grotesk' | 'Syne' | 'Geist' | 'Manrope' | 'Outfit' | 'Bodoni Moda' | 'Azeret Mono' | 'Chakra Petch' | 'Unbounded' | 'Space Mono' | 'Oxanium' | 'JetBrains Mono';
export type DetailFont = 'IBM Plex Mono' | 'Geist';

const display: Record<DisplayFont, string> = { 'Space Grotesk': spaceUrl, Syne: syneUrl, Geist: geistBoldUrl, Manrope: manropeUrl, Outfit: outfitUrl, 'Bodoni Moda': bodoniUrl, 'Azeret Mono': azeretUrl, 'Chakra Petch': chakraUrl, Unbounded: unboundedUrl, 'Space Mono': spaceMonoUrl, Oxanium: oxaniumUrl, 'JetBrains Mono': jetBrainsUrl };
const detail: Record<DetailFont, string> = { 'IBM Plex Mono': plexUrl, Geist: geistRegularUrl };

const engine = glyph.init().then(() => {
  traceStartup('Typography engine ready');
  return glyph.handle('alpha-six', ThreeConfig);
});
const loads = new Map<string, Promise<unknown>>();
/** Starts a load once per key. Later calls share it, so `use` sees a stable promise. */
const once = <T,>(key: string, load: () => Promise<T>) => {
  if (!loads.has(key)) loads.set(key, load());
  return loads.get(key) as Promise<T>;
};
const face = (url: string) => once(url, () => engine.then(() => glyph.fontFace(url, { format: slug }).load()));

/**
 * The text handle with the chosen display and detail fonts. Only fonts in use are downloaded, and each loads
 * once. Prebaked outlines let every display choice share the same fracture pipeline. `withThin` adds the
 * light face behind the flat layout.
 */
export function loadTypography(displayFont: DisplayFont, detailFont: DetailFont, withThin = false) {
  return once(`${displayFont}/${detailFont}/${withThin}`, async () => {
    const [handle, displayFace, detailFace, thin] = await Promise.all([engine, face(display[displayFont]), face(detail[detailFont]), withThin ? face(thinUrl) : undefined]);
    traceStartup('Fonts ready', 0.22);
    return { handle, display: displayFace, detail: detailFace, thin };
  });
}
export type Typography = Awaited<ReturnType<typeof loadTypography>>;
