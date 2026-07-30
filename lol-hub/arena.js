/* arena.js — 4 minijuegos + ranking compartido por PERSONA */
(function(){if(document.getElementById("ar-critical"))return;const s=document.createElement("style");s.id="ar-critical";
s.textContent=`.ar-arena{position:relative}.ar-field{position:absolute;inset:0;z-index:1;width:100%;height:100%}
.ar-overlay{z-index:5}.ar-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.ar-target{position:absolute;border-radius:12px;cursor:pointer}
.ar-target img{width:100%;height:100%;border-radius:12px;border:2px solid #c8aa6e;box-shadow:0 0 16px rgba(200,170,110,.5);display:block;user-select:none}
.rx-box{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;user-select:none;transition:background .1s}
.ar-who{display:flex;flex-direction:column;gap:2px}
.ar-who select{background:#0c1220;border:1px solid #243450;color:#f5ecd8;padding:6px 10px;border-radius:8px;font-size:13px;cursor:pointer}
.ar-rank{max-width:760px;margin:30px auto;padding:0 16px}
.ar-rank-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.ar-rank-head h2{color:#f5ecd8;font-size:20px}.ar-rank-sub{color:#6b7a8f;font-size:13px}
.ar-rank-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.ar-rank-body{background:linear-gradient(180deg,#17243a,#111a2b);border:1px solid #4e3d18;border-radius:14px;overflow:hidden}
.ar-rk-row{display:flex;align-items:center;gap:14px;padding:11px 18px;border-bottom:1px solid rgba(36,52,80,.5)}
.ar-rk-row:last-child{border-bottom:none}.ar-rk-row.top{background:linear-gradient(90deg,rgba(240,208,96,.1),transparent)}
.ar-rk-pos{font-size:18px;font-weight:800;width:30px;text-align:center;color:#6b7a8f}.ar-rk-row.top .ar-rk-pos{color:#f0d060}
.ar-rk-ava{width:38px;height:38px;border-radius:9px;border:2px solid #c8aa6e}.ar-rk-name{font-weight:700;color:#f5ecd8;flex:1}
.ar-rk-score{font-weight:800;color:#3ee0d4;font-size:15px}`;document.head.appendChild(s);})();
let mode="aim",running=false,raf=null,tick=null,spawnT=null,score=0,misses=0,left=30,pool=[];
const $=id=>document.getElementById(id),arena=()=>$("arena");
function field(){let f=$("ar-field");if(!f){f=document.createElement("div");f.className="ar-field";f.id="ar-field";arena().insertBefore(f,arena().firstChild);}return f;}
function area(){const f=field();let r=f.getBoundingClientRect();if(r.height<40||r.width<40)r=arena().getBoundingClientRect();return{w:Math.max(200,r.width),h:Math.max(200,r.height)};}
const M={aim:{label:"🎯 Puntería",unit:"pts",lower:false},dodge:{label:"💨 Esquiva",unit:"s",lower:false,div:1000,dec:1},dodgeshoot:{label:"🔫 Esquiva y dispara",unit:"pts",lower:false},reaction:{label:"⚡ Reacción",unit:"ms",lower:true}};
const fmt=(m,v)=>M[m].div?(v/M[m].div).toFixed(M[m].dec||0):String(v);
const bKey=m=>"lh:arena:best:"+m;
const getBest=m=>{const v=localStorage.getItem(bKey(m));return v==null?null:+v;};
function setBest(m,v){const b=getBest(m);if(b==null||(M[m].lower?v<b:v>b)){localStorage.setItem(bKey(m),v);return true;}return false;}
function showBest(){const b=getBest(mode);$("ar-best").textContent=b!=null?`🏆 Tu récord: ${fmt(mode,b)} ${M[mode].unit}`:"Sin marca aún";}
let SOK=false;
async function submit(m,n,v){if(!n)return;try{const r=await fetch("/api/scores",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({board:"arena_"+m,name:n,score:v,lower:M[m].lower})});if(r.ok)SOK=true;}catch(e){}saveLocal(m,n,v);}
const lKey=m=>"lh:arena:rank:"+m;
const getLocal=m=>{try{return JSON.parse(localStorage.getItem(lKey(m))||"[]");}catch(e){return [];}};
function saveLocal(m,n,v){let l=getLocal(m);const i=l.findIndex(r=>r.name===n);
  if(i<0)l.push({name:n,score:v});else if(M[m].lower?v<l[i].score:v>l[i].score)l[i].score=v;
  l.sort((a,b)=>M[m].lower?a.score-b.score:b.score-a.score);localStorage.setItem(lKey(m),JSON.stringify(l));}
async function fetchRank(m){try{const r=await fetch("/api/scores?board=arena_"+m);const d=await r.json();if(r.ok&&d.configured){SOK=true;return d.scores||[];}}catch(e){}return getLocal(m);}
const player=()=>{const s=$("ar-player");return s?s.value:"";};
function hud(){score=0;misses=0;$("ar-score").textContent="0";
  if(mode==="reaction"){$("ar-time").textContent="—";$("ar-extra-lbl").textContent="Ronda";$("ar-extra").textContent="0/5";}
  else if(mode==="aim"){$("ar-time").textContent="30";$("ar-extra-lbl").textContent="Precisión";$("ar-extra").textContent="100%";}
  else if(mode==="dodge"){$("ar-time").textContent="0.0";$("ar-extra-lbl").textContent="Esquivadas";$("ar-extra").textContent="0";}
  else{$("ar-time").textContent="0.0";$("ar-extra-lbl").textContent="Enemigos";$("ar-extra").textContent="0";}}
const ov=v=>$("ar-overlay").style.display=v?"flex":"none";
function clear(){field().innerHTML="";cv=null;ctx=null;}
function setOv(t,d,b){$("ar-ov-inner").innerHTML=`<div class="ar-ov-title">${t}</div><div class="ar-ov-desc">${d}</div><button class="btn primary" id="ar-play">${b}</button>`;$("ar-play").addEventListener("click",start);}
function setMode(m){if(running)stop();mode=m;document.querySelectorAll(".ar-modes .rk-tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===m));
  const d={aim:"Clica los campeones lo más rápido que puedas. ¡30 segundos!",dodge:"Mueve el ratón esquivando las habilidades.",dodgeshoot:"Esquiva los MORADOS y clica los enemigos ROJOS.",reaction:"Espera al VERDE y clica. 5 rondas."}[m];
  setOv(M[m].label,d,"▶ Jugar");arena().className="ar-arena";clear();hud();ov(true);showBest();}
function startAim(){running=true;score=0;misses=0;left=30;hud();ov(false);clear();arena().classList.add("aim-mode");
  const f=field();f._m=e=>{if(e.target.closest(".ar-target"))return;misses++;acc();};f.addEventListener("pointerdown",f._m);
  tick=setInterval(()=>{left-=.1;if(left<=0){$("ar-time").textContent="0.0";endAim();return;}$("ar-time").textContent=left.toFixed(1);},100);sched();}
function sched(){if(!running)return;spawn();spawnT=setTimeout(sched,Math.max(360,820-(30-left)*14));}
function spawn(){const f=field(),{w,h}=area(),sz=Math.max(44,Math.min(72,w/12));
  const x=Math.max(0,Math.random()*Math.max(0,w-sz)),y=Math.max(0,Math.random()*Math.max(0,h-sz));
  const c=pool[Math.floor(Math.random()*pool.length)]||{id:"Poro"};
  const t=document.createElement("div");t.className="ar-target spawn";t.style.cssText=`position:absolute;left:${x}px;top:${y}px;width:${sz}px;height:${sz}px`;
  t.innerHTML=`<img src="${champIcon(c.id)}" draggable="false">`;
  const life=setTimeout(()=>{t.classList.add("gone");setTimeout(()=>t.remove(),150);},Math.max(700,1200-(30-left)*18));
  t.addEventListener("pointerdown",e=>{e.stopPropagation();clearTimeout(life);score++;$("ar-score").textContent=score;acc();t.classList.add("hit");setTimeout(()=>t.remove(),150);});
  f.appendChild(t);}
function acc(){const t=score+misses;$("ar-extra").textContent=(t?Math.round(score/t*100):100)+"%";}
function endAim(){running=false;clearInterval(tick);clearTimeout(spawnT);const f=field();if(f._m)f.removeEventListener("pointerdown",f._m);clear();
  const a=(score+misses)?Math.round(score/(score+misses)*100):100;fin(score,`⏱️ ¡Tiempo!`,`Has acertado <b>${score}</b> campeones con <b>${a}%</b> de precisión.`);}
let cv=null,ctx=null,W=0,H=0,mo={x:0,y:0,in:false},shots=[],ens=[],dod=0,el=0,sa=0,ea=0,lt=0;
function canvas(){clear();const{w,h}=area();cv=document.createElement("canvas");cv.className="ar-canvas";
  cv.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block";cv.width=w;cv.height=h;W=w;H=h;
  field().appendChild(cv);ctx=cv.getContext("2d");
  const mv=e=>{const r=cv.getBoundingClientRect();const cx=(e.touches?e.touches[0].clientX:e.clientX),cy=(e.touches?e.touches[0].clientY:e.clientY);mo.x=(cx-r.left)*(W/r.width);mo.y=(cy-r.top)*(H/r.height);mo.in=true;};
  cv.addEventListener("pointermove",mv);cv.addEventListener("touchmove",e=>{mv(e);e.preventDefault();},{passive:false});cv.addEventListener("pointerleave",()=>mo.in=false);
  cv.addEventListener("pointerdown",e=>{if(mode!=="dodgeshoot"||!running)return;const r=cv.getBoundingClientRect();
    const mx=(e.clientX-r.left)*(W/r.width),my=(e.clientY-r.top)*(H/r.height);
    for(let i=ens.length-1;i>=0;i--){const en=ens[i];const dx=en.x-mx,dy=en.y-my;if(dx*dx+dy*dy<(en.r+8)*(en.r+8)){ens.splice(i,1);score++;$("ar-score").textContent=score;$("ar-extra").textContent=score;break;}}});}
function resize(){if(!cv)return;const{w,h}=area();cv.width=W=w;cv.height=H=h;}
function startDodge(){running=true;shots=[];ens=[];dod=0;score=0;el=0;sa=0;ea=0;lt=performance.now();hud();ov(false);
  arena().classList.add(mode==="dodgeshoot"?"shoot-mode":"dodge-mode");canvas();mo.x=W/2;mo.y=H/2;mo.in=true;raf=requestAnimationFrame(loop);}
function shot(){const s=Math.floor(Math.random()*4);let x,y;
  if(s===0){x=Math.random()*W;y=-20;}else if(s===1){x=W+20;y=Math.random()*H;}else if(s===2){x=Math.random()*W;y=H+20;}else{x=-20;y=Math.random()*H;}
  const tx=mo.x+(Math.random()-.5)*120,ty=mo.y+(Math.random()-.5)*120,a=Math.atan2(ty-y,tx-x),sp=2.6+Math.min(4,el/8),r=9+Math.random()*7;
  shots.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r,c:false});}
function enemy(){const r=18,x=r+Math.random()*Math.max(1,W-2*r),y=r+Math.random()*Math.max(1,H-2*r);
  const c=pool[Math.floor(Math.random()*pool.length)]||{id:"Poro"};const img=new Image();img.src=champIcon(c.id);ens.push({x,y,r,img});}
function loop(t){if(!running||!ctx)return;const dt=Math.min(50,t-lt);lt=t;el+=dt/1000;$("ar-time").textContent=el.toFixed(1);
  sa+=dt;if(sa>=Math.max(180,620-el*22)){sa=0;shot();}
  if(mode==="dodgeshoot"){ea+=dt;if(ea>=1400){ea=0;if(ens.length<5)enemy();}}
  ctx.clearRect(0,0,W,H);
  ens.forEach(en=>{ctx.save();ctx.beginPath();ctx.arc(en.x,en.y,en.r+3,0,7);ctx.strokeStyle="rgba(255,96,96,.95)";ctx.lineWidth=3;ctx.shadowBlur=12;ctx.shadowColor="rgba(255,96,96,.8)";ctx.stroke();ctx.closePath();ctx.beginPath();ctx.arc(en.x,en.y,en.r,0,7);ctx.clip();try{ctx.drawImage(en.img,en.x-en.r,en.y-en.r,en.r*2,en.r*2);}catch(e){}ctx.restore();});
  if(mo.in){ctx.beginPath();ctx.arc(mo.x,mo.y,13,0,7);ctx.fillStyle="rgba(200,170,110,.95)";ctx.shadowBlur=18;ctx.shadowColor="rgba(200,170,110,.9)";ctx.fill();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(mo.x,mo.y,7,0,7);ctx.fillStyle="#fff";ctx.fill();}
  for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.x+=s.vx;s.y+=s.vy;
    if(s.x<-40||s.x>W+40||s.y<-40||s.y>H+40){if(!s.c){dod++;if(mode==="dodge")$("ar-extra").textContent=dod;}shots.splice(i,1);continue;}
    if(mo.in){const dx=s.x-mo.x,dy=s.y-mo.y;if(dx*dx+dy*dy<(s.r+11)*(s.r+11)){endDodge();return;}}
    ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fillStyle="rgba(200,120,255,.98)";ctx.shadowBlur=14;ctx.shadowColor="rgba(200,120,255,.9)";ctx.fill();ctx.shadowBlur=0;}
  raf=requestAnimationFrame(loop);}
function endDodge(){running=false;cancelAnimationFrame(raf);const s=el.toFixed(1);clear();
  if(mode==="dodge")fin(Math.round(el*1000),`💥 ¡Tocado!`,`Aguantaste <b>${s} s</b> y esquivaste <b>${dod}</b> habilidades.`);
  else fin(score,`💥 ¡Tocado!`,`Aguantaste <b>${s} s</b> y disparaste a <b>${score}</b> enemigos.`);}
let rr=0,rt=[],rs="idle",rst=0,rto=null;
function startRx(){running=true;rr=0;rt=[];hud();ov(false);clear();arena().classList.add("rx-mode");
  const b=document.createElement("div");b.className="rx-box waiting";b.id="rx-box";
  b.style.cssText="position:absolute;inset:0;display:flex;align-items:center;justify-content:center";
  b.innerHTML=`<div class="rx-msg" id="rx-msg">Prepárate…</div>`;field().appendChild(b);
  b.addEventListener("pointerdown",()=>{
    if(rs==="wait"){clearTimeout(rto);b.className="rx-box early";$("rx-msg").textContent="¡Demasiado pronto! 😅";rs="idle";setTimeout(next,900);}
    else if(rs==="go"){const ms=Math.round(performance.now()-rst);rt.push(ms);rr++;b.className="rx-box hit";$("rx-msg").textContent=`${ms} ms`;$("ar-extra").textContent=`${rr}/5`;
      if(rr>=5)setTimeout(endRx,700);else{rs="idle";setTimeout(next,700);}}});
  next();}
function next(){if(!running)return;const b=$("rx-box");if(!b)return;b.className="rx-box waiting";$("rx-msg").textContent=`Ronda ${rr+1}/5 · espera al VERDE…`;rs="wait";
  rto=setTimeout(()=>{const x=$("rx-box");if(!x)return;x.className="rx-box go";const m=$("rx-msg");if(m)m.textContent="¡YA! 🟢";rs="go";rst=performance.now();},900+Math.random()*2600);}
function endRx(){running=false;const a=Math.round(rt.reduce((x,y)=>x+y,0)/rt.length),b=Math.min(...rt);clear();
  fin(a,`⚡ ¡Terminado!`,`Media: <b>${a} ms</b> · mejor: <b>${b} ms</b><br><small>${rt.join(" · ")} ms</small>`);}
async function fin(v,t,h){const n=player(),rec=setBest(mode,v);showBest();
  setOv(t,h+`${rec?"<br>🏆 <b>¡Nuevo récord personal!</b>":""}${n?"":"<br><small>Elige tu nombre arriba para guardar la marca.</small>"}`,"🔁 Otra vez");ov(true);
  if(n){await submit(mode,n,v);await refresh();}}
function start(){if(!pool.length)pool=(typeof CHAMPIONS!=="undefined"&&CHAMPIONS.length)?CHAMPIONS:[{id:"Poro"}];
  if(mode==="aim")startAim();else if(mode==="reaction")startRx();else startDodge();}
function stop(){running=false;clearInterval(tick);clearTimeout(spawnT);clearTimeout(rto);if(raf)cancelAnimationFrame(raf);
  const f=$("ar-field");if(f&&f._m)f.removeEventListener("pointerdown",f._m);clear();}
let view="aim";
async function refresh(){render(await fetchRank(view));}
function render(l){const b=$("ar-rank-body");if(!b)return;
  if(!l||!l.length){b.innerHTML=`<div class="mh-empty">Nadie ha jugado a este modo. ¡Sé el primero!</div>`;return;}
  b.innerHTML=l.map((r,i)=>{const m=i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`;const pe=personByName(r.name);
    return`<div class="ar-rk-row ${i===0?'top':''}"><span class="ar-rk-pos">${m}</span><img class="ar-rk-ava" src="${champIcon(safeIcon(pe?pe.icon:"Poro"))}" onerror="this.style.visibility='hidden'"><span class="ar-rk-name">${r.name}</span><span class="ar-rk-score">${fmt(view,r.score)} ${M[view].unit}</span></div>`;}).join("");}
const subT=()=>(SOK?"Compartido entre el grupo · ":"Local · ")+(M[view].lower?"menor = mejor":"mayor = mejor");
(async function(){injectNav("arena.html");initFX();
  const sel=$("ar-player");sel.innerHTML=`<option value="">— elige —</option>`+PEOPLE.map(p=>`<option value="${p.person}">${p.person}</option>`).join("");
  const sv=localStorage.getItem("lh:arena:me");if(sv)sel.value=sv;
  sel.addEventListener("change",()=>localStorage.setItem("lh:arena:me",sel.value));
  document.querySelectorAll(".ar-modes .rk-tab").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
  $("ar-start").addEventListener("click",start);const pb=$("ar-play");if(pb)pb.addEventListener("click",start);
  document.querySelectorAll(".ar-rank-tabs .fb-btn").forEach(b=>b.addEventListener("click",async()=>{
    document.querySelectorAll(".ar-rank-tabs .fb-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");
    view=b.dataset.rk;$("ar-rank-body").innerHTML=`<div class="mh-empty">Cargando…</div>`;render(await fetchRank(view));$("ar-rank-sub").textContent=subT();}));
  window.addEventListener("resize",()=>{if(cv&&!running)resize();});
  setMode("aim");await loadDDragon({items:false});pool=CHAMPIONS.length?CHAMPIONS:[{id:"Poro"}];
  render(await fetchRank("aim"));$("ar-rank-sub").textContent=subT();})();
