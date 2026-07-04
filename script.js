/* Тепличные котлы Premium-E — production interactivity
   (counters, scroll-reveal with fallback, accordions, form success state) */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anim = !reduce;

  /* --- Hero metric counters (one-shot) --- */
  if (anim) {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (!isFinite(target)) return;
      var dur = 1100, t0 = performance.now();
      var step = function (t) {
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * e));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* --- Scroll-reveal via IntersectionObserver, with safety fallback --- */
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  function reveal(el) {
    var d = parseInt(el.getAttribute('data-delay') || '0', 10);
    el.style.transition = 'opacity .65s ease ' + d + 'ms, transform .65s ease ' + d + 'ms';
    el.classList.add('is-visible');
  }
  if (anim && 'IntersectionObserver' in window && items.length) {
    var ioFired = false;
    var io = new IntersectionObserver(function (ents) {
      ioFired = true;
      ents.forEach(function (en) {
        if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
    // If IO never fires (edge cases), force-reveal everything.
    setTimeout(function () {
      if (!ioFired) { items.forEach(reveal); io.disconnect(); }
    }, 900);
  } else {
    // reduced-motion or no IO support: show immediately
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* --- Accordion helper (single item open at a time within a group) --- */
  function wireAccordion(toggleSel, panelAttr, chevAttr, keyAttr) {
    var toggles = Array.prototype.slice.call(document.querySelectorAll(toggleSel));
    toggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute(keyAttr);
        var panel = document.querySelector('[' + panelAttr + '="' + key + '"]');
        var chev = btn.querySelector('[' + chevAttr + ']');
        var isOpen = panel && panel.classList.contains('open');
        // close all in this group
        toggles.forEach(function (b) {
          var k = b.getAttribute(keyAttr);
          var p = document.querySelector('[' + panelAttr + '="' + k + '"]');
          var c = b.querySelector('[' + chevAttr + ']');
          if (p) p.classList.remove('open');
          if (c) c.classList.remove('open');
        });
        if (!isOpen && panel) {
          panel.classList.add('open');
          if (chev) chev.classList.add('open');
        }
      });
    });
  }

  // FAQ: first item open by default (matches prototype state open:0)
  wireAccordion('.faq-toggle', 'data-panel', 'data-chev', 'data-faq');
  var faqFirstPanel = document.querySelector('[data-panel="0"]');
  var faqFirstChev = document.querySelector('.faq-toggle[data-faq="0"] [data-chev]');
  if (faqFirstPanel) faqFirstPanel.classList.add('open');
  if (faqFirstChev) faqFirstChev.classList.add('open');

  // CO2 spoilers: all closed by default (prototype spOpen:-1)
  wireAccordion('.sp-toggle', 'data-sppanel', 'data-spchev', 'data-sp');

  /* --- Calculation form: POST to handler.php, then show success state --- */
  var form = document.getElementById('calc-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = document.getElementById('form-fields');
      var success = document.getElementById('form-success');
      var btn = form.querySelector('button[type="submit"]');
      var btnText = btn ? btn.textContent : '';

      function showSuccess() {
        if (fields) fields.style.display = 'none';
        if (success) success.style.display = 'flex';
      }
      function showError() {
        if (btn) { btn.disabled = false; btn.textContent = btnText; }
        var err = document.getElementById('form-error');
        if (!err) {
          err = document.createElement('p');
          err.id = 'form-error';
          err.style.cssText = 'grid-column:1 / -1;margin:0;color:#B4231F;font-size:14px;line-height:1.5';
          err.textContent = 'Не удалось отправить заявку. Позвоните нам: 8 (800) 700-51-33.';
          if (btn && btn.parentNode) btn.parentNode.insertBefore(err, btn);
        }
      }

      if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }

      fetch('handler.php', { method: 'POST', body: new FormData(form) })
        .then(function (r) {
          return r.text().then(function (t) {
            var data = null;
            try { data = JSON.parse(t); } catch (e2) { /* non-JSON (e.g. local static preview) */ }
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          // Success if the server said ok:true, or (local preview) returned 2xx non-JSON.
          if ((res.data && res.data.ok) || (res.ok && !res.data)) showSuccess();
          else showError();
        })
        .catch(function () { showError(); });
    });
  }
})();
