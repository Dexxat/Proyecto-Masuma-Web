// Verifica la normalización: cada URL antigua del CSV redirige a un producto existente en el seed, sin duplicados ni bucles.
// Uso: node tools/check-redirects.mjs
import { readFileSync } from 'node:fs';
const csv = readFileSync('docs/catalogo-normalizado.csv', 'utf8').trim().split('\n').slice(1)
  .map(l => [...l.matchAll(/"((?:[^"]|"")*)"/g)].map(m => m[1].replace(/""/g, '"')));
const seed = readFileSync('supabase/seed.sql', 'utf8');
const { redirects } = JSON.parse(readFileSync('vercel.json', 'utf8'));
const errors = [];
const slugs = csv.map(r => r[0].replace(/\/$/, '').split('/').pop());
if (new Set(slugs).size !== slugs.length) errors.push('slugs duplicados');
for (const [ruta] of csv) {
  const slug = ruta.replace(/\/$/, '').split('/').pop();
  for (const src of [`/productos/${ruta}`, `/productos/${ruta}/`]) {
    const r = redirects.find(x => x.source === src);
    if (!r) errors.push(`sin redirección: ${src}`);
    else if (r.destination !== `/productos/${slug}`) errors.push(`destino incorrecto: ${src} → ${r.destination}`);
  }
  if (!seed.includes(`('${slug}',`)) errors.push(`slug ausente en seed: ${slug}`);
}
const srcs = redirects.map(r => r.source);
if (new Set(srcs).size !== srcs.length) errors.push('redirecciones con origen duplicado');
const loops = redirects.filter(r => r.source === r.destination);
if (loops.length) errors.push(`bucles: ${loops.map(l => l.source)}`);
if (!redirects.every(r => r.permanent === true)) errors.push('todas deben ser 301 (permanent)');
console.log(`${csv.length} productos, ${redirects.length} redirecciones`);
if (errors.length) { console.error('ERRORES:\n' + errors.join('\n')); process.exit(1); }
console.log('OK: todas las URLs antiguas tienen redirección 301 a un producto existente');
