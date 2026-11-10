# Panel: Rank schools

One merged figure (idea: LineUp, Gratzl et al. 2013, combined with a slope graph).

## What the user sees
- **Left column**: Filter schools (field of study, min. earnings, max. tuition, school type, name search), What matters to you (importance sliders 0–10 per variable), Region/state/map (map brush ranks only schools in a box).
- **Right**: ranked rows (rank, school-type glyph, name, stacked score bar, score 0–100) and one column per variable with the real value, a bar from zero, a dashed median line, and a histogram on top (drag to filter).
- Click a school to pin it (max 10): its line is dark, others turn grey, histogram bins and map dots show where it lies.

## Design choices (defend these in the report)
- Score = sum of share × min–max normalised value (inverted when lower is better). Share = importance / sum of importances. Sliders are independent (0–10), unlike LineUp's linked percentages.
- Ties share a rank. Schools missing a chosen variable are not ranked.
- Service academies are always excluded here (they are in the data).
- Colours: ColorBrewer only. Set2 = variables; Greys = neutral; school type shown by glyph shape, not colour.
- "Same schools" re-sorts the shown schools per variable; "All schools" shows the top N of everyone per variable.

## Tested (headless Chromium, pandas cross-check)
Default ranking = 1,596 schools; region/state/field/group counts; earnings filter; histogram brush; slider weights; pinning; no horizontal scroll at 1400 and 700 px; no console errors; light and dark mode screenshots.
## Not tested
Other browsers, touch devices, screen readers, Safari. Rebuilding data from raw Scorecard files was verified on 2026-11-03 for the previous version only.
