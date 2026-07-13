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
  let model = null;

  while (!model) {
    const perUnit = required / count;
    model = MODEL_PRICES.find((item) => item.powerKw >= perUnit) || null;
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
    assumptions: {
      gasLhvKwhM3: 9.5,
      premiumEfficiency: 1.05,
      gasBaselineEfficiency: 0.92,
      electricEfficiency: 0.99,
      hours,
    },
  };
}

function formatMoney(value) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₽';
}

function formatNumber(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits }).format(value);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MODEL_PRICES,
    selectBoilers,
    calculateEconomics,
    formatMoney,
    formatNumber,
  };
}

