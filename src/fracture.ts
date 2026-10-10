import { ExtrudeGeometry, Path, Shape, ShapePath, Vector2, Vector3 } from 'three/webgpu';
import polygonClipping, { type Pair, type Polygon } from 'polygon-clipping';
import type { GlyphLayoutInspection } from '@pmndrs/glyph';

/** Deterministic cells make replay and resize produce the same fracture. */
function random(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

export function glyphShapes(layout: GlyphLayoutInspection, index: number) {
  const path = new ShapePath();
  const size = layout.glyphFontSizes[index];
  const x = (n: number) => layout.x[index] + n * size;
  const y = (n: number) => -(layout.y[index] + n * size);
  for (const contour of layout.outlineAt(index)) {
    if (!contour.length) continue;
    path.moveTo(x(contour[0][0]), y(contour[0][1]));
    for (const [, , cx, cy, x1, y1, line] of contour) {
      if (line) path.lineTo(x(x1), y(y1));
      else path.quadraticCurveTo(x(cx), y(cy), x(x1), y(y1));
    }
    path.currentPath?.closePath();
  }
  return path.toShapes();
}

function halfPlane(polygon: Pair[], nx: number, ny: number, distance: number) {
  const output: Pair[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const da = a[0] * nx + a[1] * ny - distance;
    const db = b[0] * nx + b[1] * ny - distance;
    if (da <= 0) output.push(a);
    if ((da <= 0) !== (db <= 0)) {
      const t = da / (da - db);
      output.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return output;
}

function ring(points: Vector2[]): Pair[] {
  const result: Pair[] = points.map(p => [p.x, p.y]);
  if (result.length) result.push([...result[0]]);
  return result;
}

export function extrude(shapes: Shape[], bevel = 0.028) {
  const geometry = new ExtrudeGeometry(shapes, {
    depth: 0.09, steps: 1, bevelEnabled: bevel > 0,
    bevelSegments: 3, bevelSize: bevel, bevelThickness: bevel, curveSegments: 10,
  });
  geometry.computeBoundingBox();
  return geometry;
}

/** Intersect each Voronoi cell with the full letter, preserving counters and disconnected islands. */
export function fractureGlyph(shapes: Shape[], seed: number) {
  const rng = random(seed);
  const polygons: Polygon[] = shapes.map(shape => {
    const points = shape.extractPoints(10);
    return [ring(points.shape), ...points.holes.map(ring)];
  });
  const points = polygons.flat(2);
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const sites: Pair[] = Array.from({ length: 11 }, () => [
    minX + rng() * (maxX - minX),
    minY + rng() * (maxY - minY),
  ]);
  return sites.flatMap((site, i) => {
    let cell: Pair[] = [[minX - 1, minY - 1], [maxX + 1, minY - 1], [maxX + 1, maxY + 1], [minX - 1, maxY + 1]];
    sites.forEach((other, j) => {
      if (i === j || !cell.length) return;
      const nx = other[0] - site[0], ny = other[1] - site[1];
      cell = halfPlane(cell, nx, ny, (other[0] ** 2 + other[1] ** 2 - site[0] ** 2 - site[1] ** 2) / 2);
    });
    if (cell.length < 3) return [];
    const clipped = polygonClipping.intersection(polygons, [[...cell, cell[0]]]);
    if (!clipped.length) return [];
    const pieces = clipped.map(([outer, ...holes]) => {
      const shape = new Shape(outer.map(([x, y]) => new Vector2(x, y)));
      shape.holes = holes.map(hole => new Path(hole.map(([x, y]) => new Vector2(x, y))));
      return shape;
    });
    const geometry = extrude(pieces, 0.0015);
    const center = geometry.boundingBox!.getCenter(new Vector3());
    geometry.translate(-center.x, -center.y, -center.z);
    return [{ geometry, center, velocity: new Vector3((rng() - 0.5) * 1.7, 0.35 + rng() * 1.6, (rng() - 0.5) * 2), spin: new Vector3((rng() - 0.5) * 6, (rng() - 0.5) * 7, (rng() - 0.5) * 5), delay: rng() * 0.18 }];
  });
}
