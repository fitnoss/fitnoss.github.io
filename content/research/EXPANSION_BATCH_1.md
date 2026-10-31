# Первая партия расширения

31 октября 2026: рассмотрены все **126** приоритетных кандидатов. Добавлены **88** упражнений, отклонены **38** дублей и неоднозначных вариантов. Каталог вырос с **880 до 968** записей. Старые коды сохранены; новые коды — **880–967**.

## Содержимое

- У всех новых упражнений есть оригинальные английские и русские названия и пошаговая техника, мышцы, уровень и инвентарь.
- Базовые метаданные сверены с существующим каталогом. Инструкции стороннего источника не переносились автоматически: обнаружены несовпадения названий и описаний движений.
- Фото в эту партию не входят. Все 88 новых записей пока без изображений; один SkiErg имеет проверенную ссылку на видео производителя Concept2. Всего без фото в каталоге теперь **93** записи (5 прежних + 88 новых).
- Плавание и уличное кардио не размечены как занятия дома или в зале. Существующие фильтры и запись времени доступны; дистанция и темп в этой партии не добавлялись.
- Решения и источники: [калистеника и дом](decisions-bodyweight.json), [свободные веса и тренажёры](decisions-weights.json), [резинки и блоки](decisions-bands-cable.json), [кардио и мобильность](decisions-cardio-mobility.json).

## Добавлены

Проверки: сборка данных в режиме `--check`, production-сборка, 75 unit-тестов, проверка UI-переводов и наличия EN/RU шагов у всех добавлений. Отдельно проверены неизменность первых 880 кодов и полнота 126 решений. В браузере подтверждены счётчик 968, русский поиск «Пендлея» и открытие техники.

| Код | Русское название | English | Определение |
|---|---|---|---|
| 921 | Уголок на полу | Floor L-Sit | [floor-l-sit](../exercises/floor-l-sit/exercise.json) |
| 880 | Передний вис в раскрытой группировке | Advanced Tuck Front Lever | [advanced-tuck-front-lever](../exercises/advanced-tuck-front-lever/exercise.json) |
| 925 | Передний горизонтальный вис | Front Lever | [front-lever](../exercises/front-lever/exercise.json) |
| 947 | Задний горизонтальный вис на кольцах | Ring Back Lever | [ring-back-lever](../exercises/ring-back-lever/exercise.json) |
| 941 | Наклон вперёд в упоре на прямых руках | Planche Lean | [planche-lean](../exercises/planche-lean/exercise.json) |
| 966 | Планш в группировке | Tuck Planche | [tuck-planche](../exercises/tuck-planche/exercise.json) |
| 963 | Планш с разведёнными ногами | Straddle Planche | [straddle-planche](../exercises/straddle-planche/exercise.json) |
| 967 | Заход руками к стене в стойку | Wall Walk | [wall-walk](../exercises/wall-walk/exercise.json) |
| 927 | Ходьба на руках | Handstand Walk | [handstand-walk](../exercises/handstand-walk/exercise.json) |
| 923 | Отжимания в стойке без опоры о стену | Freestanding Handstand Push-Up | [freestanding-handstand-push-up](../exercises/freestanding-handstand-push-up/exercise.json) |
| 949 | Упор на прямых руках на кольцах | Ring Support Hold | [ring-support-hold](../exercises/ring-support-hold/exercise.json) |
| 948 | Прокрут в висе на кольцах | Skin the Cat on Rings | [ring-skin-the-cat](../exercises/ring-skin-the-cat/exercise.json) |
| 930 | Флажок | Human Flag | [human-flag](../exercises/human-flag/exercise.json) |
| 881 | Подтягивания лучника | Archer Pull-Up | [archer-pull-up](../exercises/archer-pull-up/exercise.json) |
| 882 | Отжимания лучника | Archer Push-Up | [archer-push-up](../exercises/archer-push-up/exercise.json) |
| 901 | Медвежья ходьба | Bear Crawl | [bear-crawl](../exercises/bear-crawl/exercise.json) |
| 932 | Разгибание рук с весом тела с колен | Kneeling Bodyweight Triceps Extension | [kneeling-bodyweight-triceps-extension](../exercises/kneeling-bodyweight-triceps-extension/exercise.json) |
| 910 | Касания стопы в обратном упоре | Crab Toe Touch | [crab-toe-touch](../exercises/crab-toe-touch/exercise.json) |
| 926 | Ягодичный мостик с попеременным подъёмом ног | Glute Bridge March | [glute-bridge-march](../exercises/glute-bridge-march/exercise.json) |
| 933 | Касания плеч в упоре с колен | Kneeling Plank Shoulder Tap | [kneeling-plank-shoulder-tap](../exercises/kneeling-plank-shoulder-tap/exercise.json) |
| 965 | Наклон таза лёжа | Supine Pelvic Tilt | [supine-pelvic-tilt](../exercises/supine-pelvic-tilt/exercise.json) |
| 946 | Обратная планка с подъёмом ноги | Reverse Plank with Leg Lift | [reverse-plank-leg-lift](../exercises/reverse-plank-leg-lift/exercise.json) |
| 953 | Лопаточные отжимания | Scapular Push-Up | [scapular-push-up](../exercises/scapular-push-up/exercise.json) |
| 942 | Касания плеч в упоре лёжа | Plank Shoulder Tap | [plank-shoulder-tap](../exercises/plank-shoulder-tap/exercise.json) |
| 908 | Приведение нижней ноги в копенгагенской планке | Copenhagen Side Plank Hip Adduction | [copenhagen-side-plank-hip-adduction](../exercises/copenhagen-side-plank-hip-adduction/exercise.json) |
| 897 | Жим штанги на наклонной скамье узким хватом | Incline Close-Grip Barbell Bench Press | [barbell-incline-close-grip-bench-press](../exercises/barbell-incline-close-grip-bench-press/exercise.json) |
| 898 | Жим штанги на наклонной скамье обратным хватом | Incline Reverse-Grip Barbell Press | [barbell-incline-reverse-grip-press](../exercises/barbell-incline-reverse-grip-press/exercise.json) |
| 896 | Тяга штанги с упором грудью в наклонную скамью | Chest-Supported Incline Barbell Row | [barbell-chest-supported-incline-row](../exercises/barbell-chest-supported-incline-row/exercise.json) |
| 899 | Боковые выпады со штангой | Barbell Lateral Lunge | [barbell-lateral-lunge](../exercises/barbell-lateral-lunge/exercise.json) |
| 940 | Тяга Пендлея | Pendlay Row | [pendlay-row](../exercises/pendlay-row/exercise.json) |
| 900 | Румынская тяга со штангой на одной ноге | Single-Leg Barbell Romanian Deadlift | [barbell-single-leg-romanian-deadlift](../exercises/barbell-single-leg-romanian-deadlift/exercise.json) |
| 934 | Мах одной рукой с грифом в landmine | Landmine Lateral Raise | [landmine-lateral-raise](../exercises/landmine-lateral-raise/exercise.json) |
| 914 | Становая тяга с гантелями | Dumbbell Deadlift | [dumbbell-deadlift](../exercises/dumbbell-deadlift/exercise.json) |
| 915 | Сгибание пальцев с гантелью | Dumbbell Finger Curl | [dumbbell-finger-curl](../exercises/dumbbell-finger-curl/exercise.json) |
| 916 | Разведение гантелей лёжа на фитболе | Dumbbell Fly on Stability Ball | [dumbbell-fly-on-stability-ball](../exercises/dumbbell-fly-on-stability-ball/exercise.json) |
| 917 | Гоблет-приседания с гантелью | Dumbbell Goblet Squat | [dumbbell-goblet-squat](../exercises/dumbbell-goblet-squat/exercise.json) |
| 931 | Y-подъём гантелей с упором грудью | Incline Dumbbell Y-Raise | [incline-dumbbell-y-raise](../exercises/incline-dumbbell-y-raise/exercise.json) |
| 918 | Жимовой швунг с гантелями | Dumbbell Push Press | [dumbbell-push-press](../exercises/dumbbell-push-press/exercise.json) |
| 945 | Жим гантелей лёжа обратным хватом | Reverse-Grip Dumbbell Bench Press | [reverse-grip-dumbbell-bench-press](../exercises/reverse-grip-dumbbell-bench-press/exercise.json) |
| 919 | Разведение гантели в боковой планке | Dumbbell Reverse Fly in Side Plank | [dumbbell-side-plank-reverse-fly](../exercises/dumbbell-side-plank-reverse-fly/exercise.json) |
| 957 | Ходьба с гантелью над головой одной рукой | Single-Arm Dumbbell Overhead Carry | [single-arm-dumbbell-overhead-carry](../exercises/single-arm-dumbbell-overhead-carry/exercise.json) |
| 920 | Сгибание рук с гантелью за головку (waiter curl) | Dumbbell Waiter Curl | [dumbbell-waiter-curl](../exercises/dumbbell-waiter-curl/exercise.json) |
| 935 | Сжатие кистей в тренажёре для хвата | Machine Grip Squeeze | [machine-grip-squeeze](../exercises/machine-grip-squeeze/exercise.json) |
| 936 | Сгибание ноги в тренажёре с опорой на колено | Machine Kneeling Leg Curl | [machine-kneeling-leg-curl](../exercises/machine-kneeling-leg-curl/exercise.json) |
| 937 | Тяга высокого рычага в тренажёре одной рукой | Single-Arm Machine High Row | [machine-single-arm-high-row](../exercises/machine-single-arm-high-row/exercise.json) |
| 938 | Жим от груди стоя в рычажном тренажёре | Standing Machine Chest Press | [machine-standing-chest-press](../exercises/machine-standing-chest-press/exercise.json) |
| 961 | Фронтальные приседания в машине Смита | Smith Machine Front Squat | [smith-machine-front-squat](../exercises/smith-machine-front-squat/exercise.json) |
| 960 | Жим узким хватом в Смите на скамье с отрицательным наклоном | Smith Machine Decline Close-Grip Press | [smith-decline-close-grip-bench-press](../exercises/smith-decline-close-grip-bench-press/exercise.json) |
| 884 | Концентрированное сгибание руки с резинкой | Band Concentration Curl | [band-concentration-curl](../exercises/band-concentration-curl/exercise.json) |
| 885 | Подъём рук перед собой с резинкой | Band Front Raise | [band-front-raise](../exercises/band-front-raise/exercise.json) |
| 887 | Жим Паллофа с резинкой | Band Pallof Press | [band-pallof-press](../exercises/band-pallof-press/exercise.json) |
| 886 | Тяга резинки одной рукой с колена | Kneeling Single-Arm Band Pulldown | [band-kneeling-single-arm-pulldown](../exercises/band-kneeling-single-arm-pulldown/exercise.json) |
| 888 | Разгибание запястья с резинкой | Band Reverse Wrist Curl | [band-reverse-wrist-curl](../exercises/band-reverse-wrist-curl/exercise.json) |
| 889 | Шраги с резинкой | Band Shrug | [band-shrug](../exercises/band-shrug/exercise.json) |
| 890 | Сплит-приседание с резинкой | Band Split Squat | [band-split-squat](../exercises/band-split-squat/exercise.json) |
| 891 | Приседание с тягой резинки | Band Squat to Row | [band-squat-to-row](../exercises/band-squat-to-row/exercise.json) |
| 892 | Скручивание стоя с резинкой | Standing Band Crunch | [band-standing-crunch](../exercises/band-standing-crunch/exercise.json) |
| 893 | Зашагивание с резинкой | Band Step-Up | [band-step-up](../exercises/band-step-up/exercise.json) |
| 894 | Сгибание запястья с резинкой | Band Wrist Curl | [band-wrist-curl](../exercises/band-wrist-curl/exercise.json) |
| 895 | Y-подъём рук с резинкой | Band Y-Raise | [band-y-raise](../exercises/band-y-raise/exercise.json) |
| 954 | Разгибание ноги сидя с резинкой | Seated Band Leg Extension | [seated-band-leg-extension](../exercises/seated-band-leg-extension/exercise.json) |
| 911 | Жим на блоках на скамье с отрицательным наклоном | Decline Bench Cable Press | [decline-bench-cable-press](../exercises/decline-bench-cable-press/exercise.json) |
| 903 | Сгибание рук на блоке с протягиванием вдоль корпуса | Cable Drag Curl | [cable-drag-curl](../exercises/cable-drag-curl/exercise.json) |
| 906 | Тяга блока с упором грудью в наклонную скамью | Chest-Supported Incline Cable Row | [chest-supported-incline-cable-row](../exercises/chest-supported-incline-cable-row/exercise.json) |
| 958 | Жим одной рукой на наклонной скамье с блоком | Single-Arm Incline Cable Press | [single-arm-incline-cable-press](../exercises/single-arm-incline-cable-press/exercise.json) |
| 944 | Сгибание рук обратным хватом на скамье Скотта с блоком | Reverse-Grip Cable Preacher Curl | [reverse-grip-cable-preacher-curl](../exercises/reverse-grip-cable-preacher-curl/exercise.json) |
| 922 | Разгибание рук с канатом на блоке лёжа на полу | Floor Rope Cable Triceps Extension | [floor-rope-cable-triceps-extension](../exercises/floor-rope-cable-triceps-extension/exercise.json) |
| 955 | Поворот корпуса сидя с блоком | Seated Cable Torso Rotation | [seated-cable-torso-rotation](../exercises/seated-cable-torso-rotation/exercise.json) |
| 904 | Приседание с тягой блока | Cable Squat to Row | [cable-squat-to-row](../exercises/cable-squat-to-row/exercise.json) |
| 928 | Бокс на мешке | Heavy Bag Boxing | [heavy-bag-boxing](../exercises/heavy-bag-boxing/exercise.json) |
| 956 | Бой с тенью | Shadowboxing | [shadowboxing](../exercises/shadowboxing/exercise.json) |
| 959 | Лыжный эргометр | Ski Erg | [ski-erg](../exercises/ski-erg/exercise.json) |
| 924 | Плавание кролем | Freestyle Swimming | [freestyle-swimming](../exercises/freestyle-swimming/exercise.json) |
| 913 | Собака мордой вниз | Downward-Facing Dog | [downward-facing-dog](../exercises/downward-facing-dog/exercise.json) |
| 909 | Растяжка передней поверхности бедра с опорой | Couch Stretch | [couch-stretch](../exercises/couch-stretch/exercise.json) |
| 905 | Кошка-корова | Cat-Cow | [cat-cow](../exercises/cat-cow/exercise.json) |
| 907 | Контролируемые круги прямой рукой | Controlled Shoulder Circles | [controlled-shoulder-circles](../exercises/controlled-shoulder-circles/exercise.json) |
| 952 | Спринт | Running Sprint | [running-sprint](../exercises/running-sprint/exercise.json) |
| 943 | Челночный бег 5–10–5 | Pro-Agility Shuttle | [pro-agility-shuttle](../exercises/pro-agility-shuttle/exercise.json) |
| 883 | Плавание на спине | Backstroke Swimming | [backstroke-swimming](../exercises/backstroke-swimming/exercise.json) |
| 902 | Плавание брассом | Breaststroke Swimming | [breaststroke-swimming](../exercises/breaststroke-swimming/exercise.json) |
| 912 | Бег в глубокой воде | Deep Water Running | [deep-water-running](../exercises/deep-water-running/exercise.json) |
| 951 | Ходьба с нагруженным рюкзаком | Rucking | [rucking](../exercises/rucking/exercise.json) |
| 939 | Скандинавская ходьба | Nordic Walking | [nordic-walking](../exercises/nordic-walking/exercise.json) |
| 962 | Подъём по лестнице | Stair Climbing | [stair-climbing](../exercises/stair-climbing/exercise.json) |
| 929 | Спринт в подъём | Hill Sprint | [hill-sprint](../exercises/hill-sprint/exercise.json) |
| 964 | Растяжка ягодичных лёжа «четвёрка» | Supine Figure-Four Stretch | [supine-figure-four-stretch](../exercises/supine-figure-four-stretch/exercise.json) |
| 950 | Динамическая растяжка приводящих в позе лягушки | Rocking Frog Stretch | [rocking-frog-stretch](../exercises/rocking-frog-stretch/exercise.json) |

## Отклонены

| Кандидат | Причина |
|---|---|
| exercisedb-metadata:1769 | Unresisted side-lying biceps curl: source has no load or self-resistance and does not establish a meaningful distinct exercise. |
| exercisedb-metadata:3165 | Towel row source omits anchor/partner or other resistance; cannot identify its intended variant reliably. |
| exercisedb-metadata:2429 | Duplicate of current code 524 Frog Sit-Ups, which already specifies a partial crunch in butterfly-leg position. Source instructions also describe ordinary crunches. |
| exercisedb-metadata:3523 | Bench bridge instructions conflict with title: source does not reliably specify shoulders or feet on bench. Do not invent the intended variant. |
| exercisedb-metadata:0730 | Platform slide intended technique/setup is insufficiently defined; current code 312 already covers platform hamstring slides. Defer until clear demo/reference is found. |
| exercisedb-metadata:1201 | Source labels this burpee but describes a clean and overhead press finish; unclear distinction from devil press or man-maker variations. |
| exercisedb-metadata:1434 | Generic low-bar placement variation of existing code 186 Smith Machine Squat; source contradicts its own low-bar label by placing the bar on the traps. |
| exercisedb-metadata:2187 | Duplicate of existing code 469 Reverse Triceps Bench Press, which already uses a close supinated grip. |
| exercisedb-metadata:2397 | Scott press is a specific partial rotational shoulder movement; source instead describes a generic full-range dumbbell press. Defer until the intended variant is verified. |
| exercisedb-metadata:3542 | Duplicate of existing code 54 Reverse Flyes and code 518 Dumbbell Lying Rear Lateral Raise, which already lift the arms sideways with chest support. |
| exercisedb-metadata:3759 | Generic seated hinge text does not establish the machine contact points or lever design; defer until a primary equipment reference is available. |
| exercisedb-metadata:0067 | Source describes a two-handed setup for a one-arm snatch; advanced uncommon movement needs a reliable dedicated technique reference before inclusion. |
| exercisedb-metadata:0072 | Duplicate of existing code 222 Barbell Curls Lying Against An Incline, with the same chest-down bench support and barbell curl. |
| exercisedb-metadata:0022 | Name promises pullover plus press, but the source only describes a straight-arm pullover already covered by the catalog; combination is not defined clearly. |
| exercisedb-metadata:0102 | Duplicate of existing code 782 Kneeling Squat. Source instructions are also inconsistent with a kneeling position. |
| exercisedb-metadata:0112 | Source alternates between a bar held at chest height and a torso twist with conflicting lower-body cues; defer until a precise variant is established. |
| exercisedb-metadata:0307 | Wrist-rotation-only fly variant; defer rather than inflate the catalog without dependable confirmation of the intended technique. |
| exercisedb-metadata:0438 | Source describes an ordinary dumbbell shoulder press with no W-shaped path, already covered by the catalog. |
| exercisedb-metadata:0578 | Duplicate of existing code 146 Leverage Deadlift. Source incorrectly describes a seated leg-press setup. |
| exercisedb-metadata:0580 | Gripless shoulder-pad shrug is already represented by code 249 Calf-Machine Shoulder Shrug; source instead tells the user to grip handles. |
| exercisedb-metadata:0600 | Source does not establish how the leg lever and torso resistance are connected; defer ambiguous machine-specific instructions. |
| exercisedb-metadata:0755 | Source is an ordinary Smith squat already covered by code 186, without the feet-forward/support distinction required for a hack-squat variant. |
| exercisedb-metadata:0769 | Existing code 445 Lunge Sprint already covers the Smith sprint-lunge pattern. Source confusingly describes rear-foot support on the bar instead. |
| exercisedb-metadata:0984 | The named internal hip rotation conflicts with the source instructions, which describe knees opening outward; no sufficiently clear technique reference verified. |
| exercisedb-metadata:1015 | Source describes the same horizontal anti-rotation press as 0979 despite the vertical name. Retained one clear Band Pallof Press instead. |
| exercisedb-metadata:0157 | Cable Deadlifts already exists in the catalog; the source record adds no distinct movement. |
| exercisedb-metadata:0223 | Source low-pulley side-bend description is unclear and risks duplicating the existing high-pulley side-bend variants; defer until the named side-crunch setup is verified. |
| exercisedb-metadata:1375 | Source alternates between holding handles and ankle straps without a coherent loading setup for a calf raise; defer pending technique verification. |
| exercisedb-metadata:0240 | Supine name conflicts with instructions to lie face down. Do not publish an invented or incorrectly named variant. |
| exercisedb-metadata:2464 | Source describes a generic one-arm seated cable row rather than a verified Thibaudeau kayak row. Defer to avoid relabeling an existing row. |
| exercisedb-metadata:3220 | Ambiguous astride/star-jump label and inconsistent source instructions; do not create another jump variation without a reliable demonstration. |
| exercisedb-metadata:1559 | Ball hip-flexor instructions target the wrong hip and do not identify a stable reproducible position; deferred. |
| exercisedb-metadata:1339 | Ball lat-stretch source unexpectedly requires a dumbbell and lacks clear alignment with its name; deferred. |
| exercisedb-metadata:0613 | Existing code 697 On Your Side Quad Stretch already describes the same side-lying quadriceps stretch. |
| exercisedb-metadata:2208 | Generic rolling over the lower back is not a clear distinct exercise; source instructions unsuitable for import. |
| exercisedb-metadata:2205 | Roller hip lat stretch name and instructions do not identify a coherent conventional movement; deferred. |
| exercisedb-metadata:2567 | Source seated piriformis instructions describe a seated spinal rotation instead of a clearly defined figure-four stretch; deferred. |
| exercisedb-metadata:2329 | Spine-twist source combines contradictory knee/elbow cues; defer until a specific conventional variant is established. |
