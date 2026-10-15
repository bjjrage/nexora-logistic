import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, process.argv.includes('--dist') ? '../dist' : '../public');
const baseIndex = process.argv.indexOf('--base');
const basePath = baseIndex > -1 ? process.argv[baseIndex + 1].replace(/\/$/, '') : '';
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex > -1 ? process.argv[portIndex + 1] : process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Bad request'); return; }
  if (basePath && !pathname.startsWith(basePath + '/')) { res.writeHead(404); res.end('Not found'); return; }
  if (basePath) pathname = pathname.slice(basePath.length);
  let file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); res.end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!existsSync(file)) {
    if (path.extname(pathname)) { res.writeHead(404); res.end('Not found'); return; }
    file = path.join(root, 'index.html');
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
  createReadStream(file).pipe(res);
});
server.listen(port, '127.0.0.1', () => console.log(`Nexora Logistic — Local: http://localhost:${port}${basePath}/`));
