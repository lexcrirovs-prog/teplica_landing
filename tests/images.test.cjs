const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const imageDir = path.resolve(__dirname, '..', 'assets', 'boilers');
const productionDir = path.resolve(__dirname, '..', 'assets', 'production');
const schemeDir = path.resolve(__dirname, '..', 'assets', 'scheme');
const stems = [
  'e3500-01',
  'e3500-02',
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

test('ships seven lightweight production-stage photographs', () => {
  const files = fs.readdirSync(productionDir).sort();
  assert.deepEqual(files, Array.from({ length: 7 }, (_, index) => `stage-${String(index + 1).padStart(2, '0')}.webp`));
  for (const file of files) {
    const size = fs.statSync(path.join(productionDir, file)).size;
    assert.ok(size > 5000, `${file} is unexpectedly small`);
    assert.ok(size < 256000, `${file} is ${size} bytes`);
  }
});

test('ships five lightweight scheme views without source models or references', () => {
  assert.deepEqual(fs.readdirSync(schemeDir).sort(), ['boiler-e7000.webp', 'burner-rs610.webp', 'chimney.webp', 'condenser.webp', 'greenhouse.webp']);
  let bytes = 0;
  for (const name of fs.readdirSync(schemeDir)) {
    const data = fs.readFileSync(path.join(schemeDir, name));
    assert.equal(data.toString('ascii', 0, 4), 'RIFF');
    assert.equal(data.toString('ascii', 8, 12), 'WEBP');
    bytes += data.length;
  }
  assert.ok(bytes < 256000, `Scheme image budget exceeded: ${bytes} bytes`);
});
