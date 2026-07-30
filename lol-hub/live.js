/* live.js — partidas EN VIVO (muestra el nombre real del dueño de la cuenta) */
let liveTimer=null;
const MAPS={11:"Grieta del Invocador",12:"Abismo Aullador",21:"Nexus Blitz",30:"Arena"};
async function loadLive(){
  const grid=document.getElementById("live-grid");const hint=document.getElementById("hint");hint.textContent="Comprobando…";
  const results=await Promise.all(ACCOUNTS.map(async acc=>{const p=parseId(acc.riotId);
    try{const d=await cachedFetch(`/api/live?riotId=${enc(p.full)}&platform=${R.uggPlatform}`,20*1000);return{acc,p,d};}
    catch(e){return{acc,p,d:{inGame:false,error:(e&&e.data&&e.data.error)||"error"}};}}));
  const playing=results.filter(r=>r.d&&r.d.inGame);
  const people=[...new Set(playing.map(r=>r.acc.owner))];
  hint.textContent=playing.length?`🔴 ${people.length} ${people.length===1?"persona":"personas"} en partida (${playing.length} cuenta${playing.length>1?"s":""})`:"Nadie aparece en partida ahora mismo";
  await Promise.all(playing.map(async({p})=>{try{const s=await cachedFetch(`/api/summoner?riotId=${enc(p.full)}&platform=${R.uggPlatform}&mastery=0`,8*60*1000);STATS[p.full]=s;}catch(e){}}));
  let html="";
  if(playing.length){
    html+=`<div class="live-cards">`+playing.map(({acc,p,d})=>{
      const me=d.participants.find(x=>x.isMe)||{};const meChamp=champByNum(me.championId);
      const blue=d.participants.filter(x=>x.teamId===100),red=d.participants.filter(x=>x.teamId===200);
      const st=STATS[p.full]||{};const rk=st.solo?`${TIER_ES[st.solo.tier]||st.solo.tier} ${st.solo.rank} · ${st.solo.lp} LP`:(st.flex?`Flex: ${TIER_ES[st.flex.tier]} ${st.flex.rank}`:"Sin clasificar");
      const rkColor=st.solo?(TIER_COLORS[st.solo.tier]||"var(--gold)"):"var(--text-dim)";
      const row=x=>{const c=champByNum(x.championId);const icon=c?champIcon(c.id):"";
        const nick=(x.riotId||'').split('#')[0];
        const mate=ACCOUNTS.find(a=>parseId(a.riotId).name.toLowerCase()===nick.toLowerCase());
        const lbl=mate?`${nick} <small style="color:var(--cyan)">(${mate.owner})</small>`:nick;
        return`<div class="lc-p ${x.isMe?'me':''}"><img class="lc-champ" src="${icon}" onerror="this.style.visibility='hidden'" title="${c?c.name:''}"><div class="lc-sp"><img src="${spellIcon(x.spell1)}" title="${spellName(x.spell1)}" onerror="this.style.display='none'"><img src="${spellIcon(x.spell2)}" title="${spellName(x.spell2)}" onerror="this.style.display='none'"></div>${x.keystone&&runeIcon(x.keystone)?`<img class="lc-rune" src="${runeIcon(x.keystone)}" title="${runeName(x.keystone)}" onerror="this.style.display='none'">`:`<span class="lc-rune-ph"></span>`}<span class="lc-n">${lbl}</span></div>`;};
      const bans=(d.bans||[]).map(b=>{const c=champByNum(b.championId);return c?`<img src="${champIcon(c.id)}" title="Ban: ${c.name}">`:"";}).join("");
      const splash=meChamp?splashArt(meChamp.id):"";const mapName=MAPS[d.mapId]||"";
      return`<div class="lc-card"><div class="lc-banner" style="background-image:linear-gradient(180deg,rgba(7,11,20,.3),rgba(7,11,20,.94)),url('${splash}')"><div class="lc-top"><span class="lc-live">● EN VIVO</span><span class="lc-meta">${d.queue}${mapName?` · ${mapName}`:""} · ${d.minutes}′</span></div><div class="lc-hero"><img class="lc-hero-champ" src="${meChamp?champIcon(meChamp.id):''}" onerror="this.style.display='none'"><div class="lc-hero-info"><div class="lc-hero-name">${acc.owner}</div><div class="lc-hero-champname">${p.name} · ${meChamp?meChamp.name:''} · ${acc.rol||''}</div><div class="lc-hero-rank" style="color:${rkColor};border-color:${rkColor}">${rk}</div></div></div></div>${bans?`<div class="lc-bans"><span>Baneos</span>${bans}</div>`:""}<div class="lc-teams"><div class="lc-team"><div class="lc-tt blue">🔵 Aliados</div>${blue.map(row).join("")}</div><div class="lc-vs">VS</div><div class="lc-team"><div class="lc-tt red">🔴 Enemigos</div>${red.map(row).join("")}</div></div><a class="btn primary lc-spectate" href="${urls(p).porofessor}" target="_blank" rel="noopener">👁️ Espectar en Porofessor</a></div>`;
    }).join("")+`</div>`;
  }else{html+=`<div class="live-empty"><div class="le-emoji">🔍</div><div><b>Nadie aparece en partida</b><br><small>El sistema de espectador de Riot tarda <b>1-3 min</b> en registrar una partida recién empezada. Espera un poco y pulsa 🔄.</small></div></div>`;}
  // estado agrupado por persona
  html+=`<div class="lv-status"><div class="lv-status-t">Estado de comprobación</div><div class="lv-status-grid">${PEOPLE.map(pe=>{
    const accs=results.filter(r=>r.acc.owner===pe.person);
    const inGame=accs.filter(r=>r.d.inGame);
    const st=inGame.length?`<span class="st-live">🔴 ${parseId(inGame[0].acc.riotId).name}</span>`:(accs.some(r=>r.d.error)?`<span class="st-err">⚠️ error</span>`:`<span class="st-off">⚫ Libre</span>`);
    return `<div class="lv-st-row"><span>${pe.person}</span>${st}</div>`;}).join("")}</div></div>`;
  grid.innerHTML=html;
}
function schedule(){if(liveTimer)clearInterval(liveTimer);liveTimer=setInterval(()=>{Object.keys(localStorage).filter(k=>k.startsWith("lh:/api/live")).forEach(k=>localStorage.removeItem(k));loadLive();},45000);}
(async function(){injectNav("live.html");initFX();await loadDDragon();await loadLive();schedule();
  document.getElementById("refresh").addEventListener("click",()=>{Object.keys(localStorage).filter(k=>k.startsWith("lh:/api/live")).forEach(k=>localStorage.removeItem(k));loadLive();schedule();});})();
