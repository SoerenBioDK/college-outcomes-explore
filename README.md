# College Outcomes Explorer

An interactive dashboard for exploring how U.S. college outcomes (earnings, completion, debt, loan default, retention) relate to institution characteristics (school type, cost, aid, student mix, size, selectivity, location) at U.S. Bachelor's-degree institutions. Built as the course project for the Data Visualization course.

**Live version:** https://soerenbiodk.github.io/college-outcomes-explore/

## What it shows
Three views, switched with the tabs at the top: **Explore** (panels 1-4, linked), **For whom?** (panel 5) and **Find a school** (panels 6-9). Explore and For whom? share the same filters and selections; Find a school has its own controls. Everything responds to the filters, to clicking states on the map, to brushing in the scatterplot and to brushing the axes of the parallel coordinates. Each chart has an (i) button next to its title; click it to see how to read and use that chart.

1. **Parallel coordinates:** one line per school through six measures (net price, % Pell grants, completion, retention, graduate debt, 10-year earnings). Drag on an axis to keep a range; click a line to follow that school in view 4. Only the schools with all six values are drawn.
2. **Scatterplot:** the outcome against a continuous variable (29 options such as cost, net price, Pell share, faculty salary, two county variables, two campus-crime rates and two Greek-life percentages), coloured by school type, with a linear trend line. Drag a rectangle to select schools.
3. **Map:** by default every school is a dot, coloured by the chosen outcome in five quantile classes (each holding about a fifth of the schools shown; the five darker steps of ColorBrewer's 7-class Blues) and sized by undergraduate enrollment; the states are ColorBrewer grey and work only as a selector. A "Map shows" switch gives the earlier version instead: states shaded by the median, mean or enrollment-weighted mean of the outcome, with small plain dots. Click a state to add or remove it, or drag a box over the map to pick several (hold Shift to add). A counter shows how many universities in how many states match. When the boxplot is grouped by Region, the region borders and names are drawn on the map.
4. **Percentile profile:** ranks one school (click its line in view 1, or use Search) among all 1,944 schools on each of the six measures, 0 = lowest, 100 = highest. The band shows the middle 50% of the schools currently selected and the tick their median; with no school chosen, the dot is the median school of the selection.
5. **For whom?** One dot per school comparing two groups of students at the same school (pick the comparison in the panel): earnings of students from families with income of $30k or less vs above $75k (fixed FAFSA income bands, not equal thirds); loan repayment rate (5 years) for Pell vs non-Pell students, family income $30k or less vs above $75k, or first-generation vs other students. Both axes use the same scale, so the dashed diagonal means "equal". The side text gives the median gap, the share of schools above the line and r for the current selection. Federally aided students only; descriptive, not causal.
6. **Find a school (tab 3):** pick an area (U.S., one of the 8 Scorecard regions or a state), the most debt you accept (median debt of graduates) and the earnings you want (typical 10 years after entry). A school fits if it meets both limits. The tab shows the list of fitting schools (sorted by highest earnings or lowest debt), a debt-vs-earnings scatterplot with the fit zone shaded, a map of the fitting schools, and the percentile profile of a clicked school. Below the profile, a table of that school's Bachelor's programs from the Field of Study file (largest first; earnings 1 and 5 years after completing and debt at the school; a dash = suppressed). Schools without any published program value fall back to the three largest fields by share of degrees (`Top_fields`). Layout: a compact criteria bar on top (row 1: area, broad field, field, colour of the dots; row 2: debt = x-axis, earnings = y-axis, completion rate, net price; row 3: the two checkboxes and the sort), then the map and the scatterplot side by side (so they fit on one screen), then the list (top 3, with a button to show up to 50) and the profile. Dots are circles coloured by school type (ColorBrewer Dark2, 3 classes, rated colour-blind safe; checked with a Machado et al. 2009 simulation: the closest pair under protanopia/deuteranopia is Public vs Private nonprofit, CIEDE2000 about 19-22, still distinguishable) or, if chosen, by net price, completion rate or earnings (ColorBrewer Blues, five quantile classes; Greys = no value). Grey dots on the map and scatterplot are the other schools in the area (can be hidden). The broad fields are my own grouping of the 2-digit CIP families (Natural sciences and mathematics = 26, 27, 40; Agriculture and natural resources = 01, 03; Engineering = 14, 15; Computing = 11; Health = 51; Business = 52; Social sciences and public service = 05, 42-45; Humanities = 16, 23, 24, 38, 54; Arts, design, architecture and media = 04, 09, 10, 50; Education = 13; Other = 19, 30, 31, 49); picking one only narrows the list of fields. Optional extra criteria: a **field of study** (111 Bachelor's fields with at least 30 programs that have both values; the debt and earnings criteria then use that program's numbers at each school: earnings 5 years after completing, debt from loans taken at that school), a minimum **completion rate**, a maximum **net price** per year (both school-wide; schools without the value are left out when the limit is on) and a checkbox for the 9 **military and maritime academies** (flagged by name in `Special`; included by default). Earnings are typical medians for federally aided students at the school, not a prediction for one person; program earnings are early-career medians for completers from cohorts whose years the file does not give, and they are not comparable to the 10-year earnings used for the criteria (those start at entry and include students who did not finish).

Other controls: school type, region (the College Scorecard's 8 regions plus outlying areas), minimum undergraduate size, and a university search with suggestions.

## Run it locally
Open `index.html` in a browser. The data and the U.S. map are embedded in the file; it only needs an internet connection to load the D3 and TopoJSON libraries.

## Repository contents
| Path | What it is |
|---|---|
| `index.html` | The D3.js dashboard (served by GitHub Pages) |
| `data/colleges_slim.csv` | Slimmed data: 1,944 operating Bachelor's-degree institutions, 53 columns (47 from the Scorecard, 2 county variables, 2 campus-crime rates, 2 Greek-life percentages) |
| `data/add_crime_greek_data.py` | Adds the four crime and Greek-life columns to the slim CSV (run after `add_county_data.py`) |
| `data/add_group_columns.py` | Adds eight group columns (earnings by family-income band ($30k or less / above $75k); repayment rate by Pell, family income, first-generation status) to the slim CSV from the full Scorecard file: `python3 data/add_group_columns.py <full Scorecard CSV> data/colleges_slim.csv` |
| `data/add_special_flag.py` | Adds the column `Special` (1 = the nine military and maritime academies, found by school name) to the slim CSV: `python3 data/add_special_flag.py data/colleges_slim.csv` |
| `data/add_top_fields.py` | Adds the text column `Top_fields` (up to three largest fields of study by share of degrees, from the `PCIP` columns) to the slim CSV: `python3 data/add_top_fields.py <full Scorecard CSV> data/colleges_slim.csv` |
| `data/make_field_programs.py` | Makes `data/field_programs.csv` (Bachelor's programs: UNITID, 4-digit CIP code, graduates per year, earnings 5 and 1 years after completing, debt at the school) and `data/cip_names.csv` from the Field of Study file: `python3 data/make_field_programs.py <Most-Recent-Cohorts-Field-of-Study.csv> data/colleges_slim.csv` |
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
- Colours from [ColorBrewer](https://colorbrewer2.org/): Dark2 for school type, Blues for the map and the percentile band, Greys for neutral elements.
- Built with [D3.js](https://d3js.org/) v7 and [TopoJSON](https://github.com/topojson/topojson) (U.S. state shapes from the `us-atlas` / vega-datasets data).

## Use of AI
Claude (Anthropic) was used to help write the code, prepare the data and plan the project. See the AI declaration in the report for details.
