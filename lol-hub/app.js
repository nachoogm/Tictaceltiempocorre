/* =====================================================================
   LoL Hub — lógica principal
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

function parseId(riotId){ const [n,t]=riotId.split("#"); return {name:(n||"").trim(),tag:(t||"").trim(),full:riotId.trim()}; }
function urls(p){
  const slug=`${enc(p.name)}-${enc(p.tag)}`;
  return {
    opgg:`https://www.op.gg/summoners/${R.pg}/${slug}`,
    ugg:`https://u.gg/lol/profile/${R.uggPlatform}/${slug}/overview`,
    porofessor:`https://porofessor.gg/live/${R.pg}/${enc(p.name)}-${enc(p.tag)}`
  };
}

/* ---------- Data Dragon ---------- */
let DDRAGON_VER="16.14.1", CHAMPIONS=[], CHAMP_BY_KEY={};
const SPELLS={1:"SummonerBoost",3:"SummonerExhaust",4:"SummonerFlash",6:"SummonerHaste",7:"SummonerHeal",11:"SummonerSmite",12:"SummonerTeleport",13:"SummonerMana",14:"SummonerDot",21:"SummonerBarrier",32:"SummonerSnowball"};
async function loadDDragon(){
  try{ const v=await fetch("https://ddragon.leagueoflegends.com/api/versions.json").then(r=>r.json()); DDRAGON_VER=v[0]; }catch(e){}
  const pe=document.getElementById("patch"); if(pe) pe.textContent="Parche "+DDRAGON_VER;
  try{ const d=await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/data/es_ES/champion.json`).then(r=>r.json());
    CHAMPIONS=Object.values(d.data).map(c=>({id:c.id,name:c.name,key:c.key})); CHAMPIONS.forEach(c=>CHAMP_BY_KEY[c.key]=c); }catch(e){}
}
const champIcon = id => `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/champion/${id}.png`;
const itemIcon  = id => `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/item/${id}.png`;
const spellIcon = id => `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/spell/${SPELLS[id]||"SummonerFlash"}.png`;
const champById = key => CHAMP_BY_KEY[key];

/* ---------- Tiers ---------- */
const TIER_COLORS={IRON:"#7d7d7d",BRONZE:"#a5713d",SILVER:"#9aa8b3",GOLD:"#e6b84f",PLATINUM:"#4fd1c5",EMERALD:"#2ecc71",DIAMOND:"#5b8bf0",MASTER:"#b45cf0",GRANDMASTER:"#e0555b",CHALLENGER:"#f0d060"};
const TIER_ES={IRON:"Hierro",BRONZE:"Bronce",SILVER:"Plata",GOLD:"Oro",PLATINUM:"Platino",EMERALD:"Esmeralda",DIAMOND:"Diamante",MASTER:"Maestro",GRANDMASTER:"Gran Maestro",CHALLENGER:"Retador"};
const TIER_ORDER={IRON:0,BRONZE:1,SILVER:2,GOLD:3,PLATINUM:4,EMERALD:5,DIAMOND:6,MASTER:7,GRANDMASTER:8,CHALLENGER:9};
const DIV_ORDER={IV:0,III:1,II:2,I:3};
function rankScore(s){ if(!s) return -1; return TIER_ORDER[s.tier]*1000+(DIV_ORDER[s.rank]||0)*100+s.lp; }
function rankBadge(s,label){
  if(!s) return `<div class="q-row"><span class="q-lbl">${label}</span><span class="q-none">Sin clasificar</span></div>`;
  const c=TIER_COLORS[s.tier]||"var(--gold)", wr=s.winrate>=50?"var(--win)":"var(--loss)";
  return `<div class="q-row"><span class="q-lbl">${label}</span>
    <span class="rank-badge" style="color:${c};border-color:${c}">${TIER_ES[s.tier]||s.tier} ${s.rank} · ${s.lp} LP</span>
    <span class="q-wr" style="color:${wr}">${s.winrate}%</span><span class="q-det">${s.wins}V ${s.losses}D</span></div>`;
}

/* ---------- Stats en vivo ---------- */
const STATS={};
async function loadLiveStats(){
  if(!CONFIG.liveStats) return;
  await Promise.all(CONFIG.players.map(async raw=>{
    const p=parseId(raw.riotId);
    try{ const res=await fetch(`/api/summoner?riotId=${enc(p.full)}&platform=${R.uggPlatform}`); const d=await res.json();
      if(!res.ok) throw d; STATS[p.full]=d; renderCardStats(p.full,d,raw);
    }catch(e){ const s=document.querySelector(`[data-live="${CSS.escape(p.full)}"]`); if(s) s.innerHTML=`<span class="rank-none">Stats no disponibles</span>`; }
  }));
  renderLeaderboard();
}
function renderCardStats(full,d,raw){
  const slot=document.querySelector(`[data-live="${CSS.escape(full)}"]`);
  if(slot) slot.innerHTML=rankBadge(d.solo,"SoloQ")+rankBadge(d.flex,"Flex")+(d.level?`<div class="lvl-line">Nivel ${d.level}</div>`:"");
  const mslot=document.querySelector(`[data-mastery="${CSS.escape(full)}"]`);
  if(mslot){ const ch=(d.topChamps||[]).map(c=>champById(c.championId)).filter(Boolean);
    mslot.innerHTML=ch.length?`<span class="lbl">Mains</span>`+ch.map(c=>`<img src="${champIcon(c.id)}" title="${c.name}">`).join(""):`<span class="lbl">Mains</span><span class="m-none">sin datos</span>`; }
  // en partida → activa tarjeta + botón porofessor
  const card=document.querySelector(`[data-card="${CSS.escape(full)}"]`);
  const poro=card && card.querySelector(".poro-link");
  if(d.live){
    if(card) card.classList.add("ingame");
    const flag=card && card.querySelector(".live-flag");
    if(flag){ flag.classList.add("show"); flag.querySelector(".txt").textContent=`EN PARTIDA · ${d.live.minutes}′`; }
    if(poro){ poro.classList.remove("disabled"); poro.textContent="🔴 Ver partida en directo (Porofessor)"; }
  }else if(poro){
    poro.classList.add("disabled"); poro.textContent="⚫ No está en partida ahora";
    poro.addEventListener("click",e=>{ if(poro.classList.contains("disabled")){ e.preventDefault(); toast("No está jugando ahora mismo 🎮"); } });
  }
}

/* ---------- Historial ---------- */
function timeAgo(ts){ if(!ts) return ""; const s=Math.floor((Date.now()-ts)/1000);
  if(s<3600) return `hace ${Math.max(1,Math.floor(s/60))} min`; if(s<86400) return `hace ${Math.floor(s/3600)} h`; return `hace ${Math.floor(s/86400)} d`; }
async function loadMatches(){
  if(!CONFIG.liveStats) return; const count=CONFIG.matchCount||4;
  await Promise.all(CONFIG.players.map(async raw=>{
    const p=parseId(raw.riotId); const box=document.querySelector(`[data-matches="${CSS.escape(p.full)}"]`); if(!box) return;
    try{
      const res=await fetch(`/api/matches?riotId=${enc(p.full)}&platform=${R.uggPlatform}&count=${count}`); const d=await res.json();
      if(!res.ok||!d.matches) throw d;
      if(!d.matches.length){ box.innerHTML=`<div class="mh-empty">Sin partidas recientes</div>`; return; }
      box.innerHTML=d.matches.map(m=>{
        const ch=champById(m.championId); const icon=ch?champIcon(ch.id):champIcon(m.championName);
        const kc=m.deaths===0?"var(--win)":(m.kda>=3?"var(--gold-bright)":"var(--text)");
        return `<div class="mh-row ${m.win?'win':'loss'}" role="button" tabindex="0"
            onclick="openMatch('${m.matchId}','${m.platform}')" onkeypress="if(event.key==='Enter')openMatch('${m.matchId}','${m.platform}')">
          <img class="mh-champ" src="${icon}" onerror="this.style.visibility='hidden'" title="${m.championName}">
          <div class="mh-mid">
            <div class="mh-top"><span class="mh-res">${m.win?'Victoria':'Derrota'}</span><span class="mh-q">${m.queue}</span></div>
            <div class="mh-kda"><b style="color:${kc}">${m.kills}/${m.deaths}/${m.assists}</b><span class="mh-ratio">${m.kda} KDA</span><span class="mh-cs">${m.cs} CS</span></div>
          </div>
          <div class="mh-when">${timeAgo(m.when)}<span>${m.durationMin}′</span></div>
          <div class="mh-arrow">›</div>
        </div>`;
      }).join("");
    }catch(e){ box.innerHTML=`<div class="mh-empty">Historial no disponible</div>`; }
  }));
}

/* ---------- Modal detalle de partida ---------- */
const POS_ES={TOP:"Top",JUNGLE:"Jungla",MIDDLE:"Mid",BOTTOM:"ADC",UTILITY:"Support"};
async function openMatch(matchId, platform){
  const ov=document.getElementById("match-modal"); const box=document.getElementById("modal-content");
  ov.classList.add("show"); document.body.style.overflow="hidden";
  box.innerHTML=`<div class="mh-empty">Cargando partida… ⏳</div>`;
  try{
    const res=await fetch(`/api/match?matchId=${enc(matchId)}&platform=${enc(platform||R.uggPlatform)}`); const d=await res.json();
    if(!res.ok) throw d;
    const blue=d.participants.filter(p=>p.teamId===100), red=d.participants.filter(p=>p.teamId===200);
    const blueWin=(d.teams.find(t=>t.teamId===100)||{}).win;
    const teamBlock=(list,win,label,color)=>{
      const sum=list.reduce((a,p)=>({k:a.k+p.kills,d:a.d+p.deaths,as:a.as+p.assists,g:a.g+p.gold}),{k:0,d:0,as:0,g:0});
      return `<div class="mm-team">
        <div class="mm-team-head ${win?'win':'loss'}">
          <span>${win?'🏆 Victoria':'💀 Derrota'} · ${label}</span>
          <span class="mm-team-sum">${sum.k}/${sum.d}/${sum.as} · ${(sum.g/1000).toFixed(1)}k oro</span>
        </div>
        ${list.map(p=>rowP(p)).join("")}
      </div>`;
    };
    const rowP=p=>{
      const ch=champById(p.championId); const icon=ch?champIcon(ch.id):champIcon(p.championName);
      const items=p.items.filter(i=>i&&i>0).map(i=>`<img class="mm-item" src="${itemIcon(i)}" onerror="this.style.display='none'">`).join("");
      return `<div class="mm-row">
        <img class="mm-champ" src="${icon}" onerror="this.style.visibility='hidden'" title="${p.championName}">
        <div class="mm-spells"><img src="${spellIcon(p.spell1)}" onerror="this.style.display='none'"><img src="${spellIcon(p.spell2)}" onerror="this.style.display='none'"></div>
        <div class="mm-pinfo"><div class="mm-name" title="${p.riotId}">${p.riotId.split('#')[0]}</div><div class="mm-pos">${POS_ES[p.position]||''}</div></div>
        <div class="mm-kda"><b>${p.kills}/${p.deaths}/${p.assists}</b><span>${p.kda} KDA</span></div>
        <div class="mm-cs">${p.cs} CS</div>
        <div class="mm-items">${items}</div>
      </div>`;
    };
    box.innerHTML=`
      <div class="mm-head">
        <div class="mm-title">${d.queue}</div>
        <div class="mm-meta">${d.durationMin} min · ${timeAgo(d.when)}</div>
      </div>
      ${teamBlock(blue, blueWin, "Equipo Azul", "blue")}
      ${teamBlock(red, !blueWin, "Equipo Rojo", "red")}
      <div class="mm-foot">Datos oficiales de la Riot API (match-v5)</div>`;
  }catch(e){ box.innerHTML=`<div class="mh-empty">No se pudo cargar la partida 😕<br><small>${(e&&e.error)||''}</small></div>`; }
}
function closeMatch(){ const ov=document.getElementById("match-modal"); ov.classList.remove("show"); document.body.style.overflow=""; }
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeMatch(); });
document.addEventListener("click",e=>{ if(e.target.id==="match-modal") closeMatch(); });

/* ---------- Leaderboard ---------- */
function renderLeaderboard(){
  const box=document.getElementById("lb-body"); if(!box) return;
  const rows=CONFIG.players.map(raw=>{ const p=parseId(raw.riotId); const d=STATS[p.full]||{}; return {raw,p,d,score:rankScore(d.solo)}; }).sort((a,b)=>b.score-a.score);
  box.innerHTML=rows.map((row,i)=>{
    const s=row.d.solo; const iconId=(row.raw.main||"Poro").replace(/\s|'|\./g,"");
    const rankTxt=s?`${TIER_ES[s.tier]||s.tier} ${s.rank}`:"Sin clasificar"; const lpTxt=s?`${s.lp} LP · ${s.winrate}% WR`:"—";
    const color=s?(TIER_COLORS[s.tier]||"var(--gold)"):"var(--text-dim)"; const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`;
    return `<div class="lb-row top${i+1}"><div class="lb-pos">${medal}</div>
      <img class="lb-ava" src="${champIcon(iconId)}" onerror="this.src='https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/profileicon/29.png'">
      <div><div class="lb-name">${row.p.name}</div><div class="lb-role">${row.raw.rol||""}</div></div>
      <div class="lb-rank"><div class="r" style="color:${color}">${rankTxt}</div><div class="lp">${lpTxt}</div></div></div>`;
  }).join("");
}

/* ---------- Tarjetas ---------- */
function buildCards(){
  const grid=document.getElementById("grid"); grid.innerHTML="";
  CONFIG.players.forEach(raw=>{
    const p=parseId(raw.riotId); const u=urls(p); const iconId=(raw.main||"Poro").replace(/\s|'|\./g,"");
    const card=document.createElement("div"); card.className="card"; card.setAttribute("data-card",p.full);
    card.innerHTML=`
      <div class="card-top">
        <img class="avatar" src="${champIcon(iconId)}" onerror="this.src='https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/profileicon/29.png'">
        <div class="pinfo"><div class="pname" title="${p.full}">${p.name}</div><div class="ptag">#${p.tag}</div>
          <div class="pmeta">${raw.rol?`<span class="chip rol">${raw.rol}</span>`:""}${raw.main?`<span class="chip">${raw.main}</span>`:""}</div></div>
        <span class="live-flag"><span>●</span> <span class="txt">EN PARTIDA</span></span>
      </div>
      ${CONFIG.liveStats?`<div class="live-stats" data-live="${p.full}"><span class="rank-none">Cargando stats…</span></div>`:""}
      ${CONFIG.liveStats?`<div class="mastery" data-mastery="${p.full}"><span class="lbl">Mains</span><span class="m-none">…</span></div>`:""}
      ${CONFIG.liveStats?`<div class="mh-head">📜 Últimas partidas <small>(clic para detalle)</small></div><div class="match-history" data-matches="${p.full}"><div class="mh-empty">Cargando historial…</div></div>`:""}
      <div class="links">
        <a class="lnk" href="${u.opgg}" target="_blank" rel="noopener">OP.GG</a>
        <a class="lnk" href="${u.ugg}" target="_blank" rel="noopener">U.GG</a>
        <a class="lnk wide poro-link disabled" href="${u.porofessor}" target="_blank" rel="noopener">⚫ Comprobando estado…</a>
      </div>`;
    grid.appendChild(card);
  });
}

/* ---------- Global ---------- */
function multiSearchUrl(){ const names=CONFIG.players.map(p=>parseId(p.riotId).full); return `https://www.op.gg/multisearch/${R.pg}?summoners=${enc(names.join(","))}`; }

/* ---------- Herramientas ---------- */
function randomChamp(){ const out=document.getElementById("champ-out"); if(!CHAMPIONS.length){out.textContent="Cargando…";return;}
  let t=0;const s=setInterval(()=>{const c=CHAMPIONS[Math.floor(Math.random()*CHAMPIONS.length)];out.innerHTML=`<img src="${champIcon(c.id)}">${c.name}`;if(++t>14){clearInterval(s);out.style.color="var(--gold)";setTimeout(()=>out.style.color="var(--cyan)",900);}},70); }
function randomPlayer(){ const out=document.getElementById("player-out"); const names=CONFIG.players.map(p=>parseId(p.riotId).name);let t=0;
  const s=setInterval(()=>{out.textContent=names[Math.floor(Math.random()*names.length)];if(++t>14){clearInterval(s);out.style.color="var(--gold)";setTimeout(()=>out.style.color="var(--cyan)",900);}},70); }
function coin(){ const out=document.getElementById("coin-out");let t=0;const s=setInterval(()=>{out.textContent=Math.random()>.5?"🔵 Lado AZUL":"🔴 Lado ROJO";if(++t>12)clearInterval(s);},80); }
function toast(msg){ const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200); }

/* ---------- Partículas hero ---------- */
function initFX(){ const c=document.getElementById("fx"); if(!c) return; const ctx=c.getContext("2d"); let w,h,parts;
  function resize(){ w=c.width=c.offsetWidth;h=c.height=c.offsetHeight;
    parts=Array.from({length:Math.min(70,Math.floor(w/18))},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.8+.4,vy:-(Math.random()*.4+.1),a:Math.random()*.5+.2,col:Math.random()>.5?"200,170,110":"10,200,185"})); }
  resize(); window.addEventListener("resize",resize);
  (function loop(){ ctx.clearRect(0,0,w,h); parts.forEach(p=>{p.y+=p.vy;if(p.y<-5){p.y=h+5;p.x=Math.random()*w;}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fillStyle=`rgba(${p.col},${p.a})`;ctx.shadowBlur=8;ctx.shadowColor=`rgba(${p.col},${p.a})`;ctx.fill();}); requestAnimationFrame(loop); })();
}

/* ---------- Init ---------- */
async function init(){
  document.getElementById("group-name").textContent=CONFIG.groupName||"LoL Hub";
  const tg=document.getElementById("tagline"); if(tg&&CONFIG.tagline) tg.textContent=CONFIG.tagline;
  document.getElementById("region-lbl").textContent=region.toUpperCase();
  initFX(); await loadDDragon(); buildCards(); renderLeaderboard(); loadLiveStats(); loadMatches();
  document.getElementById("btn-multi").href=multiSearchUrl();
  document.getElementById("patch-notes").href="https://www.leagueoflegends.com/es-es/news/tags/patch-notes/";
}
document.addEventListener("DOMContentLoaded", init);
