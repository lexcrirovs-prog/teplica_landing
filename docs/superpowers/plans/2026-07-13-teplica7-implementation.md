# Teplica7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Выпустить интерактивный лендинг-инструмент Premium-E с подбором котлов, честным расчётом окупаемости, инженерными интерактивами, рабочей формой и публикацией на GitHub и Beget.

**Architecture:** Заменить упакованный `teplica6` чистым статическим сайтом без сборки: семантический HTML, отдельные CSS и JavaScript, локальные WebP-фотографии и PHP 5.6-совместимый обработчик. Расчётный модуль в `script.js` остаётся browser-compatible, экспортирует чистые функции для Node-тестов и инициализирует DOM только при наличии `document`.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Node.js built-in test runner, PHP 5.6, Python/Pillow для подготовки изображений, Beget shared hosting.

## Global Constraints

- Ветка: `teplica7`, база: `teplica6`; рабочий каталог: `C:/Users/Алексей/Documents/New project/teplica_landing`.
- Продакшен: `https://prgz.ru/teplica7/`; хостинговый каталог: `prgz.ru/public_html/teplica7`.
- Не использовать внешние JavaScript-библиотеки, `localStorage` и `sessionStorage`.
- Использовать только формулировку «удлинённая топка»; запрещённое ТЗ слово не должно появляться в коде, метаданных и документации сайта.
- Стали: только 09Г2С / Ст20; нормы: ГОСТ 19281, ГОСТ 1050, ГОСТ 21563-2016, ГОСТ Р ЕН 676-2014, ГОСТ Р 51383-2012, ГОСТ Р 50831-95, СП 107.13330.2012.
- Прайс берётся только из утверждённой спецификации; не утверждать, что НДС включён.
- Цена калькулятора — цена котла/каскада. Стоимость полного комплекса и его точная окупаемость выдаются только после инженерного КП.
- Секреты Beget и GitHub не записывать в файлы, команды, историю Git или вывод проверок.

---

### Task 1: Расчётный движок и тесты прайса

**Files:**
- Create: `script.js`
- Create: `tests/calculator.test.cjs`

**Interfaces:**
- Produces: `MODEL_PRICES`, `selectBoilers(powerKw)`, `calculateEconomics(input)`, `formatMoney(value)`.
- `calculateEconomics(input)` consumes `{ area, culture, manualPowerKw, gasTariff, electricityTariff, hours, scenario }` and returns the selected boiler set, price, energy costs, savings, payback, CO₂ figures and source assumptions.

- [ ] **Step 1: Write the failing calculator tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MODEL_PRICES,
  selectBoilers,
  calculateEconomics,
} = require('../script.js');

test('contains the approved 13-model price list', () => {
  assert.equal(MODEL_PRICES.length, 13);
  assert.deepEqual(MODEL_PRICES[0], { powerKw: 1000, price: 2173488.10 });
  assert.deepEqual(MODEL_PRICES.at(-1), { powerKw: 10000, price: 10063547.62 });
});

test('rounds 2.4 ha to 2400 kW and selects E-2500', () => {
  const result = calculateEconomics({
    area: 2.4,
    culture: 'Томаты',
    manualPowerKw: 0,
    gasTariff: 8,
    electricityTariff: 6,
    hours: 3000,
    scenario: 'gas',
  });
  assert.equal(result.powerKw, 2400);
  assert.equal(result.boilers.label, 'Premium E-2500');
  assert.equal(result.boilers.totalPrice, 3423988.10);
});

test('selects an equal two-boiler cascade above 10 MW', () => {
  const result = selectBoilers(11000);
  assert.equal(result.count, 2);
  assert.equal(result.unitPowerKw, 6000);
  assert.equal(result.label, '2 × Premium E-6000');
  assert.equal(result.totalPrice, 12249777.28);
});

test('matches the research energy example for 3 GWh per year', () => {
  const result = calculateEconomics({
    area: 1,
    culture: 'Огурцы',
    manualPowerKw: 1000,
    gasTariff: 8,
    electricityTariff: 6,
    hours: 3000,
    scenario: 'electric',
  });
  assert.ok(Math.abs(result.annualUsefulKwh - 3000000) < 1);
  assert.ok(Math.abs(result.premiumAnnualCost - 2406015.04) < 1);
  assert.ok(Math.abs(result.baselineAnnualCost - 18181818.18) < 1);
  assert.ok(Math.abs(result.annualSavings - 15775803.14) < 1);
});

test('keeps yield and CO2 outside monetary payback', () => {
  const result = calculateEconomics({
    area: 3,
    culture: 'Розы',
    manualPowerKw: 0,
    gasTariff: 8,
    electricityTariff: 6,
    hours: 3000,
    scenario: 'gas',
  });
  assert.deepEqual(result.yieldRangePercent, [20, 40]);
  assert.equal(result.includesCropRevenue, false);
  assert.equal(result.includesFullComplexCapex, false);
});
```

- [ ] **Step 2: Run the tests and verify the expected failure**

Run: `node --test tests/calculator.test.cjs`

Expected: FAIL because `script.js` and its exports do not exist.

- [ ] **Step 3: Implement the pure calculator core at the top of `script.js`**

```js
'use strict';

const MODEL_PRICES = Object.freeze([
  { powerKw: 1000, price: 2173488.10 },
  { powerKw: 1500, price: 2471226.19 },
  { powerKw: 2000, price: 3364440.48 },
  { powerKw: 2500, price: 3423988.10 },
  { powerKw: 3000, price: 4287428.57 },
  { powerKw: 3500, price: 4758822.11 },
  { powerKw: 4000, price: 5321708.03 },
  { powerKw: 5000, price: 5753589.19 },
  { powerKw: 6000, price: 6124888.64 },
  { powerKw: 7000, price: 7532773.81 },
  { powerKw: 8000, price: 7919833.33 },
  { powerKw: 9000, price: 9706261.90 },
  { powerKw: 10000, price: 10063547.62 },
]);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

function selectBoilers(powerKw) {
  const required = Math.max(1000, Math.ceil(Number(powerKw) / 50) * 50);
  let count = Math.max(1, Math.ceil(required / 10000));
  let model;
  while (!model) {
    const perUnit = required / count;
    model = MODEL_PRICES.find((item) => item.powerKw >= perUnit);
    if (!model) count += 1;
  }
  return {
    count,
    unitPowerKw: model.powerKw,
    installedPowerKw: count * model.powerKw,
    totalPrice: count * model.price,
    label: count === 1
      ? `Premium E-${model.powerKw}`
      : `${count} × Premium E-${model.powerKw}`,
  };
}

function calculateEconomics(input) {
  const area = clamp(input.area || 1, 0.3, 50);
  const estimatedPower = Math.ceil((area * 1000) / 50) * 50;
  const manualPower = Number(input.manualPowerKw) > 0
    ? Math.ceil(Number(input.manualPowerKw) / 50) * 50
    : 0;
  const powerKw = manualPower || estimatedPower;
  const gasTariff = clamp(input.gasTariff || 8, 0.01, 1000);
  const electricityTariff = clamp(input.electricityTariff || 6, 0.01, 1000);
  const hours = clamp(input.hours || 3000, 100, 8760);
  const boilers = selectBoilers(powerKw);
  const annualUsefulKwh = powerKw * hours;
  const premiumGasM3 = annualUsefulKwh / (9.5 * 1.05);
  const premiumAnnualCost = premiumGasM3 * gasTariff;
  const baselineAnnualCost = input.scenario === 'electric'
    ? (annualUsefulKwh / 0.99) * electricityTariff
    : (annualUsefulKwh / (9.5 * 0.92)) * gasTariff;
  const annualSavings = Math.max(0, baselineAnnualCost - premiumAnnualCost);
  const paybackYears = annualSavings > 0 ? boilers.totalPrice / annualSavings : null;
  const fullLoadGasM3h = powerKw / (9.5 * 1.05);
  return {
    area,
    culture: input.culture || 'Томаты',
    powerKw,
    isManualPower: Boolean(manualPower),
    boilers,
    annualUsefulKwh,
    premiumAnnualCost,
    baselineAnnualCost,
    annualSavings,
    paybackYears,
    co2DemandM3h: [area * 90, area * 135],
    cooledGasSupplyM3h: powerKw * 0.21,
    co2ProductionKgh: fullLoadGasM3h * 1.8,
    yieldRangePercent: [20, 40],
    includesCropRevenue: false,
    includesFullComplexCapex: false,
    assumptions: { gasLhvKwhM3: 9.5, premiumEfficiency: 1.05, gasBaselineEfficiency: 0.92, electricEfficiency: 0.99, hours },
  };
}

function formatMoney(value) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₽';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MODEL_PRICES, selectBoilers, calculateEconomics, formatMoney };
}
```

- [ ] **Step 4: Run the calculator tests**

Run: `node --test tests/calculator.test.cjs`

Expected: 5 tests PASS.

- [ ] **Step 5: Commit the calculator core**

```powershell
git add script.js tests/calculator.test.cjs
git commit -m "feat: add Premium-E economics calculator"
```

### Task 2: Оптимизированные фотографии котлов

**Files:**
- Create: `scripts/optimize_images.py`
- Create: `assets/boilers/*.webp`
- Preserve: `assets/logo.webp`

**Interfaces:**
- Produces responsive 960 px and 1600 px WebP variants named `e4000-01`, `e4000-02`, `e6000-01`…`e7000-05`.
- Hero source: `Premium E - 7000.3.jpg`; vertical engineering card: `Premium E - 7000.5.jpg`.

- [ ] **Step 1: Add the deterministic image optimizer**

```python
from pathlib import Path
from PIL import Image, ImageOps

SOURCES = {
    "e7000-01": Path(r"E:/YandexDisk/Фотокамера/Завод/Premium E - 7000 (07_10_2025)/Premium E - 7000.3.jpg"),
    "e7000-02": Path(r"E:/YandexDisk/Фотокамера/Завод/Premium E - 7000 (07_10_2025)/Premium E - 7000.4.jpg"),
    "e7000-03": Path(r"E:/YandexDisk/Фотокамера/Завод/Premium E - 7000 (07_10_2025)/Premium E - 7000.5.jpg"),
    "e7000-04": Path(r"E:/YandexDisk/Фотокамера/Завод/Premium E - 7000 (07_10_2025)/Premium E - 7000.30.jpg"),
    "e7000-05": Path(r"E:/YandexDisk/Фотокамера/Завод/Premium E - 7000 (07_10_2025)/Premium E - 7000.jpg"),
    "e6000-01": Path(r"E:/YandexDisk/Фотокамера/Завод/Premium E - 6000/Premium E - 6000.2.jpg"),
    "e6000-02": Path(r"E:/YandexDisk/Фотокамера/Завод/Premium E - 6000/Premium E - 6000.3.jpg"),
    "e6000-03": Path(r"E:/YandexDisk/Фотокамера/Завод/Premium E - 6000/Premium E.jpg"),
    "e4000-01": Path(r"E:/YandexDisk/Фотокамера/Завод/Premium E - 4000/Premium E - 4000.1.jpg"),
    "e4000-02": Path(r"E:/YandexDisk/Фотокамера/Завод/Premium E - 4000/Premium E - 4000.2.jpg"),
}

OUT = Path(__file__).resolve().parents[1] / "assets" / "boilers"
OUT.mkdir(parents=True, exist_ok=True)

for stem, source in SOURCES.items():
    if not source.exists():
        raise FileNotFoundError(source)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        for width in (960, 1600):
            if image.width <= width:
                resized = image.copy()
            else:
                height = round(image.height * width / image.width)
                resized = image.resize((width, height), Image.Resampling.LANCZOS)
            resized.save(OUT / f"{stem}-{width}.webp", "WEBP", quality=82, method=6)
```

- [ ] **Step 2: Generate the assets with the bundled Python runtime**

Run:

```powershell
& 'C:/Users/Алексей/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' scripts/optimize_images.py
```

Expected: 20 WebP files in `assets/boilers`; each file is non-empty and no 1600 px variant exceeds 500 KB.

- [ ] **Step 3: Verify dimensions and sizes**

```powershell
& 'C:/Users/Алексей/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' -c "from pathlib import Path; from PIL import Image; fs=list(Path('assets/boilers').glob('*.webp')); assert len(fs)==20; [(lambda im: (im.verify(), None))(Image.open(f)) for f in fs]; assert all(f.stat().st_size < 512000 for f in fs); print('20 images OK')"
```

Expected: `20 images OK`.

- [ ] **Step 4: Commit optimized assets**

```powershell
git add scripts/optimize_images.py assets/boilers
git commit -m "assets: optimize Premium-E boiler photography"
```

### Task 3: Семантическая страница и визуальная система

**Files:**
- Replace: `index.html`
- Create: `styles.css`
- Create: `tests/content.test.cjs`
- Delete: `.image-slots.state.json`

**Interfaces:**
- Section IDs: `top`, `economics`, `calculator`, `scheme`, `physics`, `season`, `package`, `automation`, `service`, `factory`, `faq`, `request`, `print-calc`.
- Calculator controls: `calc-area`, `calc-manual-power`, `calc-gas`, `calc-electricity`, `calc-hours`, `calc-scenario`; output container: `calc-results`.
- Form names: `name`, `phone`, `email`, `culture`, `object`, `model`, `scenario`, `economy`, `comment`, `consent`, `website`.

- [ ] **Step 1: Write content contract tests before replacing the page**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

test('contains every required product-tool section', () => {
  for (const id of ['economics', 'calculator', 'scheme', 'physics', 'season', 'package', 'automation', 'service', 'factory', 'faq', 'request', 'print-calc']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test('contains hard technical claims and Russian standards', () => {
  for (const text of ['удлинённая топка', '09Г2С', 'Ст20', 'ГОСТ Р ЕН 676-2014', 'ГОСТ Р 51383-2012', 'ГОСТ Р 50831-95']) {
    assert.ok(html.includes(text), text);
  }
});

test('has no forbidden content term', () => {
  const forbidden = ['гофрированн' + 'ая', 'P265GH', 'P275NH', 'EN 10028'];
  for (const term of forbidden) assert.ok(!(`${html}\n${css}\n${script}`).includes(term), term);
});

test('points metadata and form to teplica7', () => {
  assert.ok(html.includes('https://prgz.ru/teplica7/'));
  assert.match(html, /action=["']handler\.php["']/);
  assert.match(html, /name=["']consent["']/);
});
```

- [ ] **Step 2: Run the content test and verify it fails**

Run: `node --test tests/content.test.cjs`

Expected: FAIL because `styles.css` and the new section contract do not exist.

- [ ] **Step 3: Replace the packed document with semantic HTML**

Use this exact document shell and populate every listed section with the approved Russian copy and inline SVG diagrams:

```html
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Тепличные котлы Premium-E — тепло и CO₂-подкормка</title>
  <meta name="description" content="Подбор тепличного котла Premium-E, расчёт окупаемости, CO₂-подкормка и комплекс под ключ от завода Премиум Газ.">
  <link rel="canonical" href="https://prgz.ru/teplica7/">
  <link rel="icon" type="image/webp" href="assets/logo.webp">
  <link rel="stylesheet" href="styles.css">
  <script src="script.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">К содержанию</a>
  <header id="top" class="site-header"></header>
  <nav class="breadcrumbs" aria-label="Хлебные крошки"></nav>
  <main id="main">
    <section class="hero"></section>
    <section class="threats"></section>
    <section id="economics"></section>
    <section id="calculator"></section>
    <section id="scheme"></section>
    <section id="physics"></section>
    <section id="season"></section>
    <section id="package"></section>
    <section id="automation"></section>
    <section id="service"></section>
    <section id="factory"></section>
    <section id="faq"></section>
    <section id="request"></section>
  </main>
  <footer class="site-footer"></footer>
  <section id="print-calc" aria-hidden="true"></section>
</body>
</html>
```

The completed page must include:

- Factory header, breadcrumbs and three modification tabs with real catalog links and no future-state badges.
- Hero photo `e7000-01` with three accessible hotspot buttons and four metric cards.
- Threat cards: NOx 125 vs 7 mg/m³, hot gas risk, ethylene risk.
- Calculator controls and output cards for model, price, annual savings, payback, CO₂ flow and yield range.
- Full-width interactive SVG process axis with burner, boiler, condenser, mixer, greenhouse, blue return water and stack bypass.
- Condensation curve 120 → 57–59 → 50 °C and return water 35–40 °C.
- Summer/winter switch, package selector, safety mode, CO₂ dosing matrix, dual-loop automation, condensate chain and service timeline.
- Factory gallery using all three product families and the existing seven manufacturing photographs.
- Updated FAQ with dosing, condensate, service, burner life and regulation answers.
- Request form and print-only calculation.

- [ ] **Step 4: Implement the visual tokens and responsive layout in `styles.css`**

```css
:root {
  --bg: #f4f7f0;
  --surface: #ffffff;
  --ink: #172119;
  --muted: #667269;
  --line: #dce5d8;
  --green: #1f5a33;
  --green-2: #2e7d46;
  --green-soft: #eaf3e6;
  --heat: #dc5f2b;
  --heat-soft: #fff0e8;
  --water: #2563a8;
  --water-soft: #eaf2fb;
  --radius: 24px;
  --shadow: 0 22px 70px rgba(26, 58, 36, .09);
  --container: min(1220px, calc(100vw - 40px));
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: "Golos Text", system-ui, sans-serif; }
img, svg { display: block; max-width: 100%; }
button, input, select, textarea { font: inherit; }
.container { width: var(--container); margin-inline: auto; }
.section { padding: clamp(72px, 9vw, 128px) 0; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); }
.mono { font-variant-numeric: tabular-nums; font-family: "IBM Plex Mono", ui-monospace, monospace; }

@media (max-width: 820px) {
  :root { --container: min(100% - 28px, 720px); --radius: 20px; }
  .section { padding: 64px 0; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
}

@media print {
  body > :not(#print-calc) { display: none !important; }
  #print-calc { display: block !important; color: #000; background: #fff; }
}
```

Complete the stylesheet with desktop and mobile grids, sticky header, controls, result cards, hotspot placement, SVG animation classes, gallery, timeline, form, focus-visible states and print layout. Do not add decorative rainbow gradients.

- [ ] **Step 5: Remove the packed image state and run content tests**

Run:

```powershell
Remove-Item -LiteralPath .image-slots.state.json
node --test tests/calculator.test.cjs tests/content.test.cjs
```

Expected: all tests PASS.

- [ ] **Step 6: Commit semantic page and styles**

```powershell
git add index.html styles.css tests/content.test.cjs .image-slots.state.json
git commit -m "feat: rebuild teplica7 product landing"
```

### Task 4: Интерактивы, калькулятор и форма

**Files:**
- Modify: `script.js`
- Modify: `tests/calculator.test.cjs`
- Modify: `tests/content.test.cjs`

**Interfaces:**
- `renderCalculator()` maps `calculateEconomics()` to `[data-result]` elements and hidden form fields.
- `activateProcessNode(id)`, `setSeason(mode)`, `setTier(id)`, `updateCo2Dosing()` and `submitRequest(form)` drive independent UI units.

- [ ] **Step 1: Add tests for boundaries and form contracts**

```js
test('uses manual power and clamps annual hours', () => {
  const result = calculateEconomics({ area: 1, manualPowerKw: 3875, hours: 9999, gasTariff: 8, electricityTariff: 6, scenario: 'gas' });
  assert.equal(result.powerKw, 3900);
  assert.equal(result.assumptions.hours, 8760);
  assert.equal(result.boilers.label, 'Premium E-4000');
});

test('page exposes every calculator and form field', () => {
  for (const id of ['calc-area', 'calc-manual-power', 'calc-gas', 'calc-electricity', 'calc-hours', 'calc-scenario', 'calc-results']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  for (const name of ['name', 'phone', 'email', 'culture', 'object', 'model', 'scenario', 'economy', 'comment', 'consent', 'website']) {
    assert.match(html, new RegExp(`name=["']${name}["']`));
  }
});
```

- [ ] **Step 2: Run tests and verify the new assertions fail**

Run: `node --test tests/*.test.cjs`

Expected: FAIL until the controls and interaction layer are present.

- [ ] **Step 3: Add guarded DOM initialization to `script.js`**

```js
function byId(id) { return document.getElementById(id); }

function initPage() {
  const form = byId('calculator-form');
  const requestForm = byId('request-form');
  const renderCalculator = () => {
    const result = calculateEconomics({
      area: byId('calc-area').value,
      culture: document.querySelector('[name="calc-culture"]:checked').value,
      manualPowerKw: byId('calc-manual-power').value,
      gasTariff: byId('calc-gas').value,
      electricityTariff: byId('calc-electricity').value,
      hours: byId('calc-hours').value,
      scenario: byId('calc-scenario').value,
    });
    document.querySelector('[data-result="model"]').textContent = result.boilers.label;
    document.querySelector('[data-result="price"]').textContent = formatMoney(result.boilers.totalPrice);
    document.querySelector('[data-result="savings"]').textContent = formatMoney(result.annualSavings) + '/год';
    document.querySelector('[data-result="payback"]').textContent = result.paybackYears ? result.paybackYears.toFixed(1).replace('.', ',') + ' года' : '—';
    document.querySelector('[data-result="co2"]').textContent = `${Math.round(result.co2DemandM3h[0])}–${Math.round(result.co2DemandM3h[1])} м³/ч`;
    requestForm.elements.object.value = `${result.area} га · ${result.powerKw} кВт`;
    requestForm.elements.model.value = result.boilers.label;
    requestForm.elements.scenario.value = byId('calc-scenario').selectedOptions[0].textContent;
    requestForm.elements.economy.value = `${formatMoney(result.annualSavings)}/год · ${result.paybackYears ? result.paybackYears.toFixed(1) + ' года' : '—'}`;
    window.teplicaCalculation = result;
  };
  form.addEventListener('input', renderCalculator);
  form.addEventListener('change', renderCalculator);
  renderCalculator();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initPage);
}
```

Extend `initPage()` with:

- click and keyboard activation for process nodes and hotspot buttons;
- summer/winter panels and package tier/safety highlighting;
- CO₂ setpoint calculation from growth phase, light and vent position;
- FAQ accordion with `aria-expanded` and hidden panels;
- IntersectionObserver reveals and counters with reduced-motion fallback;
- `window.print()` after refreshing the print calculation;
- form prefill, validation, fetch POST, pending/success/error states and echoed object parameters.

- [ ] **Step 4: Run all tests**

Run: `node --test tests/*.test.cjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit interactions**

```powershell
git add script.js index.html tests
git commit -m "feat: add interactive engineering tools"
```

### Task 5: PHP handler and repository documentation

**Files:**
- Modify: `handler.php`
- Modify: `README.md`
- Create: `tests/handler.test.cjs`

**Interfaces:**
- POST response: JSON `{ "ok": true }` or `{ "ok": false, "error": "code" }`.
- New mail fields: model, scenario and economy; canonical page changes from `teplica6` to `teplica7`.

- [ ] **Step 1: Write static handler tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const php = fs.readFileSync('handler.php', 'utf8');

test('handler targets teplica7 and keeps PHP 5.6-compatible syntax', () => {
  assert.ok(php.includes('https://prgz.ru/teplica7/'));
  assert.ok(!php.includes('teplica6'));
  assert.ok(!php.includes('??'));
  assert.ok(!php.includes('fn('));
});

test('handler captures calculator context and retains bot trap', () => {
  for (const field of ['model', 'scenario', 'economy', 'website']) {
    assert.ok(php.includes(`field('${field}')`));
  }
  assert.ok(php.includes("$to = 'premium-gas@mail.ru';"));
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/handler.test.cjs`

Expected: FAIL because the handler still points to `teplica6` and lacks new fields.

- [ ] **Step 3: Update `handler.php`**

Add after the current object extraction:

```php
$model = clipped(field('model'), 180);
$scenario = clipped(field('scenario'), 180);
$economy = clipped(field('economy'), 240);
```

Change subject and source page to `teplica7`, and add these lines to the email body:

```php
'Подбор котлов: ' . ($model !== '' ? $model : '—'),
'Сценарий: ' . ($scenario !== '' ? $scenario : '—'),
'Ориентировочная экономика: ' . ($economy !== '' ? $economy : '—'),
```

Keep the honeypot success no-op, validation, CRLF headers, UTF-8 subject and recipient unchanged.

- [ ] **Step 4: Rewrite `README.md` with production and verification commands**

Document `teplica7`, the file map, calculator assumptions, price source date, image regeneration command, `node --test tests/*.test.cjs`, Beget path, form recipient and the rule that credentials remain outside Git.

- [ ] **Step 5: Run all tests and a repository scan**

Run:

```powershell
node --test tests/*.test.cjs
rg -n -i 'teplica6|P265GH|P275NH|EN 10028' index.html styles.css script.js handler.php README.md
git diff --check
```

Expected: tests PASS; scan returns no stale URL, placeholders or forbidden materials; `git diff --check` is clean.

- [ ] **Step 6: Commit handler and docs**

```powershell
git add handler.php README.md tests/handler.test.cjs
git commit -m "feat: connect teplica7 request workflow"
```

### Task 6: Local QA, GitHub and Beget deployment

**Files:**
- Create: `qa/` screenshots locally but do not commit them unless needed for a defect record.
- Modify only files that fail QA.

**Interfaces:**
- Local URL: `http://127.0.0.1:4173/`.
- Production URL: `https://prgz.ru/teplica7/`.
- Production honeypot POST verifies the PHP endpoint without sending an email.

- [ ] **Step 1: Run the complete automated suite**

```powershell
node --test tests/*.test.cjs
git diff --check
git status --short --branch
```

Expected: all tests PASS, clean diff check, only intentional files changed.

- [ ] **Step 2: Start a local static server**

```powershell
& 'C:/Users/Алексей/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' -m http.server 4173 --bind 127.0.0.1
```

Expected: `Serving HTTP on 127.0.0.1 port 4173`.

- [ ] **Step 3: Perform visual and interaction QA**

At 1440×900, 768×1024 and 390×844 verify:

- header, hero crop and hotspots;
- no horizontal overflow;
- calculator default, E-2500 selection at 2.4 ha and 2×E-6000 at manual 11 MW;
- scenario toggle changes annual savings/payback;
- process cards, CO₂ matrix, season and package switches;
- FAQ keyboard behavior;
- form prefill and client validation;
- print preview contains current model, price, tariffs and assumptions;
- reduced motion disables animated streams and reveal transitions.

Save screenshots outside tracked files or under ignored `qa/`.

- [ ] **Step 4: Fix any QA defects and rerun Steps 1–3**

Do not proceed with known clipping, overlap, broken controls, missing images or console errors.

- [ ] **Step 5: Commit the verified release and push**

```powershell
git add index.html styles.css script.js handler.php README.md assets scripts tests docs
git commit -m "release: publish teplica7 greenhouse tool"
git push origin teplica7
```

If the final QA fixes are already included in previous commits and the worktree is clean, skip the empty release commit and push existing commits.

- [ ] **Step 6: Upload the verified file set to Beget**

Upload exactly these production paths to `prgz.ru/public_html/teplica7` using the authorized Beget account:

```text
index.html
styles.css
script.js
handler.php
assets/logo.webp
assets/boilers/*.webp
uploads/*
```

Exclude `.git`, `docs`, `tests`, `scripts`, `.image-slots.state.json`, source JPG files outside the repository and local QA artifacts.

- [ ] **Step 7: Verify production without generating a real lead**

```powershell
$page = Invoke-WebRequest -UseBasicParsing -Uri 'https://prgz.ru/teplica7/'
if ($page.StatusCode -ne 200) { throw 'page_failed' }
$bot = Invoke-RestMethod -Method Post -Uri 'https://prgz.ru/teplica7/handler.php' -Body @{website='bot-check'}
if (-not $bot.ok) { throw 'handler_failed' }
```

Then repeat desktop and mobile smoke checks against production, verify every photo returns 200, check that metadata points to `teplica7`, and confirm no mixed-content or console errors.

- [ ] **Step 8: Final repository and deployment audit**

```powershell
git status --short --branch
git log -6 --oneline --decorate
git ls-remote --heads origin teplica7
```

Expected: clean worktree, local and remote `teplica7` at the same commit, production HTTP 200, calculator interactive and honeypot POST successful.
