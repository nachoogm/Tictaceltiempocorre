/* =====================================================================
   LoL Hub — lógica (no necesitas tocar esto)
   ===================================================================== */
const REGIONS = {
  euw:{pg:"euw",uggPlatform:"euw1"}, eune:{pg:"eune",uggPlatform:"eun1"},
  na:{pg:"na",uggPlatform:"na1"}, kr:{pg:"kr",uggPlatform:"kr"},
  br:{pg:"br",uggPlatform:"br1"}, jp:{pg:"jp",uggPlatform:"jp1"},
  las:{pg:"las",uggPlatform:"la2"}, lan:{pg:"lan",uggPlatform:"la1"},
  oce:{pg:"oce",uggPlatform:"oc1"}, tr:{pg:"tr",uggPlatform:"tr1"}, ru:{pg:"ru",uggPlatform:"ru"}
};
const region = (CONFIG.region || "euw").toLowerCase();
const R = REGIONS[region] || REGIONS.euw;
const enc = encodeURIComponent;

function parseId(riotId){
  const [name, tag] = riotId.split("#");
  return { name:(name||"").trim(), tag:(tag||"").trim(), full:riotId.trim() };
}
function urls(p){
  const slug = `${enc(p.name)}-${enc(p.tag)}`;
  return {
    opgg:`https://www.op.gg/summoners/${R.pg}/${slug}`,
    dpm:`https://dpm.lol/${slug}`,
    ugg:`https://u.gg/lol/profile/${R.uggPlatform}/${slug}/overview`,
    porofessor:`https://porofessor.gg/live/${R.pg}/${enc(p.name)}-${enc(p.tag)}`,
    deeplol:`https://www.deeplol.gg/summoner/${R.pg}/${enc(p.name)}-${enc(p.tag)}`
  };
}

/* ---------- Data Dragon ---------- */
let DDRAGON_VER = "16.14.1";
let CHAMPIONS = [];
let CHAMP_BY_ID = {};   // numeric id -> {id, name}
async function loadDDragon(){
  try{
    const vers = await fetch("https://ddragon.leagueoflegends.com/api/versions.json").then(r=>r.json());
    DDRAGON_VER = vers[0];
  }catch(e){}
  document.getElementById("patch").textContent = "Parche " + DDRAGON_VER;
  try{
    const data = await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/data/es_ES/champion.json`).then(r=>r.json());
    CHAMPIONS = Object.values(data.data).map(c=>({id:c.id,name:c.name,key:c.key}));
    CHAMPIONS.forEach(c=> CHAMP_BY_ID[c.key] = c);
  }catch(e){}
}
const champIcon = id => `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/champion/${id}.png`;

/* ---------- Rango / tiers ---------- */
const TIER_COLORS = {IRON:"#7d7d7d",BRONZE:"#a5713d",SILVER:"#9aa8b3",GOLD:"#e6b84f",
  PLATINUM:"#4fd1c5",EMERALD:"#2ecc71",DIAMOND:"#5b8bf0",MASTER:"#b45cf0",
  GRANDMASTER:"#e0555b",CHALLENGER:"#f0d060"};
const TIER_ES = {IRON:"Hierro",BRONZE:"Bronce",SILVER:"Plata",GOLD:"Oro",PLATINUM:"Platino",
  EMERALD:"Esmeralda",DIAMOND:"Diamante",MASTER:"Maestro",GRANDMASTER:"Gran Maestro",CHALLENGER:"Retador"};
const TIER_ORDER = {IRON:0,BRONZE:1,SILVER:2,GOLD:3,PLATINUM:4,EMERALD:5,DIAMOND:6,MASTER:7,GRANDMASTER:8,CHALLENGER:9};
const DIV_ORDER = {IV:0,III:1,II:2,I:3};
function rankScore(s){
  if(!s) return -1;
  return TIER_ORDER[s.tier]*1000 + (DIV_ORDER[s.rank]||0)*100 + s.lp;
}

/* ---------- Datos EN VIVO ---------- */
const STATS = {};  // full -> data
async function loadLiveStats(){
  if(!CONFIG.liveStats) return;
  await Promise.all(CONFIG.players.map(async raw=>{
    const p = parseId(raw.riotId);
    try{
      const res = await fetch(`/api/summoner?riotId=${enc(p.full)}&platform=${R.uggPlatform}`);
      const d = await res.json();
      if(!res.ok) throw d;
      STATS[p.full] = d;
      renderCardStats(p.full, d, raw);
    }catch(e){
      const slot = document.querySelector(`[data-live="${CSS.escape(p.full)}"]`);
      if(slot) slot.innerHTML = `<span class="rank-none">Stats no disponibles</span>`;
    }
  }));
  renderLeaderboard();
}

function renderCardStats(full, d, raw){
  // rango
  const slot = document.querySelector(`[data-live="${CSS.escape(full)}"]`);
  if(slot){
    const s = d.solo;
    if(!s){
      slot.innerHTML = `<span class="rank-none">Sin clasificar (SoloQ)${d.level?` · Nv. ${d.level}`:""}</span>`;
    }else{
      const color = TIER_COLORS[s.tier]||"var(--gold)";
      const wrColor = s.winrate>=50?"var(--win)":"var(--loss)";
      slot.innerHTML = `
        <div class="rank-line">
          <span class="rank-badge" style="color:${color};border-color:${color}">${TIER_ES[s.tier]||s.tier} ${s.rank} · ${s.lp} LP</span>
          ${d.level?`<span class="lvl">Nv. ${d.level}</span>`:""}
        </div>
        <div class="wr-line">
          <span style="color:${wrColor};font-weight:700">${s.winrate}% WR</span>
          <div class="wr-bar"><span style="width:${s.winrate}%"></span></div>
          <span class="wr-detail">${s.wins}V ${s.losses}D</span>
        </div>`;
    }
  }
  // maestrías
  const mslot = document.querySelector(`[data-mastery="${CSS.escape(full)}"]`);
  if(mslot){
    const champs = (d.topChamps||[]).map(c=>CHAMP_BY_ID[c.championId]).filter(Boolean);
    mslot.innerHTML = champs.length
      ? `<span class="lbl">Mains</span>` + champs.map(c=>`<img src="${champIcon(c.id)}" title="${c.name}">`).join("")
      : `<span class="lbl">Mains</span><span class="m-none">sin datos</span>`;
  }
  // en partida
  if(d.live){
    const card = document.querySelector(`[data-card="${CSS.escape(full)}"]`);
    const flag = card && card.querySelector(".live-flag");
    if(card){ card.classList.add("ingame"); }
    if(flag){ flag.classList.add("show"); flag.querySelector(".txt").textContent = `EN PARTIDA · ${d.live.minutes}′`; }
  }
}

/* ---------- Leaderboard (ranking por LP SoloQ) ---------- */
function renderLeaderboard(){
  const box = document.getElementById("lb-body");
  if(!box) return;
  const rows = CONFIG.players.map(raw=>{
    const p = parseId(raw.riotId);
    const d = STATS[p.full] || {};
    return {raw, p, d, score:rankScore(d.solo)};
  }).sort((a,b)=> b.score - a.score);

  box.innerHTML = rows.map((row,i)=>{
    const s = row.d.solo;
    const iconId = (row.raw.main||"Poro").replace(/\s|'|\./g,"");
    const rankTxt = s ? `${TIER_ES[s.tier]||s.tier} ${s.rank}` : "Sin clasificar";
    const lpTxt = s ? `${s.lp} LP · ${s.winrate}% WR` : "—";
    const color = s ? (TIER_COLORS[s.tier]||"var(--gold)") : "var(--text-dim)";
    const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`;
    return `<div class="lb-row top${i+1}">
      <div class="lb-pos">${medal}</div>
      <img class="lb-ava" src="${champIcon(iconId)}"
        onerror="this.src='https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/profileicon/29.png'">
      <div>
        <div class="lb-name">${row.p.name}</div>
        <div class="lb-role">${row.raw.rol||""}</div>
      </div>
      <div class="lb-rank">
        <div class="r" style="color:${color}">${rankTxt}</div>
        <div class="lp">${lpTxt}</div>
      </div>
    </div>`;
  }).join("");
}

/* ---------- Tarjetas ---------- */
function buildCards(){
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  CONFIG.players.forEach(raw=>{
    const p = parseId(raw.riotId);
    const u = urls(p);
    const iconId = (raw.main||"Poro").replace(/\s|'|\./g,"");
    const card = document.createElement("div");
    card.className = "card"; card.setAttribute("data-card", p.full);
    card.innerHTML = `
      <div class="card-top">
        <img class="avatar" src="${champIcon(iconId)}"
          onerror="this.src='https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/profileicon/29.png'">
        <div class="pinfo">
          <div class="pname" title="${p.full}">${p.name}</div>
          <div class="ptag">#${p.tag}</div>
          <div class="pmeta">
            ${raw.rol?`<span class="chip rol">${raw.rol}</span>`:""}
            ${raw.main?`<span class="chip">${raw.main}</span>`:""}
          </div>
        </div>
        <span class="live-flag"><span>●</span> <span class="txt">EN PARTIDA</span></span>
      </div>
      ${CONFIG.liveStats?`<div class="live-stats" data-live="${p.full}"><span class="rank-none">Cargando stats…</span></div>`:""}
      ${CONFIG.liveStats?`<div class="mastery" data-mastery="${p.full}"><span class="lbl">Mains</span><span class="m-none">…</span></div>`:""}
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
function multiSearchUrl(){
  const names = CONFIG.players.map(p=>parseId(p.riotId).full);
  return `https://www.op.gg/multisearch/${R.pg}?summoners=${enc(names.join(","))}`;
}
function openAllProfiles(){ CONFIG.players.forEach(p=> window.open(urls(parseId(p.riotId)).opgg,"_blank","noopener")); }
function copyLobby(){
  const list = CONFIG.players.map(p=>parseId(p.riotId).full).join("\n");
  navigator.clipboard.writeText(list).then(()=>toast("Lista copiada ✔  Pégala en op.gg / Porofessor"));
}

/* ---------- Herramientas ---------- */
function randomChamp(){
  const out=document.getElementById("champ-out");
  if(!CHAMPIONS.length){out.textContent="Cargando…";return;}
  let t=0;const spin=setInterval(()=>{const c=CHAMPIONS[Math.floor(Math.random()*CHAMPIONS.length)];
    out.innerHTML=`<img src="${champIcon(c.id)}">${c.name}`;
    if(++t>14){clearInterval(spin);out.style.color="var(--gold)";setTimeout(()=>out.style.color="var(--cyan)",900);}},70);
}
function randomPlayer(){
  const out=document.getElementById("player-out");
  const names=CONFIG.players.map(p=>parseId(p.riotId).name);let t=0;
  const spin=setInterval(()=>{out.textContent=names[Math.floor(Math.random()*names.length)];
    if(++t>14){clearInterval(spin);out.style.color="var(--gold)";setTimeout(()=>out.style.color="var(--cyan)",900);}},70);
}
function coin(){
  const out=document.getElementById("coin-out");let t=0;
  const spin=setInterval(()=>{out.textContent=Math.random()>.5?"🔵 Lado AZUL":"🔴 Lado ROJO";if(++t>12)clearInterval(spin);},80);
}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);}

/* ---------- Partículas del hero ---------- */
function initFX(){
  const c=document.getElementById("fx"); if(!c) return;
  const ctx=c.getContext("2d"); let w,h,parts;
  function resize(){ w=c.width=c.offsetWidth; h=c.height=c.offsetHeight;
    parts=Array.from({length:Math.min(70,Math.floor(w/18))},()=>({
      x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.8+.4,
      vy:-(Math.random()*.4+.1),a:Math.random()*.5+.2,
      col:Math.random()>.5?"200,170,110":"10,200,185"}));}
  resize(); window.addEventListener("resize",resize);
  (function loop(){ ctx.clearRect(0,0,w,h);
    parts.forEach(p=>{ p.y+=p.vy; if(p.y<-5){p.y=h+5;p.x=Math.random()*w;}
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fillStyle=`rgba(${p.col},${p.a})`;
      ctx.shadowBlur=8;ctx.shadowColor=`rgba(${p.col},${p.a})`;ctx.fill();});
    requestAnimationFrame(loop);})();
}

/* ---------- Init ---------- */
async function init(){
  document.getElementById("group-name").textContent = CONFIG.groupName || "LoL Hub";
  const tg=document.getElementById("tagline"); if(tg&&CONFIG.tagline) tg.textContent = CONFIG.tagline;
  document.getElementById("region-lbl").textContent = region.toUpperCase();
  initFX();
  await loadDDragon();
  buildCards();
  renderLeaderboard();
  loadLiveStats();
  document.getElementById("btn-multi").href = multiSearchUrl();
  document.getElementById("patch-notes").href = "https://www.leagueoflegends.com/es-es/news/tags/patch-notes/";
}
document.addEventListener("DOMContentLoaded", init);
