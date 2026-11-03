"""
add_special_flag.py - add the column Special (1 or empty) to data/colleges_slim.csv.

Usage:  python3 data/add_special_flag.py data/colleges_slim.csv

Special = 1 for military and maritime academies, found by school name (the Scorecard has no flag for them):
  the U.S. Air Force Academy, Coast Guard Academy, Naval Academy, Military Academy, Merchant Marine Academy, and the maritime colleges
  (name contains "Maritime"): Cal Poly, Maine, Massachusetts and SUNY Maritime. 9 schools in the Bachelor's data.
Why: these schools have special entry rules (nomination, service obligations) and licensed-officer careers, so they stand out
(Merchant Marine $90.6k and SUNY Maritime $96.0k 10-year earnings; the four service academies have no cost or earnings values).
Aeronautical schools such as Embry-Riddle are NOT included. Safe to run twice.
"""
import csv, re, sys
p = sys.argv[1]
pat = re.compile(r"Maritime|Merchant Marine Academy|Naval Academy|Coast Guard Academy|Air Force Academy|Military Academy", re.I)
with open(p, newline="", encoding="utf-8") as fh:
    r = csv.DictReader(fh); cols = list(r.fieldnames); data = list(r)
if "Special" not in cols: cols.append("Special")
n = 0
for row in data:
    row["Special"] = "1" if pat.search(row["INSTNM"]) else ""
    n += row["Special"] == "1"
with open(p, "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=cols, lineterminator="\n"); w.writeheader(); w.writerows(data)
print(f"Special flag set for {n} schools:", ", ".join(r["INSTNM"] for r in data if r["Special"]))
