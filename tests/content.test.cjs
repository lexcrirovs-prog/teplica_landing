const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

const html = read('index.html');
const css = read('styles.css');
const script = read('script.js');

test('contains every required product-tool section', () => {
  const ids = [
    'economics',
    'calculator',
    'scheme',
    'physics',
    'season',
    'package',
    'automation',
    'service',
    'factory',
    'faq',
    'request',
    'print-calc',
  ];

  for (const id of ids) {
    assert.match(html, new RegExp(`id=["']${id}["']`), id);
  }
});

test('contains product material references and relevant project standards', () => {
  const claims = [
    'удлинённая топка',
    '09Г2С',
    'Ст20',
    'ГОСТ 19281-2014',
    'ГОСТ 1050-2013',
    'СП 89.13330.2016',
    'СП 107.13330.2012',
  ];

  for (const claim of claims) {
    assert.ok(html.includes(claim), claim);
  }
});

test('has no forbidden materials or construction terms', () => {
  const forbidden = [
    'гофрированн' + 'ая',
    'P265GH',
    'P275NH',
    'EN 10028',
  ];
  const content = `${html}\n${css}\n${script}`;

  for (const term of forbidden) {
    assert.ok(!content.includes(term), term);
  }
});

test('points metadata and form to teplica8', () => {
  assert.ok(html.includes('https://prgz.ru/teplica8/'));
  assert.match(html, /action=["']handler\.php["']/);
  assert.match(html, /name=["']consent["']/);
});

test('exposes calculator and request form contracts', () => {
  const controlIds = [
    'calc-area',
    'calc-manual-power',
    'calc-gas',
    'calc-electricity',
    'calc-hours',
    'calc-scenario',
    'calc-results',
  ];
  const fieldNames = [
    'name',
    'phone',
    'email',
    'culture',
    'object',
    'model',
    'scenario',
    'economy',
    'comment',
    'consent',
    'website',
  ];

  for (const id of controlIds) {
    assert.match(html, new RegExp(`id=["']${id}["']`), id);
  }
  for (const name of fieldNames) {
    assert.match(html, new RegExp(`name=["']${name}["']`), name);
  }
});

test('ships responsive, reduced-motion and print styles', () => {
  assert.match(css, /@media\s*\(max-width:\s*820px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media\s+print/);
});

