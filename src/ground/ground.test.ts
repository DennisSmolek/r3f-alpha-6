import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { glyph, slug } from '@pmndrs/glyph';
import { ThreeConfig } from '@pmndrs/glyph/three';
import { Quaternion, Vector3 } from 'three/webgpu';
import { fractureGlyph, glyphShapes } from '../fracture.ts';
import { impactTime, tagOffset } from './choreography.ts';
import { bakeShards } from './shard-physics.ts';

test('the closing tag winds up, strikes renderer at the impact, and settles beside <Canvas', () => {
  const windup = 1.1, strike = -0.2, rest = -2.7;
  const path = Array.from({ length: 400 }, (_, i) => i / 100);
  assert.ok(Math.max(...path.filter(t => t < 0.62).map(t => tagOffset(t, windup, strike, rest))) > windup * 0.9, 'it pulls back before the fling');
  assert.ok(path.filter(t => t < impactTime).every(t => tagOffset(t, windup, strike, rest) > strike), 'it never enters renderer before the strike');
  assert.ok(Math.abs(tagOffset(impactTime, windup, strike, rest) - strike) < 1e-6, 'contact happens exactly at the impact');
  assert.ok(Math.abs(tagOffset(4, windup, strike, rest) - rest) < 0.01, 'it comes to rest at its final slot');
});

test('renderer shards fall, settle flat on the ground, stay out of the standing letters, and react to the cursor', async () => {
  await glyph.init();
  const bytes = await readFile(new URL('../assets/JetBrainsMono-SemiBold.font.glb', import.meta.url));
  const font = await glyph.fontFace(new Blob([bytes]), { format: slug }).load();
  const handle = glyph.handle('ground-physics-test', ThreeConfig);
  const text = handle.createText({ font, text: 'renderer', style: { fontSize: 1 } });
  const layout = text.glyphs();
  const ink = layout.inkBounds!;
  const lift = ink.y + ink.height;
  const shapes = Array.from({ length: layout.glyphCount }, (_, i) => glyphShapes(layout, i)).flat();
  const pieces = fractureGlyph(shapes, 177, { cells: 48, depth: 0.22, impact: [1, 0.45] });
  const shards = pieces.map((piece, i) => ({
    geometry: piece.geometry,
    position: piece.center.clone().add(new Vector3(0, lift, -0.11)),
    velocity: new Vector3(-1.5, 2.5 + (i % 5) * 0.4, i % 2 ? 1.2 : -1.2),
    spin: piece.spin, delay: piece.delay,
  }));
  // A letter standing just left of the word, like the `s` of `<Canvas`.
  const letter = { min: new Vector3(-0.7, 0, -0.13), max: new Vector3(-0.1, 0.75, 0.13), offset: () => 0 };
  const physics = bakeShards(shards, [letter], { duration: 4, gravity: 9, bounce: 0.25, friction: 0.6, collide: true });
  const position = new Vector3(), quaternion = new Quaternion();
  const restsOnGround = (i: number) => {
    assert.ok([position.x, position.y, position.z, quaternion.w].every(Number.isFinite));
    const vertices = shards[i].geometry.getAttribute('position');
    let lowest = Infinity;
    for (let v = 0; v < vertices.count; v++) lowest = Math.min(lowest, new Vector3().fromBufferAttribute(vertices, v).applyQuaternion(quaternion).add(position).y);
    assert.ok(lowest > -0.02 && lowest < 0.03, `shard ${i} should rest on the ground, lowest point ${lowest}`);
  };
  for (let i = 0; i < shards.length; i++) {
    physics.sample(4, i, position, quaternion);
    restsOnGround(i);
    assert.ok(!(position.x > letter.min.x && position.x < letter.max.x && Math.abs(position.z) < letter.max.z && position.y < letter.max.y), `shard ${i} ended inside the letter`);
  }
  physics.sample(0.5, 0, position, quaternion);
  const moving = position.clone();
  physics.sample(4, 0, position, quaternion);
  assert.ok(moving.distanceTo(position) > 0.05, 'shards are in flight shortly after the strike');

  // After the intro a cursor sweep and a click move the settled shards, which then settle again.
  const live = physics.live();
  assert.equal(live.awake(), false, 'the live world starts at rest');
  live.pose(0, position, quaternion);
  const start = position.clone();
  const pusher = { center: new Vector3(), velocity: new Vector3(-6, 0, 0), radius: 0.3 };
  for (let frame = 0; frame <= 30; frame++) {
    pusher.center.set(start.x + 1.5 - frame * 0.1, 0, start.z);
    live.advance(1 / 60, pusher);
  }
  live.pose(0, position, quaternion);
  assert.ok(position.distanceTo(start) > 0.1, 'the cursor sweeps a shard along');
  live.kick(start, 3, 1);
  assert.ok(live.awake(), 'a click wakes nearby shards');
  for (let frame = 0; frame < 300; frame++) live.advance(1 / 60);
  for (let i = 0; i < shards.length; i++) {
    live.pose(i, position, quaternion);
    restsOnGround(i);
  }
  pieces.forEach(piece => piece.geometry.dispose());
  text.dispose();
  handle.dispose();
  font.dispose();
});
