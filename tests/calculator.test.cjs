const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MODEL_PRICES,
  selectBoilers,
  calculateEconomics,
  calculateCo2Setpoint,
} = require('../script.js');

const defaults = {
  area: 1,
  culture: 'Томаты',
  manualPowerKw: 0,
  gasTariff: 8,
  electricityTariff: 6,
  hours: 3000,
  scenario: 'gas',
};

test('contains the approved 13-model price list', () => {
  assert.equal(MODEL_PRICES.length, 13);
  assert.deepEqual(MODEL_PRICES[0], { powerKw: 1000, price: 2173488.10 });
  assert.deepEqual(MODEL_PRICES.at(-1), { powerKw: 10000, price: 10063547.62 });
});

test('rounds 2.4 ha to 2400 kW and selects E-2500', () => {
  const result = calculateEconomics({ ...defaults, area: 2.4 });

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
    ...defaults,
    scenario: 'electric',
    manualPowerKw: 1000,
  });

  assert.ok(Math.abs(result.annualUsefulKwh - 3000000) < 1);
  assert.ok(Math.abs(result.premiumAnnualCost - 2406015.04) < 1);
  assert.ok(Math.abs(result.baselineAnnualCost - 18181818.18) < 1);
  assert.ok(Math.abs(result.annualSavings - 15775803.14) < 1);
});

test('uses manual power and clamps annual hours', () => {
  const result = calculateEconomics({
    ...defaults,
    manualPowerKw: 3875,
    hours: 9999,
  });

  assert.equal(result.powerKw, 3900);
  assert.equal(result.assumptions.hours, 8760);
  assert.equal(result.boilers.label, 'Premium E-4000');
});

test('keeps yield and CO2 outside monetary payback', () => {
  const result = calculateEconomics({ ...defaults, area: 3, culture: 'Розы' });

  assert.deepEqual(result.yieldRangePercent, [20, 40]);
  assert.equal(result.includesCropRevenue, false);
  assert.equal(result.includesFullComplexCapex, false);
});

test('adjusts CO2 setpoint by growth stage and light', () => {
  assert.equal(calculateCo2Setpoint('young', 60, 0).ppm, 700);
  assert.equal(calculateCo2Setpoint('vegetative', 70, 0).ppm, 900);
  assert.equal(calculateCo2Setpoint('fruiting', 80, 0).ppm, 1300);
});

test('reduces or stops CO2 when ventilation or light makes dosing wasteful', () => {
  assert.equal(calculateCo2Setpoint('fruiting', 80, 15).ppm, 600);
  assert.equal(calculateCo2Setpoint('fruiting', 80, 35).ppm, 0);
  assert.equal(calculateCo2Setpoint('fruiting', 10, 0).ppm, 0);
});
