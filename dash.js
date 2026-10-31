/* ===== Dashboards: sube un archivo y pide la información que quieres ver (constructor guiado o consulta tipo SQL) ===== */
let DSH=[];
const DS={file:"",wb:null,sheets:[],sheet:"",cols:[],rows:[],w:[],gf:[],v:"dash",edit:null,sql:"",sqlRes:null,sqlErr:"",name:"",id:"",pend:false,miss:[]};
const DPAL=["#204f5f","#7c3f2a","#3f8f9e","#c98a5b","#5c8f6f","#8a5a8f","#d1a43f","#4f7fb0","#a04a4a","#6b7b8c"];
const DOPS=[["count","Contar registros"],["sum","Sumar"],["avg","Promedio"],["min","Mínimo"],["max","Máximo"],["distinct","Valores distintos"]];
const DTYPES=[["kpi","Tarjeta"],["bar","Barras"],["hbar","Barras horizontales"],["line","Línea"],["pie","Pastel"],["table","Tabla"]];
const DCMP=[["=","es igual a"],["≠","es distinto de"],["contiene","contiene"],["no contiene","no contiene"],[">","mayor que"],["≥","mayor o igual que"],["<","menor que"],["≤","menor o igual que"]];
function dshLoad(){DSH=U.get("dsh",[]);if(!Array.isArray(DSH))DSH=[];}
function dshSave(){U.set("dsh",DSH);}
function dshMerge(a){let n=0;(Array.isArray(a)?a:Object.values(a||{})).forEach(r=>{if(!r||!r.id)return;const i=DSH.findIndex(x=>x.id===r.id);if(i<0){DSH.push(r);n++;}else if((r.upd||0)>(DSH[i].upd||0)){DSH[i]=r;n++;}});if(n)dshSave();return n;}

/* ---- lectura del archivo ---- */
const dsNum=v=>typeof v==="number"?v:(v instanceof Date?0:vN(v));
const dsEmpty=v=>v===""||v==null;
function dsType(data,c){let n=0,nu=0,dt=0;for(let i=0;i<data.length&&n<300;i++){const v=data[i][c];if(dsEmpty(v))continue;n++;if(v instanceof Date)dt++;else if(typeof v==="number")nu++;else if(/^-?[\d.,\s]+-?$/.test(String(v))&&/\d/.test(String(v)))nu++;}
 if(!n)return "txt";if(dt/n>=.8)return "date";if(nu/n>=.9)return "num";return "txt";}
function dsParse(){
 const ws=DS.wb.Sheets[DS.sheet],rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:"",blankrows:false});
 const cnt=rows.slice(0,15).map(r=>r.filter(x=>!dsEmpty(x)).length),mx=Math.max(1,...cnt);let hr=cnt.findIndex(n=>n>=mx*.6);if(hr<0)hr=0;
 const hdr=rows[hr]||[],names=[],seen={};let width=0;hdr.forEach((h,i)=>{if(String(h).trim()!=="")width=i+1;});
 for(let i=0;i<width;i++){let n=String(hdr[i]==null?"":hdr[i]).trim()||("Columna "+(i+1));if(seen[n]){seen[n]++;n+=" ("+seen[n]+")";}else seen[n]=1;names.push(n);}
 const data=[];for(let i=hr+1;i<rows.length;i++){const r=rows[i];if(!r.some(x=>!dsEmpty(x)))continue;data.push(names.map((_,c)=>r[c]===undefined?"":r[c]));}
 DS.rows=data;DS.cols=names.map((n,c)=>({n,t:dsType(data,c)}));DS.sqlRes=null;DS.sqlErr="";DS.gf=DS.gf.filter(f=>dsCi(f.col)>=0);}
async function dsPick(e){const f=e.target.files[0];e.target.value="";if(!f)return;
 if(typeof XLSX==="undefined"){toast("No se pudo cargar el lector de Excel. Revisa tu conexión.");return;}
 busy("Leyendo "+f.name+"…");
 try{await new Promise(r=>setTimeout(r,30));const csv=/\.csv$/i.test(f.name);
  const wb=XLSX.read(csv?await f.text():await f.arrayBuffer(),{type:csv?"string":"array",cellDates:true});
  DS.wb=wb;DS.file=f.name;DS.sheets=wb.SheetNames;DS.sheet=wb.SheetNames[0];DS.gf=[];dsParse();
  if(!DS.rows.length){busy("");toast("El archivo no tiene datos.");DS.wb=null;DS.file="";render();return;}
  dsCheck();if(!DS.w.length&&!DS.pend)DS.v="build";else DS.v="dash";
  busy("");toast(DS.rows.length.toLocaleString("es-MX")+" filas · "+DS.cols.length+" columnas.");
 }catch(err){busy("");toast("No se pudo abrir el archivo. Verifica que sea Excel (.xlsx, .xls) o CSV.");}
 render();}
const dsCi=n=>DS.cols.findIndex(c=>c.n===n);
function dsCheck(){DS.miss=[];DS.w.forEach(w=>{const cs=[w.by].concat((w.measures||[]).map(m=>m.col)).concat((w.filters||[]).map(f=>f.col)).filter(Boolean);if(cs.some(c=>dsCi(c)<0))DS.miss.push(w.id);});}

/* ---- motor de consultas del constructor ---- */
function dsDate(v){if(!(v instanceof Date))return null;return new Date(Math.round(v.getTime()/60000)*60000);}
function dsKey(v,col,gran){if(dsEmpty(v))return "(vacío)";if(col&&col.t==="date"){const d=dsDate(v);if(d){const y=d.getFullYear(),m=pad(d.getMonth()+1);return gran==="year"?""+y:gran==="day"?y+"-"+m+"-"+pad(d.getDate()):y+"-"+m;}}
 return v instanceof Date?v.toLocaleDateString("es-MX"):String(v).trim();}
function dsCond(f){const c=dsCi(f.col);if(c<0||f.val===""||f.val==null)return null;const col=DS.cols[c],val=String(f.val).trim(),vn=vN(val),num=col.t==="num"&&/^-?[\d.,\s]+$/.test(val),low=val.toLowerCase();
 const gv=r=>{const x=r[c];return x instanceof Date?dsKey(x,col,"day"):x;};
 switch(f.op){case "=":return r=>num?dsNum(gv(r))===vn:String(gv(r)).trim().toLowerCase()===low;
  case "≠":return r=>num?dsNum(gv(r))!==vn:String(gv(r)).trim().toLowerCase()!==low;
  case "contiene":return r=>String(gv(r)).toLowerCase().includes(low);
  case "no contiene":return r=>!String(gv(r)).toLowerCase().includes(low);
  case ">":return r=>dsNum(gv(r))>vn;case "≥":return r=>dsNum(gv(r))>=vn;case "<":return r=>dsNum(gv(r))<vn;case "≤":return r=>dsNum(gv(r))<=vn;}
 return null;}
function dsApply(w){let rows=DS.rows;
 DS.gf.filter(f=>f.vals.length).forEach(f=>{const c=dsCi(f.col);if(c<0)return;const set=new Set(f.vals);rows=rows.filter(r=>set.has(dsKey(r[c],DS.cols[c])));});
 (w&&w.filters||[]).forEach(f=>{const p=dsCond(f);if(p)rows=rows.filter(p);});return rows;}
const dsMLabel=m=>m.op==="count"?"Registros":({sum:"Suma",avg:"Promedio",min:"Mínimo",max:"Máximo",distinct:"Distintos"}[m.op])+" de "+(m.col||"");
function dsRun(w){
 if(w.sql){const r=dsSql(w.sql);return r;}
 const rows=dsApply(w),ms=w.measures&&w.measures.length?w.measures:[{op:"count",col:""}],by=w.by?dsCi(w.by):-1,groups=new Map();
 rows.forEach(r=>{const k=by>=0?dsKey(r[by],DS.cols[by],w.gran):"Total";let g=groups.get(k);if(!g){g={k,n:0,m:ms.map(()=>({s:0,n:0,mn:Infinity,mx:-Infinity,set:new Set()}))};groups.set(k,g);}g.n++;
  ms.forEach((m,i)=>{if(m.op==="count")return;const c=dsCi(m.col);if(c<0)return;const v=r[c];if(dsEmpty(v))return;const a=g.m[i];if(m.op==="distinct"){a.set.add(String(v));return;}const x=dsNum(v);a.s+=x;a.n++;if(x<a.mn)a.mn=x;if(x>a.mx)a.mx=x;});});
 let out=[...groups.values()].map(g=>[g.k].concat(ms.map((m,i)=>{const a=g.m[i],v=m.op==="count"?g.n:m.op==="sum"?a.s:m.op==="avg"?(a.n?a.s/a.n:0):m.op==="min"?(a.n?a.mn:0):m.op==="max"?(a.n?a.mx:0):a.set.size;return Math.round(v*100)/100;})));
 const isDate=by>=0&&DS.cols[by].t==="date";
 if(isDate||w.sort==="key")out.sort((a,b)=>String(a[0]).localeCompare(String(b[0]),"es",{numeric:true}));else out.sort((a,b)=>w.sort==="asc"?a[1]-b[1]:b[1]-a[1]);
 const lim=+w.limit||0;if(lim&&by>=0&&out.length>lim)out=isDate?out.slice(-lim):out.slice(0,lim);
 return {head:[by>=0?w.by:""].concat(ms.map(dsMLabel)),rows:out,n:rows.length};}

/* ---- consultas tipo SQL / Google Query ---- */
function dsTok(q){const t=[],re=/\s*(?:("(?:[^"]|"")*"|`[^`]*`)|('(?:[^']|'')*')|(\d+(?:\.\d+)?)|([A-Za-zÁÉÍÓÚÜÑáéíóúüñ_][\wÁÉÍÓÚÜÑáéíóúüñ.]*)|(<=|>=|<>|!=|=|<|>|\(|\)|,|\*|\+|-|\/))/y;let m;re.lastIndex=0;q=String(q).trim();
 while(re.lastIndex<q.length){const pos=re.lastIndex;m=re.exec(q);if(!m||re.lastIndex===pos)throw new Error("No entendí cerca de: "+q.slice(pos,pos+14));
  if(m[1])t.push({t:"id",v:m[1].slice(1,-1).replace(/""/g,'"')});else if(m[2])t.push({t:"str",v:m[2].slice(1,-1).replace(/''/g,"'")});else if(m[3])t.push({t:"num",v:+m[3]});else if(m[4])t.push({t:"w",v:m[4],u:m[4].toUpperCase()});else t.push({t:"op",v:m[5],u:m[5]});}
 return t;}
function dsResolve(name){const n=nz(name);let i=DS.cols.findIndex(c=>nz(c.n)===n);if(i>=0)return i;
 if(/^[A-Za-z]{1,2}$/.test(name)){const u=name.toUpperCase();let k=0;for(const ch of u)k=k*26+ch.charCodeAt(0)-64;if(k-1<DS.cols.length)return k-1;}
 const m=/^col(\d+)$/i.exec(name);if(m&&+m[1]-1<DS.cols.length)return +m[1]-1;throw new Error("No encontré la columna «"+name+"».");}
function dsSql(q){
 const T=dsTok(q.replace(/;+\s*$/,"")),KW=new Set(["SELECT","FROM","WHERE","GROUP","BY","ORDER","LIMIT","OFFSET","LABEL","FORMAT","AS","AND","OR","NOT","IS","NULL","LIKE","IN","BETWEEN","ASC","DESC","CONTAINS","STARTS","ENDS","WITH"]);let p=0;
 const pk=()=>T[p],isW=u=>T[p]&&T[p].t==="w"&&T[p].u===u,eat=u=>{if(isW(u)){p++;return true;}return false;},opIs=v=>T[p]&&T[p].t==="op"&&T[p].v===v;
 const AGG=new Set(["COUNT","SUM","AVG","MIN","MAX"]);
 function operand(){const t=T[p];if(!t)throw new Error("La consulta está incompleta.");
  if(t.t==="num"){p++;return {k:"lit",v:t.v};}if(t.t==="str"){p++;return {k:"lit",v:t.v};}
  if(t.t==="op"&&t.v==="-"){p++;const n=T[p++];return {k:"lit",v:-(n&&n.v)};}
  if(t.t==="id"){p++;return {k:"col",c:dsResolve(t.v)};}
  if(t.t==="w"&&!KW.has(t.u)){if(AGG.has(t.u)&&T[p+1]&&T[p+1].v==="("){p+=2;let a;if(opIs("*")){p++;a={k:"agg",f:t.u,c:-1};}else{const x=T[p++];if(!x||(x.t!=="id"&&x.t!=="w"))throw new Error("Falta la columna en "+t.u+"().");a={k:"agg",f:t.u,c:dsResolve(x.v)};}if(!opIs(")"))throw new Error("Falta cerrar el paréntesis.");p++;return a;}
   p++;return {k:"col",c:dsResolve(t.v)};}
  throw new Error("No entendí «"+t.v+"».");}
 function cmpv(a,b,op){const na=typeof a==="number",nb=typeof b==="number";let x=a,y=b;if(na||nb){x=dsNum(a);y=dsNum(b);}else{x=String(a==null?"":a).toLowerCase();y=String(b==null?"":b).toLowerCase();}
  return op==="="?x===y:op==="!="||op==="<>"?x!==y:op===">"?x>y:op==="<"?x<y:op===">="?x>=y:x<=y;}
 const val=(o,r)=>o.k==="lit"?o.v:(r[o.c] instanceof Date?dsKey(r[o.c],DS.cols[o.c],"day"):r[o.c]);
 function prim(){if(opIs("(")){p++;const c=orC();if(!opIs(")"))throw new Error("Falta cerrar el paréntesis.");p++;return c;}
  const a=operand();
  if(eat("IS")){const n=eat("NOT");if(!eat("NULL"))throw new Error("Después de IS va NULL.");return r=>dsEmpty(val(a,r))!==n;}
  let neg=false;if(isW("NOT")){neg=true;p++;}
  if(eat("LIKE")){const s=String(T[p++].v).toLowerCase().replace(/[.+^${}()|[\]\\]/g,"\\$&").replace(/%/g,".*").replace(/_/g,"."),re=new RegExp("^"+s+"$");return r=>re.test(String(val(a,r)).toLowerCase())!==neg;}
  if(eat("IN")){if(!opIs("("))throw new Error("Falta ( después de IN.");p++;const L=[];while(!opIs(")")){const x=T[p++];if(!x)throw new Error("Falta cerrar el paréntesis.");if(x.v!==",")L.push(x.v);}p++;return r=>L.some(x=>cmpv(val(a,r),x,"="))!==neg;}
  if(eat("BETWEEN")){const lo=operand();if(!eat("AND"))throw new Error("BETWEEN necesita AND.");const hi=operand();return r=>(cmpv(val(a,r),val(lo,r),">=")&&cmpv(val(a,r),val(hi,r),"<="))!==neg;}
  if(eat("CONTAINS")){const b=operand();return r=>String(val(a,r)).toLowerCase().includes(String(val(b,r)).toLowerCase())!==neg;}
  if(eat("STARTS")){eat("WITH");const b=operand();return r=>String(val(a,r)).toLowerCase().startsWith(String(val(b,r)).toLowerCase())!==neg;}
  if(eat("ENDS")){eat("WITH");const b=operand();return r=>String(val(a,r)).toLowerCase().endsWith(String(val(b,r)).toLowerCase())!==neg;}
  const o=T[p];if(!o||o.t!=="op"||!["=","!=","<>","<",">","<=",">="].includes(o.v))throw new Error("Falta el operador de comparación (=, <, >, contains…).");p++;const b=operand();return r=>cmpv(val(a,r),val(b,r),o.v);}
 function notC(){if(eat("NOT")){const c=notC();return r=>!c(r);}return prim();}
 function andC(){let c=notC();while(isW("AND")){p++;const d=notC(),a=c;c=r=>a(r)&&d(r);}return c;}
 function orC(){let c=andC();while(isW("OR")){p++;const d=andC(),a=c;c=r=>a(r)||d(r);}return c;}
 if(!eat("SELECT"))throw new Error("La consulta debe empezar con select.");
 const sel=[];
 if(opIs("*")){p++;DS.cols.forEach((c,i)=>sel.push({o:{k:"col",c:i},al:c.n}));}
 else do{const o=operand();let al=o.k==="agg"?o.f.toLowerCase()+"("+(o.c<0?"*":DS.cols[o.c].n)+")":DS.cols[o.c].n;if(eat("AS")){const x=T[p++];al=x.v;}sel.push({o,al});}while(opIs(",")&&(p++,true));
 if(eat("FROM")){p++;}
 let cond=null,grp=[],ord=[],lim=0,off=0;
 while(p<T.length){
  if(eat("WHERE"))cond=orC();
  else if(isW("GROUP")){p++;if(!eat("BY"))throw new Error("Falta BY después de GROUP.");do{const x=operand();grp.push(x.c);}while(opIs(",")&&(p++,true));}
  else if(isW("ORDER")){p++;if(!eat("BY"))throw new Error("Falta BY después de ORDER.");do{const o=operand();let d=1;if(eat("DESC"))d=-1;else eat("ASC");ord.push({o,d});}while(opIs(",")&&(p++,true));}
  else if(eat("LIMIT")){lim=+T[p++].v||0;}
  else if(eat("OFFSET")){off=+T[p++].v||0;}
  else if(isW("LABEL")||isW("FORMAT")){p=T.length;}
  else throw new Error("No entendí «"+T[p].v+"».");}
 let rows=DS.rows;DS.gf.filter(f=>f.vals.length).forEach(f=>{const c=dsCi(f.col);if(c<0)return;const set=new Set(f.vals);rows=rows.filter(r=>set.has(dsKey(r[c],DS.cols[c])));});
 if(cond)rows=rows.filter(cond);
 const hasAgg=sel.some(s=>s.o.k==="agg");let out;
 const aggv=(o,rs)=>{if(o.f==="COUNT")return o.c<0?rs.length:rs.filter(r=>!dsEmpty(r[o.c])).length;const xs=rs.map(r=>r[o.c]).filter(x=>!dsEmpty(x)).map(dsNum);if(!xs.length)return 0;
  return Math.round((o.f==="SUM"?xs.reduce((a,b)=>a+b,0):o.f==="AVG"?xs.reduce((a,b)=>a+b,0)/xs.length:o.f==="MIN"?Math.min(...xs):Math.max(...xs))*100)/100;};
 const cell=(v)=>v instanceof Date?dsKey(v,{t:"date"},"day"):v;
 if(hasAgg||grp.length){
  sel.forEach(s=>{if(s.o.k==="col"&&!grp.includes(s.o.c))throw new Error("«"+s.al+"» debe ir en group by o dentro de una función (sum, count…).");});
  const m=new Map();rows.forEach(r=>{const k=grp.map(c=>dsKey(r[c],DS.cols[c],"day")).join("\u0001");let g=m.get(k);if(!g)m.set(k,g={rs:[]});g.rs.push(r);});
  if(!grp.length&&!m.size)m.set("",{rs:[]});
  out=[...m.values()].map(g=>({vals:sel.map(s=>s.o.k==="agg"?aggv(s.o,g.rs):cell(g.rs[0][s.o.c])),rs:g.rs}));
  if(ord.length)out.sort((a,b)=>{for(const x of ord){const i=sel.findIndex(s=>s.o.k===x.o.k&&s.o.c===x.o.c&&s.o.f===x.o.f);const va=i>=0?a.vals[i]:(x.o.k==="agg"?aggv(x.o,a.rs):cell(a.rs[0][x.o.c])),vb=i>=0?b.vals[i]:(x.o.k==="agg"?aggv(x.o,b.rs):cell(b.rs[0][x.o.c]));const c=typeof va==="number"&&typeof vb==="number"?va-vb:String(va).localeCompare(String(vb),"es",{numeric:true});if(c)return c*x.d;}return 0;});
  out=out.map(x=>x.vals);
 }else{
  if(ord.length)rows=rows.slice().sort((a,b)=>{for(const x of ord){const va=val(x.o,a),vb=val(x.o,b),c=typeof va==="number"&&typeof vb==="number"?va-vb:String(va).localeCompare(String(vb),"es",{numeric:true});if(c)return c*x.d;}return 0;});
  out=rows.map(r=>sel.map(s=>cell(r[s.o.c])));}
 if(off)out=out.slice(off);if(lim)out=out.slice(0,lim);
 return {head:sel.map(s=>s.al),rows:out,n:rows.length};}

/* ---- gráficas (SVG propio, sin librerías) ---- */
const dsFmt=n=>{n=+n;if(!isFinite(n))return "0";const a=Math.abs(n);if(a>=1e6)return (Math.round(n/1e4)/100)+" M";if(a>=1e4)return (Math.round(n/10)/100)+" k";return String(Math.round(n*100)/100).replace(/\B(?=(\d{3})+(?!\d))/g,",");};
const dsFull=n=>{n=+n;return isFinite(n)?(Math.round(n*100)/100).toLocaleString("es-MX"):"0";};
const dsCut=(t,n)=>{t=String(t);return t.length>n?t.slice(0,n-1)+"…":t;};
const dsNice=mx=>{const p=Math.pow(10,Math.floor(Math.log10(mx))),f=mx/p;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p;};
const TH_DOM={tx:'style="fill:var(--tx)"',mu:'style="fill:var(--mu)"',ln:'style="stroke:var(--bd)"'},TH_PDF={tx:'fill="#1b2a30"',mu:'fill="#6c7a80"',ln:'stroke="#dcd7d0"'};
const svgW=(W,H,g)=>`<svg viewBox="0 0 ${W} ${H}" role="img" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,Helvetica,Arial,sans-serif" style="width:100%;height:auto;display:block">${g}</svg>`;
function chEmpty(T){return svgW(420,90,`<text x="210" y="50" text-anchor="middle" font-size="14" ${T.mu}>Sin datos con estos filtros</text>`);}
function chBar(res,T){const R=res.rows.slice(0,14),n=R.length;if(!n)return chEmpty(T);
 const W=600,H=310,L=48,Rr=10,Tp=22,Bt=84,pw=W-L-Rr,ph=H-Tp-Bt,top=dsNice(Math.max(...R.map(r=>r[1]),0)||1),bw=pw/n;let g="";
 for(let i=0;i<=4;i++){const y=Tp+ph-ph*i/4;g+=`<line x1="${L}" x2="${W-Rr}" y1="${y}" y2="${y}" ${T.ln}/><text x="${L-6}" y="${y+4}" text-anchor="end" font-size="11" ${T.mu}>${dsFmt(top*i/4)}</text>`;}
 R.forEach((r,i)=>{const h=ph*Math.max(r[1],0)/top,x=L+i*bw+bw*.15,w=bw*.7,y=Tp+ph-h;
  g+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${DPAL[0]}"/><text x="${x+w/2}" y="${y-5}" text-anchor="middle" font-size="11" font-weight="700" ${T.tx}>${dsFmt(r[1])}</text><text transform="translate(${x+w/2+4},${Tp+ph+14}) rotate(-35)" text-anchor="end" font-size="11" ${T.tx}>${esc(dsCut(r[0],16))}</text>`;});
 return svgW(W,H,g);}
function chHBar(res,T){const R=res.rows.slice(0,15),n=R.length;if(!n)return chEmpty(T);
 const W=420,rh=28,L=132,Rr=58,H=n*rh+8,mx=Math.max(...R.map(r=>r[1]),0)||1,pw=W-L-Rr;let g="";
 R.forEach((r,i)=>{const y=4+i*rh,w=Math.max(2,pw*Math.max(r[1],0)/mx);g+=`<text x="${L-6}" y="${y+rh/2+4}" text-anchor="end" font-size="11.5" ${T.tx}>${esc(dsCut(r[0],21))}</text><rect x="${L}" y="${y+4}" width="${w}" height="${rh-10}" rx="3" fill="${DPAL[0]}"/><text x="${L+w+5}" y="${y+rh/2+4}" font-size="11.5" font-weight="700" ${T.tx}>${dsFmt(r[1])}</text>`;});
 return svgW(W,H,g);}
function chLine(res,T){const R=res.rows,n=R.length;if(!n)return chEmpty(T);
 const W=600,H=290,L=48,Rr=16,Tp=20,Bt=62,pw=W-L-Rr,ph=H-Tp-Bt,top=dsNice(Math.max(...R.map(r=>r[1]),0)||1),xs=i=>n===1?L+pw/2:L+pw*i/(n-1),ys=v=>Tp+ph-ph*Math.max(v,0)/top;let g="";
 for(let i=0;i<=4;i++){const y=Tp+ph-ph*i/4;g+=`<line x1="${L}" x2="${W-Rr}" y1="${y}" y2="${y}" ${T.ln}/><text x="${L-6}" y="${y+4}" text-anchor="end" font-size="11" ${T.mu}>${dsFmt(top*i/4)}</text>`;}
 const pts=R.map((r,i)=>xs(i)+","+ys(r[1])).join(" ");
 g+=`<polygon points="${xs(0)},${Tp+ph} ${pts} ${xs(n-1)},${Tp+ph}" fill="${DPAL[0]}" opacity=".12"/><polyline points="${pts}" fill="none" stroke="${DPAL[0]}" stroke-width="2.5" stroke-linejoin="round"/>`;
 const st=Math.ceil(n/8);R.forEach((r,i)=>{g+=`<circle cx="${xs(i)}" cy="${ys(r[1])}" r="3.5" fill="${DPAL[0]}"/>`;if(n<=12)g+=`<text x="${xs(i)}" y="${ys(r[1])-8}" text-anchor="middle" font-size="10.5" font-weight="700" ${T.tx}>${dsFmt(r[1])}</text>`;
  if(i%st===0||i===n-1)g+=`<text transform="translate(${xs(i)+4},${Tp+ph+14}) rotate(-30)" text-anchor="end" font-size="11" ${T.tx}>${esc(dsCut(r[0],12))}</text>`;});
 return svgW(W,H,g);}
function chPie(res,T){let R=res.rows.filter(r=>r[1]>0);if(!R.length)return chEmpty(T);
 if(R.length>7){const rest=R.slice(7).reduce((a,r)=>a+r[1],0);R=R.slice(0,7).concat([["Otros",rest]]);}
 const tot=R.reduce((a,r)=>a+r[1],0),cx=105,cy=105,r0=90,ri=52,W=430,H=Math.max(215,R.length*24+24);let g="",a=-Math.PI/2;
 R.forEach((r,i)=>{const da=2*Math.PI*r[1]/tot,a1=a+da,c=DPAL[i%DPAL.length];
  if(R.length===1)g+=`<circle cx="${cx}" cy="${cy}" r="${(r0+ri)/2}" fill="none" stroke="${c}" stroke-width="${r0-ri}"/>`;
  else{const p=(rr,an)=>(cx+rr*Math.cos(an)).toFixed(2)+","+(cy+rr*Math.sin(an)).toFixed(2),big=da>Math.PI?1:0;g+=`<path d="M${p(r0,a)} A${r0},${r0} 0 ${big} 1 ${p(r0,a1)} L${p(ri,a1)} A${ri},${ri} 0 ${big} 0 ${p(ri,a)} Z" fill="${c}"/>`;}
  g+=`<rect x="222" y="${14+i*24}" width="12" height="12" rx="3" fill="${c}"/><text x="240" y="${24+i*24}" font-size="12" ${T.tx}>${esc(dsCut(r[0],15))} · ${Math.round(100*r[1]/tot)}%</text>`;a=a1;});
 g+=`<text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="16" font-weight="800" ${T.tx}>${dsFmt(tot)}</text>`;
 return svgW(W,H,g);}
const chartFor=(type,res,T)=>type==="bar"?chBar(res,T):type==="hbar"?chHBar(res,T):type==="line"?chLine(res,T):chPie(res,T);
function dsTable(res,lim){const R=res.rows.slice(0,lim||15);return `<div class="tw"><table class="vt"><tr>${res.head.map((h,i)=>`<th>${esc(h)}</th>`).join("")}</tr>${R.map(r=>`<tr>${r.map((v,i)=>`<td>${typeof v==="number"?dsFmt(v):esc(v)}</td>`).join("")}</tr>`).join("")}</table></div>${res.rows.length>R.length?`<p class="mu" style="margin:6px 0 0;font-size:12px">Se muestran ${R.length} de ${res.rows.length}. Descarga el Excel para verlo completo.</p>`:""}`;}
function dsBody(w,res,T){
 if(w.type==="kpi")return `<div class="kpi"><b>${res.rows.length?dsFull(res.rows[0][1]):"0"}</b><small>${esc(res.head[1]||"")}</small></div>`;
 if(w.type==="table"||w.sql)return dsTable(res);
 return chartFor(w.type,res,T);}
function dsTitle(w){if(w.title)return w.title;if(w.sql)return "Consulta";const m=(w.measures&&w.measures[0])||{op:"count"};return dsMLabel(m)+(w.by?" por "+w.by:"");}
function dsWidgetHtml(w){let res,err="";
 if(DS.miss.includes(w.id))return `<div class="card dw"><div class="dwh"><b>${esc(dsTitle(w))}</b><span><button type="button" class="ib" data-dw="del:${w.id}" aria-label="Quitar">✕</button></span></div><p class="mu" style="margin:6px 0 0;font-size:13px">Este archivo no tiene alguna columna que usa este bloque.</p></div>`;
 try{res=dsRun(w);}catch(e){err=e.message;}
 return `<div class="card dw"><div class="dwh"><b>${esc(dsTitle(w))}</b><span><button type="button" class="ib" data-dw="edit:${w.id}" aria-label="Editar">✎</button><button type="button" class="ib" data-dw="xl:${w.id}" aria-label="Excel">⤓</button><button type="button" class="ib" data-dw="del:${w.id}" aria-label="Quitar">✕</button></span></div>${err?`<p class="aerr">${esc(err)}</p>`:dsBody(w,res,TH_DOM)}</div>`;}

/* ---- vistas ---- */
const dsOpts=(arr,cur,ph)=>(ph?`<option value="">${ph}</option>`:"")+arr.map(x=>{const v=Array.isArray(x)?x[0]:x,l=Array.isArray(x)?x[1]:x;return `<option value="${esc(v)}" ${v===cur?"selected":""}>${esc(l)}</option>`;}).join("");
function dsColsBy(t){return DS.cols.filter(c=>!t||t.includes(c.t)).map(c=>c.n);}
function viewDash(){
 if(!DS.wb)return `<div class="card"><h2 class="sh"><i>1</i>Sube tu archivo</h2><p class="mu" style="margin:6px 0 12px;font-size:14px">Excel (.xlsx, .xls) o CSV con encabezados en una fila. Después eliges qué información quieres ver y se arma tu dashboard. Los datos se leen en tu teléfono y no se envían a ningún servidor.</p><label class="btn pri" for="fdash" style="display:block;text-align:center">Elegir archivo</label></div>
 ${DS.pend?`<div class="vbanner no" style="margin-bottom:12px">Estás abriendo «${esc(DS.name)}». Sube el archivo para ver los datos.</div>`:""}
 ${DSH.length?`<div class="card"><h2 class="sh"><i>★</i>Dashboards guardados<em>${DSH.length}</em></h2>${DSH.map(d=>`<div class="vx"><div class="t"><b>${esc(d.name)}</b><span class="tg">${d.w.length} bloques</span></div><div class="row3" style="margin-top:8px"><button type="button" class="btn" data-ds="open" data-id="${d.id}">Abrir</button><button type="button" class="btn" data-ds="rm" data-id="${d.id}">Eliminar</button></div></div>`).join("")}<p class="mu" style="margin:10px 0 0;font-size:12px">Se guarda el diseño, no los datos. Al abrirlo, sube el archivo y se llena solo.</p></div>`:""}
 <button type="button" class="btn txt" style="width:100%" data-help="dash">¿Cómo funciona Dashboards?</button>`;
 const seg=[["dash","Dashboard"],["build","Constructor"],["sql","SQL"],["data","Datos"]];
 let h=`<div class="card"><div class="t" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="word-break:break-all">${esc(DS.file)}</b></div><p class="mu" style="margin:4px 0 0;font-size:13px">${DS.rows.length.toLocaleString("es-MX")} filas · ${DS.cols.length} columnas</p>${DS.sheets.length>1?`<label class="lb">Hoja</label><select data-dsh="sheet">${dsOpts(DS.sheets,DS.sheet)}</select>`:""}<div class="row3"><label class="btn" for="fdash" style="text-align:center">Cambiar archivo</label><button type="button" class="btn" data-ds="close">Cerrar archivo</button></div></div>
 <div class="seg" style="grid-template-columns:repeat(4,1fr);margin-top:0">${seg.map(s=>`<button type="button" class="${DS.v===s[0]?"on":""}" data-ds="v:${s[0]}">${s[1]}</button>`).join("")}</div>`;
 if(DS.v==="build")return h+dsBuild();if(DS.v==="sql")return h+dsSqlView();if(DS.v==="data")return h+dsData();
 /* dashboard */
 const gfc=DS.cols.filter(c=>c.t!=="date");
 h+=`<div class="card"><h2 class="sh"><i>⛭</i>Filtros del dashboard</h2>${DS.gf.length?DS.gf.map((f,i)=>{const c=dsCi(f.col),vs=c<0?[]:dsDistinct(c);return `<div class="gfx"><div class="t" style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px">${esc(f.col)}</b><button type="button" class="ib" data-ds="gfdel:${i}" aria-label="Quitar filtro">✕</button></div><div class="vc">${vs.slice(0,40).map(v=>`<button type="button" class="${f.vals.includes(v)?"on":""}" data-ds="gfv:${i}" data-v="${esc(v)}">${esc(dsCut(v,22))}</button>`).join("")}</div>${vs.length>40?`<p class="mu" style="font-size:12px;margin:0">Se muestran 40 de ${vs.length} valores.</p>`:""}</div>`;}).join(""):'<p class="mu" style="margin:6px 0 0;font-size:14px">Sin filtros. Agrega uno para que todos los bloques muestren solo esos valores (por ejemplo, un cliente o una planta).</p>'}
  <select data-dsh="gfadd" style="margin-top:10px">${dsOpts(gfc.map(c=>c.n),"","+ Agregar filtro por columna…")}</select></div>`;
 if(!DS.w.length)h+=`<div class="card center"><p class="mu" style="margin:0 0 12px">Aún no hay bloques. Crea uno con el constructor o deja que la app arme uno por ti.</p><div class="row3"><button type="button" class="btn pri" data-ds="v:build">Crear bloque</button><button type="button" class="btn" data-ds="auto">Dashboard automático</button></div></div>`;
 else h+=`<div class="dgrid">${DS.w.map(dsWidgetHtml).join("")}</div>
 <div class="card"><h2 class="sh"><i>★</i>Guardar y descargar</h2><label class="lb">Nombre del dashboard</label><input data-dsh="name" value="${esc(DS.name)}" placeholder="Ej. Inventario por planta" maxlength="50">
  <div class="row3"><button type="button" class="btn pri" data-ds="save">Guardar diseño</button><button type="button" class="btn" data-ds="v:build">Agregar bloque</button><button type="button" class="btn dk full" data-ds="pdf">Reporte PDF</button><button type="button" class="btn full" data-ds="xlall">Excel con todos los bloques</button></div></div>`;
 return h;}
const dsDistinct=c=>{const m=new Map();DS.rows.forEach(r=>{const k=dsKey(r[c],DS.cols[c]);m.set(k,(m.get(k)||0)+1);});return [...m.entries()].sort((a,b)=>b[1]-a[1]).map(x=>x[0]);};
function dsData(){const R=DS.rows.slice(0,15);return `<div class="card"><h2 class="sh"><i>▤</i>Columnas detectadas</h2><p class="mu" style="margin:6px 0 4px;font-size:13px">Si una columna quedó con el tipo equivocado, cámbialo aquí.</p>${DS.cols.map((c,i)=>`<div class="crit"><p style="font-size:14px">${esc(c.n)}</p><select style="width:120px;flex:none" data-dsc="${i}">${dsOpts([["txt","Texto"],["num","Número"],["date","Fecha"]],c.t)}</select></div>`).join("")}</div>
 <div class="card"><h2 class="sh"><i>≡</i>Primeras filas</h2><div class="tw"><table class="vt"><tr>${DS.cols.map(c=>`<th>${esc(dsCut(c.n,16))}</th>`).join("")}</tr>${R.map(r=>`<tr>${r.map(v=>`<td>${esc(dsCut(v instanceof Date?dsKey(v,{t:"date"},"day"):v,18))}</td>`).join("")}</tr>`).join("")}</table></div></div>`;}
function dsNew(){return {id:uid(),type:"bar",title:"",measures:[{op:"count",col:""}],by:"",gran:"month",sort:"desc",limit:10,filters:[]};}
function dsBuild(){
 const E=DS.edit||(DS.edit=dsNew()),isNew=!DS.w.some(w=>w.id===E.id),numC=dsColsBy(["num"]),allC=dsColsBy();
 const byc=E.by?DS.cols[dsCi(E.by)]:null,multi=E.type==="table";
 let res=null,perr="";try{res=dsRun(E);}catch(e){perr=e.message;}
 const mrow=(m,i)=>`<div class="two" style="margin-top:8px"><select data-de="mop:${i}">${dsOpts(DOPS,m.op)}</select>${m.op==="count"?`<input disabled value="todas las filas">`:`<select data-de="mcol:${i}">${dsOpts(m.op==="distinct"?allC:numC,m.col,"Columna…")}</select>`}</div>`;
 return `<div class="card"><h2 class="sh"><i>1</i>¿Qué quieres medir?</h2><p class="mu" style="margin:6px 0 0;font-size:13px">Por ejemplo: sumar la cantidad, contar registros o ver el promedio.</p>${E.measures.slice(0,multi?3:1).map(mrow).join("")}${multi&&E.measures.length<3?`<button type="button" class="btn txt" data-de="madd">+ Agregar otra medida</button>`:""}${!numC.length?`<p class="mu" style="font-size:12px;margin:8px 0 0">No detecté columnas numéricas; puedes contar registros o valores distintos.</p>`:""}</div>
 <div class="card"><h2 class="sh"><i>2</i>¿Cómo quieres agruparlo?</h2><p class="mu" style="margin:6px 0 6px;font-size:13px">Elige la columna que define cada barra, rebanada o renglón (cliente, planta, mes…).</p><select data-de="by">${dsOpts(allC,E.by,"Sin agrupar (un solo total)")}</select>${byc&&byc.t==="date"?`<label class="lb">Agrupar fecha por</label><select data-de="gran">${dsOpts([["day","Día"],["month","Mes"],["year","Año"]],E.gran)}</select>`:""}</div>
 <div class="card"><h2 class="sh"><i>3</i>¿Quieres filtrar?<em>opcional</em></h2>${E.filters.map((f,i)=>`<div class="gfx"><select data-de="fcol:${i}">${dsOpts(allC,f.col,"Columna…")}</select><select data-de="fop:${i}" style="margin-top:8px">${dsOpts(DCMP,f.op)}</select><div class="fld" style="margin-top:8px"><input data-de="fval:${i}" value="${esc(f.val)}" placeholder="Valor"><button type="button" class="ib" data-de="fdel:${i}" aria-label="Quitar">✕</button></div></div>`).join("")}<button type="button" class="btn txt" data-de="fadd">+ Agregar filtro</button></div>
 <div class="card"><h2 class="sh"><i>4</i>¿Cómo quieres verlo?</h2><div class="vc">${DTYPES.map(t=>`<button type="button" class="${E.type===t[0]?"on":""}" data-de="type:${t[0]}">${t[1]}</button>`).join("")}</div>
  ${["bar","hbar","pie","table"].includes(E.type)&&E.by?`<div class="two"><div><label class="lb">Orden</label><select data-de="sort">${dsOpts([["desc","Mayor a menor"],["asc","Menor a mayor"],["key","Por nombre"]],E.sort)}</select></div><div><label class="lb">Mostrar</label><select data-de="limit">${dsOpts([["5","Top 5"],["10","Top 10"],["15","Top 15"],["0","Todos"]],String(E.limit))}</select></div></div>`:""}
  <label class="lb">Título</label><input data-de="title" value="${esc(E.title)}" placeholder="${esc(dsTitle(Object.assign({},E,{title:""})))}" maxlength="60"></div>
 <div class="card"><h2 class="sh"><i>👁</i>Vista previa</h2>${perr?`<p class="aerr">${esc(perr)}</p>`:res?dsBody(E,res,TH_DOM):""}${res?`<p class="mu" style="margin:8px 0 0;font-size:12px">${res.n.toLocaleString("es-MX")} registros después de filtros.</p>`:""}
  <div class="row3"><button type="button" class="btn pri" data-de="save">${isNew?"Agregar al dashboard":"Guardar cambios"}</button><button type="button" class="btn" data-de="cancel">Cancelar</button></div></div>`;}
const DSQL_EX=[["Total por columna","select A, sum(B) group by A order by sum(B) desc limit 10"],["Filtrar filas","select * where A = 'valor'"],["Contar","select A, count(*) group by A order by count(*) desc"]];
function dsSqlView(){const ex=DS.cols.length?[DS.cols[0].n,(DS.cols.find(c=>c.t==="num")||DS.cols[Math.min(1,DS.cols.length-1)]).n]:["A","B"];
 const fx=(q)=>q.replace(/\bA\b/g,ex[0].includes(" ")?'"'+ex[0]+'"':ex[0]).replace(/\bB\b/g,ex[1].includes(" ")?'"'+ex[1]+'"':ex[1]);
 return `<div class="card"><h2 class="sh"><i>›_</i>Consulta tipo SQL</h2><p class="mu" style="margin:6px 0 8px;font-size:13px">Escribe como en Google Query: <code>select</code>, <code>where</code>, <code>group by</code>, <code>order by</code>, <code>limit</code>. Usa el nombre de la columna (entre comillas si tiene espacios) o su letra (A, B, C…). Funciones: sum, count, avg, min, max.</p>
 <div class="vc">${DSQL_EX.map((e,i)=>`<button type="button" data-dq="ex:${i}">${e[0]}</button>`).join("")}</div>
 <textarea data-dq="txt" rows="5" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px" placeholder="select ...">${esc(DS.sql)}</textarea>
 <p class="mu" style="margin:8px 0 0;font-size:12px">Columnas: ${DS.cols.slice(0,30).map((c,i)=>`${esc(c.n)} (${XLSX.utils.encode_col(i)})`).join(" · ")}</p>
 <div class="row3"><button type="button" class="btn pri" data-dq="run">Ejecutar</button><button type="button" class="btn" data-dq="clr">Limpiar</button></div></div>
 ${DS.sqlErr?`<div class="aerr">${esc(DS.sqlErr)}</div>`:""}
 ${DS.sqlRes?`<div class="card"><h2 class="sh"><i>≡</i>Resultado<em>${DS.sqlRes.rows.length} filas</em></h2>${dsTable(DS.sqlRes,30)}<div class="row3"><button type="button" class="btn" data-dq="xl">Descargar Excel</button><button type="button" class="btn pri" data-dq="add">Agregar al dashboard</button></div></div>`:""}
 <input type="hidden" data-dq-ex='${esc(JSON.stringify(DSQL_EX.map(e=>fx(e[1]))))}'>`;}

/* ---- automático, descargas ---- */
function dsAuto(){
 const nums=DS.cols.filter(c=>c.t==="num"&&!/(^|\s)(id|folio|numero|número|no\.?|lpn|codigo|código|lote|sku|gcas|material)(\s|$)/i.test(c.n)),txt=DS.cols.filter(c=>{if(c.t!=="txt")return false;const k=dsDistinct(DS.cols.indexOf(c)).length;return k>=2&&k<=40;}),dt=DS.cols.find(c=>c.t==="date"),W=[];
 const mk=(o)=>Object.assign(dsNew(),o,{id:uid()});
 W.push(mk({type:"kpi",title:"Registros",measures:[{op:"count",col:""}]}));
 nums.slice(0,3).forEach(n=>W.push(mk({type:"kpi",title:"Suma de "+n.n,measures:[{op:"sum",col:n.n}]})));
 txt.slice(0,2).forEach(c=>{W.push(mk({type:"hbar",title:"Registros por "+c.n,by:c.n,measures:[{op:"count",col:""}]}));if(nums[0])W.push(mk({type:"bar",title:nums[0].n+" por "+c.n,by:c.n,measures:[{op:"sum",col:nums[0].n}]}));});
 if(txt[2])W.push(mk({type:"pie",title:"Distribución por "+txt[2].n,by:txt[2].n,measures:[{op:"count",col:""}],limit:7}));
 if(dt)W.push(mk({type:"line",title:"Registros por mes",by:dt.n,gran:"month",measures:[{op:"count",col:""}]}));
 DS.w=DS.w.concat(W);dsCheck();DS.v="dash";toast("Armé "+W.length+" bloques. Edita, quita o agrega los que quieras.");render();}
function dsXlSheets(ws){const wb=XLSX.utils.book_new(),used=new Set();ws.forEach((w,i)=>{let res;try{res=dsRun(w);}catch(e){return;}let n=dsTitle(w).replace(/[\\\/?*\[\]:]/g,"").slice(0,28)||"Bloque",k=n,j=2;while(used.has(k))k=n.slice(0,26)+" "+(j++);used.add(k);
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([res.head].concat(res.rows)),k);});return wb;}
function dsXl(ws,name){if(typeof XLSX==="undefined"){toast("No se pudo cargar el lector de Excel.");return;}const wb=dsXlSheets(ws);if(!wb.SheetNames.length){toast("No hay resultados para descargar.");return;}
 saveBlob(name+"_"+today()+".xlsx",new Blob([XLSX.write(wb,{bookType:"xlsx",type:"array"})],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));}
const dsPng=(svg,w,h)=>new Promise(ok=>{const im=new Image();im.onload=()=>{try{const c=document.createElement("canvas");c.width=w*2;c.height=h*2;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);ok(c.toDataURL("image/jpeg",.92));}catch(e){ok("");}};im.onerror=()=>ok("");im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);});
async function dsPdf(){
 if(!window.jspdf){toast("No se pudo cargar el generador de PDF. Revisa tu conexión.");return;}
 busy("Generando PDF…");await new Promise(r=>setTimeout(r,40));
 try{const {jsPDF}=window.jspdf,d=new jsPDF({unit:"mm",format:"a4"}),W=210,H=297,L=14,R=196,T=[32,79,95],B=[124,63,42],title=DS.name||"Dashboard";let y=0,pg=1;
  const head=()=>{d.setFillColor(...T);d.rect(0,0,W,22,"F");d.setFillColor(...B);d.rect(0,22,W,1.6,"F");d.setTextColor(255,255,255);d.setFont("helvetica","bold");d.setFontSize(15);d.text(dsCut(title,40),L,14);d.setFont("helvetica","normal");d.setFontSize(8.5);d.text("Soluciones en Logística Cargo",R,14,{align:"right"});y=31;};
  const foot=()=>{d.setFont("helvetica","normal");d.setFontSize(7);d.setTextColor(120,120,120);d.text("Soluciones en Logística Cargo · Desarrollado por Manuel ChD · Todos los derechos reservados",L,H-8);d.text("Página "+pg,R,H-8,{align:"right"});};
  const need=h=>{if(y+h>H-16){foot();d.addPage();pg++;head();}};
  const tx=(t,x,yy,o={})=>{d.setFont("helvetica",o.b?"bold":"normal");d.setFontSize(o.sz||9);d.setTextColor(...(o.c||[30,30,30]));d.text(String(t),x,yy,o.al?{align:o.al}:undefined);};
  head();tx("Archivo: "+DS.file+" · "+DS.rows.length.toLocaleString("es-MX")+" filas",L,y);y+=5;tx("Generado: "+new Date().toLocaleString("es-MX"),L,y);y+=5;
  const fl=DS.gf.filter(f=>f.vals.length).map(f=>f.col+": "+f.vals.join(", "));if(fl.length){d.splitTextToSize("Filtros: "+fl.join(" | "),R-L).slice(0,3).forEach(l=>{tx(l,L,y,{sz:8,c:[90,90,90]});y+=4;});}y+=3;
  const items=DS.w.map(w=>{let res=null;try{res=dsRun(w);}catch(e){}return {w,res};}).filter(x=>x.res&&!DS.miss.includes(x.w.id));
  const kp=items.filter(x=>x.w.type==="kpi"),ch=items.filter(x=>x.w.type!=="kpi"&&x.w.type!=="table"&&!x.w.sql),tb=items.filter(x=>x.w.type==="table"||x.w.sql);
  kp.forEach((x,i)=>{if(i%4===0)need(24);const xx=L+(i%4)*46;d.setFillColor(244,241,238);d.roundedRect(xx,y,43,20,2,2,"F");tx(x.res.rows.length?dsFull(x.res.rows[0][1]):"0",xx+4,y+10,{b:1,sz:15,c:T});d.splitTextToSize(dsTitle(x.w),37).slice(0,2).forEach((l,k)=>tx(l,xx+4,y+14.5+k*3.2,{sz:7,c:[90,90,90]}));if(i%4===3||i===kp.length-1)y+=25;});
  const cimgs=[];for(const x of ch){const svg=chartFor(x.w.type,x.res,TH_PDF),m=/viewBox="0 0 (\d+) (\d+)"/.exec(svg),vw=+m[1],vh=+m[2];cimgs.push({x,ph:88*vh/vw,png:await dsPng(svg,vw,vh)});}
  for(let i=0;i<cimgs.length;i+=2){const row=cimgs.slice(i,i+2),rh=Math.max(...row.map(c=>c.ph))+9;need(rh);row.forEach((c,k)=>{const xx=L+k*92;tx(dsCut(dsTitle(c.x.w),46),xx,y+3,{b:1,sz:8.5,c:T});if(c.png)d.addImage(c.png,"JPEG",xx,y+5,88,c.ph);});y+=rh+3;}
  tb.forEach(x=>{const res=x.res,rows=res.rows.slice(0,25),cw=(R-L)/res.head.length;need(14+Math.min(rows.length,6)*5.5);tx(dsCut(dsTitle(x.w),70),L,y+3,{b:1,sz:9,c:T});y+=6;
   d.setFillColor(232,236,238);d.rect(L,y,R-L,6,"F");res.head.forEach((h,i)=>tx(dsCut(h,Math.floor(cw/1.9)),L+i*cw+1.5,y+4.2,{b:1,sz:7.5,c:[60,60,60]}));y+=6;
   rows.forEach((r,ri)=>{need(6);if(ri%2===0){d.setFillColor(249,248,246);d.rect(L,y,R-L,5.5,"F");}r.forEach((v,i)=>tx(dsCut(typeof v==="number"?dsFmt(v):v,Math.floor(cw/1.7)),L+i*cw+1.5,y+4,{sz:7.5}));y+=5.5;});y+=6;});
  foot();busy("");saveBlob((title.replace(/[^\w.-]+/g,"_"))+"_"+today()+".pdf",d.output("blob"));gstInc("dash");hlogAdd({k:"dash",t:title,s:items.length+" bloques · "+DS.file,st:"ok"});
 }catch(err){busy("");toast("No se pudo generar el PDF: "+(err&&err.message||err));}}

/* ---- eventos ---- */
function dsFlush(){DS.edit=null;}
$("#fdash").addEventListener("change",dsPick);
document.addEventListener("change",e=>{const t=e.target,d=t.dataset;
 if(d.dsh==="sheet"){DS.sheet=t.value;dsParse();dsCheck();render();}
 else if(d.dsh==="gfadd"){if(t.value){DS.gf.push({col:t.value,vals:[]});}render();}
 else if(d.dsh==="name"){DS.name=t.value;}
 else if(d.dsc!==undefined){DS.cols[+d.dsc].t=t.value;render();}
 else if(d.de&&DS.edit){const p=d.de.split(":"),k=p[0],i=+p[1],E=DS.edit;
  if(k==="mop"){E.measures[i].op=t.value;if(t.value==="count")E.measures[i].col="";else if(!E.measures[i].col)E.measures[i].col=(dsColsBy(t.value==="distinct"?null:["num"])[0])||"";}
  else if(k==="mcol")E.measures[i].col=t.value;
  else if(k==="by"){E.by=t.value;if(!t.value&&["bar","hbar","line","pie"].includes(E.type))E.type="kpi";}
  else if(k==="gran")E.gran=t.value;
  else if(k==="fcol")E.filters[i].col=t.value;else if(k==="fop")E.filters[i].op=t.value;else if(k==="fval")E.filters[i].val=t.value;
  else if(k==="sort")E.sort=t.value;else if(k==="limit")E.limit=+t.value;else if(k==="title")E.title=t.value;
  render();}});
document.addEventListener("input",e=>{const t=e.target,d=t.dataset;if(d.dq==="txt")DS.sql=t.value;});
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-ds],[data-de],[data-dw],[data-dq]");if(!b)return;const d=b.dataset;
 if(d.ds!==undefined){const p=d.ds.split(":"),a=p[0],v=p[1];
  if(a==="v"){DS.v=v;if(v==="build"&&!DS.edit)DS.edit=dsNew();if(v==="build"&&DS.edit&&DS.w.some(w=>w.id===DS.edit.id))DS.edit=dsNew();render();window.scrollTo(0,0);}
  else if(a==="close")dlg({title:"Cerrar archivo",body:"Se quitan los datos de la pantalla. El diseño del dashboard se conserva.",buttons:[{t:"Cancelar"},{t:"Cerrar",cls:"pri",fn:()=>{DS.wb=null;DS.file="";DS.rows=[];DS.cols=[];DS.pend=DS.w.length>0;DS.v="dash";render();}}]});
  else if(a==="auto")dsAuto();
  else if(a==="gfdel"){DS.gf.splice(+v,1);render();}
  else if(a==="gfv"){const f=DS.gf[+v],x=d.v,i=f.vals.indexOf(x);if(i>=0)f.vals.splice(i,1);else f.vals.push(x);render();}
  else if(a==="save"){const nm=(DS.name||"").trim();if(!nm){toast("Escribe un nombre para el dashboard.");return;}const o={id:DS.id||uid(),name:nm,upd:Date.now(),w:clone(DS.w),gf:clone(DS.gf)};const i=DSH.findIndex(x=>x.id===o.id);if(i>=0)DSH[i]=o;else DSH.push(o);DS.id=o.id;dshSave();toast("Dashboard guardado.");render();}
  else if(a==="open"){const o=DSH.find(x=>x.id===d.id);if(!o)return;DS.w=clone(o.w);DS.gf=clone(o.gf||[]);DS.name=o.name;DS.id=o.id;DS.v="dash";DS.pend=!DS.wb;if(DS.wb)dsCheck();TAB="dash";render();window.scrollTo(0,0);}
  else if(a==="rm")dlg({title:"Eliminar dashboard",body:"Se borra el diseño guardado.",buttons:[{t:"Cancelar"},{t:"Eliminar",cls:"dg",fn:()=>{DSH=DSH.filter(x=>x.id!==d.id);dshSave();render();}}]});
  else if(a==="pdf")dsPdf();
  else if(a==="xlall")dsXl(DS.w,(DS.name||"Dashboard").replace(/[^\w.-]+/g,"_"));
  return;}
 if(d.dw!==undefined){const p=d.dw.split(":"),a=p[0],w=DS.w.find(x=>x.id===p[1]);if(!w)return;
  if(a==="edit"){DS.edit=clone(w);DS.v="build";render();window.scrollTo(0,0);}
  else if(a==="del")dlg({title:"Quitar bloque",body:"Se quita «"+dsTitle(w)+"» del dashboard.",buttons:[{t:"Cancelar"},{t:"Quitar",cls:"dg",fn:()=>{DS.w=DS.w.filter(x=>x.id!==w.id);dsCheck();render();}}]});
  else if(a==="xl")dsXl([w],(dsTitle(w)).replace(/[^\w.-]+/g,"_"));return;}
 if(d.de!==undefined&&DS.edit){const p=d.de.split(":"),k=p[0],i=+p[1],E=DS.edit;
  if(k==="type"){E.type=p[1];if(E.type!=="table"&&E.measures.length>1)E.measures=E.measures.slice(0,1);if(["bar","hbar","line","pie"].includes(E.type)&&!E.by){const c=DS.cols.find(c=>c.t!=="num")||DS.cols[0];E.by=c?c.n:"";}render();}
  else if(k==="madd"){E.measures.push({op:"sum",col:dsColsBy(["num"])[0]||""});render();}
  else if(k==="fadd"){E.filters.push({col:"",op:"=",val:""});render();}
  else if(k==="fdel"){E.filters.splice(i,1);render();}
  else if(k==="cancel"){DS.edit=null;DS.v="dash";render();}
  else if(k==="save"){const E2=clone(E);if(E2.type!=="kpi"&&E2.type!=="table"&&!E2.by){toast("Elige cómo agrupar (paso 2) o usa Tarjeta.");return;}
   const j=DS.w.findIndex(x=>x.id===E2.id);if(j>=0)DS.w[j]=E2;else DS.w.push(E2);DS.edit=null;DS.v="dash";dsCheck();render();window.scrollTo(0,0);toast("Bloque listo.");}
  return;}
 if(d.dq!==undefined){const a=d.dq.split(":")[0];
  if(a==="ex"){const arr=JSON.parse(document.querySelector("[data-dq-ex]").dataset.dqEx);DS.sql=arr[+d.dq.split(":")[1]];DS.sqlRes=null;DS.sqlErr="";render();}
  else if(a==="run"){const ta=document.querySelector('[data-dq="txt"]');if(ta)DS.sql=ta.value;DS.sqlErr="";DS.sqlRes=null;try{DS.sqlRes=dsSql(DS.sql);}catch(err){DS.sqlErr=err.message;}render();}
  else if(a==="clr"){DS.sql="";DS.sqlRes=null;DS.sqlErr="";render();}
  else if(a==="xl"&&DS.sqlRes){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([DS.sqlRes.head].concat(DS.sqlRes.rows)),"Consulta");saveBlob("Consulta_"+today()+".xlsx",new Blob([XLSX.write(wb,{bookType:"xlsx",type:"array"})],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));}
  else if(a==="add"&&DS.sqlRes){DS.w.push(Object.assign(dsNew(),{type:"table",title:"Consulta",sql:DS.sql,measures:[]}));DS.v="dash";dsCheck();render();window.scrollTo(0,0);toast("Agregado al dashboard.");}}});
