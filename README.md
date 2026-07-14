# Premium-E для тепличных комбинатов

Интерактивный продуктовый лендинг для подбора тепличного комплекса Premium-E.

- Production URL: <https://prgz.ru/teplica7/>
- Hosting path: `prgz.ru/public_html/teplica7`
- Form recipient: `premium-gas@mail.ru`
- Runtime: standalone HTML plus a PHP 5.6-compatible form handler

## Files

- `index.html` — структура и содержание лендинга.
- `styles.css` — адаптивная визуальная система и печатная версия расчёта.
- `script.js` — калькулятор, интерактивные схемы и форма заявки.
- `assets/logo.webp` — optimized organization logo used in the sticky header.
- `assets/boilers/` — responsive WebP-фотографии котлов Premium E.
- `assets/production/` — облегчённые WebP-фотографии этапов производства.
- `uploads/` — фотографии этапов производства.
- `handler.php` — validated server-side email delivery for the request form.

## Проверка

```powershell
node --test tests/*.test.cjs
```

Hosting credentials are intentionally not stored in this repository.
