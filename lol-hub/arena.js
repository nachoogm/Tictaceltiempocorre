/* arena.js — 4 minijuegos + RANKING COMPARTIDO (/api/scores)
   FIX: CSS crítico inyectado desde JS (el campo SIEMPRE tiene tamaño),
        coordenadas limitadas al área, canvas con tamaño real. */
(function injectCSS(){
  if(document.getElementById("ar-critical"))return;
  const s=document.createElement("style");s.id="ar-critical";
  s.textContent=`
  .ar-arena{position:relative}
  .ar-field{position:absolute;inset:0;z-index:1;width:100%;height:100%}
  .ar-overlay{z-index:5}
  .ar-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
  .ar-target{position:absolute;border-radius:12px;cursor:pointer}
  .ar-target img{width:100%;height:100%;border-radius:12px;border:2px solid #c8aa6e;box-shadow:0 0 16px rgba(200,170,110,.5);display:block;user-select:none}
  .rx-box{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;user-select:none;transition:background .1s}
  .ar-who{display:flex;flex-direction:column;gap:2px}
  .ar-who select{background:#0c1220;border:1px solid #243450;color:#f5ecd8;padding:6px 10px;border-radius:8px;font-size:13px;cursor:pointer}
  .ar-rank{max-width:760px;margin:30px auto;padding:0 16px}
  .ar-rank-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:14px}
  .ar-rank-head h2{color:#f5ecd8;font-size:20px}
  .ar-rank-sub{color:#6b7a8f;font-size:13px}
  .ar-rank-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
  .ar-rank-body{background:linear-gradient(180deg,#17243a,#111a2b);border:1px solid #4e3d18;border-radius:14px;overflow:hidden}
  .ar-rk-row{display:flex;align-items:center;gap:14px;padding:11px 18px;border-bottom:1px solid rgba(36,52,80,.5)}
  .ar-rk-row:last-child{border-bottom:none}
  .ar-rk-row.top{background:linear-gradient(90deg,rgba(240,208,96,.1),transparent)}
  .ar-rk-pos{font-size:18px;font-weight:800;width:30px;text-align:center;color:#6b7a8f}
  .ar-rk-row.top .ar-rk-pos{color:#f0d060}
  .ar-rk-ava{width:38px;height:38px;border-radius:9px;border:2px solid #c8aa6e;background:#0c1220}
  .ar-rk-name{font-weight:700;color:#f5ecd8;flex:1}
  .ar-rk-score{font-weight:800;color:#3ee0d4;font-size:15px}`;
  document.head.appendChild(s);
})();

let mode="aim",running=false,raf=null,tickTimer=null,spawnTimer=null;
let score=0,misses=0,timeLeft=30,champPool=[];
const $=id=>document.getElementById(id);
const arena=()=>$("arena");
function field(){let f=$("ar-field");if(!f){f=document.createElement("div");f.className="ar-field";f.id="ar-field";arena().insertBefore(f,arena().firstChild);}return f;}
/* tamaño real del área de juego (con fallback a la arena) */
function areaSize(){const f=field();let r=f.getBoundingClientRect();if(r.height<40||r.width<40)r=arena().getBoundingClientRect();return{w:Math.max(200,r.width),h:Math.max(200,r.height)};}
const MODES={aim:{label:"🎯 Puntería",unit:"pts",lower:false},dodge:{label:"💨 Esquiva",unit:"s",lower:false,div:1000,dec:1},dodgeshoot:{label:"🔫 Esquiva y dispara",unit:"pts",lower:false},reaction:{label:"⚡ Reacción",unit:"ms",lower:true}};
function fmt(m,v){const M=MODES[m];if(M.div)return (v/M.div).toFixed(M.dec||0);return String(v);}
const boardOf=m=>"arena_"+m;
/* récord personal */
function bestKey(m){return "lh:arena:best:"+m;}
function getBest(m){const v=localStorage.getItem(bestKey(m));return v==null?null:+v;}
function setLocalBest(m,v){const b=getBest(m);const better=b==null||(MODES[m].lower?v<b:v>b);if(better){localStorage.setItem(bestKey(m),v);return true;}return false;}
function showBest(){const b=getBest(mode);$("ar-best").textContent=b!=null?`🏆 Tu récord: ${fmt(mode,b)} ${MODES[mode].unit}`:"Sin marca aún";}
/* ranking compartido */
let SCORES_OK=false;
async function submitScore(m,name,value){
  if(!name)return;
  try{const r=await fetch("/api/scores",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({board:boardOf(m),name,score:value,lower:MODES[m].lower})});if(r.ok)SCORES_OK=true;}catch(e){}
  saveLocalRank(m,name,value);
}
function localRankKey(m){return "lh:arena:rank:"+m;}
function getLocalRank(m){try{return JSON.parse(localStorage.getItem(localRankKey(m))||"[]");}catch(e){return [];}}
function saveLocalRank(m,name,v){const M=MODES[m];let list=getLocalRank(m);const i=list.findIndex(r=>r.name===name);if(i<0)list.push({name,score:v});else{const better=M.lower?v<list[i].score:v>list[i].score;if(better)list[i].score=v;}list.sort((a,b)=>M.lower?a.score-b.score:b.score-a.score);localStorage.setItem(localRankKey(m),JSON.stringify(list));}
async function fetchRank(m){
  try{const r=await fetch(`/api/scores?board=${boardOf(m)}`);const d=await r.json();if(r.ok&&d.configured){SCORES_OK=true;return d.scores||[];}}catch(e){}
  return getLocalRank(m);
}
/* HUD */
function currentPlayer(){const s=$("ar-player");return s?s.value:"";}
function resetHud(){score=0;misses=0;$("ar-score").textContent="0";
  if(mode==="reaction"){$("ar-time").textContent="—";$("ar-extra-lbl").textContent="Ronda";$("ar-extra").textContent="0/5";}
  else if(mode==="aim"){$("ar-time").textContent="30";$("ar-extra-lbl").textContent="Precisión";$("ar-extra").textContent="100%";}
  else if(mode==="dodge"){$("ar-time").textContent="0.0";$("ar-extra-lbl").textContent="Esquivadas";$("ar-extra").textContent="0";}
  else{$("ar-time").textContent="0.0";$("ar-extra-lbl").textContent="Enemigos";$("ar-extra").textContent="0";}}
function showOverlay(v){$("ar-overlay").style.display=v?"flex":"none";}
function clearField(){const f=field();f.innerHTML="";cv=null;ctx=null;}
function setOverlay(title,desc,btn){
  const inner=$("ar-ov-inner");
  inner.innerHTML=`<div class="ar-ov-title">${title}</div><div class="ar-ov-desc">${desc}</div><button class="btn primary" id="ar-play">${btn}</button>`;
  $("ar-play").addEventListener("click",start);
}
function setMode(m){
  if(running)stop();
  mode=m;
  document.querySelectorAll(".ar-modes .rk-tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===m));
  const desc={aim:"Clica los campeones lo más rápido que puedas antes de que desaparezcan. ¡30 segundos!",dodge:"Mueve el ratón esquivando las habilidades. Aguanta lo máximo sin que te toquen.",dodgeshoot:"Esquiva los skillshots MORADOS Y clica los enemigos ROJOS para dispararles. ¡A la vez!",reaction:"Espera a que la arena se ponga VERDE y clica lo más rápido posible. 5 rondas."}[m];
  setOverlay(MODES[m].label,desc,"▶ Jugar");
  arena().className="ar-arena";clearField();resetHud();showOverlay(true);showBest();
}
/* PUNTERÍA */
function startAim(){
  running=true;score=0;misses=0;timeLeft=30;resetHud();showOverlay(false);
  clearField();arena().classList.add("aim-mode");
  const f=field();
  f._miss=e=>{if(e.target.closest(".ar-target"))return;misses++;updateAcc();};
  f.addEventListener("pointerdown",f._miss);
  tickTimer=setInterval(()=>{timeLeft-=0.1;if(timeLeft<=0){$("ar-time").textContent="0.0";endAim();return;}$("ar-time").textContent=timeLeft.toFixed(1);},100);
  scheduleSpawn();
}
function scheduleSpawn(){if(!running)return;spawnChamp();spawnTimer=setTimeout(scheduleSpawn,Math.max(360,820-(30-timeLeft)*14));}
function spawnChamp(){
  const f=field();const {w,h}=areaSize();
  const size=Math.max(44,Math.min(72,w/12));
  // coordenadas SIEMPRE dentro del área (clamp a 0 como mínimo)
  const x=Math.max(0,Math.random()*Math.max(0,w-size));
  const y=Math.max(0,Math.random()*Math.max(0,h-size));
  const c=champPool[Math.floor(Math.random()*champPool.length)]||{id:"Poro"};
  const t=document.createElement("div");t.className="ar-target spawn";
  t.style.cssText=`position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px`;
  t.innerHTML=`<img src="${champIcon(c.id)}" draggable="false">`;
  const life=setTimeout(()=>{t.classList.add("gone");setTimeout(()=>t.remove(),150);},Math.max(700,1200-(30-timeLeft)*18));
  t.addEventListener("pointerdown",e=>{e.stopPropagation();clearTimeout(life);score++;$("ar-score").textContent=score;updateAcc();t.classList.add("hit");setTimeout(()=>t.remove(),150);});
  f.appendChild(t);
}
function updateAcc(){const total=score+misses;$("ar-extra").textContent=(total?Math.round(score/total*100):100)+"%";}
function endAim(){
  running=false;clearInterval(tickTimer);clearTimeout(spawnTimer);
  const f=field();if(f._miss)f.removeEventListener("pointerdown",f._miss);
  clearField();
  const acc=(score+misses)?Math.round(score/(score+misses)*100):100;
  finish(score,`⏱️ ¡Tiempo!`,`Has acertado <b>${score}</b> campeones con <b>${acc}%</b> de precisión.`);
}
/* ESQUIVA / ESQUIVA Y DISPARA */
let cv=null,ctx=null,W=0,H=0,mouse={x:0,y:0,in:false},shots=[],enemies=[],dodged=0,elapsed=0,spawnAcc=0,enemyAcc=0,lastT=0;
function buildCanvas(){
  clearField();
  const {w,h}=areaSize();
  cv=document.createElement("canvas");cv.className="ar-canvas";
  cv.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block";
  cv.width=w;cv.height=h;W=w;H=h;                 // tamaño REAL garantizado
  field().appendChild(cv);ctx=cv.getContext("2d");
  const move=e=>{const r=cv.getBoundingClientRect();const cx=(e.touches?e.touches[0].clientX:e.clientX),cy=(e.touches?e.touches[0].clientY:e.clientY);mouse.x=(cx-r.left)*(W/r.width);mouse.y=(cy-r.top)*(H/r.height);mouse.in=true;};
  cv.addEventListener("pointermove",move);
  cv.addEventListener("touchmove",e=>{move(e);e.preventDefault();},{passive:false});
  cv.addEventListener("pointerleave",()=>mouse.in=false);
  cv.addEventListener("pointerdown",e=>{
    if(mode!=="dodgeshoot"||!running)return;
    const r=cv.getBoundingClientRect();const mx=(e.clientX-r.left)*(W/r.width),my=(e.clientY-r.top)*(H/r.height);
    for(let i=enemies.length-1;i>=0;i--){const en=enemies[i];const dx=en.x-mx,dy=en.y-my;if(dx*dx+dy*dy<(en.r+8)*(en.r+8)){enemies.splice(i,1);score++;$("ar-score").textContent=score;$("ar-extra").textContent=score;break;}}
  });
}
function resizeCanvas(){if(!cv)return;const {w,h}=areaSize();cv.width=W=w;cv.height=H=h;}
function startDodge(){
  running=true;shots=[];enemies=[];dodged=0;score=0;elapsed=0;spawnAcc=0;enemyAcc=0;lastT=performance.now();
  resetHud();showOverlay(false);
  arena().classList.add(mode==="dodgeshoot"?"shoot-mode":"dodge-mode");
  buildCanvas();mouse.x=W/2;mouse.y=H/2;mouse.in=true;
  raf=requestAnimationFrame(dodgeLoop);
}
function spawnShot(){const side=Math.floor(Math.random()*4);let x,y;if(side===0){x=Math.random()*W;y=-20;}else if(side===1){x=W+20;y=Math.random()*H;}else if(side===2){x=Math.random()*W;y=H+20;}else{x=-20;y=Math.random()*H;}const tx=mouse.x+(Math.random()-0.5)*120,ty=mouse.y+(Math.random()-0.5)*120;const ang=Math.atan2(ty-y,tx-x);const speed=2.6+Math.min(4,elapsed/8);const r=9+Math.random()*7;shots.push({x,y,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,r,counted:false});}
function spawnEnemy(){const r=18;const x=r+Math.random()*Math.max(1,W-2*r),y=r+Math.random()*Math.max(1,H-2*r);const c=champPool[Math.floor(Math.random()*champPool.length)]||{id:"Poro"};const img=new Image();img.src=champIcon(c.id);enemies.push({x,y,r,img});}
function dodgeLoop(t){
  if(!running||!ctx)return;
  const dt=Math.min(50,t-lastT);lastT=t;elapsed+=dt/1000;$("ar-time").textContent=elapsed.toFixed(1);
  spawnAcc+=dt;if(spawnAcc>=Math.max(180,620-elapsed*22)){spawnAcc=0;spawnShot();}
  if(mode==="dodgeshoot"){enemyAcc+=dt;if(enemyAcc>=1400){enemyAcc=0;if(enemies.length<5)spawnEnemy();}}
  ctx.clearRect(0,0,W,H);
  enemies.forEach(en=>{ctx.save();ctx.beginPath();ctx.arc(en.x,en.y,en.r+3,0,7);ctx.strokeStyle="rgba(255,96,96,.95)";ctx.lineWidth=3;ctx.shadowBlur=12;ctx.shadowColor="rgba(255,96,96,.8)";ctx.stroke();ctx.closePath();ctx.beginPath();ctx.arc(en.x,en.y,en.r,0,7);ctx.clip();try{ctx.drawImage(en.img,en.x-en.r,en.y-en.r,en.r*2,en.r*2);}catch(e){}ctx.restore();});
  if(mouse.in){ctx.beginPath();ctx.arc(mouse.x,mouse.y,13,0,7);ctx.fillStyle="rgba(200,170,110,.95)";ctx.shadowBlur=18;ctx.shadowColor="rgba(200,170,110,.9)";ctx.fill();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(mouse.x,mouse.y,7,0,7);ctx.fillStyle="#fff";ctx.fill();}
  for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.x+=s.vx;s.y+=s.vy;
    if(s.x<-40||s.x>W+40||s.y<-40||s.y>H+40){if(!s.counted){dodged++;if(mode==="dodge")$("ar-extra").textContent=dodged;}shots.splice(i,1);continue;}
    if(mouse.in){const dx=s.x-mouse.x,dy=s.y-mouse.y;if(dx*dx+dy*dy<(s.r+11)*(s.r+11)){endDodge();return;}}
    ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fillStyle="rgba(200,120,255,.98)";ctx.shadowBlur=14;ctx.shadowColor="rgba(200,120,255,.9)";ctx.fill();ctx.shadowBlur=0;}
  raf=requestAnimationFrame(dodgeLoop);
}
function endDodge(){
  running=false;cancelAnimationFrame(raf);
  const secs=elapsed.toFixed(1);clearField();
  if(mode==="dodge")finish(Math.round(elapsed*1000),`💥 ¡Tocado!`,`Aguantaste <b>${secs} s</b> y esquivaste <b>${dodged}</b> habilidades.`);
  else finish(score,`💥 ¡Tocado!`,`Aguantaste <b>${secs} s</b> y disparaste a <b>${score}</b> enemigos.`);
}
/* REACCIÓN */
let rxRound=0,rxTimes=[],rxState="idle",rxStart=0,rxTimeout=null;
function startReaction(){
  running=true;rxRound=0;rxTimes=[];resetHud();showOverlay(false);
  clearField();arena().classList.add("rx-mode");
  const box=document.createElement("div");box.className="rx-box waiting";box.id="rx-box";
  box.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center";
  box.innerHTML=`<div class="rx-msg" id="rx-msg">Prepárate…</div>`;
  field().appendChild(box);
  box.addEventListener("pointerdown",()=>{
    if(rxState==="wait"){clearTimeout(rxTimeout);box.className="rx-box early";$("rx-msg").textContent="¡Demasiado pronto! 😅 Espera al verde…";rxState="idle";setTimeout(nextRound,900);}
    else if(rxState==="go"){const ms=Math.round(performance.now()-rxStart);rxTimes.push(ms);rxRound++;box.className="rx-box hit";$("rx-msg").textContent=`${ms} ms`;$("ar-extra").textContent=`${rxRound}/5`;
      if(rxRound>=5){setTimeout(endReaction,700);}else{rxState="idle";setTimeout(nextRound,700);}}
  });
  nextRound();
}
function nextRound(){
  if(!running)return;const box=$("rx-box");if(!box)return;
  box.className="rx-box waiting";$("rx-msg").textContent=`Ronda ${rxRound+1}/5 · espera al VERDE…`;rxState="wait";
  rxTimeout=setTimeout(()=>{const b=$("rx-box");if(!b)return;b.className="rx-box go";const m=$("rx-msg");if(m)m.textContent="¡YA! 🟢";rxState="go";rxStart=performance.now();},900+Math.random()*2600);
}
function endReaction(){
  running=false;
  const avg=Math.round(rxTimes.reduce((a,b)=>a+b,0)/rxTimes.length);const best=Math.min(...rxTimes);
  clearField();
  finish(avg,`⚡ ¡Terminado!`,`Media: <b>${avg} ms</b> · mejor ronda: <b>${best} ms</b><br><small>${rxTimes.join(" · ")} ms</small>`);
}
/* fin */
async function finish(value,title,html){
  const name=currentPlayer();
  const isRecLocal=setLocalBest(mode,value);showBest();
  const extra=`${isRecLocal?"<br>🏆 <b>¡Nuevo récord personal!</b>":""}${name?"":"<br><small>Elige tu nombre arriba para guardar la marca en el ranking.</small>"}`;
  setOverlay(title,html+extra,"🔁 Otra vez");showOverlay(true);
  if(name){await submitScore(mode,name,value);await refreshRank();}
}
function start(){
  if(!champPool.length)champPool=(typeof CHAMPIONS!=="undefined"&&CHAMPIONS.length)?CHAMPIONS:[{id:"Poro"}];
  if(mode==="aim")startAim();else if(mode==="reaction")startReaction();else startDodge();
}
function stop(){
  running=false;clearInterval(tickTimer);clearTimeout(spawnTimer);clearTimeout(rxTimeout);
  if(raf)cancelAnimationFrame(raf);
  const f=$("ar-field");if(f&&f._miss)f.removeEventListener("pointerdown",f._miss);
  clearField();
}
/* RANKING */
let rankView="aim";
async function refreshRank(){renderRank(await fetchRank(rankView));}
function renderRank(list){
  const body=$("ar-rank-body");if(!body)return;const M=MODES[rankView];
  if(!list||!list.length){body.innerHTML=`<div class="mh-empty">Nadie ha jugado a este modo todavía. ¡Sé el primero!</div>`;return;}
  body.innerHTML=list.map((r,i)=>{const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`;const pl=CONFIG.players.find(p=>parseId(p.riotId).name===r.name);const iconId=pl?(pl.main||"Poro").replace(/\s|'|\./g,""):"Poro";
    return `<div class="ar-rk-row ${i===0?'top':''}"><span class="ar-rk-pos">${medal}</span><img class="ar-rk-ava" src="${champIcon(iconId)}" onerror="this.style.visibility='hidden'"><span class="ar-rk-name">${r.name}</span><span class="ar-rk-score">${fmt(rankView,r.score)} ${M.unit}</span></div>`;}).join("");
}
function subText(){return (SCORES_OK?"Compartido entre el grupo · ":"Local · ")+(MODES[rankView].lower?"menor = mejor":"mayor = mejor");}
function bindRank(){
  document.querySelectorAll(".ar-rank-tabs .fb-btn").forEach(b=>b.addEventListener("click",async()=>{
    document.querySelectorAll(".ar-rank-tabs .fb-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");
    rankView=b.dataset.rk;$("ar-rank-body").innerHTML=`<div class="mh-empty">Cargando…</div>`;
    renderRank(await fetchRank(rankView));$("ar-rank-sub").textContent=subText();
  }));
}
(async function(){
  injectNav("arena.html");initFX();
  const sel=$("ar-player");sel.innerHTML=`<option value="">— elige —</option>`+CONFIG.players.map(p=>{const n=parseId(p.riotId).name;return `<option value="${n}">${n}</option>`;}).join("");
  const saved=localStorage.getItem("lh:arena:me");if(saved)sel.value=saved;
  sel.addEventListener("change",()=>localStorage.setItem("lh:arena:me",sel.value));
  document.querySelectorAll(".ar-modes .rk-tab").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
  $("ar-start").addEventListener("click",start);
  const pb=$("ar-play");if(pb)pb.addEventListener("click",start);
  window.addEventListener("resize",()=>{if(cv&&!running)resizeCanvas();});
  bindRank();setMode("aim");
  await loadDDragon();
  champPool=CHAMPIONS.length?CHAMPIONS:[{id:"Poro"}];
  renderRank(await fetchRank("aim"));$("ar-rank-sub").textContent=subText();
})();
