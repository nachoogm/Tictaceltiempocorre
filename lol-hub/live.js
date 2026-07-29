/* live.js — partidas EN VIVO de todos los jugadores (spectator-v5)
   Respeta el cuello de botella: caché 30s + limitador de concurrencia (heredado de common.js) */
const POS_LIVE={TOP:"Top",JUNGLE:"Jungla",MIDDLE:"Mid",BOTTOM:"ADC",UTILITY:"Support"};

async function loadLive(){
  const grid=document.getElementById("live-grid"); const hint=document.getElementById("hint");
  grid.innerHTML=`<div class="mh-empty">Buscando partidas en vivo…</div>`;
  const results=await Promise.all(CONFIG.players.map(async raw=>{
    const p=parseId(raw.riotId);
    try{ const d=await cachedFetch(`/api/live?riotId=${enc(p.full)}&platform=${R.uggPlatform}`,30*1000); return {raw,p,d}; }
    catch(e){ return {raw,p,d:{inGame:false,error:true}}; }
  }));
  const playing=results.filter(r=>r.d&&r.d.inGame);
  hint.textContent = playing.length ? `🔴 ${playing.length} en partida ahora` : "Nadie está jugando ahora mismo 🎮";
  if(!playing.length){ grid.innerHTML=`<div class="live-empty"><div class="le-emoji">😴</div><div>Ninguno del grupo está en partida.<br><small>Vuelve cuando alguien esté farmeando.</small></div></div>`; return; }

  grid.innerHTML=playing.map(({raw,p,d})=>{
    const blue=d.participants.filter(x=>x.teamId===100), red=d.participants.filter(x=>x.teamId===200);
    const chip=x=>{const c=CHAMP_BY_ID_byKeyNum(x.championId);const icon=c?champIcon(c.id):"";return `<div class="lv-p ${x.isMe?'me':''}" title="${x.riotId}"><img src="${icon}" onerror="this.style.visibility='hidden'"><div class="lv-sp"><img src="${spellIcon(x.spell1)}" onerror="this.style.display='none'"><img src="${spellIcon(x.spell2)}" onerror="this.style.display='none'"></div><span>${(x.riotId||'').split('#')[0]}</span></div>`;};
    const bans=(d.bans||[]).map(b=>{const c=CHAMP_BY_ID_byKeyNum(b.championId);return c?`<img src="${champIcon(c.id)}" title="Ban: ${c.name}">`:"";}).join("");
    const poro=urls(p).porofessor;
    return `<div class="lv-card">
      <div class="lv-head"><span class="lv-live">● EN VIVO</span><b>${p.name}</b><span class="lv-q">${d.queue} · ${d.minutes}′</span></div>
      ${bans?`<div class="lv-bans">🚫 ${bans}</div>`:""}
      <div class="lv-teams">
        <div class="lv-team blue"><div class="lv-tt">🔵 Equipo Azul</div>${blue.map(chip).join("")}</div>
        <div class="lv-team red"><div class="lv-tt">🔴 Equipo Rojo</div>${red.map(chip).join("")}</div>
      </div>
      <a class="btn primary lv-spectate" href="${poro}" target="_blank" rel="noopener">👁️ Espectar en Porofessor</a>
    </div>`;
  }).join("");
}

(async function(){
  injectNav("live.html"); initFX(); await loadDDragon(); await loadLive();
  document.getElementById("refresh").addEventListener("click",()=>{ // fuerza recarga limpiando caché live
    Object.keys(localStorage).filter(k=>k.startsWith("lh:/api/live")).forEach(k=>localStorage.removeItem(k)); loadLive();
  });
})();
