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

/** Prebaked outlines let every display choice share the same fracture pipeline. */
export const fontsReady = glyph.init().then(async () => {
  traceStartup('Typography engine ready');
  const [geistBold, geistRegular, space, syne, plex, thin, manrope, outfit, bodoni, azeret, chakra, unbounded, spaceMono, oxanium, jetBrains] = await Promise.all(
    [geistBoldUrl, geistRegularUrl, spaceUrl, syneUrl, plexUrl, thinUrl, manropeUrl, outfitUrl, bodoniUrl, azeretUrl, chakraUrl, unboundedUrl, spaceMonoUrl, oxaniumUrl, jetBrainsUrl].map(url => glyph.fontFace(url, { format: slug }).load()),
  );
  traceStartup('Fonts ready', 0.22);
  return {
    thin,
    display: { 'Space Grotesk': space, Syne: syne, Geist: geistBold, Manrope: manrope, Outfit: outfit, 'Bodoni Moda': bodoni, 'Azeret Mono': azeret, 'Chakra Petch': chakra, Unbounded: unbounded, 'Space Mono': spaceMono, Oxanium: oxanium, 'JetBrains Mono': jetBrains },
    detail: { 'IBM Plex Mono': plex, Geist: geistRegular },
    handle: glyph.handle('alpha-six', ThreeConfig),
  };
});
export type Typography = Awaited<typeof fontsReady>;
