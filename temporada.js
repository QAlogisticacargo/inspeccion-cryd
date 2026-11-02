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
function seaApply(d){const t=seaFor(d),bi=document.querySelector(".bi");if(!t||!bi)return;const c=SEA_CO[t[3]];
 bi.innerHTML='<svg viewBox="0 0 24 24">'+SEA_IC[t[3]]+'</svg>';bi.style.background="linear-gradient(145deg,"+c[0]+" 0%,"+c[1]+" 100%)";bi.title=t[4];bi.setAttribute("aria-label",t[4]);
 try{const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+c[0]+'"/><stop offset="1" stop-color="'+c[1]+'"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#g)"/><g transform="translate(4 4)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+SEA_IC[t[3]]+'</g></svg>';
  let l=document.querySelector('link[rel="icon"]');if(l)l.setAttribute("href","data:image/svg+xml,"+encodeURIComponent(svg));}catch(e){}}
seaApply();
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")seaApply();});
