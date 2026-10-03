# College Outcomes Explorer

An interactive dashboard for exploring how U.S. college outcomes (earnings, completion, debt, loan default, retention) relate to institution characteristics (school type, cost, aid, student mix, size, selectivity, location). Built as the course project for the Data Visualization course.

**Live version:** https://YOUR-USERNAME.github.io/college-outcomes-explorer/

## What it shows
Four linked views. Everything responds to the filters, to clicking states on the map, and to brushing in the scatterplot.

1. **Boxplot:** the chosen outcome grouped by a categorical variable (school type, degree level, region, locale, race or sex composition, size, selectivity, minority-serving status, or state). Sorted by median; groups under 5 schools are hidden.
2. **Scatterplot:** the outcome against a continuous variable (24 options such as cost, net price, Pell share, faculty salary), coloured by school type, with a linear trend line. Drag a rectangle to select schools.
3. **Map:** states shaded by the median, mean or enrollment-weighted mean of the outcome, with every school as a dot. Click a state to add or remove it, or drag a box over the map to pick several (hold Shift to add). A counter shows how many universities in how many states match.
4. **Top 10:** the highest or lowest institutions for the current selection.

Other controls: school type, degree level, minimum undergraduate size, and a university search with suggestions.

## Run it locally
Open `index.html` in a browser. The data and the U.S. map are embedded in the file; it only needs an internet connection to load the D3 and TopoJSON libraries.

## Repository contents
| Path | What it is |
|---|---|
| `index.html` | The D3.js dashboard (served by GitHub Pages) |
| `data/colleges_slim.csv` | Slimmed data: 6,243 operating institutions, 49 columns |
| `data/prepare_data.py` | Script that builds the slim CSV from the full College Scorecard download |
| `vega-lite/college_dashboard.vl.json` | Earlier Vega-Lite version (paste into https://vega.github.io/editor/ and set the data URL on line 5) |

## Data
U.S. Department of Education, [College Scorecard](https://collegescorecard.ed.gov/data/), "Most Recent Cohorts – Institution" file. To rebuild the slim CSV, download the full file (about 100 MB, not included here) and run:

```
pip install pandas numpy
python data/prepare_data.py Most-Recent-Cohorts-Institution.csv data/colleges_slim.csv
```

Things to know about the data:
- It covers Title IV students only (those receiving federal aid), not all students.
- Earnings are medians, so the map offers median, mean and enrollment-weighted options and does not simply average them.
- Missing values (`PrivacySuppressed`, `NULL`) are left out, so some variables cover fewer schools. Dropdown labels mark the ones with weak coverage.
- Only currently operating institutions are included.
- Variables were chosen using the College Scorecard documentation and errata; outdated variables were replaced.

## Design
- Colours from [ColorBrewer](https://colorbrewer2.org/): Dark2 for school type, Blues for the map and boxplot, Greys for neutral elements.
- Built with [D3.js](https://d3js.org/) v7 and [TopoJSON](https://github.com/topojson/topojson) (U.S. state shapes from the `us-atlas` / vega-datasets data).

## Use of AI
Claude (Anthropic) was used to help write the code, prepare the data and plan the project. See the AI declaration in the report for details.
