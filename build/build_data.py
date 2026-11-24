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
"""
import re, sys
from pathlib import Path
import numpy as np
import pandas as pd

inst_path, fos_path, out_dir = sys.argv[1], sys.argv[2], Path(sys.argv[3])
out_dir.mkdir(parents=True, exist_ok=True)
MISSING = ["PrivacySuppressed", "PS", "NA", "NULL"]

# ---------------------------------------------------------------- institution file
RAW = ["UNITID", "INSTNM", "CITY", "STABBR", "ST_FIPS", "LATITUDE", "LONGITUDE", "CURROPER", "CONTROL", "REGION", "PREDDEG",
       "MD_EARN_WNE_P10", "MD_EARN_WNE_INC1_P10", "C150_4", "C150_L4", "RET_FT4", "RET_FTL4", "GRAD_DEBT_MDN",
       "BBRR2_FED_UG_DFLT", "COSTT4_A", "NPT4_PUB", "NPT4_PRIV", "TUITIONFEE_IN", "TUITIONFEE_OUT", "PCTPELL",
       "AVGFACSAL", "INEXPFTE", "ADM_RATE"]
df = pd.read_csv(inst_path, usecols=RAW, low_memory=False, na_values=MISSING, encoding="utf-8-sig")
num = [c for c in RAW if c not in ("INSTNM", "CITY", "STABBR")]
df[num] = df[num].apply(pd.to_numeric, errors="coerce")
print(f"Institution file: {len(df):,} rows")
df = df[df["CURROPER"] == 1];  print(f"  currently operating:              {len(df):,}")
df = df[df["PREDDEG"] == 3].copy(); print(f"  predominant degree = Bachelor's:  {len(df):,}")
pct = lambda s: (s * 100).round(1)

out = pd.DataFrame({"UNITID": df["UNITID"].astype(int), "INSTNM": df["INSTNM"], "CITY": df["CITY"], "STABBR": df["STABBR"],
                    "ST_FIPS": df["ST_FIPS"].astype("Int64"), "LATITUDE": df["LATITUDE"].round(4), "LONGITUDE": df["LONGITUDE"].round(4)})
out["Control"] = df["CONTROL"].map({1: "Public", 2: "Private nonprofit", 3: "Private for-profit"})
region = df["REGION"].map({0: "U.S. service schools", 1: "New England", 2: "Mid East", 3: "Great Lakes", 4: "Plains",
                           5: "Southeast", 6: "Southwest", 7: "Rocky Mountains", 8: "Far West", 9: "Outlying areas"})
# service schools get the most common region of their state, so every state belongs to one region
st_region = (pd.DataFrame({"s": df["STABBR"], "r": region})[region != "U.S. service schools"]
             .groupby("s")["r"].agg(lambda x: x.mode().iat[0]))
out["Region"] = np.where(region == "U.S. service schools", df["STABBR"].map(st_region), region)
# Special = military and maritime academies, found by name (the Scorecard has no flag for them)
pat = re.compile(r"Maritime|Merchant Marine Academy|Naval Academy|Coast Guard Academy|Air Force Academy|Military Academy", re.I)
out["Special"] = np.where(df["INSTNM"].str.contains(pat), 1, np.nan)
print(f"  flagged Special:                  {int(out['Special'].sum())}")

out["Earnings_10yr"] = df["MD_EARN_WNE_P10"].round(0)
out["Earnings_10yr_inc_low"] = df["MD_EARN_WNE_INC1_P10"].round(0)
out["Completion_rate"] = pct(df["C150_4"].fillna(df["C150_L4"]))
out["Retention_rate"] = pct(df["RET_FT4"].fillna(df["RET_FTL4"]))
out["Grad_debt"] = df["GRAD_DEBT_MDN"].round(0)
out["Default_2yr"] = pct(df["BBRR2_FED_UG_DFLT"])
out["Cost_of_attendance"] = df["COSTT4_A"].round(0)
out["Net_price"] = df["NPT4_PUB"].fillna(df["NPT4_PRIV"]).round(0)
out["Tuition_in_state"] = df["TUITIONFEE_IN"].round(0)
out["Tuition_out_of_state"] = df["TUITIONFEE_OUT"].round(0)
out["Pell_share"] = pct(df["PCTPELL"])
out["Faculty_salary_month"] = df["AVGFACSAL"].round(0)
out["Instruction_spend_log10"] = np.log10(df["INEXPFTE"].where(df["INEXPFTE"] > 0)).round(2)
out["Admission_rate"] = pct(df["ADM_RATE"])
out.to_csv(out_dir / "colleges_slim.csv", index=False, lineterminator="\n")
print(f"Wrote colleges_slim.csv: {len(out):,} rows x {out.shape[1]} columns")

# ---------------------------------------------------------------- field-of-study file
keep = set(out["UNITID"])
FOS = ["UNITID", "CIPCODE", "CIPDESC", "CREDLEV", "EARN_MDN_5YR", "EARN_MDN_1YR", "DEBT_ALL_STGP_EVAL_MDN", "IPEDSCOUNT1", "IPEDSCOUNT2"]
f = pd.read_csv(fos_path, usecols=FOS, dtype=str, na_values=MISSING + [""], encoding="utf-8-sig", low_memory=False)
f = f[f["UNITID"].notna()]
f["UNITID"] = f["UNITID"].str.strip().astype(int)
f = f[(f["CREDLEV"].str.strip() == "3") & f["UNITID"].isin(keep)].copy()
n_in = len(f)
for c in ["EARN_MDN_5YR", "EARN_MDN_1YR", "DEBT_ALL_STGP_EVAL_MDN", "IPEDSCOUNT1", "IPEDSCOUNT2"]:
    f[c] = pd.to_numeric(f[c], errors="coerce")
names = f.assign(CIPDESC=f["CIPDESC"].str.strip().str.rstrip(".")).drop_duplicates("CIPCODE").set_index("CIPCODE")["CIPDESC"]
f = f[f[["EARN_MDN_5YR", "EARN_MDN_1YR", "DEBT_ALL_STGP_EVAL_MDN"]].notna().any(axis=1)]
prog = pd.DataFrame({"UNITID": f["UNITID"], "CIPCODE": f["CIPCODE"].str.strip(),
                     "Count": f[["IPEDSCOUNT1", "IPEDSCOUNT2"]].mean(axis=1).round(0),
                     "Earn_5yr": f["EARN_MDN_5YR"].round(0), "Earn_1yr": f["EARN_MDN_1YR"].round(0),
                     "Debt": f["DEBT_ALL_STGP_EVAL_MDN"].round(0)})
prog.to_csv(out_dir / "field_programs.csv", index=False, lineterminator="\n", float_format="%.0f")
pd.DataFrame({"CIPCODE": names.index.str.strip(), "Field": names.values}).sort_values("CIPCODE").to_csv(
    out_dir / "cip_names.csv", index=False, lineterminator="\n")
print(f"Field file: {n_in:,} Bachelor's programs at these schools; {len(prog):,} kept (at least one value); "
      f"{prog['UNITID'].nunique():,} schools; {len(names):,} fields")
