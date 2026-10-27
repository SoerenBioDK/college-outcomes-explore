"""
make_crime_greek_lookup.py - build data/crime_greek_lookup.csv from a friend's merged file
(College Scorecard + campus-crime counts + Greek-life percentages, 'merged_scorecard_crime_greek.csv').

The big source file (about 100 MB) is NOT kept in the repository. This script documents exactly how the four
added variables are derived from it. Run it only if you have that file; the result (crime_greek_lookup.csv, a few
hundred KB) is kept in the repository and used by add_crime_greek_data.py.

Usage:  python3 data/make_crime_greek_lookup.py <merged_scorecard_crime_greek.csv> data/colleges_slim.csv

Rules (every one is a choice made for this project; change here if you disagree):
  Crime (columns CR_Oncampuscrime_*, suffix 5/6/7 = three reporting years; the suffix is read as 2005/06/07, NOT confirmed):
    - Only schools whose crime match grade starts with "A_" (name matches) are used; grades B and C (name differs) are left blank.
    - A year counts only if its FILTER flag is 1 (the school reported that year). Blank counts are not zero.
    - Violent crimes = MURD + NEG_M (negligent manslaughter) + FORCIB (forcible sex offences) + ROBBE + AGG_A (aggravated assault).
    - Property crimes = BURGLA + VEHIC (motor-vehicle theft) + ARSON.  Non-forcible sex offences (NONFOR) are left out of both.
    - On-campus counts only (not residence halls, non-campus or public property rows); arrests and discipline are left out
      because they reflect enforcement as much as crime.
    - Rate per year = count / CR_enrollment_total * 1000, using the crime file's own enrollment (same period as the counts).
      Rate is blank when that enrollment is missing or 0. The value is the mean of the reported years' rates; at least 2 of the 3 years are required.
    - Plausibility check: the crime file's enrollment is sometimes clearly wrong (e.g. 1 student at a school with 8,034 undergraduates).
      It is accepted only if it is at least 50% of the Scorecard's undergraduate count (Enrollment in colleges_slim.csv; the crime file's
      total can include graduate students, so it should not be smaller). Schools failing the check get blank crime rates.
  Greek life (columns GL_*):
    - GL_pct_fraternity_num / GL_pct_sorority_num (percent of undergraduates in fraternities / sororities), including the values the
      source marks as estimates (asterisk).
    - 0 when the source says the school has no fraternities / sororities (flag "none" and GL_Fraternities / GL_Sororities = N).
    - Blank when the school is not in the Greek-life list at all, or the list gives no percentage ("Not Reported").
Output columns: UNITID, Crime_violent_per1000, Crime_property_per1000, Greek_fraternity_pct, Greek_sorority_pct,
                crime_years_used, crime_enrollment_used   (the last two are for traceability only)
"""
import sys
import pandas as pd

src = sys.argv[1]
slim = sys.argv[2]
VIO = ["MURD", "NEG_M", "FORCIB", "ROBBE", "AGG_A"]
PRO = ["BURGLA", "VEHIC", "ARSON"]
YEARS = ["5", "6", "7"]
crime_cols = [f"CR_Oncampuscrime_{k}{y}" for k in VIO + PRO for y in YEARS]
filt_cols = [f"CR_Oncampuscrime_FILTER0{y}" for y in YEARS]
need = (["UNITID", "IN_CRIME", "IN_GREEK", "CR_match_grade", "CR_enrollment_total", "GL_Fraternities", "GL_Sororities",
         "GL_FlagFraternity", "GL_FlagSorority", "GL_pct_fraternity_num", "GL_pct_sorority_num"] + crime_cols + filt_cols)
d = pd.read_csv(src, usecols=need, low_memory=False)
assert d.UNITID.is_unique, "UNITID must be unique in the source"
num = lambda s: pd.to_numeric(s, errors="coerce")
for c in crime_cols + filt_cols + ["CR_enrollment_total", "GL_pct_fraternity_num", "GL_pct_sorority_num"]:
    d[c] = num(d[c])

sl = pd.read_csv(slim, usecols=["UNITID", "Enrollment"])
d = d.merge(sl, on="UNITID", how="left")
plausible = d.CR_enrollment_total >= 0.5 * d.Enrollment
ok = d.IN_CRIME.astype(str).str.lower().eq("true") & d.CR_match_grade.astype(str).str.startswith("A_") & (d.CR_enrollment_total > 0) & plausible
def rate(keys, y):
    cnt = d[[f"CR_Oncampuscrime_{k}{y}" for k in keys]]
    reported = d[f"CR_Oncampuscrime_FILTER0{y}"].eq(1) & cnt.notna().all(axis=1) & ok
    return (cnt.sum(axis=1) / d.CR_enrollment_total * 1000).where(reported)
vr = pd.concat([rate(VIO, y) for y in YEARS], axis=1)
pr = pd.concat([rate(PRO, y) for y in YEARS], axis=1)
nyears = vr.notna().sum(axis=1)
use = nyears >= 2
out = pd.DataFrame({"UNITID": d.UNITID})
out["Crime_violent_per1000"] = vr.mean(axis=1).where(use).round(2)
out["Crime_property_per1000"] = pr.mean(axis=1).where(use).round(2)

in_gl = d.IN_GREEK.astype(str).str.lower().eq("true")
def greek(pct, yn, flag):
    v = d[pct].where(in_gl)
    none = in_gl & d[yn].eq("N") & d[flag].eq("none")
    return v.mask(none & v.isna(), 0.0)
out["Greek_fraternity_pct"] = greek("GL_pct_fraternity_num", "GL_Fraternities", "GL_FlagFraternity")
out["Greek_sorority_pct"] = greek("GL_pct_sorority_num", "GL_Sororities", "GL_FlagSorority")
out["crime_years_used"] = nyears.where(use)
out["crime_enrollment_used"] = d.CR_enrollment_total.where(use)
out = out[out[["Crime_violent_per1000", "Greek_fraternity_pct", "Greek_sorority_pct"]].notna().any(axis=1)]
dst = __file__.rsplit("/", 1)[0] + "/crime_greek_lookup.csv" if "/" in __file__ else "crime_greek_lookup.csv"
out.to_csv(dst, index=False, lineterminator="\n")
print(f"{len(out)} schools with at least one value -> {dst}")
ids = set(sl.UNITID)
o = out[out.UNITID.isin(ids)]
print(f"of the {len(ids)} schools in {slim}:", {c: int(o[c].notna().sum()) for c in out.columns[1:5]})
print("crime-matched (grade A, enrollment > 0) but dropped by the plausibility check:", int((d.IN_CRIME.astype(str).str.lower().eq("true") & d.CR_match_grade.astype(str).str.startswith("A_") & (d.CR_enrollment_total > 0) & ~plausible & d.Enrollment.notna()).sum()))
