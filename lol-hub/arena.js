/* =====================================================================
   arena.js — Sala de Entrenamiento (2 minijuegos, 100% local)
   · Puntería: clica campeones que aparecen (30s) — mide aciertos y precisión
   · Esquiva: mueve el ratón esquivando skillshots — mide segundos aguantados
   Récords guardados en localStorage. No usa la Riot API.
   ===================================================================== */
let mode="aim", running=false, raf=null, tickTimer=null;
let score=0, misses=0, timeLeft=30, startTs=0;
let champPool=[];

const $=id=>document.getElementById(id);
const arena=()=>$("arena");
function best(key){return +(localStorage.getItem("lh:arena:"+key)||0);}
function setBest(key,v){if(v>best(key))localStorage.setItem("lh:arena:"+key,v);}
function showBest(){const b=$("ar-best");if(mode==="aim")b.textContent=`🏆 Récord: ${best("aim")} pts`;else b.textContent=`🏆 Récord: ${(best("dodge")/1000).toFixed(1)} s`;}

function setMode(m){
  if(running)stop();
  mode=m;
  document.querySelectorAll(".ar-modes .rk-tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===m));
  const desc=$("ar-ov-desc"),title=$("ar-ov-inner").querySelector(".ar-ov-title"),tip=$("ar-tip");
  const eLbl=$("ar-extra-lbl");
  if(m==="aim"){title.textContent="🎯 Modo Puntería";desc.textContent="Clica los campeones lo más rápido que puedas antes de que desaparezcan. ¡30 segundos!";eLbl.textContent="Precisión";tip.textContent="💡 Cada campeón acertado suma. Si fallas el clic en el vacío, baja tu precisión.";}
  else{title.textContent="💨 Modo Esquiva";desc.textContent="Mueve el ratón por la arena esquivando las habilidades. Aguanta lo máximo posible sin que te toquen.";eLbl.textContent="Esquivadas";tip.textContent="💡 Mueve el ratón dentro de la arena. Cada skillshot esquivado suma. ¡Un toque y game over!";}
  resetHud();showOverlay(true);showBest();
}
function resetHud(){score=0;misses=0;$("ar-score").textContent="0";$("ar-time").textContent=mode==="aim"?"30":"0.0";$("ar-extra").textContent=mode==="aim"?"100%":"0";}
function showOverlay(v){$("ar-overlay").style.display=v?"flex":"none";}

/* ---------- PUNTERÍA ---------- */
let aimTimer=null, spawnTimer=null, targets=[];
function startAim(){
  running=true;score=0;misses=0;timeLeft=30;resetHud();showOverlay(false);
  const a=arena();a.querySelectorAll(".ar-target").forEach(t=>t.remove());targets=[];
  a.classList.add("aim-mode");a.classList.remove("dodge-mode");
  // clics al vacío = fallo (precisión)
  a._miss=e=>{if(e.target.closest(".ar-target"))return;misses++;updateAcc();};
  a.addEventListener("pointerdown",a._miss);
  tickTimer=setInterval(()=>{timeLeft-=0.1;if(timeLeft<=0){$("ar-time").textContent="0.0";endAim();return;}$("ar-time").textContent=timeLeft.toFixed(1);},100);
  scheduleSpawn();
}
function scheduleSpawn(){
  if(!running)return;
  spawn();
  const delay=Math.max(360, 820 - (30-timeLeft)*14); // acelera con el tiempo
  spawnTimer=setTimeout(scheduleSpawn, delay);
}
function spawn(){
  const a=arena();const rect=a.getBoundingClientRect();
  const size=Math.max(44, Math.min(72, rect.width/12));
  const x=Math.random()*(rect.width-size), y=Math.random()*(rect.height-size);
  const c=champPool[Math.floor(Math.random()*champPool.length)];
  const t=document.createElement("div");t.className="ar-target spawn";
  t.style.cssText=`left:${x}px;top:${y}px;width:${size}px;height:${size}px`;
  t.innerHTML=`<img src="${champIcon(c.id)}" draggable="false">`;
  const life=setTimeout(()=>{t.classList.add("gone");setTimeout(()=>t.remove(),150);},Math.max(700,1200-(30-timeLeft)*18));
  t.addEventListener("pointerdown",e=>{e.stopPropagation();clearTimeout(life);score++;$("ar-score").textContent=score;updateAcc();
    t.classList.add("hit");setTimeout(()=>t.remove(),150);});
  a.appendChild(t);
}
function updateAcc(){const total=score+misses;const acc=total?Math.round(score/total*100):100;$("ar-extra").textContent=acc+"%";}
function endAim(){
  running=false;clearInterval(tickTimer);clearTimeout(spawnTimer);
  const a=arena();a.removeEventListener("pointerdown",a._miss);a.querySelectorAll(".ar-target").forEach(t=>t.remove());
  setBest("aim",score);showBest();
  const acc=(score+misses)?Math.round(score/(score+misses)*100):100;
  overlayResult(`⏱️ ¡Tiempo!`,`Has acertado <b>${score}</b> campeones con <b>${acc}%</b> de precisión.${score>=best("aim")&&score>0?" <br>🏆 ¡Nuevo récord!":""}`);
}

/* ---------- ESQUIVA (canvas) ---------- */
let cv=null,ctx=null,W=0,H=0,mouse={x:0,y:0,in:false},shots=[],dodged=0,elapsed=0,spawnAcc=0,lastT=0;
function ensureCanvas(){
  if(cv)return;
  cv=document.createElement("canvas");cv.className="ar-canvas";arena().appendChild(cv);
  ctx=cv.getContext("2d");
  const move=e=>{const r=cv.getBoundingClientRect();const cx=(e.touches?e.touches[0].clientX:e.clientX),cy=(e.touches?e.touches[0].clientY:e.clientY);mouse.x=cx-r.left;mouse.y=cy-r.top;mouse.in=true;};
  cv.addEventListener("pointermove",move);cv.addEventListener("touchmove",e=>{move(e);e.preventDefault();},{passive:false});
  cv.addEventListener("pointerleave",()=>mouse.in=false);
}
function resizeCanvas(){const r=arena().getBoundingClientRect();W=cv.width=r.width;H=cv.height=r.height;}
function startDodge(){
  ensureCanvas();resizeCanvas();
  running=true;shots=[];dodged=0;elapsed=0;spawnAcc=0;lastT=performance.now();
  mouse.x=W/2;mouse.y=H/2;
  resetHud();showOverlay(false);
  arena().classList.add("dodge-mode");arena().classList.remove("aim-mode");
  raf=requestAnimationFrame(dodgeLoop);
}
function spawnShot(){
  // aparece desde un borde apuntando hacia el ratón con algo de dispersión
  const side=Math.floor(Math.random()*4);let x,y;
  if(side===0){x=Math.random()*W;y=-20;}else if(side===1){x=W+20;y=Math.random()*H;}
  else if(side===2){x=Math.random()*W;y=H+20;}else{x=-20;y=Math.random()*H;}
  const tx=mouse.x+(Math.random()-0.5)*120, ty=mouse.y+(Math.random()-0.5)*120;
  const ang=Math.atan2(ty-y,tx-x);
  const speed=2.6+Math.min(4,elapsed/8);
  const r=9+Math.random()*7;
  const hue=Math.random()>.5?"10,200,185":"200,120,255";
  shots.push({x,y,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,r,hue,counted:false});
}
function dodgeLoop(t){
  if(!running)return;
  const dt=Math.min(50,t-lastT);lastT=t;elapsed+=dt/1000;
  $("ar-time").textContent=elapsed.toFixed(1);
  // spawn rate sube con el tiempo
  spawnAcc+=dt;const interval=Math.max(180,620-elapsed*22);
  if(spawnAcc>=interval){spawnAcc=0;spawnShot();}
  ctx.clearRect(0,0,W,H);
  // rastro/glow del cursor (tu campeón)
  if(mouse.in){ctx.beginPath();ctx.arc(mouse.x,mouse.y,13,0,7);ctx.fillStyle="rgba(200,170,110,.9)";ctx.shadowBlur=18;ctx.shadowColor="rgba(200,170,110,.9)";ctx.fill();ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(mouse.x,mouse.y,7,0,7);ctx.fillStyle="#fff";ctx.fill();}
  for(let i=shots.length-1;i>=0;i--){
    const s=shots[i];s.x+=s.vx;s.y+=s.vy;
    // fuera de pantalla -> esquivado
    if(s.x<-40||s.x>W+40||s.y<-40||s.y>H+40){if(!s.counted){dodged++;$("ar-extra").textContent=dodged;}shots.splice(i,1);continue;}
    // colisión con cursor
    if(mouse.in){const dx=s.x-mouse.x,dy=s.y-mouse.y;if(dx*dx+dy*dy<(s.r+11)*(s.r+11)){endDodge();return;}}
    ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fillStyle=`rgba(${s.hue},.95)`;ctx.shadowBlur=14;ctx.shadowColor=`rgba(${s.hue},.9)`;ctx.fill();ctx.shadowBlur=0;
  }
  raf=requestAnimationFrame(dodgeLoop);
}
function endDodge(){
  running=false;cancelAnimationFrame(raf);
  const ms=Math.round(elapsed*1000);setBest("dodge",ms);showBest();
  const rec=ms>=best("dodge")&&ms>0;
  overlayResult(`💥 ¡Tocado!`,`Has aguantado <b>${elapsed.toFixed(1)} s</b> y esquivado <b>${dodged}</b> habilidades.${rec?" <br>🏆 ¡Nuevo récord!":""}`);
  // limpiar canvas tras un momento
  setTimeout(()=>{if(ctx)ctx.clearRect(0,0,W,H);},50);
}

/* ---------- overlay resultado ---------- */
function overlayResult(title,html){
  const inner=$("ar-ov-inner");
  inner.innerHTML=`<div class="ar-ov-title">${title}</div><div class="ar-ov-desc">${html}</div><button class="btn primary" id="ar-play">🔁 Otra vez</button>`;
  $("ar-play").addEventListener("click",start);
  showOverlay(true);
}
function start(){if(mode==="aim")startAim();else startDodge();}
function stop(){running=false;clearInterval(tickTimer);clearTimeout(spawnTimer);if(raf)cancelAnimationFrame(raf);const a=arena();if(a._miss)a.removeEventListener("pointerdown",a._miss);a.querySelectorAll(".ar-target").forEach(t=>t.remove());if(ctx)ctx.clearRect(0,0,W,H);}

(async function(){
  injectNav("arena.html");initFX();await loadDDragon();
  champPool=CHAMPIONS.length?CHAMPIONS:[{id:"Poro"}];
  document.querySelectorAll(".ar-modes .rk-tab").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
  $("ar-start").addEventListener("click",start);
  $("ar-play").addEventListener("click",start);
  window.addEventListener("resize",()=>{if(cv&&mode==="dodge"&&!running)resizeCanvas();});
  setMode("aim");
})();
