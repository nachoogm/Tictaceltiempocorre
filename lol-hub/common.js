/* =====================================================================
   common.js — núcleo compartido (limitador concurrencia + caché navegador
   + navbar responsive + DDragon + stats + historial + modal enriquecido)
   ===================================================================== */
const REGIONS={euw:{pg:"euw",uggPlatform:"euw1"},eune:{pg:"eune",uggPlatform:"eun1"},na:{pg:"na",uggPlatform:"na1"},kr:{pg:"kr",uggPlatform:"kr"},br:{pg:"br",uggPlatform:"br1"},jp:{pg:"jp",uggPlatform:"jp1"},las:{pg:"las",uggPlatform:"la2"},lan:{pg:"lan",uggPlatform:"la1"},oce:{pg:"oce",uggPlatform:"oc1"},tr:{pg:"tr",uggPlatform:"tr1"},ru:{pg:"ru",uggPlatform:"ru"}};
const region=(CONFIG.region||"euw").toLowerCase();
const R=REGIONS[region]||REGIONS.euw;
const enc=encodeURIComponent;

/* Limitador: máx 3 /api simultáneas */
function pLimit(max){let active=0;const q=[];const next=()=>{if(active>=max||!q.length)return;active++;const{fn,res,rej}=q.shift();fn().then(res,rej).finally(()=>{active--;next();});};return fn=>new Promise((res,rej)=>{q.push({fn,res,rej});next();});}
const apiLimit=pLimit(3);
async function cachedFetch(url,ttlMs){
  const cacheKey="lh:"+url;
  try{const raw=localStorage.getItem(cacheKey);if(raw){const o=JSON.parse(raw);if(Date.now()-o.t<ttlMs)return o.d;}}catch(e){}
  const run=async()=>{for(let i=0;i<2;i++){const r=await fetch(url);if(r.status===429&&i<1){await new Promise(s=>setTimeout(s,1200));continue;}const d=await r.json();if(!r.ok){const e=new Error(d.error||"err");e.data=d;throw e;}try{localStorage.setItem(cacheKey,JSON.stringify({t:Date.now(),d}));}catch(e){}return d;}throw new Error("429");};
  return apiLimit(run);
}

function parseId(riotId){const[n,t]=riotId.split("#");return{name:(n||"").trim(),tag:(t||"").trim(),full:riotId.trim()};}
function urls(p){const slug=`${enc(p.name)}-${enc(p.tag)}`;return{opgg:`https://www.op.gg/summoners/${R.pg}/${slug}`,dpm:`https://dpm.lol/${enc(p.name)}-${enc(p.tag)}`,porofessor:`https://porofessor.gg/live/${R.pg}/${enc(p.name)}-${enc(p.tag)}`};}
function multiSearchUrl(){const names=CONFIG.players.map(p=>parseId(p.riotId).full);return `https://www.op.gg/multisearch/${R.pg}?summoners=${enc(names.join(","))}`;}

/* Data Dragon */
let DDRAGON_VER="16.14.1",CHAMPIONS=[],CHAMP_BY_KEY={},CHAMP_BY_ID={},ITEMS={},RUNES={},STYLES={};
const SPELLS={1:"SummonerBoost",3:"SummonerExhaust",4:"SummonerFlash",6:"SummonerHaste",7:"SummonerHeal",11:"SummonerSmite",12:"SummonerTeleport",13:"SummonerMana",14:"SummonerDot",21:"SummonerBarrier",32:"SummonerSnowball"};
const SPELL_ES={1:"Cleanse",3:"Agotar",4:"Destello",6:"Fantasmal",7:"Curar",11:"Castigar",12:"Teletransporte",13:"Claridad",14:"Encender",21:"Barrera",32:"Marca"};
function stripHtml(s){return (s||"").replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g," ").replace(/\s*\n\s*/g,"\n").replace(/[ \t]{2,}/g," ").replace(/\n{2,}/g,"\n").trim();}
async function loadDDragon(){
  try{const v=await fetch("https://ddragon.leagueoflegends.com/api/versions.json").then(r=>r.json());DDRAGON_VER=v[0];}catch(e){}
  document.querySelectorAll("[data-patch]").forEach(el=>el.textContent="Parche "+DDRAGON_VER);
  try{const d=await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/data/es_ES/champion.json`).then(r=>r.json());
    const seenId=new Set(),seenName=new Set();CHAMPIONS=[];CHAMP_BY_KEY={};CHAMP_BY_ID={};
    Object.values(d.data).forEach(c=>{const nk=(c.name||"").toLowerCase();if(seenId.has(c.id)||seenName.has(nk))return;seenId.add(c.id);seenName.add(nk);const o={id:c.id,name:c.name,key:c.key,tags:c.tags||[],partype:c.partype,info:c.info||{},stats:c.stats||{},title:c.title,blurb:c.blurb};CHAMPIONS.push(o);CHAMP_BY_KEY[c.key]=o;CHAMP_BY_ID[c.id]=o;});
    CHAMPIONS.sort((a,b)=>a.name.localeCompare(b.name));
  }catch(e){}
  // items (CDN estático, no gasta rate limit) — para tooltips
  try{const it=await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/data/es_ES/item.json`).then(r=>r.json());
    ITEMS={};Object.entries(it.data).forEach(([id,v])=>{ITEMS[id]={name:v.name,gold:(v.gold&&v.gold.total)||0,plain:v.plaintext||"",desc:stripHtml(v.description)};});
  }catch(e){}
  // runas (para el keystone en vivo)
  try{const rr=await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/data/es_ES/runesReforged.json`).then(r=>r.json());
    RUNES={};STYLES={};rr.forEach(style=>{STYLES[style.id]={name:style.name,icon:style.icon};style.slots.forEach(sl=>sl.runes.forEach(rn=>{RUNES[rn.id]={name:rn.name,icon:rn.icon};}));});
  }catch(e){}
}
const runeIcon=id=>RUNES[id]?`https://ddragon.leagueoflegends.com/cdn/img/${RUNES[id].icon}`:"";
const runeName=id=>RUNES[id]?RUNES[id].name:"";
const styleIcon=id=>STYLES[id]?`https://ddragon.leagueoflegends.com/cdn/img/${STYLES[id].icon}`:"";
const champIcon=id=>`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/champion/${id}.png`;
const itemIcon =id=>`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/item/${id}.png`;
const spellIcon=id=>`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/spell/${SPELLS[id]||"SummonerFlash"}.png`;
const spellName=id=>SPELL_ES[id]||"Hechizo";
const splashArt=id=>`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_0.jpg`;
const champById=key=>CHAMP_BY_KEY[key];
const champByNum=num=>CHAMPIONS.find(c=>+c.key===+num);
function dpmProfile(p){return `https://dpm.lol/${enc(p.name)}-${enc(p.tag)}`;}

/* ---------- Tooltip flotante de objetos (rich, no depende del title nativo) ---------- */
let _tip=null;
function ensureTip(){if(_tip)return _tip;_tip=document.createElement("div");_tip.className="item-tip";_tip.style.display="none";document.body.appendChild(_tip);return _tip;}
function showItemTip(id,x,y){
  const it=ITEMS[String(id)];const tip=ensureTip();
  if(!it){tip.style.display="none";return;}
  tip.innerHTML=`<div class="it-name">${it.name}</div>${it.gold?`<div class="it-gold">🪙 ${it.gold} oro</div>`:""}<div class="it-desc">${(it.desc||it.plain||"Sin descripción.").replace(/\n/g,"<br>")}</div>`;
  tip.style.display="block";moveTip(x,y);
}
function moveTip(x,y){if(!_tip||_tip.style.display==="none")return;const w=_tip.offsetWidth,h=_tip.offsetHeight;let nx=x+16,ny=y+16;if(nx+w>window.innerWidth-10)nx=x-w-16;if(ny+h>window.innerHeight-10)ny=y-h-16;_tip.style.left=Math.max(6,nx)+"px";_tip.style.top=Math.max(6,ny)+"px";}
function hideItemTip(){if(_tip)_tip.style.display="none";}
document.addEventListener("mouseover",e=>{const el=e.target.closest("[data-item]");if(el)showItemTip(el.getAttribute("data-item"),e.clientX,e.clientY);});
document.addEventListener("mousemove",e=>{if(_tip&&_tip.style.display==="block")moveTip(e.clientX,e.clientY);});
document.addEventListener("mouseout",e=>{if(e.target.closest("[data-item]"))hideItemTip();});
// móvil: tap sobre el objeto muestra el tooltip un momento
document.addEventListener("click",e=>{const el=e.target.closest("[data-item]");if(el){const r=el.getBoundingClientRect();showItemTip(el.getAttribute("data-item"),r.left,r.top);setTimeout(hideItemTip,2600);}});

/* Tiers rango */
const TIER_COLORS={IRON:"#7d7d7d",BRONZE:"#a5713d",SILVER:"#9aa8b3",GOLD:"#e6b84f",PLATINUM:"#4fd1c5",EMERALD:"#2ecc71",DIAMOND:"#5b8bf0",MASTER:"#b45cf0",GRANDMASTER:"#e0555b",CHALLENGER:"#f0d060"};
const TIER_ES={IRON:"Hierro",BRONZE:"Bronce",SILVER:"Plata",GOLD:"Oro",PLATINUM:"Platino",EMERALD:"Esmeralda",DIAMOND:"Diamante",MASTER:"Maestro",GRANDMASTER:"Gran Maestro",CHALLENGER:"Retador"};
const TIER_ABBR={IRON:"HIE",BRONZE:"BRC",SILVER:"PLT",GOLD:"ORO",PLATINUM:"PLA",EMERALD:"ESM",DIAMOND:"DIA",MASTER:"MAE",GRANDMASTER:"GM",CHALLENGER:"RET"};
const TIER_ORDER={IRON:0,BRONZE:1,SILVER:2,GOLD:3,PLATINUM:4,EMERALD:5,DIAMOND:6,MASTER:7,GRANDMASTER:8,CHALLENGER:9};
const DIV_ORDER={IV:0,III:1,II:2,I:3};
function rankScore(s){if(!s)return -1;return TIER_ORDER[s.tier]*1000+(DIV_ORDER[s.rank]||0)*100+s.lp;}
function rankBadge(s,label){if(!s)return`<div class="q-row"><span class="q-lbl">${label}</span><span class="q-none">Sin clasificar</span></div>`;const c=TIER_COLORS[s.tier]||"var(--gold)",wr=s.winrate>=50?"var(--win)":"var(--loss)";return`<div class="q-row"><span class="q-lbl">${label}</span><span class="rank-badge" style="color:${c};border-color:${c}">${TIER_ES[s.tier]||s.tier} ${s.rank} · ${s.lp} LP</span><span class="q-wr" style="color:${wr}">${s.winrate}%</span><span class="q-det">${s.wins}V ${s.losses}D</span></div>`;}
function miniRank(s){if(!s)return"";const c=TIER_COLORS[s.tier]||"var(--gold)";return`<span class="mini-rank" style="color:${c};border-color:${c}" title="${TIER_ES[s.tier]} ${s.rank} · ${s.lp} LP">${TIER_ABBR[s.tier]||s.tier} ${s.rank}</span>`;}

/* Stats en vivo */
const STATS={};
async function loadLiveStats(onCard){
  if(!CONFIG.liveStats)return;
  await Promise.all(CONFIG.players.map(async raw=>{const p=parseId(raw.riotId);
    try{const d=await cachedFetch(`/api/summoner?riotId=${enc(p.full)}&platform=${R.uggPlatform}`,4*60*1000);STATS[p.full]=d;if(onCard)onCard(p.full,d,raw);}
    catch(e){const s=document.querySelector(`[data-live="${CSS.escape(p.full)}"]`);if(s)s.innerHTML=`<span class="rank-none">Stats no disponibles</span>`;}
  }));
}

/* Historial */
function timeAgo(ts){if(!ts)return"";const s=Math.floor((Date.now()-ts)/1000);if(s<3600)return`hace ${Math.max(1,Math.floor(s/60))} min`;if(s<86400)return`hace ${Math.floor(s/3600)} h`;return`hace ${Math.floor(s/86400)} d`;}
async function loadMatches(){
  if(!CONFIG.liveStats)return;const count=CONFIG.matchCount||4;
  await Promise.all(CONFIG.players.map(async raw=>{
    const p=parseId(raw.riotId);const box=document.querySelector(`[data-matches="${CSS.escape(p.full)}"]`);if(!box)return;
    try{const d=await cachedFetch(`/api/matches?riotId=${enc(p.full)}&platform=${R.uggPlatform}&count=${count}`,4*60*1000);
      if(!d.matches)throw d;if(!d.matches.length){box.innerHTML=`<div class="mh-empty">Sin partidas recientes</div>`;return;}
      box.innerHTML=d.matches.map(m=>{const ch=champById(m.championId);const icon=ch?champIcon(ch.id):champIcon(m.championName);const kc=m.deaths===0?"var(--win)":(m.kda>=3?"var(--gold-bright)":"var(--text)");
        return`<div class="mh-row ${m.win?'win':'loss'}" data-match="${m.matchId}" data-platform="${m.platform}" role="button" tabindex="0"><img class="mh-champ" src="${icon}" onerror="this.style.visibility='hidden'" title="${m.championName}"><div class="mh-mid"><div class="mh-top"><span class="mh-res">${m.win?'Victoria':'Derrota'}</span><span class="mh-q">${m.queue}</span></div><div class="mh-kda"><b style="color:${kc}" title="Asesinatos / Muertes / Asistencias">${m.kills}/${m.deaths}/${m.assists}</b><span class="mh-ratio" title="Ratio (K+A)/D">${m.kda} KDA</span><span class="mh-cs" title="Súbditos+monstruos eliminados">${m.cs} CS</span></div></div><div class="mh-when">${timeAgo(m.when)}<span>${m.durationMin}′</span></div><div class="mh-arrow">›</div></div>`;
      }).join("");
    }catch(e){box.innerHTML=`<div class="mh-empty">Historial no disponible</div>`;}
  }));
}

/* ---------- Modal detalle partida ENRIQUECIDO con cabeceras + tooltips ---------- */
const POS_ES={TOP:"Top",JUNGLE:"Jungla",MIDDLE:"Mid",BOTTOM:"ADC",UTILITY:"Support"};
function ensureModal(){if(document.getElementById("match-modal"))return;const d=document.createElement("div");d.className="modal-overlay";d.id="match-modal";d.innerHTML=`<div class="modal modal-lg"><button class="modal-close" data-close-modal>✕</button><div id="modal-content"></div></div>`;document.body.appendChild(d);}
function objIcons(o){const b=[];if(o.baron)b.push(`🐉 Barón ${o.baron}`);if(o.dragon)b.push(`🔥 Dragón ${o.dragon}`);if(o.herald)b.push(`👁️ Heraldo ${o.herald}`);if(o.tower)b.push(`🏰 Torres ${o.tower}`);return b.join(" · ");}
async function openMatch(matchId,platform){
  ensureModal();const ov=document.getElementById("match-modal");const box=document.getElementById("modal-content");
  ov.classList.add("show");document.body.style.overflow="hidden";box.innerHTML=`<div class="mh-empty">Cargando partida… ⏳</div>`;
  try{
    const d=await cachedFetch(`/api/match?matchId=${enc(matchId)}&platform=${enc(platform||R.uggPlatform)}`,24*60*60*1000);
    const blue=d.participants.filter(p=>p.teamId===100),red=d.participants.filter(p=>p.teamId===200);
    const tBlue=d.teams.find(t=>t.teamId===100)||{objectives:{}},tRed=d.teams.find(t=>t.teamId===200)||{objectives:{}};
    const blueWin=tBlue.win;
    const multi=p=>{if(p.pentaKills)return`<span class="mm-multi penta">PENTA</span>`;if(p.quadraKills)return`<span class="mm-multi">QUADRA</span>`;if(p.tripleKills)return`<span class="mm-multi">TRIPLE</span>`;if(p.doubleKills)return`<span class="mm-multi">DOBLE</span>`;return"";};
    const header=`<div class="mm-colhead"><span class="hc-champ">Jugador</span><span class="hc-kda" title="Asesinatos / Muertes / Asistencias">KDA</span><span class="hc-num" title="Súbditos por minuto">CS</span><span class="hc-num" title="Daño a campeones">Daño</span><span class="hc-num hide-s" title="Oro ganado">Oro</span><span class="hc-num hide-s" title="Puntuación de visión">Visión</span><span class="hc-items">Objetos</span></div>`;
    const rowP=p=>{const ch=champById(p.championId);const icon=ch?champIcon(ch.id):champIcon(p.championName);const items=p.items.filter(i=>i&&i>0).map(i=>`<img class="mm-item" data-item="${i}" src="${itemIcon(i)}" onerror="this.style.display='none'">`).join("");const mine=CONFIG.players.some(pl=>parseId(pl.riotId).name.toLowerCase()===(p.riotId.split('#')[0]||'').toLowerCase());
      return`<div class="mm-row${mine?' mine':''}">
        <div class="mm-c" title="${p.championName} · Nivel ${p.champLevel}"><img class="mm-champ" src="${icon}" onerror="this.style.visibility='hidden'"><span class="mm-lvl">${p.champLevel}</span></div>
        <div class="mm-spells"><img src="${spellIcon(p.spell1)}" title="${spellName(p.spell1)}" onerror="this.style.display='none'"><img src="${spellIcon(p.spell2)}" title="${spellName(p.spell2)}" onerror="this.style.display='none'"></div>
        <div class="mm-pinfo"><div class="mm-name" title="${p.riotId}">${p.riotId.split('#')[0]} ${multi(p)}</div><div class="mm-pos">${POS_ES[p.position]||''}</div></div>
        <div class="mm-kda" title="Asesinatos / Muertes / Asistencias — Ratio ${p.kda}"><b>${p.kills}/${p.deaths}/${p.assists}</b><span>${p.kda} KDA</span></div>
        <div class="mm-num" title="${p.cs} súbditos · ${p.csPerMin} por minuto"><b>${p.cs}</b><span>${p.csPerMin}/min</span></div>
        <div class="mm-num" title="${p.damage.toLocaleString()} de daño a campeones"><b>${(p.damage/1000).toFixed(1)}k</b><div class="mm-dmgbar"><i style="width:${p.damagePct}%"></i></div></div>
        <div class="mm-num hide-s" title="${p.gold.toLocaleString()} de oro"><b>${(p.gold/1000).toFixed(1)}k</b><span>oro</span></div>
        <div class="mm-num hide-s" title="Visión: ${p.vision} · Guardianes puestos ${p.wards} · destruidos ${p.wardsKilled}"><b>${p.vision}</b><span>visión</span></div>
        <div class="mm-items" title="Objetos finales">${items}</div></div>`;};
    const banRow=t=>{const b=(t.bans||[]).map(id=>{const c=champByNum(id);return c?`<img src="${champIcon(c.id)}" title="Ban: ${c.name}">`:"";}).join("");return b?`<div class="mm-bans" title="Campeones baneados">🚫 ${b}</div>`:"";};
    const teamBlock=(list,team,win,label)=>{const sum=list.reduce((a,p)=>({k:a.k+p.kills,d:a.d+p.deaths,as:a.as+p.assists,g:a.g+p.gold}),{k:0,d:0,as:0,g:0});return`<div class="mm-team"><div class="mm-team-head ${win?'win':'loss'}"><span>${win?'🏆 Victoria':'💀 Derrota'} · ${label}</span><span class="mm-team-sum" title="Total asesinatos/muertes/asistencias · oro">${sum.k}/${sum.d}/${sum.as} · ${(sum.g/1000).toFixed(1)}k oro</span></div><div class="mm-obj">${objIcons(team.objectives||{})}</div>${banRow(team)}${header}${list.map(rowP).join("")}</div>`;};
    box.innerHTML=`<div class="mm-head"><div class="mm-title">${d.queue}</div><div class="mm-meta">${d.durationMin} min · ${timeAgo(d.when)}</div></div>${teamBlock(blue,tBlue,blueWin,"Equipo Azul")}${teamBlock(red,tRed,!blueWin,"Equipo Rojo")}<div class="mm-foot">Pasa el ratón sobre cada dato para ver qué es · Riot API (match-v5)</div>`;
  }catch(e){box.innerHTML=`<div class="mh-empty">No se pudo cargar la partida 😕<br><small>${(e&&e.data&&e.data.error)||'¿Desplegaste la carpeta /api/match?'}</small></div>`;}
}
function closeMatch(){const ov=document.getElementById("match-modal");if(ov)ov.classList.remove("show");document.body.style.overflow="";}
document.addEventListener("click",e=>{const row=e.target.closest("[data-match]");if(row){openMatch(row.getAttribute("data-match"),row.getAttribute("data-platform"));return;}if(e.target.id==="match-modal"||e.target.hasAttribute("data-close-modal"))closeMatch();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMatch();if(e.key==="Enter"){const row=e.target.closest&&e.target.closest("[data-match]");if(row)openMatch(row.getAttribute("data-match"),row.getAttribute("data-platform"));}});

/* Toast */
function toast(msg){let t=document.getElementById("toast");if(!t){t=document.createElement("div");t.className="toast";t.id="toast";document.body.appendChild(t);}t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);}

/* Navbar responsive */
function injectNav(active){
  const links=[["index.html","🏠 Inicio"],["ranking.html","🏆 Ranking"],["live.html","🔴 En vivo"],["champions.html","🧙 Campeones"],["loldle.html","🎯 LoLdle"],["tools.html","⚔️ Tools"]];
  const nav=document.createElement("nav");nav.className="navbar";
  nav.innerHTML=`<div class="nav-inner"><a class="nav-brand" href="index.html">⏳ <span>${CONFIG.groupName||"LoL Hub"}</span></a><button class="nav-toggle" aria-label="menú">☰</button><div class="nav-links">${links.map(([h,t])=>`<a href="${h}" class="${h===active?'active':''}">${t}</a>`).join("")}<a class="nav-region" href="${multiSearchUrl()}" target="_blank" rel="noopener">${region.toUpperCase()} · OP.GG</a></div></div>`;
  document.body.prepend(nav);
  const tog=nav.querySelector(".nav-toggle"),lk=nav.querySelector(".nav-links");
  tog.addEventListener("click",()=>lk.classList.toggle("open"));
}

/* Partículas hero */
function initFX(){const c=document.getElementById("fx");if(!c)return;const ctx=c.getContext("2d");let w,h,parts;
  function resize(){w=c.width=c.offsetWidth;h=c.height=c.offsetHeight;parts=Array.from({length:Math.min(80,Math.floor(w/16))},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.8+.4,vy:-(Math.random()*.4+.1),a:Math.random()*.5+.2,col:Math.random()>.5?"200,170,110":"10,200,185"}));}
  resize();window.addEventListener("resize",resize);
  (function loop(){ctx.clearRect(0,0,w,h);parts.forEach(p=>{p.y+=p.vy;if(p.y<-5){p.y=h+5;p.x=Math.random()*w;}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fillStyle=`rgba(${p.col},${p.a})`;ctx.shadowBlur=8;ctx.shadowColor=`rgba(${p.col},${p.a})`;ctx.fill();});requestAnimationFrame(loop);})();
}
