

const CRIT=[["Producto limpio, sin derrame"],["Empaque de producto dañado"],["Código físico corresponde con IPS"],["Lote corresponde con IPS"],["Fecha de expiración vigente"],["Producto en corrugado completo"],["Producto en caja corresponde con código y lote"],["Información de producto legible"],["Corrugado sin daño"],["Caja correctamente cerrada"],["Tarima libre de fauna, limpia y sin daño"],["Cumple estiba y emplayado de tarima"]];
const tipo=n=>n<2?"Crítico (AQL 0.010)":n<9?"Mayor (AQL 0.040)":"Menor (AQL NA)";
const GR=[[0,2,"Crítico","AQL 0.010"],[2,9,"Mayor","AQL 0.040"],[9,12,"Menor","AQL NA"]];
const MES=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const $=s=>document.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const clone=o=>JSON.parse(JSON.stringify(o));
const fmtF=f=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(f||"");return m?(+m[3])+" "+MES[+m[2]-1]+" "+m[1].slice(2):(f||"");};
const today=()=>{const d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());};
const mesKey=f=>(f||"").slice(0,7);
const mesName=k=>{const p=k.split("-");return (MESES[+p[1]-1]||k)+" "+p[0];};
const isNA=t=>/^\s*(n\s*[\/.\-]?\s*a\.?|no\s+aplica)\s*$/i.test(String(t||""));
const cs=v=>/^\d+$/.test(String(v||"").trim())?String(v).trim()+" CS":(v||"");
const defects=l=>l.res.reduce((a,r)=>a+(parseInt(r,10)||0),0);
const used=l=>!!(l.lote||l.cant||l.muestra||l.ac||l.re||(l.obs&&!isNA(l.obs))||l.res.some(r=>r!==""));
const lotState=l=>!used(l)?"":l.res.some(r=>r!=="")?"ok":"pend";
const blankLot=()=>({lote:"",cant:"",muestra:"",ac:"",re:"",res:Array(12).fill(""),obs:"",dict:""});
function auto(l){const re=parseInt(l.re,10);if(!isNaN(re)&&l.res.some(r=>r!==""))l.dict=defects(l)>=re?"Rechazado":"Liberado";}
const normCod=t=>{const m=String(t||"").toUpperCase().replace(/[\s-]/g,"").replace(/O/g,"0").match(/80\d{6}/);return m?m[0]:"";};
const normLote=t=>{const x=String(t||"").toUpperCase().replace(/[^A-Z0-9]/g,"");if(/^[A-Z0-9]{11}$/.test(x)&&x.endsWith("R"))return x;const m=x.match(/[A-Z0-9]{10}/);return m?m[0]+"R":"";};
const parseFolio=f=>{const x=/^R(\d{1,2})-(\d{1,3})$/i.exec((f||"").trim());return x?{m:+x[1],n:+x[2]}:null;};

/* ---------- almacenamiento local (por navegador) ---------- */
let STORE_OK=true;const MEM={};
try{localStorage.setItem("cryd:t","1");localStorage.removeItem("cryd:t");}catch(e){STORE_OK=false;}
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return k in MEM?MEM[k]:d;}},set(k,v){MEM[k]=v;try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}};
let REC=[];
let WARN={dup:{},del:{}};
const saveRecs=()=>U.set("rec",REC),saveWarn=()=>U.set("warn",WARN);
let S,TAB="insp",HQ="",TARGET="codigo",STREAM=null,PV=null,TT=0,DT=0;

function nextFolio(fecha){const f=fecha||today(),m=+f.slice(5,7),y=f.slice(0,4);let mx=0;REC.forEach(r=>{if(String(r.mes).slice(0,4)!==y)return;const p=parseFolio(r.folio);if(p&&p.m===m&&p.n>mx)mx=p.n;});return "R"+m+"-"+pad(mx+1);}
function newForm(){S={id:uid(),fecha:today(),folio:"",codigo:"",desc:"",nivel:"General Nivel II",muestreo:"Normal",act:0,lots:[0,1,2,3,4].map(blankLot)};S.folio=nextFolio(S.fecha);saveDraft();}
function saveDraft(){if(!ME||!S)return;U.set("draft",S);}
function draftSoon(){clearTimeout(DT);DT=setTimeout(saveDraft,400);}

/* ---------- avisos ---------- */
function toast(t){const e=$("#toast");e.textContent=t;e.hidden=false;clearTimeout(TT);TT=setTimeout(()=>e.hidden=true,3200);}
let BT=0;
function busy(t,cancel){const e=$("#busy");clearTimeout(BT);if(!t){e.hidden=true;e.className="";e.textContent="";return;}
 e.className=cancel?"can":"";e.textContent="";const sp=document.createElement("span");sp.textContent=t;e.appendChild(sp);
 if(cancel){const b=document.createElement("button");b.type="button";b.textContent="Cancelar";b.onclick=()=>{busy("");try{cancel();}catch(x){}};e.appendChild(b);}
 e.hidden=false;BT=setTimeout(()=>{busy("");toast("Tardó demasiado. Inténtalo de nuevo o captura a mano.");},90000);}
function dlg(o){$("#dlgT").textContent=o.title;$("#dlgB").textContent=o.body;const bx=$("#dlgBtns");bx.innerHTML="";o.buttons.forEach(b=>{const e=document.createElement("button");e.type="button";e.textContent=b.t;e.className="btn "+(b.cls||"");e.onclick=()=>{$("#dlg").hidden=true;if(b.fn)b.fn();};bx.appendChild(e);});$("#dlg").hidden=false;}
function dupGuard(next){
 const f=(S.folio||"").trim().toUpperCase();if(!f){toast("Captura o genera el folio primero.");return;}
 const mk=mesKey(S.fecha);
 if(!REC.some(r=>r.id!==S.id&&r.mes===mk&&String(r.folio).toUpperCase()===f)){next();return;}
 const k=mk+"|"+f,n=Math.min((WARN.dup[k]||0)+1,3);WARN.dup[k]=n;saveWarn();
 if(n<3)dlg({title:"Folio duplicado · advertencia "+n+" de 3",body:"El folio "+f+" ya existe en "+mesName(mk)+". Corrige el folio. A la tercera advertencia podrás continuar.",buttons:[{t:"Corregir folio",cls:"pri"}]});
 else dlg({title:"Folio duplicado · advertencia 3 de 3",body:"El folio "+f+" ya existe en "+mesName(mk)+". Si continúas, quedará duplicado.",buttons:[{t:"Corregir folio"},{t:"Continuar de todos modos",cls:"dg",fn:next}]});
}
function delGuard(id){
 const r=REC.find(x=>x.id===id);if(!r)return;const n=Math.min((WARN.del[id]||0)+1,3);WARN.del[id]=n;saveWarn();
 if(n<3)dlg({title:"Eliminar folio · advertencia "+n+" de 3",body:"Eliminar "+r.folio+" es permanente. No se eliminó. Podrás hacerlo en la tercera advertencia.",buttons:[{t:"Entendido",cls:"pri"}]});
 else dlg({title:"Eliminar folio · advertencia 3 de 3",body:"¿Eliminar "+r.folio+" de forma permanente?",buttons:[{t:"Cancelar"},{t:"Eliminar",cls:"dg",fn:()=>{REC=REC.filter(x=>x.id!==id);delete WARN.del[id];WARN.gone=WARN.gone||{};WARN.gone[id]=1;saveRecs();saveWarn();toast("Folio "+r.folio+" eliminado.");render();}}]});
}

/* ---------- guardar / retomar ---------- */
function saveRec(status){
 S.folio=(S.folio||"").trim().toUpperCase();
 const rec={id:S.id,folio:S.folio,fecha:S.fecha,mes:mesKey(S.fecha),status,upd:Date.now(),by:ME?ME.emp:"",data:clone(S)};
 const i=REC.findIndex(r=>r.id===S.id);if(i>=0)REC[i]=rec;else REC.push(rec);
 const ok=saveRecs();saveDraft();return ok;
}
function load(id){const r=REC.find(x=>x.id===id);if(!r)return;S=clone(r.data);S.id=r.id;S.act=Math.max(0,S.lots.findIndex(l=>lotState(l)==="pend"));saveDraft();TAB="insp";render();window.scrollTo(0,0);toast("Folio "+r.folio+" cargado.");}
function actPend(){if(!S.fecha){toast("Falta la fecha.");return;}dupGuard(()=>{const ok=saveRec("pendiente");toast(ok?"Folio "+S.folio+" guardado como pendiente.":"Guardado solo en esta sesión: el navegador no permite almacenar.");render();});}
function actFin(){if(!S.codigo.trim()){toast("Falta el código.");return;}if(!S.lots.some(l=>used(l)&&l.lote)){toast("Captura al menos un lote.");return;}dupGuard(()=>{const ok=saveRec("completo");render();dlg({title:"Folio "+S.folio+" guardado",body:ok?"Quedó como completo. ¿Quieres generar el PDF para imprimir?":"Guardado solo en esta sesión: el navegador no permite almacenar. ¿Generar el PDF ahora?",buttons:[{t:"Cerrar"},{t:"Generar PDF",cls:"pri",fn:()=>runPdf(S)}]});});}
function runPdf(d){try{makePdf(d);gstInc("pdf");}catch(err){toast("No se pudo generar el PDF: "+(err&&err.message||err));}}
function actPdf(){dupGuard(()=>runPdf(S));}
async function saveBlob(name,blob){
 try{if(window.claude&&claude.use){try{const dl=await claude.use("downloads");if(dl){await dl.save({filename:name,data:blob});toast("Archivo listo: "+name);return;}}catch(e){if(e&&e.code==="declined")return;}}
  const file=new File([blob],name,{type:blob.type||"application/octet-stream"});
  if(/\.pdf$/i.test(name)&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:name});toast("PDF listo.");return;}catch(e){if(e&&e.name==="AbortError")return;}}
  const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(u);},4000);toast("Archivo listo: "+name);
 }catch(e){toast("No se pudo guardar el archivo.");}}
function exportRecs(list,name){saveBlob(name,new Blob([JSON.stringify({app:"inspeccion-cryd",version:1,records:list})],{type:"application/json"}));}

/* ---------- vistas ---------- */
const sb=t=>`<button type="button" class="ico" data-scan="${t}" data-src="cam" aria-label="Tomar foto"><img src="${IC_CAM}" alt=""><span>Tomar foto</span></button><label class="ico" data-scan="${t}" data-src="gal" for="gal" aria-label="Cargar foto"><img src="${IC_GAL}" alt=""><span>Cargar foto</span></label>`;
const fld=(lb,attr,val,o={})=>`<label class="lb">${lb}</label><div class="fld"><input ${attr} value="${esc(val)}"${o.ph?` placeholder="${o.ph}"`:""}${o.im?` inputmode="${o.im}"`:""}>${o.suf?`<span class="suf">${o.suf}</span>`:""}${o.scan?sb(o.scan):""}${o.extra||""}</div>`;
const chips=()=>S.lots.map((x,i)=>`<button type="button" class="chip ${i===S.act?"on":""}" data-lot="${i}"><span class="dot ${lotState(x)}"></span>Lote ${i+1}<i>${esc(x.lote)||"—"}</i></button>`).join("");
function viewInsp(){
 const l=S.lots[S.act],r=REC.find(x=>x.id===S.id),st=r?r.status:"";
 return `<div class="st"><span class="fo">${esc(S.folio)||"Sin folio"}</span><span class="bd ${st==="pendiente"?"pend":st==="completo"?"ok":""}">${st||"Borrador"}</span><button type="button" class="btn" style="margin-left:auto;padding:8px 12px" data-a="new">Nuevo folio</button></div>
 <div class="card"><h2 class="sh"><i>1</i>Folio y producto</h2>
  <div class="two" style="grid-template-columns:1fr"><div><label class="lb">Fecha</label><input type="date" data-k="fecha" value="${esc(S.fecha)}"></div><div><label class="lb">Folio</label><div class="fld"><input data-k="folio" value="${esc(S.folio)}" placeholder="R10-01"><button type="button" class="auto" data-a="autofolio">Auto</button></div></div></div>
  ${fld("Código","data-k=\"codigo\"",S.codigo,{scan:"codigo",im:"numeric",ph:"80XXXXXX"})}
  ${fld("Descripción del producto","data-k=\"desc\"",S.desc,{scan:"desc",ph:"Ej. Toalla femenina 30 pzas"})}
  <div class="two"><div><label class="lb">Nivel de inspección</label><input data-k="nivel" value="${esc(S.nivel)}"></div><div><label class="lb">Tipo de muestreo</label><input data-k="muestreo" value="${esc(S.muestreo)}"></div></div></div>
 <div class="card"><h2 class="sh"><i>2</i>Lotes<em>máx. 5 por folio</em></h2><div class="chips" id="chips">${chips()}</div>
  ${fld("Lote "+(S.act+1),"data-l=\"lote\"",l.lote,{scan:"lote"})}
  <div class="two"><div>${fld("Cantidad","data-l=\"cant\"",l.cant,{im:"numeric",suf:"CS"})}</div><div>${fld("Tamaño de muestra","data-l=\"muestra\"",l.muestra,{im:"numeric"})}</div></div>
  <div class="two"><div>${fld("Ac (ANSI Z1.4)","data-l=\"ac\"",l.ac,{im:"numeric"})}</div><div>${fld("Re (ANSI Z1.4)","data-l=\"re\"",l.re,{im:"numeric"})}</div></div></div>
 <div class="card"><h2 class="sh"><i>3</i>Criterios · Lote ${S.act+1}<em>número de defectos</em></h2>
  ${GR.map(g=>`<div class="grp">${g[2]}<span>${g[3]}</span></div>`+CRIT.slice(g[0],g[1]).map((c,j)=>{const i=g[0]+j;return `<div class="crit"><p><b>${i+1}</b>${c[0]}</p><input class="num" inputmode="numeric" data-r="${i}" value="${esc(l.res[i])}" placeholder="—"></div>`;}).join("")).join("")}
  <div class="row3"><button type="button" class="btn" data-a="all0">Todo en 0</button><button type="button" class="btn" data-a="clr">Limpiar lote</button></div>
  <div class="tot"><span>Total de defectos</span><span id="tot">${defects(l)}</span></div></div>
 <div class="card"><h2 class="sh"><i>4</i>Cierre del lote ${S.act+1}</h2>
  <label class="lb">Observaciones</label><textarea rows="3" data-l="obs">${esc(l.obs)}</textarea>
  <label class="lb">Dictamen</label><select data-l="dict">${["","Liberado","Rechazado"].map(o=>`<option ${l.dict===o?"selected":""}>${o}</option>`).join("")}</select></div>
 <div class="card"><h2 class="sh"><i>5</i>Guardar</h2>
  <p style="margin:0 0 4px;color:var(--mu);font-size:13px">Lotes sin captura salen con diagonal NA y *. La firma manual va en el * al final de la hoja.</p>
  <div class="row3"><button type="button" class="btn" data-a="pend">Dejar pendiente</button><button type="button" class="btn dk" data-a="fin">Finalizar y guardar</button><button type="button" class="btn pri full" data-a="pdf">Generar PDF</button></div></div>`;
}
const lotsInfo=d=>{const s=d.lots.map(lotState);const ok=s.filter(x=>x==="ok").length,pe=s.filter(x=>x==="pend").length;return ok+" inspeccionado"+(ok===1?"":"s")+(pe?" · "+pe+" pendiente"+(pe===1?"":"s"):"");};
const folNum=r=>{const p=parseFolio(r.folio);return p?p.n:0;};
const item=r=>`<div class="item"><div class="h"><b>${esc(r.folio)}</b><span class="bd ${r.status==="pendiente"?"pend":"ok"}">${r.status==="dup"?"para borrar":r.status}</span>${r.status==="pendiente"?attBadge(r.id):""}<span style="margin-left:auto;color:var(--mu);font-size:13px">${fmtF(r.fecha)}</span></div>
 <p>${esc(r.data.codigo)||"Sin código"}${r.data.desc?" · "+esc(r.data.desc):""}</p><p>${lotsInfo(r.data)}</p>
 <div class="ac"><button type="button" class="btn ${r.status==="pendiente"?"pri":""}" data-a="open" data-id="${r.id}">${r.status==="pendiente"?"Retomar":"Abrir"}</button><button type="button" class="btn" data-a="pdfrec" data-id="${r.id}">PDF</button><button type="button" class="btn dg" data-a="del" data-id="${r.id}">Eliminar</button></div></div>`;
function viewPendMaq(){const l=REC.filter(r=>r.status==="pendiente").sort((a,b)=>b.upd-a.upd);
 return `<div class="card"><h2 class="sh"><i>${l.length}</i>Folios pendientes</h2><p style="margin:0;color:var(--mu);font-size:13px">Folios con lotes sin maquilar. Retómalos para agregar los lotes que faltan.</p>${l.length?l.map(item).join(""):'<div class="emp">No hay folios pendientes.</div>'}</div>`;}
function histList(){
 const q=HQ.trim().toLowerCase(),list=REC.filter(r=>!q||(r.folio+" "+r.data.codigo+" "+r.data.desc).toLowerCase().includes(q)),g={};
 list.forEach(r=>(g[r.mes]=g[r.mes]||[]).push(r));const ms=Object.keys(g).sort().reverse();
 if(!ms.length)return '<div class="emp">Aún no hay folios guardados.</div>';
 return ms.map((m,i)=>{const a=g[m].sort((x,y)=>folNum(y)-folNum(x)||y.upd-x.upd),pe=a.filter(r=>r.status==="pendiente").length;
  return `<details class="mes" ${i===0||q?"open":""}><summary><span>${mesName(m)}</span><small>${a.length} folio${a.length===1?"":"s"}${pe?" · "+pe+" pend.":""}</small></summary>${a.map(item).join("")}<div class="row3"><button type="button" class="btn full" data-a="expm" data-id="${m}">Exportar respaldo de ${mesName(m)}</button></div></details>`;}).join("");
}
function viewHistMaq(){return `<div class="card"><h2 class="sh"><i>▤</i>Folios de maquila por mes</h2>${STORE_OK?"":'<p style="color:var(--r);font-size:13px">Este navegador no permite guardar datos. Exporta un respaldo antes de salir.</p>'}
 <input id="hq" placeholder="Buscar folio, código o producto" value="${esc(HQ)}" style="margin:6px 0 4px">
 <div class="row3"><button type="button" class="btn" data-a="expall">Exportar todo</button><label class="btn" for="imp">Importar respaldo</label></div></div><div id="hl">${histList()}</div>`;}

function refreshCalc(){const l=S.lots[S.act];auto(l);const t=$("#tot");if(t)t.textContent=defects(l);const s=document.querySelector('[data-l="dict"]');if(s)s.value=l.dict;const c=$("#chips");if(c)c.innerHTML=chips();}

/* ---------- eventos ---------- */
document.addEventListener("input",e=>{const t=e.target;
 if(t.dataset.k)S[t.dataset.k]=t.value;
 else if(t.dataset.l){let v=t.value;if(t.dataset.l==="cant"){v=/^\s*n/i.test(v)?v:v.replace(/\D/g,"");if(v!==t.value)t.value=v;}S.lots[S.act][t.dataset.l]=v;}
 else if(t.dataset.r){t.value=t.value.replace(/\D/g,"");S.lots[S.act].res[+t.dataset.r]=t.value;}
 else if(t.id==="hq"){HQ=t.value;$("#hl").innerHTML=histList();return;}
 draftSoon();});
document.addEventListener("change",e=>{const t=e.target;if(t.dataset.r!==undefined||["ac","re","lote","cant","muestra"].includes(t.dataset.l))refreshCalc();});
document.addEventListener("click",e=>{
 const sc=e.target.closest("[data-scan]");
 if(sc){TARGET=sc.dataset.scan;if(sc.dataset.src==="cam")$("#cam").click();return;}
 const tb=e.target.closest("[data-tab]");if(tb){TAB=tb.dataset.tab;render();window.scrollTo(0,0);return;}
 const ch=e.target.closest("[data-lot]");if(ch){S.act=+ch.dataset.lot;saveDraft();render();return;}
 const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a,id=b.dataset.id,l=S.lots[S.act];
 if(a==="new")attGate("insp",()=>dlg({title:"Nuevo folio",body:"Se limpiará el formulario actual. Lo guardado en Historial no se pierde.",buttons:[{t:"Cancelar"},{t:"Nuevo folio",cls:"pri",fn:()=>{newForm();render();window.scrollTo(0,0);}}]}));
 else if(a==="autofolio"){S.folio=nextFolio(S.fecha);saveDraft();render();}
 else if(a==="all0"){l.res.fill("0");auto(l);saveDraft();render();}
 else if(a==="clr"){l.res.fill("");l.dict="";saveDraft();render();}
 else if(a==="pend")actPend();else if(a==="fin")actFin();else if(a==="pdf")actPdf();
 else if(a==="open")load(id);
 else if(a==="pdfrec"){const r=REC.find(x=>x.id===id);if(r)runPdf(r.data);}
 else if(a==="del")delGuard(id);
 else if(a==="expm")exportRecs(REC.filter(r=>r.mes===id),"Folios_CRyD_"+id+".json");
 else if(a==="expall")exportRecs(REC,"Folios_CRyD_respaldo_"+today()+".json");
});
$("#imp").addEventListener("change",async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;
 try{const j=JSON.parse(await f.text()),arr=Array.isArray(j)?j:j.records;let n=0;
  (arr||[]).forEach(r=>{if(!r||!r.id||!r.folio||!r.data||!Array.isArray(r.data.lots))return;const i=REC.findIndex(x=>x.id===r.id);if(i<0){REC.push(r);n++;}else if((r.upd||0)>(REC[i].upd||0)){REC[i]=r;n++;}});
  saveRecs();toast(n+" folio"+(n===1?"":"s")+" importado"+(n===1?"":"s")+".");render();}catch(err){toast("El archivo de respaldo no es válido.");}});

/* ---------- Validación SAP vs PrIME ---------- */
const VF={sap:[["gcas","GCAS / Material",1],["desc","Descripción"],["planta","Planta / Centro",1],["sloc","Sloc / Almacén",1],["lote","Lote",1],["libre","Libre utilización"],["cal","Inspección de calidad"]],prime:[["gcas","GCAS / Material",1],["desc","Descripción"],["planta","Planta / Item Client ID",1],["estatus","Estatus",1],["sloc","Sloc / Warehouse ID"],["cant","Cantidad",1],["lote","Lote",1],["lpn","LPN"]]};
const VPAT={lpn:/lpn|license|placa|pallet|load number|load no|load id|carga/,estatus:/estatus|status|estado/,desc:/descri|texto breve|description|nombre/,gcas:/gcas|material|codigo|sku|articulo|item|producto/,planta:/planta|centro|plant|site|client id|item client|cliente/,sloc:/sloc|st loc|alm|almacen|storage|ubicacion|warehouse|bodega/,lote:/lote|batch|\blot\b/,cant:/cantidad|cant\b|quantity|qty|unidades|piezas|stock/,libre:/unrestr|libre|disponible/,cal:/quality|calidad|inspec|\bqi\b/,blo:/blocked|bloque/};
const VORD={sap:["desc","gcas","planta","sloc","lote","libre","cal"],prime:["lpn","estatus","desc","gcas","planta","sloc","lote","cant"]};
const BK={libre:"Libre",cal:"Calidad"};
const VEXC=/base unit|unit of measure|unidad de medida|\bum\b|transit|transfer|bloq|blocked|returns|devoluc|(^| )restricted use|uso restringido/;
const VTIPOS=["Faltante en PrIME","Faltante en SAP","Cantidad","Estatus"];
let VAL={sap:null,prime:null,res:null,opt:{noR:false,sapLast:true},stmap:{},filter:"Todos",lim:100};
const nz=s=>String(s==null?"":s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const vG=x=>String(x==null?"":x).trim().toUpperCase().replace(/^0+(?=.)/,"");
const vU=x=>String(x==null?"":x).trim().toUpperCase();
const f2=n=>Math.round(n*1000)/1000;
function vN(x){if(typeof x==="number")return x;let s=String(x==null?"":x).trim().replace(/\s/g,"");if(!s)return 0;let neg=false;if(/-$/.test(s)){neg=true;s=s.slice(0,-1);}
 if(/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s))s=s.replace(/,/g,"");else if(/^-?\d+,\d+$/.test(s))s=s.replace(",",".");const n=parseFloat(s);return isNaN(n)?0:(neg?-n:n);}
function vGuess(s){const t=nz(s);return /bloq|block|hold|retenid|cuarentena|quarantine/.test(t)?"ign":/calid|quality|insp|\bqi\b|\bqa\b/.test(t)?"cal":/libre|disponib|avail|unrestr|liberad|\bok\b|good|bueno/.test(t)?"libre":"";}
const vBucket=s=>{const b=VAL.stmap[nz(s)]||vGuess(s);return b==="blo"?"ign":b;};
function vMapRow(rows,r,kind){const used=new Set(),map={},row=rows[r]||[],mx=Math.min(kind==="prime"?8:7,row.length);VORD[kind].forEach(f=>{const re=VPAT[f];for(let c=0;c<mx;c++){if(used.has(c))continue;const h=nz(row[c]);if(kind==="sap"&&VEXC.test(h))continue;if(h&&re.test(h)){map[f]=c;used.add(c);break;}}});return map;}
function vDetect(rows,kind){let b={n:-1,row:0,map:{}};for(let r=0;r<Math.min(rows.length,40);r++){const m=vMapRow(rows,r,kind),n=Object.keys(m).length;if(n>b.n)b={n,row:r,map:m};}return b;}
function vParse(kind){const f=VAL[kind];f.ws=f.wb.Sheets[f.sheet];const rg=f.ws["!ref"]?XLSX.utils.decode_range(f.ws["!ref"]):{s:{r:0,c:0}};f.r0=rg.s.r;f.c0=rg.s.c;
 f.rows=XLSX.utils.sheet_to_json(f.ws,{header:1,raw:true,defval:"",blankrows:true});const d=vDetect(f.rows,kind);f.hdr=d.row;f.map=d.map;}
async function vLoad(kind,file){
 if(typeof XLSX==="undefined"){toast("No se pudo cargar el lector de Excel. Revisa tu conexión.");return;}
 busy("Leyendo "+file.name+"…");
 try{const wb=XLSX.read(await file.arrayBuffer(),{type:"array"});VAL[kind]={name:file.name,wb,sheet:wb.SheetNames[0]};vParse(kind);}
 catch(e){toast("No se pudo abrir el archivo. Verifica que sea Excel (.xlsx, .xls) o CSV.");}
 finally{OCRON=false;busy("");}
 VAL.res=null;render();}
function vStatuses(){const f=VAL.prime;if(!f||f.map.estatus==null||f.map.cant==null||f.map.gcas==null)return[];const m=new Map();
 for(let i=f.hdr+1;i<f.rows.length;i++){const r=f.rows[i];if(!vG(r[f.map.gcas]))continue;const s=String(r[f.map.estatus]==null?"":r[f.map.estatus]).trim()||"(vacío)",e=m.get(s)||{s,n:0,q:0};e.n++;e.q+=vN(r[f.map.cant]);m.set(s,e);}
 return [...m.values()];}
function vLpn(f,i){const v=f.rows[i][f.map.lpn];if(typeof v==="number"){const c=f.ws[XLSX.utils.encode_cell({r:f.r0+i,c:f.c0+f.map.lpn})];return String(c&&c.w?c.w:v).replace(/\s/g,"");}return String(v==null?"":v).trim();}
function vMissing(){const m=[];["sap","prime"].forEach(k=>{const f=VAL[k],n=k==="sap"?"SAP":"PrIME";if(!f){m.push("el archivo de "+n);return;}VF[k].filter(x=>x[2]).forEach(x=>{if(f.map[x[0]]==null)m.push(n+": la columna "+x[1]);});});
 const f=VAL.sap;if(f&&f.map.libre==null&&f.map.cal==null&&f.map.blo==null)m.push("SAP: al menos una columna de cantidad");
 if(VAL.prime&&VAL.prime.map.estatus!=null&&vStatuses().some(x=>!vBucket(x.s)))m.push("PrIME: asignar todos los estatus");return m;}
function vBuild(){
 const sap=VAL.sap,pr=VAL.prime,ln=l=>vU(l),isTot=x=>/^(total|overall|grand|resultado|result|suma|gran total)/i.test(String(x==null?"":x).trim());
 const MS=new Map(),MP=new Map(),inf={sap:{n:0,g:new Set()},pr:{n:0,g:new Set(),lpn:new Set(),dup:new Map(),bad:[],ign:0,by:new Map()}};
 const NS=pr.map.sloc==null;
 let sapEnd=sap.rows.length-1;while(sapEnd>sap.hdr&&sap.rows[sapEnd].every(c=>c===""||c==null))sapEnd--;
 inf.sap.skip=0;{const lr=sap.rows[sapEnd]||[];if(VAL.opt.sapLast&&sapEnd>sap.hdr&&!(vG(lr[sap.map.gcas])&&vU(lr[sap.map.planta])&&(NS||vU(lr[sap.map.sloc]))))inf.sap.skip=sapEnd;}
 for(let i=sap.hdr+1;i<sap.rows.length;i++){if(inf.sap.skip&&i===inf.sap.skip)continue;const r=sap.rows[i],raw=r[sap.map.gcas],g=vG(raw);if(!g||isTot(raw))continue;
  const lr=String(r[sap.map.lote]==null?"":r[sap.map.lote]).trim(),p=vU(r[sap.map.planta]),s=NS?"":vU(r[sap.map.sloc]),k=g+"|"+ln(lr)+"|"+p+"|"+s;
  let e=MS.get(k);if(!e){e={g,l:ln(lr),lraw:lr,pl:p,sl:s,desc:"",libre:0,cal:0,blo:0,rows:[],lpns:[]};MS.set(k,e);}
  if(sap.map.libre!=null)e.libre+=vN(r[sap.map.libre]);if(sap.map.cal!=null)e.cal+=vN(r[sap.map.cal]);if(sap.map.blo!=null)e.blo+=vN(r[sap.map.blo]);
  if(!e.desc&&sap.map.desc!=null)e.desc=String(r[sap.map.desc]==null?"":r[sap.map.desc]).trim();
  e.rows.push(sap.r0+i+1);inf.sap.n++;inf.sap.g.add(g);}
 for(let i=pr.hdr+1;i<pr.rows.length;i++){const r=pr.rows[i],raw=r[pr.map.gcas],g=vG(raw);if(!g||isTot(raw))continue;
  const st=String(r[pr.map.estatus]==null?"":r[pr.map.estatus]).trim()||"(vacío)",b=vBucket(st),q=vN(r[pr.map.cant]),row=pr.r0+i+1;
  const y=inf.pr.by.get(st)||{n:0,q:0,b};y.n++;y.q+=q;inf.pr.by.set(st,y);inf.pr.n++;inf.pr.g.add(g);
  const lpn=pr.map.lpn!=null?vLpn(pr,i):"";
  if(lpn){inf.pr.lpn.add(lpn);let a=inf.pr.dup.get(lpn);if(!a)inf.pr.dup.set(lpn,a=[]);a.push(row);if(!/^\d{20}$/.test(lpn))inf.pr.bad.push([lpn,row]);}
  if(b==="ign"){inf.pr.ign++;continue;}
  const lr=String(r[pr.map.lote]==null?"":r[pr.map.lote]).trim(),p=vU(r[pr.map.planta]),s=NS?"":vU(r[pr.map.sloc]),k=g+"|"+ln(lr)+"|"+p+"|"+s;
  let e=MP.get(k);if(!e){e={g,l:ln(lr),lraw:lr,pl:p,sl:s,desc:"",libre:0,cal:0,blo:0,rows:[],lpns:[]};MP.set(k,e);}
  e[b]+=q;e.rows.push(row);if(lpn)e.lpns.push(lpn);
  if(!e.desc&&pr.map.desc!=null)e.desc=String(r[pr.map.desc]==null?"":r[pr.map.desc]).trim();}
 return {MS,MP,inf};}
function vRun(){
 gstInc("val");
 const {MS,MP,inf}=vBuild(),D=[],eq=(x,y)=>Math.abs(x-y)<0.0005;
 /* Igual que la macro: llave = GCAS + lote + planta + sloc. El orden y el número de filas de cada lado no importan. */
 const add=(t,o)=>D.push(Object.assign({t,g:"",l:"",pl:"",sl:"",S:[],P:[],txt:""},o));
 const other=(M,e)=>[...M.values()].filter(x=>x.g===e.g&&x.l===e.l&&x.k!==e.k);
 const hint=(M,e,n)=>{const o=other(M,e);return o.length?" Ojo: el mismo GCAS y lote sí existe en "+n+" con planta/sloc "+[...new Set(o.map(x=>x.pl+"/"+x.sl))].join(", ")+".":"";};
 for(const [k,e] of MS){e.k=k;} for(const [k,e] of MP){e.k=k;}
 for(const [k,s] of MS){const p=MP.get(k);
  if(!p){add("Faltante en PrIME",{g:s.g,l:s.lraw,pl:s.pl,sl:s.sl,S:[s],P:[],txt:"Planta "+s.pl+", sloc "+(s.sl||"—")+": está en SAP y no en PrIME. Calidad SAP "+f2(s.cal)+(s.libre?" · Libre SAP "+f2(s.libre):"")+"."+hint(MP,s,"PrIME")});continue;}
  if(eq(s.libre,p.libre)&&eq(s.cal,p.cal))continue;
  const ta=s.libre+s.cal,tb=p.libre+p.cal,same=eq(ta,tb),dif=Object.keys(BK).filter(x=>!eq(s[x],p[x])).map(x=>BK[x]+": SAP "+f2(s[x])+" · PrIME "+f2(p[x]));
  add(same?"Estatus":"Cantidad",{g:s.g,l:s.lraw,pl:s.pl,sl:s.sl,S:[s],P:[p],txt:(same?"La cantidad total coincide ("+f2(ta)+") pero cambia el estatus. ":"La cantidad no coincide (SAP "+f2(ta)+" · PrIME "+f2(tb)+"). ")+dif.join(" | ")});}
 for(const [k,p] of MP)if(!MS.has(k))add("Faltante en SAP",{g:p.g,l:p.lraw,pl:p.pl,sl:p.sl,S:[],P:[p],txt:"Planta "+p.pl+", sloc "+(p.sl||"—")+": está en PrIME y no en SAP. Cantidad PrIME "+f2(p.libre+p.cal)+"."+hint(MS,p,"SAP")});
 D.sort((a,b)=>VTIPOS.indexOf(a.t)-VTIPOS.indexOf(b.t)||a.g.localeCompare(b.g));
 const sm=(M,k)=>{let t=0;for(const e of M.values())t+=e[k];return f2(t);};
 VAL.res={ns:VAL.prime.map.sloc==null,D,names:[VAL.sap.name,VAL.prime.name],at:new Date(),
  sap:{n:inf.sap.n,g:inf.sap.g.size,c:MS.size,skip:inf.sap.skip?VAL.sap.r0+inf.sap.skip+1:0,libre:sm(MS,"libre"),cal:sm(MS,"cal"),blo:0},
  pr:{n:inf.pr.n,g:inf.pr.g.size,c:MP.size,lpn:inf.pr.lpn.size,ign:inf.pr.ign,libre:sm(MP,"libre"),cal:sm(MP,"cal"),blo:0,by:[...inf.pr.by].map(x=>({s:x[0],n:x[1].n,q:f2(x[1].q),b:x[1].b}))}};
 VAL.filter="Todos";VAL.lim=100;
 try{hlogAdd({k:"val",t:"Validación SAP vs PrIME",s:(D.length?D.length+" diferencia"+(D.length===1?"":"s"):"Todo OK")+" · "+VAL.sap.name+" vs "+VAL.prime.name,st:D.length?"dif":"ok"});}catch(e){}}
/* --- vistas --- */
const vColOpts=(f,cur,kind)=>{const h=f.rows[f.hdr]||[],mx=kind==="prime"?Math.min(8,h.length):h.length;let o="";for(let c=0;c<mx;c++)o+=`<option value="${c}" ${c===cur?"selected":""}>${XLSX.utils.encode_col(c+f.c0)}: ${esc(String(h[c]==null?"":h[c]).trim()||"(vacío)")}</option>`;return o;};
function vFileCard(kind,title,n){
 const f=VAL[kind],fields=VF[kind];
 let h=`<div class="card"><h2 class="sh"><i>${n}</i>${title}</h2><label class="btn ${f?"":"pri"}" for="f${kind}" style="display:block">${f?"Cambiar archivo":"Elegir archivo de Excel"}</label>`;
 if(f){const miss=fields.filter(x=>x[2]&&f.map[x[0]]==null).map(x=>x[1]);
  h+=`<p class="vf">${esc(f.name)} · ${f.rows.length} filas</p><p class="vf" style="margin-top:4px">${kind==="sap"?"Se ignoran las columnas Bloqueado, Base Unit of Measure y Transit and Transfer, y la última fila de totales.":"Solo se leen las columnas A a H; de la I en adelante se ignoran."}</p>`;
  if(f.wb.SheetNames.length>1)h+=`<label class="lb">Hoja</label><select data-vs="${kind}">${f.wb.SheetNames.map(s=>`<option ${s===f.sheet?"selected":""}>${esc(s)}</option>`).join("")}</select>`;
  h+=`<details class="vd" ${miss.length?"open":""}><summary>Columnas detectadas · encabezados en la fila ${f.r0+f.hdr+1}${miss.length?" · faltan: "+miss.join(", "):""}</summary>
  <label class="lb">Fila de encabezados</label><input type="number" min="1" data-vh="${kind}" value="${f.r0+f.hdr+1}">
  ${fields.map(x=>`<label class="lb">${x[1]}${x[2]?" *":""}</label><select data-vm="${kind}:${x[0]}"><option value="">— no usar —</option>${vColOpts(f,f.map[x[0]],kind)}</select>`).join("")}</details>`;}
 return h+`</div>`;}
const vRows=(a,lim)=>{const r=a.reduce((x,e)=>x.concat(e.rows),[]);return r.length?"fila"+(r.length>1?"s":"")+" "+r.slice(0,lim).join(", ")+(r.length>lim?" … +"+(r.length-lim):""):"—";};
function vSide(a,prime){if(!a.length)return "<span style=\"color:var(--mu)\">Sin registros</span>";
 return a.slice(0,4).map(e=>`${esc(e.pl)} / ${esc(e.sl)} · ${vRows([e],6)}<br>Libre ${f2(e.libre)} · Calidad ${f2(e.cal)}${prime&&e.lpns.length?"<br>LPN: "+e.lpns.slice(0,4).map(esc).join(", ")+(e.lpns.length>4?" … +"+(e.lpns.length-4):""):""}`).join("<hr style=\"border:0;border-top:1px solid var(--bd);margin:6px 0\">")+(a.length>4?"<br>… +"+(a.length-4)+" más":"");}
function vResHtml(){
 const R=VAL.res,D=R.D,ok=!D.length,cnt={};D.forEach(d=>cnt[d.t]=(cnt[d.t]||0)+1);
 const lst=VAL.filter==="Todos"?D:D.filter(d=>d.t===VAL.filter),shown=lst.slice(0,VAL.lim);
 const row=(n,a,b)=>`<tr><td>${n}</td><td>${a}</td><td>${b}</td><td style="color:${Math.abs(a-b)<0.0005?"var(--ok)":"var(--r)"};font-weight:700">${Math.abs(a-b)<0.0005?"OK":f2(a-b)}</td></tr>`;
 const ts=R.sap.libre+R.sap.cal,tp=R.pr.libre+R.pr.cal;
 let h=`<div id="vres"><div class="vbanner ${ok?"ok":"no"}">${ok?"Todo OK: SAP y PrIME coinciden en código, lote, planta, sloc, cantidades y estatus.":D.length+" diferencia"+(D.length===1?"":"s")+" encontrada"+(D.length===1?"":"s")+"."}</div>
 <div class="card"><h2 class="sh"><i>▤</i>Resumen</h2>
  ${R.ns?`<p class="mu" style="margin:0 0 10px;font-size:13px">PrIME sin columna de Sloc: se comparó por código, lote y planta (sin Sloc).</p>`:""}<div class="vsum"><div class="vs"><b>${R.sap.n}</b><span>filas SAP · ${R.sap.g} GCAS${R.sap.skip?" · fila "+R.sap.skip+" ignorada":""}</span></div><div class="vs"><b>${R.pr.n}</b><span>filas PrIME · ${R.pr.g} GCAS</span></div><div class="vs"><b>${R.sap.c}</b><span>combinaciones GCAS/lote/planta/sloc en SAP</span></div><div class="vs"><b>${R.pr.c}</b><span>combinaciones en PrIME</span></div><div class="vs"><b>${R.pr.lpn}</b><span>LPN únicos en PrIME</span></div><div class="vs"><b>${R.pr.ign}</b><span>filas PrIME ignoradas</span></div></div>
  <table class="vt"><tr><th>Cantidades</th><th>SAP</th><th>PrIME</th><th>Dif.</th></tr>${row("Libre",R.sap.libre,R.pr.libre)}${row("Calidad",R.sap.cal,R.pr.cal)}${row("<b>Total</b>",f2(ts),f2(tp))}</table>
  <table class="vt"><tr><th>Estatus PrIME</th><th>Filas</th><th>Cant.</th><th>Equivale</th></tr>${R.pr.by.map(x=>`<tr><td>${esc(x.s)}</td><td>${x.n}</td><td>${x.q}</td><td>${x.b==="ign"?"Ignorado":BK[x.b]||"—"}</td></tr>`).join("")}</table>
  <p style="font-size:12px;color:var(--mu);margin:8px 0 0">${esc(R.names[0])} vs ${esc(R.names[1])} · ${R.at.toLocaleString("es-MX")}</p>
  <div class="row3"><button type="button" class="btn dk full" data-va="exp">Descargar Excel con el detalle</button></div></div>`;
 if(!ok){h+=`<div class="card"><h2 class="sh"><i>!</i>Diferencias<em>${lst.length}</em></h2><div class="vc"><button type="button" data-va="flt" data-t="Todos" class="${VAL.filter==="Todos"?"on":""}">Todos ${D.length}</button>${VTIPOS.filter(t=>cnt[t]).map(t=>`<button type="button" data-va="flt" data-t="${t}" class="${VAL.filter===t?"on":""}">${t} ${cnt[t]}</button>`).join("")}</div>`;
  h+=shown.map(d=>{const ds=(d.S[0]&&d.S[0].desc)||(d.P[0]&&d.P[0].desc)||"";
   return `<div class="vx"><div class="t"><span class="tg">${d.t}</span><b>${esc(d.g)}${d.l?" · lote "+esc(d.l):""}</b></div>${ds?`<p style="margin:2px 0 0;font-size:12px;color:var(--mu)">${esc(ds)}</p>`:""}<p style="margin:6px 0 0;font-size:13px">${esc(d.txt)}</p>${d.S.length||d.P.length?`<div class="sd"><div><b>SAP</b>${vSide(d.S,false)}</div><div><b>PrIME</b>${vSide(d.P,true)}</div></div>`:""}</div>`;}).join("");
  if(lst.length>shown.length)h+=`<div class="row3"><button type="button" class="btn full" data-va="more">Mostrar más (${lst.length-shown.length})</button></div>`;
  h+=`</div>`;}
 return h+`</div>`;}
function viewVal(){
 const st=VAL.prime?vStatuses():[],miss=vMissing();
 let h=`<div class="card"><p style="margin:0;color:var(--mu);font-size:13px">Sube el inventario exportado de SAP y el de PrIME, tal como los exportas. Se valida código (GCAS), lote, planta, sloc, cantidades y estatus. Solo PrIME trae LPN. Los archivos se leen en tu dispositivo y no se suben a ningún servidor.</p></div>`;
 h+=vFileCard("sap","Archivo de SAP",1)+vFileCard("prime","Archivo de PrIME (con LPN)",2);
 if(st.length)h+=`<div class="card"><h2 class="sh"><i>3</i>Estatus de PrIME<em>equivalencia con SAP</em></h2><p style="margin:0 0 4px;color:var(--mu);font-size:13px">SAP se compara en Libre (Unrestricted) y Calidad (Quality Inspection). Asigna cada estatus de PrIME a uno de ellos, o elige Ignorar (por ejemplo, Bloqueado). Queda guardado para la próxima vez.</p>
  ${st.map(x=>{const cur=VAL.stmap[nz(x.s)]||vGuess(x.s);return `<div class="crit"><p><b style="color:var(--tx)">${esc(x.s)}</b><br><span style="font-size:12px;color:var(--mu)">${x.n} filas · cantidad ${f2(x.q)}</span></p><select style="width:150px;flex:none" data-vst="${esc(x.s)}">${[["","Elegir…"],["libre","Libre"],["cal","Calidad"],["ign","Ignorar"]].map(o=>`<option value="${o[0]}" ${o[0]===cur?"selected":""}>${o[1]}</option>`).join("")}</select></div>`;}).join("")}</div>`;
 h+=`<div class="card"><h2 class="sh"><i>${st.length?4:3}</i>Comparar</h2><label class="lrow"><span>Ignorar la última fila de SAP (totales)</span><input type="checkbox" class="sw" data-vo="sapLast" ${VAL.opt.sapLast?"checked":""}></label>
  ${miss.length?`<p style="margin:0 0 10px;color:var(--wn);font-size:13px">Falta: ${esc(miss.slice(0,3).join(" · "))}</p>`:""}
  <div class="row3"><button type="button" class="btn pri" data-va="cmp" ${miss.length?"disabled style=\"opacity:.5\"":""}>Comparar archivos</button><button type="button" class="btn" data-va="clr">Limpiar</button></div></div>`;
 return h+(VAL.res?vResHtml():"");}
function vExport(){
 const R=VAL.res;if(!R||typeof XLSX==="undefined")return;
 const sumA=(a,k)=>f2(a.reduce((x,e)=>x+e[k],0)),rowsA=a=>a.reduce((x,e)=>x.concat(e.rows),[]).join(", "),lp=a=>a.reduce((x,e)=>x.concat(e.lpns),[]).join(", ");
 const ts=R.sap.libre+R.sap.cal,tp=R.pr.libre+R.pr.cal;
 const r1=[["Validación SAP vs PrIME"],["Archivo SAP",R.names[0]],["Archivo PrIME",R.names[1]],["Fecha",R.at.toLocaleString("es-MX")],["Resultado",R.D.length?R.D.length+" diferencias":"Todo OK"],[],["","SAP","PrIME","Diferencia"],["Filas",R.sap.n,R.pr.n,""],["GCAS únicos",R.sap.g,R.pr.g,""],["Combinaciones GCAS/lote/planta/sloc",R.sap.c,R.pr.c,""],["LPN únicos","",R.pr.lpn,""],["Libre",R.sap.libre,R.pr.libre,f2(R.sap.libre-R.pr.libre)],["Calidad",R.sap.cal,R.pr.cal,f2(R.sap.cal-R.pr.cal)],["Total",f2(ts),f2(tp),f2(ts-tp)],[],["Estatus PrIME","Filas","Cantidad","Equivale a"]].concat(R.pr.by.map(x=>[x.s,x.n,x.q,x.b==="ign"?"Ignorado":BK[x.b]||""]));
 const r2=[["Tipo","GCAS","Lote","Planta","Sloc","SAP filas","SAP libre","SAP calidad","PrIME filas","PrIME LPN","PrIME libre","PrIME calidad","Detalle"]].concat(R.D.map(d=>[d.t,d.g,d.l,d.pl||(d.S[0]||d.P[0]||{}).pl||"",d.sl||(d.S[0]||d.P[0]||{}).sl||"",rowsA(d.S),sumA(d.S,"libre"),sumA(d.S,"cal"),rowsA(d.P),lp(d.P),sumA(d.P,"libre"),sumA(d.P,"cal"),d.txt]));
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(r1),"Resumen");XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(r2),"Diferencias");
 const out=XLSX.write(wb,{bookType:"xlsx",type:"array"});
 saveBlob("Validacion_SAP_vs_PrIME_"+today()+".xlsx",new Blob([out],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));}
/* --- eventos --- */
async function vPick(kind,e){const f=e.target.files[0];e.target.value="";if(f)await vLoad(kind,f);}
$("#fsap").addEventListener("change",e=>vPick("sap",e));$("#fprime").addEventListener("change",e=>vPick("prime",e));
document.addEventListener("change",e=>{const t=e.target,d=t.dataset;
 if(d.vs){const k=d.vs;VAL[k].sheet=t.value;vParse(k);VAL.res=null;render();}
 else if(d.vh){const k=d.vh,f=VAL[k];f.hdr=Math.max(0,Math.min(f.rows.length-1,(+t.value||1)-1-f.r0));f.map=vMapRow(f.rows,f.hdr,k);VAL.res=null;render();}
 else if(d.vm){const p=d.vm.split(":");VAL[p[0]].map[p[1]]=t.value===""?undefined:+t.value;VAL.res=null;render();}
 else if(d.vst!==undefined){VAL.stmap[nz(d.vst)]=t.value;U.set("stmap",VAL.stmap);VAL.res=null;render();}
 else if(d.vo){VAL.opt[d.vo]=t.checked;VAL.res=null;render();}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-va]");if(!b||b.disabled)return;const a=b.dataset.va;
 if(a==="cmp"){const m=vMissing();if(m.length){toast("Falta: "+m[0]);return;}busy("Comparando…");
  setTimeout(()=>{try{vRun();}catch(err){toast("No se pudo comparar: "+(err&&err.message||err));}busy("");render();const r=$("#vres");if(r)r.scrollIntoView();},30);}
 else if(a==="flt"){VAL.filter=b.dataset.t;VAL.lim=100;render();}
 else if(a==="more"){VAL.lim+=100;render();}
 else if(a==="exp")vExport();
 else if(a==="clr"){VAL.sap=null;VAL.prime=null;VAL.res=null;render();}});

/* ---------- Cuentas, perfil y navegación ---------- */
let ME=null,AUTH={mode:"menu",f:{},err:""};
let USERS=LS.get("cryd:users",[]);if(!Array.isArray(USERS))USERS=[];
const saveUsers=()=>LS.set("cryd:users",USERS);
const U={get(k,d){return ME&&!ME.guest?LS.get("cryd:u"+ME.emp+":"+k,d):LS.get("cryd:ug:"+k,d);},set(k,v){if(ME&&!ME.guest){const r=LS.set("cryd:u"+ME.emp+":"+k,v);cloudSoon();return r;}return LS.set("cryd:ug:"+k,v);}};
const GLYPH='<svg viewBox="0 0 24 24"><path d="M9 4h6l1 2h3v14H5V6h3z"/><path d="M9 13l2 2 4-4"/></svg>';
const IC={insp:'<path d="M9 4h6l1 2h3v14H5V6h3z"/><path d="M9 13l2 2 4-4"/>',pend:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',hist:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',val:'<path d="M4 8h14l-3-3M20 16H6l3 3"/>',rcv:'<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',perfil:'<circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4"/>',home:'<path d="M4 11l8-7 8 7v9H5z"/><path d="M10 20v-6h4v6"/>',sur:'<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',dash:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="4" rx="1.5"/><rect x="13" y="10" width="7" height="10" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/>',more:'<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>'};
const TNAME={home:"Inicio",rcv:"Recibo",sur:"Surtido",val:"Validación",insp:"Maquila",dash:"Dashboards",pend:"Pendientes",hist:"Historial",more:"Más",perfil:"Perfil",admin:"Administrador"};
const initials=u=>((u.nombre||"?")[0]+((u.apellido||"")[0]||"")).toUpperCase();
const titleCase=s=>s.trim().replace(/\s+/g," ").toLowerCase().replace(/(^|[\s'-])([a-záéíóúüñ])/g,(m,a,b)=>a+b.toUpperCase());
const NAME_RE=/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{2,40}$/;
async function hashPin(emp,pin){try{const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("cryd|"+emp+"|"+pin));return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("");}catch(e){return "x"+btoa(emp+":"+pin);}}
function loadUserData(){REC=U.get("rec",[]);if(!Array.isArray(REC))REC=[];WARN=U.get("warn",{dup:{},del:{}});WARN.dup=WARN.dup||{};WARN.del=WARN.del||{};VAL.stmap=U.get("stmap",{});
 const d=U.get("draft",null);if(d&&d.id&&Array.isArray(d.lots)&&d.lots.length===5)S=d;else newForm();lpLoad();hlogLoad();dshLoad();attLoad();GPL="";setTimeout(()=>{marksPull();gPush();},2500);}
function enterUser(u){ME={emp:u.emp,nombre:u.nombre,apellido:u.apellido,guest:false};LS.set("cryd:session",{emp:u.emp});AUTH={mode:"menu",f:{},err:""};loadUserData();TAB="home";render();window.scrollTo(0,0);cloudStart();}
function enterGuest(){const raw=String(AUTH.f.gname!==undefined?AUTH.f.gname:LS.get("cryd:gname","")).trim().slice(0,30),nm=raw?titleCase(raw):"";LS.set("cryd:gname",nm);
 ME={emp:"INVITADO",nombre:nm||"Invitado",apellido:"",guest:true};LS.set("cryd:session",{guest:1});AUTH={mode:"menu",f:{},err:""};loadUserData();TAB="home";render();window.scrollTo(0,0);setTimeout(()=>gstInc("n"),50);}
function logout(){lpReset();ME=null;S=null;REC=[];WARN={dup:{},del:{}};VAL.sap=null;VAL.prime=null;VAL.res=null;LS.set("cryd:session",null);AUTH={mode:"menu",f:{},err:""};TAB="home";render();window.scrollTo(0,0);}
function authErr(t){AUTH.err=t;renderAuth();}
async function doLogin(){const f=AUTH.f,emp=(f.emp||"").trim();let u=USERS.find(x=>x.emp===emp);
 if(f.curl&&f.curl.trim()&&f.curl.trim()!==cloudCfg())LS.set("cryd:cloud",{url:normUrl(f.curl)});
 if(!u&&cloudCfg()&&/^\d{4,8}$/.test(emp)){busy("Buscando tu cuenta en el servidor…");const r=await cloudGet(emp);busy("");if(r&&r.acct&&r.acct.nombre){u={emp,nombre:r.acct.nombre,apellido:r.acct.apellido||"",pin:r.acct.pin||null,created:Date.now()};USERS.push(u);saveUsers();}}
 if(!u)return authErr("No hay una cuenta con ese número de empleado"+(cloudCfg()?" ni en el servidor":" en este dispositivo")+". Crea una cuenta.");
 if(cloudCfg()){const ra=await cloudGet(emp);if(ra&&ra.acct){if(ra.acct.off)return authErr("Esta cuenta está suspendida. Contacta al administrador.");if(ra.acct.reset&&ra.acct.reset>(u.resetSeen||0)){u.pin=null;u.resetSeen=ra.acct.reset;saveUsers();}}}
 if(u.pin&&(await hashPin(emp,f.pin||""))!==u.pin)return authErr("PIN incorrecto.");
 enterUser(u);}
async function doSignup(){const f=AUTH.f,nombre=titleCase(f.nombre||""),apellido=titleCase(f.apellido||""),emp=(f.emp||"").trim();
 if(!NAME_RE.test(nombre))return authErr("Escribe tu nombre (solo letras).");
 if(!NAME_RE.test(apellido))return authErr("Escribe tu apellido (solo letras).");
 if(!/^\d{4,8}$/.test(emp))return authErr("El número de empleado debe tener solo dígitos (normalmente 5).");
 if(USERS.some(x=>x.emp===emp))return authErr("Ya existe una cuenta con ese número de empleado en este dispositivo. Inicia sesión.");
 if(cloudCfg()){const ra=await cloudGet(emp);if(ra&&ra.acct&&ra.acct.nombre)return authErr("Ese número de empleado ya tiene cuenta en el servidor. Inicia sesión.");}
 let pin=null;
 if(f.usepin){if(!/^\d{4}$/.test(f.pin||""))return authErr("El PIN debe tener 4 dígitos.");if(f.pin!==f.pin2)return authErr("Los PIN no coinciden.");pin=await hashPin(emp,f.pin);}
 const make=()=>{const first=USERS.length===0,u={emp,nombre,apellido,pin,created:Date.now()};USERS.push(u);saveUsers();
  if(first)["rec","warn","draft","stmap"].forEach(k=>{const v=LS.get("cryd:"+k,null);if(v!=null)LS.set("cryd:u"+emp+":"+k,v);});
  enterUser(u);};
 if(emp.length!==5)dlg({title:"Número de empleado",body:"Normalmente tiene 5 dígitos. ¿Confirmas que "+emp+" es correcto?",buttons:[{t:"Corregir"},{t:"Confirmar",cls:"pri",fn:make}]});else make();}
const FOOT='<footer class="foot">Soluciones en Logística Cargo<br>Desarrollado por Manuel ChD · Todos los derechos reservados</footer>';
function renderAuth(){
 document.body.classList.add("noauth");$("#tabs").innerHTML="";
 const A=AUTH,f=A.f,v=k=>esc(f[k]||""),er=A.err?`<div class="aerr">${esc(A.err)}</div>`:"";
 let h=`<div class="aw"><div class="aicon">${GLYPH}</div><h1>Procesos CRyD</h1><p class="asub">Soluciones en Logística Cargo</p>`;
 if(A.mode==="menu")h+=`<div class="card"><label class="lb">¿Cómo te llamas? (opcional)</label><input data-au="gname" autocomplete="given-name" maxlength="30" placeholder="Tu nombre" value="${esc(f.gname!==undefined?f.gname:LS.get("cryd:gname",""))}"></div><div class="abtns"><button type="button" class="btn pri" data-ua="guest">Entrar</button><button type="button" class="btn txt" data-ua="mode:login">Acceso administrador</button></div><p class="anote">Recibo, Surtido, Validación, Maquila y Dashboards en un solo lugar. Tu avance se guarda en este dispositivo aunque la app se cierre.</p>`;
 else h+=`<h2 style="margin:0 0 10px;font-size:20px">Acceso administrador</h2>`+(USERS.length?`<div class="lst">${USERS.map(u=>`<button type="button" class="lr ${f.emp===u.emp?"on":""}" data-ua="pick:${esc(u.emp)}"><span class="av">${esc(initials(u))}</span><span><b>${esc(u.nombre+" "+u.apellido)}</b><small>No. ${esc(u.emp)}${u.pin?" · con PIN":""}</small></span></button>`).join("")}</div>`:"")+er
  +`<div class="card"><label class="lb">Número de empleado</label><input data-au="emp" inputmode="numeric" maxlength="8" autocomplete="off" value="${v("emp")}" placeholder="12345"><label class="lb">PIN (si lo configuraste)</label><input data-au="pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" value="${v("pin")}" placeholder="••••"></div><div class="abtns"><button type="button" class="btn pri" data-ua="doLogin">Entrar</button><button type="button" class="btn txt" data-ua="mode:menu">Volver</button></div>`;
 $("#app").innerHTML=h+`</div>`+FOOT;}
function viewPerfil(){const g=ME.guest,th=LS.get("cryd:theme","system");
 return `<div class="card center"><div class="av big">${esc(initials(ME))}</div><h2 class="nm">${esc(g?ME.nombre:ME.nombre+" "+ME.apellido)}</h2><p class="mu" style="margin:4px 0 0">${g?"Invitado · tus datos se guardan en este dispositivo":"No. de empleado "+esc(ME.emp)+" · Administrador"}</p></div>
 ${g?`<div class="card"><h2 class="sh">Tu nombre</h2><input data-gn value="${esc(ME.nombre==="Invitado"?"":ME.nombre)}" maxlength="30" placeholder="Cómo quieres que te llame"></div>`:""}
 <div class="card"><h2 class="sh">Apariencia</h2><div class="seg">${[["system","Sistema"],["light","Claro"],["dark","Oscuro"]].map(o=>`<button type="button" class="${th===o[0]?"on":""}" data-ua="theme:${o[0]}">${o[1]}</button>`).join("")}</div></div>
 <div class="card"><h2 class="sh">Instalar en el teléfono</h2><p class="mu" style="margin:6px 0 0;font-size:14px">Para abrirla como app: en Safari toca Compartir y elige "Agregar a pantalla de inicio". En Chrome, menú ⋮ y "Instalar app".</p></div>
 <div class="card"><h2 class="sh">Sesión</h2>${g?`<p class="mu" style="margin:6px 0 12px;font-size:14px">Tu avance de Recibo, Surtido, Validación, Maquila y Dashboards queda guardado aquí. Si la app se cierra, al volver a entrar continúas donde ibas.</p><button type="button" class="btn" style="width:100%" data-ua="logout">Salir</button><button type="button" class="btn dg" style="width:100%;margin-top:10px" data-ua="gwipe">Borrar mis datos de este dispositivo</button>`:`<p class="mu" style="margin:6px 0 12px;font-size:14px">Tu cuenta y tus avances se respaldan en el servidor. Si cambias de teléfono, entra con tu número de empleado y se recuperan.</p><button type="button" class="btn" style="width:100%" data-ua="logout">Cerrar sesión</button><button type="button" class="btn dg" style="width:100%;margin-top:10px" data-ua="delacc">Eliminar mi cuenta y datos</button>`}</div>
 ${g?"":viewCloud()}
 ${g?"":viewAdminCard()}
 ${festPerfil()}
 <p class="mu" style="text-align:center;font-size:12px">Procesos CRyD · versión 3.5</p>`;}
const BAR=["home","rcv","sur","val","insp","more"],MORE=["dash","pend","hist","perfil","admin"];
function render(){
 if(!ME){renderAuth();return;}
 document.body.classList.remove("noauth");
 if(!TNAME[TAB])TAB="home";if(TAB==="admin"&&!admOn())TAB="perfil";
 const np=pendCount(),act=MORE.includes(TAB)?"more":TAB;
 try{LS.set("cryd:ui",{emp:ME.emp,tab:TAB,ts:Date.now()});}catch(e){}
 $("#tabs").innerHTML=BAR.map(t=>`<button type="button" class="tab ${t===act?"on":""}" data-tab="${t}"><svg viewBox="0 0 24 24">${IC[t]}</svg>${TNAME[t]}${t==="more"&&np?`<span class="pb">${np}</span>`:""}</button>`).join("");
 $("#who").textContent=initials(ME);
 const V={home:viewHome,rcv:()=>lpView("rcv"),sur:()=>lpView("sur"),val:viewVal,insp:viewInsp,dash:viewDash,pend:viewPend,hist:viewHist,more:viewMore,perfil:viewPerfil,admin:viewAdmin};
 const back=MORE.includes(TAB)?`<button type="button" class="back" data-tab="more">‹ Más</button>`:"";
 $("#app").innerHTML=(TAB==="home"?"":back+`<h1 class="lt">${TNAME[TAB]}</h1>`)+V[TAB]()+FOOT;
 if(TAB==="rcv"||TAB==="sur"||TAB==="insp")warmOcr();if(typeof firstHelp==="function")setTimeout(firstHelp,250);}
function applyTheme(){const t=LS.get("cryd:theme","system"),r=document.documentElement;if(t==="light"||t==="dark")r.setAttribute("data-theme",t);else r.removeAttribute("data-theme");}
document.addEventListener("input",e=>{const t=e.target,k=t.dataset.au;if(!k||t.type==="checkbox")return;let v=t.value;if(k==="emp"||k==="pin"||k==="pin2"){v=v.replace(/\D/g,"");if(v!==t.value)t.value=v;}AUTH.f[k]=v;});
document.addEventListener("change",e=>{const t=e.target;if(t.dataset.au==="usepin"){AUTH.f.usepin=t.checked;renderAuth();}});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.dataset&&e.target.dataset.au){e.preventDefault();if(AUTH.mode==="login")doLogin();else if(AUTH.mode==="menu")enterGuest();}});
document.addEventListener("click",e=>{
 if(e.target.closest("#who")){TAB="perfil";render();window.scrollTo(0,0);return;}
 const b=e.target.closest("[data-ua]");if(!b)return;const p=b.dataset.ua.split(":"),a=p[0],v=p[1];
 if(a==="mode"){AUTH.mode=v;AUTH.err="";if(v==="menu")AUTH.f={};renderAuth();}
 else if(a==="guest")enterGuest();
 else if(a==="doLogin")doLogin();else if(a==="doSignup")doSignup();
 else if(a==="pick"){AUTH.f.emp=v;AUTH.f.pin="";AUTH.err="";renderAuth();}
 else if(a==="logout")logout();
 else if(a==="csave")cloudSave();else if(a==="cnow")cloudPush(true);else if(a==="crec")cloudRecover();else if(a==="coff"){LS.set("cryd:cloud",null);CL.st="";toast("Respaldo en servidor desactivado.");render();}
 else if(a==="gwipe")dlg({title:"Borrar mis datos",body:"Se borran de este dispositivo tus folios, LPN, validaciones y dashboards guardados. No se puede deshacer.",buttons:[{t:"Cancelar"},{t:"Borrar",cls:"dg",fn:()=>{try{Object.keys(localStorage).filter(k=>k.indexOf("cryd:ug:")===0).forEach(k=>localStorage.removeItem(k));}catch(x){}lpReset();loadUserData();toast("Datos borrados.");TAB="home";render();}}]});
 else if(a==="theme"){LS.set("cryd:theme",v);applyTheme();render();}
 else if(a==="delacc")dlg({title:"Eliminar cuenta",body:"Se borrarán tu cuenta y todos tus folios guardados en este dispositivo. No se puede deshacer.",buttons:[{t:"Cancelar"},{t:"Eliminar",cls:"dg",fn:()=>{const e2=ME.emp;["rec","warn","draft","stmap","rcvx","rcvs","rcvcur","surx","surs","surcur","hlog","dsh"].forEach(k=>{try{localStorage.removeItem("cryd:u"+e2+":"+k);}catch(x){}});USERS=USERS.filter(u=>u.emp!==e2);saveUsers();logout();toast("Cuenta eliminada.");}}]});});

/* ---------- respaldo en servidor (Firebase Realtime Database, vía REST) ---------- */
const CLOUD_DEFAULT="https://procesos-cryd-default-rtdb.firebaseio.com";/* opcional: pon aquí la dirección del servidor para que todos tus compañeros la usen sin configurar */
const CL={st:"",ing:false};let CT=0;
const normUrl=s=>{s=(s||"").trim().replace(/\/+$/,"");if(s&&!/^https?:\/\//i.test(s))s="https://"+s;return s;};
function cloudCfg(){const c=LS.get("cryd:cloud",null);return normUrl(c&&c.url?c.url:CLOUD_DEFAULT);}
const cloudEp=emp=>cloudCfg()+"/cryd/u"+emp+".json";
const hhmm=t=>new Date(t).toLocaleString("es-MX",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
function cloudPack(){const u=USERS.find(x=>x.emp===ME.emp)||{};return {ts:Date.now(),acct:{nombre:ME.nombre,apellido:ME.apellido,pin:u.pin||null},rec:REC,warn:WARN,draft:S,stmap:VAL.stmap||{},rcvs:LP.rcv.S.filter(s=>s.lpn),surs:LP.sur.S.filter(s=>s.lpn),hlog:HLOG,dsh:DSH,att:ATT};}
function cloudSoon(){if(!ME||ME.guest||!cloudCfg())return;LS.set("cryd:u"+ME.emp+":cpend",1);clearTimeout(CT);CT=setTimeout(()=>cloudPush(false),2500);}
async function cloudGet(emp){try{const r=await fetch(cloudEp(emp),{cache:"no-store"});if(!r.ok)throw 0;return await r.json();}catch(e){return undefined;}}
async function cloudPush(manual,hide){
 if(!ME||ME.guest)return false;if(!cloudCfg()){if(manual)toast("Primero guarda la dirección del servidor.");return false;}
 if(CL.ing&&!manual)return false;
 if(navigator.onLine===false){CL.st="Sin conexión · se respaldará al volver el internet";if(manual)toast(CL.st);if(TAB==="perfil")render();return false;}
 CL.ing=true;
 try{const body=cloudPack(),txt=JSON.stringify(body);
  const r=await fetch(cloudEp(ME.emp),{method:"PUT",body:txt,keepalive:!!hide&&txt.length<60000});if(!r.ok)throw new Error(r.status);
  LS.set("cryd:u"+ME.emp+":cpend",0);LS.set("cryd:u"+ME.emp+":cts",body.ts);CL.st="Respaldado "+hhmm(body.ts);if(manual)toast("Respaldo listo.");CL.ing=false;if(TAB==="perfil"&&!hide)render();return true;}
 catch(e){CL.ing=false;CL.st="No se pudo conectar con el servidor · se reintentará solo";if(manual)toast(CL.st);if(TAB==="perfil"&&!hide)render();return false;}
}
function cloudMerge(rm,force){
 let n=0;const lst=Array.isArray(rm.rec)?rm.rec:Object.values(rm.rec||{}),rw=rm.warn||{};
 WARN.gone=Object.assign({},rw.gone||{},WARN.gone||{});
 lst.forEach(r=>{if(!r||!r.id||WARN.gone[r.id])return;const i=REC.findIndex(x=>x.id===r.id);if(i<0){REC.push(r);n++;}else if((r.upd||0)>(REC[i].upd||0)){REC[i]=r;n++;}});
 REC=REC.filter(r=>!WARN.gone[r.id]);
 ["dup","del"].forEach(k=>{WARN[k]=WARN[k]||{};Object.keys(rw[k]||{}).forEach(x=>{WARN[k][x]=Math.max(WARN[k][x]||0,rw[k][x]);});});
 VAL.stmap=Object.assign({},rm.stmap||{},VAL.stmap||{});
 const cts=LS.get("cryd:u"+ME.emp+":cts",0),pend=LS.get("cryd:u"+ME.emp+":cpend",0);
 const d=rm.draft;
 if(d&&d.id&&Array.isArray(d.lots)&&d.lots.length===5&&(force||!cts||(!pend&&(rm.ts||0)>cts))){S=d;n++;}
 n+=lpMerge("rcv",rm.rcvs)+lpMerge("sur",rm.surs)+hlogMerge(rm.hlog)+dshMerge(rm.dsh);
 U.set("rec",REC);U.set("warn",WARN);U.set("stmap",VAL.stmap);if(S)U.set("draft",S);
 return n;
}
async function cloudStart(){
 if(!ME||ME.guest||!cloudCfg())return;
 if(navigator.onLine===false){CL.st="Sin conexión · se respaldará al volver el internet";return;}
 const rm=await cloudGet(ME.emp);
 if(rm===undefined){CL.st="No se pudo conectar con el servidor · se reintentará solo";cloudSoon();return;}
 if(rm&&rm.acct&&rm.acct.off){logout();dlg({title:"Cuenta suspendida",body:"El administrador suspendió esta cuenta. Contáctalo para volver a usarla.",buttons:[{t:"Entendido",cls:"pri"}]});return;}
 let n=0;if(rm&&(rm.rec||rm.draft))n=cloudMerge(rm,false);
 await cloudPush(false);render();
 if(n)toast("Se recuperaron avances del servidor.");
}
async function cloudRecover(){
 if(!cloudCfg()){toast("Primero guarda la dirección del servidor.");return;}
 busy("Consultando el servidor…");const rm=await cloudGet(ME.emp);busy("");
 if(rm===undefined){toast("No se pudo conectar con el servidor.");return;}
 if(!rm||!(rm.rec||rm.draft)){toast("El servidor aún no tiene respaldo tuyo.");return;}
 dlg({title:"Recuperar del servidor",body:"Se agregarán los folios que falten y se restaurará el folio en captura que tenía el servidor ("+(rm.ts?hhmm(rm.ts):"")+"). Tus folios actuales no se borran.",buttons:[{t:"Cancelar"},{t:"Recuperar",cls:"pri",fn:()=>{const n=cloudMerge(rm,true);cloudPush(false);toast(n?"Avances recuperados.":"Ya tenías todo.");TAB="insp";render();}}]});
}
async function cloudSave(){
 const u=normUrl(CL.url||"");if(!u){toast("Escribe la dirección del servidor.");return;}
 busy("Probando conexión…");
 try{const r=await fetch(u+"/cryd/ping.json",{method:"PUT",body:JSON.stringify({t:Date.now()})});if(!r.ok)throw new Error(r.status);}
 catch(e){busy("");toast("No se pudo escribir en esa dirección. Revisa la URL y las reglas del servidor.");return;}
 busy("");LS.set("cryd:cloud",{url:u});CL.url=u;toast("Servidor conectado.");await cloudStart();render();
}
function viewCloud(){
 const on=!!cloudCfg(),pend=LS.get("cryd:u"+ME.emp+":cpend",0),cts=LS.get("cryd:u"+ME.emp+":cts",0);
 const st=on?(CL.st||(pend?"Pendiente de respaldar":cts?"Respaldado "+hhmm(cts):"Conectado")):"Sin servidor configurado";
 return `<div class="card"><h2 class="sh">Respaldo en servidor</h2><p class="mu" style="margin:6px 0 10px;font-size:14px">Tus folios y el folio en captura se copian solos al servidor. Si se corta el internet o cambias de teléfono, se recuperan al volver a entrar.</p>
 <p style="margin:0 0 10px;font-size:14px"><b>Estado:</b> ${esc(st)}</p>
 <label class="lb">Dirección del servidor</label><input data-cu="url" autocomplete="off" autocapitalize="off" value="${esc(CL.url!==undefined?CL.url:cloudCfg())}" placeholder="https://tu-proyecto.firebaseio.com">
 <div class="row3" style="margin-top:10px"><button type="button" class="btn pri" data-ua="csave">${on?"Actualizar":"Conectar"}</button>${on?`<button type="button" class="btn" data-ua="cnow">Respaldar ahora</button><button type="button" class="btn" data-ua="crec">Recuperar</button>`:""}</div>${on?`<button type="button" class="btn txt" style="width:100%;margin-top:6px" data-ua="coff">Desactivar</button>`:""}</div>`;}
document.addEventListener("input",e=>{if(e.target.dataset&&e.target.dataset.cu==="url")CL.url=e.target.value;});
addEventListener("online",()=>{if(ME&&!ME.guest&&LS.get("cryd:u"+ME.emp+":cpend",0))cloudPush(false);});
document.addEventListener("visibilitychange",()=>{if(!ME||ME.guest||!cloudCfg())return;if(document.visibilityState==="hidden"){if(LS.get("cryd:u"+ME.emp+":cpend",0))cloudPush(false,true);}else if(LS.get("cryd:u"+ME.emp+":cpend",0))cloudPush(false);});
setInterval(()=>{if(ME&&!ME.guest&&cloudCfg()&&LS.get("cryd:u"+ME.emp+":cpend",0))cloudPush(false);},60000);
/* ---------- invitados y administrador ---------- */
function gst(){let g=LS.get("cryd:g",null);if(!g||!g.id)g={id:Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-3),first:Date.now(),n:0,pdf:0,val:0,rcv:0};return g;}
function gstInc(k){if(!ME||!ME.guest)return;const g=gst();g[k]=(g[k]||0)+1;g.last=Date.now();g.nm=ME.nombre||"";try{g.pl=attPl();}catch(e){}LS.set("cryd:g",g);const u=cloudCfg();if(!u||navigator.onLine===false)return;
 try{fetch(u+"/cryd_guests/"+g.id+".json",{method:"PUT",body:JSON.stringify(Object.assign({ua:(navigator.userAgent.match(/iPhone|iPad|Android|Windows|Macintosh|Linux/)||["?"])[0]},g))}).catch(()=>{});}catch(e){}}
const ADM={list:null,guests:null,err:"",exp:{},loading:false};
const admOn=()=>LS.get("cryd:adm",0)===1;
async function admHash(c){try{const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("cryd|admin|"+c));return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("");}catch(e){return "x"+btoa("admin:"+c);}}
async function admLogin(){
 const code=(ADM.code||"").trim();if(!cloudCfg()){toast("Primero conecta el servidor en Respaldo en servidor.");return;}
 if(code.length<6){toast("El código debe tener al menos 6 caracteres.");return;}
 busy("Verificando…");
 try{const h=await admHash(code),r=await fetch(cloudCfg()+"/cryd_admin.json",{cache:"no-store"});if(!r.ok)throw 0;const cur=await r.json();
  if(cur===null){const w=await fetch(cloudCfg()+"/cryd_admin.json",{method:"PUT",body:JSON.stringify({h,at:Date.now(),by:ME.emp})});if(!w.ok)throw 0;LS.set("cryd:adm",1);toast("Código de administrador creado.");}
  else if(cur.h===h){LS.set("cryd:adm",1);toast("Acceso de administrador.");}
  else{toast("Código incorrecto.");busy("");return;}
 }catch(e){busy("");toast("No se pudo conectar con el servidor.");return;}
 busy("");ADM.code="";TAB="admin";admLoad();render();}
async function admLoad(){
 const u=cloudCfg();if(!u)return;ADM.loading=true;ADM.err="";if(TAB==="admin")render();
 try{const r=await fetch(u+"/cryd.json?shallow=true",{cache:"no-store"});if(!r.ok)throw 0;const keys=Object.keys((await r.json())||{}).filter(k=>/^u\d{4,8}$/.test(k));
  const rows=await Promise.all(keys.map(k=>fetch(u+"/cryd/"+k+".json",{cache:"no-store"}).then(x=>x.json()).then(j=>({emp:k.slice(1),j:j||{}})).catch(()=>({emp:k.slice(1),j:{}}))));
  ADM.list=rows.sort((a,b)=>((b.j.ts)||0)-((a.j.ts)||0));
  const g=await fetch(u+"/cryd_guests.json",{cache:"no-store"}).then(x=>x.json()).catch(()=>null);
  ADM.guests=Object.values(g||{}).sort((a,b)=>(b.last||0)-(a.last||0));
  ADM.marks=await fetch(u+"/cryd_marks.json",{cache:"no-store"}).then(x=>x.json()).catch(()=>null)||{};
 }catch(e){ADM.err="No se pudo leer el servidor. Revisa la conexión y las reglas de la base de datos.";}
 ADM.loading=false;if(TAB==="admin")render();}
async function admPatch(emp,body){const u=cloudCfg();const r=await fetch(u+"/cryd/u"+emp+"/acct.json",{method:"PATCH",body:JSON.stringify(body)});if(!r.ok)throw 0;}
async function admAct(a,emp){
 try{
  if(a==="off"){await admPatch(emp,{off:true});toast("Cuenta "+emp+" suspendida.");}
  else if(a==="on"){await admPatch(emp,{off:false});toast("Cuenta "+emp+" activada.");}
  else if(a==="reset"){await admPatch(emp,{reset:Date.now(),pin:null});toast("PIN restablecido. La próxima vez entra sin PIN.");}
  else if(a==="del"){const r=await fetch(cloudCfg()+"/cryd/u"+emp+".json",{method:"DELETE"});if(!r.ok)throw 0;toast("Datos del servidor eliminados.");}
  else if(a==="gdel"){await fetch(cloudCfg()+"/cryd_guests/"+emp+".json",{method:"DELETE"});}
 }catch(e){toast("No se pudo completar. Revisa la conexión.");}
 admLoad();}
function viewAdminCard(){
 if(admOn())return `<div class="card"><h2 class="sh">Administrador</h2><p class="mu" style="margin:6px 0 12px;font-size:14px">Cuentas, invitados y avances de todos los usuarios que usan el servidor.</p><button type="button" class="btn pri" style="width:100%" data-ad="open">Abrir panel</button><button type="button" class="btn txt" style="width:100%;margin-top:6px" data-ad="lock">Salir del modo administrador</button></div>`;
 return `<div class="card"><h2 class="sh">Administrador</h2><p class="mu" style="margin:6px 0 8px;font-size:13px">Solo para el responsable de la app. La primera vez crea tu código (mínimo 6 caracteres); después úsalo para entrar.</p><input data-ad-in type="password" autocomplete="off" placeholder="Código de administrador" value="${esc(ADM.code||"")}"><button type="button" class="btn" style="width:100%;margin-top:10px" data-ad="login">Entrar</button></div>`;}

/* ---- atención y duplicados (administrador) ---- */
const MN={rcv:"Recibo",sur:"Surtido",insp:"Maquila"};
function admAtt(){const E=[],mk=ADM.marks||{},arr=v=>Array.isArray(v)?v:Object.values(v||{});
 (ADM.list||[]).forEach(x=>{const j=x.j,a=j.acct||{},who=((a.nombre||"")+" "+(a.apellido||"")).trim()||("No. "+x.emp),src="u"+x.emp,at=j.att||{};
  [["rcv",j.rcvs],["sur",j.surs]].forEach(([m,v])=>arr(v).forEach(s=>{if(s&&s.id&&s.lpn)E.push({who,src,m,k:s.lpn,id:s.id,st:s.status,ok:(s.items||[]).filter(i=>i.st==="ok").length,n:(s.items||[]).length,u:s.upd||s.at||0,w:(at[s.id]||{}).wn||0,a:(at[s.id]||{}).att?1:0});}));
  arr(j.rec).forEach(r=>{if(r&&r.id&&(r.status==="pendiente"||r.status==="dup"||r.status==="completo"))E.push({who,src,m:"insp",k:r.folio,id:r.id,st:r.status,ok:0,n:0,u:r.upd||0,w:(at[r.id]||{}).wn||0,a:(at[r.id]||{}).att?1:0});});});
 (ADM.guests||[]).forEach(g=>{const who="Invitado "+(g.nm&&g.nm!=="Invitado"?g.nm+" · ":"")+g.id,src="g"+g.id;arr(g.pl).forEach(p=>E.push({who,src,m:p.m,k:p.k,id:p.id,st:p.st,ok:p.ok||0,n:p.n||0,u:p.u||0,w:p.w||0,a:p.a||0}));});
 E.forEach(e=>{const k=(mk[e.src]||{})[e.id];if(k&&k.st==="dup")e.st="dup";e.del=!!(k&&k.st==="del");});
 const live=E.filter(e=>!e.del),G={};live.forEach(e=>{(G[e.m+"|"+e.k]=G[e.m+"|"+e.k]||[]).push(e);});
 const dups=[],singles=[];
 Object.keys(G).forEach(k=>{const g=G[k],act=g.filter(e=>e.st!=="dup");
  if(g.length>1&&g.some(e=>e.st==="proceso"||e.st==="pendiente"||e.st==="dup"||e.a)){const sc=e=>(e.st==="ok"||e.st==="dif"||e.st==="completo"?1000:0)+e.ok*10+(e.st==="dup"?-5000:0)+e.u/1e13;g.sort((x,y)=>sc(y)-sc(x));dups.push(g);}
  else g.forEach(e=>{if(e.a||(e.w&&(e.st==="proceso"||e.st==="pendiente"))||e.st==="dup")singles.push(e);});});
 return {dups,singles};}
function admEnt(e,best){const f=t=>t?new Date(t).toLocaleString("es-MX",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"—";
 const tag=e.st==="dup"?'<span class="tg" style="background:var(--erb);color:var(--er)">Para borrar</span>':e.a?'<span class="tg" style="background:var(--erb);color:var(--er)">⚠ Atención</span>':e.w?'<span class="tg">aviso '+e.w+'/2</span>':'';
 const sc=best===1?'<span class="tg" style="background:var(--okb);color:var(--ok)">Probable correcto</span>':best===0?'<span class="tg">Probable duplicado</span>':'';
 const sts=e.st==="ok"?"correcta":e.st==="dif"?"con diferencias":e.st==="proceso"?"en proceso":e.st==="pendiente"?"pendiente":e.st==="completo"?"completo":e.st;
 const bt=e.st==="dup"?`<button type="button" class="btn" data-ad="mk" data-src="${e.src}" data-id="${e.id}" data-st="ok">Restaurar</button><button type="button" class="btn dg" data-ad="mk" data-src="${e.src}" data-id="${e.id}" data-st="del">Borrar definitivamente</button>`:`<button type="button" class="btn dg" data-ad="mk" data-src="${e.src}" data-id="${e.id}" data-st="dup">Marcar para borrar</button>`;
 return `<div class="vx" style="margin-top:8px"><div class="t"><b>${esc(e.who)}</b>${tag}${sc}</div><p style="margin:4px 0 0;font-size:12px;color:var(--mu)">${MN[e.m]||e.m} · ${esc(e.m==="insp"?"folio "+e.k:"LPN "+lpFmt(e.k))} · ${esc(sts)}${e.n?" · "+e.ok+" de "+e.n+" verificados":""} · últ. cambio ${esc(f(e.u))}</p><div class="row3" style="margin-top:6px">${bt}</div></div>`;}
function admAttCard(){const r=admAtt(),n=r.dups.length+r.singles.length;
 let h=`<div class="card"><h2 class="sh"><i>⚠</i>Atención y duplicados<em>${n}</em></h2><p class="mu" style="margin:6px 0 0;font-size:13px">Procesos sin terminar con avisos y registros repetidos. «Marcar para borrar» solo los aparta (no se pierden); bórralos definitivamente cuando quieras.</p>`;
 if(!n)return h+'<div class="emp">Sin procesos con atención ni duplicados.</div></div>';
 r.dups.forEach(g=>{h+=`<div style="margin-top:12px"><b style="font-size:14px">Duplicado · ${MN[g[0].m]||g[0].m} ${esc(g[0].m==="insp"?g[0].k:lpFmt(g[0].k))}</b>${g.map((e,i)=>admEnt(e,i===0?1:0)).join("")}</div>`;});
 if(r.singles.length)h+=`<div style="margin-top:12px"><b style="font-size:14px">Sin terminar con atención</b>${r.singles.map(e=>admEnt(e,-1)).join("")}</div>`;
 return h+"</div>";}
async function admMark(src,id,st){const u=cloudCfg();if(!u)return;
 const go=async()=>{try{const r=await fetch(u+"/cryd_marks/"+src+"/"+id+".json",{method:"PUT",body:JSON.stringify({st,at:Date.now()})});if(!r.ok)throw 0;ADM.marks=ADM.marks||{};(ADM.marks[src]=ADM.marks[src]||{})[id]={st,at:Date.now()};toast(st==="dup"?"Marcado para borrar. El usuario lo verá al abrir la app.":st==="del"?"Se borrará del teléfono del usuario.":"Restaurado.");render();}catch(e){toast("No se pudo guardar la marca. Revisa la conexión.");}};
 if(st==="del")dlg({title:"Borrar definitivamente",body:"Se eliminará este registro del teléfono del usuario la próxima vez que abra la app. No se puede deshacer.",buttons:[{t:"Cancelar"},{t:"Borrar",cls:"dg",fn:go}]});else go();}

function viewAdmin(){
 if(!admOn())return '<p class="mu">Sin acceso.</p>';
 const fh=t=>t?new Date(t).toLocaleString("es-MX",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"—";
 let h=`<div class="row3" style="margin-top:0"><button type="button" class="btn" data-ad="refresh">${ADM.loading?"Actualizando…":"Actualizar"}</button><button type="button" class="btn" data-ad="back">Volver</button></div>${ADM.err?`<div class="vbanner no" style="margin-top:12px">${esc(ADM.err)}</div>`:""}`;
 const L=ADM.list||[];
 h+=admAttCard();
 h+=`<div class="card"><h2 class="sh"><i>👤</i>Cuentas<em>${L.length}</em></h2>${L.length?L.map(x=>{const j=x.j,a=j.acct||{},rec=Array.isArray(j.rec)?j.rec:Object.values(j.rec||{}),pn=rec.filter(r=>r&&r.status==="pendiente").length,rs=Array.isArray(j.rcvs)?j.rcvs:Object.values(j.rcvs||{}),open=ADM.exp[x.emp];
  return `<div class="vx"><div class="t"><b>${esc((a.nombre||"?")+" "+(a.apellido||""))}</b><span class="tg" ${a.off?'style="background:var(--erb);color:var(--er)"':''}>${a.off?"Suspendida":"Activa"}</span></div><p style="margin:4px 0 0;font-size:12px;color:var(--mu)">No. ${esc(x.emp)}${a.pin?" · con PIN":""} · último respaldo ${esc(fh(j.ts))}</p><p style="margin:2px 0 0;font-size:12px;color:var(--mu)">${rec.length} folios (${pn} pendientes) · ${rs.length} LPN</p>
  <div class="row3" style="margin-top:8px"><button type="button" class="btn" data-ad="exp" data-id="${x.emp}">${open?"Ocultar":"Ver detalle"}</button><button type="button" class="btn" data-ad="${a.off?"on":"off"}" data-id="${x.emp}">${a.off?"Activar":"Suspender"}</button><button type="button" class="btn" data-ad="reset" data-id="${x.emp}">Restablecer PIN</button><button type="button" class="btn" data-ad="del" data-id="${x.emp}">Borrar datos</button></div>
  ${open?`<div style="margin-top:8px;font-size:12px;color:var(--mu)">${rec.slice(-15).reverse().map(r=>r?esc(r.folio)+" · "+esc(r.status):"").join("<br>")||"Sin folios."}${rs.length?"<br><b>LPN:</b> "+rs.slice(-10).reverse().map(s=>s?esc(s.lpn)+" · "+esc(s.status):"").join("<br>"):""}</div>`:""}</div>`;}).join(""):'<p class="mu" style="margin:8px 0 0;font-size:14px">Aún no hay cuentas respaldadas en el servidor.</p>'}</div>`;
 const G=ADM.guests||[];
 h+=`<div class="card"><h2 class="sh"><i>👥</i>Invitados<em>${G.length}</em></h2>${G.length?G.map(g=>`<div class="vx"><div class="t"><b>${esc(g.nm&&g.nm!=="Invitado"?g.nm+" · ":"")}Invitado ${esc(g.id)}</b><span class="tg">${esc(g.ua||"")}</span></div><p style="margin:4px 0 0;font-size:12px;color:var(--mu)">Última vez ${esc(fh(g.last))} · ${g.n||0} ingresos · ${g.pdf||0} PDF · ${g.val||0} validaciones · ${g.rcv||0} recibos · ${g.sur||0} surtidos · ${g.dash||0} dashboards</p><div class="row3" style="margin-top:8px"><button type="button" class="btn" data-ad="gdel" data-id="${esc(g.id)}">Quitar del registro</button></div></div>`).join(""):'<p class="mu" style="margin:8px 0 0;font-size:14px">Aún no hay invitados registrados.</p>'}</div>`;
 return h;}
document.addEventListener("input",e=>{if(e.target.dataset&&e.target.dataset.adIn!==undefined)ADM.code=e.target.value;});
document.addEventListener("click",e=>{const b=e.target.closest("[data-ad]");if(!b)return;const a=b.dataset.ad,id=b.dataset.id;
 if(a==="login")admLogin();
 else if(a==="open"){TAB="admin";admLoad();render();window.scrollTo(0,0);}
 else if(a==="lock"){LS.set("cryd:adm",0);toast("Saliste del modo administrador.");render();}
 else if(a==="back"){TAB="perfil";render();}
 else if(a==="refresh")admLoad();
 else if(a==="mk")admMark(b.dataset.src,id,b.dataset.st);
 else if(a==="exp"){ADM.exp[id]=!ADM.exp[id];render();}
 else if(a==="del")dlg({title:"Borrar datos del servidor",body:"Se borra el respaldo de la cuenta "+id+" en el servidor. Si esa persona sigue usando su teléfono, el respaldo se vuelve a crear. Para bloquear el acceso usa Suspender.",buttons:[{t:"Cancelar"},{t:"Borrar",cls:"dg",fn:()=>admAct("del",id)}]});
 else if(a==="gdel"||a==="off"||a==="on"||a==="reset")admAct(a,id);});
/* ---------- recuperar avances ---------- */
function flushAll(){try{if(ME){if(S)saveDraft();lpFlush();LS.set("cryd:ui",{emp:ME.emp,tab:TAB,ts:Date.now()});if(!ME.guest&&cloudCfg()&&LS.get("cryd:u"+ME.emp+":cpend",0))cloudPush(false,true);}}catch(e){}}
addEventListener("pagehide",flushAll);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flushAll();});
let ERRN=0;addEventListener("error",()=>{flushAll();if(ERRN++<2)toast("Algo falló, pero tu avance está guardado.");});addEventListener("unhandledrejection",()=>{flushAll();});
function boot(){applyTheme();const ses=LS.get("cryd:session",null),ui=LS.get("cryd:ui",null),fresh=ui&&ui.ts&&Date.now()-ui.ts<10*60*1000;
 if(ses&&ses.guest){ME={emp:"INVITADO",nombre:LS.get("cryd:gname","")||"Invitado",apellido:"",guest:true};loadUserData();TAB=fresh&&ui.emp==="INVITADO"&&TNAME[ui.tab]?ui.tab:"home";}
 else{const u=ses&&USERS.find(x=>x.emp===ses.emp);if(u){ME={emp:u.emp,nombre:u.nombre,apellido:u.apellido,guest:false};loadUserData();TAB=fresh&&ui.emp===ME.emp&&TNAME[ui.tab]?ui.tab:"home";}}
 render();if(ME&&!ME.guest)cloudStart();}

/* ---------- cámara y galería ---------- */
const PROMPT='Lee la etiqueta o documento de la foto. Extrae: codigo (código de producto/SKU/material), lote (lote/batch) y descripcion (nombre completo del producto, por ejemplo toalla femenina, jabón o shampoo, con su marca o variante y el contenido o cantidad exactamente como aparece, por ejemplo 400 ml, 30 piezas o 3 en 1). El código tiene 8 dígitos y empieza con 80. El lote tiene 10 caracteres entre números y letras: devuelve solo el lote, sin prefijos. Transcribe exactamente lo que ves, sin inventar. Responde SOLO un JSON {"codigo":"","lote":"","descripcion":""}; usa cadena vacía si no ves el dato.';
function stopCam(){if(STREAM){STREAM.getTracks().forEach(t=>t.stop());STREAM=null;}$("#vd").srcObject=null;$("#cv").hidden=true;}
async function openCam(){
 $("#cvm").hidden=true;$("#vd").hidden=false;$("#fr").hidden=false;$("#shut").hidden=false;$("#cv").hidden=false;
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){noCam();return;}
 try{STREAM=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080}},audio:false});const v=$("#vd");v.srcObject=STREAM;await v.play().catch(()=>{});}
 catch(err){noCam();}
}
function noCam(){if(STREAM){STREAM.getTracks().forEach(t=>t.stop());STREAM=null;}$("#vd").hidden=true;$("#fr").hidden=true;$("#shut").hidden=true;$("#cvm").hidden=false;}
$("#cvx").onclick=stopCam;
$("#shut").onclick=()=>{const v=$("#vd");if(!v.videoWidth)return;const k=Math.min(1,2000/Math.max(v.videoWidth,v.videoHeight)),c=document.createElement("canvas");c.width=Math.round(v.videoWidth*k);c.height=Math.round(v.videoHeight*k);c.getContext("2d").drawImage(v,0,0,c.width,c.height);c.toBlob(b=>{stopCam();ocr(b,TARGET);},"image/jpeg",.82);};
async function shrink(file){
 let bm=null;try{bm=await createImageBitmap(file);}catch(e){}
 if(!bm||!(bm.width>0)){bm=await new Promise((ok,no)=>{const fr=new FileReader();fr.onerror=no;fr.onload=()=>{const im=new Image();im.onload=()=>ok(im);im.onerror=no;im.src=fr.result;};fr.readAsDataURL(file);});}
 const w=bm.width||bm.naturalWidth,h=bm.height||bm.naturalHeight;if(!(w>0&&h>0))throw new Error("img");
 const k=Math.min(1,2000/Math.max(w,h)),c=document.createElement("canvas");c.width=Math.round(w*k);c.height=Math.round(h*k);
 const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(bm,0,0,c.width,c.height);
 const url=c.toDataURL("image/jpeg",.85),bin=atob(url.split(",")[1]),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
 return {blob:new Blob([u8],{type:"image/jpeg"}),url};}
function showPreview(img,src){PV={blob:img.blob,src,url:img.url};const e=$("#pvimg");e.style.background="#fff";e.src=img.url;$("#pvg").hidden=src!=="gal";$("#pvc").hidden=src==="gal";$("#cv").hidden=true;$("#pv").hidden=false;}
const tmo=(p,ms)=>new Promise((ok,no)=>{const t=setTimeout(()=>no(new Error("timeout")),ms);p.then(v=>{clearTimeout(t);ok(v);},e=>{clearTimeout(t);no(e);});});
async function onFile(e,src){const f=e.target.files[0];e.target.value="";if(!f)return;busy("Preparando foto…");await new Promise(r=>setTimeout(r,40));
 try{showPreview(await tmo(shrink(f),25000),src);}catch(err){toast(err&&err.message==="timeout"?"La foto tardó demasiado en abrirse. Prueba con otra o usa la cámara.":"No se pudo abrir esa imagen.");}busy("");}
$("#gal").addEventListener("change",e=>onFile(e,"gal"));$("#cam").addEventListener("change",e=>onFile(e,"cam"));
$("#pvno").onclick=()=>{$("#pv").hidden=true;};
$("#pvc").onclick=()=>{$("#pv").hidden=true;$("#cam").click();};
$("#pvuse").onclick=()=>{$("#pv").hidden=true;if(PV){if(String(TARGET).indexOf("L:")===0){const q=String(TARGET).split(":");lpPhoto(q[1],PV,q[2]);}else ocr(PV.blob,TARGET);}};
const WK={};let OCRON=false;
function dropWorkers(){Object.keys(WK).forEach(k=>{const p=WK[k];delete WK[k];Promise.resolve(p).then(w=>w&&w.terminate&&w.terminate()).catch(()=>{});});}
const withTimeout=(p,ms)=>new Promise((ok,no)=>{const t=setTimeout(()=>{dropWorkers();no(new Error("timeout"));},ms);p.then(v=>{clearTimeout(t);ok(v);},e=>{clearTimeout(t);no(e);});});
const getWorker=t=>(t=t==="lote"?"codigo":t,WK[t])||(WK[t]=(async()=>{const w=await Tesseract.createWorker(t==="desc"?"spa":"eng",1,{logger:m=>{if(!OCRON)return;if(m.status==="recognizing text")busy("Leyendo etiqueta… "+Math.round((m.progress||0)*100)+"%",CANC);else if(m.status)busy("Preparando lector…",CANC);}});
 await w.setParameters({tessedit_pageseg_mode:t==="desc"?"3":"11"});return w;})());
let CANC=null;
async function prep(blob,max,bin){const bm=await createImageBitmap(blob),k=Math.min(1,(max||1100)/Math.max(bm.width,bm.height)),c=document.createElement("canvas");c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);
 const x=c.getContext("2d");x.drawImage(bm,0,0,c.width,c.height);if(bm.close)bm.close();const im=x.getImageData(0,0,c.width,c.height),p=im.data,g=new Uint8Array(p.length/4);let lo=255,hi=0;
 for(let i=0,j=0;i<p.length;i+=4,j++){const v=(p[i]*.299+p[i+1]*.587+p[i+2]*.114)|0;g[j]=v;if(v<lo)lo=v;if(v>hi)hi=v;}
 if(bin){const h=new Array(256).fill(0);for(let j=0;j<g.length;j++)h[g[j]]++;let sum=0;for(let t=0;t<256;t++)sum+=t*h[t];let sB=0,wB=0,mx=0,th=128;
  for(let t=0;t<256;t++){wB+=h[t];if(!wB)continue;const wF=g.length-wB;if(!wF)break;sB+=t*h[t];const mB=sB/wB,mF=(sum-sB)/wF,vv=wB*wF*(mB-mF)*(mB-mF);if(vv>mx){mx=vv;th=t;}}
  for(let i=0,j=0;i<p.length;i+=4,j++){const v=g[j]>th?255:0;p[i]=p[i+1]=p[i+2]=v;}}
 else{const sc=hi>lo?255/(hi-lo):1;for(let i=0,j=0;i<p.length;i+=4,j++){const v=Math.max(0,Math.min(255,(g[j]-lo)*sc))|0;p[i]=p[i+1]=p[i+2]=v;}}
 x.putImageData(im,0,0);return c;}
/* Lee una foto con hasta dos intentos (normal y blanco/negro). Nunca se queda colgada: tiene tiempo límite y botón Cancelar. */
async function ocrRaw(blob,o){o=o||{};let cancelled=false;OCRON=true;CANC=()=>{cancelled=true;dropWorkers();};
 try{if(typeof Tesseract==="undefined")throw new Error("lib");
  busy("Preparando lector…",CANC);await new Promise(r=>setTimeout(r,40));
  const lang=o.lang||"codigo",psm=lang==="desc"?"3":"11";
  const passes=[{wl:o.digits?"0123456789() ":"",max:o.max||1100,bin:false},{wl:"",max:o.max2||1600,bin:true}];let out="";
  for(const ps of passes){if(cancelled)throw new Error("cancel");
   const img=await prep(blob,ps.max,ps.bin),w=await getWorker(lang);
   await w.setParameters({tessedit_char_whitelist:ps.wl,tessedit_pageseg_mode:psm});
   const r=await withTimeout(w.recognize(img),30000);out+="\n"+((r&&r.data&&r.data.text)||"");
   if(o.stop&&o.stop(out))break;}
  if(cancelled)throw new Error("cancel");return out;
 }catch(e){if(cancelled)throw new Error("cancel");throw e;}
 finally{OCRON=false;CANC=null;busy("");try{const w=WK[o.lang||"codigo"];if(w)Promise.resolve(w).then(x=>x.setParameters({tessedit_char_whitelist:"",tessedit_pageseg_mode:"11"})).catch(()=>{});}catch(e){}}}
const toks=t=>String(t||"").toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
function readCod(t){for(const k of toks(t)){const u=k.replace(/O/g,"0").replace(/[IL]/g,"1");if(/^80\d{6}$/.test(u))return u;}const m=String(t||"").replace(/\s/g,"").toUpperCase().replace(/O/g,"0").match(/80\d{6}/);return m?m[0]:"";}
function readLote(t){const a=toks(t);
 for(const k of a)if(k.length===11&&k.endsWith("R")&&/\d/.test(k))return k;
 for(const k of a)if(k.length===10&&/\d/.test(k)&&/[A-Z]/.test(k))return k+"R";
 for(const k of a)if(k.length===10&&/\d/.test(k)&&!/^80\d{6}/.test(k))return k+"R";return "";}
function readDesc(t){const lines=String(t||"").split("\n").map(x=>x.trim()).filter(x=>x.length>2);
 const unitRe=/\d+(?:[.,]\d+)?\s*(?:ml|g|gr|kg|l|lt|oz|pzas?|pzs|piezas?|pack|toallas?|bolsas?|u|un|und)\b/i,prodRe=/toalla|jab[oó]n|shampoo|champ[uú]|acondicionador|pa[nñ]al|detergente|suavizante|crema|desodorante|pasta|enjuague|rastrillo|cepillo|bolsas|naturella/i,skip=/lote|lot\b|batch|c[oó]digo|sku|caduc|exp|fecha/i;
 const k=lines.filter(l=>!skip.test(l)&&!/80\d{6}/.test(l)&&(prodRe.test(l)||unitRe.test(l)));
 const r=k.length?k.join(" "):(lines.filter(l=>!skip.test(l)&&!/^[\d\W]+$/.test(l)).sort((a,b)=>b.length-a.length)[0]||"");return r.slice(0,140).trim();}
let WARMED=false;function warmOcr(){if(WARMED||typeof Tesseract==="undefined"||navigator.onLine===false)return;WARMED=true;setTimeout(()=>{getWorker("codigo").catch(()=>{delete WK.codigo;WARMED=false;});},1500);}
addEventListener("pagehide",()=>{try{dropWorkers();WARMED=false;}catch(e){}});
async function ocr(blob,target){
 const idx=S.act,rd=target==="codigo"?readCod:target==="desc"?readDesc:readLote;let txt="";
 try{txt=await ocrRaw(blob,{lang:target==="desc"?"desc":"codigo",stop:t=>!!rd(t)});}
 catch(err){const x=err&&err.message;if(x==="cancel")return;delete WK[target];toast(x==="timeout"?"La lectura tardó demasiado. Acerca la cámara, mejora la luz o captura a mano.":"No se pudo leer la foto ("+String(x||"error").slice(0,40)+"). La primera vez necesita internet para descargar el lector. También puedes capturar a mano.");return;}
 let val="",sel="";
 if(target==="codigo"){val=readCod(txt);if(val){S.codigo=val;sel='[data-k="codigo"]';}}
 else if(target==="desc"){val=readDesc(txt);if(val){S.desc=val;sel='[data-k="desc"]';}}
 else{val=readLote(txt);if(val){S.lots[idx].lote=val;sel=S.act===idx?'[data-l="lote"]':"";}}
 if(!val){toast(target==="codigo"?"No encontré un código de 8 dígitos que inicie con 80.":target==="lote"?"No encontré un lote de 10 caracteres.":"No se detectó la descripción. Acércate y mejora la luz.");return;}
 const inp=sel&&document.querySelector(sel);if(inp)inp.value=val;const c=$("#chips");if(c)c.innerHTML=chips();saveDraft();toast("Cargado: "+val+". Revísalo.");}
function makePdf(S){
 const {jsPDF}=window.jspdf;const d=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
 const L=10,W=277;
 const txt=(t,x,y,o={})=>{d.setFont("helvetica",o.b?"bold":"normal");d.setFontSize(o.sz||7);d.setTextColor(...(o.col||[0,0,0]));d.text(t,x,y,o.al?{align:o.al}:undefined);};
 const box=(x,y,w,h,t,o={})=>{if(o.fill){d.setFillColor(...o.fill);d.rect(x,y,w,h,"FD");}else d.rect(x,y,w,h);
  if(isNA(t)){na(x,y,w,h);return;}
  if(t!==""&&t!=null){d.setFont("helvetica",o.b?"bold":"normal");d.setFontSize(o.sz||7);d.setTextColor(...(o.col||[0,0,0]));
  let z=o.sz||7;{while(z>4.2&&d.getTextWidth(String(t))>w-2){z-=.3;d.setFontSize(z);}}
  const s=d.splitTextToSize(String(t),w-2)[0]||"";d.text(s,o.c?x+w/2:x+1,y+h/2+1.1,o.c?{align:"center"}:undefined);}};
 const na=(x,y,w,h,snap)=>{d.setDrawColor(0);d.setLineWidth(.2);d.line(x,y+h,x+w,y);
  const big=h>=11,sz=big?9:6,cap=sz*.254,dx=big?Math.min(w*.2,8):w*.3,cx=x+w/2;
  const yc=snap?y+Math.floor((h/2)/snap)*snap+snap/2:y+h/2,ly=px=>y+h-(px-x)*h/w;
  const nx=big?cx-dx:x+w*.2,ax=big?cx+dx:x+w*.8;
  txt("N",nx,Math.min(yc+cap/2,ly(nx)-.5),{b:1,sz,al:"center"});txt("A",ax,Math.max(yc+cap/2,ly(ax)+.5+cap),{b:1,sz,al:"center"});
  txt("*",x+w-(big?3.5:2.6),y+(big?4.5:3.2),{b:1,sz:big?11:8});};
 const fb=(x,y,w,h,t,o)=>{box(x,y,w,h,t,o);if(!String(t||"").trim())na(x,y,w,h);};
 d.setDrawColor(0);d.setLineWidth(.2);
 d.setFillColor(0,0,0);d.rect(L,10,W,14,"F");d.setTextColor(255);d.setFont("helvetica","bold");d.setFontSize(12);
 d.text("Formato de Inspección y muestreo en línea",148.5,16,{align:"center"});d.text("Maquila CRyD",148.5,21,{align:"center"});
 d.addImage(LOGO,"PNG",250,10,37,14);
 const runs=[];S.lots.forEach((l,i)=>{if(!used(l)){const r=runs[runs.length-1];if(r&&r[1]===i-1)r[1]=i;else runs.push([i,i]);}});
 const G=[128,128,128],g=[190,190,190],H=5.5,X0=130,CW=31.4,RH=5.1;
 box(L,26,W,5,"DATOS GENERALES",{fill:G,b:1,col:[255,255,255]});
 let y=31;
 box(L,y,25,H,"Fecha:",{b:1});fb(35,y,95,H,fmtF(S.fecha));box(135,y,32,H,"Folio:",{b:1});fb(167,y,120,H,S.folio);y+=H;
 box(L,y,25,H,"Código:",{b:1});fb(35,y,95,H,S.codigo);box(135,y,32,H,"Nivel de inspección:",{b:1});box(167,y,120,H,S.nivel);y+=H;
 box(L,y,25,H,"Descripción:",{b:1});fb(35,y,95,H,S.desc,{fit:1});box(135,y,32,H,"Tipo de muestreo:",{b:1});box(167,y,120,H,S.muestreo);y+=H;
 box(L,y,25,H,"Lote (s):",{b:1});box(135,y,32,H,"Tamaño de muestra:",{b:1});
 const yL=y;S.lots.forEach((l,i)=>{if(used(l)){fb(35+i*19,y,19,H,l.lote);fb(167+i*24,y,24,H,l.muestra);}});y+=H;
 box(L,y,25,H,"Cantidad (s):",{b:1});S.lots.forEach((l,i)=>{if(used(l))fb(35+i*19,y,19,H,cs(l.cant));});
 runs.forEach(([a,b])=>{const n=b-a+1;for(let k=a;k<=b;k++){d.rect(35+k*19,yL,19,H);d.rect(35+k*19,yL+H,19,H);d.rect(167+k*24,yL,24,H);}na(35+a*19,yL,n*19,2*H);na(167+a*24,yL,n*24,H);});y+=H+1.5;
 box(L,y,W,5,"CRITERIOS DE INSPECCIÓN",{fill:G,b:1,col:[255,255,255]});y+=5;
 box(L,y,10,10,"No.",{fill:g,b:1,c:1});box(20,y,22,10,"Tipo de defecto",{fill:g,b:1,c:1});box(42,y,88,10,"Criterio de inspección",{fill:g,b:1,c:1});
 S.lots.forEach((l,i)=>{box(X0+i*CW,y,CW,5,"Lote No. "+(i+1),{fill:g,b:1,c:1});box(X0+i*CW,y+5,CW,5,"Ac: "+l.ac+"   Re: "+l.re,{c:1,sz:6.5});});y+=10;
 const r0=y;
 CRIT.forEach((c,i)=>{
  box(L,y,10,RH,String(i+1),i<2?{c:1,fill:[150,150,150]}:{c:1});
  if(i===0||i===2||i===9){const gh=RH*(i===0?2:i===2?7:3),t=tipo(i).split(" (");d.rect(20,y,22,gh);const yc=y+gh/2;txt(t[0],31,yc-.2,{sz:6.5,al:"center"});txt("("+t[1],31,yc+2.6,{sz:6.5,al:"center"});}
  box(42,y,88,RH,c[0]);
  S.lots.forEach((l,k)=>{if(!used(l))return;const x=X0+k*CW,v=l.res[i];box(x,y,CW,RH,v,{c:1,b:1});if(v==="")na(x,y,CW,RH);});y+=RH;});
 box(L,y,120,H,"Total de defectos:",{fill:g,b:1});S.lots.forEach((l,k)=>{if(used(l))box(X0+k*CW,y,CW,H,String(defects(l)),{fill:g,c:1,b:1});});y+=H;
 box(L,y,120,12,"Observaciones:",{fill:g,b:1});S.lots.forEach((l,k)=>{if(!used(l))return;d.setFillColor(...g);d.rect(X0+k*CW,y,CW,12,"FD");d.setFontSize(5.5);d.setFont("helvetica","normal");d.setTextColor(0);if(isNA(l.obs))na(X0+k*CW,y,CW,12);else d.text(d.splitTextToSize(l.obs||"",CW-2).slice(0,4),X0+k*CW+1,y+3);});y+=12;
 box(L,y,120,H,"**Dictamen:",{fill:g,b:1});S.lots.forEach((l,k)=>{if(used(l))box(X0+k*CW,y,CW,H,l.dict,{fill:g,c:1,b:1});});y+=H;
 runs.forEach(([a,b])=>{const x=X0+a*CW,w=(b-a+1)*CW,gy=r0+12*RH;d.setFillColor(...g);d.rect(x,gy,w,y-gy,"F");for(let k=a;k<=b;k++){const cx=X0+k*CW;for(let j=0;j<12;j++)d.rect(cx,r0+j*RH,CW,RH);d.rect(cx,gy,CW,H);d.rect(cx,gy+H,CW,12);d.rect(cx,gy+H+12,CW,H);}na(x,r0,w,y-r0,RH);});
 txt("* Ac = Valor de tabla ANSI Z1.4 de aceptación y Re = Valor de tabla ANSI Z1.4 de rechazo.",L,y+4,{sz:6});txt("**Liberado / Rechazado",L,y+7.5,{sz:6});y+=10;
 txt("Firma Analista de Calidad CRyD:",148.5,y+1,{b:1,sz:8,al:"center"});d.line(100,y+9,197,y+9);y+=16;
 txt("Rev. 18",50,y,{sz:6,al:"center"});txt("Ref. PR-OP-1715-1220-302",148.5,y,{sz:6,al:"center"});txt("Cod. FO-OP-1715-1220-119",240,y,{sz:6,al:"center"});
 const legal="El presente documento es únicamente para uso interno y la información contenida en el mismo es propiedad de Deutsche Post y todas sus subsidiarias, afiliadas, controladas y/o controladoras “DHL”; es estrictamente confidencial y constituye un secreto industrial en términos del artículo 82 de la Ley de la Propiedad Industrial por lo que el apoderamiento, reproducción, explotación y/o revelación no autorizada de la misma por parte de DHL, constituye un delito en términos de dicha ley y la legislación penal aplicable. En adición a ello, DHL se reserva el derecho de reclamar los daños y perjuicios que deriven del mal uso de la información confidencial contenida en este documento.";
 d.setFont("helvetica","normal");d.setFontSize(5);d.setTextColor(0);
 d.splitTextToSize(legal,W).forEach((ln,i)=>d.text(ln,148.5,y+3.5+i*2.3,{align:"center"}));
 txt("*",L,202,{b:1,sz:16});d.line(L+6,202,L+75,202);
 const name=("Inspeccion_CRyD_"+(S.folio||S.codigo||"sin-folio")+"_"+S.fecha+".pdf").replace(/[^\w.-]/g,"_");
 saveBlob(name,d.output("blob"));
}

