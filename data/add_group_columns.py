"""
add_group_columns.py - add eight "same school, two groups of students" columns to data/colleges_slim.csv.

Usage:  python3 data/add_group_columns.py <full Scorecard institution CSV> data/colleges_slim.csv
(The full file is the College Scorecard "Most Recent Cohorts - Institution" CSV, or any file that has its columns and UNITID.)

Adds (joined on UNITID; missing codes PrivacySuppressed / PS / NA / NULL / empty become empty):
  Earnings_10yr_inc_low / _inc_high   MD_EARN_WNE_INC1_P10 / MD_EARN_WNE_INC3_P10: median earnings 10 years after entry for students
                                      from the lowest / highest third of family income ($)
  Repay5_pell / Repay5_nonpell        PELL_RPY_5YR_RT / NOPELL_RPY_5YR_RT: share of borrowers repaying (balance falling) 5 years after
                                      repayment starts, Pell vs non-Pell students (%, the Scorecard fraction x 100)
  Repay5_inc_low / Repay5_inc_high    LO_INC_RPY_5YR_RT / HI_INC_RPY_5YR_RT: same, lowest vs highest family-income group (%)
  Repay5_firstgen / Repay5_notfirstgen FIRSTGEN_RPY_5YR_RT / NOTFIRSTGEN_RPY_5YR_RT: first-generation vs other students (%)
Federally aided students only. Safe to run twice (existing columns are overwritten with the same values).
"""
import csv, sys
MAP = [("Earnings_10yr_inc_low","MD_EARN_WNE_INC1_P10",1),("Earnings_10yr_inc_high","MD_EARN_WNE_INC3_P10",1),
       ("Repay5_pell","PELL_RPY_5YR_RT",100),("Repay5_nonpell","NOPELL_RPY_5YR_RT",100),
       ("Repay5_inc_low","LO_INC_RPY_5YR_RT",100),("Repay5_inc_high","HI_INC_RPY_5YR_RT",100),
       ("Repay5_firstgen","FIRSTGEN_RPY_5YR_RT",100),("Repay5_notfirstgen","NOTFIRSTGEN_RPY_5YR_RT",100)]
def num(v,f):
    try: x=float(v)
    except (TypeError,ValueError): return ""        # PrivacySuppressed, PS, NA, NULL, empty
    return str(round(x*f,2)) if f!=1 else str(int(round(x)))
full_path, slim_path = sys.argv[1:3]
src = {}
with open(full_path, newline="", encoding="utf-8-sig") as fh:
    r = csv.DictReader(fh)
    missing = [c for _,c,_ in MAP if c not in r.fieldnames]
    if missing: sys.exit("Columns not found in the full file: "+", ".join(missing))
    for row in r:
        u = row["UNITID"].strip()
        if u and u not in src: src[u] = row
with open(slim_path, newline="", encoding="utf-8") as fh:
    r = csv.DictReader(fh); cols = list(r.fieldnames); data = list(r)
for n,_,_ in MAP:
    if n not in cols: cols.append(n)
hit = 0
for row in data:
    s = src.get(row["UNITID"].strip())
    hit += s is not None
    for n,c,f in MAP: row[n] = num(s[c],f) if s else ""
with open(slim_path, "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=cols, lineterminator="\n"); w.writeheader(); w.writerows(data)
print(f"{hit} of {len(data)} schools found in the full file; columns now: {len(cols)}")
for n,_,_ in MAP: print(f"  {n:24s} {sum(1 for r in data if r[n]!=''):5d} values")
