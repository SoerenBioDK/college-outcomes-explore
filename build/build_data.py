"""
build_data.py - ONE script from the raw College Scorecard files to the data the tool uses.

Usage:
    python3 build_data.py <Most-Recent-Cohorts-Institution.csv> <Most-Recent-Cohorts-Field-of-Study.csv> <output folder>

Writes into the output folder:
    colleges_slim.csv    one row per Bachelor's-degree school, only the columns the tool uses (24)
    field_programs.csv   Bachelor's programs per school (for the field-of-study filter)
    cip_names.csv        four-digit field code -> field name

Filtering, in this order (the counts are printed):
    1. CURROPER = 1              school is currently operating
    2. PREDDEG = 3               predominant degree is a Bachelor's
    3. Special = 1               9 military/maritime academies are flagged (the tool never ranks them)
    Values "PrivacySuppressed", "PS", "NA", "NULL" and empty are missing.

How to read this file: every line that starts with # explains the line(s) below it.
"RAW" names are the column names in the Scorecard files (capital letters, e.g. MD_EARN_WNE_P10).
"Slim" names are the readable names we give them in colleges_slim.csv (e.g. Earnings_10yr).
"""
import re, sys
from pathlib import Path
import numpy as np      # numbers: log10, "not a number" (NaN) for missing values
import pandas as pd     # tables: read CSV, filter rows, make new columns

# The three things you type after the script name on the command line (see "Usage" above).
inst_path, fos_path, out_dir = sys.argv[1], sys.argv[2], Path(sys.argv[3])
out_dir.mkdir(parents=True, exist_ok=True)   # make the output folder if it does not exist
# Text the Scorecard uses instead of a number when a value is hidden or unknown.
# Pandas turns all of these into "missing" (NaN), the same as an empty cell.
MISSING = ["PrivacySuppressed", "PS", "NA", "NULL"]

# ================================================================ PART 1: institution file
# The raw file has 3,000+ columns. We read ONLY the ones listed here (usecols below).
RAW = [
    # --- identification and place
    "UNITID",          # unique school ID (the key that joins all files)
    "INSTNM",          # school name
    "CITY", "STABBR",  # city and two-letter state
    "ST_FIPS",         # numeric state code (the map uses it to find the state shape)
    "LATITUDE", "LONGITUDE",   # position for the map
    # --- used only for filtering / grouping, not shown as columns of their own
    "CURROPER",        # 1 = currently operating
    "CONTROL",         # 1 public, 2 private nonprofit, 3 private for-profit
    "REGION",          # Scorecard region code 0-9
    "PREDDEG",         # predominant degree awarded: 3 = Bachelor's
    # --- outcomes
    "MD_EARN_WNE_P10",      # median earnings 10 years after entry (working, not enrolled)
    "MD_EARN_WNE_INC1_P10", # same, only for students from the lowest family-income group
    "C150_4", "C150_L4",    # completion within 150% of normal time: 4-year schools / shorter-program schools
    "RET_FT4", "RET_FTL4",  # first-year retention, full-time students: 4-year schools / shorter-program schools
    "GRAD_DEBT_MDN",        # median debt of students who completed
    "BBRR2_FED_UG_DFLT",    # share of federal borrowers in default 2 years after repayment starts
    # --- cost and price
    "COSTT4_A",             # average yearly cost of attendance (tuition, books, living)
    "NPT4_PUB", "NPT4_PRIV",  # average net price (cost minus grants): public / private schools
    "TUITIONFEE_IN", "TUITIONFEE_OUT",  # tuition and fees: in-district / out-of-state
    "PCTPELL",              # share of students with a Pell grant (low-income federal grant)
    # --- resources and admission
    "AVGFACSAL",            # average monthly salary of full-time faculty
    "INEXPFTE",             # instruction spending per full-time-equivalent student
    "ADM_RATE",             # admitted / applicants
]
# Read the file. usecols = only these columns. na_values = treat MISSING words as empty.
# encoding "utf-8-sig" removes an invisible mark at the start of the file that would break the first column name.
df = pd.read_csv(inst_path, usecols=RAW, low_memory=False, na_values=MISSING, encoding="utf-8-sig")
# Everything except the three text columns should be a number. errors="coerce" turns anything unreadable into missing.
# (CONTROL, REGION etc. are numeric codes here; they get names further down.)
num = [c for c in RAW if c not in ("INSTNM", "CITY", "STABBR")]
df[num] = df[num].apply(pd.to_numeric, errors="coerce")
print(f"Institution file: {len(df):,} rows")
# FILTER 1: keep only schools that are open today.
df = df[df["CURROPER"] == 1];  print(f"  currently operating:              {len(df):,}")
# FILTER 2: keep only schools whose main degree is a Bachelor's (our story: young college students).
df = df[df["PREDDEG"] == 3].copy(); print(f"  predominant degree = Bachelor's:  {len(df):,}")
# Small helper: the Scorecard stores shares as 0-1 (0.55); we show percent (55.0) with one decimal.
pct = lambda s: (s * 100).round(1)

# Start the output table with the identification columns.
# UNITID -> whole number; ST_FIPS "Int64" = whole number that is allowed to be missing; coordinates rounded to 4 decimals (about 10 m).
out = pd.DataFrame({"UNITID": df["UNITID"].astype(int), "INSTNM": df["INSTNM"], "CITY": df["CITY"], "STABBR": df["STABBR"],
                    "ST_FIPS": df["ST_FIPS"].astype("Int64"), "LATITUDE": df["LATITUDE"].round(4), "LONGITUDE": df["LONGITUDE"].round(4)})
# Control: turn the code 1/2/3 into words.
out["Control"] = df["CONTROL"].map({1: "Public", 2: "Private nonprofit", 3: "Private for-profit"})
# Region: turn the code 0-9 into the Scorecard's region names.
region = df["REGION"].map({0: "U.S. service schools", 1: "New England", 2: "Mid East", 3: "Great Lakes", 4: "Plains",
                           5: "Southeast", 6: "Southwest", 7: "Rocky Mountains", 8: "Far West", 9: "Outlying areas"})
# service schools get the most common region of their state, so every state belongs to one region
# st_region = for each state, its most common region among the normal schools (mode = most frequent value).
st_region = (pd.DataFrame({"s": df["STABBR"], "r": region})[region != "U.S. service schools"]
             .groupby("s")["r"].agg(lambda x: x.mode().iat[0]))
# Final Region column: normal schools keep their region; service-school rows get their state's region.
out["Region"] = np.where(region == "U.S. service schools", df["STABBR"].map(st_region), region)
# Special = military and maritime academies, found by name (the Scorecard has no flag for them)
# re.I = ignore upper/lower case. The "|" means "or". Matching schools get 1, all others stay empty.
pat = re.compile(r"Maritime|Merchant Marine Academy|Naval Academy|Coast Guard Academy|Air Force Academy|Military Academy", re.I)
out["Special"] = np.where(df["INSTNM"].str.contains(pat), 1, np.nan)
print(f"  flagged Special:                  {int(out['Special'].sum())}")

# ---- The 14 ranking variables (slim name = raw column, with any change noted) ----
# Earnings 10 years after entry, in dollars, rounded to whole dollars.
out["Earnings_10yr"] = df["MD_EARN_WNE_P10"].round(0)
# Same, but only students from the lowest family-income group.
out["Earnings_10yr_inc_low"] = df["MD_EARN_WNE_INC1_P10"].round(0)
# Completion rate in percent. .fillna(...) = use C150_4 if it exists, otherwise C150_L4.
out["Completion_rate"] = pct(df["C150_4"].fillna(df["C150_L4"]))
# Retention rate in percent, same "first choice, otherwise second" rule.
out["Retention_rate"] = pct(df["RET_FT4"].fillna(df["RET_FTL4"]))
# Median debt of completers, dollars.
out["Grad_debt"] = df["GRAD_DEBT_MDN"].round(0)
# Share of borrowers in default 2 years after repayment starts, percent (about half the schools have no value).
out["Default_2yr"] = pct(df["BBRR2_FED_UG_DFLT"])
# Yearly cost of attendance, dollars.
out["Cost_of_attendance"] = df["COSTT4_A"].round(0)
# Net price: public-school column if it has a value, otherwise the private-school column (a school is only in one of them).
out["Net_price"] = df["NPT4_PUB"].fillna(df["NPT4_PRIV"]).round(0)
# Tuition and fees. Note: the documentation calls the first one "in-district"; the page uses it as "in-state".
out["Tuition_in_state"] = df["TUITIONFEE_IN"].round(0)
out["Tuition_out_of_state"] = df["TUITIONFEE_OUT"].round(0)
# Share of students with a Pell grant, percent.
out["Pell_share"] = pct(df["PCTPELL"])
# Average monthly faculty salary, dollars.
out["Faculty_salary_month"] = df["AVGFACSAL"].round(0)
# Instruction spending per student on a log10 scale (the values vary hugely; log makes the scale fair).
# .where(> 0) blanks zero/negative values first, because log of 0 does not exist.
out["Instruction_spend_log10"] = np.log10(df["INEXPFTE"].where(df["INEXPFTE"] > 0)).round(2)
# Admission rate in percent.
out["Admission_rate"] = pct(df["ADM_RATE"])
# Save. index=False = no extra row-number column; lineterminator "\n" = same line endings on Windows and Mac.
out.to_csv(out_dir / "colleges_slim.csv", index=False, lineterminator="\n")
print(f"Wrote colleges_slim.csv: {len(out):,} rows x {out.shape[1]} columns")

# ================================================================ PART 2: field-of-study file
# Used for the field filter. One raw row = one school x one field (4-digit CIP code) x one degree level.
keep = set(out["UNITID"])   # the IDs of our Bachelor's schools; programs at other schools are dropped
FOS = [
    "UNITID",                    # school ID (joins to colleges_slim.csv)
    "CIPCODE", "CIPDESC",        # field code (4 digits) and its name, e.g. History
    "CREDLEV",                   # degree level: 3 = Bachelor's (1 certificate, 2 associate, 5 master's ...)
    "EARN_MDN_5YR",              # median earnings 5 years after completing this program
    "EARN_MDN_1YR",              # median earnings 1 year after completing
    "DEBT_ALL_STGP_EVAL_MDN",    # median debt of completers of this program
    "IPEDSCOUNT1", "IPEDSCOUNT2" # number of degrees awarded in this program, two consecutive years
]
# dtype=str: read everything as text first so IDs and codes are not changed (e.g. leading zeros in CIP codes).
f = pd.read_csv(fos_path, usecols=FOS, dtype=str, na_values=MISSING + [""], encoding="utf-8-sig", low_memory=False)
f = f[f["UNITID"].notna()]                  # drop rows with no school ID
f["UNITID"] = f["UNITID"].str.strip().astype(int)
# Keep only Bachelor's programs (CREDLEV 3) at the schools we have.
f = f[(f["CREDLEV"].str.strip() == "3") & f["UNITID"].isin(keep)].copy()
n_in = len(f)   # remember how many programs there were before the next filter (printed at the end)
# Now convert the number columns from text to numbers.
for c in ["EARN_MDN_5YR", "EARN_MDN_1YR", "DEBT_ALL_STGP_EVAL_MDN", "IPEDSCOUNT1", "IPEDSCOUNT2"]:
    f[c] = pd.to_numeric(f[c], errors="coerce")
# Field names: one name per CIP code (first one found), with spaces and a trailing "." removed.
# Done BEFORE the filter below, so every field keeps its name.
names = f.assign(CIPDESC=f["CIPDESC"].str.strip().str.rstrip(".")).drop_duplicates("CIPCODE").set_index("CIPCODE")["CIPDESC"]
# FILTER: keep a program only if it has at least one of 5-yr earnings, 1-yr earnings or debt.
# (Programs with none of the three are empty for our purposes.)
f = f[f[["EARN_MDN_5YR", "EARN_MDN_1YR", "DEBT_ALL_STGP_EVAL_MDN"]].notna().any(axis=1)]
# The final program table, with short names:
prog = pd.DataFrame({"UNITID": f["UNITID"], "CIPCODE": f["CIPCODE"].str.strip(),
                     # Count = average of the two years' number of degrees; used to pick a school's LARGEST program in a group
                     "Count": f[["IPEDSCOUNT1", "IPEDSCOUNT2"]].mean(axis=1).round(0),
                     "Earn_5yr": f["EARN_MDN_5YR"].round(0), "Earn_1yr": f["EARN_MDN_1YR"].round(0),
                     "Debt": f["DEBT_ALL_STGP_EVAL_MDN"].round(0)})
prog.to_csv(out_dir / "field_programs.csv", index=False, lineterminator="\n", float_format="%.0f")
# cip_names.csv: code -> field name, sorted by code.
pd.DataFrame({"CIPCODE": names.index.str.strip(), "Field": names.values}).sort_values("CIPCODE").to_csv(
    out_dir / "cip_names.csv", index=False, lineterminator="\n")
print(f"Field file: {n_in:,} Bachelor's programs at these schools; {len(prog):,} kept (at least one value); "
      f"{prog['UNITID'].nunique():,} schools; {len(names):,} fields")
