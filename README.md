# College Outcomes Explorer

Interactive D3.js visualization of the U.S. College Scorecard ("Most Recent Cohorts – Institution"), for a student from abroad who wants to pick a U.S. school. Data Visualization course project (report and video due 11 Dec 2026).

**Current scope: one figure, "Rank schools".** The other panels (explore, for whom, find) were removed on purpose to keep things simple; a full 4-panel backup exists (see `docs/panels.md`).

## What it does
- You choose which variables matter to you (earnings, completion, retention, tuition, debt, ...) and how much (importance 0–10).
- Every Bachelor's school gets a score from 0 to 100 and the top 15 are shown, one column per variable, most important to the left.
- You can narrow the schools with filters (field of study, school type, name, region/state or a map box, and a lowest/highest value for any variable).
- You pin schools (max 8) to follow them across the columns: each gets its own colour and a line. Hover a school to see its rank, score and its 0–100% mark per variable.
- Idea: LineUp (Gratzl et al., 2013), a weighted sum of scaled variables, combined with a slope graph. Details and design choices: `docs/panels.md`.

## How the rank is calculated (short)
1. Importance values (0–10) become shares that add up to 100%.
2. Each value is scaled 0–1 between the lowest and highest value among all Bachelor's schools in the data (reversed where lower is better, e.g. tuition, debt). Filters never change this scale.
3. Score = sum of share × scaled value, shown out of 100. Highest score = rank 1; equal scores share a rank (the next rank is skipped).
4. Schools without a value for a chosen variable are not ranked. Service academies are always excluded.

## Open it
Double-click `index.html`. It works from disk and on GitHub Pages (needs internet for D3 and TopoJSON from a CDN). No build step is needed for normal editing.

**One-file version for GitHub Pages:** run `python build/make_single_file.py` from the repository root. It writes `dist/index.html` with all CSS, JS and data inside; upload only that one file as `index.html`.

## Where do I change things?
| I want to change... | Edit this file |
|---|---|
| Any text on the page, including the text behind the round **i** buttons and the hover box | `js/texts.js` |
| Which variables exist, their names/descriptions/direction, the default ones, field-of-study groups | `js/variables.js` |
| Colours, layout, fonts | `css/style.css` |
| Page structure (which panels/buttons exist) | `index.html` |
| Behaviour (ranking, figure, filters, map, hover box) | `js/app.js` |
| The data | `data/` (rebuild: `build/README.md`) |

## Folder map
- `index.html` – markup only.
- `css/` – `style.css`.
- `js/` – `texts.js` (all words), `variables.js` (variable list), `app.js` (logic).
- `data/` – CSV sources, `us_states_topo.json`, and the generated `data.js` that the page loads.
- `build/` – Python/Node scripts that turn the Scorecard files into `data/`, and `make_single_file.py` which packs everything into one `dist/index.html`.
- `docs/` – design notes (`panels.md`).
- `CLAUDE.md` – rules for AI assistants.

## Tested and not tested
See the end of `docs/panels.md`.

## Use of AI
Claude (Anthropic) helped write the code, prepare the data and plan the project. See the AI declaration in the report.
