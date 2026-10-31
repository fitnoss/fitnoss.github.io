# Свои упражнения

Каждое упражнение лежит в отдельной папке `content/exercises/<slug>/`. Положили папку, запустили `npm run data`, и упражнение появилось везде: в каталоге, поиске, фильтрах, программах, ссылках, тренировках и офлайн-кэше.

```
content/exercises/
  _template/            ← образец, его можно копировать (папки с _ игнорируются)
  dead-hang/
    exercise.json       ← метаданные + тексты на всех языках + видео
    0.jpg               ← фото (необязательно): 0 — начало движения, 1 — конец
    1.jpg
```

## Как добавить

```bash
npm run new-exercise -- archer-pull-up
```

1. Заполните `content/exercises/archer-pull-up/exercise.json`.
2. Положите рядом фото `0.jpg` и `1.jpg`: jpg, png, webp или avif, любой размер, скрипт сам сожмёт их в webp (превью 360px и полный размер до 1000px). Без фото будет показана заглушка. Два кадра в каталоге автоматически превращаются в анимацию.
3. Запустите `npm run data`. Скрипт проверит файл и выдаст упражнению **постоянный номер** в `data/id-map.json`.
4. Закоммитьте папку и `data/id-map.json`. CI упадёт, если номер не закоммичен.

## exercise.json

| Поле | Обязательно | Значения |
|---|---|---|
| `category` | да | `strength`, `stretching`, `plyometrics`, `powerlifting`, `olympic weightlifting`, `strongman`, `cardio` |
| `level` | да | `beginner`, `intermediate`, `expert` |
| `equipment` | да | `body`, `dumbbell`, `barbell`, `kettlebell`, `bands`, `cable`, `machine`, `ezbar`, `medball`, `fitball`, `foamroll`, `pullupbar`, `parallelbars`, `rings`, `suspension`, `bench`, `plate`, `other` |
| `equipmentExtra` | нет | дополнительные обязательные предметы из того же списка; например, `["bands"]` для подтягиваний на турнике с резинкой |
| `primary` | да | мышцы: `abdominals`, `abductors`, `adductors`, `biceps`, `calves`, `chest`, `forearms`, `glutes`, `hamstrings`, `lats`, `lower back`, `middle back`, `neck`, `quadriceps`, `shoulders`, `traps`, `triceps` |
| `secondary` | нет | те же мышцы |
| `mechanic` | нет | `compound`, `isolation` |
| `force` | нет | `push`, `pull`, `static` |
| `places` | нет | `home`, `bars`, `dumbbell`, `kettlebell`, `bands`, `gym`. Если не указать, место определится по инвентарю и названию |
| `video` | нет | `{ "yt": "<11 символов id>", "start": 5, "end": 40, "ru": "<id русского ролика>" }` |
| `i18n` | да | `{ "en": { "name", "steps": [] }, "ru": { … }, … }`. Английский обязателен, остальные языки по желанию |

Название папки (slug) становится адресом страницы: `#/ex/archer-pull-up`. Переименовывать папку после публикации нельзя, иначе у старой папки останется номер, а новая получит другой.

## Почему номера постоянные

Ссылка на программу хранит не названия, а номера упражнений, так она остаётся короткой. Файл `data/id-map.json` только дописывается: номер упражнения никогда не меняется, поэтому старые ссылки продолжают открываться, сколько бы упражнений ни добавилось. Удалённое упражнение тоже сохраняет свой номер: в старой ссылке оно будет показано как «неизвестное упражнение».

Первые 64 номера (самые популярные упражнения) занимают в ссылке 7 бит, следующие 256 — 10 бит, до 1344 — 13 бит, до 5440 — 16 бит. Дальше длина растёт плавно и без ограничений.

## Правки чужих упражнений

Собственные фото для упражнения из free-exercise-db положите в `content/images/<slug>/` и укажите их в `data/overrides.json`:

```json
{ "Kettlebell_Halo": { "images": ["kettlebell-halo/0.jpg"] } }
```

Пути считаются от `content/images/`. Порядок в массиве задаёт порядок кадров. Эти файлы заменяют изображения источника и пересобираются при каждом запуске `npm run data`. Источник, автора и условия использования добавьте в `THIRD_PARTY_NOTICES.md`. Для своих упражнений фото по-прежнему лежат рядом с `exercise.json`.

Упражнения из [free-exercise-db](https://github.com/yuhonas/free-exercise-db) правятся в `data/overrides.json` по их исходному id:

```json
{ "Pullups": { "equipment": "pullupbar", "places": ["bars", "gym"] }, "Some_Exercise": { "hide": true } }
```

Видео к ним — в `data/videos.json` по slug (см. CONTRIBUTING.md → «Видео»). Переводы — в `locales/<язык>/exercises.json`.
