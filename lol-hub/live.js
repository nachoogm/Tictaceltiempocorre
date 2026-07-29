/* live.js — partidas EN VIVO (spectator-v5). Caché 20s + limitador (common.js) + auto-refresh */
let liveTimer=null;
async function loadLive(){
  const grid=document.getElementById("live-grid");const hint=document.getElementById("hint");
  hint.textContent="Comprobando…";
  const results=await Promise.all(CONFIG.players.map(async raw=>{const p=parseId(raw.riotId);
    try{const d=await cachedFetch(`/api/live?riotId=${enc(p.full)}&platform=${R.uggPlatform}`,20*1000);return{raw,p,d};}
    catch(e){return{raw,p,d:{inGame:false,error:(e&&e.data&&e.data.error)||"error"}};}}));
  const playing=results.filter(r=>r.d&&r.d.inGame);
  const errored=results.filter(r=>r.d&&r.d.error);
  hint.textContent=playing.length?`🔴 ${playing.length} en partida ahora`:"Nadie aparece en partida ahora mismo";

  let html="";
  if(playing.length){
    html+=playing.map(({raw,p,d})=>{
      const blue=d.participants.filter(x=>x.teamId===100),red=d.participants.filter(x=>x.teamId===200);
      const chip=x=>{const c=champByNum(x.championId);const icon=c?champIcon(c.id):"";return`<div class="lv-p ${x.isMe?'me':''}" title="${x.riotId}"><img src="${icon}" onerror="this.style.visibility='hidden'"><div class="lv-sp"><img src="${spellIcon(x.spell1)}" title="${spellName(x.spell1)}" onerror="this.style.display='none'"><img src="${spellIcon(x.spell2)}" title="${spellName(x.spell2)}" onerror="this.style.display='none'"></div><span>${(x.riotId||'').split('#')[0]}</span></div>`;};
      const bans=(d.bans||[]).map(b=>{const c=champByNum(b.championId);return c?`<img src="${champIcon(c.id)}" title="Ban: ${c.name}">`:"";}).join("");
      return`<div class="lv-card"><div class="lv-head"><span class="lv-live">● EN VIVO</span><b>${p.name}</b><span class="lv-q">${d.queue} · ${d.minutes}′</span></div>${bans?`<div class="lv-bans">🚫 ${bans}</div>`:""}<div class="lv-teams"><div class="lv-team blue"><div class="lv-tt">🔵 Equipo Azul</div>${blue.map(chip).join("")}</div><div class="lv-team red"><div class="lv-tt">🔴 Equipo Rojo</div>${red.map(chip).join("")}</div></div><a class="btn primary lv-spectate" href="${urls(p).porofessor}" target="_blank" rel="noopener">👁️ Espectar en Porofessor</a></div>`;
    }).join("");
  }else{
    html+=`<div class="live-empty"><div class="le-emoji">🔍</div><div><b>Nadie aparece en partida</b><br><small>Ojo: el sistema de espectador de Riot tarda <b>1-3 minutos</b> en registrar una partida recién empezada. Si acaban de entrar en cola, espera un poco y pulsa 🔄 Actualizar.</small></div></div>`;
  }
  // estado por jugador (transparencia: ves que sí se está comprobando)
  html+=`<div class="lv-status"><div class="lv-status-t">Estado de comprobación</div><div class="lv-status-grid">${results.map(({raw,p,d})=>{
    const st=d.inGame?`<span class="st-live">🔴 En partida</span>`:(d.error?`<span class="st-err">⚠️ ${d.error}</span>`:`<span class="st-off">⚫ Libre</span>`);
    return `<div class="lv-st-row"><span>${p.name}</span>${st}</div>`;}).join("")}</div></div>`;
  grid.innerHTML=html;
}
function schedule(){if(liveTimer)clearInterval(liveTimer);liveTimer=setInterval(()=>{Object.keys(localStorage).filter(k=>k.startsWith("lh:/api/live")).forEach(k=>localStorage.removeItem(k));loadLive();},45000);}
(async function(){injectNav("live.html");initFX();await loadDDragon();await loadLive();schedule();
  document.getElementById("refresh").addEventListener("click",()=>{Object.keys(localStorage).filter(k=>k.startsWith("lh:/api/live")).forEach(k=>localStorage.removeItem(k));loadLive();schedule();});})();
