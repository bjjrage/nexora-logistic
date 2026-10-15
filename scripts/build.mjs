import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'dist');
await mkdir(output, { recursive: true });
await cp(path.join(root, 'public'), output, { recursive: true });
const html = await readFile(path.join(root, 'public/index.html'), 'utf8');
const appSource = await readFile(path.join(root, 'public/app.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(appSource.slice(0, appSource.indexOf('const routeTitles')), context);
const routes = {
  nosotros: 'Nosotros', servicios: 'Soluciones logísticas', cobertura: 'Cobertura nacional', blog: 'Ideas en movimiento', contacto: 'Contacto y cotización', clientes: 'Acceso clientes', privacidad: 'Privacidad',
  'servicios/transporte-terrestre': 'Transporte terrestre', 'servicios/almacenaje-distribucion': 'Almacenaje y distribución', 'servicios/logistica-integral': 'Logística integral', 'servicios/documentos-confidenciales': 'Documentos confidenciales',
  'blog/preparar-tu-carga': 'Cómo preparar tu carga', 'blog/logistica-que-crece': 'Una logística que crece con tu negocio', 'blog/documentos-seguros': 'El valor de una entrega confidencial',
};
const renderers = { '': 'home()', nosotros: 'about()', servicios: 'servicesPage()', cobertura: 'coveragePage()', blog: 'blogPage()', contacto: 'contactPage()', clientes: 'clientPage()', privacidad: 'privacyPage()' };
const netlifyOrigin = process.env.NETLIFY === 'true'
  ? (process.env.CONTEXT === 'production' ? process.env.URL : process.env.DEPLOY_PRIME_URL || process.env.URL)
  : '';
const siteOrigin = (process.env.SITE_ORIGIN || netlifyOrigin || 'https://bjjrage.github.io').replace(/\/$/, '');
const basePath = (process.env.BASE_PATH ?? '/nexora-logistic').replace(/\/$/, '');
if (basePath && !/^\/[a-zA-Z0-9_-]+$/.test(basePath)) throw new Error('BASE_PATH must be empty or a single repository path.');
const siteURL = siteOrigin + basePath;
const prefixPaths = content => content.replace(/\b(href|src)="\/(?!\/)/g, `$1="${basePath}/`).replace(/url\((['"]?)\/(?!\/)/g, `url($1${basePath}/`);
for (const [route, title] of Object.entries({ '': 'Confianza en movimiento', ...routes })) {
  await mkdir(path.join(output, route), { recursive: true });
  const pathname = route ? `/${route}/` : '/';
  let renderer = renderers[route];
  if (!renderer && route.startsWith('servicios/')) renderer = `serviceDetail(services.find(s => s.slug === ${JSON.stringify(route.split('/')[1])}))`;
  if (!renderer && route.startsWith('blog/')) renderer = `articlePage(articles.find(a => a.slug === ${JSON.stringify(route.split('/')[1])}))`;
  const body = vm.runInContext(`header(${JSON.stringify(pathname)}) + '<main id="main" tabindex="-1">' + ${renderer} + '</main>' + footer()`, context);
  const pageHtml = html.replace(/<title>.*?<\/title>/, `<title>${title} | Nexora Logistic</title>`)
    .replace('<div id="app"></div>', `<div id="app">${body}</div>`)
    .replace('</head>', `  <link rel="canonical" href="${siteURL}${pathname}">\n</head>`);
  await writeFile(path.join(output, route, 'index.html'), prefixPaths(pageHtml));
}
await writeFile(path.join(output, '404.html'), prefixPaths(html));
await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteURL}/sitemap.xml\n`);
await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['', ...Object.keys(routes)].map(route => `<url><loc>${siteURL}/${route ? `${route}/` : ''}</loc></url>`).join('')}</urlset>`);
for (const relative of ['styles.css', 'fonts/fonts.css']) {
  const filename = path.join(output, relative);
  await writeFile(filename, prefixPaths(await readFile(filename, 'utf8')));
}
await writeFile(path.join(output, '.nojekyll'), '');
await writeFile(path.join(output, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n');
async function count(dir) { let n = 0; for (const entry of await readdir(dir, { withFileTypes: true })) n += entry.isDirectory() ? await count(path.join(dir, entry.name)) : 1; return n; }
console.log(`Built Nexora Logistic: ${Object.keys(routes).length + 1} pages, ${await count(output)} files.`);
