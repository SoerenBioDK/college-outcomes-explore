/* ============================================================================
   VARIABLES: the numbers a student can rank schools by.
   Each row:  [column name in the data, short name (column header and weight slider),
               long description (hover text), direction, format]
     direction: 1 = higher is better, -1 = lower is better
     format:    "$" money, "%" percent, "n" plain number
   To add a variable: add a row here AND make sure the column exists in data/colleges_slim.csv
   (then rebuild data/data.js, see build/README.md). The column is listed in the "+ Add a variable"
   menu automatically.
   ============================================================================ */
const VARIABLES=[
 ["Earnings_10yr","Earnings 10 yrs","Median earnings, 10 yrs after entry",1,"$"],
 ["Earnings_6yr","Earnings 6 yrs","Median earnings, 6 yrs after entry",1,"$"],
 ["Above_threshold_10yr","Beats HS grad","% earning more than a high-school graduate, 10 yrs",1,"%"],
 ["Completion_rate","Completion","Completion rate",1,"%"],
 ["Retention_rate","Retention","First-year retention rate",1,"%"],
 ["Grad_debt","Grad debt","Median debt of graduates (federal loans, which international students cannot take)",-1,"$"],
 ["Tuition_out_of_state","Tuition out-of-state","Tuition and fees for out-of-state students (closest to what an international student pays)",-1,"$"],
 ["Cost_of_attendance","Cost of attendance","Cost of attendance per year (tuition, housing, books)",-1,"$"],
 ["Net_price","Net price","Average net price per year (only students with U.S. federal aid)",-1,"$"],
 ["Tuition_in_state","Tuition in-state","Tuition and fees (in-district/in-state)",-1,"$"],
 ["Default_2yr","Default rate","Loan default rate, 2 yrs after repayment starts (about half of schools)",-1,"%"],
 ["Pell_share","Pell share","% of students with Pell grants (access)",1,"%"],
 ["Lowincome_share","Low-income share","% of first-time students from families under $48k (access)",1,"%"],
 ["Repay5_pell","Repay 5y, Pell","Repayment rate 5 yrs, Pell students",1,"%"],
 ["Repay5_inc_low","Repay 5y, low inc.","Repayment rate 5 yrs, family income $30k or less",1,"%"],
 ["Earnings_10yr_inc_low","Earnings, low inc.","Median earnings 10 yrs, family income $30k or less",1,"$"],
 ["Net_price_highest_income","Net price, high inc.","Net price, family income over $110k",-1,"$"],
 ["Faculty_salary_month","Faculty salary","Average faculty salary per month",1,"$"],
 ["Instruction_spend_log10","Instruction spend","Instruction spending per student (log10 $)",1,"n"],
 ["Admission_rate","Admission rate","Admission rate (lower = more selective)",-1,"%"],
 ["SAT_avg","SAT average","Average SAT score (selective schools only)",1,"n"]];

/* The variables shown when the page opens (column names from the list above). All start with importance 5. */
const DEFAULT_VARIABLES=["Earnings_10yr","Completion_rate","Retention_rate","Tuition_out_of_state","Grad_debt"];

/* ============================================================================
   FIELD_GROUPS: broad fields of study used in the "Field of study" menu.
   Each row: [group name, list of 2-digit CIP codes in the group]. A code that is in no group goes to the last group.
   ============================================================================ */
const FIELD_GROUPS=[
 ["Natural sciences and mathematics",["26","27","40"]],
 ["Agriculture and natural resources",["01","03"]],
 ["Engineering and engineering technology",["14","15"]],
 ["Computing and information",["11"]],
 ["Health",["51"]],
 ["Business and management",["52"]],
 ["Social sciences and public service",["05","42","43","44","45"]],
 ["Humanities",["16","23","24","38","54"]],
 ["Arts, design, architecture and media",["04","09","10","50"]],
 ["Education",["13"]],
 ["Other (interdisciplinary, family sciences, recreation and fitness, transport)",["19","30","31","49"]]];
