/* loldle.js — 5 modos + selector de jugador + RANKING DIARIO COMPARTIDO (/api/scores)
   CSS crítico inyectado desde JS (no depende de editar styles.css). */
(function injectCSS(){
  if(document.getElementById("ld-critical"))return;
  const s=document.createElement("style");s.id="ld-critical";
  s.textContent=`
  .ld-who select{background:#0c1220;border:1px solid #243450;color:#f5ecd8;padding:7px 10px;border-radius:8px;font-size:13px;cursor:pointer;outline:none}
  .ld-who select:focus{border-color:#c8aa6e}
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
  .ld-bd-score{font-weight:800;color:#3ee0d4;font-size:14px}`;
  document.head.appendChild(s);
})();

const FEMALE=new Set(["Ahri","Akali","Anivia","Annie","Ashe","Aurora","Belveth","Briar","Caitlyn","Camille","Cassiopeia","Diana","Elise","Evelynn","Fiora","Gwen","Illaoi","Irelia","Janna","Jinx","Kaisa","Kalista","Karma","Katarina","Kayle","Kindred","Leblanc","Leona","Lillia","Lissandra","Lulu","Lux","Mel","MissFortune","Morgana","Naafiri","Nami","Neeko","Nidalee","Nilah","Orianna","Poppy","Qiyana","Quinn","Rell","Renata","Riven","Samira","Sejuani","Senna","Seraphine","Shyvana","Sivir","Sona","Soraka","Syndra","Taliyah","Tristana","Vayne","Vex","Vi","Xayah","Yunara","Yuumi","Zeri","Zoe","Zyra"]);
const OTHER=new Set(["Kindred","Maokai","Ivern","Zac","Skarner","Rammus","Khazix","Chogath","Belveth","Malzahar","Fiddlesticks","Amumu","AurelionSol","Naafiri"]);
function genderOf(id){if(OTHER.has(id))return "Otro";if(FEMALE.has(id))return "Femenino";return "Masculino";}
function rangeOf(c){return (c.stats&&c.stats.attackrange>=275)?"A distancia":"Cuerpo a cuerpo";}
function damageOf(c){const a=(c.info&&c.info.attack)||0,m=(c.info&&c.info.magic)||0;if(Math.abs(a-m)<=1)return "Híbrido";return a>m?"Físico (AD)":"Mágico (AP)";}
function resourceOf(c){const p=(c.partype||"").trim();const map={"Mana":"Maná","Energy":"Energía","None":"Sin recurso","Blood Well":"Pozo de sangre","Rage":"Furia","Fury":"Furia","Heat":"Calor","Ferocity":"Ferocidad","Flow":"Flujo","Shield":"Escudo","Health":"Vida","Grit":"Determinación","Crimson Rush":"Sangre","Bloodthirst":"Sed de sangre","Courage":"Coraje"};return map[p]||p||"—";}
const CLS_ES={Fighter:"Luchador",Tank:"Tanque",Mage:"Mago",Assassin:"Asesino",Marksman:"Tirador",Support:"Soporte"};
function classesOf(c){return (c.tags||[]).map(t=>CLS_ES[t]||t);}
const EMOJIS={Ahri:"🦊💗🔮",Akshan:"🔫🦅😎",Amumu:"🧟😭🩹",Anivia:"🐦‍⬛❄️🥚",Annie:"👧🐻🔥",Ashe:"🏹❄️👑",Aatrox:"😈⚔️🩸",Bard:"🎵🔔✨",Blitzcrank:"🤖🪝⚡",Brand:"🔥🧟🌋",Braum:"🧔❄️🛡️",Caitlyn:"🔫🎩🕵️",Camille:"🦵🔪💼",Chogath:"👹🦷🍽️",Darius:"🪓💪🩸",Diana:"🌙⚔️🌑",Draven:"🪓😎🔥",Ekko:"⏰🔨⚡",Evelynn:"😈💋🖤",Ezreal:"✨🏹💎",Fiddlesticks:"🌾😱🐦‍⬛",Fiora:"🤺💃🌹",Fizz:"🐟🔱🦈",Galio:"🗿🛡️😇",Gangplank:"🏴‍☠️🍊💣",Garen:"⚔️🌀💪",Gnar:"🦖🪃😡",Graves:"🚬🔫💥",Gwen:"✂️🧵👻",Hecarim:"🐴💀👻",Heimerdinger:"🔬🐢💡",Illaoi:"🐙💪⚓",Irelia:"⚔️🗡️🌸",Janna:"🌪️👼🛡️",Jax:"🔦💪🗡️",Jhin:"🎭🔫4️⃣",Jinx:"💣🔫🐱",Kaisa:"🐛👾🔫",Karma:"🌸📿✨",Karthus:"💀🎵⚰️",Katarina:"🔪🌀🩸",Kayle:"👼⚔️😇",Kayn:"🌑🗡️👹",Kennen:"⚡🐿️🌩️",Khazix:"🦗🔪🌑",Kindred:"🐺🐑🏹",Leblanc:"🃏🌹🪞",LeeSin:"🦯👊🐉",Leona:"☀️🛡️⚔️",Lulu:"🧚🐛✨",Lux:"💡🌟🔮",Malphite:"🪨🗿💥",MasterYi:"🗡️⚡🧘",MissFortune:"🔫💃👒",Mordekaiser:"⚰️🤘🔨",Morgana:"😈🖤⛓️",Nami:"🌊🐟🔱",Nasus:"🐕🏜️⏳",Nautilus:"⚓🌊🤿",Nidalee:"🐆🏹🌿",Nunu:"❄️☃️🐻",Orianna:"⚙️🤖🔮",Pantheon:"🛡️🌟⚔️",Poppy:"🔨🛡️👧",Pyke:"🔱💀🌊",Qiyana:"💎🌿👑",Rammus:"🦔🛡️🌀",Renekton:"🐊🪓🩸",Rengar:"🦁🔪🌿",Riven:"⚔️💔🗡️",Ryze:"🧙📜🔵",Samira:"🔫🌹💃",Sett:"👊🥊💪",Shaco:"🃏🔪😈",Shen:"🗡️👁️🥷",Sona:"🎶🎻💙",Soraka:"🍌⭐💫",Sylas:"⛓️💪🔮",Syndra:"🔮🌑⚡",Tahmkench:"🐸👅🎩",Taric:"💎💪✨",Teemo:"🍄🐹💣",Thresh:"🏮⛓️💀",Tristana:"💥🔫🐹",Tryndamere:"⚔️😡💪",TwistedFate:"🃏🎴✨",Twitch:"🐀🏹🦠",Udyr:"🐻🐯🦅",Urgot:"🦿🔫💀",Varus:"🏹🖤💜",Vayne:"🏹🌙🦇",Veigar:"🎩🟣😈",Vi:"👊🥊💥",Viego:"👑💔⚔️",Viktor:"🤖⚙️🔮",Vladimir:"🧛🩸🖤",Volibear:"🐻⚡🌩️",Warwick:"🐺🩸🦴",MonkeyKing:"🐒🪄🍌",Xayah:"🪶🏹❤️",Yasuo:"🍃⚔️🌪️",Yone:"👺⚔️🍃",Yorick:"⚰️🪦👨‍🌾",Yuumi:"🐱📖💗",Zac:"🟢🫧💥",Zed:"🥷🌑🗡️",Zeri:"⚡🔫💙",Ziggs:"💣🧨💥",Zoe:"⭐😜🌈",Zyra:"🌱🌹🌿"};
const CLASS_EMOJI={Fighter:"⚔️💪🛡️",Tank:"🛡️🪨💪",Mage:"🔮✨🌟",Assassin:"🗡️🥷🌑",Marksman:"🏹🎯💥",Support:"💗✨🛡️"};
function emojisFor(c){return EMOJIS[c.id]||CLASS_EMOJI[(c.tags||[])[0]]||"❓❓❓";}
let POOL=[],target=null,mode="classic",daily=true,guessedIds=new Set(),finished=false;
function ldToday(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function seededPick(arr,salt){const d=new Date();let seed=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()+(salt||0);return arr[seed%arr.length];}
function ldPlayer(){const s=document.getElementById("ld-player");return s?s.value:"";}

async function initLoldle(){
  injectNav("loldle.html");initFX();
  // selector de jugador (antes de cargar DDragon, para que esté disponible ya)
  const sel=document.getElementById("ld-player");
  sel.innerHTML=`<option value="">— tu nombre —</option>`+CONFIG.players.map(p=>{const n=parseId(p.riotId).name;return `<option value="${n}">${n}</option>`;}).join("");
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
function cell(val,state,arrow){return `<span class="ld-cell ${state}">${val}${arrow?` <b>${arrow}</b>`:""}</span>`;}
function submitGuess(id){if(finished||guessedIds.has(id))return;const g=CHAMP_BY_ID[id];if(!g)return;guessedIds.add(id);updateStats();
  if(mode!=="classic"){const ok=g.id===target.id;const row=document.createElement("div");row.className="ld-simple "+(ok?"win":"bad");row.innerHTML=`<img src="${champIcon(g.id)}"><b>${g.name}</b><span>${ok?"✅ ¡Correcto!":"❌ No es"}</span>`;document.getElementById("ld-rows").prepend(row);document.getElementById("ld-table").style.display="block";if(ok)win();return;}
  const gG=genderOf(g.id),tG=genderOf(target.id),gC=classesOf(g),tC=classesOf(target),gR=resourceOf(g),tR=resourceOf(target),gRa=rangeOf(g),tRa=rangeOf(target),gD=damageOf(g),tD=damageOf(target),gDi=(g.info&&g.info.difficulty)||0,tDi=(target.info&&target.info.difficulty)||0,gL=g.name.length,tL=target.name.length;
  const same=gC.length===tC.length&&gC.every(c=>tC.includes(c)),ov=gC.some(c=>tC.includes(c)),cs=same?"g":(ov?"y":"r");
  const row=document.createElement("div");row.className="ld-row"+(g.id===target.id?" win":"");
  row.innerHTML=`<span class="ld-champ"><img src="${champIcon(g.id)}"><b>${g.name}</b></span>${cell(gG,gG===tG?"g":"r")}${cell(gC.join(", ")||"—",cs)}${cell(gR,gR===tR?"g":"r")}${cell(gRa,gRa===tRa?"g":"r")}${cell(gD,gD===tD?"g":"r")}${cell(gDi,gDi===tDi?"g":"r",gDi===tDi?"":(tDi>gDi?"⬆️":"⬇️"))}${cell(gL,gL===tL?"g":"r",gL===tL?"":(tL>gL?"⬆️":"⬇️"))}`;
  document.getElementById("ld-rows").prepend(row);if(g.id===target.id)win();}
async function win(){
  finished=true;document.getElementById("guess").disabled=true;const intentos=guessedIds.size;
  document.getElementById("ld-result").innerHTML=`<div class="ld-win"><img src="${champIcon(target.id)}"><div><div class="ld-win-t">¡Correcto! 🎉</div><div class="ld-win-s">Era <b>${target.name}</b> · en ${intentos} intento${intentos===1?"":"s"}</div></div><button class="btn primary" onclick="newGame()">Jugar otra</button></div>`;
  toast(`¡${target.name}! 🎉`);
  if(mode==="classic"&&daily){const name=ldPlayer();
    if(name){await submitDaily(name,intentos);await refreshBoard();}
    else{const s=document.getElementById("ld-board-sub");if(s)s.textContent="👆 Elige tu nombre arriba para aparecer en la clasificación";}}
}
window.newGame=newGame;
/* ranking diario compartido */
function boardToday(){return "loldle_"+ldToday();}
async function submitDaily(name,intentos){try{await fetch("/api/scores",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({board:boardToday(),name,score:intentos,lower:true})});}catch(e){}}
async function refreshBoard(){
  const body=document.getElementById("ld-board-body");if(!body)return;
  let list=null,shared=false;
  try{const r=await fetch(`/api/scores?board=${boardToday()}`);const d=await r.json();if(r.ok&&d.configured){list=d.scores||[];shared=true;}}catch(e){}
  const sub=document.getElementById("ld-board-sub");
  if(sub)sub.textContent=shared?"Quién lo saca en menos intentos · compartido con el grupo":"Modo local (Storage no disponible)";
  if(!list||!list.length){body.innerHTML=`<div class="mh-empty">Nadie ha resuelto el reto de hoy todavía. ¡Sé el primero! 🎯</div>`;return;}
  body.innerHTML=list.map((r,i)=>{const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`;const pl=CONFIG.players.find(p=>parseId(p.riotId).name===r.name);const iconId=pl?(pl.main||"Poro").replace(/\s|'|\./g,""):"Poro";
    return `<div class="ld-bd-row ${i===0?'top':''}"><span class="ld-bd-pos">${medal}</span><img class="ld-bd-ava" src="${champIcon(iconId)}" onerror="this.style.visibility='hidden'"><span class="ld-bd-name">${r.name}</span><span class="ld-bd-score">${r.score} intento${r.score===1?"":"s"}</span></div>`;}).join("");
}
document.addEventListener("DOMContentLoaded",initLoldle);
