import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../public');
await mkdir(path.join(root, 'vendor'), { recursive: true });
await mkdir(path.join(root, 'fonts'), { recursive: true });
const assets = [
  ['https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js', 'vendor/lucide.js'],
  ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=85', 'assets/warehouse.jpg'],
];
for (const [url, file] of assets) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${file}: ${res.status}`);
  await writeFile(path.join(root, file), Buffer.from(await res.arrayBuffer()));
  console.log(`Saved ${file}`);
}
const fontResponse = await fetch('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap', {
  headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36' },
});
if (!fontResponse.ok) throw new Error('Could not download fonts');
let css = await fontResponse.text();
for (const [index, url] of [...new Set([...css.matchAll(/url\((https[^)]+)\)/g)].map(m => m[1]))].entries()) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font ${index}: ${res.status}`);
  const name = `font-${index}.woff2`;
  await writeFile(path.join(root, 'fonts', name), Buffer.from(await res.arrayBuffer()));
  css = css.replaceAll(url, `/fonts/${name}`);
}
await writeFile(path.join(root, 'fonts/fonts.css'), css);
console.log('Saved local fonts');
const mapResponse = await fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries/PRY.geo.json');
if (!mapResponse.ok) throw new Error(`Map: ${mapResponse.status}`);
const geo = await mapResponse.json();
const geometry = geo.features?.[0]?.geometry || geo.geometry;
const ring = geometry.type === 'MultiPolygon' ? geometry.coordinates[0][0] : geometry.coordinates[0];
const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
const commands = ring.map((p, i) => `${i ? 'L' : 'M'}${((p[0] - minX) / (maxX - minX) * 350 + 35).toFixed(2)},${((maxY - p[1]) / (maxY - minY) * 420 + 30).toFixed(2)}`).join(' ');
await writeFile(path.join(root, 'assets/paraguay-map.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 480"><path d="${commands} Z" fill="#244260" stroke="#587691" stroke-width="1.5" stroke-linejoin="round"/></svg>`);
console.log('Saved geographic Paraguay map');
