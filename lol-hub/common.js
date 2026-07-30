/* =====================================================================
   common.js — núcleo compartido
   · Carga BATCH (/api/group) + stale-while-revalidate  → web instantánea
   · Personas y cuentas
   · Reproductor de música persistente entre páginas
   ===================================================================== */
const REGIONS={euw:{pg:"euw",uggPlatform:"euw1"},eune:{pg:"eune",uggPlatform:"eun1"},na:{pg:"na",uggPlatform:"na1"},kr:{pg:"kr",uggPlatform:"kr"},br:{pg:"br",uggPlatform:"br1"},jp:{pg:"jp",uggPlatform:"jp1"},las:{pg:"las",uggPlatform:"la2"},lan:{pg:"lan",uggPlatform:"la1"},oce:{pg:"oce",uggPlatform:"oc1"},tr:{pg:"tr",uggPlatform:"tr1"},ru:{pg:"ru",uggPlatform:"ru"}};
const region=(CONFIG.region||"euw").toLowerCase();
const R=REGIONS[region]||REGIONS.euw;
const enc=encodeURIComponent;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- PERSONAS / CUENTAS ---------- */
const PEOPLE=CONFIG.people||[];
const ACCOUNTS=PEOPLE.flatMap(p=>(p.accounts||[]).map(a=>({...a,owner:p.person,personIcon:p.icon||a.main})));
CONFIG.players=ACCOUNTS;
const personOf=full=>(ACCOUNTS.find(a=>a.riotId===full)||{}).owner||"";
const personByName=n=>PEOPLE.find(p=>p.person===n);
function parseId(riotId){const[n,t]=riotId.split("#");return{name:(n||"").trim(),tag:(t||"").trim(),full:riotId.trim()};}
function urls(p){const slug=`${enc(p.name)}-${enc(p.tag)}`;return{opgg:`https://www.op.gg/summoners/${R.pg}/${slug}`,dpm:`https://dpm.lol/${enc(p.name)}-${enc(p.tag)}`,porofessor:`https://porofessor.gg/live/${R.pg}/${enc(p.name)}-${enc(p.tag)}`};}
function dpmProfile(p){return `https://dpm.lol/${enc(p.name)}-${enc(p.tag)}`;}
function multiSearchUrl(){return `https://www.op.gg/multisearch/${R.pg}?summoners=${enc(ACCOUNTS.map(a=>a.riotId).join(","))}`;}
const safeIcon=n=>(n||"Poro").replace(/\s|'|\./g,"");

/* ---------- caché con stale-while-revalidate ---------- */
function cacheGet(key){try{const o=JSON.parse(localStorage.getItem("lh:"+key)||"null");return o&&o.d?o:null;}catch(e){return null;}}
function cacheSet(key,d){try{localStorage.setItem("lh:"+key,JSON.stringify({t:Date.now(),d}));}catch(e){}}
/* pide al batch; si hay caché la devuelve YA y refresca en segundo plano */
async function batch(what,{count,fresh=false,onUpdate}={}){
  const key=what==="matches"?`group:matches:${count}`:`group:${what}`;
  const ttl=what==="live"?25e3:(what==="matches"?5*60e3:5*60e3);
  const cached=cacheGet(key);
  const fetchIt=async()=>{
    const url=`/api/group?what=${what}`+(count?`&count=${count}`:"");
    const r=await fetch(url); const d=await r.json();
    if(!r.ok)throw Object.assign(new Error(d.error||"err"),{data:d});
    cacheSet(key,d); return d;
  };
  if(cached && !fresh){
    const age=Date.now()-cached.t;
    if(age<ttl) return cached.d;                       // fresca
    fetchIt().then(d=>onUpdate&&onUpdate(d)).catch(()=>{});   // caducada: sirve vieja + refresca
    return cached.d;
  }
  return fetchIt();
}

/* ---------- Data Dragon ---------- */
let DDRAGON_VER="16.14.1",CHAMPIONS=[],CHAMP_BY_KEY={},CHAMP_BY_ID={},ITEMS={},RUNES={},STYLES={};
const SPELLS={1:"SummonerBoost",3:"SummonerExhaust",4:"SummonerFlash",6:"SummonerHaste",7:"SummonerHeal",11:"SummonerSmite",12:"SummonerTeleport",13:"SummonerMana",14:"SummonerDot",21:"SummonerBarrier",32:"SummonerSnowball"};
const SPELL_ES={1:"Cleanse",3:"Agotar",4:"Destello",6:"Fantasmal",7:"Curar",11:"Castigar",12:"Teletransporte",13:"Claridad",14:"Encender",21:"Barrera",32:"Marca"};
function stripHtml(s){return (s||"").replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g," ").replace(/\s*\n\s*/g,"\n").replace(/[ \t]{2,}/g," ").replace(/\n{2,}/g,"\n").trim();}
async function loadDDragon(opts){
  const need=(opts&&opts.items)!==false;
  const cv=cacheGet("ddragon:ver");
  if(cv&&Date.now()-cv.t<24*3600e3)DDRAGON_VER=cv.d;
  else{try{const v=await fetch("https://ddragon.leagueoflegends.com/api/versions.json").then(r=>r.json());DDRAGON_VER=v[0];cacheSet("ddragon:ver",DDRAGON_VER);}catch(e){}}
  document.querySelectorAll("[data-patch]").forEach(el=>el.textContent="Parche "+DDRAGON_VER);
  const cc=cacheGet("ddragon:champs:"+DDRAGON_VER);
  const apply=d=>{const si=new Set(),sn=new Set();CHAMPIONS=[];CHAMP_BY_KEY={};CHAMP_BY_ID={};
    Object.values(d.data).forEach(c=>{const nk=(c.name||"").toLowerCase();if(si.has(c.id)||sn.has(nk))return;si.add(c.id);sn.add(nk);
      const o={id:c.id,name:c.name,key:c.key,tags:c.tags||[],partype:c.partype,info:c.info||{},stats:c.stats||{},title:c.title,blurb:c.blurb};
      CHAMPIONS.push(o);CHAMP_BY_KEY[c.key]=o;CHAMP_BY_ID[c.id]=o;});
    CHAMPIONS.sort((a,b)=>a.name.localeCompare(b.name));};
  if(cc){apply(cc.d);}
  else{try{const d=await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/data/es_ES/champion.json`).then(r=>r.json());apply(d);cacheSet("ddragon:champs:"+DDRAGON_VER,d);}catch(e){}}
  if(need){
    const ci=cacheGet("ddragon:items:"+DDRAGON_VER);
    const applyI=d=>{ITEMS={};Object.entries(d.data).forEach(([id,v])=>{ITEMS[id]={name:v.name,gold:(v.gold&&v.gold.total)||0,plain:v.plaintext||"",desc:stripHtml(v.description),tags:v.tags||[],into:v.into||[]};});};
    if(ci)applyI(ci.d);else{try{const d=await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/data/es_ES/item.json`).then(r=>r.json());applyI(d);cacheSet("ddragon:items:"+DDRAGON_VER,d);}catch(e){}}
  }
  try{const rr=await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/data/es_ES/runesReforged.json`).then(r=>r.json());
    RUNES={};STYLES={};rr.forEach(st=>{STYLES[st.id]={name:st.name,icon:st.icon};st.slots.forEach(sl=>sl.runes.forEach(rn=>{RUNES[rn.id]={name:rn.name,icon:rn.icon};}));});}catch(e){}
}
const champIcon=id=>`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/champion/${id}.png`;
const itemIcon =id=>`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/item/${id}.png`;
const spellIcon=id=>`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/spell/${SPELLS[id]||"SummonerFlash"}.png`;
const spellName=id=>SPELL_ES[id]||"Hechizo";
const splashArt=id=>`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_0.jpg`;
const runeIcon=id=>RUNES[id]?`https://ddragon.leagueoflegends.com/cdn/img/${RUNES[id].icon}`:"";
const runeName=id=>RUNES[id]?RUNES[id].name:"";
const champById=key=>CHAMP_BY_KEY[key];
const champByNum=num=>CHAMPIONS.find(c=>+c.key===+num);

/* ---------- Tooltip objetos ---------- */
let _tip=null;
function ensureTip(){if(_tip)return _tip;_tip=document.createElement("div");_tip.className="item-tip";_tip.style.display="none";document.body.appendChild(_tip);return _tip;}
function showItemTip(id,x,y){const it=ITEMS[String(id)];const tip=ensureTip();if(!it){tip.style.display="none";return;}tip.innerHTML=`<div class="it-name">${it.name}</div>${it.gold?`<div class="it-gold">🪙 ${it.gold} oro</div>`:""}<div class="it-desc">${(it.desc||it.plain||"Sin descripción.").replace(/\n/g,"<br>")}</div>`;tip.style.display="block";moveTip(x,y);}
function moveTip(x,y){if(!_tip||_tip.style.display==="none")return;const w=_tip.offsetWidth,h=_tip.offsetHeight;let nx=x+16,ny=y+16;if(nx+w>window.innerWidth-10)nx=x-w-16;if(ny+h>window.innerHeight-10)ny=y-h-16;_tip.style.left=Math.max(6,nx)+"px";_tip.style.top=Math.max(6,ny)+"px";}
function hideItemTip(){if(_tip)_tip.style.display="none";}
document.addEventListener("mouseover",e=>{const el=e.target.closest("[data-item]");if(el)showItemTip(el.getAttribute("data-item"),e.clientX,e.clientY);});
document.addEventListener("mousemove",e=>{if(_tip&&_tip.style.display==="block")moveTip(e.clientX,e.clientY);});
document.addEventListener("mouseout",e=>{if(e.target.closest("[data-item]"))hideItemTip();});

/* ---------- Tiers ---------- */
const TIER_COLORS={IRON:"#7d7d7d",BRONZE:"#a5713d",SILVER:"#9aa8b3",GOLD:"#e6b84f",PLATINUM:"#4fd1c5",EMERALD:"#2ecc71",DIAMOND:"#5b8bf0",MASTER:"#b45cf0",GRANDMASTER:"#e0555b",CHALLENGER:"#f0d060"};
const TIER_ES={IRON:"Hierro",BRONZE:"Bronce",SILVER:"Plata",GOLD:"Oro",PLATINUM:"Platino",EMERALD:"Esmeralda",DIAMOND:"Diamante",MASTER:"Maestro",GRANDMASTER:"Gran Maestro",CHALLENGER:"Retador"};
const TIER_ABBR={IRON:"HIE",BRONZE:"BRC",SILVER:"PLT",GOLD:"ORO",PLATINUM:"PLA",EMERALD:"ESM",DIAMOND:"DIA",MASTER:"MAE",GRANDMASTER:"GM",CHALLENGER:"RET"};
const TIER_ORDER={IRON:0,BRONZE:1,SILVER:2,GOLD:3,PLATINUM:4,EMERALD:5,DIAMOND:6,MASTER:7,GRANDMASTER:8,CHALLENGER:9};
const DIV_ORDER={IV:0,III:1,II:2,I:3};
function rankScore(s){if(!s)return -1;return TIER_ORDER[s.tier]*1000+(DIV_ORDER[s.rank]||0)*100+s.lp;}
function rankBadge(s,label){if(!s)return`<div class="q-row"><span class="q-lbl">${label}</span><span class="q-none">Sin clasificar</span></div>`;const c=TIER_COLORS[s.tier]||"var(--gold)",wr=s.winrate>=50?"var(--win)":"var(--loss)";return`<div class="q-row"><span class="q-lbl">${label}</span><span class="rank-badge" style="color:${c};border-color:${c}">${TIER_ES[s.tier]||s.tier} ${s.rank} · ${s.lp} LP</span><span class="q-wr" style="color:${wr}">${s.winrate}%</span><span class="q-det">${s.wins}V ${s.losses}D</span></div>`;}
function miniRank(s){if(!s)return"";const c=TIER_COLORS[s.tier]||"var(--gold)";return`<span class="mini-rank" style="color:${c};border-color:${c}" title="${TIER_ES[s.tier]} ${s.rank} · ${s.lp} LP">${TIER_ABBR[s.tier]||s.tier} ${s.rank}</span>`;}

/* ---------- LP snapshots ---------- */
function todayStr(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function lpKey(name){return "lh:lp:"+name;}
function absLp(s){if(!s)return null;return TIER_ORDER[s.tier]*400+(DIV_ORDER[s.rank]||0)*100+s.lp;}
function recordLp(name,solo){if(!name||!solo)return;let h={};try{h=JSON.parse(localStorage.getItem(lpKey(name))||"{}");}catch(e){}
  h[todayStr()]={lp:solo.lp,abs:absLp(solo),tier:solo.tier,rank:solo.rank};
  const k=Object.keys(h).sort();while(k.length>90)delete h[k.shift()];
  try{localStorage.setItem(lpKey(name),JSON.stringify(h));}catch(e){}}
function getLpHistory(name){try{const h=JSON.parse(localStorage.getItem(lpKey(name))||"{}");return Object.entries(h).map(([date,v])=>({date,...v})).sort((a,b)=>a.date.localeCompare(b.date));}catch(e){return [];}}
function pushLpShared(name,solo){if(!name||!solo)return;const flag="lh:lppush:"+name+":"+todayStr();if(localStorage.getItem(flag))return;
  fetch("/api/lp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,lp:solo.lp,abs:absLp(solo),tier:solo.tier,rank:solo.rank})})
    .then(r=>{if(r.ok){try{localStorage.setItem(flag,"1");}catch(e){}}}).catch(()=>{});}
async function getSharedLp(days){try{const r=await fetch(`/api/lp?days=${days||21}`);const d=await r.json();if(r.ok&&d.configured)return d.players||{};return null;}catch(e){return null;}}

/* ---------- Stats en vivo (BATCH) ---------- */
const STATS={};
function applyRanks(players,onCard){
  (players||[]).forEach(p=>{
    if(!p||!p.riotId)return;
    STATS[p.riotId]={...(STATS[p.riotId]||{}),...p};
    if(p.solo){recordLp(parseId(p.riotId).name,p.solo);pushLpShared(parseId(p.riotId).name,p.solo);}
    const acc=ACCOUNTS.find(a=>a.riotId===p.riotId);
    if(onCard)onCard(p.riotId,STATS[p.riotId],acc||{});
  });
}
async function loadLiveStats(onCard){
  if(!CONFIG.liveStats)return;
  try{
    const d=await batch("ranks",{onUpdate:x=>applyRanks(x.players,onCard)});
    applyRanks(d.players,onCard);
  }catch(e){document.querySelectorAll("[data-live]").forEach(s=>s.innerHTML=`<span class="rank-none">Stats no disponibles</span>`);}
}
function bestAccountOf(personName){
  const accs=ACCOUNTS.filter(a=>a.owner===personName);let best=null,bs=-2;
  accs.forEach(a=>{const d=STATS[a.riotId]||{};const s=rankScore(d.solo);if(s>bs){bs=s;best={acc:a,data:d};}});
  return best;
}

/* ---------- Historial (BATCH) ---------- */
function timeAgo(ts){if(!ts)return"";const s=Math.floor((Date.now()-ts)/1000);if(s<3600)return`hace ${Math.max(1,Math.floor(s/60))} min`;if(s<86400)return`hace ${Math.floor(s/3600)} h`;return`hace ${Math.floor(s/86400)} d`;}
const MATCHDATA={};
function matchRow(m){
  const ch=champById(m.championId);const icon=ch?champIcon(ch.id):champIcon(m.championName);
  const kc=m.deaths===0?"var(--win)":(m.kda>=3?"var(--gold-bright)":"var(--text)");
  return`<div class="mh-row ${m.win?'win':'loss'}" data-match="${m.matchId}" data-platform="${m.platform}" role="button" tabindex="0"><img class="mh-champ" src="${icon}" onerror="this.style.visibility='hidden'" title="${m.championName}"><div class="mh-mid"><div class="mh-top"><span class="mh-res">${m.win?'Victoria':'Derrota'}</span><span class="mh-q">${m.queue}</span></div><div class="mh-kda"><b style="color:${kc}" title="Asesinatos / Muertes / Asistencias">${m.kills}/${m.deaths}/${m.assists}</b><span class="mh-ratio" title="Ratio (K+A)/D">${m.kda} KDA</span><span class="mh-cs" title="Súbditos+monstruos">${m.cs} CS</span></div></div><div class="mh-when">${timeAgo(m.when)}<span>${m.durationMin}′</span></div><div class="mh-arrow">›</div></div>`;
}
function paintMatches(players){
  (players||[]).forEach(p=>{
    if(!p||!p.riotId)return;
    MATCHDATA[p.riotId]=p.matches||[];
    const box=document.querySelector(`[data-matches="${CSS.escape(p.riotId)}"]`);
    const st=document.querySelector(`[data-streak="${CSS.escape(p.riotId)}"]`);
    if(st)st.innerHTML=streakHtml(p.matches||[]);
    if(!box)return;
    if(!p.matches||!p.matches.length){box.innerHTML=`<div class="mh-empty">Sin partidas recientes</div>`;return;}
    box.innerHTML=p.matches.map(matchRow).join("");
  });
}
async function loadMatches(count){
  if(!CONFIG.liveStats)return;
  const n=count||CONFIG.matchCount||3;
  try{const d=await batch("matches",{count:n,onUpdate:x=>paintMatches(x.players)});paintMatches(d.players);}
  catch(e){document.querySelectorAll("[data-matches]").forEach(b=>b.innerHTML=`<div class="mh-empty">Historial no disponible</div>`);}
}
/* "Ver más": amplía SOLO esa cuenta */
async function expandMatches(riotId,btn){
  const n=CONFIG.matchCountMore||10;
  const box=document.querySelector(`[data-matches="${CSS.escape(riotId)}"]`);
  if(!box)return;
  if(btn){btn.disabled=true;btn.textContent="Cargando…";}
  try{
    const p=parseId(riotId);
    const r=await fetch(`/api/matches?riotId=${enc(p.full)}&platform=${R.uggPlatform}&count=${n}`);
    const d=await r.json();
    if(r.ok&&d.matches&&d.matches.length){
      MATCHDATA[riotId]=d.matches;
      box.innerHTML=d.matches.map(matchRow).join("");
      if(btn){btn.textContent="▲ Ver menos";btn.disabled=false;btn.dataset.expanded="1";}
    }else if(btn){btn.textContent="Ver más ▼";btn.disabled=false;}
  }catch(e){if(btn){btn.textContent="Ver más ▼";btn.disabled=false;}}
}
function collapseMatches(riotId,btn){
  const box=document.querySelector(`[data-matches="${CSS.escape(riotId)}"]`);
  const all=MATCHDATA[riotId]||[];
  if(box)box.innerHTML=all.slice(0,CONFIG.matchCount||3).map(matchRow).join("");
  if(btn){btn.textContent="Ver más ▼";btn.dataset.expanded="";}
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-more]");
  if(!b)return;
  const id=b.getAttribute("data-more");
  if(b.dataset.expanded)collapseMatches(id,b);else expandMatches(id,b);
});
function streakHtml(matches){
  const ranked=(matches||[]).filter(m=>m.ranked).slice(0,6);
  const src=ranked.length?ranked:(matches||[]).slice(0,6);
  return src.map(m=>`<span class="dot-${m.win?'w':'l'}" title="${m.win?'Victoria':'Derrota'} · ${m.championName}"></span>`).join("");
}

/* ---------- Modal detalle partida ---------- */
const POS_ES={TOP:"Top",JUNGLE:"Jungla",MIDDLE:"Mid",BOTTOM:"ADC",UTILITY:"Support"};
function ensureModal(){if(document.getElementById("match-modal"))return;const d=document.createElement("div");d.className="modal-overlay";d.id="match-modal";d.innerHTML=`<div class="modal modal-lg"><button class="modal-close" data-close-modal>✕</button><div id="modal-content"></div></div>`;document.body.appendChild(d);}
function objIcons(o){const b=[];if(o.baron)b.push(`🐉 Barón ${o.baron}`);if(o.dragon)b.push(`🔥 Dragón ${o.dragon}`);if(o.herald)b.push(`👁️ Heraldo ${o.herald}`);if(o.tower)b.push(`🏰 Torres ${o.tower}`);return b.join(" · ");}
async function openMatch(matchId,platform){
  ensureModal();const ov=document.getElementById("match-modal");const box=document.getElementById("modal-content");
  ov.classList.add("show");document.body.style.overflow="hidden";box.innerHTML=`<div class="mh-empty">Cargando partida… ⏳</div>`;
  try{
    const ck="match:"+matchId; const c=cacheGet(ck); let d;
    if(c)d=c.d; else {const r=await fetch(`/api/match?matchId=${enc(matchId)}&platform=${enc(platform||R.uggPlatform)}`);d=await r.json();if(!r.ok)throw Object.assign(new Error(d.error),{data:d});cacheSet(ck,d);}
    const blue=d.participants.filter(p=>p.teamId===100),red=d.participants.filter(p=>p.teamId===200);
    const tBlue=d.teams.find(t=>t.teamId===100)||{objectives:{}},tRed=d.teams.find(t=>t.teamId===200)||{objectives:{}};const blueWin=tBlue.win;
    const multi=p=>{if(p.pentaKills)return`<span class="mm-multi penta">PENTA</span>`;if(p.quadraKills)return`<span class="mm-multi">QUADRA</span>`;if(p.tripleKills)return`<span class="mm-multi">TRIPLE</span>`;if(p.doubleKills)return`<span class="mm-multi">DOBLE</span>`;return"";};
    const header=`<div class="mm-colhead"><span class="hc-champ">Jugador</span><span class="hc-kda" title="Asesinatos/Muertes/Asistencias">KDA</span><span class="hc-num" title="Súbditos por minuto">CS</span><span class="hc-num" title="Daño a campeones">Daño</span><span class="hc-num hide-s" title="Oro">Oro</span><span class="hc-num hide-s" title="Visión">Visión</span><span class="hc-items">Objetos</span></div>`;
    const rowP=p=>{const ch=champById(p.championId);const icon=ch?champIcon(ch.id):champIcon(p.championName);
      const items=p.items.filter(i=>i&&i>0).map(i=>`<img class="mm-item" data-item="${i}" src="${itemIcon(i)}" onerror="this.style.display='none'">`).join("");
      const nick=(p.riotId.split('#')[0]||'').toLowerCase();
      const mate=ACCOUNTS.find(a=>parseId(a.riotId).name.toLowerCase()===nick);
      const label=mate?`${p.riotId.split('#')[0]} <small style="color:var(--cyan)">(${mate.owner})</small>`:p.riotId.split('#')[0];
      return`<div class="mm-row${mate?' mine':''}"><div class="mm-c" title="${p.championName} · Nivel ${p.champLevel}"><img class="mm-champ" src="${icon}" onerror="this.style.visibility='hidden'"><span class="mm-lvl">${p.champLevel}</span></div><div class="mm-spells"><img src="${spellIcon(p.spell1)}" title="${spellName(p.spell1)}" onerror="this.style.display='none'"><img src="${spellIcon(p.spell2)}" title="${spellName(p.spell2)}" onerror="this.style.display='none'"></div><div class="mm-pinfo"><div class="mm-name" title="${p.riotId}">${label} ${multi(p)}</div><div class="mm-pos">${POS_ES[p.position]||''}</div></div><div class="mm-kda" title="Ratio ${p.kda}"><b>${p.kills}/${p.deaths}/${p.assists}</b><span>${p.kda} KDA</span></div><div class="mm-num" title="${p.cs} súbditos · ${p.csPerMin}/min"><b>${p.cs}</b><span>${p.csPerMin}/min</span></div><div class="mm-num" title="${p.damage.toLocaleString()} daño"><b>${(p.damage/1000).toFixed(1)}k</b><div class="mm-dmgbar"><i style="width:${p.damagePct}%"></i></div></div><div class="mm-num hide-s" title="${p.gold.toLocaleString()} oro"><b>${(p.gold/1000).toFixed(1)}k</b><span>oro</span></div><div class="mm-num hide-s" title="Visión ${p.vision}"><b>${p.vision}</b><span>visión</span></div><div class="mm-items">${items}</div></div>`;};
    const banRow=t=>{const b=(t.bans||[]).map(id=>{const c=champByNum(id);return c?`<img src="${champIcon(c.id)}" title="Ban: ${c.name}">`:"";}).join("");return b?`<div class="mm-bans">🚫 ${b}</div>`:"";};
    const teamBlock=(list,team,win,label)=>{const s=list.reduce((a,p)=>({k:a.k+p.kills,d:a.d+p.deaths,as:a.as+p.assists,g:a.g+p.gold}),{k:0,d:0,as:0,g:0});
      return`<div class="mm-team"><div class="mm-team-head ${win?'win':'loss'}"><span>${win?'🏆 Victoria':'💀 Derrota'} · ${label}</span><span class="mm-team-sum">${s.k}/${s.d}/${s.as} · ${(s.g/1000).toFixed(1)}k oro</span></div><div class="mm-obj">${objIcons(team.objectives||{})}</div>${banRow(team)}${header}${list.map(rowP).join("")}</div>`;};
    box.innerHTML=`<div class="mm-head"><div class="mm-title">${d.queue}</div><div class="mm-meta">${d.durationMin} min · ${timeAgo(d.when)}</div></div>${teamBlock(blue,tBlue,blueWin,"Equipo Azul")}${teamBlock(red,tRed,!blueWin,"Equipo Rojo")}<div class="mm-foot">Pasa el ratón sobre cada dato u objeto · Riot API</div>`;
  }catch(e){box.innerHTML=`<div class="mh-empty">No se pudo cargar la partida 😕<br><small>${(e&&e.data&&e.data.error)||''}</small></div>`;}
}
function closeMatch(){const ov=document.getElementById("match-modal");if(ov)ov.classList.remove("show");document.body.style.overflow="";}
document.addEventListener("click",e=>{const row=e.target.closest("[data-match]");if(row){openMatch(row.getAttribute("data-match"),row.getAttribute("data-platform"));return;}if(e.target.id==="match-modal"||e.target.hasAttribute("data-close-modal"))closeMatch();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMatch();});

/* ---------- Toast ---------- */
function toast(msg){let t=document.getElementById("toast");if(!t){t=document.createElement("div");t.className="toast";t.id="toast";document.body.appendChild(t);}t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);}

/* =====================================================================
   🎵 REPRODUCTOR PERSISTENTE
   Guarda pista + segundo exacto en localStorage y lo restaura al cambiar
   de página, así la canción "sigue" aunque navegues.
   ===================================================================== */
const SONGS=CONFIG.songs||[];
const PKEY="lh:player";
function pState(){try{return JSON.parse(localStorage.getItem(PKEY)||"null")||{idx:0,time:0,playing:false,vol:.8};}catch(e){return{idx:0,time:0,playing:false,vol:.8};}}
function pSave(s){try{localStorage.setItem(PKEY,JSON.stringify(s));}catch(e){}}
const songUrl=s=>"music/"+encodeURIComponent(s.file);
const songCover=s=>s.cover||CONFIG.coverDefault||"music/cover.jpg";
function fmtTime(t){if(!isFinite(t))return "0:00";const m=Math.floor(t/60),ss=Math.floor(t%60);return m+":"+String(ss).padStart(2,"0");}
let AUDIO=null,PBAR=null;

function initPlayer(){
  if(!SONGS.length||document.getElementById("mini-player"))return;
  const st=pState();
  PBAR=document.createElement("div");PBAR.id="mini-player";PBAR.className="mplayer";
  PBAR.innerHTML=`
    <img class="mp-art" id="mp-art" alt="">
    <div class="mp-info"><div class="mp-title" id="mp-title">—</div><div class="mp-artist" id="mp-artist"></div></div>
    <div class="mp-ctrls">
      <button class="mp-btn" id="mp-prev" title="Anterior">⏮</button>
      <button class="mp-btn play" id="mp-play" title="Reproducir">▶</button>
      <button class="mp-btn" id="mp-next" title="Siguiente">⏭</button>
    </div>
    <div class="mp-bar"><span class="mp-t" id="mp-cur">0:00</span><input type="range" id="mp-seek" min="0" max="100" value="0"><span class="mp-t" id="mp-dur">0:00</span></div>
    <input type="range" class="mp-vol" id="mp-vol" min="0" max="100" title="Volumen">
    <a class="mp-open" href="playlist.html" title="Abrir playlist">🎵</a>
    <button class="mp-btn mp-close" id="mp-hide" title="Ocultar">✕</button>`;
  document.body.appendChild(PBAR);
  AUDIO=new Audio();AUDIO.preload="metadata";AUDIO.volume=st.vol??.8;
  const $=id=>document.getElementById(id);
  $("mp-vol").value=(st.vol??.8)*100;

  function paintNow(idx){
    const s=SONGS[idx];if(!s)return;
    $("mp-title").textContent=s.title;$("mp-artist").textContent=s.artist||"";
    $("mp-art").src=songCover(s);
    // sincroniza el widget lateral si existe
    const sw=document.getElementById("side-player");
    if(sw){
      const t=sw.querySelector(".sp-title"),a=sw.querySelector(".sp-artist"),c=sw.querySelector(".sp-cover");
      if(t)t.textContent=s.title; if(a)a.textContent=s.artist||""; if(c)c.src=songCover(s);
    }
    document.querySelectorAll("[data-song]").forEach(el=>el.classList.toggle("playing",+el.getAttribute("data-song")===idx));
  }
  function setPlayIcon(p){
    $("mp-play").textContent=p?"⏸":"▶";
    const sp=document.getElementById("sp-play"); if(sp)sp.textContent=p?"⏸":"▶";
    const sw=document.getElementById("side-player"); if(sw)sw.classList.toggle("is-playing",p);
  }
  function load(idx,time,play){
    const s=SONGS[idx];if(!s)return;
    AUDIO.src=songUrl(s);AUDIO.currentTime=0;
    paintNow(idx);
    const go=()=>{if(time>0){try{AUDIO.currentTime=time;}catch(e){}}
      if(play)AUDIO.play().then(()=>setPlayIcon(true)).catch(()=>{setPlayIcon(false);PBAR.classList.add("needs-tap");});};
    if(AUDIO.readyState>0)go();else AUDIO.addEventListener("loadedmetadata",go,{once:true});
    pSave({...pState(),idx,time,playing:!!play});
  }
  /* API global usada por playlist.html y el widget lateral */
  window.playSong=idx=>{const s=pState();if(s.idx===idx&&AUDIO.src&&!AUDIO.paused){AUDIO.pause();setPlayIcon(false);return;}load(idx,0,true);};
  window.playerNext=()=>{const s=pState();load((s.idx+1)%SONGS.length,0,true);};
  window.playerPrev=()=>{const s=pState();load((s.idx-1+SONGS.length)%SONGS.length,0,true);};
  window.playerToggle=()=>{
    if(!AUDIO.src){load(pState().idx||0,0,true);return;}
    if(AUDIO.paused)AUDIO.play().then(()=>{setPlayIcon(true);PBAR.classList.remove("needs-tap");}).catch(()=>{});
    else{AUDIO.pause();setPlayIcon(false);}
  };
  window.playerState=()=>({...pState(),paused:AUDIO?AUDIO.paused:true,song:SONGS[pState().idx]});

  $("mp-play").addEventListener("click",()=>window.playerToggle());
  $("mp-next").addEventListener("click",()=>window.playerNext());
  $("mp-prev").addEventListener("click",()=>window.playerPrev());
  $("mp-hide").addEventListener("click",()=>PBAR.classList.add("hidden"));
  $("mp-vol").addEventListener("input",e=>{AUDIO.volume=e.target.value/100;pSave({...pState(),vol:AUDIO.volume});});
  $("mp-seek").addEventListener("input",e=>{if(AUDIO.duration)AUDIO.currentTime=(e.target.value/100)*AUDIO.duration;});
  AUDIO.addEventListener("play",()=>{setPlayIcon(true);pSave({...pState(),playing:true});});
  AUDIO.addEventListener("pause",()=>{setPlayIcon(false);pSave({...pState(),playing:false,time:AUDIO.currentTime});});
  AUDIO.addEventListener("ended",()=>window.playerNext());
  AUDIO.addEventListener("timeupdate",()=>{
    if(AUDIO.duration){
      const pct=(AUDIO.currentTime/AUDIO.duration)*100;
      $("mp-seek").value=pct;$("mp-cur").textContent=fmtTime(AUDIO.currentTime);$("mp-dur").textContent=fmtTime(AUDIO.duration);
      const sb=document.getElementById("sp-fill"); if(sb)sb.style.width=pct+"%";
      const sc=document.getElementById("sp-cur");  if(sc)sc.textContent=fmtTime(AUDIO.currentTime);
    }
    if(!AUDIO.paused&&Math.floor(AUDIO.currentTime*2)%2===0)pSave({...pState(),time:AUDIO.currentTime,playing:true});
  });
  window.addEventListener("beforeunload",()=>{if(AUDIO&&AUDIO.src)pSave({...pState(),time:AUDIO.currentTime,playing:!AUDIO.paused});});
  if(st.time>0||st.playing)load(st.idx||0,st.time||0,st.playing);
  else paintNow(st.idx||0);
  document.addEventListener("click",function once(){if(PBAR.classList.contains("needs-tap")&&pState().playing){AUDIO.play().then(()=>{setPlayIcon(true);PBAR.classList.remove("needs-tap");}).catch(()=>{});}document.removeEventListener("click",once);},{once:true});
}

/* ---------- Widget lateral (solo Inicio) ---------- */
function initSidePlayer(){
  if(!SONGS.length||document.getElementById("side-player"))return;
  const st=pState(),s=SONGS[st.idx]||SONGS[0];
  const w=document.createElement("aside");w.id="side-player";w.className="sideplayer";
  w.innerHTML=`
    <div class="sp-head">🎵 Sonando ahora <button class="sp-min" id="sp-min" title="Minimizar">–</button></div>
    <img class="sp-cover" src="${songCover(s)}" alt="">
    <div class="sp-meta"><div class="sp-title">${s.title}</div><div class="sp-artist">${s.artist||""}</div></div>
    <div class="sp-progress"><i id="sp-fill"></i></div>
    <div class="sp-time"><span id="sp-cur">0:00</span></div>
    <div class="sp-ctrls">
      <button class="sp-btn" id="sp-prev" title="Anterior">⏮</button>
      <button class="sp-btn play" id="sp-play" title="Reproducir">▶</button>
      <button class="sp-btn" id="sp-next" title="Siguiente">⏭</button>
    </div>
    <a class="sp-link" href="playlist.html">Ver playlist →</a>`;
  document.body.appendChild(w);
  document.getElementById("sp-play").addEventListener("click",()=>window.playerToggle&&window.playerToggle());
  document.getElementById("sp-next").addEventListener("click",()=>window.playerNext&&window.playerNext());
  document.getElementById("sp-prev").addEventListener("click",()=>window.playerPrev&&window.playerPrev());
  document.getElementById("sp-min").addEventListener("click",()=>{
    w.classList.toggle("mini");
    document.getElementById("sp-min").textContent=w.classList.contains("mini")?"+":"–";
    try{localStorage.setItem("lh:sp:mini",w.classList.contains("mini")?"1":"");}catch(e){}
  });
  if(localStorage.getItem("lh:sp:mini")){w.classList.add("mini");document.getElementById("sp-min").textContent="+";}
  if(st.playing)w.classList.add("is-playing");
}

/* ---------- Navbar ---------- */
function injectNav(active){
  const links=[["index.html","🏠 Inicio"],["ranking.html","🏆 Ranking"],["lp.html","📈 Evolución"],["live.html","🔴 En vivo"],["champions.html","🧙 Campeones"],["loldle.html","🎯 LoLdle"],["arena.html","🎮 Entreno"],["playlist.html","🎵 Playlist"]];
  const nav=document.createElement("nav");nav.className="navbar";
  nav.innerHTML=`<div class="nav-inner"><a class="nav-brand" href="index.html">⏳ <span>${CONFIG.groupName||"LoL Hub"}</span></a><button class="nav-toggle" aria-label="menú">☰</button><div class="nav-links">${links.map(([h,t])=>`<a href="${h}" class="${h===active?'active':''}">${t}</a>`).join("")}<a class="nav-region" href="${multiSearchUrl()}" target="_blank" rel="noopener">${region.toUpperCase()} · OP.GG</a></div></div>`;
  document.body.prepend(nav);
  const tog=nav.querySelector(".nav-toggle"),lk=nav.querySelector(".nav-links");tog.addEventListener("click",()=>lk.classList.toggle("open"));
  setTimeout(()=>{initPlayer();if(active==="index.html")initSidePlayer();},50);S
}
/* Partículas hero */
function initFX(){const c=document.getElementById("fx");if(!c)return;const ctx=c.getContext("2d");let w,h,parts;
  function resize(){w=c.width=c.offsetWidth;h=c.height=c.offsetHeight;parts=Array.from({length:Math.min(70,Math.floor(w/18))},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.8+.4,vy:-(Math.random()*.4+.1),a:Math.random()*.5+.2,col:Math.random()>.5?"200,170,110":"10,200,185"}));}
  resize();window.addEventListener("resize",resize);
  (function loop(){ctx.clearRect(0,0,w,h);parts.forEach(p=>{p.y+=p.vy;if(p.y<-5){p.y=h+5;p.x=Math.random()*w;}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fillStyle=`rgba(${p.col},${p.a})`;ctx.shadowBlur=8;ctx.shadowColor=`rgba(${p.col},${p.a})`;ctx.fill();});requestAnimationFrame(loop);})();
}
