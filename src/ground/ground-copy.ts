import { Group, Mesh, MeshBasicNodeMaterial, PlaneGeometry, Shape, ShapeGeometry, Vector2, type BufferGeometry, type Object3D } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { credits } from '../credits';
import { ease } from '../timeline';
import { createLabels, type LabelOptions } from '../labels';
import { impactTime } from './choreography';
import type { Typography } from '../typography';
import type { GroundLayout } from './layout';
import type { GroundSettings } from './settings';

/**
 * Announcement copy printed flat on the ground. Each item sits under the same screen position as the flat
 * layout, sized in pixels, so the HTML hit areas still line up. `copyStretch` lengthens type along the
 * ground like road markings so distant lines stay legible.
 */
export function createGroundCopy(typography: Typography, settings: GroundSettings, onError: (error: unknown) => void, layout: GroundLayout, w: number, h: number) {
  const root = new Group();
  const labels = createLabels(typography, settings, onError, true);
  const appear = uniform(0), alphaAppear = uniform(0);
  const compact = w < 650;
  const patches: { group: Group; scale: number; slant: number }[] = [];
  const geometries: BufferGeometry[] = [];
  const materials: MeshBasicNodeMaterial[] = [];
  /** A patch of ground under a screen point where one unit reads as one pixel. */
  const place = (x: number, y: number, ...children: Object3D[]) => {
    const point = layout.at(x, y);
    const group = new Group();
    group.position.set(point.x, 2, point.z);
    group.rotation.x = -Math.PI / 2;
    group.add(...children);
    root.add(group);
    patches.push({ group, scale: layout.scale(point), slant: layout.slant(point) });
    return group;
  };
  const label = (text: string, x: number, y: number, fontSize: number, options: LabelOptions = {}) => {
    const object = labels.create(text, fontSize, options);
    place(x, y, object);
    return object;
  };
  const plane = (width: number, height: number, color: string, opacity = 1) => {
    const material = new MeshBasicNodeMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false });
    const geometry = new PlaneGeometry(width, height);
    materials.push(material);
    geometries.push(geometry);
    return new Mesh(geometry, material);
  };

  label('-  B R E A K I N G   C H A N G E S  -', 0, h / 2 - 46, compact ? 9 : 10, { tone: 'heading' });
  label('REACT THREE FIBER', -w / 2 + 32, h / 2 - 46, 10, { tone: 'muted', align: 'left' }).visible = !compact;

  const versionSize = compact ? 17 : 21;
  const version = labels.create('r3f v10', versionSize);
  const alpha = labels.create('Alpha 6', versionSize, { tone: 'accent', opacity: alphaAppear });
  const versionWidth = version.measure().width, alphaWidth = alpha.measure().width;
  const releaseWidth = versionWidth + 14 + alphaWidth;
  place(0, -h * 0.067, version, alpha);
  label('is now', 0, -h * 0.118, compact ? 14 : 16, { tone: 'muted', opacity: appear });
  label('WebGPU First', 0, -h * 0.182, Math.min(compact ? w * 0.087 : 50, h * 0.065), { bold: true, opacity: appear });

  // The Poimandres mark from the HTML logo, drawn at the same 36.52 px.
  const unit = (compact ? 33.2 : 36.52) / 3.32;
  const square = (x: number, y: number, points: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]) =>
    new Shape(points.map(([px, py]) => new Vector2((x + px - 1.66) * unit, (1.66 - y - py) * unit)));
  const markGeometry = new ShapeGeometry([square(0, 1.16), square(1.16, 1.16), square(1.16, 2.32), square(1.16, 0, [[0, 0], [2.16, 0], [2.16, 2.16], [1.16, 2.16], [1.16, 1], [0, 1]])]);
  const markMaterial = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, toneMapped: false });
  markMaterial.colorNode = labels.ink;
  geometries.push(markGeometry);
  materials.push(markMaterial);
  place(0, -h * 0.286, new Mesh(markGeometry, markMaterial));

  const links = place(0, -h * 0.353, labels.create('Docs', 14), labels.create('Examples', 14), labels.create('/', 12, { tone: 'muted' }));
  [-54, 48, -3].forEach((x, i) => { links.children[i].position.x += x; });

  const trackWidth = compact ? 190 : 226;
  const track = plane(trackWidth, 2, '#77716a', 0.18), progress = plane(trackWidth, 2, '#ed582c');
  progress.position.z = 0.1;
  place(0, -h * 0.407, track, progress);

  const footY = -h / 2 + 29;
  credits.forEach(([text], i) => {
    const x = compact ? (i < 3 ? (i - 1) * (w - 32) / 3 : (i - 3.5) * (w - 32) / 2) : [-210, -130, -20, 90, 190][i];
    label(text, x, compact ? -h / 2 + (i < 3 ? 42 : 14) : footY, compact ? 9 : 11, { tone: 'muted' });
  });
  label('BUILT WITH', -w / 2 + 32, footY, 9, { tone: 'muted', align: 'left' }).visible = w > 800;
  label('ALPHA 6', w / 2 - 32, footY, 9, { tone: 'muted', align: 'right' }).visible = w > 800;

  return { root,
    /** `t` is choreography time and `amount` is overall intro progress from 0 to 1. */
    update(t: number, amount: number, settings: GroundSettings) {
      labels.theme.value = ease(t, impactTime + 0.05, impactTime + 1.2);
      labels.headingColor.value.set(settings.color2);
      alphaAppear.value = ease(t, 2, 2.8);
      appear.value = ease(t, 2.6, 3.7);
      const slide = ease(t, 1.9, 2.9);
      version.position.x = -versionWidth / 2 + (-releaseWidth / 2 + versionWidth / 2) * slide;
      alpha.position.x = -releaseWidth / 2 + versionWidth + 14;
      progress.scale.x = Math.max(0.001, amount);
      progress.position.x = -trackWidth * (1 - progress.scale.x) / 2;
      for (const { group, scale, slant } of patches) group.scale.set(scale, scale * (1 + (1 / slant - 1) * settings.copyStretch), scale);
    },
    dispose() {
      labels.dispose();
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
    },
  };
}
