/* live.js — usa el endpoint BATCH */
let liveTimer=null;
const MAPS={11:"Grieta del Invocador",12:"Abismo Aullador",21:"Nexus Blitz",30:"Arena"};
function paintLive(players){
  const grid=document.getElementById("live-grid"),hint=document.getElementById("hint");
  const byId={};(players||[]).forEach(p=>byId[p.riotId]=p);
  const playing=(players||[]).filter(p=>p&&p.inGame);
  const people=[...new Set(playing.map(p=>(ACCOUNTS.find(a=>a.riotId===p.riotId)||{}).owner).filter(Boolean))];
  hint.textContent=playing.length?`🔴 ${people.length} ${people.length===1?"persona":"personas"} en partida (${playing.length} cuenta${playing.length>1?"s":""})`:"Nadie aparece en partida ahora mismo";
  let html="";
  if(playing.length){
    html+=`<div class="live-cards">`+playing.map(d=>{
      const acc=ACCOUNTS.find(a=>a.riotId===d.riotId)||{};const p=parseId(d.riotId);
      const me=(d.participants||[]).find(x=>x.isMe)||{};const meChamp=champByNum(me.championId);
      const blue=(d.participants||[]).filter(x=>x.teamId===100),red=(d.participants||[]).filter(x=>x.teamId===200);
      const st=STATS[d.riotId]||{};
      const rk=st.solo?`${TIER_ES[st.solo.tier]} ${st.solo.rank} · ${st.solo.lp} LP`:"Sin clasificar";
      const rc=st.solo?(TIER_COLORS[st.solo.tier]||"var(--gold)"):"var(--text-dim)";
      const row=x=>{const c=champByNum(x.championId);const nick=(x.riotId||'').split('#')[0];
        const mate=ACCOUNTS.find(a=>parseId(a.riotId).name.toLowerCase()===nick.toLowerCase());
        const lbl=mate?`${nick} <small style="color:var(--cyan)">(${mate.owner})</small>`:nick;
        return`<div class="lc-p ${x.isMe?'me':''}"><img class="lc-champ" src="${c?champIcon(c.id):''}" loading="lazy" onerror="this.style.visibility='hidden'" title="${c?c.name:''}"><div class="lc-sp"><img src="${spellIcon(x.spell1)}" title="${spellName(x.spell1)}"><img src="${spellIcon(x.spell2)}" title="${spellName(x.spell2)}"></div>${x.keystone&&runeIcon(x.keystone)?`<img class="lc-rune" src="${runeIcon(x.keystone)}" title="${runeName(x.keystone)}">`:`<span class="lc-rune-ph"></span>`}<span class="lc-n">${lbl}</span></div>`;};
      const bans=(d.bans||[]).map(b=>{const c=champByNum(b.championId);return c?`<img src="${champIcon(c.id)}" title="Ban: ${c.name}">`:"";}).join("");
      const splash=meChamp?splashArt(meChamp.id):"";const mn=MAPS[d.mapId]||"";
      return`<div class="lc-card"><div class="lc-banner" style="background-image:linear-gradient(180deg,rgba(7,11,20,.3),rgba(7,11,20,.94)),url('${splash}')"><div class="lc-top"><span class="lc-live">● EN VIVO</span><span class="lc-meta">${d.queue}${mn?` · ${mn}`:""} · ${d.minutes}′</span></div><div class="lc-hero"><img class="lc-hero-champ" src="${meChamp?champIcon(meChamp.id):''}" onerror="this.style.display='none'"><div class="lc-hero-info"><div class="lc-hero-name">${acc.owner||p.name}</div><div class="lc-hero-champname">${p.name} · ${meChamp?meChamp.name:''} · ${acc.rol||''}</div><div class="lc-hero-rank" style="color:${rc};border-color:${rc}">${rk}</div></div></div></div>${bans?`<div class="lc-bans"><span>Baneos</span>${bans}</div>`:""}<div class="lc-teams"><div class="lc-team"><div class="lc-tt blue">🔵 Aliados</div>${blue.map(row).join("")}</div><div class="lc-vs">VS</div><div class="lc-team"><div class="lc-tt red">🔴 Enemigos</div>${red.map(row).join("")}</div></div><a class="btn primary lc-spectate" href="${urls(p).porofessor}" target="_blank" rel="noopener">👁️ Espectar en Porofessor</a></div>`;
    }).join("")+`</div>`;
  }else html+=`<div class="live-empty"><div class="le-emoji">🔍</div><div><b>Nadie aparece en partida</b><br><small>El espectador de Riot tarda <b>1-3 min</b> en registrar una partida recién empezada.</small></div></div>`;
  html+=`<div class="lv-status"><div class="lv-status-t">Estado por persona</div><div class="lv-status-grid">${PEOPLE.map(pe=>{
    const accs=ACCOUNTS.filter(a=>a.owner===pe.person);
    const ing=accs.map(a=>byId[a.riotId]).filter(x=>x&&x.inGame);
    const st=ing.length?`<span class="st-live">🔴 ${parseId(ing[0].riotId).name}</span>`:`<span class="st-off">⚫ Libre</span>`;
    return `<div class="lv-st-row"><span>${pe.person}</span>${st}</div>`;}).join("")}</div></div>`;
  grid.innerHTML=html;
}
async function loadLive(fresh){
  try{const d=await batch("live",{fresh,onUpdate:x=>paintLive(x.players)});paintLive(d.players);}
  catch(e){document.getElementById("hint").textContent="Error consultando el estado";}
}
(async function(){injectNav("live.html");initFX();await loadDDragon({items:false});
  loadLiveStats();await loadLive();
  liveTimer=setInterval(()=>loadLive(true),45000);
  document.getElementById("refresh").addEventListener("click",()=>loadLive(true));})();
