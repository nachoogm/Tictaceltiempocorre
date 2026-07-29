/* =====================================================================
   LoL Hub  — lógica de la app (no necesitas tocar esto)
   ===================================================================== */

// Mapa de región -> {profile: código op.gg/porofessor, platform: routing u.gg}
const REGIONS = {
  euw:  { pg:"euw",  uggPlatform:"euw1", ddLoc:"euw" },
  eune: { pg:"eune", uggPlatform:"eun1", ddLoc:"eune" },
  na:   { pg:"na",   uggPlatform:"na1",  ddLoc:"na" },
  kr:   { pg:"kr",   uggPlatform:"kr",   ddLoc:"kr" },
  br:   { pg:"br",   uggPlatform:"br1",  ddLoc:"br" },
  jp:   { pg:"jp",   uggPlatform:"jp1",  ddLoc:"jp" },
  las:  { pg:"las",  uggPlatform:"la2",  ddLoc:"las" },
  lan:  { pg:"lan",  uggPlatform:"la1",  ddLoc:"lan" },
  oce:  { pg:"oce",  uggPlatform:"oc1",  ddLoc:"oce" },
  tr:   { pg:"tr",   uggPlatform:"tr1",  ddLoc:"tr" },
  ru:   { pg:"ru",   uggPlatform:"ru",   ddLoc:"ru" }
};

const region = (CONFIG.region || "euw").toLowerCase();
const R = REGIONS[region] || REGIONS.euw;

// --- helpers para partir "Nombre#TAG"
function parseId(riotId){
  const [name, tag] = riotId.split("#");
  return { name: (name||"").trim(), tag: (tag||"").trim(), full: riotId.trim() };
}
const enc = encodeURIComponent;

// --- URLs de cada tracker por jugador
function urls(p){
  const {name, tag} = p;
  const slug = `${enc(name)}-${enc(tag)}`;
  return {
    opgg:      `https://www.op.gg/summoners/${R.pg}/${slug}`,
    dpm:       `https://dpm.lol/${slug}`,
    ugg:       `https://u.gg/lol/profile/${R.uggPlatform}/${slug}/overview`,
    porofessor:`https://porofessor.gg/live/${R.pg}/${enc(name)}-${enc(tag)}`,
    deeplol:   `https://www.deeplol.gg/summoner/${R.pg}/${enc(name)}-${enc(tag)}`
  };
}

/* ---------- Data Dragon: parche + avatares + campeones ---------- */
let DDRAGON_VER = "16.14.1";     // fallback
let CHAMPIONS = [];

async function loadDDragon(){
  try{
    const vers = await fetch("https://ddragon.leagueoflegends.com/api/versions.json").then(r=>r.json());
    DDRAGON_VER = vers[0];
    document.getElementById("patch").textContent = "Parche " + DDRAGON_VER;
  }catch(e){ document.getElementById("patch").textContent = "Parche " + DDRAGON_VER; }

  try{
    const data = await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/data/es_ES/champion.json`).then(r=>r.json());
    CHAMPIONS = Object.values(data.data).map(c=>({ id:c.id, name:c.name }));
  }catch(e){ CHAMPIONS = []; }
}

function champIcon(champId){
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/champion/${champId}.png`;
}

/* ---------- Render de tarjetas ---------- */
function buildCards(){
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  CONFIG.players.forEach(raw=>{
    const p = parseId(raw.riotId);
    const u = urls(p);
    const iconId = (raw.main || "Poro").replace(/\s|'|\./g,"");
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-top">
        <img class="avatar" src="${champIcon(iconId)}"
             onerror="this.src='https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/profileicon/29.png'">
        <div class="pinfo">
          <div class="pname" title="${p.full}">${p.name}</div>
          <div class="ptag">#${p.tag}</div>
          <div class="pmeta">
            ${raw.rol ? `<span class="chip rol">${raw.rol}</span>`:""}
            ${raw.main ? `<span class="chip">${raw.main}</span>`:""}
          </div>
        </div>
        <span class="live-flag"><span>●</span> EN PARTIDA</span>
      </div>
      <div class="links">
        <a class="lnk" href="${u.opgg}" target="_blank" rel="noopener">OP.GG</a>
        <a class="lnk" href="${u.dpm}" target="_blank" rel="noopener">DPM.LOL</a>
        <a class="lnk" href="${u.ugg}" target="_blank" rel="noopener">U.GG</a>
        <a class="lnk" href="${u.deeplol}" target="_blank" rel="noopener">DeepLoL</a>
        <a class="lnk wide" href="${u.porofessor}" target="_blank" rel="noopener">🔴 Ver partida en directo (Porofessor)</a>
      </div>`;
    grid.appendChild(card);
  });
}

/* ---------- Botones globales ---------- */
// op.gg multi-search: abre los 5-6 perfiles en una sola vista de equipo
function multiSearchUrl(){
  const names = CONFIG.players.map(p=>parseId(p.riotId).full);
  return `https://www.op.gg/multisearch/${R.pg}?summoners=${enc(names.join(","))}`;
}
// porofessor multi (pega la lista en su buscador de sala)
function poroMultiUrl(){
  return `https://porofessor.gg/es/`;
}

function openAllProfiles(){
  CONFIG.players.forEach(p=>{
    window.open(urls(parseId(p.riotId)).opgg, "_blank", "noopener");
  });
}

function copyLobby(){
  const list = CONFIG.players.map(p=>parseId(p.riotId).full).join("\n");
  navigator.clipboard.writeText(list).then(()=>toast("Lista copiada ✔  Pégala en op.gg / Porofessor"));
}

/* ---------- Herramientas extra ---------- */
// 1) Ruleta de campeón aleatorio
function randomChamp(){
  const out = document.getElementById("champ-out");
  if(!CHAMPIONS.length){ out.textContent = "Cargando campeones..."; return; }
  let ticks = 0;
  const spin = setInterval(()=>{
    const c = CHAMPIONS[Math.floor(Math.random()*CHAMPIONS.length)];
    out.innerHTML = `<img src="${champIcon(c.id)}">${c.name}`;
    if(++ticks>14){
      clearInterval(spin);
      out.style.color = "var(--gold)";
      setTimeout(()=>out.style.color="var(--blue)", 900);
    }
  }, 70);
}

// 2) ¿Quién elige/banea primero? (sortea un jugador)
function randomPlayer(){
  const out = document.getElementById("player-out");
  const names = CONFIG.players.map(p=>parseId(p.riotId).name);
  let ticks=0;
  const spin=setInterval(()=>{
    out.textContent = names[Math.floor(Math.random()*names.length)];
    if(++ticks>14){ clearInterval(spin); out.style.color="var(--gold)";
      setTimeout(()=>out.style.color="var(--blue)",900); }
  },70);
}

// 3) Cara o cruz (lado azul / rojo)
function coin(){
  const out = document.getElementById("coin-out");
  let ticks=0;
  const spin=setInterval(()=>{
    const blue = Math.random()>.5;
    out.textContent = blue ? "🔵 Lado AZUL" : "🔴 Lado ROJO";
    if(++ticks>12){ clearInterval(spin); }
  },80);
}

function toast(msg){
  const t=document.getElementById("toast");
  t.textContent=msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2200);
}

/* ---------- Init ---------- */
async function init(){
  document.getElementById("group-name").textContent = CONFIG.groupName || "LoL Hub";
  document.getElementById("region-lbl").textContent = region.toUpperCase();
  await loadDDragon();
  buildCards();
  // enlaces globales
  document.getElementById("btn-multi").href = multiSearchUrl();
  document.getElementById("patch-notes").href =
    "https://www.leagueoflegends.com/es-es/news/tags/patch-notes/";
}
document.addEventListener("DOMContentLoaded", init);
