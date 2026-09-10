const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const handler = fs.readFileSync(path.join(__dirname, '..', 'handler.php'), 'utf8');

test('routes form notifications to the teplica8 landing', () => {
  assert.match(handler, /https:\/\/prgz\.ru\/teplica8\//);
  assert.doesNotMatch(handler, /teplica6/);
});

test('includes calculator context in the notification', () => {
  for (const field of ['model', 'scenario', 'economy']) {
    assert.match(handler, new RegExp(`field\\('${field}'\\)`));
  }
  assert.match(handler, /Модель котла:/);
  assert.match(handler, /Расчётная экономия:/);
});
