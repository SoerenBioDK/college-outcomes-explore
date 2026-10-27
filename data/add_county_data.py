"""
add_county_data.py - add two county-level variables to colleges_slim.csv

Run this AFTER prepare_data.py (which builds the slim CSV from the full College Scorecard file).

What it adds (one value per school, taken from the school's county):
  County_median_hh_income  Median household income of the county, in dollars (ACS table B19013, variable B19013_001E).
  County_bachelors_share   Share of adults aged 25+ in the county with a bachelor's degree or higher, in percent
                           = (B15003_022E + B15003_023E + B15003_024E + B15003_025E) / B15003_001E * 100
                           (bachelor's, master's, professional school, doctorate).

Source: U.S. Census Bureau, American Community Survey 5-year estimates 2017-2021 (api.census.gov/data/2021/acs/acs5).
        Chosen to match the calendar years in which the Scorecard earnings were measured (2020-2021).
        The raw download is kept in data/acs2021_county.json so every number can be traced.

Which county a school is in: data/school_county.csv, made by data/assign_county.mjs from the school's
LATITUDE/LONGITUDE and a county map (point-in-polygon; schools are only matched to counties in their own state).
Schools without a county (no coordinates, online-only addresses, Guam, U.S. Virgin Islands) get an empty value.

Caveats (also stated in the report):
  - The value describes the county, not where the school's students live or later work.
  - Schools in the same county share the same value (about 800 different counties).
  - ACS values are survey estimates with margins of error (not used here).
  - Negative Census placeholder codes (e.g. -666666666) are treated as missing.

Usage (from the repository folder):
  python3 data/add_county_data.py
Optional: python3 data/add_county_data.py <slim_in.csv> <slim_out.csv>
Running it twice is safe: the two columns are replaced, not duplicated.
"""
import csv, json, sys
from pathlib import Path

here = Path(__file__).resolve().parent
src = Path(sys.argv[1]) if len(sys.argv) > 1 else here / "colleges_slim.csv"
dst = Path(sys.argv[2]) if len(sys.argv) > 2 else src
NEW = ["County_median_hh_income", "County_bachelors_share"]

# --- ACS county table -> the two derived variables, keyed by 5-digit county FIPS code
raw = json.load(open(here / "acs2021_county.json", encoding="utf-8"))
hdr = raw[0]
ix = {name: i for i, name in enumerate(hdr)}

def num(row, name):
    try:
        v = float(row[ix[name]])
    except (TypeError, ValueError):
        return None
    return v if v >= 0 else None          # negative values are Census placeholder codes

county = {}
for row in raw[1:]:
    fips = row[ix["state"]] + row[ix["county"]]
    inc = num(row, "B19013_001E")
    tot = num(row, "B15003_001E")
    parts = [num(row, c) for c in ("B15003_022E", "B15003_023E", "B15003_024E", "B15003_025E")]
    share = None
    if tot and all(p is not None for p in parts):
        share = sum(parts) / tot * 100
    county[fips] = (None if inc is None else str(int(round(inc))),
                    None if share is None else f"{share:.1f}")

# --- school -> county
sc = {}
with open(here / "school_county.csv", encoding="utf-8", newline="") as f:
    for r in csv.DictReader(f):
        sc[r["UNITID"]] = r["COUNTY_FIPS"]

# --- append to the slim CSV (all existing columns are copied unchanged, as text)
with open(src, encoding="utf-8", newline="") as f:
    rows = list(csv.reader(f))
header, body = rows[0], rows[1:]
keep = [i for i, h in enumerate(header) if h not in NEW]
out = [[header[i] for i in keep] + NEW]
have = [0, 0]
for r in body:
    vals = county.get(sc.get(r[0], ""), (None, None))
    for k in range(2):
        have[k] += vals[k] is not None
    out.append([r[i] for i in keep] + ["" if v is None else v for v in vals])
with open(dst, "w", encoding="utf-8", newline="") as f:
    csv.writer(f, lineterminator="\n").writerows(out)
print(f"{len(body)} schools; {NEW[0]}: {have[0]} values; {NEW[1]}: {have[1]} values -> {dst}")
