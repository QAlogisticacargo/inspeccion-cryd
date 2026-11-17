/* ===== Idiomas (v3.11): español, inglés, alemán, portugués y francés =====
   _t(id,"español")  -> texto en el idioma activo (si falta, usa el español)
   _ts("español")    -> traduce un valor guardado en español (motivos, criterios, etc.)
   Cambiar de idioma guarda la elección en el dispositivo y recarga la app. */
var LX={};
const LANGS=[["es","Español","ES"],["en","English","EN"],["de","Deutsch","DE"],["pt","Português","PT"],["fr","Français","FR"]];
let LANG="es";
try{const s=localStorage.getItem("cryd:lang");if(s&&LANGS.some(l=>l[0]===s))LANG=s;}catch(e){}
document.documentElement.lang=LANG;
if(LANG!=="es")document.write('<script src="lang-'+LANG+'.js"><\/script>');
const _t=(id,es)=>{if(LANG==="es")return es;const v=LX[id];return v===undefined?es:v;};
const TS_IDS={"Rechazado": 967, "Liberado": 968, "Producto limpio, sin derrame": 969, "Empaque de producto dañado": 970, "Código físico corresponde con IPS": 971, "Lote corresponde con IPS": 972, "Fecha de expiración vigente": 973, "Producto en corrugado completo": 974, "Producto en caja corresponde con código y lote": 975, "Información de producto legible": 976, "Corrugado sin daño": 977, "Caja correctamente cerrada": 978, "Tarima libre de fauna, limpia y sin daño": 979, "Cumple estiba y emplayado de tarima": 980, "Crítico": 981, "Mayor": 982, "Menor": 983, "Código": 59, "Lote": 99, "Cantidad": 66, "Unidad de medida (CS/IT)": 984, "Producto dañado u otro": 985, "manual": 486, "validado": 986, "estimado": 987, "archivo": 988, "descripción": 989, "falta": 349, "Sin motivo": 439};
const _ts=s=>{if(LANG==="es"||typeof s!=="string")return s;const i=TS_IDS[s];return i===undefined?s:_t(i,s);};
const _pl=(n,de)=>n===1?"":(LANG==="de"?de:"s");
const LT={
 es:["Idioma","Elige el idioma de la aplicación. Se guarda en este dispositivo.","Cancelar"],
 en:["Language","Choose the app language. It is saved on this device.","Cancel"],
 de:["Sprache","Wähle die Sprache der App. Sie wird auf diesem Gerät gespeichert.","Abbrechen"],
 pt:["Idioma","Escolha o idioma do app. Fica salvo neste dispositivo.","Cancelar"],
 fr:["Langue","Choisissez la langue de l'application. Elle est enregistrée sur cet appareil.","Annuler"]};
function setLang(c){try{localStorage.setItem("cryd:lang",c);}catch(e){}location.reload();}
function langName(){const l=LANGS.find(x=>x[0]===LANG);return l?l[1]:"Español";}
function langCard(){return '<div class="card"><h2 class="sh">'+LT[LANG][0]+'</h2><button type="button" class="btn" style="width:100%" data-lang="1">🌐 '+langName()+'</button></div>';}
function langDlg(){
 const t=LT[LANG];
 dlg({title:"🌐 "+t[0],body:t[1],buttons:LANGS.map(l=>({t:(l[0]===LANG?"✓ ":"")+l[1],cls:l[0]===LANG?"pri":"",fn:l[0]===LANG?null:()=>setLang(l[0])})).concat([{t:t[2],cls:"txt"}])});
}
(function(){
 const b=document.getElementById("lang");
 if(b){b.textContent="🌐 "+LANGS.find(l=>l[0]===LANG)[2];b.setAttribute("aria-label",LT[LANG][0]);b.title=LT[LANG][0];}
 document.addEventListener("click",function(e){const t=e.target&&e.target.closest?e.target.closest("[data-lang],#lang"):null;if(t){e.preventDefault();langDlg();}});
})();

/* ---- textos fijos del index.html y nombres de temporada ---- */
const ST={
 es:null,
 en:{t:"Control Logístico | Site SMO CRyD",who:"Profile",cvm:"The built-in camera is not available in this view.",cam:"Open the phone camera",cvx:"Close",shut:"Capture",pvno:"Cancel",pvg:"Choose another",pvc:"Retake",pvuse:"Use photo"},
 de:{t:"Control Logístico | Site SMO CRyD",who:"Profil",cvm:"Die integrierte Kamera ist in dieser Ansicht nicht verfügbar.",cam:"Smartphone-Kamera öffnen",cvx:"Schließen",shut:"Aufnehmen",pvno:"Abbrechen",pvg:"Anderes wählen",pvc:"Wiederholen",pvuse:"Foto verwenden"},
 pt:{t:"Control Logístico | Site SMO CRyD",who:"Perfil",cvm:"A câmera integrada não está disponível nesta visualização.",cam:"Abrir a câmera do celular",cvx:"Fechar",shut:"Capturar",pvno:"Cancelar",pvg:"Escolher outra",pvc:"Repetir",pvuse:"Usar foto"},
 fr:{t:"Control Logístico | Site SMO CRyD",who:"Profil",cvm:"L'appareil photo intégré n'est pas disponible dans cette vue.",cam:"Ouvrir l'appareil photo du téléphone",cvx:"Fermer",shut:"Capturer",pvno:"Annuler",pvg:"Choisir une autre",pvc:"Reprendre",pvuse:"Utiliser la photo"}};
const SEAN={
 en:{"Año Nuevo":"New Year","Día de Reyes":"Three Kings Day","Amor y Amistad":"Love and Friendship","Día de la Bandera":"Flag Day","Primavera":"Spring","Día del Niño":"Children's Day","Batalla de Puebla":"Battle of Puebla","Día de las Madres":"Mother's Day","Día del Padre":"Father's Day","Vacaciones de verano":"Summer holidays","Regreso a clases":"Back to school","Fiestas Patrias":"Independence Day","Octubre Rosa":"Pink October","Halloween":"Halloween","Día de Muertos":"Day of the Dead","Revolución Mexicana":"Mexican Revolution","Navidad":"Christmas","Virgen de Guadalupe":"Virgin of Guadalupe"},
 de:{"Año Nuevo":"Neujahr","Día de Reyes":"Dreikönigstag","Amor y Amistad":"Liebe und Freundschaft","Día de la Bandera":"Tag der Flagge","Primavera":"Frühling","Día del Niño":"Kindertag","Batalla de Puebla":"Schlacht von Puebla","Día de las Madres":"Muttertag","Día del Padre":"Vatertag","Vacaciones de verano":"Sommerferien","Regreso a clases":"Schulbeginn","Fiestas Patrias":"Unabhängigkeitstag","Octubre Rosa":"Rosa Oktober","Halloween":"Halloween","Día de Muertos":"Día de Muertos","Revolución Mexicana":"Mexikanische Revolution","Navidad":"Weihnachten","Virgen de Guadalupe":"Jungfrau von Guadalupe"},
 pt:{"Año Nuevo":"Ano Novo","Día de Reyes":"Dia de Reis","Amor y Amistad":"Amor e Amizade","Día de la Bandera":"Dia da Bandeira","Primavera":"Primavera","Día del Niño":"Dia da Criança","Batalla de Puebla":"Batalha de Puebla","Día de las Madres":"Dia das Mães","Día del Padre":"Dia dos Pais","Vacaciones de verano":"Férias de verão","Regreso a clases":"Volta às aulas","Fiestas Patrias":"Festas Pátrias","Octubre Rosa":"Outubro Rosa","Halloween":"Halloween","Día de Muertos":"Dia de Finados","Revolución Mexicana":"Revolução Mexicana","Navidad":"Natal","Virgen de Guadalupe":"Virgem de Guadalupe"},
 fr:{"Año Nuevo":"Nouvel An","Día de Reyes":"Fête des Rois","Amor y Amistad":"Amour et Amitié","Día de la Bandera":"Jour du Drapeau","Primavera":"Printemps","Día del Niño":"Fête des enfants","Batalla de Puebla":"Bataille de Puebla","Día de las Madres":"Fête des Mères","Día del Padre":"Fête des Pères","Vacaciones de verano":"Vacances d'été","Regreso a clases":"Rentrée scolaire","Fiestas Patrias":"Fête de l'Indépendance","Octubre Rosa":"Octobre rose","Halloween":"Halloween","Día de Muertos":"Día de Muertos","Revolución Mexicana":"Révolution mexicaine","Navidad":"Noël","Virgen de Guadalupe":"Vierge de Guadalupe"}};
const _tsea=n=>(SEAN[LANG]&&SEAN[LANG][n])||n;
(function(){
 const c=ST[LANG];if(!c)return;const q=s=>document.querySelector(s);
 const w=q("#who");if(w)w.setAttribute("aria-label",c.who);
 const m=q("#cvm p");if(m)m.textContent=c.cvm;const cl=q("#cvm label");if(cl)cl.textContent=c.cam;
 [["#cvx","cvx"],["#pvno","pvno"],["#pvg","pvg"],["#pvc","pvc"],["#pvuse","pvuse"]].forEach(a=>{const e=q(a[0]);if(e)e.textContent=c[a[1]];});
 const sh=q("#shut");if(sh)sh.setAttribute("aria-label",c.shut);
})();
