
(function(){
'use strict';
/* ---------- language: the page says which (html lang); the few strings this script writes
   itself are looked up here, numbers follow the locale (mirrors analysis.fmt_* and i18n.py) ---------- */
const LANG=document.documentElement.lang||'en';const LOC=LANG==='fr'?'fr-FR':'en-US';
const I18N={fr:{
  'No data yet.':'Pas encore de données.',
  ' — no hybrid yet':' — aucun hybride pour l’instant',' — strongest partners: ':' — partenaires les plus forts : ',
  '%d weaker link':'%d lien plus faible','%d weaker links':'%d liens plus faibles','games':'jeux','slugs':'slugs',
  '%s of %s games':'%s jeux sur %s',
  'Close':'Fermer','All definitions →':'Toutes les définitions →',
  'Name':'Nom','Score ':'Score ','Roblox CCU ':'CCU Roblox ','Web supply ':'Offre web ','Status ':'Statut ',
  'Δ score':'Δ score','ΔCCU':'ΔCCU','Δsupply':'Δoffre','Lanes: ':'Lanes : ','Skins: ':'Thèmes : ',
  'Scores and supplies are read from each snapshot as computed with today’s taxonomy. ΔCCU compares two instants: check the collection hours of both dates before reading it.':'Scores et offres sont lus dans chaque snapshot tels que calculés avec la taxonomie d’aujourd’hui. Le ΔCCU compare deux instants : vérifiez les heures de collecte des deux dates avant de le lire.',
  'Could not load the two snapshots (this page needs to be served over http, not opened as a file).':'Impossible de charger les deux snapshots (cette page doit être servie en http, pas ouverte comme un fichier).',
  'Search needs the site served over http.':'La recherche a besoin que le site soit servi en http.','No match.':'Aucun résultat.',
  'lane':'lane','skin':'thème','roblox':'Roblox',
  'OPEN LANE':'LANE OUVERTE','emerging':'émergente','spreading':'en diffusion','established':'établie','saturated':'saturée',
  'too small':'trop petite','absent':'absente','supply unknown':'offre inconnue'
}};
const L=s=>(I18N[LANG]&&I18N[LANG][s])||s;
document.querySelectorAll('[data-lang-switch]').forEach(a=>a.addEventListener('click',()=>{try{localStorage.setItem('tw-lang',a.dataset.langSwitch);}catch(e){}}));
/* ---------- theme ---------- */
const root=document.documentElement;
try{const t=localStorage.getItem('tw-theme');if(t)root.setAttribute('data-theme',t);}catch(e){}
document.querySelectorAll('[data-toggle-theme]').forEach(b=>b.addEventListener('click',()=>{
  const next=root.getAttribute('data-theme')==='dark'?'light':'dark';root.setAttribute('data-theme',next);
  try{localStorage.setItem('tw-theme',next);}catch(e){} document.querySelectorAll('figure.chart[data-chart]').forEach(drawChart);}));

/* ---------- motion (progressive: nothing is hidden if animations cannot run) ---------- */
const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canAnimate=!reduce&&typeof Element.prototype.animate==='function';
const ANIMS=[];
function track(a){if(a)ANIMS.push(a);return a;}
function rise(){if(!canAnimate)return;document.querySelectorAll('.rise').forEach(el=>{const i=parseInt(getComputedStyle(el).getPropertyValue('--i'))||0;
  track(el.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:480,delay:Math.min(i,8)*45,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'}));});}
function drawIn(path){if(!canAnimate)return;path.setAttribute('pathLength','1');path.style.strokeDasharray='1';
  const a=track(path.animate([{strokeDashoffset:1},{strokeDashoffset:0}],{duration:1000,easing:'cubic-bezier(.3,.6,.2,1)',fill:'backwards'}));
  a.onfinish=()=>{path.style.strokeDasharray='';path.removeAttribute('pathLength');};}
function fadeIn(node){if(!canAnimate)return;track(node.animate([{opacity:0},{opacity:1}],{duration:1000,delay:150,easing:'ease',fill:'backwards'}));}
/* Safety net: a tab that is not being painted never advances its animations, and 'backwards'
   fill would then keep everything invisible. Snap to the end. */
setTimeout(()=>{ANIMS.forEach(a=>{try{if(a.playState!=='finished')a.finish();}catch(e){}});},2000);

/* ---------- formatting (mirrors analysis.py) ---------- */
const FRN=LANG==='fr',NB=' ';const dec=s=>FRN?s.replace('.',','):s;
const F={
  int:v=>Math.round(v).toLocaleString(LOC),
  signed:v=>(v>0?'+':'')+Math.round(v).toLocaleString(LOC),
  pct:v=>(v>0?'+':'')+Math.round(v*100)+(FRN?NB+'%':'%'),
  share:v=>Math.round(v*100)+(FRN?NB+'%':'%'),
  big:v=>{const s=v<0?'-':'+',a=Math.abs(v);if(a>=1e6)return s+dec((a/1e6).toFixed(1))+(FRN?NB+'M':'M');if(a>=1e3)return s+Math.round(a/1e3)+(FRN?NB+'k':'K');return s+Math.round(a);},
  x:v=>dec(v.toFixed(1))+(FRN?'×':'x'),
  score:v=>dec(v.toFixed(2)),
  raw:v=>String(v)
};
const fmt=(k,v)=>(v===null||v===undefined||Number.isNaN(v))?'—':(F[k]||F.raw)(v);

/* ---------- charts: line / area with crosshair, from data-chart JSON ---------- */
const NS='http://www.w3.org/2000/svg';
function el(n,a){const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);return e;}
function niceTicks(lo,hi,n){const span=hi-lo||1;const step0=span/n;const p=Math.pow(10,Math.floor(Math.log10(step0)));
  const step=[1,2,2.5,5,10].map(m=>m*p).find(s=>s>=step0)||p*10;const start=Math.floor(lo/step)*step;const out=[];
  for(let v=start;v<=hi+step*0.5;v+=step)out.push(+v.toFixed(10));return out;}
let CID=0;
function drawChart(fig){
  let spec;try{spec=JSON.parse(fig.getAttribute('data-chart'));}catch(e){return;}
  const range=fig._range||spec.range||0;
  let dates=spec.dates.slice(),series=spec.series.map(s=>({...s,values:s.values.slice()}));
  if(range&&range<dates.length){dates=dates.slice(-range);series.forEach(s=>{s.values=s.values.slice(-range);});}
  const W=640,H=spec.height||220,pl=56,pr=14,pt=14,pb=30;
  const old=fig.querySelector('svg.plot');const tipOld=fig.querySelector('.tip');
  const vals=[];series.forEach(s=>s.values.forEach(v=>{if(v!==null&&v!==undefined)vals.push(v);}));
  const holder=fig.querySelector('.plot-holder')||fig;
  if(!vals.length){if(old)old.remove();if(tipOld)tipOld.remove();let e=fig.querySelector('.empty');if(!e){e=document.createElement('div');e.className='empty';e.textContent=L('No data yet.');holder.appendChild(e);}return;}
  let lo=Math.min(0,...vals),hi=Math.max(...vals);if(hi===lo)hi=lo+1;
  const ticks=niceTicks(lo,hi,4);lo=Math.min(lo,ticks[0]);hi=Math.max(hi,ticks[ticks.length-1]);
  const n=Math.max(dates.length-1,1);const X=i=>pl+i*(W-pl-pr)/n;const Y=v=>pt+(hi-v)/(hi-lo)*(H-pt-pb);
  const id='c'+(++CID);
  const svg=el('svg',{class:'plot',viewBox:`0 0 ${W} ${H}`,role:'img',tabindex:'0','aria-label':spec.title||'chart'});
  const defs=el('defs',{});svg.appendChild(defs);
  ticks.forEach(t=>{svg.appendChild(el('line',{class:'gridline',x1:pl,x2:W-pr,y1:Y(t),y2:Y(t)}));
    const tx=el('text',{class:'axis-t',x:pl-8,y:Y(t)+3.5,'text-anchor':'end'});tx.textContent=fmt(spec.fmt,t);svg.appendChild(tx);});
  const step=Math.max(1,Math.ceil(dates.length/7));
  dates.forEach((d,i)=>{if(i%step===0||i===dates.length-1){const tx=el('text',{class:'axis-t',x:X(i),y:H-8,'text-anchor':i===0?'start':(i===dates.length-1?'end':'middle')});tx.textContent=d.slice(5);svg.appendChild(tx);}});
  series.forEach((s,si)=>{
    const color=s.color||'var(--s1)';const pts=[];s.values.forEach((v,i)=>{if(v!==null&&v!==undefined)pts.push([X(i),Y(v),i]);});
    if(pts.length>=2&&(spec.area!==false)){const gid=id+'g'+si;const g=el('linearGradient',{id:gid,x1:0,x2:0,y1:0,y2:1});
      const a=el('stop',{offset:'0%','stop-color':color,'stop-opacity':'0.22'});const b=el('stop',{offset:'100%','stop-color':color,'stop-opacity':'0'});g.appendChild(a);g.appendChild(b);defs.appendChild(g);
      const base=Y(Math.max(lo,0));const dA='M'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')+`L${pts[pts.length-1][0].toFixed(1)},${base.toFixed(1)}L${pts[0][0].toFixed(1)},${base.toFixed(1)}Z`;
      const area=el('path',{class:'ser-area',d:dA,fill:`url(#${gid})`});svg.appendChild(area);if(fig._animated!==false)fadeIn(area);}
    if(pts.length>=2){const dL='M'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L');const line=el('path',{class:'ser-line',d:dL,stroke:color});svg.appendChild(line);if(fig._animated!==false)drawIn(line);}
    pts.forEach(p=>{svg.appendChild(el('circle',{class:'ser-dot',cx:p[0],cy:p[1],r:4,fill:color,'data-i':p[2],'data-s':si}));});
    if(pts.length===1){const c=svg.querySelector(`circle[data-s="${si}"]`);if(c)c.style.opacity=1;}
  });
  const xl=el('line',{class:'xline',x1:0,x2:0,y1:pt,y2:H-pb});svg.appendChild(xl);
  const hit=el('rect',{x:pl,y:0,width:W-pl-pr,height:H,fill:'transparent'});svg.appendChild(hit);
  if(old)old.replaceWith(svg);else holder.appendChild(svg);
  let tip=tipOld;if(!tip){tip=document.createElement('div');tip.className='tip';fig.appendChild(tip);}
  const show=i=>{xl.setAttribute('x1',X(i));xl.setAttribute('x2',X(i));xl.style.opacity=1;
    svg.querySelectorAll('circle.ser-dot').forEach(c=>{c.style.opacity=(+c.getAttribute('data-i')===i)?1:0;});
    tip.textContent='';const d=document.createElement('div');d.className='d';d.textContent=dates[i];tip.appendChild(d);
    series.forEach(s=>{const r=document.createElement('div');r.className='r';const sp=document.createElement('span');const key=document.createElement('i');key.style.background=s.color||'var(--s1)';sp.appendChild(key);sp.appendChild(document.createTextNode(s.label));const b=document.createElement('b');b.textContent=fmt(spec.fmt,s.values[i]);r.appendChild(sp);r.appendChild(b);tip.appendChild(r);});
    const rect=svg.getBoundingClientRect();const px=X(i)/W*rect.width;const left=px>rect.width*0.6?px-tip.offsetWidth-14:px+14;
    tip.style.left=Math.max(0,left)+'px';tip.style.top=(svg.offsetTop+8)+'px';tip.style.opacity=1;};
  const hide=()=>{xl.style.opacity=0;tip.style.opacity=0;svg.querySelectorAll('circle.ser-dot').forEach(c=>{if(!(series.length&&dates.length===1))c.style.opacity=0;});};
  let cur=dates.length-1;
  svg.addEventListener('pointermove',e=>{const rect=svg.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width*W;let best=0,bd=1e9;for(let i=0;i<dates.length;i++){const d=Math.abs(X(i)-x);if(d<bd){bd=d;best=i;}}cur=best;show(best);});
  svg.addEventListener('pointerleave',hide);
  svg.addEventListener('focus',()=>show(cur));svg.addEventListener('blur',hide);
  svg.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){cur=Math.max(0,cur-1);show(cur);e.preventDefault();}if(e.key==='ArrowRight'){cur=Math.min(dates.length-1,cur+1);show(cur);e.preventDefault();}});
  fig._animated=false; /* redraws (theme, range) are instant; only the first draw animates */
}
document.querySelectorAll('figure.chart[data-chart]').forEach(drawChart);
rise();
window.twDrawChart=drawChart;window.twFmt=fmt;

/* ---------- tables: sort & filter ---------- */
function val(td){const v=td.dataset.v;if(v!==undefined){const n=parseFloat(v);return isNaN(n)?v:n;}return td.textContent.trim();}
function sortTable(th){const table=th.closest('table');const idx=[...th.parentNode.children].indexOf(th);const tbody=table.tBodies[0];if(!tbody)return;
  const asc=th.dataset.dir!=='asc';const rows=[...tbody.rows];
  rows.sort((a,b)=>{const x=val(a.cells[idx]),y=val(b.cells[idx]);if(typeof x==='number'&&typeof y==='number')return (x-y)*(asc?1:-1);
    if(typeof x==='number')return -1;if(typeof y==='number')return 1;return String(x).localeCompare(String(y))*(asc?1:-1);});
  rows.forEach(r=>tbody.appendChild(r));table.querySelectorAll('th').forEach(x=>x.removeAttribute('data-dir'));th.dataset.dir=asc?'asc':'desc';}
document.querySelectorAll('table.sortable th').forEach(th=>th.addEventListener('click',e=>{if(e.target.closest('a'))return;sortTable(th);}));
document.querySelectorAll('input.filter').forEach(inp=>inp.addEventListener('input',()=>{const t=document.getElementById(inp.dataset.target);if(!t)return;const q=inp.value.toLowerCase();
  [...t.tBodies[0].rows].forEach(r=>{r.hidden=!!q&&!r.textContent.toLowerCase().includes(q);});}));

/* ---------- count-up on stat values ---------- */
document.querySelectorAll('.count[data-value]').forEach(node=>{const target=parseFloat(node.dataset.value);const k=node.dataset.fmt||'int';if(reduce||isNaN(target)){node.textContent=fmt(k,target);return;}
  const t0=performance.now(),dur=800;const step=now=>{const p=Math.min(1,(now-t0)/dur);const e=1-Math.pow(1-p,3);node.textContent=fmt(k,target*e);if(p<1)requestAnimationFrame(step);else node.textContent=fmt(k,target);};requestAnimationFrame(step);});

/* ---------- range presets (history page) ---------- */
document.querySelectorAll('[data-range-group]').forEach(group=>{group.querySelectorAll('button[data-range]').forEach(b=>b.addEventListener('click',()=>{
  group.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');const r=parseInt(b.dataset.range,10)||0;
  document.querySelectorAll(group.dataset.rangeGroup).forEach(fig=>{fig._range=r;drawChart(fig);});}));});

/* ---------- metric switch: one chart visible at a time, scoped to its block ---------- */
document.querySelectorAll('[data-metric-switch]').forEach(sel=>sel.addEventListener('change',()=>{
  const m=sel.value;const scope=sel.dataset.scope?document.querySelector(sel.dataset.scope):document;if(!scope)return;
  scope.querySelectorAll('[data-metric]').forEach(x=>{x.hidden=x.dataset.metric!==m;});
  scope.querySelectorAll('[data-metric]:not([hidden]) figure.chart[data-chart]').forEach(drawChart);}));

/* ---------- chord diagrams: hovering a lane lights up its chords and partners ---------- */
document.querySelectorAll('figure.chord svg').forEach(svg=>{
  const edges=[...svg.querySelectorAll('.edge')],nodes=[...svg.querySelectorAll('.node')],labels=[...svg.querySelectorAll('.node-l')];
  const cap=svg.closest('figure').querySelector('.chord-cap');const TOP=5;
  const name=i=>{const l=labels.find(x=>x.dataset.i===i);return l?l.textContent:'';};
  function focus(i){svg.classList.add('focus');
    const mine=edges.filter(e=>e.dataset.a===i||e.dataset.b===i).sort((x,y)=>(+y.dataset.w)-(+x.dataset.w));
    const top=mine.slice(0,TOP);const strong=new Set([i]),weak=new Set();
    top.forEach(e=>{strong.add(e.dataset.a);strong.add(e.dataset.b);});
    mine.slice(TOP).forEach(e=>{weak.add(e.dataset.a);weak.add(e.dataset.b);});
    edges.forEach(e=>{e.classList.toggle('on',mine.includes(e));e.classList.toggle('top',top.includes(e));});
    [...nodes,...labels].forEach(x=>{x.classList.toggle('top',strong.has(x.dataset.i));x.classList.toggle('on',weak.has(x.dataset.i)&&!strong.has(x.dataset.i));});
    if(cap){cap.textContent='';const b=document.createElement('b');b.textContent=name(i);cap.appendChild(b);
      if(!mine.length){cap.appendChild(document.createTextNode(L(' — no hybrid yet')));return;}
      const unit=L(cap.dataset.unit||'games');const rest=mine.length-TOP;
      const weaker=rest>0?' · '+L(rest>1?'%d weaker links':'%d weaker link').replace('%d',rest):'';
      cap.appendChild(document.createTextNode(L(' — strongest partners: ')+top.map(e=>name(e.dataset.a===i?e.dataset.b:e.dataset.a)+' ('+e.dataset.w+')').join(' · ')+weaker+' · '+unit));}}
  function clear(){svg.classList.remove('focus');[...edges,...nodes,...labels].forEach(x=>{x.classList.remove('on');x.classList.remove('top');});if(cap)cap.textContent=cap.dataset.hint||'';}
  [...nodes,...labels].forEach(el=>{el.addEventListener('pointerenter',()=>focus(el.dataset.i));el.addEventListener('pointerleave',clear);});
  svg.querySelectorAll('a').forEach(a=>{a.addEventListener('focus',()=>{const n=a.querySelector('.node');if(n)focus(n.dataset.i);});a.addEventListener('blur',clear);});
  svg.addEventListener('pointerleave',clear);});

/* ---------- sub-navigation: the entry of the section in view lights up while scrolling ---------- */
(function(){const here=location.pathname.split('/').pop()||'index.html';
  const links=[...document.querySelectorAll('.subnav a')].filter(a=>{const h=a.getAttribute('href')||'';const i=h.indexOf('#');if(i<0)return false;
    const file=h.slice(0,i).split('/').pop();return file===''||file===here;});
  const pairs=links.map(a=>[a,document.getElementById(a.getAttribute('href').split('#')[1])]).filter(p=>p[1]);
  if(!pairs.length)return;
  const OFFSET=140;
  /* a handful of rectangles per scroll event: cheap enough to run directly (no rAF, which a
     background tab never fires) */
  function update(){let cur=null;for(const [a,t] of pairs){if(t.getBoundingClientRect().top<=OFFSET)cur=a;}
    if(!cur)cur=pairs[0][0];
    if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-2)cur=pairs[pairs.length-1][0];
    pairs.forEach(([a])=>{a.classList.toggle('active',a===cur);});}
  addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();})();

/* ---------- game card directory: filter and sort ---------- */
document.querySelectorAll('[data-cards]').forEach(bar=>{const grid=document.querySelector(bar.dataset.cards);if(!grid)return;
  const q=bar.querySelector('[data-cards-search]'),lane=bar.querySelector('[data-cards-lane]'),phase=bar.querySelector('[data-cards-phase]'),sort=bar.querySelector('[data-cards-sort]'),count=bar.querySelector('[data-cards-count]');
  const cards=[...grid.children];
  const q0=new URLSearchParams(location.search).get('lane');if(q0&&lane)lane.value=q0;
  function apply(){const s=(q&&q.value||'').trim().toLowerCase(),l=lane&&lane.value,p=phase&&phase.value,k=sort&&sort.value||'ccu';let shown=0;
    cards.forEach(c=>{const ok=(!s||c.dataset.name.includes(s))&&(!l||(' '+c.dataset.lanes+' ').includes(' '+l+' '))&&(!p||c.dataset.phase===p);c.hidden=!ok;if(ok)shown++;});
    const key=c=>{const v=parseFloat(c.dataset[k]);return isNaN(v)?(k==='age'?Infinity:-Infinity):v;};
    cards.sort((a,b)=>k==='age'?key(a)-key(b):key(b)-key(a)).forEach(c=>grid.appendChild(c));
    if(count)count.textContent=L('%s of %s games').replace('%s',shown).replace('%s',cards.length);}
  [q,lane,phase,sort].forEach(x=>x&&x.addEventListener(x===q?'input':'change',apply));apply();});

/* ---------- definition drawer: any ? mark opens its term in place ---------- */
const ROOT=document.body.dataset.root||'';const VER=document.body.dataset.v||'';let DEFS=null;
const drawer=document.getElementById('drawer');
function closeDrawer(){if(drawer){drawer.hidden=true;drawer.textContent='';}}
async function openDef(term,href){if(!drawer)return location.href=href;
  try{if(!DEFS)DEFS=await fetch(ROOT+(LANG==='fr'?'assets/defs.fr.json':'assets/defs.json')+(VER?'?v='+VER:'')).then(r=>r.json());}catch(e){return location.href=href;}
  const def=DEFS[term];if(!def)return location.href=href;drawer.textContent='';
  const x=document.createElement('button');x.className='close';x.setAttribute('aria-label',L('Close'));x.textContent='×';x.addEventListener('click',closeDrawer);
  const h=document.createElement('h4');h.textContent=def.l||term;const p=document.createElement('p');p.textContent=def.d;
  drawer.appendChild(x);drawer.appendChild(h);drawer.appendChild(p);
  if(def.f){const c=document.createElement('code');c.textContent=def.f;drawer.appendChild(c);}
  const a=document.createElement('a');a.className='more';a.href=href;a.textContent=L('All definitions →');drawer.appendChild(a);drawer.hidden=false;}
document.addEventListener('click',e=>{const a=e.target.closest('a.def');if(!a)return;e.preventDefault();openDef(a.dataset.term||a.textContent,a.getAttribute('href'));});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});

/* ---------- encrypted deployments: data files may be AES-GCM envelopes ---------- */
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function storedKey(){const raw=sessionStorage.getItem('tw-key')||localStorage.getItem('tw-key');if(!raw)return null;
  return crypto.subtle.importKey('raw',b64(raw),'AES-GCM',true,['decrypt']);}
async function twJSON(url){const d=await fetch(url).then(r=>r.json());if(!d||d.enc!=='aes-256-gcm')return d;
  const key=await storedKey();if(!key)throw new Error('locked');
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(d.iv)},key,b64(d.ct));return JSON.parse(new TextDecoder().decode(pt));}

/* ---------- compare page ---------- */
const cmp=document.getElementById('compare');
if(cmp){const base=cmp.dataset.base||'';const selA=cmp.querySelector('#cmp-a'),selB=cmp.querySelector('#cmp-b'),out=cmp.querySelector('#cmp-out');
  twJSON(base+'data/index.json').then(ix=>{const dates=ix.dates;dates.forEach(d=>{selA.appendChild(new Option(d,d));selB.appendChild(new Option(d,d));});
    selA.value=dates[Math.max(0,dates.length-2)];selB.value=dates[dates.length-1];const run=()=>render(selA.value,selB.value);selA.addEventListener('change',run);selB.addEventListener('change',run);run();});
  function cell(v,k,cls){const td=document.createElement('td');td.className='num'+(cls?' '+cls:'');td.textContent=fmt(k,v);td.dataset.v=(v===null||v===undefined)?'-Infinity':v;return td;}
  function render(a,b){out.style.opacity=.5;Promise.all([twJSON(base+'data/snapshots/'+a+'.json'),twJSON(base+'data/snapshots/'+b+'.json')]).then(([A,B])=>{
    out.textContent='';out.style.opacity=1;
    const mk=(title,rowsA,rowsB,labels)=>{const h=document.createElement('h3');h.style.margin='16px 0 8px';h.textContent=title;out.appendChild(h);
      const wrap=document.createElement('div');wrap.className='tbl compact';const t=document.createElement('table');t.className='sortable';
      const cols=[[L('Name'),null],[L('Score ')+a,'score'],[L('Score ')+b,'score'],[L('Δ score'),'score'],[L('Roblox CCU ')+a,'int'],[L('Roblox CCU ')+b,'int'],[L('ΔCCU'),'pct'],[L('Web supply ')+a,'int'],[L('Web supply ')+b,'int'],[L('Δsupply'),'signed'],[L('Status ')+b,null]];
      const thead=document.createElement('thead');const tr=document.createElement('tr');cols.forEach(c=>{const th=document.createElement('th');th.textContent=c[0];if(c[1])th.className='num';tr.appendChild(th);});thead.appendChild(tr);t.appendChild(thead);
      const tb=document.createElement('tbody');Object.keys(labels).forEach(id=>{const ra=rowsA[id]||{},rb=rowsB[id]||{};const r=document.createElement('tr');const n=document.createElement('td');n.textContent=labels[id];r.appendChild(n);
        r.appendChild(cell(ra.score,'score'));r.appendChild(cell(rb.score,'score'));const ds=(rb.score!=null&&ra.score!=null)?rb.score-ra.score:null;r.appendChild(cell(ds,'score',ds>0?'up':(ds<0?'down':'')));
        r.appendChild(cell(ra.ccu,'int'));r.appendChild(cell(rb.ccu,'int'));const dc=(ra.ccu&&rb.ccu!=null)?(rb.ccu-ra.ccu)/ra.ccu:null;r.appendChild(cell(dc,'pct'));
        r.appendChild(cell(ra.supply,'int'));r.appendChild(cell(rb.supply,'int'));const dsup=(ra.supply!=null&&rb.supply!=null)?rb.supply-ra.supply:null;r.appendChild(cell(dsup,'signed'));
        const st=document.createElement('td');st.textContent=rb.status?L(rb.status):'—';r.appendChild(st);tb.appendChild(r);});
      t.appendChild(tb);wrap.appendChild(t);out.appendChild(wrap);t.querySelectorAll('th').forEach(th=>th.addEventListener('click',()=>sortTable(th)));};
    const labels={};Object.keys(B.mechanics).forEach(k=>{labels[k]=B.mechanics[k].label;});mk(L('Lanes: ')+a+' → '+b,A.mechanics,B.mechanics,labels);
    const sl={};Object.keys(B.skins).forEach(k=>{sl[k]=B.skins[k].label;});mk(L('Skins: ')+a+' → '+b,A.skins,B.skins,sl);
    const note=document.createElement('p');note.className='muted small';note.textContent=L('Scores and supplies are read from each snapshot as computed with today’s taxonomy. ΔCCU compares two instants: check the collection hours of both dates before reading it.');out.appendChild(note);
  }).catch(()=>{out.textContent=L('Could not load the two snapshots (this page needs to be served over http, not opened as a file).');});}
}

/* ---------- search page ---------- */
const sbox=document.getElementById('search');
if(sbox){const base=sbox.dataset.base||'';const inp=sbox.querySelector('input');const list=sbox.querySelector('#search-out');let idx=null;
  const q0=new URLSearchParams(location.search).get('q')||'';if(q0)inp.value=q0;
  twJSON(base+'data/search.json').then(d=>{idx=d;show(inp.value);}).catch(()=>{list.textContent=L('Search needs the site served over http.');});
  inp.addEventListener('input',()=>show(inp.value));
  function show(q){if(!idx)return;q=q.trim().toLowerCase();const rows=q.length<2?idx.slice(0,40):idx.filter(e=>(e.n+' '+(e.s||'')+' '+(e.m||[]).join(' ')).toLowerCase().includes(q)).slice(0,120);
    list.textContent='';rows.forEach(e=>{const li=document.createElement('li');const a=document.createElement('a');a.href=base+e.u;a.textContent=e.n;li.appendChild(a);const s=document.createElement('span');s.className='muted';s.textContent='  '+L(e.t)+(e.s?' · '+L(e.s):'')+((e.m&&e.m.length)?' · '+e.m.join(', '):'');li.appendChild(s);list.appendChild(li);});
    if(!rows.length){const li=document.createElement('li');li.className='muted';li.textContent=L('No match.');list.appendChild(li);}}
}
})();
