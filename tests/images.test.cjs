const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const imageDir = path.resolve(__dirname, '..', 'assets', 'boilers');
const stems = [
  'e4000-01',
  'e4000-02',
  'e6000-01',
  'e6000-02',
  'e6000-03',
  'e7000-01',
  'e7000-02',
  'e7000-03',
  'e7000-04',
  'e7000-05',
];

test('contains responsive WebP pairs for all boiler photographs', () => {
  const files = fs.readdirSync(imageDir).sort();
  const expected = stems
    .flatMap((stem) => [`${stem}-960.webp`, `${stem}-1600.webp`])
    .sort();

  assert.deepEqual(files, expected);
});

test('keeps every optimized boiler photograph below 500 KiB', () => {
  for (const file of fs.readdirSync(imageDir)) {
    const size = fs.statSync(path.join(imageDir, file)).size;
    assert.ok(size > 10000, `${file} is unexpectedly small`);
    assert.ok(size < 512000, `${file} is ${size} bytes`);
  }
});

