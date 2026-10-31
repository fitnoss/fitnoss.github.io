# Third-party notices

## free-exercise-db

Base exercise descriptions, metadata and photos come from
[yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db)
(pinned commit `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5`), released into the public domain under the
[Unlicense](https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE). Photos are resized and converted
to WebP at build time; Russian texts are translations of the original English.

## Additional exercise photos

These assets have their own licenses; the repository's MIT license and the base dataset's Unlicense do not apply to them.

### Kettlebell Halo

- File: `content/images/kettlebell-halo/0.jpg` (exercise code 139).
- Photographer: tacofleur / Taco Fleur.
- Source: [Kettlebell Halo, Pixabay photo 2052793](https://pixabay.com/photos/kettlebell-halo-exercise-2052793/).
- License: [Pixabay Content License](https://pixabay.com/service/license-summary/) ([full terms](https://pixabay.com/service/terms/)), checked 2026-10-31.
- Downloaded the author's 1280 px rendition and added white side padding to preserve the full kettlebell in landscape previews; resized and converted to WebP during the build. Used as an exercise illustration within the app.

### Dead Hang

- File: `content/exercises/dead-hang/0.jpg` (exercise code 877).
- Photographer: Dinielle De Veyra.
- Source: [Strong young woman pull up on crossbar, Pexels photo 4194672](https://www.pexels.com/photo/strong-young-woman-pull-up-on-crossbar-4194672/).
- License: [Pexels License](https://www.pexels.com/license/), checked 2026-10-31.
- Selected the straight-arm hanging position with the full body visible. Resized and padded with white space to fit the app's landscape previews without cropping the body; converted to WebP during the build.

## Additional exercise definitions

The first catalog expansion adds 88 locally maintained exercise definitions under `content/exercises/`.
Their English and Russian steps were independently authored for fitnoss after reviewing the named movements;
third-party instruction paragraphs and media were not copied. The app's MIT license applies to these original texts.

Names and equipment concepts were checked against the [OpenBody registry](https://github.com/openbody/openbody-registry/tree/66660efd17364be3e9700997a398a208738403ee)
(CC0-1.0) and the metadata portion of [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset/tree/7455efae41b330c265e7cd4b78dfa848e7ce5ebd)
(MIT, Copyright (c) 2026 Hasan Emir Yıldırım; [license and media exception](content/research/LICENSE-exercises-dataset.txt)).
Gym visual images and animations from that dataset are not included or licensed by this import.
Per-movement references and review outcomes are recorded in [the batch report](content/research/EXPANSION_BATCH_1.md).

## YouTube videos

Videos are embedded with the standard YouTube player (youtube-nocookie.com) and are not copied or hosted
by fitnoss. They remain the property of their authors and are subject to the
[YouTube Terms of Service](https://www.youtube.com/t/terms).

## Flag emoji on Windows

Windows doesn't draw country flag emoji, so there the app loads the "Twemoji Country Flags" font from
[country-flag-emoji-polyfill](https://github.com/talkjs/country-flag-emoji-polyfill) (MIT, © TalkJS). The flag
artwork is from [Twemoji](https://github.com/twitter/twemoji), © Twitter, Inc and other contributors, licensed
under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Other systems show their own emoji.

## Muscle map

The SVG polygon coordinates in `src/shared/components/muscle-map-data.ts` are adapted from
[react-body-highlighter](https://github.com/giavinh79/react-body-highlighter/blob/d03fcd8740033721a51f5a2682de02ec31df92ba/src/assets/index.ts),
Copyright (c) 2020 GV79, under the MIT license. The full notice is included in
`public/licenses/react-body-highlighter.txt` and linked from the About page.
Adaptations: catalogue muscle names, corrected inner-thigh label, subdivision of upper back
into middle back and lats, added lateral hip regions, and an expanded back viewBox to retain the soleus.

## Workout field icons

The filled kettlebell and timer icons in `src/shared/components/WorkoutIcons.tsx` come from
[Material Design Icons by Pictogrammers](https://github.com/Templarian/MaterialDesign-SVG)
(`svg/kettlebell.svg` and `svg/timer.svg`), under Apache-2.0.
Their path data is unchanged; they are wrapped as React components using `currentColor`.
The license is included in `public/licenses/material-design-icons.txt`.

## Fonts

[Onest](https://github.com/simpals/onest) and [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) are
bundled via Fontsource, both under the [SIL Open Font License 1.1](https://openfontlicense.org).

## Software

fitnoss is built with open-source libraries, each under its own license (see `package.json` and
`node_modules/*/LICENSE`), including React, React Router, Tailwind CSS, shadcn/ui (MIT), Radix UI (MIT),
Lucide (ISC), Recharts (MIT), i18next (MIT), Zustand (MIT), TanStack Virtual (MIT), MiniSearch (MIT),
dnd-kit (MIT), vaul (MIT), sonner (MIT), qrcode (MIT) and Workbox (MIT).

No code or data from [workout-cool](https://github.com/Snouzy/workout-cool) is included.
