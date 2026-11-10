# Instructions for AI assistants

Project: course visualization (D3 v7, static page) of U.S. College Scorecard data. Read `README.md` and `docs/panels.md` first.

## Rules
- The human team decides. Recommend with reasons; do not change direction unasked. If only exploring, change no files.
- Keep it simple; every design choice must be defensible in the report.
- Colours: ColorBrewer only.
- Never invent data. Say plainly what was tested and what was not.
- Do not delete or rename files without asking.

## Where things are
- All visible text: `js/texts.js` (incl. the "i" pop-up texts in `TEXT.info`). Elements in `index.html` use `data-text="group.key"`. Aria-labels may still be in `js/app.js`.
- Variables, directions, defaults, field groups: `js/variables.js`.
- Logic: `js/app.js`, in numbered sections (colours, data, helpers, "i" pop-ups, field data, Rank code, start).
- Styles: `css/style.css`. Data: `data/` (`data.js` is generated: `python build/make_data_js.py`).

## Check your work
Open `index.html`; the browser console must show no errors and no "Missing text:" warnings. Compare numbers with pandas on `data/colleges_slim.csv`.
