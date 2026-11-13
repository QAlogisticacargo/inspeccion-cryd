/* ===== Lector de código de barras Code 128 / GS1-128 (sin internet, sin librerías) ===== */
const BC_T="212222,222122,222221,121223,121322,131222,122213,122312,132212,221213,221312,231212,112232,122132,122231,113222,123122,123221,223211,221132,221231,213212,223112,312131,311222,321122,321221,312212,322112,322211,212123,212321,232121,111323,131123,131321,112313,132113,132311,211313,231113,231311,112133,112331,132131,113123,113321,133121,313121,211331,231131,213113,213311,213131,311123,311321,331121,312113,312311,332111,314111,221411,431111,111224,111422,121124,121421,141122,141221,112214,112412,122114,122411,142112,142211,241211,221114,413111,241112,134111,111242,121142,121241,114212,124112,124211,411212,421112,421211,212141,214121,412121,111143,111341,131141,114113,114311,411113,411311,113141,114131,311141,411131,211412,211214,211232,2331112".split(",");
const BC_W=BC_T.map(s=>s.split("").map(Number));
function bcRuns(row,th){const r=[];let cur=row[0]<th,n=0;for(let i=0;i<row.length;i++){const d=row[i]<th;if(d===cur)n++;else{r.push([cur,n]);cur=d;n=1;}}r.push([cur,n]);return r;}
function bcMatch(w,from,len,cands){let T=0;for(let i=0;i<len;i++)T+=w[from+i];const u=T/(len===7?13:11);if(!(u>0.8))return null;let best=-1,be=1e9;
 for(const c of cands){const p=BC_W[c];let e=0;for(let i=0;i<len;i++)e+=Math.abs(w[from+i]/u-p[i]);if(e<be){be=e;best=c;}}
 return be<(len===7?3.2:2.6)?{c:best,u,e:be}:null;}
function bcSyms(codes){let set=0,out="",ch=0;if(codes.length<3)return null;const st=codes[0];set=st===103?1:st===104?2:3;let sum=st;
 for(let i=1;i<codes.length-1;i++)sum+=codes[i]*i;if(sum%103!==codes[codes.length-1])return null;
 for(let i=1;i<codes.length-1;i++){const c=codes[i];
  if(c===102)continue;if(c===99){set=3;continue;}if(c===100){set=2;continue;}if(c===101){set=1;continue;}if(c>=96)continue;
  if(set===3)out+=(c<10?"0":"")+c;else out+=String.fromCharCode(set===2?c+32:(c<64?c+32:c-64));}
 return out;}
function bcRow(g,th){const rs=bcRuns(g,th),w=rs.map(x=>x[1]);
 for(let s=0;s+13<rs.length;s++){if(!rs[s][0])continue;
  const st=bcMatch(w,s,6,[103,104,105]);if(!st)continue;
  const codes=[st.c];let p=s+6,ok=false;
  while(p+6<=rs.length&&codes.length<60){
   if(p+7<=rs.length){const sp=bcMatch(w,p,7,[106]);if(sp&&codes.length>=3){codes.push(106);ok=true;break;}}
   const m=bcMatch(w,p,6,BC_W.map((_,i)=>i).slice(0,106));if(!m)break;codes.push(m.c);p+=6;}
  if(!ok)continue;codes.pop();
  const t=bcSyms(codes);if(t)return t;}
 return null;}
function bcScanData(d,W,H,vert){const lines=vert?W:H,len=vert?H:W,step=Math.max(1,Math.floor(lines/90)),g=new Uint8Array(len);const found=[];
 for(let y=0;y<lines;y+=step){
  for(let i=0;i<len;i++){const k=vert?(i*W+y):(y*W+i),q=k*4;g[i]=(d[q]*.299+d[q+1]*.587+d[q+2]*.114)|0;}
  let lo=255,hi=0;for(let i=0;i<len;i++){if(g[i]<lo)lo=g[i];if(g[i]>hi)hi=g[i];}if(hi-lo<60)continue;
  const ths=[(lo+hi)>>1,lo+((hi-lo)*.4|0),lo+((hi-lo)*.6|0)];
  for(const th of ths){let t=bcRow(g,th);if(!t){const rv=Array.from(g).reverse();t=bcRow(rv,th);}
   if(t&&/\d{18}/.test(t)){found.push(t);break;}}
  if(found.length>=2)break;}
 return found[0]||"";}
async function bcScan(blob){try{
 const bm=await createImageBitmap(blob),out=[];
 for(const mx of [1600,1000]){const k=Math.min(1,mx/Math.max(bm.width,bm.height)),c=document.createElement("canvas");c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);
  const x=c.getContext("2d");x.drawImage(bm,0,0,c.width,c.height);const im=x.getImageData(0,0,c.width,c.height);
  let t=bcScanData(im.data,c.width,c.height,false)||bcScanData(im.data,c.width,c.height,true);if(t){if(bm.close)bm.close();return t;}}
 if(bm.close)bm.close();return "";}catch(e){return "";}}

/* ===== Recibo y Surtido: validar LPN contra el Excel (misma mecánica, dos procesos) ===== */
const LCFG={
 rcv:{name:_t(213,"Recibo"),keys:["rcvx","rcvs","rcvcur"],file:"frcv",what:_t(661,"cajas recibidas"),
  intro:_t(662,"Sube el Excel del inventario que trae las LPN con sus códigos, lotes y cantidades (Load Number, Item Number, Lot Number, Unit Quantity).")},
 sur:{name:_t(214,"Surtido"),keys:["surx","surs","surcur"],file:"fsur",what:_t(663,"cajas surtidas"),
  intro:_t(664,"Sube el Excel del surtido (pedido o inventario) que trae las LPN con sus códigos, lotes y cantidades a surtir.")}};
const LP={};
Object.keys(LCFG).forEach(m=>{LP[m]={c:LCFG[m],X:null,S:[],CUR:null,IDX:null,UI:{msg:null},MAP:null,RT:0};});
const nlot=l=>vU(l).replace(/R$/,"");
/* coherencia lote–producto. La familia sale de la matriz master data (código → familia); si el código no está, de la descripción.
   Detergentes, suavizantes y jabones (FHC) llevan línea XX al final del lote; cuidado del cabello (HRC) y femenino (FEM), no. */
const LF_JAB=/\b(ARIEL|SALVO|DOWNY|DWY|ACE|TIDE|DETERG\w*|SUAVIZ\w*|JABON\w*|LAVATRAST\w*)\b/,LF_OTR=/\b(PANTENE|PTN|PNT|H&S|HS|HERBAL|SHAMPOO|SHAMP|ACONDICIONADOR|NATURELLA)\b|HEAD ?& ?SHOULDERS/;
function lotCls(desc,code){const d=String(desc||"").toUpperCase(),f=typeof mzFam==="function"?mzFam(code):"";
 if(f==="HRC")return {t:"o",n:_t(665,"cuidado del cabello")};if(f==="FEM")return {t:"o",n:_t(995,"cuidado femenino")};
 if(f==="FHC")return LF_JAB.test(d)?{t:"j",n:_t(666,"detergente, suavizante o jabón")}:null;
 if(f)return null;const j=LF_JAB.test(d),o=LF_OTR.test(d);return j===o?null:j?{t:"j",n:_t(666,"detergente, suavizante o jabón")}:{t:"o",n:_t(667,"shampoo o similar")};}
function lotSus(desc,lote,code){const l=vU(lote);if(!l)return "";const c=lotCls(desc,code);if(!c)return "";const xx=/XX$/.test(l);
 if(c.t==="j"&&!xx)return _t(668,"El lote ")+l+_t(669," no termina en XX, como los lotes de ")+c.n+".";
 if(c.t==="o"&&xx)return _t(668,"El lote ")+l+_t(670," termina en XX, que es de jabones y detergentes; este producto es de ")+c.n+".";return "";}
function lotLev(a,b){a=vU(a);b=vU(b);if(a===b)return 0;if(Math.abs(a.length-b.length)>2)return 9;const m=[];for(let i=0;i<=a.length;i++){m[i]=[i];}for(let j=1;j<=b.length;j++)m[0][j]=j;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length];}

const rcvFix=t=>String(t).toUpperCase().replace(/O/g,"0").replace(/[IL]/g,"1");
const lpFmt=l=>String(l||"").replace(/(\d{4})(?=\d)/g,"$1 ");
function lpLoad(){Object.keys(LP).forEach(m=>{const p=LP[m],k=p.c.keys;p.X=U.get(k[0],null);p.S=U.get(k[1],[]);if(!Array.isArray(p.S))p.S=[];
 p.S.forEach(r=>{if(!Array.isArray(r.items))r.items=[];if(!Array.isArray(r.extras))r.extras=[];});
 const c=U.get(k[2],null);p.CUR=c?(p.S.find(x=>x.id===c)||null):null;p.IDX=null;p.UI={msg:null};p.MAP=null;});}
function lpReset(){Object.keys(LP).forEach(m=>{const p=LP[m];p.X=null;p.S=[];p.CUR=null;p.IDX=null;p.UI={msg:null};p.MAP=null;});}
function lpSave(m){const p=LP[m],k=p.c.keys;
 if(p.CUR){p.CUR.upd=Date.now();if(!p.S.some(x=>x.id===p.CUR.id))p.S.push(p.CUR);}
 p.S.slice().sort((a,b)=>(b.upd||0)-(a.upd||0)).slice(15).forEach(s=>{s.lpnPh="";(s.items||[]).forEach(i=>i.ph=[]);(s.extras||[]).forEach(i=>i.ph=[]);});
 U.set(k[1],p.S);U.set(k[2],p.CUR?p.CUR.id:null);}
function lpFlush(){Object.keys(LP).forEach(m=>{if(LP[m].CUR)lpSave(m);});}
function lpIdx(m){const p=LP[m];if(p.IDX)return p.IDX;p.IDX=new Map();if(p.X)p.X.rows.forEach(r=>{let a=p.IDX.get(r[0]);if(!a)p.IDX.set(r[0],a=[]);a.push(r);});return p.IDX;}
const lpDet=m=>LP[m].CUR.det||(LP[m].CUR.det={code:"",lote:"",cnt:"",th:[],man:0,tgt:-1,chk:null});
/* unir sesiones que vienen del servidor */
function lpMerge(m,arr){const p=LP[m];let n=0;(Array.isArray(arr)?arr:Object.values(arr||{})).forEach(r=>{if(!r||!r.id)return;if(!Array.isArray(r.items))r.items=[];if(!Array.isArray(r.extras))r.extras=[];r.items.forEach(i=>{if(!Array.isArray(i.ph))i.ph=[];});
 const i=p.S.findIndex(x=>x.id===r.id);if(i<0){p.S.push(r);n++;}else if((r.upd||0)>(p.S[i].upd||0)){p.S[i]=r;n++;}});
 if(p.CUR)p.CUR=p.S.find(x=>x.id===p.CUR.id)||p.CUR;U.set(p.c.keys[1],p.S);return n;}

/* ---- lectura del Excel y asignación de columnas ---- */
const RPAT={lpn:/load number|lpn|license|placa|carga|pallet|tarima|sscc/,gcas:/item number|gcas|material|codigo|sku|articulo/,desc:/descri/,lote:/lot number|lote|batch/,estatus:/status|estatus|estado/,cant:/unit quantity|unit qty|cantidad|qty|quantity|cajas|piezas/,sloc:/storage|sloc|almacen|ubicacion/,planta:/client|planta|plant/,um:/\buom\b|unit of measure|unidad de medida|unidad med|\bu\.?m\.?\b|medida|\bunit$/};
const LREQ=[["lpn","LPN / Load Number"],["gcas",_t(671,"Código / Item Number")],["lote",_t(672,"Lote / Lot Number")],["cant",_t(673,"Cantidad / Unit Quantity")]];
const LOPT=[["desc",_t(96,"Descripción")],["estatus",_t(103,"Estatus")],["sloc","Sloc"],["planta",_t(196,"Planta")],["um",_t(674,"Unidad de medida (CS / IT)")]];
function lpMap(row){const m={},used=new Set();Object.keys(RPAT).forEach(f=>{for(let c=0;c<row.length;c++){if(used.has(c))continue;const h=nz(row[c]);if(!h||/display|date|fecha|time/.test(h))continue;if(RPAT[f].test(h)){m[f]=c;used.add(c);break;}}});return m;}
async function lpPick(m,e){const f=e.target.files[0];e.target.value="";if(!f)return;
 if(typeof XLSX==="undefined"){toast(_t(110,"No se pudo cargar el lector de Excel. Revisa tu conexión."));return;}
 busy(_t(675,"Leyendo ")+f.name+"…");
 try{await new Promise(r=>setTimeout(r,30));
  const wb=XLSX.read(await f.arrayBuffer(),{type:"array"}),ws=wb.Sheets[wb.SheetNames[0]],rg=ws["!ref"]?XLSX.utils.decode_range(ws["!ref"]):{s:{r:0,c:0}};
  const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:"",blankrows:true});
  let best={n:-1,r:0,m:{}};for(let r=0;r<Math.min(rows.length,30);r++){const mp=lpMap(rows[r]),n=Object.keys(mp).length;if(n>best.n)best={n,r,m:mp};}
  if(best.m.um==null){const used=new Set(Object.values(best.m));for(let c=0;c<30;c++){if(used.has(c))continue;let n=0,ok=0;for(let r=best.r+1;r<Math.min(rows.length,best.r+250);r++){const v=String(rows[r][c]==null?"":rows[r][c]).trim();if(!v)continue;n++;if(/^(IT|CS|CJ|CAS|EA|PC|PZ|UN|CAJA)$/i.test(v))ok++;}if(n>=3&&ok/n>=.95){best.m.um=c;break;}}}
  const P=LP[m];P.MAP={name:f.name,rows,ws,rg,hdr:best.r,map:best.m};
  busy("");
  const miss=LREQ.filter(x=>P.MAP.map[x[0]]==null);
  if(miss.length){render();toast(_t(676,"Revisa las columnas: no encontré ")+miss.map(x=>x[1]).join(", ")+".");return;}
  lpBuild(m);
 }catch(err){busy("");toast(_t(112,"No se pudo abrir el archivo. Verifica que sea Excel (.xlsx, .xls) o CSV."));}}
function lpBuild(m){
 const P=LP[m],M=P.MAP,mp=M.map,rows=M.rows,ws=M.ws,rg=M.rg,out=[];
 for(let i=M.hdr+1;i<rows.length;i++){const r=rows[i];let v=r[mp.lpn],s;
  if(typeof v==="number"){const c=ws[XLSX.utils.encode_cell({r:rg.s.r+i,c:rg.s.c+mp.lpn})];s=String(c&&c.w?c.w:v);}else s=String(v==null?"":v);
  s=s.replace(/\D/g,"");if(s.length>=15&&s.length<20)s=s.padStart(20,"0");
  const g=String(r[mp.gcas]==null?"":r[mp.gcas]).trim();if(!s||!g)continue;
  const g2=k=>mp[k]==null?"":String(r[mp[k]]==null?"":r[mp[k]]).trim();
  out.push([s,g,g2("desc"),g2("lote"),g2("estatus"),vN(r[mp.cant]),g2("sloc"),g2("planta"),g2("um")]);}
 if(!out.length){toast(_t(677,"El archivo no tiene filas con LPN y código. Revisa las columnas asignadas."));render();return;}
 P.X={name:M.name,at:Date.now(),rows:out};P.IDX=null;P.MAP=null;P.UI.msg=null;const ok=U.set(P.c.keys[0],P.X);
 toast(ok===false?_t(678,"Archivo cargado, pero no cupo guardarlo en el teléfono: no lo cierres o tendrás que subirlo otra vez."):_t(679,"Inventario cargado: ")+lpIdx(m).size+" LPN.");render();}
function lpMapView(m){const P=LP[m],M=P.MAP,h=M.rows[M.hdr]||[];
 const opts=cur=>_t(680,'<option value="">— no usar —</option>')+h.map((x,c)=>`<option value="${c}" ${c===cur?"selected":""}>${XLSX.utils.encode_col(c)}: ${esc(String(x==null?"":x).trim()||_t(113,"(vacío)"))}</option>`).join("");
 return `${_t(681,`<div class="card"><h2 class="sh"><i>1</i>Asigna las columnas</h2><p class="mu" style="margin:6px 0 4px;font-size:14px">`)}${esc(M.name)}${_t(682,`. No pude identificar todas las columnas. Elige cuál es cada una (las marcadas con * son obligatorias).</p>
 <label class="lb">Fila de encabezados</label><input type="number" min="1" data-lmh="`)}${m}" value="${M.hdr+1}">
 ${LREQ.concat(LOPT).map((x,i)=>`<label class="lb">${x[1]}${i<LREQ.length?" *":""}</label><select data-lm="${m}:${x[0]}">${opts(M.map[x[0]])}</select>`).join("")}
 <div class="row3"><button type="button" class="btn pri" data-lr="mapok" data-m="${m}${_t(683,`">Usar estas columnas</button><button type="button" class="btn" data-lr="mapno" data-m="`)}${m}${_t(388,`">Cancelar</button></div></div>`)}`;}

/* ---- lectura de etiquetas: LPN con paréntesis y espacios, 18 o 20 dígitos ---- */
function lpResolve(m,s){const idx=lpIdx(m);s=String(s||"").replace(/\D/g,"");if(idx.has(s))return s;
 if(s.length>=15&&s.length<20){const k=s.padStart(20,"0");if(idx.has(k))return k;}
 if(s.length===20&&idx.has("00"+s.slice(2)))return "00"+s.slice(2);return "";}
function lpFind(m,txt){
 const t=String(txt||"").split(/\s+/).map(x=>/^[\dOoIl|()\-.]+$/.test(x)&&/\d/.test(x)?x.replace(/[Oo]/g,"0").replace(/[Il|]/g,"1"):x).join(" "),d=t.replace(/\D/g,""),idx=lpIdx(m);
 for(const L of [20,18])for(let i=0;i+L<=d.length;i++){const w=d.substr(i,L),k=L===18?"00"+w:w;if(idx.has(k))return {exact:k,near:"",raw:k};}
 let near="",bd=4,raw="";
 if(d.length>=16)for(const L of [20,18])for(let i=0;i+L<=d.length;i++){const w=d.substr(i,L),q=L===18?"00"+w:w;if(!raw)raw=q;for(const k of idx.keys()){let n=0;for(let j=0;j<20&&n<bd;j++)if(k[j]!==q[j])n++;if(n<bd){bd=n;near=k;raw=q;}}}
 return {exact:"",near,raw};}
function lpItems(m,lpn){const mp=new Map();(lpIdx(m).get(lpn)||[]).forEach(r=>{const k=vG(r[1])+"|"+nlot(r[3]);let e=mp.get(k);if(!e){e={g:r[1],l:r[3],desc:r[2],est:r[4],um:r[8]||"",exp:0,st:"pend",cnt:null,ph:[],note:""};mp.set(k,e);}e.exp+=r[5];});return [...mp.values()];}
function rcvRead(txt,items){
 const eg=new Set(items.map(i=>vG(i.g))),el=new Set(items.map(i=>nlot(i.l))),cands=[],lots=[],gen=[];
 String(txt||"").toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean).forEach(t=>{const f=rcvFix(t);if(/^\d{8}$/.test(f))cands.push(f);
  const n=nlot(t),n2=nlot(f);if(el.has(n))lots.push(n);else if(el.has(n2))lots.push(n2);else if(/^[A-Z0-9]{10}$/.test(n)&&/\d/.test(n))gen.push(n);});
 const code=cands.find(c=>eg.has(vG(c)))||cands[0]||"";let lote=lots[0]||"";
 if(code&&lots.length){const mine=items.filter(i=>vG(i.g)===vG(code)).map(i=>nlot(i.l)),h=lots.find(l=>mine.includes(l));if(h)lote=h;}
 if(!lote)lote=gen[0]||"";return {code,lote};}
async function rcvThumb(url){try{const im=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=url;});const k=Math.min(1,170/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.5);}catch(e){return "";}}
function lpRetake(m,k){TARGET="L:"+m+":"+k;$("#cam").click();}
async function lpPhoto(m,pv,kind){
 const P=LP[m];if(!ME)return;
 const th=await rcvThumb(pv.url);let txt="";
 if(kind==="lpn"&&P.CUR){busy(_t(459,"Leyendo código de barras…"));const bcv=await bcScan(pv.blob);busy("");
  if(bcv){const r0=lpFind(m,bcv);if(r0.exact){lpSetLpn(m,r0.exact,th);return;}txt=bcv;}}
 try{
  if(kind==="lpn")txt+="\n"+await ocrRaw(pv.blob,{digits:true,stop:t=>!!lpFind(m,t).exact}).catch(e=>{if(e&&e.message==="cancel")throw e;if(!txt)throw e;return "";});
  else{const it=(P.CUR&&P.CUR.items)||[];txt=await ocrRaw(pv.blob,{max:1800,max2:2400,stop:t=>{const r=rcvRead(t,it);return !!(r.code&&r.lote);}});}
 }catch(e){const x=e&&e.message;if(x==="cancel")return;toast(x==="timeout"?_t(684,"La lectura tardó demasiado. Acerca la cámara, mejora la luz o captura a mano."):_t(685,"No se pudo leer la foto. Inténtalo otra vez o captura a mano."));return;}
 if(kind==="lpn"){
  if(!P.CUR)return;const r=lpFind(m,txt);
  if(r.exact){lpSetLpn(m,r.exact,th);return;}
  if(r.near){dlg({title:_t(462,"Revisa la LPN"),body:_t(686,"Leí ")+lpFmt(r.raw)+_t(687,", que no está en el Excel. ¿Es ")+lpFmt(r.near)+"?",buttons:[{t:_t(465,"Volver a tomar foto"),fn:()=>lpRetake(m,"lpn")},{t:_t(466,"Sí, usar esa"),cls:"pri",fn:()=>lpSetLpn(m,r.near,th)}]});return;}
  P.UI.msg={t:"no",x:_t(468,"No pude leer la LPN en la foto. Acerca la cámara a los números, evita reflejos o escríbela a mano.")};
  dlg({title:_t(467,"LPN no encontrada"),body:P.UI.msg.x,buttons:[{t:_t(469,"Escribir a mano")},{t:_t(465,"Volver a tomar foto"),cls:"pri",fn:()=>lpRetake(m,"lpn")}]});render();return;}
 if(!P.CUR||!P.CUR.lpn)return;
 const r=rcvRead(txt,P.CUR.items),d=lpDet(m);
 if(r.code||r.lote)d.man=0;if(r.code)d.code=r.code;if(r.lote)d.lote=r.lote;if(th)d.th=(d.th||[]).concat(th).slice(-2);
 if(r.code&&r.lote)P.UI.msg={t:"ok",x:_t(688,"Leí código ")+r.code+_t(689," y lote ")+r.lote+_t(690,". Escribe la cantidad y valida.")};
 else if(r.code)P.UI.msg={t:"no",x:_t(691,"Leí el código ")+r.code+_t(692,". Falta el lote: toma otra foto donde se vea o escríbelo.")};
 else if(r.lote)P.UI.msg={t:"no",x:_t(693,"Leí el lote ")+r.lote+_t(694,". Falta el código: toma otra foto donde se vea o escríbelo.")};
 else P.UI.msg={t:"no",x:_t(695,"No pude leer código ni lote. Acércate, mejora la luz o captura a mano.")};
 lpSave(m);render();toast(P.UI.msg.x);}
function lpSetLpn(m,lpn,th){
 const P=LP[m],dup=P.S.find(s=>s.lpn===lpn&&s.id!==P.CUR.id);
 const apply=()=>{P.CUR.lpn=lpn;P.CUR.items=lpItems(m,lpn);P.CUR.lpnPh=th||"";P.CUR.status="proceso";P.UI.msg={t:"ok",x:_t(696,"LPN encontrada en el Excel: ")+P.CUR.items.length+_t(697," renglón(es) por verificar.")};lpSave(m);render();window.scrollTo(0,0);};
 if(dup)dlg({title:_t(698,"LPN ya registrada"),body:_t(699,"Esta LPN ya tiene un registro (")+(dup.status==="ok"?_t(1011,"correcta"):dup.status==="dif"?_t(700,"con diferencias"):_t(701,"en proceso"))+_t(702,"). ¿Abrir ese registro o empezar uno nuevo?"),buttons:[{t:_t(703,"Nuevo registro"),fn:apply},{t:_t(704,"Abrir el existente"),cls:"pri",fn:()=>{P.S=P.S.filter(x=>x.id!==P.CUR.id);P.CUR=dup;lpSave(m);render();}}]});
 else apply();}
function lpManual(m){const P=LP[m],v=(P.UI.lpnTxt||"").replace(/\D/g,"");
 if(v.length<15){toast(_t(705,"Escribe los dígitos de la LPN (20, o 18 sin el 00 inicial)."));return;}
 const k=lpResolve(m,v);
 if(!k){P.UI.msg={t:"no",x:_t(706,"La LPN ")+lpFmt(v)+_t(707," no está en el Excel.")};dlg({title:_t(467,"LPN no encontrada"),body:P.UI.msg.x+_t(708," Revisa los dígitos o carga un Excel más reciente."),buttons:[{t:_t(27,"Entendido"),cls:"pri"}]});render();return;}
 lpSetLpn(m,k,"");}
function lpStart(m){const P=LP[m];P.CUR={id:uid(),lpn:"",at:Date.now(),status:"proceso",items:[],extras:[],lpnPh:"",det:null};P.UI.msg=null;P.UI.lpnTxt="";lpSave(m);render();window.scrollTo(0,0);}
function lpAdv(m){const P=LP[m],d=lpDet(m),its=P.CUR.items,N=its.length;d.tgt=-1;if(!N)return;const s=d.tgtPrev>=0?d.tgtPrev:-1;for(let k=1;k<=N;k++){const j=(s+k+N)%N;if(its[j].st==="pend"){d.tgt=j;return;}}}
function lpConfirm(m){
 const P=LP[m],d=lpDet(m),code=String(d.code||"").trim().toUpperCase(),lote=String(d.lote||"").trim().toUpperCase(),cnt=parseInt(d.cnt,10);
 if(!code||!lote){toast(_t(709,"Faltan el código y el lote."));return;}
 if(!/^\d+$/.test(String(d.cnt||"").trim())){toast(_t(710,"Escribe la cantidad de cajas."));return;}
 const its=P.CUR.items,same=its.filter(i=>vG(i.g)===vG(code)),ex=same.find(i=>nlot(i.l)===nlot(lote)),lots=new Set(its.map(i=>nlot(i.l)));
 const sysBad=same.filter(i=>lotSus(i.desc,i.l,i.g)),near=sysBad.find(i=>lotLev(i.l,lote)<=2),own=lotSus((same[0]||{}).desc,lote,code);
 if(!d.susOk&&(near||own)){const why=near?lotSus(near.desc,near.l,near.g):own;
  dlg({title:_t(711,"Verifica el lote"),body:(near?_t(712,"El sistema (PrIME) trae el lote ")+near.l+_t(713," para el código ")+code+_t(714,", y no corresponde al tipo de producto. ")+why+_t(715," El lote que capturaste es igual o muy parecido."):_t(716,"El lote que capturaste no corresponde al tipo de producto. ")+why)+_t(717," Compáralo letra por letra con la etiqueta física."),buttons:[{t:_t(504,"Revisar")},{t:_t(718,"Es correcto, continuar"),cls:"dg",fn:()=>{d.susOk=1;lpConfirm(m);}}]});return;}
 const via=((d.th||[]).length?"foto":"")+(d.man?((d.th||[]).length?_t(719," + manual"):"manual"):"")||"manual";
 const done=()=>{d.susOk=0;d.tgtPrev=d.tgt>=0?d.tgt:(ex?its.indexOf(ex):-1);d.code="";d.lote="";d.cnt="";d.th=[];d.man=0;d.chk=null;lpAdv(m);lpSave(m);render();};
 const th=(d.th||[]).slice(-1),dcn=d.chk?_t(720," · Doble check (")+via+")":"";
 const rec=(kind,txt)=>dlg({title:kind,body:txt,buttons:[{t:_t(721,"Corregir a mano")},{t:_t(465,"Volver a tomar foto"),fn:()=>lpRetake(m,"item")},{t:_t(722,"Registrar diferencia"),cls:"dg",fn:()=>{
   if(kind===_t(723,"Cantidad distinta")&&ex){ex.st="dif";ex.cnt=cnt;ex.ph=th;ex.via=via;ex.note=_t(724,"Cantidad: Excel ")+f2(ex.exp)+", contado "+cnt+dcn;}
   else P.CUR.extras.push({g:code,l:lote,cnt,ph:th,via,note:(kind===_t(725,"Lote distinto")?_t(726,"Lote distinto al Excel (Excel: ")+same.map(i=>i.l).join(", ")+")":_t(727,"Código que no está en la LPN"))+dcn});
   P.UI.msg={t:"no",x:_t(728,"Diferencia registrada: ")+kind+"."};done();}}]});
 if(ex){
  if(ex.st==="ok"){toast(_t(729,"Ese renglón ya estaba verificado."));return;}
  if(Math.abs(cnt-ex.exp)<.0005){ex.st="ok";ex.cnt=cnt;ex.ph=th;ex.note="";ex.via=via;if(lotSus(ex.desc,ex.l,ex.g)){ex.sw=1;}ex.dc=d.chk?1:0;P.UI.msg={t:"ok",x:_t(730,"Coincide con el Excel: código ")+ex.g+_t(731,", lote ")+ex.l+", "+cnt+_t(732," caja(s).")+(d.chk?_t(733," Doble check correcto."):"")};done();toast(_t(488,"Coincide con el Excel."));}
  else rec(_t(723,"Cantidad distinta"),_t(734,"Código ")+ex.g+_t(731,", lote ")+ex.l+_t(735,". Excel: ")+f2(ex.exp)+_t(736," · Tú contaste: ")+cnt+_t(737,". Vuelve a contar o registra la diferencia."));
  return;}
 const kind=same.length?_t(725,"Lote distinto"):_t(738,"Código fuera de la LPN"),bad=[];
 if(!same.length)bad.push("code");if(same.length||!lots.has(nlot(lote)))bad.push("lote");
 const what=bad.length>1?_t(739,"el código y el lote"):bad[0]==="code"?_t(740,"el código"):_t(741,"el lote");
 const hint=same.length?_t(742," En el Excel, el código ")+code+_t(743," lleva lote: ")+same.map(i=>i.l).join(", ")+".":_t(744," El código ")+code+_t(745," no está en la LPN.");
 if(!d.chk){d.chk={n:1,bad,x:_t(746,"⚠ Doble check: ")+what+_t(747," no coincide con el Excel.")+hint+_t(748," Toma otra foto o escríbelo a mano (si la caja está dañada o borrosa) y valida otra vez.")};lpSave(m);render();toast(_t(749,"Doble check: verifica ")+what+".");try{navigator.vibrate&&navigator.vibrate(120);}catch(e){}return;}
 rec(kind,(same.length?_t(750,"El código ")+code+_t(751," sí está en la LPN, pero el lote ")+lote+_t(752," no coincide. En el Excel: ")+same.map(i=>i.l).join(", ")+".":_t(750,"El código ")+code+_t(753," no está en la LPN ")+P.CUR.lpn+".")+_t(754," Ya se hizo el doble check (")+via+_t(755,"). Si es correcto lo que ves, registra la diferencia."));}
function lpExit(m){const P=LP[m];if(P.CUR&&!P.CUR.lpn){P.S=P.S.filter(x=>x.id!==P.CUR.id);}P.CUR=null;P.UI.msg=null;U.set(P.c.keys[1],P.S);U.set(P.c.keys[2],null);render();window.scrollTo(0,0);}
function lpFinish(m){
 const P=LP[m],pend=P.CUR.items.filter(i=>i.st==="pend"),go=()=>{pend.forEach(i=>{i.st="dif";i.note=_t(756,"No se verificó (faltante en la tarima)");});
  P.CUR.status=(P.CUR.items.some(i=>i.st!=="ok")||P.CUR.extras.length)?"dif":"ok";P.CUR.done=Date.now();lpSave(m);gstInc(m);render();window.scrollTo(0,0);};
 if(pend.length)dlg({title:_t(757,"Faltan por verificar"),body:pend.length+_t(758," renglón(es) de la LPN no se han verificado. Si finalizas, se marcarán como diferencia."),buttons:[{t:_t(759,"Seguir verificando")},{t:_t(760,"Finalizar así"),cls:"dg",fn:go}]});else go();}

/* ---- descargas: Excel y PDF ---- */
function lpExcel(m,list){
 if(typeof XLSX==="undefined"){toast(_t(638,"No se pudo cargar el lector de Excel."));return;}
 const P=LP[m],r=[["LPN",_t(59,"Código"),_t(99,"Lote"),_t(96,"Descripción"),_t(761,"Cant. Excel"),_t(762,"Cant. contada"),_t(184,"Resultado"),_t(763,"Nota"),_t(183,"Fecha")]];
 list.forEach(s=>{const f=new Date(s.done||s.upd||Date.now()).toLocaleString(_t(163,"es-MX"));(s.items||[]).forEach(i=>r.push([s.lpn,i.g,i.l,i.desc,i.exp,i.cnt==null?"":i.cnt,i.st==="ok"?"OK":i.st==="dif"?_t(186,"Diferencia"):_t(764,"Pendiente"),i.note||"",f]));(s.extras||[]).forEach(i=>r.push([s.lpn,i.g,i.l,"",0,i.cnt,_t(765,"Extra"),i.note||"",f]));});
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(r),P.c.name);
 saveBlob(P.c.name+"_LPN_"+today()+".xlsx",new Blob([XLSX.write(wb,{bookType:"xlsx",type:"array"})],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));}
function lpPdf(m,list){
 try{if(!window.jspdf){toast(_t(640,"No se pudo cargar el generador de PDF. Revisa tu conexión."));return;}
 const P=LP[m],{jsPDF}=window.jspdf,d=new jsPDF({unit:"mm",format:"a4"}),W=210,H=297,L=14,R=196,T=[32,79,95],B=[124,63,42],title=_t(766,"Reporte de ")+P.c.name;
 let y=0,pg=1;
 const head=()=>{d.setFillColor(...T);d.rect(0,0,W,22,"F");d.setFillColor(...B);d.rect(0,22,W,1.6,"F");d.setTextColor(255,255,255);d.setFont("helvetica","bold");d.setFontSize(16);d.text(title,L,14);d.setFont("helvetica","normal");d.setFontSize(8.5);d.text(_t(767,"Log-Cargo"),R,14,{align:"right"});y=32;};
 const foot=()=>{d.setFont("helvetica","normal");d.setFontSize(7);d.setTextColor(120,120,120);d.text("Log-Cargo | Desarrollado por M. Chagala Domínguez",L,H-8);d.text(_t(768,"Página ")+pg,R,H-8,{align:"right"});};
 const need=h=>{if(y+h>H-16){foot();d.addPage();pg++;head();}};
 const txt=(t,x,yy,o={})=>{d.setFont("helvetica",o.b?"bold":"normal");d.setFontSize(o.sz||9);d.setTextColor(...(o.c||[30,30,30]));d.text(String(t),x,yy,o.al?{align:o.al}:undefined);};
 head();
 const sess=list.filter(s=>s.lpn).sort((a,b)=>(a.at||0)-(b.at||0)),ok=sess.filter(s=>s.status==="ok").length,df=sess.filter(s=>s.status==="dif").length,pr=sess.length-ok-df;
 const who=ME?(ME.guest?_t(769,"Invitado")+(ME.nombre&&ME.nombre!==_t(769,"Invitado")?" · "+ME.nombre:""):ME.nombre+" "+ME.apellido+(ME.al?"":_t(770," · No. ")+ME.emp)):"";
 txt(_t(771,"Generado: ")+new Date().toLocaleString(_t(163,"es-MX")),L,y);y+=5;txt(_t(772,"Responsable: ")+who,L,y);y+=5;if(P.X){txt(_t(773,"Archivo de inventario: ")+P.X.name,L,y);y+=5;}y+=3;
 [[_t(774,"LPN revisadas"),sess.length,T],[_t(775,"Correctas"),ok,[47,143,107]],[_t(776,"Con diferencias"),df,[201,81,78]],[_t(777,"En proceso"),pr,[183,121,31]]].forEach((b,i)=>{const x=L+i*46;d.setFillColor(244,241,238);d.roundedRect(x,y,43,18,2,2,"F");txt(b[1],x+4,y+10,{b:1,sz:16,c:b[2]});txt(b[0],x+4,y+15,{sz:7.5,c:[90,90,90]});});
 y+=26;
 sess.forEach(s=>{
  const items=s.items||[],ex=s.extras||[];need(26+items.length*8);
  const stt=s.status==="ok"?_t(778,"CORRECTA"):s.status==="dif"?_t(779,"CON DIFERENCIAS"):_t(780,"EN PROCESO"),sc=s.status==="ok"?[47,143,107]:s.status==="dif"?[201,81,78]:[183,121,31];
  d.setFillColor(...T);d.rect(L,y,R-L,8,"F");txt("LPN "+lpFmt(s.lpn),L+3,y+5.5,{b:1,sz:10,c:[255,255,255]});txt(stt,R-3,y+5.5,{b:1,sz:8.5,c:[255,255,255],al:"right"});y+=8;
  txt(new Date(s.done||s.upd||s.at).toLocaleString(_t(163,"es-MX"))+" · "+items.filter(i=>i.st==="ok").length+_t(781," de ")+items.length+_t(782," renglones OK")+(ex.length?" · "+ex.length+_t(783," extra(s)"):"")+(s.aq?" · "+(s.aq.mode==="tot"?_t(784,"Inspección total"):"AQL General II"):"")+(s.sign?_t(785," · Inspeccionó: ")+s.sign.name:""),L,y+5,{sz:8,c:[90,90,90]});y+=8;
  const cx=[L,L+24,L+54,L+110,L+128,L+146],cl=[_t(59,"Código"),_t(99,"Lote"),_t(96,"Descripción"),"Excel",_t(786,"Contado"),_t(184,"Resultado")];
  d.setFillColor(232,236,238);d.rect(L,y,R-L,6,"F");cl.forEach((c,i)=>txt(c,cx[i]+1.5,y+4.2,{b:1,sz:7.5,c:[60,60,60]}));y+=6;
  const rowsAll=items.map(i=>({g:i.g,l:i.l,desc:i.desc||"",e:f2(i.exp),c:i.cnt==null?"—":i.cnt,r:i.st==="ok"?"OK":i.st==="dif"?_t(186,"Diferencia"):_t(764,"Pendiente"),note:i.note||(lotSus(i.desc,i.l,i.g)?_t(787,"Aviso: el lote del sistema no corresponde al tipo de producto (posible error de captura en PrIME)."):""),st:i.st})).concat(ex.map(i=>({g:i.g,l:i.l,desc:_t(788,"(no está en la LPN)"),e:0,c:i.cnt,r:_t(765,"Extra"),note:i.note||"",st:"dif"})));
  rowsAll.forEach((r,ri)=>{const dl=d.splitTextToSize(String(r.desc),52).slice(0,2),nl=r.note?d.splitTextToSize(r.note,R-L-4).slice(0,2):[],h=Math.max(6,dl.length*3.6+2)+(nl.length?nl.length*3.4+1:0);need(h);
   if(ri%2===0){d.setFillColor(249,248,246);d.rect(L,y,R-L,h,"F");}
   txt(r.g,cx[0]+1.5,y+4.2,{sz:8});txt(r.l,cx[1]+1.5,y+4.2,{sz:8});dl.forEach((x,k)=>txt(x,cx[2]+1.5,y+4.2+k*3.6,{sz:7.5}));txt(r.e,cx[3]+1.5,y+4.2,{sz:8});txt(r.c,cx[4]+1.5,y+4.2,{sz:8});
   txt(r.r,cx[5]+1.5,y+4.2,{b:1,sz:8,c:r.st==="ok"?[47,143,107]:[201,81,78]});
   nl.forEach((x,k)=>txt(x,L+2,y+Math.max(6,dl.length*3.6+2)+2.6+k*3.4,{sz:7.5,c:[201,81,78]}));y+=h;});
  const ph=[];if(s.lpnPh)ph.push(["LPN",s.lpnPh]);items.forEach(i=>{if(i.ph&&i.ph[0])ph.push([i.g,i.ph[0]]);});ex.forEach(i=>{if(i.ph&&i.ph[0])ph.push(["Extra "+i.g,i.ph[0]]);});
  if(ph.length){need(30);txt(_t(789,"Evidencia fotográfica"),L,y+5,{b:1,sz:8,c:[60,60,60]});y+=7;let x=L;ph.slice(0,12).forEach(p=>{if(x+30>R){x=L;y+=26;need(26);}try{d.addImage(p[1],"JPEG",x,y,28,20);}catch(e){}txt(String(p[0]).slice(0,16),x,y+23,{sz:6.5,c:[90,90,90]});x+=32;});y+=27;}
  y+=6;});
 if(!sess.length)txt(_t(790,"No hay LPN registradas para mostrar."),L,y+4);
 foot();saveBlob(P.c.name+_t(791,"_Reporte_")+today()+".pdf",d.output("blob"));gstInc("pdf");
 }catch(err){toast(_t(792,"No se pudo generar el PDF: ")+(err&&err.message||err));}}

/* ---- vistas ---- */
const rcvChip=s=>s==="ok"?'<span class="tg" style="background:var(--okb);color:var(--ok)">OK</span>':s==="dif"?_t(793,'<span class="tg" style="background:var(--erb);color:var(--er)">Diferencia</span>'):s==="dup"?_t(794,'<span class="tg" style="background:var(--erb);color:var(--er)">Para borrar</span>'):_t(795,'<span class="tg">Pendiente</span>');
function lpView(m){
 const P=LP[m],nm=P.c.name,X=P.X,M=`data-m="${m}"`;
 if(P.MAP)return lpMapView(m);
 const how=`<button type="button" class="btn txt" style="width:100%" data-help="${m}${_t(796,`">¿Cómo funciona `)}${nm}?</button>`;
 if(!X)return `${_t(797,`<div class="card"><h2 class="sh"><i>1</i>Excel de `)}${nm.toLowerCase()}</h2><p class="mu" style="margin:6px 0 12px;font-size:14px">${P.c.intro}${_t(798,` Se lee en tu teléfono y no se envía a ningún servidor.</p><label class="btn pri" for="`)}${P.c.file}${_t(799,`" style="display:block;text-align:center">Elegir archivo de Excel</label></div>`)}${how}`;
 const msg=P.UI.msg?`<div class="vbanner ${P.UI.msg.t==="ok"?"ok":"no"}" style="margin-bottom:12px;font-weight:600">${esc(P.UI.msg.x)}</div>`:"";
 const c=P.CUR;
 if(!c){
  const ses=P.S.filter(s=>s.lpn).sort((a,b)=>(b.upd||0)-(a.upd||0));
  return `${_t(800,`<div class="card"><h2 class="sh"><i>▤</i>Inventario cargado</h2><p class="mu" style="margin:6px 0 4px;font-size:14px">`)}${esc(X.name)} · ${lpIdx(m).size} LPN · ${X.rows.length}${_t(801,` filas</p><div class="row3"><button type="button" class="btn pri full" data-lr="new" `)}${M}${_t(802,`>Nueva LPN</button><label class="btn" for="`)}${P.c.file}${_t(803,`" style="text-align:center">Cambiar Excel</label>`)}${ses.length?`<button type="button" class="btn" data-lr="pdfall" ${M}${_t(804,`>Reporte PDF</button><button type="button" class="btn full" data-lr="expall" `)}${M}${_t(805,`>Descargar Excel</button>`)}`:""}${_t(806,`</div></div>
  <div class="card"><h2 class="sh"><i>≡</i>LPN registradas<em>`)}${ses.length}</em></h2>${ses.length?ses.map(s=>`<div class="vx"><div class="t"><b>${esc(lpFmt(s.lpn))}</b>${s.status==="proceso"?_t(369,'<span class="tg">En proceso</span>'):rcvChip(s.status)}</div><p style="margin:4px 0 0;font-size:12px;color:var(--mu)">${s.items.filter(i=>i.st==="ok").length}${_t(781,` de `)}${s.items.length}${_t(1009," verificados")}${s.extras.length?" · "+s.extras.length+_t(783," extra(s)"):""} · ${esc(new Date(s.upd||s.at).toLocaleString(_t(163,"es-MX"),{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}))}</p><div class="row3" style="margin-top:8px"><button type="button" class="btn" data-lr="open" data-id="${s.id}" ${M}>${s.status==="proceso"?_t(374,"Continuar"):_t(375,"Ver")}</button><button type="button" class="btn" data-lr="pdf1" data-id="${s.id}" ${M}${_t(807,`>PDF</button><button type="button" class="btn full" data-lr="del" data-id="`)}${s.id}" ${M}${_t(808,`>Eliminar</button></div></div>`)}`).join(""):_t(809,'<p class="mu" style="margin:8px 0 0;font-size:14px">Aún no hay LPN. Toca "Nueva LPN" para empezar.</p>')}</div>${how}`;}
 const ok=c.items.filter(i=>i.st==="ok").length;
 if(c.lpn&&c.status!=="proceso"){
  const good=c.status==="ok",bad=c.items.filter(i=>i.st!=="ok");
  return `<div class="vbanner ${good?"ok":"no"}">${good?_t(404,"✓ LPN correcta: todo coincide con el Excel."):_t(405,"LPN con diferencias. Revisa el detalle.")}</div>
  <div class="card"><h2 class="sh"><i>▤</i>LPN ${esc(lpFmt(c.lpn))}</h2><p class="mu" style="margin:4px 0 0;font-size:14px">${ok}${_t(781,` de `)}${c.items.length}${_t(782,` renglones OK`)}${c.extras.length?" · "+c.extras.length+_t(783," extra(s)"):""}</p>
  ${bad.map(i=>`<div class="vx"><div class="t"><b>${esc(i.g)}${_t(810,` · lote `)}${esc(i.l)}</b>${rcvChip(i.st)}</div><p style="margin:4px 0 0;font-size:13px">${esc(i.desc||"")}</p><p style="margin:4px 0 0;font-size:12px;color:var(--er)">${esc(i.note)}</p></div>`).join("")}
  ${c.extras.map(i=>`<div class="vx"><div class="t"><b>${esc(i.g)}${_t(810,` · lote `)}${esc(i.l)}${_t(811,`</b><span class="tg">Extra</span></div><p style="margin:4px 0 0;font-size:12px;color:var(--er)">`)}${esc(i.note)}${_t(812,` · contado `)}${esc(i.cnt)}</p></div>`).join("")}
  <div class="row3"><button type="button" class="btn pri full" data-lr="new" ${M}${_t(813,`>Siguiente LPN</button><button type="button" class="btn" data-lr="pdf1" data-id="`)}${c.id}" ${M}${_t(814,`>Reporte PDF</button><button type="button" class="btn" data-lr="xl1" `)}${M}${_t(815,`>Excel</button><button type="button" class="btn" data-lr="reopen" `)}${M}${_t(816,`>Reabrir</button><button type="button" class="btn" data-lr="exit" `)}${M}${_t(817,`>Ver lista</button></div></div>`)}`;}
 if(!c.lpn)return msg+`${_t(818,`<div class="card"><h2 class="sh"><i>1</i>Etiqueta de la LPN</h2><p class="mu" style="margin:6px 0 8px;font-size:14px">Toma foto de la etiqueta de la LPN o escríbela. Acepta los números con paréntesis y espacios, de 20 dígitos (o 18 sin el 00 del inicio). Se valida contra el Excel.</p>
  <label class="lb">LPN</label><div class="fld"><input data-rm="lpn" `)}${M}${_t(819,` inputmode="numeric" maxlength="40" placeholder="(00) 1003 7000 3106 0950 58" value="`)}${esc(P.UI.lpnTxt||"")}">${sb("L:"+m+":lpn")}</div>
  <div class="row3"><button type="button" class="btn pri" data-lr="lpnok" ${M}${_t(820,`>Validar LPN</button><button type="button" class="btn" data-lr="exit" `)}${M}${_t(821,`>Cancelar</button></div></div>`)}`;
const d=lpDet(m),its=c.items,N=its.length,ti=(d.tgt>=0&&its[d.tgt])?d.tgt:-1,T=ti>=0?its[ti]:null,np=its.filter(i=>i.st==="pend").length,ck=d.chk,bd=k=>ck&&ck.bad.indexOf(k)>=0?' style="border-color:var(--er);box-shadow:0 0 0 2px var(--erb)"':'';
 const nb=dir=>`<button type="button" class="btn" style="padding:8px 16px;font-size:18px" data-lr="nv" data-dir="${dir}" ${M} aria-label="${dir<0?_t(822,"Anterior"):_t(823,"Siguiente")}">${dir<0?"‹":"›"}</button>`;
 return msg+`<div class="card"><div class="t" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="font-size:17px">LPN ${esc(lpFmt(c.lpn))}${_t(824,`</b><span class="tg" style="background:var(--okb);color:var(--ok)">En el Excel</span></div>`)}${(()=>{const sb2=its.filter(i=>lotSus(i.desc,i.l,i.g));return sb2.length?`${_t(825,`<div class="vbanner no" style="margin:8px 0 0;font-weight:600">⚠ `)}${sb2.length}${_t(826,` renglón(es) con lote que no corresponde al tipo de producto (posible error de captura en PrIME): `)}${esc(sb2.map(i=>i.g).join(", "))}${_t(827,`. Verifica contra la etiqueta física.</div>`)}`:"";})()}<p class="mu" style="margin:6px 0 0;font-size:13px">${ok}${_t(781,` de `)}${N} verificados${c.extras.length?" · "+c.extras.length+_t(783," extra(s)"):""}${_t(828,`. Avance guardado automáticamente.</p>
  <div class="row3" style="margin-top:8px"><button type="button" class="btn" data-lr="back" `)}${M}${_t(829,`>‹ Cambiar LPN</button><button type="button" class="btn" data-lr="toend" `)}${M}${_t(830,`>Ir a finalizar ›</button></div></div>
 <div class="card" id="lpcard"><h2 class="sh"><i>2</i>Código y lote</h2>
  <div style="display:flex;align-items:center;gap:8px;margin:6px 0 4px">`)}${nb(-1)}<div style="flex:1;text-align:center;font-size:13px">${T?`${_t(831,`<b>Renglón `)}${ti+1}${_t(781,` de `)}${N}${_t(832,`</b><br><span class="mu">Busca: `)}${esc(T.g)}${_t(810,` · lote `)}${esc(T.l)}</span>${lotSus(T.desc,T.l,T.g)?`${_t(833,`<br><span style="color:var(--er);font-weight:600">⚠ Lote del sistema sospechoso: verifica la etiqueta</span>`)}`:""}`:`<b>${np}${_t(834,` renglón(es) por verificar</b><br><span class="mu">Usa ‹ › para ir uno por uno</span>`)}`}</div>${nb(1)}</div>
  ${ck?`<div class="vbanner no" style="margin:8px 0;font-weight:600">${esc(ck.x)}</div>`:`${_t(835,`<p class="mu" style="margin:6px 0 4px;font-size:14px">Toma foto donde se vean el código y el lote, o por separado si están lejos. También puedes escribirlos.</p>`)}`}${_t(836,`
  <div style="display:flex;align-items:center;gap:8px"><span style="font-weight:600">Foto</span>`)}${sb("L:"+m+":item")}${_t(837,`</div>
  <label class="lb">Código</label><input data-rd="code" `)}${M} inputmode="numeric" maxlength="8" placeholder="80XXXXXX" value="${esc(d.code)}"${bd("code")}${_t(838,`>
  <label class="lb">Lote</label><input data-rd="lote" `)}${M}${_t(839,` autocapitalize="characters" placeholder="10 caracteres" value="`)}${esc(d.lote)}"${bd("lote")}${_t(840,`>
  <label class="lb">Cantidad de cajas</label><input data-rd="cnt" `)}${M} inputmode="numeric" placeholder="0" value="${esc(d.cnt)}">
  ${(d.th||[]).length?`<div style="display:flex;gap:10px;margin-top:10px;align-items:flex-start;flex-wrap:wrap">${d.th.map((t,k)=>`<div style="position:relative"><img src="${t}" alt="" style="height:64px;border-radius:8px;border:1px solid var(--bd);display:block"><button type="button" data-lr="thx" data-i="${k}" ${M}${_t(841,` aria-label="Quitar foto" style="position:absolute;top:-8px;right:-8px;width:26px;height:26px;border-radius:50%;border:0;background:var(--er);color:#fff;font-size:15px;line-height:1;cursor:pointer">✕</button></div>`)}`).join("")}<button type="button" class="btn" style="padding:8px 12px;align-self:center" data-lr="rep" ${M}${_t(842,`>Borrar y repetir</button></div>`)}`:(d.code||d.lote?`<div style="margin-top:8px"><button type="button" class="btn" style="padding:8px 12px" data-lr="rep" ${M}${_t(842,`>Borrar y repetir</button></div>`)}`:"")}
  <div class="row3"><button type="button" class="btn pri full" data-lr="conf" ${M}>${ck?_t(843,"Validar de nuevo (doble check)"):_t(844,"Validar contra el Excel")}${_t(845,`</button></div></div>
 <div class="card"><h2 class="sh"><i>≡</i>Renglones de la LPN</h2>`)}${its.map((i,k)=>`<div class="vx"${k===ti?' style="border-color:var(--ac)"':""}><div class="t"><b>${esc(i.g)}</b>${rcvChip(i.st)}</div><p style="margin:4px 0 0;font-size:13px">${esc(i.desc||"")}${_t(846,`</p><p style="margin:2px 0 0;font-size:12px;color:var(--mu)">Lote `)}${esc(i.l)}${i.st==="pend"?"":_t(812," · contado ")+esc(i.cnt)+_t(781," de ")+f2(i.exp)}${i.via?" · "+esc(i.via)+(i.dc?_t(847," · doble check ✓"):""):""}</p>${i.note?`<p style="margin:2px 0 0;font-size:12px;color:var(--er)">${esc(i.note)}</p>`:""}${(i.ph||[]).length?`<img src="${i.ph[0]}" alt="" style="height:48px;margin-top:6px;border-radius:6px">`:""}<div class="row3" style="margin-top:6px">${i.st==="ok"?"":`<button type="button" class="btn" style="padding:6px 12px" data-lr="pick" data-i="${k}" ${M}${_t(848,`>Verificar este</button>`)}`}${i.st==="pend"?"":`<button type="button" class="btn dg" style="padding:6px 12px" data-lr="undo" data-i="${k}" ${M}${_t(849,`>Deshacer</button>`)}`}</div></div>`).join("")}
  ${c.extras.map((i,k)=>`<div class="vx"><div class="t"><b>${esc(i.g)}${_t(850,`</b><span class="tg">Extra</span></div><p style="margin:4px 0 0;font-size:12px;color:var(--er)">Lote `)}${esc(i.l)} · ${esc(i.note)}</p><div class="row3" style="margin-top:6px"><button type="button" class="btn dg" style="padding:6px 12px" data-lr="xdel" data-i="${k}" ${M}${_t(851,`>Quitar extra</button></div></div>`)}`).join("")}</div>
 <div class="row3" id="lpend"><button type="button" class="btn dk full" data-lr="fin" ${M}${_t(852,`>Finalizar LPN</button><button type="button" class="btn full" data-lr="exit" `)}${M}${_t(853,`>Guardar avance y salir</button></div>`)}`;}

/* ---- eventos ---- */
document.addEventListener("input",e=>{const t=e.target,d=t.dataset;if(!d||!d.m||!LP[d.m])return;const P=LP[d.m];
 if(d.rd&&P.CUR){let v=t.value;if(d.rd==="code"||d.rd==="cnt"){v=v.replace(/\D/g,"");if(v!==t.value)t.value=v;}lpDet(d.m)[d.rd]=v;if(d.rd==="code"||d.rd==="lote")lpDet(d.m).man=1;if(d.rd==="lote")lpDet(d.m).susOk=0;clearTimeout(P.RT);P.RT=setTimeout(()=>lpSave(d.m),300);}
 if(d.rm==="lpn"){const v=t.value.replace(/\D/g,"");if(v!==t.value)t.value=v;P.UI.lpnTxt=v;}});
document.addEventListener("change",e=>{const t=e.target,d=t.dataset;
 if(d.lm){const p=d.lm.split(":"),P=LP[p[0]];if(P&&P.MAP){P.MAP.map[p[1]]=t.value===""?undefined:+t.value;}}
 else if(d.lmh){const P=LP[d.lmh];if(P&&P.MAP){P.MAP.hdr=Math.max(0,Math.min(P.MAP.rows.length-1,(+t.value||1)-1));P.MAP.map=lpMap(P.MAP.rows[P.MAP.hdr]||[]);render();}}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-lr]");if(!b)return;const a=b.dataset.lr,m=b.dataset.m,id=b.dataset.id,P=LP[m];if(!P)return;
 if(a==="new")attGate(m,()=>lpStart(m));
 else if(a==="exit")lpExit(m);
 else if(a==="open"){P.CUR=P.S.find(x=>x.id===id)||null;P.UI.msg=null;U.set(P.c.keys[2],P.CUR?P.CUR.id:null);render();window.scrollTo(0,0);}
 else if(a==="del")dlgDel("LPN",_t(854,"este registro de la lista"),()=>{P.S=P.S.filter(x=>x.id!==id);U.set(P.c.keys[1],P.S);render();});
 else if(a==="lpnok")lpManual(m);
 else if(a==="conf")lpConfirm(m);
 else if(a==="fin")lpFinish(m);
 else if(a==="reopen"){P.CUR.status="proceso";P.UI.msg=null;lpSave(m);render();}
 else if(a==="xl1")lpExcel(m,[P.CUR]);
 else if(a==="expall")lpExcel(m,P.S.filter(s=>s.lpn));
 else if(a==="pdf1"){const s=P.S.find(x=>x.id===id)||P.CUR;if(s)lpPdf(m,[s]);}
 else if(a==="pdfall")lpPdf(m,P.S.filter(s=>s.lpn));
 else if(a==="mapok"){const mp=P.MAP.map,miss=LREQ.filter(x=>mp[x[0]]==null);if(miss.length){toast(_t(855,"Falta asignar: ")+miss.map(x=>x[1]).join(", ")+".");return;}lpBuild(m);}
 else if(a==="mapno"){P.MAP=null;render();}
 else if(a==="nv"&&P.CUR){const d=lpDet(m),N=P.CUR.items.length,dir=+b.dataset.dir;if(!N)return;d.tgt=d.tgt<0?(dir>0?0:N-1):(d.tgt+dir+N)%N;d.chk=null;render();}
 else if(a==="pick"&&P.CUR){const d=lpDet(m);d.tgt=+b.dataset.i;render();const e=document.getElementById("lpcard");if(e)window.scrollTo({top:Math.max(0,e.getBoundingClientRect().top+scrollY-70),behavior:"smooth"});}
 else if(a==="toend"){const e=document.getElementById("lpend");if(e)window.scrollTo({top:Math.max(0,e.getBoundingClientRect().top+scrollY-120),behavior:"smooth"});}
 else if(a==="undo"&&P.CUR){const it=P.CUR.items[+b.dataset.i];if(!it)return;dlg({title:_t(856,"Deshacer verificación"),body:_t(857,"El renglón ")+it.g+_t(810," · lote ")+it.l+_t(858," vuelve a pendiente y se borra su foto y su conteo."),buttons:[{t:_t(12,"Cancelar")},{t:_t(859,"Deshacer"),cls:"dg",fn:()=>{it.st="pend";it.cnt=null;it.ph=[];it.note="";it.via="";it.dc=0;P.CUR.status="proceso";lpSave(m);render();toast(_t(860,"Renglón pendiente otra vez."));}}]});}
 else if(a==="xdel"&&P.CUR){const k=+b.dataset.i,x=P.CUR.extras[k];if(!x)return;dlg({title:_t(861,"Quitar extra"),body:_t(862,"Se elimina el registro extra del código ")+x.g+_t(810," · lote ")+x.l+_t(863,". Úsalo si lo capturaste por error."),buttons:[{t:_t(12,"Cancelar")},{t:_t(656,"Quitar"),cls:"dg",fn:()=>{P.CUR.extras.splice(k,1);lpSave(m);render();toast(_t(864,"Extra eliminado."));}}]});}
 else if(a==="thx"&&P.CUR){const d=lpDet(m);d.th.splice(+b.dataset.i,1);lpSave(m);render();}
 else if(a==="rep"&&P.CUR){const d=lpDet(m);d.th=[];d.code="";d.lote="";d.man=0;lpSave(m);render();toast(_t(865,"Listo: repite la foto o escribe los datos."));}
 else if(a==="back"&&P.CUR){const c=P.CUR;if(c.items.every(i=>i.st==="pend")&&!c.extras.length){c.lpn="";c.items=[];c.det=null;c.lpnPh="";P.UI.lpnTxt="";P.UI.msg=null;lpSave(m);render();window.scrollTo(0,0);}
  else dlg({title:_t(866,"Salir de esta LPN"),body:_t(867,"Ya verificaste renglones. Tu avance queda guardado y puedes retomarlo desde Pendientes."),buttons:[{t:_t(868,"Seguir aquí")},{t:_t(869,"Guardar y salir"),cls:"pri",fn:()=>lpExit(m)}]});}});
$("#frcv").addEventListener("change",e=>lpPick("rcv",e));$("#fsur").addEventListener("change",e=>lpPick("sur",e));
