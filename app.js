/* ============================================================================
   College Outcomes Explorer: the program (D3 v7). Read this file top to bottom:
     1 colours   2 data   3 small helpers   4 "i" pop-ups   5 field-of-study data
     6 the Rank tab (state, filters, ranking, figure, map)   7 start
   Texts the user reads are in js/texts.js, the variable list in js/variables.js,
   the data in data/data.js (built by build/make_data_js.py).
   ============================================================================ */
(function(){
"use strict";

/* ---------- 1. colours ---------- */
const COLORS={"Public":"#1b9e77","Private nonprofit":"#d95f02","Private for-profit":"#7570b3"}; // ColorBrewer Dark2, 3 classes   // school types; ColorBrewer Dark2 (3 classes), used only where a colour is needed
// pinned schools: each gets its own shade of ColorBrewer Greys (d3.interpolateGreys), so their lines can be told apart.
// The first pinned school is strongest (black in light mode, near-white in dark mode); the shades are spread out to a mid grey for the last one.
const darkMode=()=>{const t=document.documentElement.dataset.theme; return t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;};
function pinShade(id){ const p=S.rank.pins,i=p.indexOf(id); if(i<0)return null; const f=p.length<2?0:i/(p.length-1); return d3.interpolateGreys(darkMode()?0.05+0.45*f:1-0.5*f); }

/* ---------- 2. data (from data/data.js) ---------- */
const TEXTCOLS=new Set(["Top_fields","INSTNM","CITY","STABBR","Control","Region","Locale","Race_mix","Gender_mix","Size","Selectivity","Minority_serving"]);
const rows=d3.csvParse(DATA.colleges,d=>{
  const o={}; for(const k in d){ const v=d[k]; o[k]=TEXTCOLS.has(k)?v:(v===""?null:+v); } return o; });
const topo=DATA.topo;
const states=topojson.feature(topo,topo.objects.states);
const fipsToAbbr=new Map(rows.filter(d=>d.ST_FIPS!=null).map(d=>[d.ST_FIPS,d.STABBR]));
const REGIONS=["New England","Mid East","Great Lakes","Plains","Southeast","Southwest","Rocky Mountains","Far West","Outlying areas"];
// every state belongs to one Scorecard region (the 5 service academies were assigned to their state's region in the data)
const stateRegion=new Map(); for(const [ab,g] of d3.group(rows.filter(d=>d.Region&&d.Region!=="Outlying areas"),d=>d.STABBR)) stateRegion.set(ab,d3.greatest(d3.rollup(g,v=>v.length,d=>d.Region),([,n])=>n)[0]);
const regionOf=g=>stateRegion.get(fipsToAbbr.get(+g.id));

/* ---------- 3. small helpers ---------- */
const S={view:"rank"}; // all page state; the Rank tab keeps its own in S.rank
const $=id=>document.getElementById(id);
const tip=$("tip");
function showTip(e,html){tip.innerHTML=html;tip.style.opacity=1;const w=tip.offsetWidth;let x=e.clientX+14,y=e.clientY+14;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y+tip.offsetHeight>innerHeight-8)y=e.clientY-tip.offsetHeight-14;tip.style.left=x+"px";tip.style.top=y+"px";}
const hideTip=()=>{tip.style.opacity=0};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let raf=0; const later=fn=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(fn)};
function fillSelect(id,opts,val,cb){const s=$(id);opts.forEach(o=>{const [k,l]=Array.isArray(o)?o:[o,o];const e=document.createElement("option");e.value=k;e.textContent=l;s.appendChild(e)});s.value=val;s.addEventListener("change",()=>{cb(s.value);render()})}
// fill every element marked data-text="a.b" (or data-text-placeholder / data-text-title) from js/texts.js
function applyTexts(){
  const get=p=>p.split(".").reduce((o,k)=>o&&o[k],TEXT);
  document.querySelectorAll("[data-text]").forEach(e=>{ const v=get(e.dataset.text); if(typeof v==="string")e.textContent=v; else console.warn("Missing text:",e.dataset.text); });
  document.querySelectorAll("[data-text-placeholder]").forEach(e=>{ e.placeholder=get(e.dataset.textPlaceholder)||""; });
  document.querySelectorAll("[data-text-title]").forEach(e=>{ e.title=get(e.dataset.textTitle)||""; });
  document.title=TEXT.pageTitle;
}
applyTexts();

/* ---------- 4. round "i" buttons: one pop-up per panel, text in TEXT.info ---------- */
let infoOpen=null;
const pop=document.createElement("div"); pop.id="infoPop"; pop.setAttribute("role","dialog"); document.body.appendChild(pop);
function placePop(){ if(!infoOpen)return; const r=infoOpen.btn.getBoundingClientRect(); pop.style.display="block"; pop.textContent=TEXT.info[infoOpen.k];
  const w=pop.offsetWidth,h=pop.offsetHeight; pop.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+"px";
  pop.style.top=Math.max(8,(r.bottom+6+h>innerHeight-8)?r.top-h-6:r.bottom+6)+"px"; } // opens below the button, or above it when there is no room
function closeInfo(){ if(infoOpen){infoOpen.btn.setAttribute("aria-expanded","false"); infoOpen=null;} pop.style.display="none"; }
function refreshInfo(){ if(infoOpen)placePop(); }
// [key in TEXT.info, id of the heading the button is placed beside]
[["filters","tR"],["weights","tW"],["map","tRM"],["figure","tRL"]].forEach(([k,id])=>{ const h=$(id), w=document.createElement("div"); w.className="hrow"; h.parentNode.insertBefore(w,h); w.appendChild(h);
  const b=document.createElement("button"); b.type="button"; b.className="info"; b.textContent="i"; b.setAttribute("aria-label","About this panel: how to read it and use it"); b.setAttribute("aria-expanded","false"); w.appendChild(b);
  b.addEventListener("click",e=>{ e.stopPropagation(); const same=infoOpen&&infoOpen.k===k; closeInfo(); if(!same){infoOpen={k,btn:b}; b.setAttribute("aria-expanded","true"); placePop();} }); });
document.addEventListener("click",e=>{ if(infoOpen&&!pop.contains(e.target))closeInfo(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape")closeInfo(); });
addEventListener("scroll",closeInfo,{passive:true});

/* ---------- 5. field-of-study data (programs per school) ---------- */
const CIPN=new Map(d3.csvParse(DATA.cip).map(d=>[d.CIPCODE,d.Field]));
const nn=v=>v===""||v==null?null:+v;
const PROG=d3.group(d3.csvParse(DATA.fields,d=>({u:+d.UNITID,c:d.CIPCODE,n:nn(d.Count),e5:nn(d.Earn_5yr),e1:nn(d.Earn_1yr),db:nn(d.Debt)})),d=>d.u);
const fm=v=>"$"+d3.format(",")(Math.round(v));
const ROWBYID=new Map(rows.map(d=>[d.UNITID,d])), PROGBYFIELD=d3.group([...PROG.values()].flat().filter(g=>g.e5!=null&&g.db!=null&&ROWBYID.has(g.u)),g=>g.c);
const GROUPS=FIELD_GROUPS; // defined in js/variables.js
const G2=new Map(GROUPS.flatMap(([g,cs])=>cs.map(c=>[c,g]))), grpOf=c=>G2.get(c.slice(0,2))||GROUPS[GROUPS.length-1][0], PROGALL=[...PROGBYFIELD.values()].flat();
const FIELDOPTS=[...PROGBYFIELD].filter(([c,a])=>a.length>=30).map(([c,a])=>({c,label:`${CIPN.get(c)||c} (${a.length} schools)`,grp:grpOf(c)}));
const baseCache=new Map(), progMode=f=>!!(f.field||f.group);
function findBase(field,group){
  const key=field?"f:"+field:group?"g:"+group:"";
  if(!baseCache.has(key)){
    let items;
    if(field) items=PROGBYFIELD.get(field).map(g=>Object.assign(Object.create(ROWBYID.get(g.u)),{E:g.e5,Dt:g.db,N:g.n,c:g.c}));
    else if(group){ // each school is represented by its largest program (most graduates a year; ties: lower CIP code) in the broad field
      const best=new Map(), nz=v=>v==null?-1:v;
      for(const g of PROGALL){ if(grpOf(g.c)!==group)continue; const cur=best.get(g.u); if(!cur||nz(g.n)>nz(cur.n)||(nz(g.n)===nz(cur.n)&&g.c<cur.c))best.set(g.u,g); }
      items=[...best.values()].map(g=>Object.assign(Object.create(ROWBYID.get(g.u)),{E:g.e5,Dt:g.db,N:g.n,c:g.c}));
    } else items=rows.filter(d=>d.Grad_debt!=null&&d.Earnings_10yr!=null).map(d=>Object.assign(Object.create(d),{E:d.Earnings_10yr,Dt:d.Grad_debt}));
    baseCache.set(key,items);
  }
  return baseCache.get(key);
}

/* ---------- 6. the Rank tab ---------- */

const RK_ATTRS=VARIABLES; // defined in js/variables.js
const RKA=new Map(RK_ATTRS.map(a=>[a[0],{k:a[0],short:a[1],long:a[2],dir:a[3],f:a[4]}]));
const RK_COL=d3.schemeSet2; // ColorBrewer Set2 (up to 8 columns)
const RK_INK="#1f2428"; // Set2 colours are light in both themes, so text on them stays dark
const rkFmt=(k,v)=>{const f=RKA.get(k).f; return f==="$"?"$"+d3.format(",")(Math.round(v)):f==="%"?Math.round(v)+"%":d3.format(".2f")(v)};
const rkCompact=(k,v)=>{const f=RKA.get(k).f; return f==="$"?"$"+d3.format(".3~s")(v):f==="%"?Math.round(v)+"%":d3.format(".2f")(v)};
const rkStats=new Map();
function rkStat(k){ if(!rkStats.has(k)){const v=rows.map(d=>d[k]).filter(x=>x!=null); rkStats.set(k,{lo:d3.min(v),hi:d3.max(v),vals:v});} return rkStats.get(k); }
const rkNorm=(c,v)=>{const s=rkStat(c.k),g=(v-s.lo)/((s.hi-s.lo)||1); return c.dir>0?g:1-g};
const RK_RH=28, RK_HH=118, RK_SY0=68, RK_SY1=94, RK_HY0=56, RK_HY1=98, RK_TYPES=["Public","Private nonprofit","Private for-profit"];
const RK_SHAPE={"Public":d3.symbolCircle,"Private nonprofit":d3.symbolSquare,"Private for-profit":d3.symbolTriangle},RK_GLYPH={"Public":"●","Private nonprofit":"■","Private for-profit":"▲"};
const rkSym=d3.symbol().size(75), rkSymPath=t=>rkSym.type(RK_SHAPE[t]||d3.symbolCircle)();
const RK_STN={AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"District of Columbia",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",PR:"Puerto Rico",GU:"Guam",VI:"U.S. Virgin Islands",AS:"American Samoa",MP:"Northern Mariana Islands",FM:"Micronesia",MH:"Marshall Islands",PW:"Palau"};
const RK_COSTS=[["Tuition_out_of_state","Tuition, out-of-state"],["Cost_of_attendance","Cost of attendance"],["Net_price","Net price (federal aid)"]];
const RK_CAPMAX=new Map(RK_COSTS.map(([k])=>[k,Math.ceil(d3.max(rows,d=>d[k])/5000)*5000]));
S.rank={cols:DEFAULT_VARIABLES.map((k,i)=>({k,imp:5,w:.2,dir:RKA.get(k).dir,color:RK_COL[i]})),type:"All",q:"",ranges:{},items:[],lastRank:new Map(),chg:null,chgT:0,animate:false,
  geoBox:null,pos:null,hov:null,mapW:0,group:"",field:"",minE:0,costVar:"Tuition_out_of_state",cap:RK_CAPMAX.get("Tuition_out_of_state"),fieldSet:null,fieldE:null,pins:[],acad:false,region:"",state:"",nrows:15,mode:"same"}; // fixed: always 15 rows, and every column re-sorts those same schools
const rkInBox=d=>{const b=S.rank.geoBox,p=S.rank.pos&&S.rank.pos.get(d.UNITID); return !!p&&p[0]>=b[0][0]&&p[0]<=b[1][0]&&p[1]>=b[0][1]&&p[1]<=b[1][1]};
function rkRank(cols,skipGeo){
  const R=S.rank,q=R.q.trim().toLowerCase(),rk=Object.entries(R.ranges),items=[],capMax=RK_CAPMAX.get(R.costVar);
  for(const d of rows){
    if(R.type!=="All"&&d.Control!==R.type)continue; if(q&&!d.INSTNM.toLowerCase().includes(q))continue;
    if(!R.acad&&d.Special)continue;
    if(R.region&&d.Region!==R.region)continue; if(R.state&&d.STABBR!==R.state)continue;
    if(R.fieldSet&&!R.fieldSet.has(d.UNITID))continue;
    if(R.minE>0){const ev=R.fieldE?R.fieldE.get(d.UNITID):d.Earnings_10yr; if(ev==null||ev<R.minE)continue}
    if(R.cap<capMax){const v=d[R.costVar]; if(v==null||v>R.cap)continue}
    if(!skipGeo&&R.geoBox&&!rkInBox(d))continue;
    let ok=true; for(const c of cols){if(d[c.k]==null){ok=false;break}}
    if(ok)for(const [k,r] of rk){const v=d[k]; if(v==null||v<r[0]||v>r[1]){ok=false;break}}
    if(!ok)continue;
    const parts=cols.map(c=>c.w*rkNorm(c,d[c.k])); items.push({d,parts,score:d3.sum(parts)});
  }
  items.sort((a,b)=>b.score-a.score||a.d.INSTNM.localeCompare(b.d.INSTNM));
  let last=null,lr=0; items.forEach((it,i)=>{const sc=Math.round(it.score*1e6); if(sc!==last){lr=i+1;last=sc} it.rank=lr; it.pos=i});
  return items;
}
function rkSyncW(){ const cs=S.rank.cols,t=d3.sum(cs,c=>c.imp); cs.forEach(c=>c.w=t>0?c.imp/t:1/cs.length); }
function rkCompute(track){
  rkSyncW(); const R=S.rank,items=rkRank(R.cols); R.items=items;
  const chg=new Map(); if(track)for(const it of items){const o=R.lastRank.get(it.d.UNITID); if(o!=null&&o!==it.rank)chg.set(it.d.UNITID,o-it.rank)}
  R.chg=track?chg:null; if(chg.size)R.chgT=performance.now();
  R.lastRank=new Map(items.map(it=>[it.d.UNITID,it.rank]));
}
function rkApplyField(){ const R=S.rank; if(!R.field&&!R.group){R.fieldSet=null;R.fieldE=null;return} const b=findBase(R.field,R.group); R.fieldSet=new Set(b.map(d=>d.UNITID)); R.fieldE=new Map(b.map(d=>[d.UNITID,d.E])); }
const rkHi=()=>{const R=S.rank; return R.pins.length?R.items.filter(it=>R.pins.includes(it.d.UNITID)):R.items.slice(0,Math.min(8,R.nrows))};
function rkSetWeights(ws){ const t=d3.sum(ws); S.rank.cols.forEach((c,i)=>c.w=ws[i]/t); }
function rkLines(t,m){ if(m<4)return[]; const cut=s=>s.length>m?s.slice(0,m-1)+"…":s; if(t.length<=m)return[t]; const w=t.split(" "); let a=w[0],i=1; while(i<w.length&&(a+" "+w[i]).length<=m){a+=" "+w[i];i++} const b=w.slice(i).join(" "); return [cut(a),b?cut(b):""]; }
function rkLayout(){
  const n=S.rank.cols.length,avail=Math.round($("rkWrap").clientWidth||900),nameX=60,nameW=200,barX=nameX+nameW+8,bw=130,scX=barX+bw+6,LW=scX+30,gap=38,cw=Math.max(112,Math.floor((avail-LW-16)/n)),tw=cw-gap;
  return {W:LW+n*cw+16,nameX,nameW,barX,bw,scX,LW,cw,gap,tw,x0:j=>LW+j*cw+gap};
}
function rkHistReal(k,b){ const s=rkStat(k),bins=Array(b).fill(0); for(const v of s.vals)bins[Math.min(b-1,Math.floor((v-s.lo)/((s.hi-s.lo)||1)*b))]++; return bins; }
function rkLegend(){ $("lgRP").innerHTML=RK_TYPES.map(t=>`<span><b style="font-size:13px">${RK_GLYPH[t]}</b> ${t}</span>`).join(""); }
function renderRankHeader(){
  const R=S.rank,L=rkLayout(),svg=d3.select("#rkHead").attr("width",L.W).attr("height",RK_HH);
  let g=svg.select("g.main"); if(g.empty())g=svg.append("g").attr("class","main");
  const lab=(cls,x,y,t,anchor,big)=>{let e=g.select("text."+cls); if(e.empty())e=g.append("text").attr("class",cls).style("fill",big?"var(--fg)":"var(--muted)").style("font-size",big?"14px":"11px").style("font-weight",big?700:600); e.attr("x",x).attr("y",y).attr("text-anchor",anchor||"start").text(t)};
  lab("ttl",4,16,TEXT.figure.headTitle,"start",true); lab("ttl2",4,31,TEXT.figure.headSub); lab("hrank",L.nameX-22,RK_HH-6,TEXT.figure.headRank,"end"); lab("hname",L.nameX,RK_HH-6,TEXT.figure.headSchool); lab("hbar",L.barX,RK_HH-6,TEXT.figure.headBars); lab("hsc",L.scX,RK_HH-6,TEXT.figure.headScore); g.select("text.hsc").selectAll("title").data([1]).join("title").text(TEXT.figure.headScoreTip);
  // right side: one header per variable (name, direction, histogram of all schools with a range brush)
  g.selectAll("g.hc").data(R.cols,c=>c.k).join(e=>{const h=e.append("g").attr("class","hc"); h.append("rect").attr("class","top").attr("height",6); h.append("text").attr("class","nm1").style("font-size","12px").style("font-weight",700); h.append("text").attr("class","nm2").style("font-size","12px").style("font-weight",700);
      h.append("g").attr("class","dirb").attr("role","button").attr("tabindex",0).style("cursor","pointer").append("text").style("font-size","10.5px").style("fill","var(--muted)");
      h.append("g").attr("class","hbars"); h.append("g").attr("class","brush"); h.append("g").attr("class","hmark").style("pointer-events","none"); h.append("text").attr("class","lo").style("font-size","10px").style("fill","var(--muted)"); h.append("text").attr("class","hi").attr("text-anchor","end").style("font-size","10px").style("fill","var(--muted)"); h.append("title"); return h})
   .each(function(c,j){ const h=d3.select(this),x0=L.x0(j),tw=L.tw,s=rkStat(c.k),a=RKA.get(c.k),ln=rkLines(a.short,Math.floor((tw-4)/6.6));
    h.select("rect.top").attr("x",x0).attr("y",0).attr("width",tw).attr("fill",c.color);
    h.select("text.nm1").attr("x",x0).attr("y",22).text(ln[0]||""); h.select("text.nm2").attr("x",x0).attr("y",35).text(ln[1]||"");
    h.select("g.dirb").attr("transform",`translate(${x0},49)`).attr("aria-label",`${a.short}: ${c.dir>0?"highest":"lowest"} is best. Press to flip.`).select("text").text(c.dir>0?TEXT.figure.highBest:TEXT.figure.lowBest);
    h.select("g.dirb").on("click",()=>{c.dir=-c.dir;rkUpdate(true,{animate:true})}).on("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();c.dir=-c.dir;rkUpdate(true,{animate:true})}});
    const bins=rkHistReal(c.k,14),mx=d3.max(bins)||1,bwid=tw/bins.length;
    h.select("g.hbars").selectAll("rect").data(bins).join("rect").attr("x",(d,i)=>x0+i*bwid).attr("width",Math.max(.5,bwid-1)).attr("y",d=>RK_HY1-(d/mx)*(RK_HY1-RK_HY0)).attr("height",d=>(d/mx)*(RK_HY1-RK_HY0)).attr("fill",c.color).attr("fill-opacity",.85);
    h.select("text.lo").attr("x",x0).attr("y",RK_HH-6).text(rkCompact(c.k,s.lo)); h.select("text.hi").attr("x",x0+tw).attr("y",RK_HH-6).text(rkCompact(c.k,s.hi));
    h.select("title").text(TEXT.figure.histTip(a.long));
    const sx=d3.scaleLinear([s.lo,s.hi],[x0,x0+tw]),br=d3.brushX().extent([[x0,RK_HY0-2],[x0+tw,RK_HY1]]).on("brush end",e=>{ if(!e.sourceEvent)return; if(!e.selection)delete R.ranges[c.k]; else R.ranges[c.k]=e.selection.map(sx.invert).sort(d3.ascending); rkUpdate(false,{track:false}); });
    const bg=h.select("g.brush"); bg.call(br); bg.call(br.move,R.ranges[c.k]?R.ranges[c.k].map(sx):null);
  });
  rkLegend();
}
let rkInput=null;
function rkEdit(c,node){ if(rkInput){const o=rkInput;rkInput=null;o.remove()}
  const R=S.rank,mx=100-2*(R.cols.length-1),wrap=$("rkWrap"),wr=wrap.getBoundingClientRect(),nr=node.getBoundingClientRect(),inp=document.createElement("input");
  inp.type="number"; inp.min=2; inp.max=mx; inp.step=1; inp.value=Math.round(c.w*100); inp.setAttribute("aria-label",`Weight of ${RKA.get(c.k).short} in percent, 2 to ${mx}`); inp.id="rkWInput";
  inp.style.cssText=`position:absolute;left:${nr.right-wr.left+wrap.scrollLeft-66}px;top:${nr.top-wr.top-4}px;width:62px;padding:1px 4px;font-size:12px;z-index:3`;
  wrap.appendChild(inp); rkInput=inp; inp.focus(); inp.select();
  const done=ok=>{ if(rkInput!==inp)return; rkInput=null; const v=+inp.value; inp.remove(); if(ok&&inp.value!==""&&isFinite(v))rkSetOne(c.k,v) };
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();done(true)}else if(e.key==="Escape"){e.preventDefault();done(false)}}); inp.addEventListener("blur",()=>done(true)); }
function rkSetOne(k,pct){ const R=S.rank,cols=R.cols,c=cols.find(x=>x.k===k); if(!c||cols.length<2)return; const t=Math.max(2,Math.min(100-2*(cols.length-1),pct))/100, others=cols.filter(x=>x!==c);
  const m=.02,nk=others.length,ex=d3.sum(others,x=>Math.max(0,x.w-m)); others.forEach(x=>x.w=m+(ex>0?Math.max(0,x.w-m)/ex:1/nk)*(1-t-m*nk)); c.w=t; rkUpdate(true,{animate:true,light:true}); }
function rkShift(i,dw){ const cs=S.rank.cols,a=cs[i],b=cs[i+1],m=.02; dw=Math.max(m-a.w,Math.min(b.w-m,dw)); a.w+=dw; b.w-=dw; rkUpdate(true,{track:true,light:true}); }
function rkRemove(k){ const R=S.rank; if(R.cols.length<2)return; const i=R.cols.findIndex(c=>c.k===k); R.cols.splice(i,1); delete R.ranges[k]; rkUpdate(true,{animate:true}); rkFillAdd(); }
function rkFillAdd(){ const s=$("rkAdd"),used=new Set(S.rank.cols.map(c=>c.k)); s.innerHTML=""; const o0=document.createElement("option"); o0.value=""; o0.textContent=S.rank.cols.length>=8?TEXT.weights.addMax:TEXT.weights.add; s.appendChild(o0);
  if(S.rank.cols.length<8)RK_ATTRS.filter(a=>!used.has(a[0])).forEach(a=>{const o=document.createElement("option");o.value=a[0];o.textContent=a[1];s.appendChild(o)}); s.value=""; }
function rkAdd(k){ const R=S.rank; if(!k||R.cols.length>=8)return; const used=new Set(R.cols.map(c=>c.color)),color=RK_COL.find(c=>!used.has(c))||RK_COL[0],n=R.cols.length; R.cols.push({k,imp:5,w:0,dir:RKA.get(k).dir,color}); rkUpdate(true,{animate:true}); rkFillAdd(); }
let rkWSig="";
function rkWeightsUI(){ const R=S.rank,host=$("rkW"),sig=R.cols.map(c=>c.k).join("|");
  if(sig!==rkWSig){ rkWSig=sig; host.innerHTML=""; R.cols.forEach(c=>{ const nm=esc(RKA.get(c.k).short),row=document.createElement("div"); row.className="wr"; row.dataset.k=c.k;
    row.innerHTML=`<i style="background:${c.color}"></i><label for="w_${c.k}" title="${esc(RKA.get(c.k).long)}">${nm}</label><input type="range" id="w_${c.k}" min="0" max="10" step="1" style="accent-color:${c.color}" aria-label="Importance of ${nm}, 0 to 10"><output></output><button type="button" class="x" aria-label="Remove ${nm}">✕</button>`; host.appendChild(row);
    row.querySelector("input").addEventListener("input",e=>{ c.imp=+e.target.value; rkUpdate(true,{animate:true,light:true}); }); row.querySelector("button").addEventListener("click",()=>rkRemove(c.k)); }); }
  R.cols.forEach(c=>{ const row=host.querySelector(`[data-k="${c.k}"]`); if(!row)return; const inp=row.querySelector("input"); if(+inp.value!==c.imp)inp.value=c.imp; row.querySelector("output").textContent=c.imp; row.querySelector("button").style.display=R.cols.length<2?"none":""; }); }
function rkUpdate(header,o){ o=o||{}; S.rank.animate=!!o.animate; rkCompute(o.track!==false); rkWeightsUI(); if(header)renderRankHeader(); renderRankBody(); rkCount(); rkLinked(!!o.light); }
function rkLinked(light){ rkMapUpdate(); rkPinUI(); rkFigStyle(); }
function rkCount(){ const R=S.rank,n=R.items.length,f=Object.keys(R.ranges).length+(R.type!=="All")+(R.q.trim()?1:0)+(R.geoBox?1:0)+(R.fieldSet?1:0)+(R.region?1:0)+(R.state?1:0)+(R.minE>0?1:0)+(R.cap<RK_CAPMAX.get(R.costVar)?1:0);
  $("sR").textContent=TEXT.filters.count(n); $("sR").title=TEXT.filters.countTip(n,rows.length,R.cols.length); }
const reduced=matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const rkTip=it=>{const d=it.d; return `<b>${esc(d.INSTNM)}</b><br>${esc(d.CITY)}, ${esc(d.STABBR)} · ${esc(d.Control)}<br>${TEXT.figure.tipRank(it.rank,(it.score*100).toFixed(1))}<br>`+S.rank.cols.map(c=>`${esc(RKA.get(c.k).short)}: ${rkFmt(c.k,d[c.k])}`).join("<br>")+`<br><i>${TEXT.figure.tipPin(S.rank.pins.includes(d.UNITID))}</i>`};
function rkPin(id){ const R=S.rank,i=R.pins.indexOf(id); if(i>=0)R.pins.splice(i,1); else {R.pins.push(id); if(R.pins.length>10)R.pins.shift()} hideTip(); renderRankBody(); rkLinked(true); }
function rkPinUI(){ const R=S.rank,hid=R.pins.filter(id=>!R.items.some(it=>it.d.UNITID===id)).length; $("rkPinClear").style.display=R.pins.length?null:"none";
  $("rkPinNote").textContent=R.pins.length?TEXT.figure.pinSome(R.pins.length,hid):TEXT.figure.pinNone; }
function renderRankBody(){
  const R=S.rank,L=rkLayout(),RH=RK_RH,n=R.cols.length,N=Math.max(1,R.nrows),pinned=new Set(R.pins),svg=d3.select("#rkSvg");
  const top=R.items.slice(0,N),extra=R.pins.map(id=>R.items.find(it=>it.d.UNITID===id)).filter(it=>it&&it.pos>=N).sort((a,b)=>a.pos-b.pos),left=top.concat(extra);
  const best=(c,a,b)=>c.dir>0?b.d[c.k]-a.d[c.k]:a.d[c.k]-b.d[c.k];
  const lists=R.cols.map(c=>{ if(R.mode!=="all")return left.slice().sort((a,b)=>best(c,a,b)||a.pos-b.pos);
    const all=R.items.slice().sort((a,b)=>best(c,a,b)||a.pos-b.pos),t=all.slice(0,N),have=new Set(t.map(it=>it.d.UNITID)); return t.concat(all.filter(it=>pinned.has(it.d.UNITID)&&!have.has(it.d.UNITID))); });
  const rowsN=Math.max(1,left.length,...lists.map(l=>l.length)),H=rowsN*RH+6,P0=new Map(left.map((it,i)=>[it.d.UNITID,i])),P=lists.map(l=>new Map(l.map((it,i)=>[it.d.UNITID,i])));
  svg.attr("width",L.W).attr("height",H).attr("aria-label",`Ranking of ${left.length} schools on the left. To the right, one column per variable shows the same ${R.mode==="all"?"top schools of all ranked schools":"schools"} sorted by that variable, with bars in real values.`);
  for(const c of ["links","med","cells","left","sep"])if(svg.select("g."+c).empty())svg.append("g").attr("class",c);
  const anim=R.animate&&!reduced; R.animate=false; const T=s=>anim?s.transition().duration(380):s;
  // curves between consecutive columns
  const links=[]; lists.forEach((l,j)=>{ const pm=j?P[j-1]:P0,x1=L.LW+j*L.cw,x2=L.x0(j); for(const it of l){ const id=it.d.UNITID,a=pm.get(id); if(a==null)continue; links.push({key:id+"|"+j,id,it,d:`M${x1},${a*RH+(j?18:RH/2)}C${(x1+x2)/2},${a*RH+(j?18:RH/2)} ${(x1+x2)/2},${P[j].get(id)*RH+18} ${x2},${P[j].get(id)*RH+18}`}); } });
  const lg=svg.select("g.links").selectAll("path.ln").data(links,o=>o.key).join(e=>e.append("path").attr("class","ln").attr("fill","none").attr("d",o=>o.d).style("pointer-events","none"));
  T(lg).attr("d",o=>o.d);
  // columns: label (real value) on top, bar underneath, dashed median of all ranked schools
  const cells=[]; lists.forEach((l,j)=>l.forEach((it,i)=>cells.push({key:it.d.UNITID+"|"+j,id:it.d.UNITID,it,j,y:i*RH})));
  const cg=svg.select("g.cells").selectAll("g.cell").data(cells,o=>o.key).join(e=>{ const g=e.append("g").attr("class","cell").attr("transform",o=>`translate(${L.x0(o.j)},${o.y})`);
      g.append("rect").attr("class","band").attr("x",-4).attr("y",1).attr("height",RH-2).attr("rx",3); g.append("text").attr("class","val").attr("y",11).style("font-size","10.5px").style("font-family","var(--mono)");
      g.append("rect").attr("class","trk").attr("y",14).attr("height",9).attr("fill","var(--soft)"); g.append("rect").attr("class","bar").attr("y",14).attr("height",9); return g});
  T(cg).attr("transform",o=>`translate(${L.x0(o.j)},${o.y})`);
  cg.select("rect.band").attr("width",L.tw+8); cg.select("rect.trk").attr("width",L.tw);
  cg.select("text.val").text(o=>rkFmt(R.cols[o.j].k,o.it.d[R.cols[o.j].k])).attr("x",0);
  cg.select("rect.bar").attr("fill",o=>R.cols[o.j].color).attr("width",o=>{const c=R.cols[o.j],s=rkStat(c.k); return Math.max(1.5,Math.min(1,o.it.d[c.k]/(s.hi||1))*L.tw)});
  cg.on("mousemove",(e,o)=>{ rkHover(o.id); const c=R.cols[o.j],it=o.it,d=it.d; let h=rkTip(it); h=h.replace("<br><i>",`<br>${TEXT.figure.tipCell(esc(RKA.get(c.k).short),rkFmt(c.k,d[c.k]),c.dir>0?TEXT.figure.best.high:TEXT.figure.best.low)}<br><i>`); showTip(e,h)}).on("mouseleave",()=>{hideTip();rkHover(null)}).on("click",(e,o)=>rkPin(o.id));
  const mg=svg.select("g.med"); mg.selectAll("*").remove();
  R.cols.forEach((c,j)=>{ const s=rkStat(c.k),med=d3.median(R.items,it=>it.d[c.k]); if(med==null)return; const x=L.x0(j)+Math.min(1,med/(s.hi||1))*L.tw;
    mg.append("line").attr("x1",x).attr("x2",x).attr("y1",0).attr("y2",H-4).attr("stroke","var(--muted)").attr("stroke-dasharray","3 3").attr("stroke-opacity",.6).style("pointer-events","none").append("title").text(TEXT.figure.medianTip(R.items.length,rkFmt(c.k,med))); });
  // left block: the LineUp-style ranking
  const rg=svg.select("g.left").selectAll("g.row").data(left,it=>it.d.UNITID).join(e=>{const g=e.append("g").attr("class","row").attr("transform",it=>`translate(0,${P0.get(it.d.UNITID)*RH})`); g.append("rect").attr("class","hit").attr("height",RH-2); g.append("text").attr("class","chg").style("font-size","10.5px").style("font-weight",700).style("font-family","var(--mono)").style("pointer-events","none"); g.append("text").attr("class","rk").attr("text-anchor","end").style("font-size","12px").style("font-family","var(--mono)").style("pointer-events","none"); g.append("path").attr("class","tdot").style("pointer-events","none"); g.append("text").attr("class","nmx").style("font-size","12.5px").style("pointer-events","none"); g.append("g").attr("class","stack").style("pointer-events","none"); g.append("text").attr("class","sc").style("font-size","11px").style("font-family","var(--mono)").style("pointer-events","none"); return g});
  T(rg).attr("transform",it=>`translate(0,${P0.get(it.d.UNITID)*RH})`);
  rg.select("rect.hit").attr("x",2).attr("y",1).attr("width",L.LW-4).attr("rx",3);
  rg.select("text.rk").attr("x",L.nameX-22).attr("y",18).style("fill","var(--muted)").text(it=>it.rank);
  rg.select("path.tdot").attr("transform",`translate(${L.nameX-10},14)`).attr("d",it=>rkSymPath(it.d.Control)).attr("fill","var(--fg)").attr("fill-opacity",.7);
  const age=performance.now()-(R.chgT||0), live=!!R.chg&&(reduced||age<3600), dOf=it=>live&&R.chg.get(it.d.UNITID)||0, fade=reduced?1:age<1200?1:Math.max(0,1-(age-1200)/2200);
  const ch=rg.select("text.chg").interrupt().attr("x",2).attr("y",18).text(it=>{const d=dOf(it);return d?(d>0?"▲":"▼")+Math.abs(d):""}).style("fill",it=>dOf(it)>0?"var(--up)":"var(--dn)").attr("fill-opacity",it=>Math.min(1,.5+Math.abs(dOf(it))/25)*fade);
  if(live&&!reduced&&fade>0)ch.transition().duration(Math.max(0,3400-age)).ease(d3.easeLinear).attr("fill-opacity",0);
  rg.select("text.nmx").attr("x",L.nameX).attr("y",18).text(it=>{const m=Math.floor(L.nameW/6.6);return it.d.INSTNM.length>m?it.d.INSTNM.slice(0,m-1)+"…":it.d.INSTNM});
  rg.each(function(it){ const sg=d3.select(this).select("g.stack"); let x=L.barX; const segs=it.parts.map((p,i)=>{const o={x,w:p*L.bw,c:R.cols[i]};x+=o.w;return o});
    sg.selectAll("rect").data(segs).join("rect").attr("x",o=>o.x).attr("y",7).attr("height",RH-14).attr("width",o=>Math.max(0,o.w)).attr("fill",o=>o.c.color).attr("stroke","var(--panel)").attr("stroke-width",.6);
    d3.select(this).select("text.sc").attr("x",L.scX).attr("y",18).style("fill","var(--muted)").text(Math.round(it.score*100)); });
  rg.on("mousemove",function(e,it){ rkHover(it.d.UNITID); const [px]=d3.pointer(e,svg.node()); let x=L.barX,idx=-1; for(let i=0;i<it.parts.length;i++){const w=it.parts[i]*L.bw; if(px>=x&&px<x+w){idx=i;break} x+=w}
      let html=rkTip(it); if(idx>=0){const c=R.cols[idx],d=it.d; html=html.replace("<br><i>",`<br>${TEXT.figure.tipPart(esc(RKA.get(c.k).short),(rkNorm(c,d[c.k])*100).toFixed(0),Math.round(c.w*100),(it.parts[idx]*100).toFixed(1))}<br><i>`)} showTip(e,html);})
    .on("mouseleave",()=>{hideTip();rkHover(null)}).on("click",(e,it)=>rkPin(it.d.UNITID));
  const sp=svg.select("g.sep"); sp.selectAll("*").remove(); if(extra.length){ const y=top.length*RH; sp.append("line").attr("x1",4).attr("x2",L.LW-4).attr("y1",y).attr("y2",y).attr("stroke","var(--muted)").attr("stroke-dasharray","2 3"); }
  rkFigStyle();
}
function rkFigStyle(){
  const R=S.rank,svg=d3.select("#rkSvg"),pins=new Set(R.pins),any=R.pins.some(id=>svg.selectAll("g.row").filter(it=>it.d.UNITID===id).size()>0),h=R.hov,on=id=>pins.has(id)||id===h;
  svg.selectAll("path.ln").attr("stroke",o=>pins.has(o.id)?pinShade(o.id):o.id===h?"var(--dot)":"var(--muted)").attr("stroke-width",o=>o.id===h?3.6:pins.has(o.id)?2.8:1).attr("stroke-opacity",o=>on(o.id)?1:any?.2:.45).filter(o=>on(o.id)).raise();
  svg.selectAll("g.cell").style("opacity",o=>any&&!on(o.id)?.6:1);
  svg.selectAll("g.cell rect.bar").style("fill",o=>any&&!on(o.id)?"var(--gry)":null);
  svg.selectAll("g.row g.stack rect").style("fill",function(){const it=this.parentNode.parentNode.__data__; return any&&!on(it.d.UNITID)?"var(--gry)":null});
  svg.selectAll("rect.band").attr("fill",o=>on(o.id)?"var(--soft)":"transparent").attr("stroke",o=>pins.has(o.id)?pinShade(o.id):"none").attr("stroke-width",1.5);
  svg.selectAll("rect.hit").attr("fill",it=>on(it.d.UNITID)?"var(--soft)":"transparent").attr("stroke",it=>pins.has(it.d.UNITID)?pinShade(it.d.UNITID):"none").attr("stroke-width",1.5).style("cursor","pointer");
  svg.selectAll("text.nmx").style("font-weight",it=>pins.has(it.d.UNITID)?700:400).style("fill",it=>pins.has(it.d.UNITID)?pinShade(it.d.UNITID):null);
  svg.selectAll("g.row").style("opacity",it=>any&&!on(it.d.UNITID)?.65:1);
  rkHistMark();
}
function rkHistMark(){
  const R=S.rank,L=rkLayout(),pinIts=R.pins.map(id=>R.items.find(it=>it.d.UNITID===id)).filter(Boolean),hovIt=R.hov!=null?R.items.find(it=>it.d.UNITID===R.hov):null,B=14;
  d3.selectAll("#rkHead g.hc").each(function(c){ const j=R.cols.indexOf(c); if(j<0)return; const gh=d3.select(this),s=rkStat(c.k),x0=L.x0(j),span=(s.hi-s.lo)||1,bi=v=>Math.min(B-1,Math.floor((v-s.lo)/span*B));
    const mk=new Set(pinIts.map(it=>bi(it.d[c.k]))),hb=hovIt?bi(hovIt.d[c.k]):-1,any=mk.size>0||hb>=0;
    gh.selectAll("g.hbars rect").attr("fill-opacity",(d,i)=>any?(mk.has(i)||i===hb?1:.3):.85).attr("stroke",(d,i)=>mk.has(i)||i===hb?"var(--fg)":"none").attr("stroke-width",1.2);
    const mg=gh.select("g.hmark"); mg.selectAll("*").remove();
    const ticks=pinIts.map(it=>({x:x0+(it.d[c.k]-s.lo)/span*L.tw,col:pinShade(it.d.UNITID)})).concat(hovIt?[{x:x0+(hovIt.d[c.k]-s.lo)/span*L.tw,col:"var(--median)"}]:[]);
    for(const k of ticks){ mg.append("line").attr("x1",k.x).attr("x2",k.x).attr("y1",RK_HY0+1).attr("y2",RK_HY1).attr("stroke","var(--panel)").attr("stroke-width",4.5); mg.append("line").attr("x1",k.x).attr("x2",k.x).attr("y1",RK_HY0+1).attr("y2",RK_HY1).attr("stroke",k.col).attr("stroke-width",2.2); mg.append("circle").attr("cx",k.x).attr("cy",RK_HY0+1).attr("r",3.6).attr("fill",k.col).attr("stroke","var(--panel)").attr("stroke-width",1.2); }
  });
}
function rkHover(id){ const R=S.rank; if(R.hov===id)return; R.hov=id; rkMapRings(); rkFigStyle(); }
function rkMapRings(){ const R=S.rank; if(!R.pos||!R.mapW)return; const p=R.hov!=null?R.pos.get(R.hov):null; d3.select("#rkMap circle.ringh").style("display",p?null:"none").attr("cx",p?p[0]:0).attr("cy",p?p[1]:0); }
function rkMapClearBrush(){ const R=S.rank; if(R.mapG&&R.brush)R.mapG.call(R.brush.move,null); }
function rkMapNear(ev){ const R=S.rank; if(!R.qt)return null; const [x,y]=d3.pointer(ev,d3.select("#rkMap svg").node()); return R.qt.find(x,y,9); }
function rkMapBuild(){
  const R=S.rank,host=$("rkMap"),W=Math.max(260,Math.round(host.clientWidth)),H=Math.round(W*.62);
  const key=W+"|"+R.region+"|"+R.state; if(R.mapKey===key&&host.firstChild)return false;
  host.innerHTML=""; R.mapW=W; R.mapKey=key; R.geoBox=null;
  const proj=d3.geoAlbersUsa().fitExtent([[4,4],[W-4,H-4]],rkAreaFeatures()),path=d3.geoPath(proj);
  const svg=d3.select(host).append("svg").attr("width",W).attr("height",H).attr("role","img").attr("aria-label","Map of the ranked schools. Highlighted schools are large and numbered. Drag a rectangle to rank only the schools inside it.").style("overflow","hidden");
  svg.append("g").selectAll("path").data(states.features).join("path").attr("d",path).attr("fill","var(--sgrey)").attr("stroke","var(--panel)").attr("stroke-width",.8);
  R.pos=new Map(); for(const d of rows){ if(d.LATITUDE==null||d.LONGITUDE==null)continue; const p=proj([d.LONGITUDE,d.LATITUDE]); if(p)R.pos.set(d.UNITID,p); }
  svg.append("g").attr("class","dots").style("pointer-events","none");
  R.brush=d3.brush().extent([[0,0],[W,H]]).on("brush end",e=>{ if(!e.sourceEvent)return; const s=e.selection,pv=R.geoBox,same=!!(s&&pv&&s.flat().every((v,i)=>Math.abs(v-pv.flat()[i])<.5));
    if(e.type==="end"&&(!s||same)){ const o=rkMapNear(e.sourceEvent); if(o){ rkPin(o.d.UNITID); if(!s&&pv)R.mapG.call(R.brush.move,pv); return; } if(same)return; }
    R.geoBox=s?[[s[0][0],s[0][1]],[s[1][0],s[1][1]]]:null; rkUpdate(false,{track:false}); });
  R.mapG=svg.append("g").attr("class","brush").call(R.brush);
  R.mapG.selectAll(".overlay,.selection").style("cursor","crosshair").on("mousemove.tip",function(e){ const o=rkMapNear(e); if(o){ const it=S.rank.items.find(x=>x.d.UNITID===o.d.UNITID),d=o.d; showTip(e,it?rkTip(it):`<b>${esc(d.INSTNM)}</b><br>${esc(d.CITY)}, ${esc(d.STABBR)}<br>${TEXT.figure.outsideBox}`); rkHover(d.UNITID); } else { hideTip(); rkHover(null); } }).on("mouseleave.tip",()=>{hideTip();rkHover(null)});
  svg.append("g").attr("class","hi").style("pointer-events","none");
  svg.append("circle").attr("class","ringh").attr("r",11).attr("fill","none").attr("stroke","var(--median)").attr("stroke-width",2.2).style("display","none").style("pointer-events","none");
  return true;
}
const rkMapSym=d3.symbol();
function rkMapUpdate(){
  const R=S.rank,host=$("rkMap"); if(!host||!host.clientWidth)return;
  const had=!!R.geoBox; if(rkMapBuild()&&had){ rkUpdate(false,{track:false}); return; }
  const pop=rkRank(R.cols,true),inIt=new Set(R.items.map(it=>it.d.UNITID)),pts=[];
  const dat=pop.filter(it=>R.pos.has(it.d.UNITID)).map(it=>{const p=R.pos.get(it.d.UNITID),ins=inIt.has(it.d.UNITID),o={id:it.d.UNITID,d:it.d,x:p[0],y:p[1],ins}; pts.push(o); return o});
  R.qt=d3.quadtree().x(o=>o.x).y(o=>o.y).addAll(pts);
  const svg=d3.select("#rkMap svg");
  svg.select("g.dots").selectAll("path").data(dat,o=>o.id).join("path").attr("transform",o=>`translate(${o.x},${o.y})`).attr("d",o=>rkMapSym.size(o.ins?22:10).type(RK_SHAPE[o.d.Control]||d3.symbolCircle)()).attr("fill","var(--muted)").attr("fill-opacity",o=>o.ins?(R.pins.length?.3:.6):.22);
  const hi=rkHi().filter(it=>R.pos.has(it.d.UNITID)),gh=svg.select("g.hi");
  const hg=gh.selectAll("g.h").data(hi,it=>it.d.UNITID).join(e=>{const g=e.append("g").attr("class","h"); g.append("circle"); g.append("text"); return g});
  hg.attr("transform",it=>{const p=R.pos.get(it.d.UNITID);return `translate(${p[0]},${p[1]})`});
  hg.select("circle").attr("r",8).style("fill","var(--dot)").attr("stroke","var(--panel)").attr("stroke-width",1.5);
  hg.select("text").attr("text-anchor","middle").attr("dy","0.35em").attr("font-size",hi.length>9?8:9).attr("font-weight",700).style("fill","var(--bg)").style("font-family","var(--mono)").text(it=>it.rank);
  $("rkMapLg").innerHTML="";
  $("rkMapNote").textContent=R.geoBox?TEXT.map.boxNote(R.items.length,pop.length):TEXT.map.hint;
  $("rkGeoClear").style.display=R.geoBox?null:"none"; rkMapRings();
}
function rkFillField(){ const R=S.rank,s=$("rkField"); s.innerHTML=""; const add=(p,k,l)=>{const e=document.createElement("option");e.value=k;e.textContent=l;p.appendChild(e)}; add(s,"",TEXT.filters.fieldAny);
  const done=new Set(); GROUPS.forEach(([g])=>{ const fs=FIELDOPTS.filter(o=>o.grp===g); if(!fs.length)return; done.add(g); const og=document.createElement("optgroup"); og.label=g; add(og,"G:"+g,TEXT.filters.fieldAllIn(g)); fs.sort((a,b)=>a.label.localeCompare(b.label)).forEach(o=>add(og,o.c,o.label)); s.appendChild(og); });
  const rest=FIELDOPTS.filter(o=>!done.has(o.grp)); if(rest.length){ const og=document.createElement("optgroup"); og.label=TEXT.filters.fieldOther; rest.sort((a,b)=>a.label.localeCompare(b.label)).forEach(o=>add(og,o.c,o.label)); s.appendChild(og); }
  s.value=R.field?R.field:R.group?"G:"+R.group:""; }
function rkSyncControls(){ const R=S.rank,fm_=v=>"$"+d3.format(",")(Math.round(v)),mode=R.field||R.group;
  $("rkEarnLab").textContent=mode?TEXT.filters.earningsField:TEXT.filters.earnings; $("rkEarn").value=R.minE; $("rkEarnOut").textContent=R.minE>0?fm_(R.minE):TEXT.filters.none;
  const mx=RK_CAPMAX.get(R.costVar); $("rkCap").max=mx; $("rkCap").value=R.cap; $("rkCapOut").textContent=R.cap>=mx?TEXT.filters.noLimit:fm_(R.cap); $("rkField").value=R.field?R.field:R.group?"G:"+R.group:""; $("rkType").value=R.type; $("rkRegion").value=R.region; rkFillState(); }
function rkSetCost(v){ const R=S.rank,i=R.cols.findIndex(c=>c.k===R.costVar);
  if(i>=0&&!R.cols.some(c=>c.k===v)){ const c=R.cols[i]; delete R.ranges[c.k]; R.cols[i]={k:v,imp:c.imp,w:c.w,dir:RKA.get(v).dir,color:c.color}; }
  R.costVar=v; R.cap=RK_CAPMAX.get(v); R.animate=true; rkFillAdd(); }
function rkAreaFeatures(){ const R=S.rank; if(!R.region&&!R.state)return states; const f=states.features.filter(g=>R.state?fipsToAbbr.get(+g.id)===R.state:regionOf(g)===R.region); return f.length?{type:"FeatureCollection",features:f}:states; }
const RK_STREG=new Map(rows.map(d=>[d.STABBR,d.Region]));
function rkFillRegion(){ const s=$("rkRegion"); s.innerHTML=""; const add=(v,l)=>{const e=document.createElement("option");e.value=v;e.textContent=l;s.appendChild(e)}; add("",TEXT.map.regionAll); REGIONS.forEach(r=>add(r,r)); s.value=S.rank.region; }
function rkFillState(){ const R=S.rank,s=$("rkState"); s.innerHTML=""; const add=(v,l)=>{const e=document.createElement("option");e.value=v;e.textContent=l;s.appendChild(e)}; add("",R.region?TEXT.map.stateAllInRegion:TEXT.map.stateAll);
  [...new Set(rows.filter(d=>!R.region||d.Region===R.region).map(d=>d.STABBR))].sort((a,b)=>(RK_STN[a]||a).localeCompare(RK_STN[b]||b)).forEach(a=>add(a,RK_STN[a]||a)); s.value=R.state; }
function rkSetup(){
  fillSelect("rkType",[["All",TEXT.filters.typeAll],["Public","Public"],["Private nonprofit","Private nonprofit"],["Private for-profit","Private for-profit"]],"All",v=>{S.rank.type=v; rkUpdate(false,{track:false})});
  rkFillField(); $("rkField").addEventListener("change",e=>{const R=S.rank,v=e.target.value; R.field=""; R.group=""; if(v.startsWith("G:"))R.group=v.slice(2); else R.field=v; rkApplyField(); rkUpdate(true,{track:false}); rkSyncControls();});
  rkFillRegion(); rkFillState();
  $("rkRegion").addEventListener("change",e=>{const R=S.rank; R.region=e.target.value; if(R.state&&R.region&&RK_STREG.get(R.state)!==R.region)R.state=""; rkFillState(); rkUpdate(false,{track:false})});
  $("rkState").addEventListener("change",e=>{S.rank.state=e.target.value; rkUpdate(false,{track:false})});
  $("rkEarn").addEventListener("input",e=>{S.rank.minE=+e.target.value; $("rkEarnOut").textContent=S.rank.minE>0?"$"+d3.format(",")(S.rank.minE):TEXT.filters.none; later(()=>rkUpdate(false,{track:false}))});
  $("rkCap").addEventListener("input",e=>{const R=S.rank; R.cap=+e.target.value; $("rkCapOut").textContent=R.cap>=RK_CAPMAX.get(R.costVar)?TEXT.filters.noLimit:"$"+d3.format(",")(R.cap); later(()=>rkUpdate(false,{track:false}))});
  $("rkPinClear").addEventListener("click",()=>{S.rank.pins=[]; renderRankBody(); rkLinked(true)});
  $("rkGeoClear").addEventListener("click",()=>{S.rank.geoBox=null; rkMapClearBrush(); rkUpdate(false,{track:false})});
  $("rkAdd").addEventListener("change",e=>rkAdd(e.target.value));
  $("rkReset").addEventListener("click",()=>{S.rank.cols.forEach(c=>c.imp=5); rkUpdate(true,{animate:true})});
  $("rkClear").addEventListener("click",()=>{const R=S.rank; R.geoBox=null; rkMapClearBrush(); R.ranges={}; R.q=""; R.type="All"; R.group=""; R.field=""; R.region=""; R.state=""; R.minE=0; R.cap=RK_CAPMAX.get(R.costVar); rkApplyField(); rkFillField(); rkFillRegion(); $("rkQ").value=""; rkSyncControls(); rkUpdate(true,{track:false})});
  $("rkQ").addEventListener("input",e=>{S.rank.q=e.target.value; later(()=>rkUpdate(false,{track:false}))});
  rkFillAdd();
}
function renderRank(){ rkCompute(false); rkSyncControls(); rkFillAdd(); rkWeightsUI(); renderRankHeader(); renderRankBody(); rkCount(); rkLinked(false); refreshInfo(); }
rkSetup();


/* ---------- 7. start ---------- */
function render(){ hideTip(); renderRank(); }
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>rkLinked(true)); // pin shades flip with the theme
let lastW=0; new ResizeObserver(es=>{const w=Math.round(es[0].contentRect.width);if(Math.abs(w-lastW)>2){lastW=w;later(render)}}).observe(document.querySelector(".wrap"));
render();
window.__app={S,rows,render};
})();
