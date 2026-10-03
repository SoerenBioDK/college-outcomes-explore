"""
Slim down College Scorecard "Most-Recent-Cohorts-Institution.csv" (3,300+ columns, ~100 MB)
into colleges_slim.csv (~45 columns, ~1-2 MB) for the Vega-Lite dashboard.

Usage:
    pip install pandas numpy
    python prepare_data.py Most-Recent-Cohorts-Institution.csv colleges_slim.csv
"""
import sys
import numpy as np
import pandas as pd

src = sys.argv[1] if len(sys.argv) > 1 else "Most-Recent-Cohorts-Institution.csv"
dst = sys.argv[2] if len(sys.argv) > 2 else "colleges_slim.csv"

raw_cols = [
    "UNITID", "INSTNM", "CITY", "STABBR", "ST_FIPS", "LATITUDE", "LONGITUDE", "CURROPER",
    "CONTROL", "REGION", "LOCALE", "PREDDEG", "MENONLY", "WOMENONLY",
    "HBCU", "HSI", "TRIBAL", "PBI", "ANNHI", "AANAPII", "NANTI",
    "UGDS", "UGDS_WHITE", "UGDS_BLACK", "UGDS_HISP", "UGDS_ASIAN", "UGDS_WOMEN",
    "ADM_RATE", "SAT_AVG",
    # outcomes
    "MD_EARN_WNE_P10", "MD_EARN_WNE_P6", "GT_THRESHOLD_P10",
    "C150_4", "C150_L4", "GRAD_DEBT_MDN", "BBRR2_FED_UG_DFLT", "RET_FT4", "RET_FTL4",
    # cost / aid / income
    "COSTT4_A", "NPT4_PUB", "NPT4_PRIV", "TUITIONFEE_IN", "TUITIONFEE_OUT",
    "PCTPELL", "PCTFLOAN", "UG25ABV", "NPT41_PUB", "NPT41_PRIV", "NPT45_PUB", "NPT45_PRIV",
    "NUM41_PUB", "NUM42_PUB", "NUM43_PUB", "NUM44_PUB", "NUM45_PUB",
    "NUM41_PRIV", "NUM42_PRIV", "NUM43_PRIV", "NUM44_PRIV", "NUM45_PRIV",
    "PCIP11", "PCIP13", "PCIP14", "PCIP51", "PCIP52",
    "AVGFACSAL", "INEXPFTE",
]
df = pd.read_csv(src, usecols=raw_cols, low_memory=False, na_values=["PrivacySuppressed", "NULL", "PS", "NA"])
num = [c for c in raw_cols if c not in ("INSTNM", "CITY", "STABBR")]
df[num] = df[num].apply(pd.to_numeric, errors="coerce")

df = df[df["CURROPER"] == 1].copy()          # only currently operating institutions
pct = lambda s: (s * 100).round(1)

out = pd.DataFrame({
    "UNITID": df["UNITID"].astype(int),
    "INSTNM": df["INSTNM"],
    "CITY": df["CITY"],
    "STABBR": df["STABBR"],
    "ST_FIPS": df["ST_FIPS"].astype("Int64"),
    "LATITUDE": df["LATITUDE"].round(4),
    "LONGITUDE": df["LONGITUDE"].round(4),
})

# ---------- categorical explanatory variables ----------
out["Control"] = df["CONTROL"].map({1: "Public", 2: "Private nonprofit", 3: "Private for-profit"})
out["Region"] = df["REGION"].map({
    0: "U.S. service schools", 1: "New England", 2: "Mid East", 3: "Great Lakes", 4: "Plains",
    5: "Southeast", 6: "Southwest", 7: "Rocky Mountains", 8: "Far West", 9: "Outlying areas"})
loc = df["LOCALE"]
out["Locale"] = np.select(
    [loc.between(11, 13), loc.between(21, 23), loc.between(31, 33), loc.between(41, 43)],
    ["City", "Suburb", "Town", "Rural"], default="Not reported")
out["Degree"] = df["PREDDEG"].map({0: "Not classified", 1: "Certificate", 2: "Associate",
                                   3: "Bachelor's", 4: "Graduate"})

shares = df[["UGDS_WHITE", "UGDS_BLACK", "UGDS_HISP", "UGDS_ASIAN"]]
names = np.array(["White", "Black", "Hispanic", "Asian"])
top = shares.fillna(-1).values.argmax(axis=1)
topval = shares.max(axis=1)
race = np.where(topval >= 0.5, "Majority " + names[top], "No majority group")
out["Race_mix"] = np.where(df["UGDS_WHITE"].isna(), "Not reported", race)

w = df["UGDS_WOMEN"]
gm = np.select([df["WOMENONLY"] == 1, df["MENONLY"] == 1, w >= 0.6, w <= 0.4, w.notna()],
               ["Women-only", "Men-only", "Mostly women (>=60%)", "Mostly men (<=40%)", "Balanced"],
               default="Not reported")
out["Gender_mix"] = gm

u = df["UGDS"]
out["Size"] = np.select([u < 1000, u < 5000, u < 15000, u >= 15000],
                        ["Small (<1k)", "Medium (1k-5k)", "Large (5k-15k)", "Very large (15k+)"],
                        default="Not reported")
a = df["ADM_RATE"]
out["Selectivity"] = np.select([a < 0.25, a < 0.5, a < 0.75, a >= 0.75],
                               ["Highly selective (<25%)", "Selective (25-50%)",
                                "Moderate (50-75%)", "Open / less selective (75%+)"],
                               default="Not reported")
out["Minority_serving"] = np.select(
    [df["HBCU"] == 1, df["TRIBAL"] == 1, df["HSI"] == 1,
     (df[["PBI", "ANNHI", "AANAPII", "NANTI"]] == 1).any(axis=1)],
    ["HBCU", "Tribal college", "Hispanic-Serving (HSI)", "Other minority-serving"],
    default="Not minority-serving")

# ---------- outcomes (rates converted to percent) ----------
out["Earnings_10yr"] = df["MD_EARN_WNE_P10"].round(0)
out["Earnings_6yr"] = df["MD_EARN_WNE_P6"].round(0)
out["Above_threshold_10yr"] = pct(df["GT_THRESHOLD_P10"])
out["Completion_rate"] = pct(df["C150_4"].fillna(df["C150_L4"]))
out["Grad_debt"] = df["GRAD_DEBT_MDN"].round(0)
out["Default_2yr"] = pct(df["BBRR2_FED_UG_DFLT"])   # share of borrowers in default 2 yrs after entering repayment
out["Retention_rate"] = pct(df["RET_FT4"].fillna(df["RET_FTL4"]))

# ---------- continuous explanatory variables ----------
out["Cost_of_attendance"] = df["COSTT4_A"].round(0)
out["Net_price"] = df["NPT4_PUB"].fillna(df["NPT4_PRIV"]).round(0)
out["Tuition_in_state"] = df["TUITIONFEE_IN"].round(0)
out["Tuition_out_of_state"] = df["TUITIONFEE_OUT"].round(0)
out["Pell_share"] = pct(df["PCTPELL"])
out["Loan_share"] = pct(df["PCTFLOAN"])
def quint(k):  # students by family-income quintile (public / private columns are mutually exclusive)
    return df[f"NUM4{k}_PUB"].fillna(df[f"NUM4{k}_PRIV"])
tot = sum(quint(k) for k in range(1, 6))
out["Lowincome_share"] = pct((quint(1) + quint(2)) / tot)          # family income < $48k (Title IV, first-time full-time)
out["Net_price_lowest_income"] = df["NPT41_PUB"].fillna(df["NPT41_PRIV"]).round(0)   # family income $0-30k
out["Net_price_highest_income"] = df["NPT45_PUB"].fillna(df["NPT45_PRIV"]).round(0)  # family income $110k+
out["Share_over25"] = pct(df["UG25ABV"])
out["Share_Engineering"] = pct(df["PCIP14"])
out["Share_CompSci"] = pct(df["PCIP11"])
out["Share_Health"] = pct(df["PCIP51"])
out["Share_Business"] = pct(df["PCIP52"])
out["Share_Education"] = pct(df["PCIP13"])
out["SAT_avg"] = df["SAT_AVG"]
out["Admission_rate"] = pct(df["ADM_RATE"])
out["Enrollment"] = df["UGDS"].round(0)                                   # raw (filter/tooltip)
out["Enrollment_log10"] = np.log10(df["UGDS"].where(df["UGDS"] > 0)).round(2)
out["Faculty_salary_month"] = df["AVGFACSAL"].round(0)
out["Instruction_spend_log10"] = np.log10(df["INEXPFTE"].where(df["INEXPFTE"] > 0)).round(2)
out["Share_White"] = pct(df["UGDS_WHITE"])
out["Share_Black"] = pct(df["UGDS_BLACK"])
out["Share_Hispanic"] = pct(df["UGDS_HISP"])
out["Share_Asian"] = pct(df["UGDS_ASIAN"])
out["Share_Women"] = pct(df["UGDS_WOMEN"])

out.to_csv(dst, index=False)
print(f"Wrote {dst}: {len(out):,} rows x {out.shape[1]} columns")
