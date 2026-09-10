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

function calculateCo2Setpoint(stage, lightPercent, ventPercent) {
  const light = clamp(lightPercent, 0, 100);
  const vent = clamp(ventPercent, 0, 100);

  if (vent > 30) {
    return {
      ppm: 0,
      state: 'stopped',
      explanation: 'Фрамуги открыты более чем на 30%: подкормка остановлена, чтобы не терять газ наружу.',
    };
  }

  if (light < 15) {
    return {
      ppm: 0,
      state: 'stopped',
      explanation: 'Недостаточно света для активного фотосинтеза: подача CO₂ остановлена.',
    };
  }

  if (vent >= 10) {
    return {
      ppm: 600,
      state: 'limited',
      explanation: 'Фрамуги приоткрыты: автоматика снижает уставку до экономичного уровня.',
    };
  }

  const stages = {
    young: { ppm: 700, title: 'После высадки' },
    vegetative: { ppm: 900, title: 'Активная вегетация' },
    fruiting: { ppm: light >= 70 ? 1300 : 1100, title: 'Цветение и плодоношение' },
  };
  const selected = stages[stage] || stages.vegetative;
  const lowLightReduction = light < 40 ? 100 : 0;
  const ppm = Math.max(600, selected.ppm - lowLightReduction);

  return {
    ppm,
    state: 'active',
    explanation: light >= 70
      ? `${selected.title}: высокий свет и закрытая теплица позволяют использовать повышенную уставку.`
      : `${selected.title}: уставка скорректирована по текущей освещённости.`,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MODEL_PRICES,
    selectBoilers,
    calculateEconomics,
    calculateCo2Setpoint,
    formatMoney,
    formatNumber,
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const selectAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const setText = (selector, value) => {
      const element = document.querySelector(selector);
      if (element) element.textContent = value;
    };

    const motion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    function navigateSection(id) {
      const section = document.getElementById(id);
      if (!section) return;
      const heading = section.querySelector('h1,h2') || section;
      heading.tabIndex = -1;
      heading.focus({preventScroll:true});
      section.scrollIntoView({behavior:motion(),block:'start'});
    }
    const menuButton = document.querySelector('.menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    function closeMenu(restoreFocus = false) {
      if (!mobileNav || !menuButton) return;
      mobileNav.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      if (restoreFocus) menuButton.focus();
    }
    menuButton?.addEventListener('click', () => {
      mobileNav.hidden = !mobileNav.hidden;
      menuButton.setAttribute('aria-expanded', String(!mobileNav.hidden));
    });
    mobileNav?.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      if (link.hash) event.preventDefault();
      closeMenu();
      if (link.hash) {
        window.history.pushState(null, '', link.hash);
        navigateSection(link.hash.slice(1));
      }
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && mobileNav && !mobileNav.hidden) closeMenu(true); });
    window.matchMedia('(min-width: 1121px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });

    function openHashDetails() {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      let parent = target?.parentElement;
      let opened = false;
      while (parent) {
        if (parent.tagName === 'DETAILS' && !parent.open) { parent.open = true; opened = true; }
        parent = parent.parentElement;
      }
      if (opened) target.scrollIntoView({behavior:motion(),block:'start'});
    }
    window.addEventListener('hashchange', openHashDetails);
    openHashDetails();

    selectAll('[data-scroll]').forEach((button) => {
      button.addEventListener('click', () => {
        navigateSection(button.dataset.scroll);
      });
    });

    const revealItems = selectAll('[data-reveal]');
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.09, rootMargin: '0px 0px -35px' });
      revealItems.forEach((item) => revealObserver.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    }

    const hotspotContent = {
      furnace: ['01', 'Удлинённая топка', 'Свободное развитие факела и газы около 120 °C на выходе котла.'],
      body: ['02', 'Трёхходовой корпус', 'Три хода дымовых газов и доступ к поверхностям нагрева через фронтальную дверь.'],
      service: ['03', 'Сервисный доступ', 'Разъёмные панели и площадка упрощают плановую ревизию и очистку.'],
    };
    const hotspotCard = document.getElementById('hotspot-card');
    selectAll('[data-hotspot]').forEach((button) => {
      button.addEventListener('click', () => {
        const content = hotspotContent[button.dataset.hotspot];
        if (!content || !hotspotCard) return;
        hotspotCard.querySelector('.hotspot-number').textContent = content[0];
        hotspotCard.querySelector('strong').textContent = content[1];
        hotspotCard.querySelector('p').textContent = content[2];
      });
    });

    const priceTable = document.getElementById('price-table-body');
    if (priceTable) {
      MODEL_PRICES.forEach(({ powerKw, price }) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>Premium E-${powerKw}</td><td class="mono">${formatNumber(powerKw)} кВт</td><td class="mono">${formatMoney(price)}</td>`;
        priceTable.appendChild(row);
      });
    }

    const calculator = document.getElementById('calculator-form');
    let lastCalculation = null;
    const calculatorFields = {
      area: document.getElementById('calc-area'),
      scenario: document.getElementById('calc-scenario'),
      manualPower: document.getElementById('calc-manual-power'),
      gas: document.getElementById('calc-gas'),
      electricity: document.getElementById('calc-electricity'),
      hours: document.getElementById('calc-hours'),
    };
    const validationMessages = {
      area:'Укажите площадь от 0,3 до 50 га с шагом 0,1.',
      manualPower:'Укажите мощность от 0 до 50 000 кВт целым числом или оставьте поле пустым.',
      gas:'Укажите тариф от 0,01 до 1000 ₽/м³, не более двух знаков после запятой.',
      electricity:'Укажите тариф от 0,01 до 1000 ₽/кВт·ч, не более двух знаков после запятой.',
      hours:'Укажите от 100 до 8760 часов целым числом.',
    };
    const requestContext = document.getElementById('request-form');
    ['object','culture'].forEach((name) => requestContext?.elements[name]?.addEventListener('input', (event) => { event.target.dataset.userEdited = 'true'; }));
    function validateCalculation() {
      let valid = true;
      Object.entries(validationMessages).forEach(([name,message]) => {
        const field = calculatorFields[name];
        const invalid = !field.validity.valid;
        let error = document.getElementById(`${field.id}-error`);
        if (!error) {
          error = document.createElement('span');
          error.id = `${field.id}-error`;
          error.className = 'field-error';
          field.closest('label').appendChild(error);
          field.setAttribute('aria-describedby',error.id);
        }
        field.setAttribute('aria-invalid',String(invalid));
        error.hidden = !invalid;
        error.textContent = invalid ? message : '';
        valid = valid && !invalid;
      });
      const status = document.getElementById('calc-validation');
      status.hidden = valid;
      status.textContent = valid ? '' : 'Исправьте исходные данные. Подбор и печать расчёта станут доступны после исправления.';
      selectAll('#calc-results,.calc-cost-line,.calculator-actions').forEach((element) => { element.hidden = !valid; });
      return valid;
    }

    function renderCalculation() {
      if (!calculator) return;
      if (!validateCalculation()) {
        lastCalculation = null;
        document.getElementById('print-calc').dataset.valid = 'false';
        selectAll('[data-print]').forEach((element) => { element.textContent = ''; });
        ['model','scenario','economy'].forEach((name) => { if (requestContext) requestContext.elements[name].value = ''; });
        if (requestContext && !requestContext.elements.object.dataset.userEdited) requestContext.elements.object.value = '';
        return;
      }
      const culture = calculator.querySelector('[name="calc-culture"]:checked')?.value || 'Томаты';
      const result = calculateEconomics({
        area: calculatorFields.area.value,
        culture,
        manualPowerKw: calculatorFields.manualPower.value,
        gasTariff: calculatorFields.gas.value,
        electricityTariff: calculatorFields.electricity.value,
        hours: calculatorFields.hours.value,
        scenario: calculatorFields.scenario.value,
      });
      lastCalculation = result;
      document.getElementById('print-calc').dataset.valid = 'true';
      const demandLow = Math.round(result.co2DemandM3h[0]);
      const demandHigh = Math.round(result.co2DemandM3h[1]);
      const supply = Math.round(result.cooledGasSupplyM3h);
      const payback = result.paybackYears === null ? 'не рассчитывается' : `${formatNumber(result.paybackYears, 1)} года`;
      const scenarioLabel = calculatorFields.scenario.value === 'electric'
        ? 'Электрическое отопление'
        : 'Существующая газовая котельная';
      const scenarioNote = calculatorFields.scenario.value === 'electric'
        ? 'относительно электроотопления с КПД 99%'
        : 'относительно газовой котельной с КПД 92%';

      setText('[data-result="model"]', result.boilers.label);
      setText('[data-result="power"]', `${formatNumber(result.powerKw)} кВт`);
      setText('[data-result="installed"]', `${formatNumber(result.boilers.installedPowerKw)} кВт`);
      setText('[data-result="price"]', formatMoney(result.boilers.totalPrice));
      setText('[data-result="savings"]', `${formatMoney(result.annualSavings)}/год`);
      setText('[data-result="scenario-note"]', scenarioNote);
      setText('[data-result="payback"]', payback);
      setText('[data-result="co2-demand"]', `${formatNumber(demandLow)}–${formatNumber(demandHigh)} м³/ч`);
      setText('[data-result="co2-supply"]', `${formatNumber(supply)} м³/ч`);
      const cultureGenitive = { 'Томаты':'томатов', 'Огурцы':'огурцов', 'Перец':'перца', 'Розы':'роз' };
      setText('[data-result="culture-note"]', `для ${cultureGenitive[culture] || culture.toLowerCase()} · не включено в денежную окупаемость`);
      setText('[data-result="baseline-cost"]', formatMoney(result.baselineAnnualCost));
      setText('[data-result="premium-cost"]', formatMoney(result.premiumAnnualCost));
      setText('[data-result="coverage"]', supply >= demandHigh
        ? 'Охлаждённый поток покрывает расчётную потребность'
        : 'Потребуется проверить баланс CO₂ на проектной нагрузке');

      const requestForm = document.getElementById('request-form');
      if (requestForm) {
        requestForm.elements.model.value = result.boilers.label;
        requestForm.elements.scenario.value = scenarioLabel;
        requestForm.elements.economy.value = `${formatMoney(result.annualSavings)}/год; ${payback}`;
        if (!requestForm.elements.object.dataset.userEdited) requestForm.elements.object.value = `${formatNumber(result.area, 1)} га · ${formatNumber(result.powerKw)} кВт`;
        if (!requestForm.elements.culture.dataset.userEdited) requestForm.elements.culture.value = culture;
      }

      const printValues = {
        date: new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(new Date()),
        object: `${formatNumber(result.area, 1)} га · ${culture}`,
        power: `${formatNumber(result.powerKw)} кВт`,
        model: result.boilers.label,
        price: formatMoney(result.boilers.totalPrice),
        scenario: scenarioLabel,
        savings: `${formatMoney(result.annualSavings)}/год`,
        payback,
        co2: `${formatNumber(demandLow)}–${formatNumber(demandHigh)} м³/ч`,
      };
      Object.entries(printValues).forEach(([key, value]) => setText(`[data-print="${key}"]`, value));
    }

    if (calculator) {
      calculator.addEventListener('submit', (event) => { event.preventDefault(); renderCalculation(); });
      calculator.addEventListener('input', renderCalculation);
      calculator.addEventListener('change', renderCalculation);
      renderCalculation();
    }

    // Revalidate for both the page button and the browser's Ctrl+P command.
    window.addEventListener('beforeprint', renderCalculation);
    document.getElementById('print-calculation')?.addEventListener('click', () => {
      renderCalculation();
      if (lastCalculation) window.print();
    });

    selectAll('[data-to-request]').forEach((button) => {
      button.addEventListener('click', () => navigateSection('request'));
    });

    const processNodes = {
      burner: ['УЗЕЛ 01', 'Газовая горелка', 'Подаёт топливо и воздух в топку. Исполнение горелки подбирают под мощность котла, режим работы и требования к выбросам.', [['Мощность', 'по подбору'], ['Режим', 'модулируемый'], ['Контроль', 'ПЛК']]],
      boiler: ['УЗЕЛ 02', 'Котёл Premium-E', 'Удлинённая топка снижает тепловое напряжение и позволяет факелу развиваться без контакта со стенками.', [['КПД котла', '≥95%'], ['Газы на выходе', '120 °C'], ['Давление', '0,6 МПа']]],
      condenser: ['УЗЕЛ 03', 'Конденсор', 'Холодная вода 35–40 °C охлаждает дымовые газы ниже точки росы и возвращает скрытую теплоту. Обратку котла насосная группа поддерживает выше точки росы.', [['Выход газа', '≈50 °C'], ['Комплекс', 'до 105%'], ['Конденсат', '1,6–1,8 кг/м³']]],
      mixer: ['УЗЕЛ 04', 'Камера смешения', 'Уличный воздух доводит поток до безопасной температуры перед полимерными распределительными линиями.', [['Смесь', '40–45 °C'], ['Управление', 'частотное'], ['Материал до узла', 'сталь']]],
      greenhouse: ['УЗЕЛ 05', 'Теплица', 'Распределительные рукава подают охлаждённый поток к растениям по заявке климатического компьютера.', [['Уставка', '1000–1500 ppm'], ['Поток на 1 га', '90–135 м³/ч'], ['Потенциал', '+20–40%']]],
      stack: ['УЗЕЛ 06', 'Резервный сброс', 'Если газоанализ выходит за допуски, быстродействующий шибер закрывает тепличный тракт.', [['CO', '≤20 мг/м³'], ['NOx', '≤7 мг/м³'], ['Режим', 'fail-safe']]],
    };
    const processDetail = document.getElementById('process-detail');
    function activateProcessNode(node) {
      const content = processNodes[node.dataset.node];
      if (!content || !processDetail) return;
      selectAll('[data-node]').forEach((item) => {
        const active = item.dataset.node === node.dataset.node;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      processDetail.innerHTML = `<div><span class="node-kicker mono">${content[0]}</span><h3>${content[1]}</h3><p>${content[2]}</p></div><dl>${content[3].map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
    }
    selectAll('[data-node]').forEach((node) => {
      node.addEventListener('click', () => activateProcessNode(node));
      node.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activateProcessNode(node);
        }
      });
    });

    const seasons = {
      summer: ['ДЕНЬ · ЛЕТО', 'Котёл работает ради CO₂', 'Охлаждённый газ идёт растениям. Сопутствующее тепло заряжает верх бака до 90–95 °C; излишки отводят сухие градирни.'],
      winter: ['НОЧЬ · ЗИМА', 'Котёл работает ради тепла', 'Накопленное тепло и текущая мощность котла питают контуры теплицы. CO₂-подкормка ночью остановлена.'],
    };
    selectAll('[data-season]').forEach((button) => {
      button.addEventListener('click', () => {
        selectAll('[data-season]').forEach((item) => {
          const active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        const content = seasons[button.dataset.season];
        const copy = document.getElementById('season-copy');
        if (copy) copy.innerHTML = `<span class="mono">${content[0]}</span><h3>${content[1]}</h3><p>${content[2]}</p>`;
        document.querySelector('.mini-greenhouse > span').textContent = button.dataset.season === 'summer' ? 'день' : 'ночь';
        const summer = button.dataset.season === 'summer';
        document.querySelector('.season-flow-co2 span').textContent = summer ? 'CO₂ → теплица' : 'CO₂: подача остановлена';
        document.querySelector('.season-flow-heat span').textContent = summer ? 'тепло → бак' : 'бак → отопление теплицы';
        document.querySelector('.season-diagram').classList.toggle('is-winter', !summer);
      });
    });

    const tierOrder = { base: 1, extended: 2, maximum: 3 };
    const tiers = {
      base: ['Базовая комплектация', 'Котёл, горелка, гидравлика, локальная автоматика и безопасный сброс.'],
      extended: ['Расширенная комплектация', 'Тепло, подготовка CO₂, газоанализ и накопление тепла.'],
      maximum: ['Максимальная комплектация', 'Полный тепличный комплекс с интеграцией климата, градирнями и резервированием.'],
    };
    function activateTier(tier) {
      selectAll('[data-tier]').forEach((item) => {
        const active = item.dataset.tier === tier;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      const enabled = selectAll('[data-component]').filter((component) => {
        const isEnabled = tierOrder[component.dataset.level] <= tierOrder[tier];
        component.classList.toggle('is-disabled', !isEnabled);
        return isEnabled;
      });
      setText('#tier-title', tiers[tier][0]);
      setText('#tier-description', tiers[tier][1]);
      setText('#tier-count', enabled.length);
      document.querySelector('[data-package-request]')?.setAttribute('data-selected-tier', tiers[tier][0]);
    }
    selectAll('[data-tier]').forEach((button) => button.addEventListener('click', () => activateTier(button.dataset.tier)));
    activateTier('extended');

    const safetyToggle = document.getElementById('safety-toggle');
    safetyToggle?.addEventListener('click', () => {
      const active = safetyToggle.getAttribute('aria-pressed') !== 'true';
      safetyToggle.setAttribute('aria-pressed', String(active));
      selectAll('[data-safety]').forEach((item) => item.classList.toggle('is-safety', active));
    });
    document.querySelector('[data-package-request]')?.addEventListener('click', (event) => {
      const requestForm = document.getElementById('request-form');
      const tier = event.currentTarget.dataset.selectedTier || tiers.extended[0];
      if (requestForm) {
        const comment = requestForm.elements.comment;
        const chosen = `Интересует: ${tier}.`;
        const previous = comment.dataset.generatedTier || '';
        comment.value = previous && comment.value.includes(previous)
          ? comment.value.replace(previous, chosen)
          : [comment.value.trim(), chosen].filter(Boolean).join('\n');
        comment.dataset.generatedTier = chosen;
      }
      navigateSection('request');
    });

    const stageInput = document.getElementById('co2-stage');
    const lightInput = document.getElementById('co2-light');
    const ventInput = document.getElementById('co2-vent');
    function renderCo2() {
      if (!stageInput || !lightInput || !ventInput) return;
      const result = calculateCo2Setpoint(stageInput.value, lightInput.value, ventInput.value);
      setText('#light-value', `${lightInput.value}%`);
      setText('#vent-value', `${ventInput.value}%`);
      setText('#co2-setpoint', formatNumber(result.ppm));
      setText('#co2-explanation', result.explanation);
      document.getElementById('setpoint-marker')?.style.setProperty('--position', `${Math.min(100, (result.ppm / 1500) * 100)}%`);
    }
    [stageInput, lightInput, ventInput].forEach((input) => {
      input?.addEventListener('input', renderCo2);
      input?.addEventListener('change', renderCo2);
    });
    renderCo2();

    const requestForm = document.getElementById('request-form');
    requestForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = document.getElementById('form-status');
      const submit = requestForm.querySelector('[type="submit"]');
      if (!requestForm.reportValidity()) return;
      submit.disabled = true;
      status.className = 'form-status';
      status.textContent = 'Отправляем заявку…';
      try {
        const response = await fetch(requestForm.action, { method: 'POST', body: new FormData(requestForm), headers: { Accept: 'application/json' } });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'send_failed');
        status.className = 'form-status is-success';
        status.textContent = 'Заявка отправлена. Инженер свяжется с вами.';
        requestForm.reset();
        ['object','culture'].forEach((name) => { delete requestForm.elements[name].dataset.userEdited; });
        delete requestForm.elements.comment.dataset.generatedTier;
        if (lastCalculation) renderCalculation();
      } catch (error) {
        status.className = 'form-status is-error';
        const errors = {
          preview_only: 'Это просмотр новой версии. Заявки здесь не отправляются. Свяжитесь с заводом: 8 (800) 700-51-33.',
          invalid_phone: 'Проверьте телефон: укажите не менее 10 цифр.',
          invalid_email: 'Проверьте адрес электронной почты.',
          required_fields: 'Укажите имя, телефон и согласие на обработку данных.',
        };
        status.textContent = errors[error.message] || 'Не удалось отправить. Данные сохранены в форме. Позвоните 8 (800) 700-51-33.';
      } finally {
        submit.disabled = false;
      }
    });
    document.body.classList.add('app-ready');
  });
}
