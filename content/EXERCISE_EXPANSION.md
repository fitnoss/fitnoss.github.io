# Расширение каталога упражнений

Исследование от 31 октября 2026. Пользователь выбрал расширение всех направлений примерно поровну. На момент исходного исследования в приложении было **880 упражнений**.

**Первая партия импортирована:** 88 добавлений, 38 отклонений, текущий каталог — **968 упражнений**. [Результаты и причины отклонения](research/EXPANSION_BATCH_1.md). Новые определения пока без фото.

## Что сейчас покрыто

Силовые — 587, растяжка — 123, плиометрика — 62, пауэрлифтинг — 38, тяжёлая атлетика — 35, стронгмен — 21, кардио — 14. По основному инвентарю: штанга — 170, гантели — 123, блоки — 81, тренажёры — 68, гири — 56, резинки — 20, турник — 19, петли — 6, кольца и брусья — по 3. Эти разрезы нельзя складывать: категория и инвентарь описывают одни и те же записи.

## Источники и права

- [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset/tree/7455efae41b330c265e7cd4b78dfa848e7ce5ebd): фактически скачано **1324 записи**. Метаданные и переводы под MIT; лицензия сохранена [рядом](research/LICENSE-exercises-dataset.txt). Фото и GIF — отдельные материалы Gym visual, MIT их не покрывает. В очередь скопированы только названия, идентификаторы и инвентарь.
- [OpenBody Registry](https://github.com/openbody/openbody-registry/tree/66660efd17364be3e9700997a398a208738403ee): фактически скачано **829 записей**, данные под CC0-1.0. **656** записей отмечены самим источником как производные от уже используемой free-exercise-db; их не брали в очередь расширения. Сравнили остальные **173**. Инструкций и изображений здесь нет.
- [wger](https://github.com/wger-project/wger): дополнительный источник с лицензиями на уровне записей и изображений. Публичный сайт/API при проверке возвращал защитную страницу; содержимое в очередь не импортировано. При отдельном импорте понадобятся автор и лицензия каждой записи и каждого изображения.
- [RepDB](https://github.com/RepDB/exercise-dataset/blob/main/LICENSE-DATA.md): разрешает использование внутри приложений с атрибуцией, но ограничивает перепубликацию базы и производных датасетов. Для открытого репозитория с каталогом это требует отдельного решения; в очередь не копировали.
- [free-exercise-db-with-videos](https://github.com/luisaraujoc/free-exercise-db-api): автор прямо не подтверждает происхождение купленных видео. Медиа не используем.

## Результат сравнения

Сравнили **1497 записей** двух источников с текущим каталогом. **284** совпадений нормализованных названий убраны из очереди. Остались **1213 записи источников для проверки** — это **не 1213 новых упражнений**: здесь остаются синонимы, разные названия одной техники, повторы между источниками, варианты ракурса и пола модели.

[Машиночитаемая очередь](research/exercise-candidates.json) содержит закреплённые коммиты источников и похожие упражнения нашего каталога с их кодами и русскими названиями. Автоматическая близость названий помогает искать дубли, но не доказывает эквивалентность. Например, One Arm Floor Press уже есть без слова barbell; Smith Hip Raise уже есть как Smith Machine Hip Raise. Такие случаи отдельно помечены.

## Исходная первая очередь: 126 кандидатов

Эта очередь прошла проверку для первой партии: фактический импорт и отклонения перечислены в отчёте выше. Ниже сохранён исходный отбор кандидатов. Фото остаются отдельной задачей. Разделы ниже приблизительно равномерны по числу кандидатов. Доступные гири и стронгмен уже заметно полнее, поэтому не заполняем искусственную квоту их переименованиями.

| Направление | Кандидатов |
|---|---:|
| Турник, брусья, кольца и гимнастические навыки | 15 |
| Дом, собственный вес и кор | 15 |
| Резинки | 15 |
| Штанга и landmine | 13 |
| Гантели | 15 |
| Блоки и кроссовер | 13 |
| Тренажёры и Смит | 13 |
| Кардио и выносливость | 14 |
| Мобильность и растяжка | 13 |

Сначала можно обработать эту очередь, затем следующие партии до практического ориентира **1200–1500 содержательных упражнений**. Это ориентир покрытия, а не обещанное количество уникальных записей после удаления дублей.

Перед добавлением каждой записи: проверить отличие техники и инвентаря, подготовить русское название и шаги, найти разрешённое фото/видео, назначить корректные мышцы и категории. Спорные названия вроде version 2, смены ракурса и male/female объединять с исходным движением, если сама техника не меняется.

Бег, плавание и ходьба расширяют каталог видов активности. Их нужно рассматривать отдельно от силовых вариантов: текущий журнал прежде всего работает с подходами, повторами, весом и временем; дистанция, темп и стили плавания потребуют отдельного продуктового решения.

## Турник, брусья, кольца и гимнастические навыки

- L-Sit — `openbody:l-sit`
- Advanced Tuck Front Lever — `openbody:front-lever.advanced-tuck`
- Front Lever — `openbody:front-lever`
- Back Lever — `openbody:back-lever`
- Planche Lean — `openbody:planche.lean`
- Tuck Planche — `openbody:planche.tuck`
- Straddle Planche — `openbody:planche.straddle`
- Wall Walk — `openbody:wall-walk`
- Handstand Walk — `openbody:handstand-walk`
- Freestanding Handstand Push-Up — `openbody:handstand-push-up.freestanding`
- Ring Support Hold — `openbody:support-hold.rings`
- Skin the Cat — `openbody:skin-the-cat`
- Human Flag — `openbody:human-flag`
- Archer Pull-Up — `openbody:pull-up.archer`
- Archer Push-Up — `openbody:push-up.archer`

## Дом, собственный вес и кор

- bear crawl — `exercisedb-metadata:3360`
- bodyweight kneeling triceps extension — `exercisedb-metadata:1771`
- bodyweight side lying biceps curl — `exercisedb-metadata:1769`
- bodyweight standing row (with towel) — `exercisedb-metadata:3165`
- crab twist toe touch — `exercisedb-metadata:1468`
- frog crunch — `exercisedb-metadata:2429`
- glute bridge march — `exercisedb-metadata:3561`
- glute bridge two legs on bench (male) — `exercisedb-metadata:3523`
- kneeling plank tap shoulder (male) — `exercisedb-metadata:3239`
- pelvic tilt — `exercisedb-metadata:3147`
- reverse plank with leg lift — `exercisedb-metadata:3663`
- scapula push-up — `exercisedb-metadata:3021`
- shoulder tap — `exercisedb-metadata:3699`
- side plank hip adduction — `exercisedb-metadata:1775`
- single leg platform slide — `exercisedb-metadata:0730`

## Резинки

- band concentration curl — `exercisedb-metadata:0976`
- band front raise — `exercisedb-metadata:0978`
- band horizontal pallof press — `exercisedb-metadata:0979`
- band kneeling one arm pulldown — `exercisedb-metadata:0983`
- band lying hip internal rotation — `exercisedb-metadata:0984`
- band reverse wrist curl — `exercisedb-metadata:0994`
- band shrug — `exercisedb-metadata:1018`
- band single leg split squat — `exercisedb-metadata:1001`
- band squat row — `exercisedb-metadata:1003`
- band standing crunch — `exercisedb-metadata:1005`
- band step-up — `exercisedb-metadata:1008`
- band vertical pallof press — `exercisedb-metadata:1015`
- band wrist curl — `exercisedb-metadata:1016`
- band y-raise — `exercisedb-metadata:1017`
- resistance band leg extension — `exercisedb-metadata:3007`

## Штанга и landmine

- barbell incline close grip bench press — `exercisedb-metadata:1719`
- barbell incline reverse-grip press — `exercisedb-metadata:0048`
- barbell incline row — `exercisedb-metadata:0049`
- barbell lateral lunge — `exercisedb-metadata:1410`
- barbell one arm snatch — `exercisedb-metadata:0067`
- barbell pendlay row — `exercisedb-metadata:3017`
- barbell prone incline curl — `exercisedb-metadata:0072`
- barbell pullover to press — `exercisedb-metadata:0022`
- barbell reverse close-grip bench press — `exercisedb-metadata:2187`
- barbell single leg deadlift — `exercisedb-metadata:1756`
- barbell squat (on knees) — `exercisedb-metadata:0102`
- barbell standing twist — `exercisedb-metadata:0112`
- landmine lateral raise — `exercisedb-metadata:3237`

## Гантели

- dumbbell burpee — `exercisedb-metadata:1201`
- dumbbell deadlift — `exercisedb-metadata:0300`
- dumbbell decline twist fly — `exercisedb-metadata:0307`
- dumbbell finger curls — `exercisedb-metadata:1437`
- dumbbell fly on exercise ball — `exercisedb-metadata:1277`
- dumbbell goblet squat — `exercisedb-metadata:1760`
- dumbbell incline t-raise — `exercisedb-metadata:3542`
- dumbbell incline y-raise — `exercisedb-metadata:3541`
- dumbbell push press — `exercisedb-metadata:1700`
- dumbbell reverse bench press — `exercisedb-metadata:1624`
- dumbbell scott press — `exercisedb-metadata:2397`
- dumbbell side plank with rear fly — `exercisedb-metadata:3664`
- dumbbell single arm overhead carry — `exercisedb-metadata:3548`
- dumbbell waiter biceps curl — `exercisedb-metadata:5201`
- dumbbell w-press — `exercisedb-metadata:0438`

## Блоки и кроссовер

- cable deadlift — `exercisedb-metadata:0157`
- cable decline press — `exercisedb-metadata:1261`
- cable drag curl — `exercisedb-metadata:1632`
- cable incline bench row — `exercisedb-metadata:1318`
- cable one arm incline press — `exercisedb-metadata:1265`
- cable reverse preacher curl — `exercisedb-metadata:0209`
- cable rope lying on floor tricep extension — `exercisedb-metadata:1726`
- cable seated twist — `exercisedb-metadata:2399`
- cable side crunch — `exercisedb-metadata:0223`
- cable squat row (with rope attachment) — `exercisedb-metadata:1717`
- cable standing calf raise — `exercisedb-metadata:1375`
- cable supine reverse fly — `exercisedb-metadata:0240`
- cable thibaudeau kayak row — `exercisedb-metadata:2464`

## Тренажёры и Смит

- lever deadlift — `exercisedb-metadata:0578`
- lever gripless shrug — `exercisedb-metadata:0580`
- lever gripper hands — `exercisedb-metadata:2288`
- lever kneeling leg curl — `exercisedb-metadata:0582`
- lever one arm lateral high row — `exercisedb-metadata:1356`
- lever seated good morning — `exercisedb-metadata:3759`
- lever seated leg raise crunch — `exercisedb-metadata:0600`
- lever standing chest press — `exercisedb-metadata:3758`
- smith front squat (clean grip) — `exercisedb-metadata:1433`
- smith hack squat — `exercisedb-metadata:0755`
- smith low bar squat — `exercisedb-metadata:1434`
- smith machine decline close grip bench press — `exercisedb-metadata:1625`
- smith sprint lunge — `exercisedb-metadata:0769`

## Кардио и выносливость

- Heavy Bag Work — `openbody:heavy-bag`
- Shadowboxing — `openbody:shadowboxing`
- Ski Erg — `openbody:ski.erg`
- Freestyle Swim — `openbody:swim.freestyle`
- Sprint — `openbody:sprint`
- Pro-Agility Shuttle — `openbody:pro-agility-shuttle`
- Backstroke — `openbody:swim.backstroke`
- Breaststroke — `openbody:swim.breaststroke`
- Deep Water Running — `openbody:run.deep-water`
- Rucking — `openbody:ruck`
- Nordic Walking — `openbody:walk.nordic`
- Stair Climbing — `openbody:stair-climb`
- Hill Sprint — `openbody:sprint.hill`
- astride jumps (male) — `exercisedb-metadata:3220`

## Мобильность и растяжка

- Downward-Facing Dog — `openbody:downward-dog`
- Couch Stretch — `openbody:couch-stretch`
- Cat-Cow — `openbody:cat-cow`
- Shoulder CARs — `openbody:shoulder-cars`
- assisted lying gluteus and piriformis stretch — `exercisedb-metadata:1710`
- exercise ball hip flexor stretch — `exercisedb-metadata:1559`
- exercise ball lat stretch — `exercisedb-metadata:1339`
- lying (side) quads stretch — `exercisedb-metadata:0613`
- rocking frog stretch — `exercisedb-metadata:2571`
- roller back stretch — `exercisedb-metadata:2208`
- roller hip lat stretch — `exercisedb-metadata:2205`
- seated piriformis stretch — `exercisedb-metadata:2567`
- spine twist — `exercisedb-metadata:2329`
