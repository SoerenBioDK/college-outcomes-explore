// assign_county.mjs - give each school a county (5-digit FIPS code) from its LATITUDE / LONGITUDE.
// Output: school_county.csv (UNITID, COUNTY_FIPS, COUNTY_METHOD). COUNTY_METHOD is "inside" (point is inside the county),
// "nearby" (point was just outside, usually coast or river border, and was found by moving it a few km) or "none".
// Only counties in the school's own state are tried. Polygons whose id ends in 000 are not counties and are skipped.
// County map: us-10m.json from the npm package vega-datasets (1:10m resolution, so coastal points can need the "nearby" step).
// Usage:  npm install vega-datasets@2 topojson-client d3-geo
//         node assign_county.mjs colleges_slim.csv node_modules/vega-datasets/data/us-10m.json school_county.csv
// Assign each school to a county (FIPS) from LATITUDE/LONGITUDE using the 1:10m county
// boundaries in vega-datasets us-10m.json. Points that fall outside every polygon
// (coast / islands, because the map is coarse) are retried at small offsets and flagged.
import fs from 'node:fs';
import { feature } from 'topojson-client';
import { geoContains, geoBounds } from 'd3-geo';

const [,, csvPath, topoPath, outPath] = process.argv;
const topo = JSON.parse(fs.readFileSync(topoPath, 'utf8'));
const allFeatures = feature(topo, topo.objects.counties).features.map(f => ({
  fips: String(f.id).padStart(5, '0'), f, b: geoBounds(f)
}));
// ids ending in 000 are not counties (water / placeholder polygons); skip them
const counties = allFeatures.filter(c => !c.fips.endsWith('000'));
console.error('polygons skipped (id ends in 000):', allFeatures.filter(c => c.fips.endsWith('000')).map(c => c.fips).join(','));

function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i+1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
const h = rows[0]; const ix = n => h.indexOf(n);
const iU = ix('UNITID'), iLat = ix('LATITUDE'), iLon = ix('LONGITUDE'), iSt = ix('ST_FIPS');

function find(lon, lat, st) {
  for (const c of counties) {
    if (st && Number(c.fips.slice(0,2)) !== st) continue;   // only counties in the school's own state
    const [[w, s], [e, n]] = c.b;
    if (w <= e && (lon < w || lon > e)) continue;   // skip antimeridian-crossing boxes from the quick test
    if (lat < s || lat > n) continue;
    if (geoContains(c.f, [lon, lat])) return c.fips;
  }
  return null;
}
const offsets = [[0.02,0],[-0.02,0],[0,0.02],[0,-0.02],[0.05,0],[-0.05,0],[0,0.05],[0,-0.05],[0.1,0.1],[-0.1,-0.1],[0.1,-0.1],[-0.1,0.1]];
const out = ['UNITID,COUNTY_FIPS,COUNTY_METHOD'];
let direct = 0, near = 0, none = 0, stateMismatch = 0;
for (let r = 1; r < rows.length; r++) {
  const R = rows[r]; if (R.length < h.length) continue;
  const lat = parseFloat(R[iLat]), lon = parseFloat(R[iLon]);
  let fips = '', method = 'none';
  if (!isNaN(lat) && !isNaN(lon)) {
    const st = Number(R[iSt]) || null;
    fips = find(lon, lat, st);
    if (fips) method = 'inside';
    else for (const [dx, dy] of offsets) { fips = find(lon + dx, lat + dy, st); if (fips) { method = 'nearby'; break; } }
  }
  if (!fips) { fips = ''; method = 'none'; none++; } else if (method === 'inside') direct++; else near++;
  if (fips && R[iSt] && Number(fips.slice(0,2)) !== Number(R[iSt])) { stateMismatch++; method += '+STATE_MISMATCH'; }
  out.push(`${R[iU]},${fips},${method}`);
}
fs.writeFileSync(outPath, out.join('\n') + '\n');
console.log(JSON.stringify({ schools: rows.length - 1, inside: direct, nearby: near, none, stateMismatch }));
