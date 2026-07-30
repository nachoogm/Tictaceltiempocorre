/* loldle.js — Columnas del LoLdle original + selector por PERSONA */
(function injectCSS(){
  if(document.getElementById("ld-critical"))return;
  const s=document.createElement("style");s.id="ld-critical";
  s.textContent=`
  .ld-who select{background:#0c1220;border:1px solid #243450;color:#f5ecd8;padding:7px 10px;border-radius:8px;font-size:13px;cursor:pointer;outline:none}
  .ld-who select:focus{border-color:#c8aa6e}
  .ld-head,.ld-row{display:grid;grid-template-columns:1.5fr 1fr 1.2fr 1.1fr 1.1fr 1.1fr 1.2fr .9fr;gap:6px;align-items:center}
  .ld-head{padding:12px 14px;font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;color:#6b7a8f;border-bottom:1px solid #243450;background:#0c1220;text-align:center}
  .ld-head span:first-child{text-align:left}
  .ld-cell{text-align:center;font-size:11.5px;font-weight:600;padding:8px 4px;border-radius:8px;min-height:46px;display:flex;align-items:center;justify-content:center;gap:4px;line-height:1.25}
  .ld-cell.g{background:#2fd074;color:#06210f}.ld-cell.y{background:#e6b84f;color:#2a1e00}.ld-cell.r{background:#ff6060;color:#2a0505}
  .ld-cell b{font-size:15px}
  .ld-board{max-width:520px;margin:26px auto 0}
  .ld-board-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:12px}
  .ld-board-head h2{color:#f5ecd8;font-size:18px}
  #ld-board-sub{color:#6b7a8f;font-size:12px}
  .ld-board-body{background:linear-gradient(180deg,#17243a,#111a2b);border:1px solid #4e3d18;border-radius:14px;overflow:hidden}
  .ld-bd-row{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid rgba(36,52,80,.5)}
  .ld-bd-row:last-child{border-bottom:none}
  .ld-bd-row.top{background:linear-gradient(90deg,rgba(240,208,96,.1),transparent)}
  .ld-bd-pos{font-size:16px;font-weight:800;width:28px;text-align:center;color:#6b7a8f}
  .ld-bd-row.top .ld-bd-pos{color:#f0d060}
  .ld-bd-ava{width:34px;height:34px;border-radius:8px;border:2px solid #c8aa6e;background:#0c1220}
  .ld-bd-name{font-weight:700;color:#f5ecd8;flex:1}
  .ld-bd-score{font-weight:800;color:#3ee0d4;font-size:14px}
  @media(max-width:760px){
    .ld-head{display:none}
    .ld-row{grid-template-columns:1fr 1fr 1fr;gap:5px;padding:10px}
    .ld-champ{grid-column:1 / -1;margin-bottom:4px}
    .ld-cell{min-height:52px;font-size:11px;position:relative;padding-top:14px}
    .ld-cell::before{content:attr(data-lbl);position:absolute;top:3px;left:0;right:0;font-size:8px;opacity:.65;text-transform:uppercase}
  }`;
  document.head.appendChild(s);
})();
/* género/especie/región/año vienen de loldle-data.js (metaOf) */
function resourceOf(c){const p=(c.partype||"").trim();const map={"Mana":"Maná","Energy":"Energía","None":"Sin recurso","Blood Well":"Pozo de sangre","Rage":"Furia","Fury":"Furia","Heat":"Calor","Ferocity":"Ferocidad","Flow":"Flujo","Shield":"Escudo","Health":"Vida","Grit":"Determinación","Crimson Rush":"Sangre","Bloodthirst":"Sed de sangre","Courage":"Coraje","Suffering":"Sufrimiento"};return map[p]||p||"Sin recurso";}
function rangeOf(c){return (c.stats&&c.stats.attackrange>=275)?"A distancia":"Cuerpo a cuerpo";}
let POOL=[],target=null,mode="classic",daily=true,guessedIds=new Set(),finished=false;
function ldToday(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function seededPick(arr,salt){const d=new Date();let seed=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()+(salt||0);return arr[seed%arr.length];}
function ldPlayer(){const s=document.getElementById("ld-player");return s?s.value:"";}
async function initLoldle(){
  injectNav("loldle.html");initFX();
  const sel=document.getElementById("ld-player");
  sel.innerHTML=`<option value="">— tu nombre —</option>`+PEOPLE.map(p=>`<option value="${p.person}">${p.person}</option>`).join("");
  const saved=localStorage.getItem("lh:ld:me")||localStorage.getItem("lh:arena:me");if(saved)sel.value=saved;
  sel.addEventListener("change",()=>localStorage.setItem("lh:ld:me",sel.value));
  document.querySelectorAll(".ld-modes .rk-tab").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
  document.getElementById("daily-chk").addEventListener("change",e=>{daily=e.target.checked;updateBoardVisibility();newGame();});
  setupInput();
  await loadDDragon();POOL=CHAMPIONS.slice();
  updateBoardVisibility();newGame();refreshBoard();
}
function updateBoardVisibility(){const b=document.getElementById("ld-board");if(b)b.style.display=(mode==="classic"&&daily)?"block":"none";}
function setMode(m){mode=m;document.querySelectorAll(".ld-modes .rk-tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===m));document.getElementById("mode-lbl").textContent={classic:"Clásico",ability:"Habilidad",quote:"Cita / Lore",emoji:"Emoji",splash:"Splash"}[m];const cl=mode==="classic";document.getElementById("ld-legend").style.display=cl?"flex":"none";document.getElementById("ld-table").style.display=cl?"block":"none";updateBoardVisibility();newGame();if(cl&&daily)refreshBoard();}
async function newGame(){guessedIds=new Set();finished=false;document.getElementById("ld-rows").innerHTML="";document.getElementById("ld-result").innerHTML="";const inp=document.getElementById("guess");inp.value="";inp.disabled=false;const salt={classic:0,ability:1,quote:2,emoji:3,splash:4}[mode];if(!POOL.length)return;target=daily?seededPick(POOL,salt):POOL[Math.floor(Math.random()*POOL.length)];updateStats();await renderClue();}
function updateStats(){document.getElementById("ld-stats").textContent=`${guessedIds.size} intento${guessedIds.size===1?"":"s"}`;}
const EMOJIS={Ahri:"🦊💗🔮",Akshan:"🔫🦅😎",Amumu:"🧟😭🩹",Annie:"👧🐻🔥",Ashe:"🏹❄️👑",Aatrox:"😈⚔️🩸",Bard:"🎵🔔✨",Blitzcrank:"🤖🪝⚡",Braum:"🧔❄️🛡️",Caitlyn:"🔫🎩🕵️",Darius:"🪓💪🩸",Draven:"🪓😎🔥",Ekko:"⏰🔨⚡",Evelynn:"😈💋🖤",Ezreal:"✨🏹💎",Fiora:"🤺💃🌹",Fizz:"🐟🔱🦈",Galio:"🗿🛡️😇",Gangplank:"🏴‍☠️🍊💣",Garen:"⚔️🌀💪",Gnar:"🦖🪃😡",Graves:"🚬🔫💥",Gwen:"✂️🧵👻",Illaoi:"🐙💪⚓",Janna:"🌪️👼🛡️",Jax:"🔦💪🗡️",Jhin:"🎭🔫4️⃣",Jinx:"💣🔫🐱",Kaisa:"🐛👾🔫",Karthus:"💀🎵⚰️",Katarina:"🔪🌀🩸",Kayn:"🌑🗡️👹",Khazix:"🦗🔪🌑",Kindred:"🐺🐑🏹",LeeSin:"🦯👊🐉",Leona:"☀️🛡️⚔️",Lulu:"🧚🐛✨",Lux:"💡🌟🔮",Malphite:"🪨🗿💥",MasterYi:"🗡️⚡🧘",MissFortune:"🔫💃👒",Mordekaiser:"⚰️🤘🔨",Naafiri:"🐕‍🦺🗡️🌵",Nami:"🌊🐟🔱",Nasus:"🐕🏜️⏳",Nautilus:"⚓🌊🤿",Nunu:"❄️☃️🐻",Orianna:"⚙️🤖🔮",Poppy:"🔨🛡️👧",Pyke:"🔱💀🌊",Rammus:"🦔🛡️🌀",Renekton:"🐊🪓🩸",Rengar:"🦁🔪🌿",Riven:"⚔️💔🗡️",Sett:"👊🥊💪",Shaco:"🃏🔪😈",Sona:"🎶🎻💙",Soraka:"🍌⭐💫",Syndra:"🔮🌑⚡",Teemo:"🍄🐹💣",Thresh:"🏮⛓️💀",Tristana:"💥🔫🐹",TwistedFate:"🃏🎴✨",Twitch:"🐀🏹🦠",Urgot:"🦿🔫💀",Vayne:"🏹🌙🦇",Veigar:"🎩🟣😈",Vi:"👊🥊💥",Viego:"👑💔⚔️",Vladimir:"🧛🩸🖤",Volibear:"🐻⚡🌩️",Warwick:"🐺🩸🦴",MonkeyKing:"🐒🪄🍌",Xayah:"🪶🏹❤️",Yasuo:"🍃⚔️🌪️",Yone:"👺⚔️🍃",Yorick:"⚰️🪦👨‍🌾",Yuumi:"🐱📖💗",Zac:"🟢🫧💥",Zed:"🥷🌑🗡️",Ziggs:"💣🧨💥",Zoe:"⭐😜🌈",Zyra:"🌱🌹🌿"};
const CLASS_EMOJI={Fighter:"⚔️💪🛡️",Tank:"🛡️🪨💪",Mage:"🔮✨🌟",Assassin:"🗡️🥷🌑",Marksman:"🏹🎯💥",Support:"💗✨🛡️"};
function emojisFor(c){return EMOJIS[c.id]||CLASS_EMOJI[(c.tags||[])[0]]||"❓❓❓";}
async function renderClue(){const clue=document.getElementById("ld-clue");if(mode==="classic"){clue.style.display="none";return;}clue.style.display="block";
  if(mode==="ability"){clue.innerHTML=`<div class="ld-clue-inner"><div class="ld-clue-t">✨ ¿De qué campeón es esta habilidad?</div><div class="mh-empty">Cargando…</div></div>`;
    try{const det=await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/data/es_ES/champion/${target.id}.json`).then(r=>r.json());const cd=det.data[target.id];const pool=[{img:`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/passive/${cd.passive.image.full}`,key:"Pasiva",name:cd.passive.name}].concat(cd.spells.map((s,i)=>({img:`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/spell/${s.image.full}`,key:["Q","W","E","R"][i],name:s.name})));const pick=pool[Math.floor((daily?(new Date().getDate()):Math.random()*pool.length))%pool.length];clue.innerHTML=`<div class="ld-clue-inner"><div class="ld-clue-t">✨ ¿De qué campeón es esta habilidad?</div><img class="ld-ability" src="${pick.img}"><div class="ld-ability-key">${pick.key} · <span>${pick.name}</span></div></div>`;}catch(e){clue.innerHTML=`<div class="ld-clue-inner"><div class="mh-empty">No se pudo cargar</div></div>`;}}
  else if(mode==="quote"){let txt=(target.blurb||"").replace(/\s+/g," ").trim();[target.name,target.name.split(" ")[0]].forEach(w=>{if(w)txt=txt.replace(new RegExp(w,"gi"),"█████");});if(txt.length>320)txt=txt.slice(0,320)+"…";clue.innerHTML=`<div class="ld-clue-inner"><div class="ld-clue-t">📜 ¿Quién es? (lore)</div><div class="ld-quote">“${txt||"Sin descripción."}”</div></div>`;}
  else if(mode==="emoji"){clue.innerHTML=`<div class="ld-clue-inner"><div class="ld-clue-t">😜 ¿Qué campeón representan estos emojis?</div><div class="ld-emoji">${emojisFor(target)}</div></div>`;}
  else if(mode==="splash"){const seed=daily?new Date().getDate():Math.floor(Math.random()*100);const px=20+((seed*37)%60),py=20+((seed*53)%60);clue.innerHTML=`<div class="ld-clue-inner"><div class="ld-clue-t">🖼️ ¿De qué campeón es este trozo de splash?</div><div class="ld-splash" style="background-image:url('${splashArt(target.id)}');background-size:280%;background-position:${px}% ${py}%"></div></div>`;}
}
function setupInput(){const inp=document.getElementById("guess"),sug=document.getElementById("suggest");
  inp.addEventListener("input",()=>{const q=inp.value.trim().toLowerCase();if(!q){sug.innerHTML="";return;}const list=POOL.filter(c=>c.name.toLowerCase().includes(q)&&!guessedIds.has(c.id)).slice(0,6);sug.innerHTML=list.map(c=>`<div class="sug-item" data-id="${c.id}"><img src="${champIcon(c.id)}"> ${c.name}</div>`).join("");sug.querySelectorAll(".sug-item").forEach(el=>el.addEventListener("click",()=>{submitGuess(el.dataset.id);inp.value="";sug.innerHTML="";}));});
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"){const q=inp.value.trim().toLowerCase();const first=POOL.find(c=>c.name.toLowerCase()===q)||POOL.find(c=>c.name.toLowerCase().includes(q)&&!guessedIds.has(c.id));if(first){submitGuess(first.id);inp.value="";sug.innerHTML="";}}});}
function cell(val,state,lbl,arrow){return `<span class="ld-cell ${state}" data-lbl="${lbl||""}">${val}${arrow?` <b>${arrow}</b>`:""}</span>`;}
function listState(a,b){const same=a.length===b.length&&a.every(x=>b.includes(x));if(same)return "g";return a.some(x=>b.includes(x))?"y":"r";}
function submitGuess(id){
  if(finished||guessedIds.has(id))return;const g=CHAMP_BY_ID[id];if(!g)return;guessedIds.add(id);updateStats();
  if(mode!=="classic"){const ok=g.id===target.id;const row=document.createElement("div");row.className="ld-simple "+(ok?"win":"bad");row.innerHTML=`<img src="${champIcon(g.id)}"><b>${g.name}</b><span>${ok?"✅ ¡Correcto!":"❌ No es"}</span>`;document.getElementById("ld-rows").prepend(row);document.getElementById("ld-table").style.display="block";if(ok)win();return;}
  const gm=metaOf(g.id), tm=metaOf(target.id);
  const gPos=lanesOf(g), tPos=lanesOf(target);
  const gRes=resourceOf(g), tRes=resourceOf(target);
  const gRan=rangeOf(g),   tRan=rangeOf(target);
  const arrowYear = gm.yr===tm.yr ? "" : (tm.yr>gm.yr ? "⬆️" : "⬇️");
  const row=document.createElement("div");row.className="ld-row"+(g.id===target.id?" win":"");
  row.innerHTML=
    `<span class="ld-champ"><img src="${champIcon(g.id)}"><b>${g.name}</b></span>`+
    cell(gm.g, gm.g===tm.g?"g":"r", "Género")+
    cell(gPos.join(", "), listState(gPos,tPos), "Posición")+
    cell(gm.sp, gm.sp===tm.sp?"g":"r", "Especie")+
    cell(gRes, gRes===tRes?"g":"r", "Recurso")+
    cell(gRan, gRan===tRan?"g":"r", "Gama")+
    cell(gm.rg.join(", "), listState(gm.rg,tm.rg), "Región")+
    cell(gm.yr, gm.yr===tm.yr?"g":"r", "Año", arrowYear);
  document.getElementById("ld-rows").prepend(row);
  if(g.id===target.id)win();
}
async function win(){
  finished=true;document.getElementById("guess").disabled=true;const intentos=guessedIds.size;
  document.getElementById("ld-result").innerHTML=`<div class="ld-win"><img src="${champIcon(target.id)}"><div><div class="ld-win-t">¡Correcto! 🎉</div><div class="ld-win-s">Era <b>${target.name}</b> · en ${intentos} intento${intentos===1?"":"s"}</div></div><button class="btn primary" onclick="newGame()">Jugar otra</button></div>`;
  toast(`¡${target.name}! 🎉`);
  if(mode==="classic"&&daily){const name=ldPlayer();
    if(name){await submitDaily(name,intentos);await refreshBoard();}
    else{const s=document.getElementById("ld-board-sub");if(s)s.textContent="👆 Elige tu nombre arriba para aparecer en la clasificación";}}
}
window.newGame=newGame;
function boardToday(){return "loldle_"+ldToday();}
async function submitDaily(name,intentos){try{await fetch("/api/scores",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({board:boardToday(),name,score:intentos,lower:true})});}catch(e){}}
async function refreshBoard(){
  const body=document.getElementById("ld-board-body");if(!body)return;
  let list=null,shared=false;
  try{const r=await fetch(`/api/scores?board=${boardToday()}`);const d=await r.json();if(r.ok&&d.configured){list=d.scores||[];shared=true;}}catch(e){}
  const sub=document.getElementById("ld-board-sub");
  if(sub)sub.textContent=shared?"Quién lo saca en menos intentos · compartido con el grupo":"Modo local (Storage no disponible)";
  if(!list||!list.length){body.innerHTML=`<div class="mh-empty">Nadie ha resuelto el reto de hoy todavía. ¡Sé el primero! 🎯</div>`;return;}
  body.innerHTML=list.map((r,i)=>{const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`;const pe=personByName(r.name);const iconId=safeIcon(pe?pe.icon:"Poro");
    return `<div class="ld-bd-row ${i===0?'top':''}"><span class="ld-bd-pos">${medal}</span><img class="ld-bd-ava" src="${champIcon(iconId)}" onerror="this.style.visibility='hidden'"><span class="ld-bd-name">${r.name}</span><span class="ld-bd-score">${r.score} intento${r.score===1?"":"s"}</span></div>`;}).join("");
}
document.addEventListener("DOMContentLoaded",initLoldle);
