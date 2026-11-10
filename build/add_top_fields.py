"""
add_top_fields.py - add one text column, Top_fields, to data/colleges_slim.csv.

Usage:  python3 build/add_top_fields.py <full Scorecard institution CSV> data/colleges_slim.csv

Top_fields = the (up to) three largest two-digit fields of study at the school by share of degrees awarded (columns PCIP01 ... PCIP54),
e.g. "Business, management, marketing 22% | Social sciences 15% | Psychology 9%". Only fields with a share of at least 5% are listed.
The Scorecard describes PCIP as the percentage of degrees awarded in each two-digit CIP category (all award levels, IPEDS Completions,
12 months ending June 30 of the year before the data year). It says what a school mostly TEACHES, not which field pays best there.
The field names are the standard two-digit CIP titles. Safe to run twice.
"""
import csv, sys
CIP = {"01":"Agriculture","03":"Natural resources and conservation","04":"Architecture","05":"Area, ethnic, cultural, gender studies",
"09":"Communication and journalism","10":"Communications technologies","11":"Computer and information sciences","12":"Personal and culinary services",
"13":"Education","14":"Engineering","15":"Engineering technologies","16":"Foreign languages and linguistics","19":"Family and consumer sciences",
"22":"Legal professions","23":"English language and literature","24":"Liberal arts and general studies","25":"Library science",
"26":"Biological and biomedical sciences","27":"Mathematics and statistics","29":"Military technologies","30":"Multi/interdisciplinary studies",
"31":"Parks, recreation, fitness","38":"Philosophy and religious studies","39":"Theology","40":"Physical sciences","41":"Science technologies",
"42":"Psychology","43":"Security and law enforcement","44":"Public administration and social service","45":"Social sciences","46":"Construction trades",
"47":"Mechanic and repair technologies","48":"Precision production","49":"Transportation","50":"Visual and performing arts","51":"Health professions",
"52":"Business, management, marketing","54":"History"}
full_path, slim_path = sys.argv[1:3]
src = {}
with open(full_path, newline="", encoding="utf-8-sig") as fh:
    r = csv.DictReader(fh)
    miss = [f"PCIP{k}" for k in CIP if f"PCIP{k}" not in r.fieldnames]
    if miss: sys.exit("Columns not found: " + ", ".join(miss))
    for row in r:
        u = row["UNITID"].strip()
        if u and u not in src: src[u] = row
def top(row):
    vals = []
    for k, name in CIP.items():
        try: v = float(row[f"PCIP{k}"])
        except (TypeError, ValueError): continue
        if v >= 0.05: vals.append((v, name))
    vals.sort(reverse=True)
    return " | ".join(f"{n} {round(v*100)}%" for v, n in vals[:3])
with open(slim_path, newline="", encoding="utf-8") as fh:
    r = csv.DictReader(fh); cols = list(r.fieldnames); data = list(r)
if "Top_fields" not in cols: cols.append("Top_fields")
n = 0
for row in data:
    s = src.get(row["UNITID"].strip()); row["Top_fields"] = top(s) if s else ""; n += row["Top_fields"] != ""
with open(slim_path, "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=cols, lineterminator="\n"); w.writeheader(); w.writerows(data)
print(f"Top_fields filled for {n} of {len(data)} schools; columns now {len(cols)}")
