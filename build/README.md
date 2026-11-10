# Rebuilding the data

Only needed if the Scorecard files or the variable list change. Source: [College Scorecard data](https://collegescorecard.ed.gov/data/) "Most Recent Cohorts – Institution" and "– Field of Study" (not in the repo; large). Run from the repository root, in this order:

```
pip install pandas numpy
python build/prepare_data.py Most-Recent-Cohorts-Institution.csv data/colleges_slim.csv
python build/add_county_data.py
python build/add_group_columns.py Most-Recent-Cohorts-Institution.csv data/colleges_slim.csv
python build/add_top_fields.py Most-Recent-Cohorts-Institution.csv data/colleges_slim.csv
python build/add_special_flag.py data/colleges_slim.csv
python build/make_field_programs.py Most-Recent-Cohorts-Field-of-Study.csv data/colleges_slim.csv
python build/make_data_js.py
```
`make_data_js.py` is the last step: it writes `data/data.js` (what the page loads) using the columns listed in `js/variables.js`. **After adding a variable to `js/variables.js`, run only this last step** (the column must exist in `data/colleges_slim.csv`, otherwise it stops with an error).

County income/education come from the ACS 2017–2021 (`acs2021_county.json`); school counties from `school_county.csv` (made by `assign_county.mjs`, not re-run normally).
