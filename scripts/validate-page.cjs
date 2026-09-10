// Structural checks for the shipping static page and local assets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate element IDs');
for (const m of html.matchAll(/<img\b[^>]+>/g)) {
  for (const a of ['alt','width','height']) assert.match(m[0],new RegExp(`\\b${a}="`),'Image missing '+a);
}
const assets = [...html.matchAll(/\b(?:src|srcset|href)="([^"]+)"/g)]
  .flatMap(m=>m[1].split(',').map(value=>value.trim().split(/\s+/)[0].split('?')[0]))
  .filter(value=>/^(?:assets\/|styles\.css$|industrial\.css$|script\.js$)/.test(value));
for (const asset of assets) assert.ok(fs.existsSync(path.join(root,asset)),asset);
assert.equal((html.match(/<details\b/g)||[]).length,(html.match(/<\/details>/g)||[]).length,'Unbalanced disclosures');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
assert.ok(html.includes(`content="${version.version}"`),'Version metadata drift');
for (const file of ['styles.css','industrial.css','script.js']) {
  assert.ok(html.includes(`"${file}?v=${version.version}"`),`Cache version drift: ${file}`);
}
assert.ok(html.includes(`rel="canonical" href="${version.proposed_url}"`),'Canonical URL drift');
assert.ok(fs.readFileSync(path.join(root,'handler.php'),'utf8').includes(version.proposed_url),'Form source URL drift');
console.log(`Page verified: ${ids.length} unique IDs; ${assets.length} local references; version ${version.version}.`);
