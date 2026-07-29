/* =====================================================================
   Página de campeones — filtro por posición + builds/tiers reales
   ===================================================================== */
let DDRAGON_VER="16.14.1";
const champIcon = id => `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/champion/${id}.png`;

/* Mapa de posiciones (lanes donde se juega cada campeón).
   Si un campeón no aparece, se deduce por sus 'tags' de Data Dragon. */
const LANES = {
  Aatrox:["TOP"],Ahri:["MID"],Akali:["MID","TOP"],Akshan:["MID","TOP"],Alistar:["SUPPORT"],
  Ambessa:["TOP","MID"],Amumu:["JUNGLE","SUPPORT"],Anivia:["MID"],Annie:["MID","SUPPORT"],Aphelios:["ADC"],
  Ashe:["ADC","SUPPORT"],AurelionSol:["MID"],Aurora:["MID","TOP"],Azir:["MID"],Bard:["SUPPORT"],
  Belveth:["JUNGLE"],Blitzcrank:["SUPPORT"],Brand:["SUPPORT","MID"],Braum:["SUPPORT"],Briar:["JUNGLE"],
  Caitlyn:["ADC"],Camille:["TOP"],Cassiopeia:["MID"],Chogath:["TOP","MID"],Corki:["MID","ADC"],
  Darius:["TOP"],Diana:["JUNGLE","MID"],DrMundo:["TOP"],Draven:["ADC"],Ekko:["JUNGLE","MID"],
  Elise:["JUNGLE"],Evelynn:["JUNGLE"],Ezreal:["ADC"],Fiddlesticks:["JUNGLE"],Fiora:["TOP"],
  Fizz:["MID"],Galio:["MID","SUPPORT"],Gangplank:["TOP"],Garen:["TOP"],Gnar:["TOP"],Gragas:["JUNGLE","TOP"],
  Graves:["JUNGLE"],Gwen:["TOP","JUNGLE"],Hecarim:["JUNGLE"],Heimerdinger:["MID","SUPPORT"],Hwei:["MID","SUPPORT"],
  Illaoi:["TOP"],Irelia:["TOP","MID"],Ivern:["JUNGLE"],Janna:["SUPPORT"],JarvanIV:["JUNGLE"],
  Jax:["TOP","JUNGLE"],Jayce:["TOP","MID"],Jhin:["ADC"],Jinx:["ADC"],Ksante:["TOP"],
  Kaisa:["ADC"],Kalista:["ADC"],Karma:["SUPPORT","MID"],Karthus:["JUNGLE"],Kassadin:["MID"],
  Katarina:["MID"],Kayle:["TOP"],Kayn:["JUNGLE"],Kennen:["TOP"],Khazix:["JUNGLE"],Kindred:["JUNGLE"],
  Kled:["TOP"],KogMaw:["ADC"],Leblanc:["MID"],LeeSin:["JUNGLE"],Leona:["SUPPORT"],Lillia:["JUNGLE"],
  Lissandra:["MID"],Lucian:["ADC","MID"],Lulu:["SUPPORT"],Lux:["SUPPORT","MID"],Malphite:["TOP","SUPPORT"],
  Malzahar:["MID"],Maokai:["SUPPORT","TOP","JUNGLE"],MasterYi:["JUNGLE"],Mel:["MID"],Milio:["SUPPORT"],
  MissFortune:["ADC","SUPPORT"],MonkeyKing:["TOP","JUNGLE"],Mordekaiser:["TOP"],Morgana:["SUPPORT","MID"],
  Naafiri:["MID","JUNGLE"],Nami:["SUPPORT"],Nasus:["TOP"],Nautilus:["SUPPORT"],Neeko:["MID","SUPPORT"],
  Nidalee:["JUNGLE"],Nilah:["ADC"],Nocturne:["JUNGLE"],Nunu:["JUNGLE"],Olaf:["JUNGLE","TOP"],
  Orianna:["MID"],Ornn:["TOP"],Pantheon:["SUPPORT","TOP","MID"],Poppy:["TOP","JUNGLE","SUPPORT"],Pyke:["SUPPORT"],
  Qiyana:["MID"],Quinn:["TOP"],Rakan:["SUPPORT"],Rammus:["JUNGLE"],RekSai:["JUNGLE"],Rell:["SUPPORT"],
  Renata:["SUPPORT"],Renekton:["TOP"],Rengar:["JUNGLE","TOP"],Riven:["TOP"],Rumble:["TOP","MID"],
  Ryze:["MID","TOP"],Samira:["ADC"],Sejuani:["JUNGLE"],Senna:["SUPPORT","ADC"],Seraphine:["SUPPORT","MID","ADC"],
  Sett:["TOP","SUPPORT"],Shaco:["JUNGLE","SUPPORT"],Shen:["TOP","SUPPORT"],Shyvana:["JUNGLE"],Singed:["TOP"],
  Sion:["TOP"],Sivir:["ADC"],Skarner:["JUNGLE"],Smolder:["ADC"],Sona:["SUPPORT"],Soraka:["SUPPORT"],
  Swain:["MID","SUPPORT","ADC"],Sylas:["MID"],Syndra:["MID"],TahmKench:["SUPPORT","TOP"],Taliyah:["JUNGLE","MID"],
  Talon:["MID","JUNGLE"],Taric:["SUPPORT"],Teemo:["TOP"],Thresh:["SUPPORT"],Tristana:["ADC","MID"],
  Trundle:["JUNGLE","TOP"],Tryndamere:["TOP"],TwistedFate:["MID"],Twitch:["ADC"],Udyr:["JUNGLE"],
  Urgot:["TOP"],Varus:["ADC"],Vayne:["ADC","TOP"],Veigar:["MID","SUPPORT"],Velkoz:["SUPPORT","MID"],
  Vex:["MID"],Vi:["JUNGLE"],Viego:["JUNGLE"],Viktor:["MID"],Vladimir:["MID","TOP"],Volibear:["JUNGLE","TOP"],
  Warwick:["JUNGLE","TOP"],Xayah:["ADC"],Xerath:["MID","SUPPORT"],XinZhao:["JUNGLE"],Yasuo:["MID","TOP"],
  Yone:["MID","TOP"],Yorick:["TOP"],Yunara:["ADC"],Yuumi:["SUPPORT"],Zaahen:["MID"],Zac:["JUNGLE"],
  Zed:["MID","JUNGLE"],Zeri:["ADC"],Ziggs:["MID","ADC"],Zilean:["SUPPORT","MID"],Zoe:["MID"],Zyra:["SUPPORT"]
};
// deducción por tags cuando no está en el mapa
function lanesByTags(tags){
  if(tags.includes("Marksman")) return ["ADC"];
  if(tags.includes("Support")) return ["SUPPORT"];
  if(tags.includes("Assassin")||tags.includes("Mage")) return ["MID"];
  if(tags.includes("Tank")) return ["TOP","SUPPORT"];
  if(tags.includes("Fighter")) return ["TOP","JUNGLE"];
  return ["MID"];
}
// slug de U.GG por posición
const UGG_ROLE={TOP:"top",JUNGLE:"jungle",MID:"middle",ADC:"adc",SUPPORT:"support"};

let ALL=[], curPos="ALL", curSearch="";

async function loadDDragon(){
  try{ const v=await fetch("https://ddragon.leagueoflegends.com/api/versions.json").then(r=>r.json()); DDRAGON_VER=v[0]; }catch(e){}
  document.getElementById("patch2").textContent=DDRAGON_VER;
  const d=await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/data/es_ES/champion.json`).then(r=>r.json());
  ALL=Object.values(d.data).map(c=>({
    id:c.id, name:c.name, tags:c.tags||[],
    lanes: LANES[c.id] || lanesByTags(c.tags||[])
  })).sort((a,b)=>a.name.localeCompare(b.name));
  render();
}

function render(){
  const grid=document.getElementById("champ-grid");
  let list=ALL.filter(c=>{
    const okPos = curPos==="ALL" || c.lanes.includes(curPos);
    const okSearch = !curSearch || c.name.toLowerCase().includes(curSearch);
    return okPos && okSearch;
  });
  document.getElementById("champ-count").textContent=`${list.length} campeones${curPos!=="ALL"?` · ${posLabel(curPos)}`:""}`;
  if(!list.length){ grid.innerHTML=`<div class="mh-empty">Sin resultados</div>`; return; }
  grid.innerHTML=list.map(c=>`
    <div class="champ-card" onclick="openChamp('${c.id}')" role="button" tabindex="0" onkeypress="if(event.key==='Enter')openChamp('${c.id}')">
      <img class="champ-img" src="${champIcon(c.id)}" loading="lazy" alt="${c.name}">
      <div class="champ-name">${c.name}</div>
      <div class="champ-lanes">${c.lanes.map(l=>`<span>${posEmoji(l)}</span>`).join("")}</div>
    </div>`).join("");
}
function posLabel(p){ return {TOP:"Top",JUNGLE:"Jungla",MID:"Mid",ADC:"ADC",SUPPORT:"Support"}[p]||p; }
function posEmoji(p){ return {TOP:"⚔️",JUNGLE:"🌳",MID:"✨",ADC:"🏹",SUPPORT:"🛡️"}[p]||""; }

/* Modal build del campeón */
function openChamp(id){
  const c=ALL.find(x=>x.id===id); if(!c) return;
  const ov=document.getElementById("champ-modal"); const box=document.getElementById("champ-modal-content");
  ov.classList.add("show"); document.body.style.overflow="hidden";
  const nameSlug=c.id.toLowerCase();
  const buildRows=c.lanes.map(l=>`
    <div class="cb-role">
      <span class="cb-role-name">${posEmoji(l)} ${posLabel(l)}</span>
      <div class="cb-links">
        <a class="btn" href="https://u.gg/lol/champions/${nameSlug}/build/${UGG_ROLE[l]}" target="_blank" rel="noopener">Build U.GG</a>
        <a class="btn" href="https://www.op.gg/lol/champions/${nameSlug}/build/${UGG_ROLE[l]}" target="_blank" rel="noopener">Build OP.GG</a>
      </div>
    </div>`).join("");
  box.innerHTML=`
    <div class="cb-head">
      <img src="${champIcon(c.id)}" class="cb-img" alt="${c.name}">
      <div><div class="cb-name">${c.name}</div><div class="cb-tags">${c.tags.join(" · ")}</div></div>
    </div>
    <div class="cb-section">📊 Builds &amp; runas por rol <small>(datos en vivo del parche)</small></div>
    ${buildRows}
    <div class="cb-section">🔎 Más</div>
    <div class="cb-links">
      <a class="btn" href="https://u.gg/lol/champions/${nameSlug}/counters" target="_blank" rel="noopener">Counters</a>
      <a class="btn" href="https://www.op.gg/lol/champions/${nameSlug}/probuilds" target="_blank" rel="noopener">Pro builds</a>
      <a class="btn" href="https://leagueoflegends.fandom.com/wiki/${encodeURIComponent(c.name)}" target="_blank" rel="noopener">Wiki / lore</a>
    </div>`;
}
function closeChamp(){ document.getElementById("champ-modal").classList.remove("show"); document.body.style.overflow=""; }
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeChamp(); });
document.addEventListener("click",e=>{ if(e.target.id==="champ-modal") closeChamp(); });

/* Partículas */
function initFX(){ const c=document.getElementById("fx"); if(!c) return; const ctx=c.getContext("2d"); let w,h,parts;
  function resize(){ w=c.width=c.offsetWidth;h=c.height=c.offsetHeight;
    parts=Array.from({length:Math.min(50,Math.floor(w/22))},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.6+.4,vy:-(Math.random()*.35+.1),a:Math.random()*.5+.2,col:Math.random()>.5?"200,170,110":"10,200,185"})); }
  resize(); window.addEventListener("resize",resize);
  (function loop(){ ctx.clearRect(0,0,w,h); parts.forEach(p=>{p.y+=p.vy;if(p.y<-5){p.y=h+5;p.x=Math.random()*w;}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fillStyle=`rgba(${p.col},${p.a})`;ctx.shadowBlur=6;ctx.shadowColor=`rgba(${p.col},${p.a})`;ctx.fill();}); requestAnimationFrame(loop); })();
}

/* Init */
document.addEventListener("DOMContentLoaded",()=>{
  initFX(); loadDDragon();
  document.getElementById("search").addEventListener("input",e=>{ curSearch=e.target.value.trim().toLowerCase(); render(); });
  document.querySelectorAll(".pos-btn").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll(".pos-btn").forEach(x=>x.classList.remove("active"));
    b.classList.add("active"); curPos=b.dataset.pos; render();
  }));
});
