/* Servidor estático mínimo para ver la tienda en local.
   Uso:  node serve.js      ->  http://localhost:5323          */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PUERTO = process.env.PORT || 5323;
const RAIZ = __dirname;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let archivo = path.join(RAIZ, url === '/' ? 'index.html' : url);

  if (!archivo.startsWith(RAIZ)) {
    res.writeHead(403).end('Prohibido');
    return;
  }

  fs.readFile(archivo, (err, datos) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1><p>No se encontro ' + url + '</p>');
      return;
    }
    const ext = path.extname(archivo).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TIPOS[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(datos);
  });
}).listen(PUERTO, () => {
  console.log(`V&B PERFORMANCE APPAREL -> http://localhost:${PUERTO}`);
});
