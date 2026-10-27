"""
add_crime_greek_data.py - add four school-level variables to colleges_slim.csv (run AFTER add_county_data.py).

Adds, from data/crime_greek_lookup.csv (made by make_crime_greek_lookup.py; rules are described there):
  Crime_violent_per1000   on-campus violent crimes per 1,000 students (mean of reported years, older data - years unconfirmed, probably 2005-07)
  Crime_property_per1000  on-campus property crimes per 1,000 students (same)
  Greek_fraternity_pct    % of undergraduates in fraternities (0 = no fraternities; blank = not in the Greek-life list or not reported)
  Greek_sorority_pct      % of undergraduates in sororities (same)
Existing columns are copied unchanged; the four columns are replaced (not duplicated) if the script is run twice.
Usage (from the repository folder):  python3 data/add_crime_greek_data.py   [optional: <slim_in.csv> <slim_out.csv>]
"""
import csv, sys
from pathlib import Path

here = Path(__file__).resolve().parent
src = Path(sys.argv[1]) if len(sys.argv) > 1 else here / "colleges_slim.csv"
dst = Path(sys.argv[2]) if len(sys.argv) > 2 else src
NEW = ["Crime_violent_per1000", "Crime_property_per1000", "Greek_fraternity_pct", "Greek_sorority_pct"]

lk = {}
with open(here / "crime_greek_lookup.csv", encoding="utf-8", newline="") as f:
    for r in csv.DictReader(f):
        lk[r["UNITID"].split(".")[0]] = [r[c] for c in NEW]

with open(src, encoding="utf-8", newline="") as f:
    rows = list(csv.reader(f))
header, body = rows[0], rows[1:]
keep = [i for i, h in enumerate(header) if h not in NEW]
out = [[header[i] for i in keep] + NEW]
have = [0] * 4
for r in body:
    vals = lk.get(r[0], [""] * 4)
    for k in range(4):
        have[k] += vals[k] != ""
    out.append([r[i] for i in keep] + vals)
with open(dst, "w", encoding="utf-8", newline="") as f:
    csv.writer(f, lineterminator="\n").writerows(out)
print(f"{len(body)} schools; " + "; ".join(f"{n}: {h} values" for n, h in zip(NEW, have)) + f" -> {dst}")
