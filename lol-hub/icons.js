/* =====================================================================
   icons.js — Iconos SVG estilo League of Legends
   ---------------------------------------------------------------------
   Sustituye automáticamente los emojis de roles, clases, navegación y
   modos por iconos vectoriales. No hace falta tocar el resto de páginas:
   basta con cargar este archivo DESPUÉS de common.js.
   Los SVG usan currentColor → heredan el color del tema (dorado/cian).
   ===================================================================== */
(function(){

/* ---------------- Sprites ---------------- */
const S=(p,vb)=>`<svg class="ico" viewBox="${vb||"0 0 24 24"}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${p}</svg>`;

const ICONS={
  /* ROLES (estilo posiciones de LoL) */
  top:      S(`<path d="M4 20V4h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 4H20v10.5L9.5 4Z" fill="currentColor" opacity=".9"/><path d="M4 20l6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`),
  jungle:   S(`<path d="M12 21c0-5 2-8 6-10-1 5-2.5 7.5-6 10Z" fill="currentColor" opacity=".9"/><path d="M12 21C12 15 9.5 11 5 9c1.5 5.5 3.5 9 7 12Z" fill="currentColor" opacity=".55"/><path d="M12 21v-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 8c1.7-1.6 2-3.6 1-6-2 1.4-2.6 3.4-1 6Z" fill="currentColor" opacity=".8"/>`),
  mid:      S(`<path d="M20 4 4 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 4h-7l7 7V4Z" fill="currentColor" opacity=".9"/><path d="M4 20h7l-7-7v7Z" fill="currentColor" opacity=".55"/>`),
  adc:      S(`<path d="M20 4 9 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 4h6v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 20l5-5-2-2-3 3v4Z" fill="currentColor" opacity=".85"/><circle cx="6.5" cy="17.5" r="1.4" fill="currentColor"/>`),
  support:  S(`<path d="M12 3 4 6v6c0 4.4 3.3 8.3 8 9 4.7-.7 8-4.6 8-9V6l-8-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 8.5v6M9 11.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`),
  all:      S(`<circle cx="12" cy="12" r="3.2" fill="currentColor"/><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6" opacity=".6"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`),

  /* CLASES de campeón */
  fighter:  S(`<path d="m14 4 6 6-8 8-6-6 8-8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m4 20 3-3M17 3l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`),
  tank:     S(`<path d="M12 3 4 6v6c0 4.4 3.3 8.3 8 9 4.7-.7 8-4.6 8-9V6l-8-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 6.5 7.5 8v4c0 2.9 2 5.5 4.5 6.2V6.5Z" fill="currentColor" opacity=".75"/>`),
  mage:     S(`<path d="M5 19 17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="18.5" cy="5.5" r="2.6" fill="currentColor"/><path d="M8 4.5 8.8 6.7 11 7.5 8.8 8.3 8 10.5 7.2 8.3 5 7.5l2.2-.8L8 4.5Z" fill="currentColor" opacity=".85"/>`),
  assassin: S(`<path d="M6 4h4l8 12-4 4L6 12V4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 4l6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="15.5" cy="17.5" r="1.6" fill="currentColor"/>`),
  marksman: S(`<path d="M7 3a11 11 0 0 1 0 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M7 3v18" stroke="currentColor" stroke-width="1.4" opacity=".7"/><path d="M4 12h15M15 8l4 4-4 4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`),
  suppclass:S(`<path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`),

  /* NAVEGACIÓN */
  home:     S(`<path d="M3 11 12 3l9 8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9.5V20h13V9.5" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M10 20v-5h4v5" stroke="currentColor" stroke-width="1.7"/>`),
  trophy:   S(`<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" stroke="currentColor" stroke-width="1.7"/><path d="M12 14v3M9 20h6M10 17h4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>`),
  chart:    S(`<path d="M4 19h16" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="m5 15 4-5 3.5 3L19 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 6h-3.5M19 6v3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`),
  live:     S(`<circle cx="12" cy="12" r="3.4" fill="currentColor"/><path d="M6.8 7.8a7 7 0 0 0 0 8.4M17.2 7.8a7 7 0 0 1 0 8.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 5.2a11 11 0 0 0 0 13.6M20 5.2a11 11 0 0 1 0 13.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>`),
  champs:   S(`<path d="M12 3 4 6.5v6C4 17.5 7.5 20.6 12 21.5c4.5-.9 8-4 8-9v-6L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m12 8 1.4 3.1 3.1.4-2.3 2.2.6 3.1-2.8-1.6-2.8 1.6.6-3.1L7.5 11.5l3.1-.4L12 8Z" fill="currentColor" opacity=".9"/>`),
  target:   S(`<circle cx="12" cy="12" r="8.2" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.4" stroke="currentColor" stroke-width="1.6" opacity=".75"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/>`),
  gamepad:  S(`<path d="M7.5 8h9a4.5 4.5 0 0 1 4.4 5.4l-.7 3.2A2.6 2.6 0 0 1 15.8 17l-1-1.2h-5.6L8.2 17a2.6 2.6 0 0 1-4.4-.4l-.7-3.2A4.5 4.5 0 0 1 7.5 8Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M7.6 11v2.4M6.4 12.2h2.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="15.6" cy="11.6" r="1" fill="currentColor"/><circle cx="17.4" cy="13.2" r="1" fill="currentColor"/>`),
  music:    S(`<path d="M9 18V6l11-2v12" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.6" fill="currentColor"/><circle cx="17.5" cy="16" r="2.6" fill="currentColor"/>`),
  sword:    S(`<path d="m14 4 6 6-8 8-6-6 8-8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`),
  fire:     S(`<path d="M12 21c3.9 0 6.5-2.6 6.5-6 0-4.3-4-6.3-4.5-11-2 1.5-3 3.4-3 5.6 0 1.4-.8 2.2-1.7 2.2-1 0-1.6-.8-1.6-2C5.9 11.5 5.5 13 5.5 15c0 3.4 2.6 6 6.5 6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>`),
  dice:     S(`<rect x="4" y="4" width="16" height="16" rx="3.4" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="9" r="1.4" fill="currentColor"/><circle cx="15" cy="15" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>`),
  clock:    S(`<circle cx="12" cy="12" r="8.4" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.2V12l3.2 2" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`)
};

/* ---------------- Mapeos por data-attribute ---------------- */
const NAV={ "index.html":["home","Inicio"], "ranking.html":["trophy","Ranking"], "lp.html":["chart","Evolución"],
  "live.html":["live","En vivo"], "champions.html":["champs","Campeones"], "loldle.html":["target","LoLdle"],
  "arena.html":["gamepad","Entreno"], "playlist.html":["music","Playlist"], "tools.html":["sword","Tools"] };
const ROLE={ TOP:"top", JUNGLE:"jungle", MID:"mid", ADC:"adc", SUPPORT:"support", ALL:"all" };
const POS ={ Top:"top", Jungla:"jungle", Mid:"mid", ADC:"adc", Support:"support", ALL:"all" };
const CLS ={ Fighter:"fighter", Tank:"tank", Mage:"mage", Assassin:"assassin", Marksman:"marksman", Support:"suppclass", ALL:"all" };
const ARENA={ aim:"target", dodge:"live", dodgeshoot:"marksman", reaction:"clock" };
const LDLE={ classic:"champs", ability:"mage", quote:"chart", emoji:"target", splash:"champs" };

/* quita el emoji inicial del texto (deja el resto) */
const EMO=/^[\p{Extended_Pictographic}\u2000-\u3300\uFE0F\u200D]+\s*/u;
function swap(el,key,keepText){
  const svg=ICONS[key]; if(!svg||el.dataset.iconized)return;
  const txt=(el.textContent||"").replace(EMO,"").trim();
  el.innerHTML=svg+(keepText&&txt?`<span class="ico-t">${txt}</span>`:"");
  el.dataset.iconized="1";
  el.classList.add("has-ico");
}

function iconify(){
  /* navbar */
  document.querySelectorAll(".nav-links a[href]").forEach(a=>{
    const m=NAV[(a.getAttribute("href")||"").split("/").pop()]; if(m)swap(a,m[0],true);
  });
  /* pestañas de rol (Campeones) */
  document.querySelectorAll(".role-tab[data-pos]").forEach(b=>{const k=ROLE[b.dataset.pos];if(k)swap(b,k,true);});
  /* filtros de posición (Inicio) — solo icono */
  document.querySelectorAll(".fb-pos[data-pos]").forEach(b=>{const k=POS[b.dataset.pos];if(k)swap(b,k,b.dataset.pos==="ALL");});
  /* filtros de clase (Campeones) — solo icono */
  document.querySelectorAll(".cls-btn[data-cls]").forEach(b=>{const k=CLS[b.dataset.cls];if(k)swap(b,k,false);});
  /* columna ROL de la tabla de campeones */
  document.querySelectorAll(".c-role").forEach(td=>{
    if(td.dataset.iconized||!td.textContent.trim())return;
    const found=[];
    if(/⚔️/.test(td.textContent))found.push("top");
    if(/🌳/.test(td.textContent))found.push("jungle");
    if(/✨/.test(td.textContent))found.push("mid");
    if(/🏹/.test(td.textContent))found.push("adc");
    if(/🛡️/.test(td.textContent))found.push("support");
    if(found.length){td.innerHTML=found.map(k=>ICONS[k]).join("");td.dataset.iconized="1";td.classList.add("has-ico");}
  });
  /* modos del Entreno y del LoLdle */
  document.querySelectorAll(".ar-modes .rk-tab[data-mode]").forEach(b=>{const k=ARENA[b.dataset.mode];if(k)swap(b,k,true);});
  document.querySelectorAll(".ld-modes .rk-tab[data-mode]").forEach(b=>{const k=LDLE[b.dataset.mode];if(k)swap(b,k,true);});
  document.querySelectorAll(".ar-rank-tabs .fb-btn[data-rk]").forEach(b=>{const k=ARENA[b.dataset.rk];if(k)swap(b,k,true);});
}

/* CSS de los iconos */
const css=document.createElement("style");
css.textContent=`
.ico{width:1.05em;height:1.05em;display:inline-block;vertical-align:-.18em;flex-shrink:0}
.has-ico{display:inline-flex;align-items:center;gap:7px}
.nav-links a.has-ico .ico{width:16px;height:16px}
.role-tab.has-ico{justify-content:center}
.role-tab .ico,.ar-modes .rk-tab .ico,.ld-modes .rk-tab .ico{width:17px;height:17px}
.fb-pos.has-ico,.cls-btn.has-ico{justify-content:center}
.fb-pos .ico,.cls-btn .ico{width:19px;height:19px}
.c-role.has-ico{gap:5px}
.c-role .ico{width:17px;height:17px;opacity:.85}
.ico-t{white-space:nowrap}
/* color por estado */
.nav-links a .ico{color:currentColor;opacity:.85}
.nav-links a.active .ico,.role-tab.active .ico,.fb-pos.active .ico,.cls-btn.active .ico,.rk-tab.active .ico{opacity:1;filter:drop-shadow(0 0 6px currentColor)}
.fb-pos .ico,.cls-btn .ico{color:var(--gold)}
.fb-pos.active .ico,.cls-btn.active .ico{color:var(--cyan)}
.c-role .ico{color:var(--gold)}`;
document.head.appendChild(css);

/* ejecutar al cargar y cuando el JS pinte tablas dinámicas */
function run(){try{iconify();}catch(e){}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(run,60));
else setTimeout(run,60);
new MutationObserver(()=>{clearTimeout(window._icoT);window._icoT=setTimeout(run,120);})
  .observe(document.documentElement,{childList:true,subtree:true});

window.LOLICONS=ICONS;   // por si quieres usarlos a mano: LOLICONS.top
})();
