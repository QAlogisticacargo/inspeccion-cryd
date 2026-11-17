/* ===== Icono de temporada (México): cambia solo según la fecha ===== */
const SEA_IC={
 fuegos:'<path d="M12 12V5M12 12l5-5M12 12L7 7M12 12h7M12 12H5M12 12l5 5M12 12l-5 5M12 12v7"/>',
 corona:'<path d="M3 18h18l-1.5-10-4.500 4-3-6-3 6-4.500-4z"/><path d="M4 21h16"/>',
 corazon:'<path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.600A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/>',
 bandera:'<path d="M6 21V4"/><path d="M6 5h12l-2 4 2 4H6"/>',
 flor:'<circle cx="12" cy="6.500" r="2.500"/><circle cx="12" cy="17.500" r="2.500"/><circle cx="6.500" cy="12" r="2.500"/><circle cx="17.500" cy="12" r="2.500"/><circle cx="12" cy="12" r="1.500"/>',
 globo:'<path d="M12 3a6 6 0 0 1 6 6c0 4-3.500 6.500-6 7-2.500-.5-6-3-6-7a6 6 0 0 1 6-6z"/><path d="M12 16l-1.500 2.500h3z"/><path d="M12 18.500c0 1.500 1.500 1.500 1.500 3"/>',
 canon:'<path d="M3 13l14-6 2.500 5-14 6z"/><circle cx="8" cy="18" r="3"/><path d="M20 5l1 2"/>',
 rosa:'<path d="M12 11c-3-1-4-4-2-6 2 0 3 1 2 2 1-1 2-2 4-1 1 2 0 5-4 5z"/><path d="M12 11v10M12 16c-2 0-4-1-4-3M12 18c2 0 4-1 4-3"/>',
 corbata:'<path d="M10 3h4l-1 4 2 11-3 3-3-3 2-11z"/>',
 sol:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
 libro:'<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>',
 campana:'<path d="M6 17h12l-1.500-2V10a4.500 4.500 0 0 0-9 0v5z"/><path d="M10 20a2 2 0 0 0 4 0"/><path d="M12 3v2"/>',
 liston:'<path d="M12 3c3 0 5 2 5 4.500S14 13 12 16c-2-3-5-5-5-8.500S9 3 12 3z"/><path d="M12 16l-4 5M12 16l4 5"/>',
 calabaza:'<path d="M12 7c-5 0-8 3-8 6s3 6 8 6 8-3 8-6-3-6-8-6z"/><path d="M12 7V4M9.500 13l1 1h3l1-1"/>',
 calavera:'<path d="M5 11a7 7 0 0 1 14 0v3l-2 1v3H7v-3l-2-1z"/><circle cx="9.500" cy="11.500" r="1.300"/><circle cx="14.500" cy="11.500" r="1.300"/><path d="M12 14v1.500M10 18v-2M14 18v-2"/>',
 sombrero:'<path d="M2 17c4 1 16 1 20 0-1-1-3-1.500-4-2-.5-3-1.500-8-6-8s-5.500 5-6 8c-1 .5-3 1-4 2z"/><path d="M7 14c3 1 7 1 10 0"/>',
 pino:'<path d="M12 3l-5 7h3l-4 6h4l-3 4h10l-3-4h4l-4-6h3z"/><path d="M12 20v2"/>'};
const SEA_CO={fuegos:["#1f3a6b","#6b3fa0"],corona:["#b88a1e","#7c3f2a"],corazon:["#c2305f","#7a1d3d"],bandera:["#1f7a4a","#b3282d"],flor:["#d2557f","#6f9a35"],globo:["#2a8aa0","#e0912a"],canon:["#1f7a4a","#b3282d"],rosa:["#c2406f","#7a2a4a"],corbata:["#204f5f","#3d3a5c"],sol:["#e89a1c","#d2552a"],libro:["#2a8aa0","#204f5f"],campana:["#1f7a4a","#b3282d"],liston:["#e0679a","#a02a63"],calabaza:["#e9791a","#8a3fb5"],calavera:["#5a2d82","#e9791a"],sombrero:["#b3282d","#1f7a4a"],pino:["#1f7a4a","#a8232a"]};
/* [mes, día inicial, día final, icono, nombre] */
const SEA_T=[[1,1,5,"fuegos","Año Nuevo"],[1,6,31,"corona","Día de Reyes"],[2,1,23,"corazon","Amor y Amistad"],[2,24,29,"bandera","Día de la Bandera"],[3,1,31,"flor","Primavera"],[4,1,30,"globo","Día del Niño"],[5,1,9,"canon","Batalla de Puebla"],[5,10,31,"rosa","Día de las Madres"],[6,1,30,"corbata","Día del Padre"],[7,1,31,"sol","Vacaciones de verano"],[8,1,31,"libro","Regreso a clases"],[9,1,30,"campana","Fiestas Patrias"],[10,1,19,"liston","Octubre Rosa"],[10,20,31,"calabaza","Halloween"],[11,1,3,"calavera","Día de Muertos"],[11,4,30,"sombrero","Revolución Mexicana"],[12,1,11,"pino","Navidad"],[12,12,12,"rosa","Virgen de Guadalupe"],[12,13,28,"pino","Navidad"],[12,29,31,"fuegos","Año Nuevo"]];
function seaFor(d){d=d||new Date();const m=d.getMonth()+1,n=d.getDate();return SEA_T.find(t=>t[0]===m&&n>=t[1]&&n<=t[2])||null;}
function seaChip(){const t=seaFor();if(!t)return"";const nm=typeof _tsea==="function"?_tsea(t[4]):t[4];return '<span class="seachip"><svg viewBox="0 0 24 24">'+SEA_IC[t[3]]+'</svg>'+nm+'</span>';}
/* Efecto ligero de fondo solo dentro de la app: nieve (dic-5 ene) y hojas (sep-oct) */
function seaFxKind(d){d=d||new Date();const m=d.getMonth()+1,n=d.getDate();if(m===12||(m===1&&n<=5))return"snow";if(m===9||m===10)return"leaf";return"";}
(function(){let cv,cx,pts=[],raf=0,kind="",W=0,H=0;
 const ok=()=>{try{if(matchMedia("(prefers-reduced-motion:reduce)").matches)return false;if(navigator.deviceMemory&&navigator.deviceMemory<=2)return false;if(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2)return false;}catch(e){}return true;};
 const dk=()=>{const t=document.documentElement.dataset.theme;return t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches);};
 const LC=["#b5651d","#c98a3d","#a0522d","#8f7a3a"];
 const mk=(init)=>({x:Math.random()*W,y:init?Math.random()*H:-12,s:kind==="snow"?1.5+Math.random()*2.2:5+Math.random()*4,v:(kind==="snow"?.35:.5)+Math.random()*.55,ph:Math.random()*6.28,sw:.3+Math.random()*.7,r:Math.random()*6.28,vr:(Math.random()-.5)*.04,c:LC[Math.floor(Math.random()*LC.length)]});
 function size(){if(!cv)return;const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0);}
 function frame(t){raf=requestAnimationFrame(frame);if(document.hidden||document.body.classList.contains("noauth")){cx.clearRect(0,0,W,H);return;}
  cx.clearRect(0,0,W,H);const d=dk();
  for(const p of pts){p.y+=p.v;p.x+=Math.sin(t/1400+p.ph)*p.sw;p.r+=p.vr;if(p.y>H+14||p.x<-20||p.x>W+20){Object.assign(p,mk(false));}
   if(kind==="snow"){cx.beginPath();cx.arc(p.x,p.y,p.s,0,6.283);cx.fillStyle=d?"rgba(255,255,255,.8)":"rgba(255,255,255,.95)";cx.fill();if(!d){cx.strokeStyle="rgba(107,79,168,.22)";cx.lineWidth=.8;cx.stroke();}}
   else{cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.globalAlpha=.7;cx.fillStyle=p.c;cx.beginPath();cx.moveTo(0,-p.s);cx.quadraticCurveTo(p.s*.8,0,0,p.s);cx.quadraticCurveTo(-p.s*.8,0,0,-p.s);cx.fill();cx.restore();}}}
 function start(){const k=seaFxKind();if(!k||!ok()){stop();return;}
  if(!cv){cv=document.createElement("canvas");cv.id="sfx";cv.setAttribute("aria-hidden","true");document.body.appendChild(cv);cx=cv.getContext("2d");addEventListener("resize",size);}
  kind=k;cv.style.display="";size();pts=[];const n=k==="snow"?26:14;for(let i=0;i<n;i++)pts.push(mk(true));if(!raf)raf=requestAnimationFrame(frame);}
 function stop(){if(raf)cancelAnimationFrame(raf);raf=0;if(cv)cv.style.display="none";}
 window.seaFxStart=start;
 if(document.body)start();else addEventListener("DOMContentLoaded",start);
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")start();});
})();


