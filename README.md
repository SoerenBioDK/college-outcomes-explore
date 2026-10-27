# College Outcomes Explorer

An interactive dashboard for exploring how U.S. college outcomes (earnings, completion, debt, loan default, retention) relate to institution characteristics (school type, cost, aid, student mix, size, selectivity, location) at U.S. Bachelor's-degree institutions. Built as the course project for the Data Visualization course.

**Live version:** https://soerenbiodk.github.io/college-outcomes-explore/

## What it shows
Four linked views. Everything responds to the filters, to clicking states on the map, and to brushing in the scatterplot.

1. **Boxplot:** the chosen outcome grouped by a categorical variable (school type, region, locale, race or sex composition, size, selectivity, minority-serving status, or state). Sorted by median; groups under 5 schools are hidden.
2. **Scatterplot:** the outcome against a continuous variable (29 options such as cost, net price, Pell share, faculty salary, two county variables, two campus-crime rates and two Greek-life percentages), coloured by school type, with a linear trend line. Drag a rectangle to select schools.
3. **Map:** by default every school is a dot, coloured by the chosen outcome in five quantile classes (each holding about a fifth of the schools shown; the five darker steps of ColorBrewer's 7-class Blues) and sized by undergraduate enrollment; the states are ColorBrewer grey and work only as a selector. A "Map shows" switch gives the earlier version instead: states shaded by the median, mean or enrollment-weighted mean of the outcome, with small plain dots. Click a state to add or remove it, or drag a box over the map to pick several (hold Shift to add). A counter shows how many universities in how many states match. When the boxplot is grouped by Region, the region borders and names are drawn on the map.
4. **Top 10:** the highest or lowest institutions for the current selection.

Other controls: school type, region (the College Scorecard's 8 regions plus outlying areas), minimum undergraduate size, and a university search with suggestions.

## Run it locally
Open `index.html` in a browser. The data and the U.S. map are embedded in the file; it only needs an internet connection to load the D3 and TopoJSON libraries.

## Repository contents
| Path | What it is |
|---|---|
| `index.html` | The D3.js dashboard (served by GitHub Pages) |
| `data/colleges_slim.csv` | Slimmed data: 1,944 operating Bachelor's-degree institutions, 53 columns (47 from the Scorecard, 2 county variables, 2 campus-crime rates, 2 Greek-life percentages) |
| `data/add_crime_greek_data.py` | Adds the four crime and Greek-life columns to the slim CSV (run after `add_county_data.py`) |
| `data/crime_greek_lookup.csv` | The four values per school (plus years and enrollment used), made by `data/make_crime_greek_lookup.py` |
| `data/make_crime_greek_lookup.py` | Documents every rule used to derive them from the 100 MB merged file (not in the repository); usage is in its first lines |
| `data/prepare_data.py` | Script that builds the slim CSV from the full College Scorecard download |
| `data/add_county_data.py` | Adds the two county variables to the slim CSV (run after the script above) |
| `data/school_county.csv` | County code for each school (made by `data/assign_county.mjs` from latitude/longitude) |
| `data/assign_county.mjs` | Node script that finds each school's county; usage is in its first lines |
| `data/acs2021_county.json` | Raw download from the Census Bureau API: American Community Survey 5-year estimates 2017–2021, all counties |
| `vega-lite/college_dashboard.vl.json` | Earlier Vega-Lite version (paste into https://vega.github.io/editor/ and set the data URL on line 5) |

## Data
U.S. Department of Education, [College Scorecard](https://collegescorecard.ed.gov/data/), "Most Recent Cohorts – Institution" file. To rebuild the slim CSV, download the full file (about 100 MB, not included here) and run:

```
pip install pandas numpy
python data/prepare_data.py Most-Recent-Cohorts-Institution.csv data/colleges_slim.csv
python data/add_county_data.py
python data/add_crime_greek_data.py
```

The second command adds two county-level variables from the U.S. Census Bureau's American Community Survey (5-year estimates 2017–2021, chosen to match the years in which the Scorecard earnings were measured): the median household income of the school's county and the share of adults aged 25+ with a bachelor's degree or higher. The county of each school comes from its latitude and longitude (`data/school_county.csv`).

Things to know about the data:
- **Crime and Greek-life columns (added later):** they come from a merged file shared by a project partner (Scorecard + campus-crime counts + a Greek-life list), not from the Scorecard. Crime values are on-campus counts per 1,000 students, averaged over the reported years; the three years are labelled 5, 6 and 7 in the source, probably 2005–07 (**not confirmed**), so they are about 15 years older than the earnings. Only schools whose name matched exactly are used, and the file's own enrollment must be at least half of the Scorecard's undergraduate count. 1,145 of 1,944 schools have a crime value. Greek-life percentages exist for 322 schools (17%); 0 means the list says the school has no fraternities or sororities, blank means the school is not in the list or reported no percentage. Branch campuses and tiny schools can give extreme crime rates.
- It covers Title IV students only (those receiving federal aid), not all students.
- Earnings are medians, so the map offers median, mean and enrollment-weighted options and does not simply average them.
- Missing values (`PrivacySuppressed`, `NULL`) are left out, so some variables cover fewer schools. Dropdown labels mark the ones with weak coverage.
- Only currently operating institutions whose predominant degree is a Bachelor's are included (1,944 schools; 1,790 of them have 10-year earnings). The 5 U.S. service academies (coded "U.S. service schools" by the Scorecard) are kept and assigned to their state's region. The numbers describe whole schools, including all federally aided students there, not only Bachelor's students.
- Variables were chosen using the College Scorecard documentation and errata; outdated variables were replaced.
- The two county variables describe the school's county, not its students or where they later work. Schools in the same county share one value (about 800 counties), and the Census values are survey estimates with margins of error that are not used here. Six schools with 10-year earnings have no county value (the U.S. Virgin Islands and Guam are not covered, and four schools lack usable coordinates).

## Design
- Colours from [ColorBrewer](https://colorbrewer2.org/): Dark2 for school type, Blues for the map and boxplot, Greys for neutral elements.
- Built with [D3.js](https://d3js.org/) v7 and [TopoJSON](https://github.com/topojson/topojson) (U.S. state shapes from the `us-atlas` / vega-datasets data).

## Use of AI
Claude (Anthropic) was used to help write the code, prepare the data and plan the project. See the AI declaration in the report for details.
