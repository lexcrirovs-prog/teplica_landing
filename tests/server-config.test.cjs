const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const config = fs.readFileSync(path.join(__dirname, '..', '.htaccess'), 'utf8');

test('serves the landing with UTF-8 and a fixed directory index', () => {
  assert.match(config, /AddDefaultCharset UTF-8/);
  assert.match(config, /DirectoryIndex index\.html/);
});

test('enables safe static-asset caching without caching HTML', () => {
  assert.match(config, /ExpiresByType image\/webp "access plus 1 year"/);
  assert.match(config, /ExpiresByType text\/css "access plus 30 days"/);
  assert.ok(config.includes('<FilesMatch "\\.(?:html|php)$">'));
  assert.match(config, /Cache-Control "no-store, max-age=0"/);
});
