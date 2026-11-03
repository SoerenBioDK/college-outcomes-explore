"""
make_field_programs.py - make data/field_programs.csv and data/cip_names.csv from the College Scorecard Field of Study file.

Usage:  python3 data/make_field_programs.py <Most-Recent-Cohorts-Field-of-Study.csv> data/colleges_slim.csv

Rules (see FieldOfStudyDataDocumentation.pdf):
  * Only Bachelor's-degree programs (CREDLEV = 3) at the schools in colleges_slim.csv (joined on UNITID; rows without a UNITID cannot be joined).
  * Missing codes PrivacySuppressed / PS / NA / NULL / empty become empty. A program is kept if at least one of the three values below exists.
  * Count   = credentials awarded in the field per year: the mean of IPEDSCOUNT1 and IPEDSCOUNT2 (two consecutive award years), rounded.
  * Earn_5yr = EARN_MDN_5YR  median earnings 5 years after completing, completers who worked and were not enrolled (federally aided students only)
  * Earn_1yr = EARN_MDN_1YR  the same, 1 year after completing
  * Debt     = DEBT_ALL_STGP_EVAL_MDN  median debt of graduates from loans taken at THIS school only (Direct Stafford + graduate PLUS;
               Parent PLUS is not included)
  The file has no year column: the cohort years are not stated. Branch campuses that share a main campus (OPEID6) repeat the same values.
cip_names.csv: the four-digit CIP code and its description (trailing full stop removed).
"""
import csv, sys, statistics
fos, slim = sys.argv[1:3]
keep = {r["UNITID"].strip() for r in csv.DictReader(open(slim, newline="", encoding="utf-8"))}
BAD = {"", "PS", "NA", "NULL", "PrivacySuppressed"}
def num(v):
    v = (v or "").strip()
    if v in BAD: return None
    try: return float(v)
    except ValueError: return None
out, names, n_in = [], {}, 0
with open(fos, newline="", encoding="utf-8-sig") as fh:
    for r in csv.DictReader(fh):
        u = r["UNITID"].strip()
        if r["CREDLEV"].strip() != "3" or u not in keep: continue
        n_in += 1
        c = r["CIPCODE"].strip(); names[c] = r["CIPDESC"].strip().rstrip(".")
        e5, e1, d = num(r["EARN_MDN_5YR"]), num(r["EARN_MDN_1YR"]), num(r["DEBT_ALL_STGP_EVAL_MDN"])
        if e5 is None and e1 is None and d is None: continue
        cnt = [x for x in (num(r["IPEDSCOUNT1"]), num(r["IPEDSCOUNT2"])) if x is not None]
        f = lambda x: "" if x is None else str(int(round(x)))
        out.append([u, c, f(statistics.mean(cnt)) if cnt else "", f(e5), f(e1), f(d)])
with open("data/field_programs.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh, lineterminator="\n"); w.writerow(["UNITID","CIPCODE","Count","Earn_5yr","Earn_1yr","Debt"]); w.writerows(out)
with open("data/cip_names.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh, lineterminator="\n"); w.writerow(["CIPCODE","Field"]); w.writerows(sorted(names.items()))
print(f"{n_in} Bachelor's programs at the schools; {len(out)} kept (at least one value); {len({o[0] for o in out})} schools; {len(names)} fields")
