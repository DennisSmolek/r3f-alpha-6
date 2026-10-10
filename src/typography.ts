import { glyph, slug } from '@pmndrs/glyph';
import { ThreeConfig } from '@pmndrs/glyph/three';
import boldUrl from './assets/Geist-Bold.font.glb?url';
import regularUrl from './assets/Geist-Regular.font.glb?url';

/** Keep the current Glyph engine separate from the older workshop demos. */
export const fontsReady = glyph.init().then(async () => {
  const [bold, regular] = await Promise.all([
    glyph.fontFace(boldUrl, { format: slug }).load(),
    glyph.fontFace(regularUrl, { format: slug }).load(),
  ]);
  return { bold, regular, handle: glyph.handle('alpha-six', ThreeConfig) };
});
export type Typography = Awaited<typeof fontsReady>;
