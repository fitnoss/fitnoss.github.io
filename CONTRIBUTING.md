# Как помочь fitcraft

## Translations

Everything a translator needs lives in [`locales/`](locales). You can do it right in the GitHub web editor, no setup required.

```
locales/
  index.json          ← list of languages
  en/ui.json          ← interface strings (source)
  ru/ui.json
  ru/exercises.json   ← exercise names and steps, keyed by slug
```

**Add a language**

1. Copy `locales/en/ui.json` to `locales/<code>/ui.json` (ISO 639-1 code: `de`, `es`, `uk`…) and translate the values. Keep the keys and `{{placeholders}}`.
2. Add a line to `locales/index.json`: `{ "code": "de", "name": "German", "nativeName": "Deutsch" }`.
3. Optional: create `locales/<code>/exercises.json` with exercise texts — `{ "barbell-full-squat": { "name": "…", "steps": ["…"] } }`. English is used for anything missing, so a partial file is fine.
4. Open a pull request. CI runs `npm run i18n:check`, which lists missing keys and catches typos.

Plural forms follow [i18next rules](https://www.i18next.com/translation-function/plurals): `key_one`, `key_few`, `key_many`, `key_other` depending on the language. The checker tells you which forms your language needs.

**Improve the Russian translation**

Exercise texts in `locales/ru/exercises.json` were machine-translated and carry `"machine": true`. When you fix one, remove that flag — the app stops showing the "machine translation" note for it.

## Упражнения

См. [content/README.md](content/README.md): одно упражнение — одна папка.

## Видео

Видео — это встраивание YouTube, файлов мы не храним. Проверенные ролики лежат в `data/videos.json`:

```json
{ "barbell-full-squat": { "yt": "dQw4w9WgXcQ", "start": 12, "ru": "<id русского ролика>" } }
```

Предложить ролик можно через issue «Suggest a video». Массовый подбор:

```bash
pip install yt-dlp
npm run videos:find -- --limit 50   # кандидаты → data/videos.candidates.json
npm run dev                         # открыть #/dev/videos, выбрать ✓, скачать videos.json
```

Скачанный файл кладётся в `data/videos.json`, затем `npm run data`. Предпочтительные каналы перечислены в `data/video-channels.json`.

## Разработка

```bash
npm install
npm run dev        # при первом запуске сам выполнит npm run data
npm test
npm run build
```

Сгенерированные файлы (`public/data`, `public/img/ex`, `public/locales`) не коммитятся, их собирает `npm run data`.

### Формат ссылок FitPack

`src/features/share/codec/` — свой битовый формат, программа целиком лежит в `#` ссылки. Таблицы версии 1 (повторы, отдых, названия дней) менять нельзя, иначе старые ссылки начнут открываться иначе. Это ловит снапшот-тест. Для новой схемы нужно завести версию 2 и сохранить декодер v1.
