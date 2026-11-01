/* ===== Inicio, Más, Pendientes, Historial de todos los procesos, ayudas ===== */
let HLOG=[],HF="all",HLIM=30;
function hlogLoad(){HLOG=U.get("hlog",[]);if(!Array.isArray(HLOG))HLOG=[];}
function hlogAdd(o){HLOG.unshift(Object.assign({id:uid(),at:Date.now()},o));HLOG=HLOG.slice(0,100);U.set("hlog",HLOG);}
function hlogMerge(a){let n=0;(Array.isArray(a)?a:Object.values(a||{})).forEach(r=>{if(r&&r.id&&!HLOG.some(x=>x.id===r.id)){HLOG.push(r);n++;}});if(n){HLOG.sort((x,y)=>y.at-x.at);HLOG=HLOG.slice(0,100);U.set("hlog",HLOG);}return n;}

/* ===== Avisos de atención, procesos pendientes y marcas del administrador ===== */
let ATT={};
function attLoad(){ATT=U.get("att",{});if(!ATT||typeof ATT!=="object"||Array.isArray(ATT))ATT={};}
function attSave(){U.set("att",ATT);cloudSoon();gPush();}
function attList(){const a=[];Object.keys(LP).forEach(m=>LP[m].S.filter(s=>s.lpn&&s.status==="proceso").forEach(s=>a.push({id:s.id,m,t:LCFG[m].name+" · LPN "+lpFmt(s.lpn)})));
 REC.filter(r=>r.status==="pendiente").forEach(r=>a.push({id:r.id,m:"insp",t:"Maquila · folio "+r.folio}));return a;}
const attIs=id=>!!(ATT[id]&&ATT[id].att);
const attBadge=id=>attIs(id)?'<span class="bd" style="background:var(--erb);color:var(--er)">⚠ Atención</span>':(ATT[id]&&ATT[id].wn?'<span class="bd pend">aviso '+ATT[id].wn+' de 2</span>':'');
function attGate(m,go){
 const L=attList().filter(x=>x.m===m);if(!L.length){go();return;}
 const n=Math.max.apply(null,L.map(x=>(ATT[x.id]||{}).wn||0)),mark=()=>{L.forEach(x=>{const e=ATT[x.id]=ATT[x.id]||{wn:0};e.wn=Math.max(e.wn||0,2);e.att=1;e.at=e.at||Date.now();});attSave();};
 if(n>=2){mark();go();return;}
 L.forEach(x=>{const e=ATT[x.id]=ATT[x.id]||{wn:0};e.wn=n+1;});attSave();
 const lst=L.slice(0,5).map(x=>"• "+x.t).join("\n")+(L.length>5?"\n• y "+(L.length-5)+" más":"");
 if(n===0)dlg({title:"⚠ Aviso 1 de 2",body:"Tienes un proceso sin terminar:\n"+lst+"\n\nTermínalo antes de empezar otro. Si no se va a terminar, avísalo con el siguiente intento.",buttons:[{t:"Ver pendientes",cls:"pri",fn:()=>{TAB="pend";render();}},{t:"Entendido"}]});
 else dlg({title:"⚠ Aviso 2 de 2",body:"Sigue sin terminar:\n"+lst+"\n\nSi empiezas otro proceso, lo pendiente quedará marcado con ATENCIÓN y el administrador podrá verlo.",buttons:[{t:"Ver pendientes",fn:()=>{TAB="pend";render();}},{t:"Empezar otro",cls:"pri",fn:()=>{mark();go();}}]});}
/* lista compacta para el administrador (invitados) */
function attPl(){const a=[];Object.keys(LP).forEach(m=>LP[m].S.filter(s=>s.lpn).sort((x,y)=>(y.upd||0)-(x.upd||0)).slice(0,25).forEach(s=>a.push({m,k:s.lpn,id:s.id,st:s.status,ok:s.items.filter(i=>i.st==="ok").length,n:s.items.length,u:s.upd||s.at||0,w:(ATT[s.id]||{}).wn||0,a:attIs(s.id)?1:0})));
 REC.filter(r=>r.status==="pendiente"||r.status==="dup").slice(0,25).forEach(r=>a.push({m:"insp",k:r.folio,id:r.id,st:r.status,ok:0,n:0,u:r.upd||0,w:(ATT[r.id]||{}).wn||0,a:attIs(r.id)?1:0}));return a;}
let GPL="";
function gPush(){if(!ME||!ME.guest)return;const u=cloudCfg();if(!u||navigator.onLine===false)return;const g=gst(),pl=attPl(),sg=JSON.stringify(pl);if(sg===GPL)return;GPL=sg;g.pl=pl;g.last=Date.now();g.nm=ME.nombre||"";LS.set("cryd:g",g);
 try{fetch(u+"/cryd_guests/"+g.id+".json",{method:"PUT",body:JSON.stringify(Object.assign({ua:(navigator.userAgent.match(/iPhone|iPad|Android|Windows|Macintosh|Linux/)||["?"])[0]},g))}).catch(()=>{});}catch(e){}}
setInterval(()=>{try{gPush();}catch(e){}},45000);
/* marcas del administrador: "para borrar", restaurar, borrar definitivamente */
async function marksPull(){if(!ME)return;const u=cloudCfg();if(!u||navigator.onLine===false)return;
 const key=ME.guest?"g"+gst().id:"u"+ME.emp;let mk=null;try{mk=await fetch(u+"/cryd_marks/"+key+".json",{cache:"no-store"}).then(r=>r.ok?r.json():null);}catch(e){return;}
 if(!mk)return;let ch=false;
 Object.keys(mk).forEach(id=>{const k=mk[id];if(!k||!k.st)return;
  const arr=[["rcv",LP.rcv.S],["sur",LP.sur.S]];
  arr.forEach(([m,S])=>{const i=S.findIndex(x=>x.id===id);if(i<0)return;const s=S[i];if((k.at||0)<=(s.mk||0))return;
   if(k.st==="dup"&&s.status!=="dup"){s.prev=s.status;s.status="dup";s.mk=k.at;s.upd=Date.now();if(LP[m].CUR&&LP[m].CUR.id===id)LP[m].CUR=null;ch=true;}
   else if(k.st==="ok"&&s.status==="dup"){s.status=s.prev||"proceso";s.mk=k.at;s.upd=Date.now();ch=true;}
   else if(k.st==="del"){S.splice(i,1);if(LP[m].CUR&&LP[m].CUR.id===id)LP[m].CUR=null;ch=true;}
   if(ch){U.set(LP[m].c.keys[1],LP[m].S);U.set(LP[m].c.keys[2],LP[m].CUR?LP[m].CUR.id:null);}});
  const j=REC.findIndex(x=>x.id===id);if(j>=0){const r=REC[j];if((k.at||0)>(r.mk||0)){
   if(k.st==="dup"&&r.status!=="dup"){r.prev=r.status;r.status="dup";r.mk=k.at;r.upd=Date.now();ch=true;}
   else if(k.st==="ok"&&r.status==="dup"){r.status=r.prev||"pendiente";r.mk=k.at;r.upd=Date.now();ch=true;}
   else if(k.st==="del"){REC.splice(j,1);ch=true;}
   if(ch)saveRecs();}}});
 if(ch){cloudSoon();gPush();render();}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")marksPull();});
setInterval(()=>{if(document.visibilityState==="visible")marksPull();},90000);

const lpProc=()=>{const a=[];Object.keys(LP).forEach(m=>LP[m].S.filter(s=>s.lpn&&s.status==="proceso").forEach(s=>a.push({m,s})));return a.sort((x,y)=>(attIs(y.s.id)-attIs(x.s.id))||(y.s.upd||0)-(x.s.upd||0));};
const pendCount=()=>REC.filter(r=>r.status==="pendiente").length+lpProc().length;
const fdate=t=>new Date(t).toLocaleString("es-MX",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
const HELP={
 rcv:["Cómo funciona Recibo","1. Sube el Excel del inventario con las LPN.\n2. Toma foto de la etiqueta de la LPN. Los números con paréntesis y espacios no son problema.\n3. Toma foto del código y el lote de cada producto y escribe cuántas cajas hay. Las fotos quedan como evidencia.\n4. La app compara con el Excel y te avisa si hay diferencia de código, lote o cantidad. Puedes volver a tomar la foto, corregir a mano o registrar la diferencia.\n5. Finaliza la LPN y descarga el reporte en PDF. Puedes guardar el avance y seguir con otra LPN."],
 sur:["Cómo funciona Surtido","1. Sube el Excel del surtido con las LPN, códigos, lotes y cantidades.\n2. Toma foto de la etiqueta de la LPN.\n3. Toma foto del código y el lote de cada producto surtido y captura las cajas.\n4. La app valida contra el Excel y avisa cualquier diferencia.\n5. Finaliza la LPN y descarga el reporte en PDF. El avance queda guardado para seguir después."],
 val:["Cómo funciona Validación","1. Sube el inventario de SAP y el de PrIME, tal como los exportas.\n2. Asigna cada estatus de PrIME a Libre, Calidad o Ignorar (queda guardado).\n3. Compara: se revisa código, lote, planta, sloc, cantidades y estatus, sin importar el orden de las filas.\n4. Descarga el Excel con el detalle de las diferencias."],
 dash:["Cómo funciona Dashboards","1. Sube un archivo de Excel o CSV.\n2. Pide la información en el Constructor: qué medir, cómo agruparlo, qué filtrar y cómo verlo. O deja que la app arme un dashboard automático.\n3. Si prefieres, escribe una consulta tipo SQL o Google Query.\n4. Filtra todo el dashboard con un toque, guarda el diseño y descarga el reporte en PDF o Excel."]
};
function helpDlg(k){const h=HELP[k];if(!h)return;dlg({title:h[0],body:h[1],buttons:[{t:"Entendido",cls:"pri"}]});}
let HELPED="";
function firstHelp(){if(!ME||HELPED===TAB)return;HELPED=TAB;if(!HELP[TAB])return;const key="cryd:help:"+TAB;if(LS.get(key,0))return;LS.set(key,1);helpDlg(TAB);}
function resumeItem(){
 const hasDraft=!!(S&&(S.codigo||S.lots.some(l=>used(l))));
 const a=[];
 lpProc().slice(0,1).forEach(x=>a.push({t:LCFG[x.m].name+" · LPN "+lpFmt(x.s.lpn),s:x.s.items.filter(i=>i.st==="ok").length+" de "+x.s.items.length+" verificados",go:x.m,m:x.m,id:x.s.id}));
 if(hasDraft)a.push({t:"Maquila · folio "+(S.folio||"sin folio"),s:(S.codigo||"Sin código")+" · borrador",go:"insp"});
 return a[0]||null;}
const TILES=[["rcv","Recibo","Valida LPN, códigos y lotes contra el Excel"],["sur","Surtido","Valida lo surtido contra el Excel"],["val","Validación","Compara SAP contra PrIME"],["insp","Maquila","Formato de inspección con PDF"],["l3d","Layout 3D","Recorre el área de maquila"],["dash","Dashboards","Extrae información de tus archivos"],["pend","Pendientes","Lo que dejaste a medias"],["hist","Historial","Todos tus procesos"],["perfil","Perfil","Tema, sesión y respaldo"]];
function tileSub(k){
 if(k==="rcv"||k==="sur"){const p=LP[k],n=p.S.filter(s=>s.lpn&&s.status==="proceso").length,t=p.S.filter(s=>s.lpn).length;return t?t+" LPN"+(n?" · "+n+" en proceso":""):(p.X?"Excel cargado":"Sube tu Excel y empieza");}
 if(k==="val")return VAL.res?(VAL.res.D.length?VAL.res.D.length+" diferencias":"Todo OK"):"Compara SAP contra PrIME";
 if(k==="insp"){const n=REC.length;return n?n+" folio"+(n===1?"":"s")+" guardado"+(n===1?"":"s"):"Formato de inspección con PDF";}
 if(k==="dash")return DSH.length?DSH.length+" guardado"+(DSH.length===1?"":"s"):"Extrae información de tus archivos";
 if(k==="pend"){const n=pendCount();return n?n+" por terminar":"Nada pendiente";}
 if(k==="hist"){const n=REC.length+HLOG.length+Object.keys(LP).reduce((a,m)=>a+LP[m].S.filter(s=>s.lpn).length,0);return n?n+" registro"+(n===1?"":"s"):"Todos tus procesos";}
 return (TILES.find(x=>x[0]===k)||[0,0,""])[2];}
function viewHome(){
 const g=ME.guest,nm=g?(ME.nombre==="Invitado"?"":ME.nombre):ME.nombre,hr=new Date().getHours(),sal=hr<12?"Buenos días":hr<19?"Buenas tardes":"Buenas noches",r=resumeItem();
 let fd=new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"});fd=fd.charAt(0).toUpperCase()+fd.slice(1);
 return `${festHero()}<div class="hero"><p>${sal}${nm?",":""}</p><h1>${nm?esc(nm):"Bienvenido"}</h1><small>${esc(fd)}</small></div>
 ${r?`<button type="button" class="resume" ${r.m?`data-pgo="${r.m}:${r.id}"`:`data-tab="${r.go}"`}><span><small>Continuar donde ibas</small><b>${esc(r.t)}</b><em>${esc(r.s)}</em></span><i>›</i></button>`:""}
 <div class="tiles">${TILES.map((t,i)=>`<button type="button" class="tile" data-tab="${t[0]}"><span class="ti c${(i%2)+1}"><svg viewBox="0 0 24 24">${IC[t[0]]||IC.perfil}</svg></span><b>${t[1]}</b><small>${esc(tileSub(t[0]))}</small>${festOn()?`<span class="fi">${FA[["pump","mari","bat","pan","skull"][i%5]]}</span>`:""}${t[0]==="pend"&&pendCount()?`<span class="pb" style="top:12px;right:12px;left:auto">${pendCount()}</span>`:""}</button>`).join("")}</div>`;}
function viewMore(){
 const rows=[["l3d","Layout 3D",tileSub("l3d")],["dash","Dashboards",tileSub("dash")],["pend","Pendientes",tileSub("pend")],["hist","Historial",tileSub("hist")],["perfil","Perfil",tileSub("perfil")]];if(admOn())rows.push(["admin","Administrador","Cuentas e invitados"]);
 return `<div class="mrows">${rows.map(x=>`<button type="button" class="mrow" data-tab="${x[0]}"><span class="ti c${x[0]==="dash"||x[0]==="hist"?1:2}" style="width:38px;height:38px"><svg viewBox="0 0 24 24">${IC[x[0]]||IC.perfil}</svg></span><span style="flex:1"><b>${x[1]}</b><small>${esc(x[2])}</small></span><i>›</i></button>`).join("")}</div>`;}
const lpCard=(m,s,ac)=>{const ok=s.items.filter(i=>i.st==="ok").length,bd=s.status==="dup"?'<span class="bd" style="background:var(--erb);color:var(--er)">para borrar</span>':s.status==="proceso"?'<span class="bd pend">en proceso</span>'+attBadge(s.id):s.status==="ok"?'<span class="bd ok">correcta</span>':'<span class="bd" style="background:var(--erb);color:var(--er)">diferencias</span>';
 return `<div class="item"><div class="h"><b>${esc(lpFmt(s.lpn))}</b>${bd}<span style="margin-left:auto;color:var(--mu);font-size:13px">${esc(fdate(s.upd||s.at))}</span></div><p>${LCFG[m].name} · ${ok} de ${s.items.length} renglones OK${s.extras.length?" · "+s.extras.length+" extra(s)":""}</p>
 <div class="ac"><button type="button" class="btn ${s.status==="proceso"?"pri":""}" data-pgo="${m}:${s.id}">${s.status==="proceso"?"Continuar":"Abrir"}</button>${s.status==="proceso"?"":`<button type="button" class="btn" data-lr="pdf1" data-m="${m}" data-id="${s.id}">PDF</button>`}</div></div>`;};
function viewPend(){const lp=lpProc(),na=attList().filter(x=>attIs(x.id)).length;
 return `${na?`<div class="vbanner no" style="margin-bottom:12px;font-weight:600">⚠ ${na} proceso(s) sin terminar con atención. El administrador puede verlos. Termínalos o avisa si no se van a terminar.</div>`:""}${lp.length?`<div class="card"><h2 class="sh"><i>${lp.length}</i>LPN en proceso</h2><p style="margin:0;color:var(--mu);font-size:13px">Recibo y Surtido con renglones por verificar.</p>${lp.map(x=>lpCard(x.m,x.s)).join("")}</div>`:""}${viewPendMaq()}`;}
const HFS=[["all","Todo"],["rcv","Recibo"],["sur","Surtido"],["val","Validación"],["insp","Maquila"],["dash","Dashboards"]];
function logCard(h){const bd=h.st==="ok"?'<span class="bd ok">OK</span>':h.st==="dif"?'<span class="bd" style="background:var(--erb);color:var(--er)">diferencias</span>':'';
 return `<div class="item"><div class="h"><b>${esc(h.t)}</b>${bd}<span style="margin-left:auto;color:var(--mu);font-size:13px">${esc(fdate(h.at))}</span></div><p>${esc(h.s||"")}</p><div class="ac"><button type="button" class="btn dg" data-hdel="${h.id}">Quitar del historial</button></div></div>`;}
const dshCard=d=>`<div class="item"><div class="h"><b>${esc(d.name)}</b><span class="bd">dashboard guardado</span><span style="margin-left:auto;color:var(--mu);font-size:13px">${esc(fdate(d.upd))}</span></div><p>${d.w.length} bloques. Se llena al subir el archivo.</p><div class="ac"><button type="button" class="btn pri" data-ds="open" data-id="${d.id}">Abrir</button><button type="button" class="btn dg" data-ds="rm" data-id="${d.id}">Eliminar</button></div></div>`;
function viewHist(){
 const chips=`<div class="vc" style="margin-top:0">${HFS.map(f=>`<button type="button" class="${HF===f[0]?"on":""}" data-hf="${f[0]}">${f[1]}</button>`).join("")}</div>`;
 if(HF==="insp")return `<div class="card" style="padding:12px 16px 4px">${chips}</div>${viewHistMaq()}`;
 const E=[];
 if(HF==="all"||HF==="insp")REC.forEach(r=>E.push({at:r.upd||0,h:item(r)}));
 ["rcv","sur"].forEach(m=>{if(HF==="all"||HF===m)LP[m].S.filter(s=>s.lpn).forEach(s=>E.push({at:s.upd||s.at||0,h:lpCard(m,s)}));});
 HLOG.forEach(h=>{if(HF==="all"||HF===h.k)E.push({at:h.at,h:logCard(h)});});
 if(HF==="all"||HF==="dash")DSH.forEach(d=>E.push({at:d.upd||0,h:dshCard(d)}));
 E.sort((a,b)=>b.at-a.at);const shown=E.slice(0,HLIM);
 return `<div class="card" style="padding:12px 16px 14px">${chips}${shown.length?shown.map(x=>x.h).join(""):'<div class="emp">Aún no hay registros de este proceso.</div>'}${E.length>shown.length?`<div class="row3"><button type="button" class="btn full" data-hf="more">Mostrar más (${E.length-shown.length})</button></div>`:""}</div>`;}

/* ---- eventos ---- */
document.addEventListener("click",e=>{
 const g=e.target.closest("[data-pgo]");
 if(g&&g.dataset.pgo){const p=g.dataset.pgo.split(":"),P=LP[p[0]];if(P){const s=P.S.find(x=>x.id===p[1]);if(s){P.CUR=s;P.UI.msg=null;U.set(P.c.keys[2],s.id);TAB=p[0];render();window.scrollTo(0,0);return;}}}
 const h=e.target.closest("[data-help]");if(h){helpDlg(h.dataset.help);return;}
 const f=e.target.closest("[data-hf]");if(f){if(f.dataset.hf==="more")HLIM+=30;else{HF=f.dataset.hf;HLIM=30;}render();return;}
 const d=e.target.closest("[data-hdel]");if(d){HLOG=HLOG.filter(x=>x.id!==d.dataset.hdel);U.set("hlog",HLOG);render();}});
document.addEventListener("input",e=>{if(e.target.dataset&&e.target.dataset.gn!==undefined&&ME&&ME.guest){const v=e.target.value.trim().slice(0,30);ME.nombre=v?titleCase(v):"Invitado";LS.set("cryd:gname",v?titleCase(v):"");$("#who").textContent=initials(ME);}});


/* ===== Tema de temporada: Halloween y Día de Muertos ===== */
const FA={
 pump:'<svg viewBox="0 0 48 48"><rect x="22" y="5" width="5" height="9" rx="2" fill="#3f7d3a" transform="rotate(12 24 10)"/><ellipse cx="15" cy="29" rx="11" ry="14" fill="#e9791a"/><ellipse cx="33" cy="29" rx="11" ry="14" fill="#e9791a"/><ellipse cx="24" cy="29" rx="9" ry="15" fill="#f6932b"/><path d="M14 26l5 4-6 1zM34 26l-5 4 6 1zM24 31l-3 5h6zM15 38q9 6 18 0l-3-2-3 2-3-2-3 2-3-2z" fill="#3b1f4a"/></svg>',
 bat:'<svg viewBox="0 0 48 48"><path d="M24 14l3 4 5-2 2 5 12-9-3 14-5-1-3 8-4-5-3 6-3-6-4 5-3-8-5 1-3-14 12 9 2-5 5 2z" fill="#3b1f4a"/><circle cx="21" cy="21" r="1.3" fill="#ffd25a"/><circle cx="27" cy="21" r="1.3" fill="#ffd25a"/></svg>',
 mari:'<svg viewBox="0 0 48 48"><g transform="translate(24 24)">'+[0,36,72,108,144,180,216,252,288,324].map(a=>'<ellipse cx="0" cy="-12" rx="6" ry="10" fill="#f59a00" transform="rotate('+a+')"/>').join('')+[18,54,90,126,162,198,234,270,306,342].map(a=>'<ellipse cx="0" cy="-8" rx="4.5" ry="7.5" fill="#ffc22e" transform="rotate('+a+')"/>').join('')+'<circle r="5" fill="#d97700"/></g></svg>',
 pan:'<svg viewBox="0 0 48 48"><ellipse cx="24" cy="30" rx="19" ry="13" fill="#d99a52"/><ellipse cx="24" cy="27" rx="17" ry="11" fill="#e8b36a"/><path d="M9 24q15-8 30 0M12 33q12-8 24 0M20 17q-4 12 0 22M28 17q4 12 0 22" stroke="#f6dcae" stroke-width="3.6" stroke-linecap="round" fill="none"/><circle cx="24" cy="16" r="4.6" fill="#f6dcae"/><g fill="#fff"><circle cx="15" cy="30" r="1"/><circle cx="33" cy="30" r="1"/><circle cx="28" cy="25" r="1"/><circle cx="19" cy="24" r="1"/></g></svg>',
 skull:'<svg viewBox="0 0 48 48"><path d="M24 5c11 0 18 7 18 17 0 6-3 9-6 11v7H12v-7c-3-2-6-5-6-11C6 12 13 5 24 5z" fill="#fbf6ec" stroke="#3b1f4a" stroke-width="1.6"/><circle cx="16" cy="23" r="5.2" fill="#7a3fa6"/><circle cx="32" cy="23" r="5.2" fill="#7a3fa6"/><circle cx="16" cy="23" r="2.4" fill="#ff6fa5"/><circle cx="32" cy="23" r="2.4" fill="#ff6fa5"/><path d="M24 29l-2.6 4h5.2z" fill="#3b1f4a"/><path d="M15 38v-4M20 38v-4M24 38v-4M28 38v-4M33 38v-4" stroke="#3b1f4a" stroke-width="1.4"/><circle cx="24" cy="11" r="2" fill="#f59a00"/><circle cx="14" cy="14" r="1.6" fill="#ff6fa5"/><circle cx="34" cy="14" r="1.6" fill="#ff6fa5"/></svg>',
 web:'<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M0 0L100 0M0 0L0 100M0 0L90 55M0 0L55 90M0 0L100 28M0 0L28 100"/><path d="M20 0Q16 16 0 20M42 0Q34 34 0 42M64 0Q52 52 0 64M86 0Q70 70 0 86"/></svg>'};
const fenc=s=>'url("data:image/svg+xml,'+encodeURIComponent(s)+'")';
function festArt(){
 const fl=(c,x)=>`<path d="M${x+2} 2H${x+22}V20L${x+12} 29L${x+2} 20Z M${x+12} 7l4 4-4 4-4-4z" fill="${c}" fill-rule="evenodd"/>`;
 const pic='<svg xmlns="http://www.w3.org/2000/svg" width="120" height="32" viewBox="0 0 120 32"><path d="M0 2Q30 6 60 2T120 2" stroke="#7c3f2a" stroke-width="1.2" fill="none"/>'+[["#f08a1c",0],["#8a3fb5",24],["#ff6fa5",48],["#ffc22e",72],["#2a8aa0",96]].map(a=>fl(a[0],a[1])).join("")+'</svg>';
 const inner=k=>FA[k].replace('<svg viewBox="0 0 48 48">','').replace('</svg>','');
 const gar='<svg xmlns="http://www.w3.org/2000/svg" width="176" height="34" viewBox="0 0 176 34"><path d="M0 8Q22 14 44 8T88 8T132 8T176 8" stroke="#7c3f2a" stroke-width="1.2" fill="none"/>'+[["mari",0],["pump",44],["mari",88],["pan",132]].map(a=>`<svg x="${a[1]+6}" y="4" width="30" height="30" viewBox="0 0 48 48">${inner(a[0])}</svg>`).join("")+'</svg>';
 const r=document.documentElement.style;r.setProperty("--picado",fenc(pic));r.setProperty("--garland",fenc(gar));}
const festPref=()=>LS.get("cryd:fest","");
function festOn(){const p=festPref();if(p==="on")return true;if(p==="off")return false;const d=new Date(),m=d.getMonth(),n=d.getDate();return (m===9&&n>=20)||(m===10&&n<=3);}
function festTitle(){const d=new Date(),m=d.getMonth(),n=d.getDate();if(m===10&&n<=3)return "¡Feliz Día de Muertos!";if(m===9&&n===31)return "¡Feliz Halloween y Día de Muertos!";if(m===9||m===10)return "Halloween y Día de Muertos";return "Halloween y Día de Muertos";}
let FESTART=false;
function festApply(){const on=festOn();document.body.classList.toggle("fest",on);let e=document.getElementById("fest");
 if(!on){if(e)e.remove();return;}
 if(!FESTART){festArt();FESTART=true;}
 if(!e){e=document.createElement("div");e.id="fest";e.setAttribute("aria-hidden","true");
  e.innerHTML=`<i class="web w1">${FA.web}</i><i class="web w2">${FA.web}</i><i class="bt b1">${FA.bat}</i><i class="bt b2">${FA.bat}</i><i class="bt b3">${FA.bat}</i>`;document.body.appendChild(e);}}
function festHero(){return festOn()?`<div class="fhero"><span>${FA.pump}</span><span>${FA.bat}</span><span>${FA.skull}</span><span>${FA.mari}</span><span>${FA.pan}</span></div><div class="ftit">${festTitle()}</div>`:"";}
function festPerfil(){const p=festPref()||"auto",o=[["auto","Automático"],["on","Activado"],["off","Apagado"]];
 return `<div class="card"><h2 class="sh"><i>🎃</i>Tema de temporada</h2><p class="mu" style="margin:6px 0 10px;font-size:14px">Calabazas, murciélagos, telarañas, cempasúchil y pan de muerto. En automático se activa del 20 de octubre al 3 de noviembre.</p><div class="vc" style="margin-top:0">${o.map(x=>`<button type="button" class="${p===x[0]?"on":""}" data-fest="${x[0]}">${x[1]}</button>`).join("")}</div></div>`;}
document.addEventListener("click",e=>{const b=e.target.closest("[data-fest]");if(!b)return;LS.set("cryd:fest",b.dataset.fest==="auto"?"":b.dataset.fest);festApply();render();});
{const _r=render;render=function(){_r.apply(this,arguments);try{festApply();}catch(e){}};}

/* ===== Layout 3D (sección + presentación al entrar, una vez al día por usuario) ===== */
IC.l3d='<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>';
const l3dTheme=()=>{const t=LS.get("cryd:theme","system");return t==="light"||t==="dark"?"&t="+t:"";};
function viewL3d(){return `<div class="l3dw"><iframe id="l3df" title="Layout 3D de la maquila CRyD" src="layout3d.html#emb${l3dTheme()}" loading="lazy" style="height:1100px"></iframe></div><p class="mu" style="font-size:12px;margin:8px 0 0">Arrastra para girar, pellizca para acercar. Medidas estimadas.</p>`;}
const l3dSpOn=()=>LS.get("cryd:l3dsp","on")!=="off";
function l3dPerfil(){return `<div class="card"><h2 class="sh">Presentación del layout</h2><p class="mu" style="margin:6px 0 12px;font-size:14px">Al abrir la app por primera vez en el día se muestra unos segundos el layout 3D. Puedes saltarla con un toque.</p><button type="button" class="btn" style="width:100%" data-l3d="tog">${l3dSpOn()?"Activada · tocar para desactivar":"Desactivada · tocar para activar"}</button></div>`;}
let L3DSHOWN=false,L3DTM=0;
function l3dClose(){const o=document.getElementById("l3dsp");clearTimeout(L3DTM);if(!o)return;const f=o.querySelector("iframe");if(f)f.src="about:blank";o.classList.add("out");setTimeout(()=>{try{o.remove();}catch(e){}},260);}
function l3dMaybe(){
 if(L3DSHOWN||!ME||!l3dSpOn())return;
 const day=new Date().toLocaleDateString("sv-SE"),key="cryd:l3dday:"+ME.emp;
 if(LS.get(key,"")===day){L3DSHOWN=true;return;}
 L3DSHOWN=true;
 try{if(matchMedia("(prefers-reduced-motion:reduce)").matches||(navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2))return;}catch(e){}
 LS.set(key,day);
 setTimeout(()=>{if(document.getElementById("l3dsp")||!ME)return;
  const o=document.createElement("div");o.id="l3dsp";
  o.innerHTML=`<iframe title="Layout 3D" src="layout3d.html#splash${l3dTheme()}"></iframe><div class="l3t"><b>Procesos CRyD</b><span>Maquila CRyD · Layout 3D</span></div><button type="button" class="btn pri l3b" data-l3d="skip">Entrar</button><i class="l3p"></i>`;
  document.body.appendChild(o);L3DTM=setTimeout(l3dClose,5500);},700);}
document.addEventListener("click",e=>{const b=e.target.closest("[data-l3d]");if(!b)return;
 if(b.dataset.l3d==="skip")l3dClose();
 else if(b.dataset.l3d==="tog"){LS.set("cryd:l3dsp",l3dSpOn()?"off":"on");render();}});
window.addEventListener("message",e=>{if(e.origin!==location.origin||!e.data)return;
 if(e.data.l3d==="nogl")l3dClose();
 if(e.data.l3dh){const f=document.getElementById("l3df");if(f&&e.source===f.contentWindow)f.style.height=Math.min(3000,e.data.l3dh)+"px";}});
{const _r3=render;render=function(){_r3.apply(this,arguments);try{l3dMaybe();}catch(e){}};}
