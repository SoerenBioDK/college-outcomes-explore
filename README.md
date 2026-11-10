# College Outcomes Explorer

An interactive dashboard for exploring how U.S. college outcomes (earnings, completion, debt, loan default, retention) relate to institution characteristics (school type, cost, aid, student mix, size, selectivity, location) at U.S. Bachelor's-degree institutions. Built as the course project for the Data Visualization course.

**Live version:** https://soerenbiodk.github.io/college-outcomes-explore/

## What it shows
Four views, switched with the tabs at the top: **Explore** (panels 1-4, linked), **For whom?** (panel 5), **Find a school** (panels 6-9) and **Rank schools** (panel 10). Explore and For whom? share the same filters and selections; Find a school has its own controls. Everything responds to the filters, to clicking states on the map, to brushing in the scatterplot and to brushing the axes of the parallel coordinates. Each chart has an (i) button next to its title; click it to see how to read and use that chart.

1. **Parallel coordinates:** one line per school through six measures (net price, % Pell grants, completion, retention, graduate debt, 10-year earnings). Drag on an axis to keep a range; click a line to follow that school in view 4. Only the schools with all six values are drawn.
2. **Scatterplot:** the outcome against a continuous variable (25 options such as cost, net price, Pell share, faculty salary and two county variables), coloured by school type, with a linear trend line. Drag a rectangle to select schools.
3. **Map:** by default every school is a dot, coloured by the chosen outcome in five quantile classes (each holding about a fifth of the schools shown; the five darker steps of ColorBrewer's 7-class Blues) and sized by undergraduate enrollment; the states are ColorBrewer grey and work only as a selector. A "Map shows" switch gives the earlier version instead: states shaded by the median, mean or enrollment-weighted mean of the outcome, with small plain dots. Click a state to add or remove it, or drag a box over the map to pick several (hold Shift to add). A counter shows how many universities in how many states match. When the boxplot is grouped by Region, the region borders and names are drawn on the map.
4. **Percentile profile:** ranks one school (click its line in view 1, or use Search) among all 1,944 schools on each of the six measures, 0 = lowest, 100 = highest. The band shows the middle 50% of the schools currently selected and the tick their median; with no school chosen, the dot is the median school of the selection.
5. **For whom?** One dot per school comparing two groups of students at the same school (pick the comparison in the panel): earnings of students from families with income of $30k or less vs above $75k (fixed FAFSA income bands, not equal thirds); loan repayment rate (5 years) for Pell vs non-Pell students, family income $30k or less vs above $75k, or first-generation vs other students. Both axes use the same scale, so the dashed diagonal means "equal". The side text gives the median gap, the share of schools above the line and r for the current selection. Federally aided students only; descriptive, not causal.
6. **Find a school (tab 3):** pick an area (U.S., one of the 8 Scorecard regions or a state), the most debt you accept (median debt of graduates) and the earnings you want (typical 10 years after entry). A school fits if it meets both limits. The tab shows the list of fitting schools (sorted by highest earnings or lowest debt), a debt-vs-earnings scatterplot with the fit zone shaded, a map of the fitting schools, and the percentile profile of a clicked school. Below the profile, a table of that school's Bachelor's programs from the Field of Study file (largest first; earnings 1 and 5 years after completing and debt at the school; a dash = suppressed). Schools without any published program value fall back to the three largest fields by share of degrees (`Top_fields`). Layout: a compact criteria bar on top (row 1: area, broad field, field, colour of the dots; row 2: debt = x-axis, earnings = y-axis, completion rate, net price; row 3: the two checkboxes and the sort), then the map and the scatterplot side by side (so they fit on one screen), then the list (top 3, with a button to show up to 50) and the profile. Map dots are sized by undergraduate enrolment (square-root scale, 100 to 30,000+ students; the size key is shown above the maps); scatterplot dots all have the same size except that fitting schools are larger. Dots are circles coloured by school type (ColorBrewer Dark2, 3 classes, rated colour-blind safe; checked with a Machado et al. 2009 simulation: the closest pair under protanopia/deuteranopia is Public vs Private nonprofit, CIEDE2000 about 19-22, still distinguishable) or, if chosen, by net price, completion rate or earnings (ColorBrewer Blues, five quantile classes; Greys = no value). Grey dots on the map and scatterplot are the other schools in the area (can be hidden). The broad fields are my own grouping of the 2-digit CIP families (Natural sciences and mathematics = 26, 27, 40; Agriculture and natural resources = 01, 03; Engineering = 14, 15; Computing = 11; Health = 51; Business = 52; Social sciences and public service = 05, 42-45; Humanities = 16, 23, 24, 38, 54; Arts, design, architecture and media = 04, 09, 10, 50; Education = 13; Other = 19, 30, 31, 49); picking one narrows the list of fields, and if no single field is chosen each school is represented by its largest program in that group (most graduates a year, ties: lower CIP code) that has both a 5-year earnings and a debt value; the tooltip names the program. Optional extra criteria: a **field of study** (111 Bachelor's fields with at least 30 programs that have both values; the debt and earnings criteria then use that program's numbers at each school: earnings 5 years after completing, debt from loans taken at that school), a minimum **completion rate**, a maximum **net price** per year (both school-wide; schools without the value are left out when the limit is on) and a checkbox for the 9 **military and maritime academies** (flagged by name in `Special`; included by default). Earnings are typical medians for federally aided students at the school, not a prediction for one person; program earnings are early-career medians for completers from cohorts whose years the file does not give, and they are not comparable to the 10-year earnings used for the criteria (those start at entry and include students who did not finish).
10. **Rank schools (tab 4), the "student from abroad" tab: one merged figure.** Layout: a left sidebar (filters, weights, region/state + map) and one wide figure that merges a **LineUp-style ranking** with a **slope graph and real-value bars**.
    - **Filters** (a school outside them is not ranked at all): one **field of study** select (any field; "All of <broad field>" uses each school's largest program in that broad field; or one of the Bachelor's fields from the Find tab), **minimum earnings** (the program's earnings 5 years after completing when a field is chosen, otherwise the school's earnings 10 years after entry), **maximum out-of-state tuition** (closest to what an international student pays; a cost-measure choice was removed to keep it simple), school type and name search. **Region and state** are two selects above the map (the nine Scorecard regions used on the Explore tab; the state list narrows to the region; the map zooms to the choice). U.S. military and maritime academies are always left out (they admit U.S. citizens and have almost no tuition, which would otherwise top the ranking). "Grad debt" (federal loans) stays in the starting set but does not describe international students; it can be removed.
    - **Weights (left sidebar):** one slider per variable (colour = the variable's colour in the figure); moving one rescales the others so the total stays 100%. "+ Add a variable" (up to 8) and "Equal" (reset), ✕ removes. Start: earnings 10 yrs, completion, retention, out-of-state tuition, graduate debt, equal weights. A variable's direction ("high = best" / "low = best") is flipped by clicking it in the column header. Each value is rescaled min-max to 0-100 over all schools with that value (inverted for 'lower is better'), so a variable's points = weight x rescaled value.
    - **Left half of the figure = the ranking** (after LineUp: Gratzl, Lex, Gehlenborg, Pfister and Streit, 2013; simplified): rank, a marker for school type (circle = public, square = private nonprofit, triangle = private for-profit; ColorBrewer Dark2), the school name, a stacked bar of the score (ColorBrewer Set2, one colour per variable) and the **score (0 to 100)** after it. After a weight change, rank changes appear as up/down triangles (blue = up, red = down; they fade). Only schools with all chosen values are ranked; ties share a rank. **Rows** sets how many top schools are drawn.
    - **Right half = one column per variable.** **Same schools:** each column shows the same schools sorted by that variable (best first); a grey line follows each school from column to column. **All schools:** each column shows the best of all ranked schools on that variable alone. Each cell shows the **real value** above a **bar that starts at zero** (same scale for all schools, maximum = highest value in the data); the dashed line is the median of all ranked schools. Under each variable name a histogram of all schools: dragging on it keeps only schools in that range; pinned schools (and the school under the mouse) are marked on it by a tick and an outlined bar.
    - **Pins:** click a school anywhere (row, bar or map dot) to pin it (up to 10). Pinned schools stay coloured and get a number badge (1, 2, 3… in pin order, also on the map and in each column), with near-black lines (#252525, ColorBrewer grey) so line colour never collides with the variable colours; all others turn grey, on the map too. A pinned school outside the shown rows is appended below them.
    - **Map:** all ranked schools as small dots; pinned schools (or the top 8) large and numbered. Drag a box to rank only the schools inside it. Schools outside the 50 states and DC (about 37) cannot be drawn.
    - Not in this version: LineUp's other bar-alignment strategies, nested combinations, a data-mapping editor, collapsing columns, snapshots, a memo pad and filling in missing values.
    - Not an official ranking: the weights are the user's choice. Sources for why these variables (what students say matters when choosing) are in the project notes.

Other controls: school type, region (the College Scorecard's 8 regions plus outlying areas), minimum undergraduate size, and a university search with suggestions.

## Run it locally
Open `index.html` in a browser. The data and the U.S. map are embedded in the file; it only needs an internet connection to load the D3 and TopoJSON libraries.

## Repository contents
The dashboard is the single file `index.html`: the data and the U.S. map are embedded in it, so nothing else is needed to use it. The two folders only document and reproduce the data.

| Path | What it is |
|---|---|
| `index.html` | The D3.js dashboard (served by GitHub Pages) |
| `data/colleges_slim.csv` | Slimmed data: 1,944 operating Bachelor's-degree institutions, 59 columns (47 from the Scorecard, 2 county variables, 8 group columns, `Top_fields`, `Special`) |
| `data/field_programs.csv` | Bachelor's programs (UNITID, 4-digit CIP code, graduates per year, earnings 5 and 1 years after completing, debt at the school), from the Field of Study file |
| `data/cip_names.csv` | The four-digit CIP codes and their names |
| `build/` | Everything needed to rebuild the three data files (scripts and small lookup files); see "Rebuild the data" below |

Files in `build/`:

| File | What it does |
|---|---|
| `prepare_data.py` | Builds the slim CSV from the full College Scorecard download |
| `add_county_data.py` | Adds the two county variables (Census data in `acs2021_county.json`, county of each school in `school_county.csv`) |
| `assign_county.mjs` | Node script that finds each school's county from latitude/longitude and writes `school_county.csv`; usage is in its first lines |
| `acs2021_county.json` | Raw download from the Census Bureau API: American Community Survey 5-year estimates 2017-2021, all counties |
| `add_group_columns.py` | Adds eight group columns (earnings by family-income band ($30k or less / above $75k); repayment rate by Pell, family income, first-generation status) from the full Scorecard file |
| `add_top_fields.py` | Adds the text column `Top_fields` (up to three largest fields of study by share of degrees, from the `PCIP` columns) |
| `add_special_flag.py` | Adds the column `Special` (1 = the nine military and maritime academies, found by school name) |
| `make_field_programs.py` | Makes `data/field_programs.csv` and `data/cip_names.csv` from the Field of Study file |

## Data
U.S. Department of Education, [College Scorecard](https://collegescorecard.ed.gov/data/), "Most Recent Cohorts – Institution" and "Most Recent Cohorts – Field of Study" files (about 100 MB and 150 MB, not included here).

### Rebuild the data
Run from the repository folder, in this order (the last command is only needed for the program table):

```
pip install pandas numpy
python build/prepare_data.py Most-Recent-Cohorts-Institution.csv data/colleges_slim.csv
python build/add_county_data.py
python build/add_group_columns.py Most-Recent-Cohorts-Institution.csv data/colleges_slim.csv
python build/add_top_fields.py Most-Recent-Cohorts-Institution.csv data/colleges_slim.csv
python build/add_special_flag.py data/colleges_slim.csv
python build/make_field_programs.py Most-Recent-Cohorts-Field-of-Study.csv data/colleges_slim.csv
```

After rebuilding, the CSV contents have to be pasted into `index.html` again (the dashboard embeds them). Checked on 2026-11-03: running these commands on the Scorecard files gives the same `colleges_slim.csv` (compared value by value) and byte-identical `field_programs.csv` and `cip_names.csv`; `assign_county.mjs` was not re-run (it needs extra Node packages), its result `school_county.csv` is used as is.

`add_county_data.py` adds two county-level variables from the U.S. Census Bureau's American Community Survey (5-year estimates 2017–2021, chosen to match the years in which the Scorecard earnings were measured): the median household income of the school's county and the share of adults aged 25+ with a bachelor's degree or higher. The county of each school comes from its latitude and longitude (`build/school_county.csv`).

Things to know about the data:
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
