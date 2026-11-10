/* ============================================================================
   TEXTS: every piece of text the user reads, in one place.
   Edit the words between the quotes. Keep the ${...} parts inside `backticks` as they are:
   they are filled in by the program (for example ${n} is a number of schools).
   Variable names and their hover descriptions are in js/variables.js instead.
   The texts behind the round "i" buttons are in TEXT.info at the bottom.
   ============================================================================ */
const TEXT = {

  pageTitle: "College Outcomes Explorer",

  /* ---------- left panel 1: filters ---------- */
  filters: {
    title: "Filter schools",
    count: n => `${n.toLocaleString("en-US")} schools`,                 // bold number under the title
    countTip: (n, all, vars) => `${n.toLocaleString("en-US")} of ${all.toLocaleString("en-US")} schools have a value for all ${vars} chosen variables and pass your filters. Ranks are counted among them.`,
    field: "Field of study",
    fieldAny: "Any field",
    fieldAllIn: g => `All of ${g}`,                                      // first entry of each broad field
    fieldOther: "Other",
    earnings: "Min. earnings",
    earningsField: "Min. earnings in this field",
    none: "none",
    tuition: "Max. tuition per year",
    noLimit: "no limit",
    type: "School type",
    typeAll: "All school types",
    search: "Search",
    searchPlaceholder: "School name",
    clear: "Clear filters"
  },

  /* ---------- left panel 2: importance sliders ---------- */
  weights: {
    title: "What matters to you",
    hint: "0 = ignore · 10 = very important",
    add: "+ Add a variable",
    addMax: "(8 variables is the maximum)",
    equal: "Equal"
  },

  /* ---------- left panel 3: region, state and map ---------- */
  map: {
    title: "Region, state and map",
    region: "Region",
    regionAll: "All regions",
    state: "State",
    stateAll: "All states",
    stateAllInRegion: "All states in this region",
    hint: "Drag a box to rank only schools inside it.",
    boxNote: (inside, all) => `${inside.toLocaleString("en-US")} of ${all.toLocaleString("en-US")} schools inside your box are ranked.`,
    clearBox: "Clear map selection"
  },

  /* ---------- main figure ---------- */
  figure: {
    title: "Your ranking, and what it means in real numbers",
    clearPins: "Clear pins",
    pinNone: "Click a school to pin it",
    pinSome: (n, hidden) => `${n} pinned${hidden ? ` (${hidden} filtered out)` : ""}`,
    // header above the ranking (left half)
    headTitle: "Your ranking",
    headSub: "by your weights",
    headRank: "Rank",
    headSchool: "School",
    headBars: "Score by variable",
    headScore: "Score",
    headScoreTip: "Total weighted score, 0 to 100 (sum of the coloured parts)",
    // header above each variable column (right half)
    highBest: "↑ high = best",
    lowBest: "↓ low = best",
    histTip: long => `${long}. The histogram shows all schools; drag on it to keep only schools in that range.`,
    medianTip: (n, value) => `Median of the ${n} ranked schools: ${value}`,
    // hover text on a school
    tipRank: (rank, score) => `Rank ${rank} · score ${score} of 100`,
    tipPin: pinned => `Click to ${pinned ? "unpin" : "pin"} this school`,
    tipPart: (name, norm, share, points) => `<b>${name}</b> → ${norm}/100 × share ${share}% = ${points} points`,
    tipCell: (name, value, best) => `<b>${name}</b>: ${value} (${best} is best)`,
    best: { high: "highest", low: "lowest" },
    outsideBox: "Outside the map selection"
  },

  /* ---------- the round "i" buttons: one text per panel ---------- */
  info: {
    filters:
      "Only schools that pass all filters are ranked. " +
      "Field of study: schools with a Bachelor's program in that field ('All of …' uses each school's largest program in that broad field). " +
      "Min. earnings: with a field chosen, the program's median earnings 5 years after completing; otherwise the school's median earnings 10 years after entry. " +
      "Max. tuition: out-of-state tuition and fees, which is closest to what an international student pays. " +
      "U.S. military and maritime academies are always left out. Region and state are above the map.",

    weights:
      "Move a slider to say how much each variable matters: 0 = ignore, 10 = very important. " +
      "Sliders are independent; the score uses each variable's share of the total. " +
      "Every value is first rescaled from 0 (lowest in the data) to 100 (highest), flipped for variables where lower is better. " +
      "Click 'high = best' or 'low = best' above a column to change which direction counts as good.",

    map:
      "Every ranked school is a dot (circle = public, square = private nonprofit, triangle = private for-profit). " +
      "Pinned schools, or the top 8 if none is pinned, are large and show their rank. " +
      "Drag a box to rank only the schools inside it. Schools outside the 50 states and DC cannot be drawn.",

    figure:
      "Left: the schools in rank order. The coloured bar is the score, one colour per variable; the number after the bar is the total score (0 to 100). " +
      "The top 15 schools are shown. Right: one column per variable, each sorting the same 15 schools by that variable; a grey line follows each school from column to column. " +
      "Above each bar is the real value; bars start at zero on the same scale for all schools; the dashed line is the median of all ranked schools. " +
      "The histogram under each variable name shows all schools: drag on it to keep only schools in that range. " +
      "Click a school to pin it (up to 10): it stays coloured, is marked on the map and on every histogram, and its line between the columns gets its own shade of grey, from darkest (first pinned) to mid grey (last pinned); all others turn grey. " +
      "This is not an official ranking: the weights are yours, and only schools with a value for every chosen variable are ranked."
  }
};
