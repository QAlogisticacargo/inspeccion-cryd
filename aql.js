/* ===== Inspección por LPN (Recibo y Surtido): Total o AQL General II ===== */
/* Tabla AQL, nivel de inspección general II (ISO 2859-1 / ANSI Z1.4): tamaño de lote en cajas -> letra y muestra */
const AQL_T=[[8,2,"A"],[15,3,"B"],[25,5,"C"],[50,8,"D"],[90,13,"E"],[150,20,"F"],[280,32,"G"],[500,50,"H"],[1200,80,"J"],[3200,125,"K"],[10000,200,"L"],[35000,315,"M"],[150000,500,"N"],[500000,800,"P"],[Infinity,1250,"Q"]];
function aqSize(N){if(!(N>0))return {n:0,L:""};for(const r of AQL_T)if(N<=r[0])return {n:Math.min(r[1],N),L:r[2]};return {n:1250,L:"Q"};}
const AQ_V="3.8.3";
const AQ={};Object.keys(LCFG).forEach(m=>{AQ[m]={open:false,an:false,pick:"",txt:"",ed:-1,tm:0};});
const aqSet=m=>{const s=U.get("aqs:"+m,null)||{};if(!s.mode)s.mode="aql";if(!s.ov)s.ov={};return s;};
const aqSetSave=(m,s)=>U.set("aqs:"+m,s);
function aqPlan(m){const P=LP[m],p=U.get("aqp:"+m,null);return p&&P.X&&p.file===P.X.name+"|"+P.X.at?p:null;}
const aqPlanSave=(m,p)=>U.set("aqp:"+m,p);
const aqMode=md=>md==="tot"?_t(313,"Total (100%)"):_t(314,"AQL General II");
const aqMas=()=>U.get("aqm",null)||{};
function aqMasSet(g,o){const M=aqMas();M[g]=Object.assign(M[g]||{},o);U.set("aqm",M);}
const AQ_RS=["Código","Lote","Cantidad","Unidad de medida (CS/IT)","Producto dañado u otro"];
const aqTh=m=>{const s=aqSet(m);return s.th>0?s.th:2;};

/* ---- piezas por caja desde la descripción; IT = piezas sueltas (rastrillos y cepillos) ---- */
const IT_RE=/RASTRILL|CEPILLO|RAZOR|BRUSH|AFEITAR|PRESTOBARBA|MACH ?3|FUSION|VENUS|GILLETTE/;
const aqIsIT=d=>{d=String(d||"").toUpperCase();return IT_RE.test(d)&&!/\d\s*(ML|GR?|KG|L|LT)\b/.test(d);};
const aqUmNorm=v=>{v=String(v||"").trim().toUpperCase();if(!v)return "";return /^(IT|EA|PC|PCS|PZ|PZA|UN|ITEM|PIEZA)/.test(v)?"IT":"CS";};
function aqPz(desc){const s=String(desc||"").toUpperCase().replace(/,/g,".");
 const R=[/(\d{1,3})\s*IT\b/,/(\d{1,3})\s*(?:PZAS?|PZ|PIEZAS?|PCS?|UNIDADES|UNIDAD|UNID|UDS?|UNDS?|UN|PK|PACK|PAQ|CT)\b/,
  /\b(\d{1,3})\s*[X*]\s*\d+(?:\.\d+)?\s*(?:ML|LT|L|GRS|GR|G|KG|MG|OZ|CM|MM)\b/,
  /\b(\d{1,3})\s*\/\s*\d+(?:\.\d+)?\s*(?:ML|LT|L|GRS|GR|G|KG|OZ)\b/,
  /\bC\s*\/\s*(\d{1,3})\b/,/\bCAJA\s*(?:DE|CON|C\/)?\s*(\d{1,3})\b/,/\bCON\s+(\d{1,3})\b/,/\b(\d{1,3})\s*\/\s*(?:CS|CJ|CAJA)\b/,
  /[X*]\s*(\d{1,3})\s*$/,/\bX\s*(\d{1,3})\b(?!\s*(?:ML|L|G|GR|KG))/];
 for(const r of R){const m=s.match(r);if(m){const n=+m[1];if(n>0&&n<1000)return n;}}return 0;}
const aqSplit=l=>{const n=nlot(l).replace(/[^A-Z0-9]/g,"");return /^\d{4}[A-Z0-9]{2,6}$/.test(n)&&n.length>=8&&n.length<=12?{a:n.slice(0,4),p:n.slice(4,n.length-2),z:n.slice(-2)}:null;};

function aqCalc(m){
 const P=LP[m],S=aqSet(m),codes=new Map(),lp=new Map(),plants=new Map();
 P.X.rows.forEach(r=>{const g=vG(r[1]);if(!codes.has(g))codes.set(g,{g:r[1],desc:r[2],um0:aqUmNorm(r[8])});
  const sp=aqSplit(r[3]);if(sp)plants.set(sp.p,(plants.get(sp.p)||0)+1);});
 codes.forEach((c,g)=>{const o=S.ov[g]||{},mm=aqMas()[g]||{};c.um=o.um||mm.um||c.um0||(aqIsIT(c.desc)?"IT":"CS");
  c.umSrc=o.um?"manual":mm.um?"validado":c.um0?"archivo":c.um==="IT"?"descripción":"";
  if(c.um==="IT"){c.pz=1;c.pzSrc="";}else{const x=o.pzs>0?o.pzs:mm.pz>0?mm.pz:aqPz(c.desc);c.pz=x||0;c.pzSrc=o.pzs>0?"manual":mm.pz>0?"validado":x?"descripción":"falta";}});
 const kn=[...codes.values()].filter(c=>c.pz>0&&c.um!=="IT").map(c=>c.pz).sort((a,b)=>a-b),est=kn.length?kn[Math.floor(kn.length/2)]:1;
 codes.forEach(c=>{if(!c.pz){c.pz=est;c.est=true;c.pzSrc="estimado";}});
 let N=0,cajas=0;
 P.X.rows.forEach(r=>{const c=codes.get(vG(r[1])),q=r[5]||0;let e=lp.get(r[0]);if(!e)lp.set(r[0],e={lpn:r[0],pcs:0,qty:0,codes:new Set(),miss:0,rens:new Map()});{const rk=vG(r[1])+"|"+nlot(r[3]);e.rens.set(rk,(e.rens.get(rk)||0)+q);}
  if(!c.pz)e.miss++;const pc=q;e.pcs+=pc;e.qty+=q;e.codes.add(vG(c.g));N+=pc;cajas+=q;});
 return {codes,lp,plants,N,cajas,miss:[...codes.values()].filter(c=>c.est)};}

/* sorteo: LPN al azar hasta cubrir la muestra, cada LPN se inspecciona al 100% */
function aqDraw(m){
 const P=LP[m],C=aqCalc(m),S=aqSet(m),tot=S.mode==="tot",z=tot?{n:C.N,L:""}:aqSize(C.N);
 const all=[...C.lp.values()].filter(e=>e.qty>0);let sel=[];
 const sh=x=>{x=x.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=x[i];x[i]=x[j];x[j]=t;}return x;};
 if(tot)sel=all.map(e=>({lpn:e.lpn,pcs:e.qty,qty:e.qty,nc:e.rens.size,e}));
 else{
  /* muestra en cajas: se sortean LPN y, dentro de cada una, solo los renglones necesarios para completar la muestra */
  const k=Math.min(all.length,8),cap=Math.max(1,Math.ceil(z.n/k)),by=new Map();let s0=0;
  const take=(e,lim)=>{let d=by.get(e.lpn);if(!d){d={lpn:e.lpn,keys:[],qty:0,e};by.set(e.lpn,d);}
   for(const [rk,q] of sh([...e.rens.entries()])){if(s0>=z.n||d.qty>=lim)break;if(d.keys.indexOf(rk)>=0)continue;d.keys.push(rk);d.qty+=q;s0+=q;}};
  const order=sh(all);
  for(const e of order){if(s0>=z.n)break;take(e,cap);}
  for(const e of order){if(s0>=z.n)break;take(e,Infinity);}
  sel=[...by.values()].filter(d=>d.keys.length).map(d=>({lpn:d.lpn,pcs:d.qty,qty:d.qty,nc:d.keys.length,rk:d.keys,e:d.e}));}
 const cv=new Set();sel.forEach(d=>d.e.codes.forEach(c=>cv.add(c)));
 return {id:uid(),th:aqTh(m),mode:S.mode,at:Date.now(),file:P.X.name+"|"+P.X.at,N:C.N,n:z.n,L:z.L,pcs:sel.reduce((x,y)=>x+y.qty,0),cov:cv.size,ncod:C.codes.size,
  sel:sel.map(d=>{const o={lpn:d.lpn,pcs:d.qty,qty:d.qty,nc:d.nc,tl:d.e.rens.size};if(d.rk)o.rk=d.rk;return o;})};}

/* ---- fecha del lote: 1er dígito = año, 3 siguientes = día juliano ---- */
const aqYr=()=>new Date().getFullYear()%10;
const aqJul=()=>{const d=new Date();return Math.floor((d-new Date(d.getFullYear(),0,0))/864e5);};
function aqLotChk(a){if(!/^\d{4}$/.test(a))return "";const y=+a[0],j=+a.slice(1);
 if(y>aqYr())return _t(315,"El primer dígito (")+y+_t(316,") no puede ser mayor al del año actual (")+aqYr()+_t(317,"): ese lote no pudo fabricarse todavía.");
 if(j<1||j>366)return _t(318,"El día juliano (")+a.slice(1)+_t(319,") debe estar entre 001 y 366.");
 if(y===aqYr()&&j>aqJul())return _t(320,"El día juliano ")+a.slice(1)+_t(321," todavía no llega este año.");
 return "";}

/* ---- tarjeta en la pantalla de Recibo / Surtido ---- */
function aqSess(m,lpn,plan){return LP[m].S.find(s=>s.lpn===lpn&&s.aq&&s.aq.plan===plan.id);}
function aqProg(m,plan){let d=0,p=0;plan.sel.forEach(e=>{const s=aqSess(m,e.lpn,plan);if(s&&s.status!=="proceso")d++;else if(s)p++;});return {d,p,n:plan.sel.length};}
function aqCard(m){const plan=aqPlan(m),pr=plan&&aqProg(m,plan);
 return `${_t(322,`<div class="card"><h2 class="sh"><i>★</i>Inspección por LPN</h2><p class="mu" style="margin:6px 0 8px;font-size:14px">`)}${plan?esc(aqMode(plan.mode))+" · "+pr.n+_t(323," LPN sorteadas · ")+pr.d+_t(1008," terminadas"):_t(324,"Elige Total o AQL General II. La app suma las cajas de las LPN (tarimas), calcula la muestra en cajas y sortea las LPN.")}</p><button type="button" class="btn pri" style="width:100%" data-aq="open" data-m="${m}">${plan?_t(325,"Continuar inspección"):_t(326,"Preparar inspección")}</button>${aqSessAll(m).length?`<button type="button" class="btn" style="width:100%;margin-top:8px" data-aq="an" data-m="${m}${_t(327,`">Análisis de diferencias</button>`)}`:""}</div>`;}

/* ---- vistas ---- */
const aqUnit=it=>it.um==="IT"?_t(996,"pzas"):_t(328,"cajas");
function aqStats(m){const C=aqCalc(m),S=aqSet(m),z=S.mode==="tot"?{n:C.N,L:""}:aqSize(C.N);
 return `<p style="margin:6px 0 2px;font-size:14px"><b>${C.lp.size}${_t(329,`</b> LPN y <b>`)}${C.N}${_t(330,`</b> cajas en el archivo. Las cantidades se mantienen ocultas hasta el final de cada LPN.</p>
 <p style="margin:2px 0 0;font-size:14px">`)}${S.mode==="tot"?_t(331,"Se inspecciona el <b>100%</b> de las LPN del archivo."):_t(332,"AQL General II · letra <b>")+z.L+_t(333,"</b> · muestra de <b>")+z.n+_t(334,"</b> cajas.")}</p>
 ${C.miss.length?`<div class="vbanner" style="margin-top:8px">${C.miss.length}${_t(335,` código(s) sin dato de piezas por caja: se estiman y la app te las pregunta al capturar cada uno.</div>`)}`:""}`;}
function aqSetupView(m){const S=aqSet(m),C=aqCalc(m),tot=S.mode==="tot";
 const rows=[...C.codes.values()].sort((a,b)=>(a.pz?1:0)-(b.pz?1:0)||String(a.g).localeCompare(String(b.g)));
 return `${_t(336,`<div class="card"><h2 class="sh"><i>1</i>Tipo de inspección</h2><div class="row3"><button type="button" class="btn `)}${tot?"pri":""}" data-aq="mode" data-v="tot" data-m="${m}">Total (100%)</button><button type="button" class="btn ${tot?"":"pri"}" data-aq="mode" data-v="aql" data-m="${m}">AQL General II</button></div>
 ${tot?"":`${_t(337,`<label class="lb">Pasar a 100% si se encuentran (renglones con diferencia)</label><input data-aqin="th" data-m="`)}${m}" inputmode="numeric" maxlength="2" value="${aqTh(m)}" style="width:80px">`}<p class="mu" style="margin:8px 0 0;font-size:13px">${tot?_t(338,"Se inspeccionan todos los renglones de todas las LPN del archivo."):_t(339,"1) La app suma las cajas de todas las LPN del archivo (cada LPN es una tarima; si una LPN se repite, esos renglones están en la misma tarima). 2) Con ese total, la tabla AQL General II da la muestra en cajas. 3) Se sortean LPN y, dentro de cada una, solo los renglones necesarios para completar la muestra. Si todo el producto está en una sola LPN, solo revisas los renglones sorteados; si tú o tu coordinador prefieren revisar todo, elige Total (100%) o usa Pasar a 100% más adelante.")}${_t(340,`</p></div>
 <div class="card"><h2 class="sh"><i>2</i>Cajas a inspeccionar</h2><div id="aqst">`)}${aqStats(m)}${_t(341,`</div>
 <details style="margin-top:10px"><summary style="cursor:pointer;font-weight:600">Revisar piezas por caja (`)}${rows.length}${_t(342,` códigos)</summary>
 <p class="mu" style="margin:6px 0;font-size:12px">La app lee las piezas de la descripción. Si el archivo trae IT (rastrillos y cepillos), la cantidad ya viene en piezas. Corrige lo que haga falta.</p>
 `)}${rows.map(c=>{const g=vG(c.g);return `<div class="vx"><div class="t"><b>${esc(c.g)}</b><span class="tg">${c.um==="IT"?_t(343,"IT · piezas"):_t(344,"CS · cajas")}</span></div><p style="margin:4px 0 0;font-size:13px">${esc(c.desc||"")}</p>
 <div style="display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap"><select data-aqc="um" data-g="${esc(g)}" data-m="${m}" style="width:auto"><option value="CS" ${c.um==="CS"?"selected":""}${_t(345,`>CS (cajas)</option><option value="IT" `)}${c.um==="IT"?"selected":""}${_t(346,`>IT (piezas)</option></select>
 `)}${c.um==="IT"?`${_t(347,`<span class="mu" style="font-size:12px">1 pieza por unidad`)}${c.umSrc?" · "+c.umSrc:""}</span>`:`<input data-aqc="pz" data-g="${esc(g)}" data-m="${m}${_t(348,`" inputmode="numeric" maxlength="4" placeholder="pzs/caja" value="`)}${c.pz||""}" style="width:96px"${c.pz?"":' class="bad"'}><span class="mu" style="font-size:12px">${c.pzSrc==="falta"?_t(350,"escribe las piezas por caja"):_t(351,"pzs por caja · ")+_ts(c.pzSrc)}</span>`}</div></div>`;}).join("")}</details>
 <div class="row3" style="margin-top:10px"><button type="button" class="btn full" data-aq="valall" data-m="${m}${_t(352,`">Guardar piezas por caja como validadas</button><button type="button" class="btn pri full" data-aq="draw" data-m="`)}${m}${_t(353,`">Sortear LPN</button><button type="button" class="btn full" data-aq="close" data-m="`)}${m}${_t(354,`">Volver</button></div></div>`)}`;}
function aqPlanView(m,plan){const P=LP[m],pr=aqProg(m,plan),started=pr.d+pr.p>0;
 return `<div class="card"><h2 class="sh"><i>★</i>${esc(aqMode(plan.mode))}${plan.esc?_t(355," (ampliada)"):""}</h2>
 <p style="margin:6px 0 2px;font-size:14px">${plan.mode==="aql"?_t(356,"Letra <b>")+plan.L+_t(357,"</b> · muestra <b>")+plan.n+_t(358,"</b> cajas"):_t(359,"Inspección total (100%)")}${_t(360,`</p>
 <p style="margin:2px 0 0;font-size:14px">LPN a inspeccionar: <b>`)}${pr.n}${_t(361,`</b> · renglones a revisar: <b>`)}${plan.sel.reduce((x,y)=>x+(y.nc||0),0)}${_t(362,`</b></p>
 <p class="mu" style="margin:4px 0 0;font-size:13px">Cubre `)}${plan.cov||"?"}${_t(363,` de `)}${plan.ncod||"?"}${_t(364,` códigos del archivo.</p><p class="mu" style="margin:4px 0 0;font-size:13px">`)}${pr.d}${_t(365,` terminadas · `)}${pr.p}${_t(366,` en proceso · `)}${pr.n-pr.d-pr.p}${_t(367,` sin iniciar</p></div>
 <div class="card"><h2 class="sh"><i>≡</i>LPN a inspeccionar<em>`)}${pr.n}</em></h2>
 ${plan.sel.map(e=>{const s=aqSess(m,e.lpn,plan),st=!s?_t(368,'<span class="tg">Sin iniciar</span>'):s.status==="proceso"?_t(369,'<span class="tg">En proceso</span>'):rcvChip(s.status);
  return `<div class="vx"><div class="t"><b>${esc(lpFmt(e.lpn))}</b>${st}</div><p style="margin:4px 0 0;font-size:12px;color:var(--mu)">${e.rk?e.nc+_t(363," de ")+(e.tl||e.nc)+_t(370," renglón(es) a revisar"):(e.tl||e.nc)+_t(371," renglón(es) · inspección completa")}${_t(372,` · cantidades ocultas</p>
  <div class="row3" style="margin-top:8px">`)}${!s?`<button type="button" class="btn pri" data-aq="start" data-lpn="${e.lpn}" data-m="${m}${_t(373,`">Iniciar</button>`)}`:`<button type="button" class="btn ${s.status==="proceso"?"pri":""}" data-lr="open" data-id="${s.id}" data-m="${m}">${s.status==="proceso"?_t(374,"Continuar"):_t(375,"Ver")}</button>`}</div></div>`;}).join("")}
 <div class="row3" style="margin-top:10px">${pr.d?`<button type="button" class="btn" data-aq="an" data-m="${m}${_t(376,`">Análisis</button><button type="button" class="btn" data-aq="pdf" data-m="`)}${m}${_t(377,`">Reporte PDF</button>`)}`:""}${started?"":`<button type="button" class="btn" data-aq="redraw" data-m="${m}${_t(378,`">Volver a sortear</button>`)}`}${plan.mode==="aql"?`<button type="button" class="btn" data-aq="to100" data-m="${m}${_t(379,`">Pasar a 100%</button>`)}`:""}<button type="button" class="btn" data-aq="close" data-m="${m}${_t(380,`">Volver</button><button type="button" class="btn dg" data-aq="end" data-m="`)}${m}${_t(381,`">Cerrar inspección</button></div></div>`)}`;}
function aqPickView(m,plan){const A=AQ[m],e=plan.sel.find(x=>x.lpn===A.pick)||{pcs:0,qty:0};
 return `${_t(382,`<div class="card"><h2 class="sh"><i>1</i>Confirma la LPN</h2><p class="mu" style="margin:6px 0 4px;font-size:14px">Busca la tarima con esta LPN y confírmala con foto o escribiéndola. `)}${e.rk?_t(383,"Solo se revisan ")+e.nc+_t(363," de ")+(e.tl||e.nc)+_t(384," renglón(es) de esta tarima, los que salieron sorteados."):_t(385,"Se revisan todos los renglones de esta tarima.")}</p>
 <p style="margin:6px 0;font-size:20px;font-weight:800;letter-spacing:.02em;color:var(--ac)">${esc(lpFmt(A.pick))}${_t(386,`</p>
 <label class="lb">LPN</label><div class="fld"><input data-aqin="lpn" data-m="`)}${m}" inputmode="numeric" maxlength="40" placeholder="(00) 1003 7000 3106 0950 58" value="${esc(A.txt||"")}">${sb("L:"+m+":aqlpn")}</div>
 <div class="row3"><button type="button" class="btn pri" data-aq="lpnok" data-m="${m}${_t(387,`">Confirmar LPN</button><button type="button" class="btn" data-aq="plan" data-m="`)}${m}${_t(388,`">Cancelar</button></div></div>`)}`;}
function aqView(m){const plan=aqPlan(m),A=AQ[m];
 if(A.an)return aqAnView(m);
 if(!plan)return aqSetupView(m);
 if(A.pick)return aqPickView(m,plan);
 return aqPlanView(m,plan);}

/* ---- una LPN: lista de renglones y captura ---- */
const aqMask=it=>{const sp=aqSplit(it.l);return sp?`<b>····</b> ${esc(sp.p)} <b>··</b>`:_t(389,"formato especial: escríbelo completo");};
const aqPending=c=>c.items.filter(i=>i.st==="pend"&&!i.tried).length;
function aqNext(c,from){const N=c.items.length;for(let k=1;k<=N;k++){const j=(from+k+N)%N;if(c.items[j].st==="pend"&&!c.items[j].tried)return j;}return -1;}
function aqRowForm(m,c,k){const it=c.items[k],d=it.d||(it.d={}),sp=aqSplit(it.l),C=aqCalc(m),fixed=!!sp,M=`data-m="${m}" data-k="${k}"`;
 return `${_t(390,`<div style="margin-top:10px;border-top:1px solid var(--bd);padding-top:8px">
 <label class="lb">Código del producto</label><input data-aqin="g" `)}${M} inputmode="numeric" maxlength="8" placeholder="80XXXXXX" value="${esc(d.g||"")}${_t(391,`">
 <label class="lb">Lote</label>
 `)}${sp?`${_t(392,`<div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap"><div><div class="mu" style="font-size:11px">Año + día (4)</div><input data-aqin="a" `)}${M} inputmode="numeric" maxlength="4" placeholder="6123" value="${esc(d.a||"")}${_t(393,`" style="width:92px"></div>
 <div><div class="mu" style="font-size:11px">Planta (fija)</div>`)}${fixed?`<div style="font-weight:800;font-size:18px;padding:8px 4px">${esc(sp.p)}</div>${d.pp&&d.pp!==sp.p?`${_t(394,`<div style="font-size:11px;color:var(--er)">Foto: `)}${esc(d.pp)}</div>`:""}`:`<input data-aqin="p" ${M} inputmode="numeric" maxlength="4" placeholder="####" value="${esc(d.p||"")}" style="width:82px">`}${_t(395,`</div>
 <div><div class="mu" style="font-size:11px">Últimos 2</div><input data-aqin="z" `)}${M} autocapitalize="characters" maxlength="2" placeholder="00" value="${esc(d.z||"")}" style="width:62px"></div></div>
 <div id="aqh${k}" class="mu" style="font-size:12px;min-height:16px;margin-top:4px;color:var(--er)">${esc(aqLotChk(d.a||""))}</div>`
 :`<input data-aqin="l" ${M}${_t(396,` autocapitalize="characters" placeholder="Lote completo" value="`)}${esc(d.l||"")}">`}${_t(397,`
 <label class="lb">Cantidad contada (`)}${aqUnit(it)})</label><div style="display:flex;gap:8px"><input data-aqin="q" ${M} inputmode="numeric" maxlength="6" placeholder="0" value="${esc(d.q||"")}"></div>
 ${it.est?`${_t(398,`<label class="lb">Piezas por caja de este código (se guarda)</label><input data-aqin="pzc" `)}${M}${_t(399,` inputmode="numeric" maxlength="4" placeholder="pzs/caja" value="`)}${esc(d.pzc||"")}">`:""}${_t(400,`
 <div style="display:flex;align-items:center;gap:8px;margin-top:8px"><span style="font-weight:600">Foto (lee código y lote)</span>`)}${sb("L:"+m+":aqph"+k)}</div>
 ${(it.ph||[]).length?`<img src="${it.ph[0]}" alt="" style="display:block;width:100%;max-height:300px;object-fit:contain;margin-top:8px;border-radius:10px;border:1px solid var(--bd)">`:""}${_t(401,`
 <div class="row3" style="margin-top:10px"><button type="button" class="btn pri full" data-aq="val" `)}${M}${_t(402,`>Validar renglón</button><button type="button" class="btn" data-aq="skip" `)}${M}${_t(403,`>Cerrar</button></div></div>`)}`;}
function aqLpnView(m){const P=LP[m],c=P.CUR,A=AQ[m],N=c.items.length,ok=c.items.filter(i=>i.st==="ok").length;
 if(c.status!=="proceso"){const good=c.status==="ok";
  return `<div class="vbanner ${good?"ok":"no"}">${good?_t(404,"✓ LPN correcta: todo coincide con el Excel."):_t(405,"LPN con diferencias. Revisa el detalle.")}</div>
  <div class="card"><h2 class="sh"><i>▤</i>LPN ${esc(lpFmt(c.lpn))}</h2><p class="mu" style="margin:4px 0 0;font-size:14px">${ok}${_t(363,` de `)}${N}${_t(406,` renglones OK · Inspeccionó: <b>`)}${esc(c.sign?c.sign.name:"")}</b></p>
  ${c.items.filter(i=>i.st!=="ok").map(i=>`<div class="vx"><div class="t"><b>${esc(i.g)}${_t(168,` · lote `)}${esc(i.l)}</b>${rcvChip(i.st)}</div><p style="margin:4px 0 0;font-size:13px">${esc(i.desc||"")}</p><p style="margin:4px 0 0;font-size:12px;color:var(--er)">${esc(i.note)}</p></div>`).join("")}
  <div class="row3" style="margin-top:10px"><button type="button" class="btn pri full" data-aq="plan" data-m="${m}${_t(407,`">Volver a la inspección</button><button type="button" class="btn" data-lr="pdf1" data-id="`)}${c.id}" data-m="${m}${_t(408,`">Reporte PDF</button><button type="button" class="btn" data-lr="xl1" data-m="`)}${m}">Excel</button></div></div>`;}
 const tried=c.items.filter(i=>i.st==="pend"&&i.tried).length,left=aqPending(c);
 return `<div class="card"><div class="t" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="font-size:17px">LPN ${esc(lpFmt(c.lpn))}</b><span class="tg" style="background:var(--okb);color:var(--ok)">${esc(aqMode(c.aq.mode))}</span></div>
  <p class="mu" style="margin:6px 0 0;font-size:13px">${ok}${_t(363,` de `)}${N}${_t(409,` renglones OK`)}${tried?" · "+tried+_t(410," pendiente(s) por revisar"):""}${left?" · "+left+_t(411," sin capturar"):""}${_t(412,`. Avance guardado automáticamente.</p>
  <div class="row3" style="margin-top:8px"><button type="button" class="btn" data-aq="plan" data-m="`)}${m}${_t(413,`">‹ Guardar y volver</button><button type="button" class="btn" data-aq="toend" data-m="`)}${m}${_t(414,`">Ir a firmar ›</button></div></div>
 <div class="card"><h2 class="sh"><i>≡</i>Productos de la LPN</h2><p class="mu" style="margin:6px 0 4px;font-size:13px">Toca un renglón, lee el código, escribe los dígitos del lote que faltan (la planta ya está) y la cantidad. Lo que no coincida queda pendiente hasta que termines la LPN.`)}${(()=>{const pl=aqPlan(m),en=pl&&pl.sel.find(x=>x.lpn===c.lpn);return en&&en.rk?_t(415," Aquí solo aparecen los ")+en.nc+_t(416," renglón(es) sorteados para tu muestra; el resto de la tarima no se revisa."):"";})()}</p>
 ${c.items.map((it,k)=>{const chip=it.st==="ok"?rcvChip("ok"):it.tried?_t(417,'<span class="tg" style="background:var(--erb);color:var(--er)">Pendiente</span>'):_t(418,'<span class="tg">Por capturar</span>'),open=A.ed===k;
  return `<div class="vx" id="aqr${k}"${open?' style="border-color:var(--ac)"':""}><div class="t"><b>${esc(it.g)}</b>${chip}</div><p style="margin:4px 0 0;font-size:13px">${esc(it.desc||"")}${_t(419,`</p>
  <p style="margin:2px 0 0;font-size:12px;color:var(--mu)">Lote `)}${aqMask(it)}${_t(420,` · cuenta en `)}${aqUnit(it)}</p>
  ${it.tried&&it.why?`<p style="margin:2px 0 0;font-size:12px;color:var(--er)">${esc(it.why)}${_t(421,`</p>
  <label class="lb">Motivo de la diferencia (obligatorio)</label><select data-aqin="rs" data-m="`)}${m}" data-k="${k}${_t(422,`"><option value="">Elegir…</option>`)}${AQ_RS.map(x=>`<option value="${x}"${it.rs===x?" selected":""}>${_ts(x)}</option>`).join("")}${_t(423,`</select>
  <div style="display:flex;align-items:center;gap:8px;margin-top:8px"><span style="font-weight:600">Foto (obligatoria)</span>`)}${sb("L:"+m+":aqev"+k)}</div>${(it.ph||[]).length?`<img src="${it.ph[0]}" alt="" style="display:block;width:100%;max-height:300px;object-fit:contain;margin-top:8px;border-radius:10px;border:1px solid var(--bd)">`:""}`:""}
  ${open?aqRowForm(m,c,k):`<div class="row3" style="margin-top:6px"><button type="button" class="btn ${it.st==="ok"?"":"pri"}" style="padding:6px 12px" data-aq="edit" data-m="${m}" data-k="${k}">${it.st==="ok"?_t(424,"Volver a capturar"):it.tried?_t(425,"Reintentar"):_t(426,"Capturar")}</button></div>`}</div>`;}).join("")}${_t(427,`</div>
 <div class="card" id="aqend"><h2 class="sh"><i>✍</i>Firma</h2><p class="mu" style="margin:6px 0 4px;font-size:13px">`)}${left?_t(428,"Faltan ")+left+_t(429," renglón(es) por capturar."):tried?tried+_t(430," renglón(es) con diferencia: cada uno necesita motivo y foto. Puedes reintentarlos antes de firmar."):_t(431,"Todo capturado.")}${_t(432,`</p>
 <label class="lb">Nombre de quien inspeccionó</label><input data-aqin="name" data-m="`)}${m}${_t(433,`" autocapitalize="words" placeholder="Ej: Manuel Chagala" value="`)}${esc(c.signDraft||"")}">
 <div class="row3" style="margin-top:10px"><button type="button" class="btn dk full" data-aq="fin" data-m="${m}${_t(434,`">Firmar y terminar LPN</button></div></div>`)}`;}

/* ---- análisis: Pareto y tasa semanal ---- */
function aqSessAll(m){return LP[m].S.filter(s=>s.aq&&s.status!=="proceso"&&s.sign);}
const aqTurno=t=>{const h=new Date(t).getHours();return h>=6&&h<14?_t(435,"1.º turno (6-14)"):h>=14&&h<22?_t(436,"2.º turno (14-22)"):_t(437,"3.er turno (22-6)");};
const aqWk=t=>{const d=new Date(t);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d;};
function aqBars(tt,map,lim){const a=[...map.entries()].sort((x,y)=>y[1]-x[1]).slice(0,lim||8),tot=[...map.values()].reduce((x,y)=>x+y,0),mx=a.length?a[0][1]:1;let c=0;
 return `<div class="card"><h2 class="sh"><i>▮</i>${tt}</h2>${a.length?a.map(e=>{c+=e[1];return `<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${esc(e[0])}</span><b>${e[1]} · ${Math.round(c/tot*100)}%</b></div><div style="background:var(--bd);border-radius:6px;height:8px"><div style="background:var(--ac);width:${Math.round(e[1]/mx*100)}%;height:8px;border-radius:6px"></div></div></div>`;}).join(""):_t(438,'<p class="mu" style="margin:6px 0 0;font-size:13px">Sin diferencias registradas.</p>')}</div>`;}
function aqAnView(m){const S=aqSessAll(m),by={rs:new Map(),g:new Map(),op:new Map(),tu:new Map()},wk=new Map();let T=0,D=0;
 S.forEach(s=>{const w=aqWk(s.done||s.at).getTime(),e=wk.get(w)||{l:0,r:0,d:0};e.l++;
  s.items.forEach(i=>{T++;e.r++;if(i.st!=="ok"){D++;e.d++;const k=(i.rs||"Sin motivo");by.rs.set(k,(by.rs.get(k)||0)+1);by.g.set(i.g,(by.g.get(i.g)||0)+1);const o=s.sign.name;by.op.set(o,(by.op.get(o)||0)+1);const tu=aqTurno(s.done||s.at);by.tu.set(tu,(by.tu.get(tu)||0)+1);}});wk.set(w,e);});
 const ws=[...wk.entries()].sort((a,b)=>b[0]-a[0]).slice(0,8),fd=t=>new Date(t).toLocaleDateString(_t(163,"es-MX"),{day:"2-digit",month:"2-digit"});
 return `${_t(440,`<div class="card"><h2 class="sh"><i>★</i>Análisis de diferencias</h2><p class="mu" style="margin:6px 0 0;font-size:14px">`)}${S.length}${_t(441,` LPN inspeccionadas · `)}${T}${_t(442,` renglones · <b>`)}${D}${_t(443,`</b> con diferencia`)}${T?" ("+Math.round(D/T*1000)/10+"%)":""}.</p></div>
 ${aqBars(_t(444,"Por tipo de error"),new Map([...by.rs].map(e=>[_ts(e[0]),e[1]])))}${aqBars(_t(445,"Por código"),by.g,6)}${aqBars(_t(446,"Por turno"),by.tu)}${aqBars(_t(447,"Por inspector"),by.op)}${_t(448,`
 <div class="card"><h2 class="sh"><i>▤</i>Tasa por semana (antes y después)</h2><p class="mu" style="margin:6px 0 4px;font-size:12px">La semana más antigua es tu línea base. Compara si la tasa baja con el tiempo.</p>
 <table style="width:100%;font-size:13px;border-collapse:collapse"><tr style="text-align:left"><th>Semana</th><th>LPN</th><th>Renglones</th><th>Con dif.</th><th>Tasa</th></tr>`)}${ws.map(([t,e])=>`<tr><td>${fd(t)}</td><td>${e.l}</td><td>${e.r}</td><td>${e.d}</td><td><b>${e.r?Math.round(e.d/e.r*1000)/10:0}%</b></td></tr>`).join("")||_t(449,'<tr><td colspan="5">Sin datos</td></tr>')}${_t(450,`</table>
 <p class="mu" style="margin:8px 0 0;font-size:12px">Por proveedor no se puede: el Excel no trae esa columna.</p>
 <div class="row3" style="margin-top:10px"><button type="button" class="btn pri full" data-aq="anx" data-m="`)}${m}${_t(354,`">Volver</button></div></div>`)}`;}

/* ---- acciones ---- */
const aqRk=i=>vG(i.g)+"|"+nlot(i.l);
function aqMkItems(m,lpn,keys){const C=aqCalc(m);return lpItems(m,lpn).filter(i=>!keys||keys.indexOf(aqRk(i))>=0).map(i=>{const c=C.codes.get(vG(i.g))||{};i.um=c.um||"CS";i.pz=c.pz||0;i.est=!!c.est;i.d={};i.tried=0;i.why="";return i;});}
function aqOpenLpn(m,lpn,th){const P=LP[m],plan=aqPlan(m),A=AQ[m];if(!plan)return;
 let s=aqSess(m,lpn,plan);
 if(!s){const ent=plan.sel.find(x=>x.lpn===lpn)||{};s={id:uid(),lpn,at:Date.now(),status:"proceso",items:aqMkItems(m,lpn,ent.rk),extras:[],lpnPh:th||"",det:null,aq:{plan:plan.id,mode:plan.mode},sign:null};P.S.push(s);}
 P.CUR=s;A.pick="";A.txt="";A.ed=aqNext(s,-1);P.UI.msg=null;lpSave(m);render();window.scrollTo(0,0);}
function aqConfirmLpn(m,lpn,th){const A=AQ[m],plan=aqPlan(m);if(!plan)return;
 if(lpn===A.pick){aqOpenLpn(m,lpn,th);return;}
 if(plan.sel.some(e=>e.lpn===lpn)){dlg({title:_t(451,"Es otra LPN de la selección"),body:_t(452,"Confirmaste ")+lpFmt(lpn)+_t(453,", que también está sorteada. ¿Inspeccionar esa?"),buttons:[{t:_t(454,"Volver")},{t:_t(455,"Sí, esa"),cls:"pri",fn:()=>{A.pick=lpn;aqOpenLpn(m,lpn,th);}}]});return;}
 dlg({title:_t(456,"LPN fuera de la selección"),body:_t(457,"La LPN ")+lpFmt(lpn)+_t(458," existe en el Excel pero no fue sorteada. Busca la tarima ")+lpFmt(A.pick)+".",buttons:[{t:_t(27,"Entendido"),cls:"pri"}]});}
async function aqLpnPhoto(m,pv){
 const th=await rcvThumb(pv.url);let txt="";busy(_t(459,"Leyendo código de barras…"));const bcv=await bcScan(pv.blob);busy("");
 if(bcv){const r0=lpFind(m,bcv);if(r0.exact){aqConfirmLpn(m,r0.exact,th);return;}txt=bcv;}
 try{txt+="\n"+await ocrRaw(pv.blob,{digits:true,stop:t=>!!lpFind(m,t).exact}).catch(e=>{if(e&&e.message==="cancel")throw e;if(!txt)throw e;return "";});}
 catch(e){const x=e&&e.message;if(x==="cancel")return;toast(x==="timeout"?_t(460,"La lectura tardó demasiado. Acerca la cámara o escribe la LPN."):_t(461,"No se pudo leer la foto. Inténtalo otra vez o escribe la LPN."));return;}
 const r=lpFind(m,txt);
 if(r.exact){aqConfirmLpn(m,r.exact,th);return;}
 if(r.near){dlg({title:_t(462,"Revisa la LPN"),body:_t(463,"Leí ")+lpFmt(r.raw)+_t(464,", que no está en el Excel. ¿Es ")+lpFmt(r.near)+"?",buttons:[{t:_t(465,"Volver a tomar foto"),fn:()=>{TARGET="L:"+m+":aqlpn";$("#cam").click();}},{t:_t(466,"Sí, usar esa"),cls:"pri",fn:()=>aqConfirmLpn(m,r.near,th)}]});return;}
 dlg({title:_t(467,"LPN no encontrada"),body:_t(468,"No pude leer la LPN en la foto. Acerca la cámara a los números, evita reflejos o escríbela a mano."),buttons:[{t:_t(469,"Escribir a mano")},{t:_t(465,"Volver a tomar foto"),cls:"pri",fn:()=>{TARGET="L:"+m+":aqlpn";$("#cam").click();}}]});}
async function aqThumb(url,max){try{const im=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=url;});const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.72);}catch(e){return "";}}
async function aqItemPhoto(m,pv,kind){
 const P=LP[m],ev=/^aqev/.test(kind),k=+String(kind).slice(4),it=P.CUR&&P.CUR.items[k];if(!it)return;
 const th=await aqThumb(pv.url,720);if(th)it.ph=[th];
 if(!ev){let txt="";
  try{txt=await ocrRaw(pv.blob,{max:1800,max2:2400,stop:t=>{const r=rcvRead(t,P.CUR.items);return !!(r.code&&r.lote);}});}
  catch(e){const x=e&&e.message;lpSave(m);render();if(x!=="cancel")toast(x==="timeout"?_t(470,"La lectura tardó demasiado. Acerca la cámara o escribe los datos."):_t(471,"No se pudo leer la foto. Escribe los datos."));return;}
  const r=rcvRead(txt,P.CUR.items),d=it.d||(it.d={});let got=[];
  if(r.code){d.g=r.code;got.push(_t(472,"código"));}
  if(r.lote){const sp=aqSplit(r.lote);if(sp){d.a=sp.a;d.z=sp.z;d.pp=sp.p;}else d.l=r.lote;got.push(_t(473,"lote"));}
  lpSave(m);render();toast(got.length?_t(463,"Leí ")+got.join(" y ")+_t(474," de la foto. Revisa y escribe la cantidad."):_t(475,"No pude leer la foto. Escribe los datos a mano."));return;}
 lpSave(m);render();}
async function aqItemPhotoOld(m,pv,kind){const P=LP[m],k=+String(kind).slice(4);if(!P.CUR||!P.CUR.items[k])return;const th=await rcvThumb(pv.url);if(th){P.CUR.items[k].ph=[th];lpSave(m);render();}}
function aqValidate(m,k){
 const P=LP[m],c=P.CUR,it=c.items[k],d=it.d||(it.d={}),sp=aqSplit(it.l),C=aqCalc(m);
 if(!/^\d{6,8}$/.test(String(d.g||"").trim())){toast(_t(476,"Escribe el código del producto."));return;}
 let lot="";
 if(sp){const pl=d.pp||sp.p;
  if(!/^\d{4}$/.test(d.a||"")||!/^[A-Z0-9]{2}$/.test(d.z||"")){toast(_t(477,"Completa el lote: año y día (4 dígitos) y los 2 finales."));return;}
  lot=d.a+pl+d.z;}
 else{lot=nlot(d.l||"");if(!lot){toast(_t(478,"Escribe el lote."));return;}}
 if(!/^\d+$/.test(String(d.q||""))){toast(_t(479,"Escribe la cantidad contada."));return;}
 if(it.est){const pz=+d.pzc;if(!(pz>0)){toast(_t(480,"Escribe las piezas por caja de este código."));return;}aqMasSet(vG(it.g),{pz});it.pz=pz;it.est=false;}
 const q=+d.q,why=[],full=[];
 if(vG(d.g)!==vG(it.g)){why.push(_t(481,"Código distinto al Excel (leído ")+String(d.g).trim()+")");full.push(why[why.length-1]);}
 if(sp){const ch=aqLotChk(d.a);if(ch){why.push(ch);full.push(ch);}}
 if(nlot(lot)!==nlot(it.l)){why.push(_t(482,"Lote distinto al Excel (leído ")+lot+")");full.push(why[why.length-1]);}
 if(Math.abs(q-it.exp)>=.0005){why.push(_t(483,"Cantidad contada (")+q+" "+aqUnit(it)+_t(484,") no coincide con el sistema"));full.push(_t(485,"Cantidad: Excel ")+f2(it.exp)+", contado "+q+" "+aqUnit(it));}
 it.cnt=q;it.lotIn=lot;it.via="manual";
 if(!why.length){it.st="ok";it.tried=0;it.why="";it.note="";it.rs="";it.full="";}
 else{it.st="pend";it.tried=1;it.why=why.join(" · ");it.full=full.join(" · ");}
 const A=AQ[m],nx=aqNext(c,k);A.ed=nx;lpSave(m);render();
 toast(why.length?_t(487,"Queda pendiente: ")+why[0]:_t(488,"Coincide con el Excel."));
 const e=document.getElementById(nx>=0?"aqr"+nx:"aqend");if(e)window.scrollTo({top:Math.max(0,e.getBoundingClientRect().top+scrollY-80),behavior:"smooth"});}
function aqDiffs(m,plan){let n=0;LP[m].S.forEach(s=>{if(s.aq&&s.aq.plan===plan.id&&s.status!=="proceso")n+=s.items.filter(i=>i.st!=="ok").length;});return n;}
function aqEscalate(m){const plan=aqPlan(m);if(!plan)return;const C=aqCalc(m);
 const all=[...C.lp.values()].filter(e=>e.qty>0);let reab=0;
 LP[m].S.forEach(s=>{if(!(s.aq&&s.aq.plan===plan.id))return;const have=new Set(s.items.map(aqRk)),add=aqMkItems(m,s.lpn,null).filter(i=>!have.has(aqRk(i)));
  if(add.length){add.forEach(i=>s.items.push(i));if(s.status!=="proceso"){s.status="proceso";s.sign=null;reab++;}}});
 plan.mode="tot";plan.esc=true;plan.sel=all.map(e=>({lpn:e.lpn,pcs:e.qty,qty:e.qty,nc:e.rens.size,tl:e.rens.size}));plan.pcs=C.N;plan.n=C.N;plan.L="";aqPlanSave(m,plan);lpSave(m);render();window.scrollTo(0,0);toast(_t(489,"Inspección ampliada al 100%: ")+all.length+" LPN."+(reab?_t(490," Se reabrieron ")+reab+_t(491," LPN con renglones faltantes."):""));}
function aqCheckEsc(m){const plan=aqPlan(m);if(!plan||plan.mode!=="aql")return;const n=aqDiffs(m,plan),th=plan.th||2,last=plan.escAsk||0;
 if(n>=th&&n>=last+th){plan.escAsk=n;aqPlanSave(m,plan);
  dlg({title:_t(492,"Muchas diferencias en la muestra"),body:"Van "+n+_t(493," renglones con diferencia (límite ")+th+_t(494,"). Lo recomendado es pasar a inspección total (100%) de todas las LPN del archivo."),buttons:[{t:_t(495,"Seguir con AQL")},{t:_t(496,"Pasar a 100%"),cls:"dg",fn:()=>aqEscalate(m)}]});}}
function aqFinish(m){const P=LP[m],c=P.CUR,left=aqPending(c),nm=String(c.signDraft||"").trim().replace(/\s+/g," ");
 if(left){toast(_t(428,"Faltan ")+left+_t(429," renglón(es) por capturar."));return;}
 if(nm.split(" ").filter(x=>x.length>1).length<2){toast(_t(497,"Escribe tu nombre y apellido para firmar."));const e=document.querySelector('[data-aqin="name"]');if(e)e.focus();return;}
 const bad=c.items.filter(i=>i.st!=="ok"),nf=bad.filter(i=>!i.rs||!(i.ph||[]).length).length;
 if(nf){toast(_t(498,"Cada diferencia necesita motivo y foto (")+nf+(nf>1?_t(998," faltan"):_t(997," falta"))+").");return;}
 const go=()=>{c.items.forEach(i=>{if(i.st!=="ok"){i.st="dif";i.note=(i.full||i.why||_t(500,"Sin coincidencia"))+_t(501," · Motivo: ")+i.rs;}});c.sign={name:nm,at:Date.now()};c.status=c.items.some(i=>i.st!=="ok")?"dif":"ok";c.done=Date.now();lpSave(m);gstInc(m);render();window.scrollTo(0,0);setTimeout(()=>aqCheckEsc(m),300);};
 if(bad.length)dlg({title:_t(502,"Firmar con pendientes"),body:bad.length+_t(503," renglón(es) quedarán como diferencia. ¿Firmar y terminar la LPN?"),buttons:[{t:_t(504,"Revisar")},{t:_t(505,"Firmar así"),cls:"dg",fn:go}]});else go();}
function aqPlanBack(m){const P=LP[m];if(P.CUR){lpSave(m);P.CUR=null;lpSave(m);}AQ[m].open=true;AQ[m].pick="";AQ[m].ed=-1;render();window.scrollTo(0,0);}

document.addEventListener("click",e=>{const b=e.target.closest("[data-aq]");if(!b)return;const a=b.dataset.aq,m=b.dataset.m,P=LP[m],A=AQ[m];if(!P||!A)return;
 if(a==="open"){A.open=true;A.pick="";render();window.scrollTo(0,0);}
 else if(a==="close"){A.open=false;A.pick="";render();window.scrollTo(0,0);}
 else if(a==="mode"){const S=aqSet(m);S.mode=b.dataset.v;aqSetSave(m,S);render();}
 else if(a==="draw"||a==="redraw"){const C=aqCalc(m);  if(!C.N){toast(_t(506,"No hay cajas que inspeccionar en el archivo."));return;}
  const go=()=>{aqPlanSave(m,aqDraw(m));A.pick="";render();window.scrollTo(0,0);};
  if(a==="redraw")dlg({title:_t(507,"Volver a sortear"),body:_t(508,"Se descarta la selección actual y se sortean otras LPN."),buttons:[{t:_t(12,"Cancelar")},{t:_t(509,"Sortear otra vez"),cls:"pri",fn:go}]});else go();}
 else if(a==="to100")dlg({title:_t(510,"Pasar a inspección total (100%)"),body:_t(511,"Se revisarán todos los renglones de todas las LPN del archivo. Las LPN ya firmadas con renglones sin revisar se reabren. Normalmente lo decide el inspector o su coordinador, por ejemplo cuando todo el producto está en una sola LPN."),buttons:[{t:_t(12,"Cancelar")},{t:_t(496,"Pasar a 100%"),cls:"dg",fn:()=>aqEscalate(m)}]});
 else if(a==="valall"){const C=aqCalc(m);let n=0;C.codes.forEach((c,g)=>{if(c.pz>0){aqMasSet(g,{um:c.um,pz:c.pz});n++;}});render();toast(n+_t(512," código(s) guardados como validados."));}
 else if(a==="an"){A.an=true;A.open=true;render();window.scrollTo(0,0);}
 else if(a==="anx"){A.an=false;render();window.scrollTo(0,0);}
 else if(a==="start"){A.pick=b.dataset.lpn;A.txt="";render();window.scrollTo(0,0);}
 else if(a==="lpnok"){const v=(A.txt||"").replace(/\D/g,"");if(v.length<15){toast(_t(513,"Escribe los dígitos de la LPN (20, o 18 sin el 00 inicial)."));return;}
  const k=lpResolve(m,v);if(!k){dlg({title:_t(467,"LPN no encontrada"),body:_t(457,"La LPN ")+lpFmt(v)+_t(514," no está en el Excel. Revisa los dígitos."),buttons:[{t:_t(27,"Entendido"),cls:"pri"}]});return;}aqConfirmLpn(m,k,"");}
 else if(a==="plan")aqPlanBack(m);
 else if(a==="edit"){A.ed=+b.dataset.k;const it=P.CUR.items[A.ed];if(it&&it.st==="ok"){it.st="pend";it.tried=0;}render();const e2=document.getElementById("aqr"+A.ed);if(e2)window.scrollTo({top:Math.max(0,e2.getBoundingClientRect().top+scrollY-70),behavior:"smooth"});}
 else if(a==="skip"){A.ed=-1;render();}
 else if(a==="same"){const it=P.CUR.items[+b.dataset.k];if(!it)return;(it.d||(it.d={})).q=String(f2(it.exp));const i=document.querySelector('[data-aqin="q"]');if(i)i.value=it.d.q;lpSave(m);}
 else if(a==="val")aqValidate(m,+b.dataset.k);
 else if(a==="fin")aqFinish(m);
 else if(a==="toend"){const e2=document.getElementById("aqend");if(e2)window.scrollTo({top:Math.max(0,e2.getBoundingClientRect().top+scrollY-120),behavior:"smooth"});}
 else if(a==="pdf"){const plan=aqPlan(m);if(plan)lpPdf(m,P.S.filter(s=>s.aq&&s.aq.plan===plan.id&&s.status!=="proceso"));}
 else if(a==="end")dlg({title:_t(515,"Cerrar inspección"),body:_t(516,"Se cierra el sorteo. Las LPN ya inspeccionadas quedan en el historial y el reporte."),buttons:[{t:_t(12,"Cancelar")},{t:_t(515,"Cerrar inspección"),cls:"dg",fn:()=>{U.set("aqp:"+m,null);A.open=false;A.pick="";render();toast(_t(517,"Inspección cerrada."));}}]});});
document.addEventListener("input",e=>{const t=e.target,d=t.dataset;if(!d)return;
 if(d.aqin&&d.m&&LP[d.m]){const m=d.m,P=LP[m],A=AQ[m],f=d.aqin;
  if(f==="lpn"){const v=t.value.replace(/\D/g,"");if(v!==t.value)t.value=v;A.txt=v;return;}
  if(f==="th"){const v=t.value.replace(/\D/g,"");if(v!==t.value)t.value=v;const S=aqSet(m);S.th=+v||0;aqSetSave(m,S);return;}
  if(f==="name"){if(P.CUR){P.CUR.signDraft=t.value;clearTimeout(A.tm);A.tm=setTimeout(()=>lpSave(m),400);}return;}
  const it=P.CUR&&P.CUR.items[+d.k];if(!it)return;if(f==="rs"){it.rs=t.value;clearTimeout(A.tm);A.tm=setTimeout(()=>lpSave(m),300);return;}const dd=it.d||(it.d={});let v=t.value;
  if(f==="z"||f==="p"){v=v.toUpperCase().replace(/[^A-Z0-9]/g,"");if(v!==t.value)t.value=v;}else if(f!=="l"){v=v.replace(/\D/g,"");if(v!==t.value)t.value=v;}else v=v.toUpperCase();
  dd[f]=v;
  if(f==="a"){const h=document.getElementById("aqh"+d.k);if(h)h.textContent=aqLotChk(v);}
  const mx=t.maxLength;if(mx>0&&v.length>=mx&&f!=="l"&&f!=="q"&&f!=="name"){const all=[...document.querySelectorAll('[data-aqin][data-k="'+d.k+'"]')],i=all.indexOf(t);if(i>=0&&all[i+1])all[i+1].focus();}
  clearTimeout(A.tm);A.tm=setTimeout(()=>lpSave(m),400);return;}
 if(d.aqc&&d.m&&LP[d.m]){const m=d.m,S=aqSet(m),g=d.g;S.ov[g]=S.ov[g]||{};
  if(d.aqc==="pz"){const v=t.value.replace(/\D/g,"");if(v!==t.value)t.value=v;S.ov[g].pzs=+v||0;aqSetSave(m,S);if(+v>0)aqMasSet(g,{pz:+v});const st=document.getElementById("aqst");if(st)st.innerHTML=aqStats(m);}}});
document.addEventListener("change",e=>{const t=e.target,d=t.dataset;if(d&&d.aqc==="um"&&d.m&&LP[d.m]){const m=d.m,S=aqSet(m);S.ov[d.g]=S.ov[d.g]||{};S.ov[d.g].um=t.value;aqSetSave(m,S);aqMasSet(d.g,{um:t.value});render();}});

/* integración con las vistas y la lectura de fotos existentes */
{const _lv=lpView;lpView=function(m){const P=LP[m],A=AQ[m];
  if(P.X&&!P.MAP&&P.CUR&&P.CUR.aq)return aqLpnView(m);
  if(P.X&&!P.MAP&&!P.CUR&&A.open)return aqView(m);
  const h=_lv(m);return (P.X&&!P.MAP&&!P.CUR)?aqCard(m)+h:h;};}
{const _lp=lpPhoto;lpPhoto=function(m,pv,kind){if(kind==="aqlpn")return aqLpnPhoto(m,pv);if(/^aq(ph|ev)\d+$/.test(kind))return aqItemPhoto(m,pv,kind);return _lp.apply(this,arguments);};}
{const _ex=lpExit;lpExit=function(m){const P=LP[m];if(P&&P.CUR&&P.CUR.aq){aqPlanBack(m);return;}return _ex.apply(this,arguments);};}
