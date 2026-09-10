# Premium-E для тепличных комбинатов

Единый сайт для подбора тепличного комплекса Premium-E с заводской визуальной подачей.

**Последняя версия для просмотра: 2026.09.10.1 от 10.09.2026.** Работа выполнена OpenAI Codex (GPT-6).
Статус: `PASSED_LOCAL / design-review`. Дата и автор также записаны в `version.json`.
Рабочие страницы автоматически не заменены. Production URL ниже относится к предыдущей опубликованной версии.

Изучены teplica6, teplica7 и основной kotelpremium.ru. Применены Anthropic frontend-design и Vercel web-design-guidelines. Преобладающее направление, выбранное заказчиком: завод и технологичность. Сохранены все фотографии, расчётные формулы и инженерные разделы; изменены композиция, оформление, порядок разделов и мобильное взаимодействие.

- [Решения по дизайну](docs/design-2026-09-10.md)
- [Исследование навыков на GitHub и источники](docs/research/frontend-skills-2026-09-10.md)
- [Подробные результаты проверки](docs/QA-2026-09-10.md)

## Локальный просмотр

```powershell
node scripts/preview.cjs
```

Откройте `http://127.0.0.1:4178/`. Локальный сервер не исполняет PHP, не отправляет заявки и не выдаёт исходный код PHP. Для рабочей эксплуатации сохранён существующий серверный обработчик.

- Production URL: <https://prgz.ru/teplica7/>
- Hosting path: `prgz.ru/public_html/teplica7`
- Form recipient: `premium-gas@mail.ru`
- Runtime: standalone HTML plus a PHP 5.6-compatible form handler

## Files

- `index.html` — структура и содержание лендинга.
- `styles.css` — адаптивная визуальная система и печатная версия расчёта.
- `industrial.css` — визуальная система заводской редакции 2026.09.10.1; использует контракты базовых компонентов.
- `script.js` — калькулятор, интерактивные схемы и форма заявки.
- `assets/logo.webp` — optimized organization logo used in the sticky header.
- `assets/boilers/` — responsive WebP-фотографии котлов Premium E.
- `assets/production/` — облегчённые WebP-фотографии этапов производства.
- `uploads/` — фотографии этапов производства.
- `handler.php` — validated server-side email delivery for the request form.

## Проверка

```powershell
node --test tests/*.test.cjs
node scripts/validate-page.cjs
node --check script.js
```

Hosting credentials are intentionally not stored in this repository.
