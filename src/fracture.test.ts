import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { glyph, slug } from '@pmndrs/glyph';
import { ThreeConfig } from '@pmndrs/glyph/three';
import { ExtrudeGeometry } from 'three/webgpu';
import { fractureGlyph, glyphShapes } from './fracture.ts';

function capArea(geometry: ExtrudeGeometry) {
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  let area = 0;
  for (let i = 0; i < position.count; i += 3) {
    if (normal.getZ(i) < 0.9999) continue;
    const ax = position.getX(i), ay = position.getY(i);
    const bx = position.getX(i + 1), by = position.getY(i + 1);
    const cx = position.getX(i + 2), cy = position.getY(i + 2);
    area += Math.abs((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / 2;
  }
  return area;
}

for (const face of ['SpaceGrotesk-SemiBold', 'Syne-SemiBold', 'Geist-Bold', 'Manrope-SemiBold', 'Outfit-Medium', 'BodoniModa-SemiBold', 'AzeretMono-SemiBold', 'ChakraPetch-SemiBold', 'Unbounded-Medium', 'SpaceMono-Bold', 'Oxanium-SemiBold']) test(`${face}: renderer fractures conserve the actual Glyph silhouettes and letter holes`, async () => {
  await glyph.init();
  const bytes = await readFile(new URL(`./assets/${face}.font.glb`, import.meta.url));
  const font = await glyph.fontFace(new Blob([bytes]), { format: slug }).load();
  const handle = glyph.handle(`fracture-test-${face}`, ThreeConfig);
  const text = handle.createText({ font, text: 'renderer', style: { fontSize: 1 } });
  const layout = text.glyphs();
  assert.equal(layout.glyphCount, 8);
  let shardCount = 0, holes = 0, expectedWordArea = 0;
  for (let i = 0; i < layout.glyphCount; i++) {
    const shapes = glyphShapes(layout, i);
    holes += shapes.reduce((n, shape) => n + shape.holes.length, 0);
    const original = new ExtrudeGeometry(shapes, { depth: 0.09, bevelEnabled: false, curveSegments: 32 });
    const pieces = fractureGlyph(shapes, i + 177);
    assert.ok(pieces.length > 4, 'each letter must yield multiple real cells');
    const expected = capArea(original);
    expectedWordArea += expected;
    const actual = pieces.reduce((sum, piece) => sum + capArea(piece.geometry), 0);
    assert.ok(Math.abs(actual - expected) < expected * 0.001, `glyph ${i} lost or filled silhouette area: ${actual} vs ${expected}`);
    for (const piece of pieces) {
      assert.ok(Array.from(piece.geometry.attributes.position.array).every(Number.isFinite));
      piece.geometry.dispose();
    }
    shardCount += pieces.length;
    original.dispose();
  }
  assert.ok(holes >= 4, 'the e and d counters must survive outline conversion');
  assert.ok(shardCount > 50 && shardCount < 150);
  const wordShapes = Array.from({ length: layout.glyphCount }, (_, i) => glyphShapes(layout, i)).flat();
  const wordPieces = fractureGlyph(wordShapes, 177, { cells: 48, depth: 0.22 });
  const areas = wordPieces.map(piece => capArea(piece.geometry));
  assert.ok(Math.abs(areas.reduce((sum, area) => sum + area, 0) - expectedWordArea) < expectedWordArea * 0.001, 'word-wide fracture must preserve every letter and counter');
  assert.ok(Math.max(...areas) / Math.min(...areas.filter(area => area > 0.00001)) > 6, 'impact pattern must mix fine splinters with substantially larger pieces');
  wordPieces.forEach(piece => piece.geometry.dispose());
  text.dispose();
  handle.dispose();
  font.dispose();
});
