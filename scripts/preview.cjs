// Local design preview. Never serves PHP source or sends real applications.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.webp':'image/webp', '.woff2':'font/woff2', '.json':'application/json' };
const allowed = new Set(['/index.html','/styles.css','/industrial.css','/script.js','/version.json']);
http.createServer((req,res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(503, {'Content-Type':'application/json; charset=utf-8'});
    return res.end(JSON.stringify({ok:false,error:'preview_only'}));
  }
  const route = pathname === '/' ? '/index.html' : pathname;
  if (!allowed.has(route) && !/^\/assets\/[a-zA-Z0-9_./-]+\.(webp|woff2)$/.test(route)) { res.writeHead(404); return res.end(); }
  const file = path.resolve(root, '.' + route);
  if (!file.startsWith(root + path.sep)) { res.writeHead(404); return res.end(); }
  fs.readFile(file,(err,data) => {
    if(err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type':types[path.extname(file)], 'Cache-Control':'no-store'});
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}).listen(4178,'127.0.0.1',() => console.log('Preview: http://127.0.0.1:4178'));
