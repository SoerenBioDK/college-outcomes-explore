# College Outcomes Explorer

Interactive D3.js visualization of the U.S. College Scorecard ("Most Recent Cohorts – Institution"), for a student from abroad who wants to pick a U.S. school. Data Visualization course project (report and video due 11 Dec 2026).

**Current scope: one panel only, "Rank schools".** The other panels (explore, for whom, find) were removed on purpose to keep things simple; a full 4-panel backup exists (see `docs/panels.md`).

## Open it
Double-click `index.html`. It works from disk and on GitHub Pages (needs internet for D3 and TopoJSON from a CDN). No build step is needed for normal editing.

## Where do I change things?
| I want to change... | Edit this file |
|---|---|
| Any text on the page, including the text behind the round **i** buttons | `js/texts.js` |
| Which variables exist, their names/descriptions/direction, the default ones, field-of-study groups | `js/variables.js` |
| Colours, layout, fonts | `css/style.css` |
| Page structure (which panels/buttons exist) | `index.html` |
| Behaviour (ranking, figure, filters, map) | `js/app.js` |
| The data | `data/` (rebuild: `build/README.md`) |

## Folder map
- `index.html` – markup only.
- `css/` – `style.css`.
- `js/` – `texts.js` (all words), `variables.js` (variable list), `app.js` (logic).
- `data/` – CSV sources, `us_states_topo.json`, and the generated `data.js` that the page loads.
- `build/` – Python/Node scripts that turn the Scorecard files into `data/`.
- `docs/` – design notes (`panels.md`).
- `CLAUDE.md` – rules for AI assistants.

## Use of AI
Claude (Anthropic) helped write the code, prepare the data and plan the project. See the AI declaration in the report.
