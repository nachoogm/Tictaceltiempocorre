/* =====================================================================
   loldle.js — 5 modos: Clásico, Habilidad, Cita/Lore, Emoji, Splash
   Datos: Data Dragon (CDN gratis, no gasta rate limit de Riot).
   ===================================================================== */
const FEMALE=new Set(["Ahri","Akali","Anivia","Annie","Ashe","Aurora","Belveth","Briar","Caitlyn","Camille","Cassiopeia","Diana","Elise","Evelynn","Fiora","Gwen","Illaoi","Irelia","Janna","Jinx","Kaisa","Kalista","Karma","Katarina","Kayle","Kindred","Leblanc","Leona","Lillia","Lissandra","Lulu","Lux","Mel","MissFortune","Morgana","Naafiri","Nami","Neeko","Nidalee","Nilah","Orianna","Poppy","Qiyana","Quinn","Rell","Renata","Riven","Samira","Sejuani","Senna","Seraphine","Shyvana","Sivir","Sona","Soraka","Syndra","Taliyah","Tristana","Vayne","Vex","Vi","Xayah","Yunara","Yuumi","Zeri","Zoe","Zyra"]);
const OTHER=new Set(["Kindred","Maokai","Ivern","Zac","Skarner","Rammus","Khazix","Chogath","Belveth","Malzahar","Fiddlesticks","Amumu","AurelionSol","Naafiri"]);
function genderOf(id){if(OTHER.has(id))return "Otro";if(FEMALE.has(id))return "Femenino";return "Masculino";}
function rangeOf(c){return (c.stats&&c.stats.attackrange>=275)?"A distancia":"Cuerpo a cuerpo";}
function damageOf(c){const a=(c.info&&c.info.attack)||0,m=(c.info&&c.info.magic)||0;if(Math.abs(a-m)<=1)return "Híbrido";return a>m?"Físico (AD)":"Mágico (AP)";}
function resourceOf(c){const p=(c.partype||"").trim();const map={"Mana":"Maná","Energy":"Energía","None":"Sin recurso","Blood Well":"Pozo de sangre","Rage":"Furia","Fury":"Furia","Heat":"Calor","Ferocity":"Ferocidad","Flow":"Flujo","Shield":"Escudo","Health":"Vida","Grit":"Determinación","Crimson Rush":"Sangre","Bloodthirst":"Sed de sangre","Courage":"Coraje"};return map[p]||p||"—";}
const CLS_ES={Fighter:"Luchador",Tank:"Tanque",Mage:"Mago",Assassin:"Asesino",Marksman:"Tirador",Support:"Soporte"};
function classesOf(c){return (c.tags||[]).map(t=>CLS_ES[t]||t);}
/* Emojis curados (fallback por clase si no está) */
const EMOJIS={Ahri:"🦊💗🔮",Akshan:"🔫🦅😎",Amumu:"🧟😭🩹",Anivia:"🐦‍⬛❄️🥚",Annie:"👧🐻🔥",Ashe:"🏹❄️👑",Aatrox:"😈⚔️🩸",Bard:"🎵🔔✨",Blitzcrank:"🤖🪝⚡",Brand:"🔥🧟🌋",Braum:"🧔❄️🛡️",Caitlyn:"🔫🎩🕵️",Camille:"🦵🔪💼",Chogath:"👹🦷🍽️",Darius:"🪓💪🩸",Diana:"🌙⚔️🌑",Draven:"🪓😎🔥",Ekko:"⏰🔨⚡",Evelynn:"😈💋🖤",Ezreal:"✨🏹💎",Fiddlesticks:"🌾😱🐦‍⬛",Fiora:"🤺💃🌹",Fizz:"🐟🔱🦈",Galio:"🗿🛡️😇",Gangplank:"🏴‍☠️🍊💣",Garen:"⚔️🌀💪",Gnar:"🦖🪃😡",Graves:"🚬🔫💥",Gwen:"✂️🧵👻",Hecarim:"🐴💀👻",Heimerdinger:"🔬🐢💡",Illaoi:"🐙💪⚓",Irelia:"⚔️🗡️🌸",Janna:"🌪️👼🛡️",Jax:"🔦💪🗡️",Jhin:"🎭🔫4️⃣",Jinx:"💥🔫🐱",Kaisa:"🐛👾🔫",Karma:"🌸📿✨",Karthus:"💀🎵⚰️",Katarina:"🔪🌀🩸",Kayle:"👼⚔️😇",Kayn:"🌑🗡️👹",Kennen:"⚡🐿️🌩️",Khazix:"🦗🔪🌑",Kindred:"🐺🐑🏹",Leblanc:"🃏🌹🪞",LeeSin:"🦯👊🐉",Leona:"☀️🛡️⚔️",Lulu:"🧚🐛✨",Lux:"💡🌟🔮",Malphite:"🪨🗿💥",MasterYi:"🗡️⚡🧘",MissFortune:"🔫💃👒",Mordekaiser:"⚰️🤘🔨",Morgana:"😈🖤⛓️",Nami:"🌊🐟🔱",Nasus:"🐕🏜️⏳",Nautilus:"⚓🌊🤿",Nidalee:"🐆🏹🌿",Nunu:"❄️☃️🐻",Orianna:"⚙️🤖🔮",Pantheon:"🛡️🌟⚔️",Poppy:"🔨🛡️👧",Pyke:"🔱💀🌊",Qiyana:"💎🌿👑",Rammus:"🦔🛡️🌀",Renekton:"🐊🪓🩸",Rengar:"🦁🔪🌿",Riven:"⚔️💔🗡️",Ryze:"🧙📜🔵",Samira:"🔫🌹💃",Sett:"👊🥊💪",Shaco:"🃏🔪😈",Shen:"🗡️👁️🥷",Sona:"🎶🎻💙",Soraka:"🍌⭐💫",Sylas:"⛓️💪🔮",Syndra:"🔮🌑⚡",Tahmkench:"🐸👅🎩",Taric:"💎💪✨",Teemo:"🍄🐹💣",Thresh:"🏮⛓️💀",Tristana:"💥🔫🐹",Tryndamere:"⚔️😡💪",TwistedFate:"🃏🎴✨",Twitch:"🐀🏹🦠",Udyr:"🐻🐯🦅",Varus:"🏹🖤💜",Vayne:"🏹🌙🦇",Veigar:"🎩🟣😈",Vi:"👊🥊💥",Viego:"👑💔⚔️",Viktor:"🤖⚙️🔮",Vladimir:"🧛🩸🖤",Volibear:"🐻⚡🌩️",Warwick:"🐺🩸🦴",MonkeyKing:"🐒🪄🍌",Xayah:"🪶🏹❤️",Yasuo:"🍃⚔️🌪️",Yone:"👺⚔️🍃",Yorick:"⚰️🪦👨‍🌾",Yuumi:"🐱📖💗",Zac:"🟢🫧💥",Zed:"🥷🌑🗡️",Zeri:"⚡🔫💙",Ziggs:"💣🧨💥",Zoe:"⭐😜🌈",Zyra:"🌱🌹🌿",Jinx:"💣🔫🐱"};
const CLASS_EMOJI={Fighter:"⚔️💪🛡️",Tank:"🛡️🪨💪",Mage:"🔮✨🌟",Assassin:"🗡️🥷🌑",Marksman:"🏹🎯💥",Support:"💗✨🛡️"};
function emojisFor(c){return EMOJIS[c.id]||CLASS_EMOJI[(c.tags||[])[0]]||"❓❓❓";}

let POOL=[],target=null,mode="classic",daily=true,guessedIds=new Set(),finished=false;
function seededPick(arr,salt){const d=new Date();let seed=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()+(salt||0);return arr[seed%arr.length];}

async function initLoldle(){
  injectNav("loldle.html");initFX();await loadDDragon();POOL=CHAMPIONS.slice();
  document.querySelectorAll(".ld-modes .rk-tab").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
  document.getElementById("daily-chk").addEventListener("change",e=>{daily=e.target.checked;newGame();});
  setupInput();newGame();
}
function setMode(m){mode=m;document.querySelectorAll(".ld-modes .rk-tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===m));document.getElementById("mode-lbl").textContent={classic:"Clásico",ability:"Habilidad",quote:"Cita / Lore",emoji:"Emoji",splash:"Splash"}[m];const cl=mode==="classic";document.getElementById("ld-legend").style.display=cl?"flex":"none";document.getElementById("ld-table").style.display=cl?"block":"none";newGame();}
async function newGame(){guessedIds=new Set();finished=false;document.getElementById("ld-rows").innerHTML="";document.getElementById("ld-result").innerHTML="";const inp=document.getElementById("guess");inp.value="";inp.disabled=false;const salt={classic:0,ability:1,quote:2,emoji:3,splash:4}[mode];target=daily?seededPick(POOL,salt):POOL[Math.floor(Math.random()*POOL.length)];updateStats();await renderClue();}
function updateStats(){document.getElementById("ld-stats").textContent=`${guessedIds.size} intento${guessedIds.size===1?"":"s"}`;}

async function renderClue(){
  const clue=document.getElementById("ld-clue");
  if(mode==="classic"){clue.style.display="none";return;}
  clue.style.display="block";
  if(mode==="ability"){
    clue.innerHTML=`<div class="ld-clue-inner"><div class="ld-clue-t">✨ ¿De qué campeón es esta habilidad?</div><div class="mh-empty">Cargando…</div></div>`;
    try{const det=await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/data/es_ES/champion/${target.id}.json`).then(r=>r.json());const cd=det.data[target.id];
      const pool=[{img:`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/passive/${cd.passive.image.full}`,key:"Pasiva",name:cd.passive.name}].concat(cd.spells.map((s,i)=>({img:`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/spell/${s.image.full}`,key:["Q","W","E","R"][i],name:s.name})));
      const pick=pool[Math.floor((daily?(new Date().getDate()):Math.random()*pool.length))%pool.length];
      clue.innerHTML=`<div class="ld-clue-inner"><div class="ld-clue-t">✨ ¿De qué campeón es esta habilidad?</div><img class="ld-ability" src="${pick.img}"><div class="ld-ability-key">${pick.key} · <span>${pick.name}</span></div></div>`;
    }catch(e){clue.innerHTML=`<div class="ld-clue-inner"><div class="mh-empty">No se pudo cargar</div></div>`;}
  }else if(mode==="quote"){
    let txt=(target.blurb||"").replace(/\s+/g," ").trim();[target.name,target.name.split(" ")[0]].forEach(w=>{if(w)txt=txt.replace(new RegExp(w,"gi"),"█████");});if(txt.length>320)txt=txt.slice(0,320)+"…";
    clue.innerHTML=`<div class="ld-clue-inner"><div class="ld-clue-t">📜 ¿Quién es? (lore)</div><div class="ld-quote">“${txt||"Sin descripción."}”</div></div>`;
  }else if(mode==="emoji"){
    clue.innerHTML=`<div class="ld-clue-inner"><div class="ld-clue-t">😜 ¿Qué campeón representan estos emojis?</div><div class="ld-emoji">${emojisFor(target)}</div></div>`;
  }else if(mode==="splash"){
    // splash recortado con zoom fuerte y posición aleatoria (determinista si daily)
    const seed=daily?new Date().getDate():Math.floor(Math.random()*100);
    const px=20+((seed*37)%60),py=20+((seed*53)%60),zoom=280;
    clue.innerHTML=`<div class="ld-clue-inner"><div class="ld-clue-t">🖼️ ¿De qué campeón es este trozo de splash?</div><div class="ld-splash" style="background-image:url('${splashArt(target.id)}');background-size:${zoom}%;background-position:${px}% ${py}%"></div></div>`;
  }
}

function setupInput(){const inp=document.getElementById("guess"),sug=document.getElementById("suggest");
  inp.addEventListener("input",()=>{const q=inp.value.trim().toLowerCase();if(!q){sug.innerHTML="";return;}const list=POOL.filter(c=>c.name.toLowerCase().includes(q)&&!guessedIds.has(c.id)).slice(0,6);sug.innerHTML=list.map(c=>`<div class="sug-item" data-id="${c.id}"><img src="${champIcon(c.id)}"> ${c.name}</div>`).join("");sug.querySelectorAll(".sug-item").forEach(el=>el.addEventListener("click",()=>{submitGuess(el.dataset.id);inp.value="";sug.innerHTML="";}));});
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"){const q=inp.value.trim().toLowerCase();const first=POOL.find(c=>c.name.toLowerCase()===q)||POOL.find(c=>c.name.toLowerCase().includes(q)&&!guessedIds.has(c.id));if(first){submitGuess(first.id);inp.value="";sug.innerHTML="";}}});}
function cell(val,state,arrow){return `<span class="ld-cell ${state}">${val}${arrow?` <b>${arrow}</b>`:""}</span>`;}
function submitGuess(id){
  if(finished||guessedIds.has(id))return;const g=CHAMP_BY_ID[id];if(!g)return;guessedIds.add(id);updateStats();
  if(mode!=="classic"){const ok=g.id===target.id;const row=document.createElement("div");row.className="ld-simple "+(ok?"win":"bad");row.innerHTML=`<img src="${champIcon(g.id)}"><b>${g.name}</b><span>${ok?"✅ ¡Correcto!":"❌ No es"}</span>`;document.getElementById("ld-rows").prepend(row);document.getElementById("ld-table").style.display="block";if(ok)win();return;}
  const gGender=genderOf(g.id),tGender=genderOf(target.id),gCls=classesOf(g),tCls=classesOf(target),gRes=resourceOf(g),tRes=resourceOf(target),gRange=rangeOf(g),tRange=rangeOf(target),gDmg=damageOf(g),tDmg=damageOf(target),gDiff=(g.info&&g.info.difficulty)||0,tDiff=(target.info&&target.info.difficulty)||0,gLen=g.name.length,tLen=target.name.length;
  const same=gCls.length===tCls.length&&gCls.every(c=>tCls.includes(c)),overlap=gCls.some(c=>tCls.includes(c)),clsState=same?"g":(overlap?"y":"r");
  const row=document.createElement("div");row.className="ld-row"+(g.id===target.id?" win":"");
  row.innerHTML=`<span class="ld-champ"><img src="${champIcon(g.id)}"><b>${g.name}</b></span>${cell(gGender,gGender===tGender?"g":"r")}${cell(gCls.join(", ")||"—",clsState)}${cell(gRes,gRes===tRes?"g":"r")}${cell(gRange,gRange===tRange?"g":"r")}${cell(gDmg,gDmg===tDmg?"g":"r")}${cell(gDiff,gDiff===tDiff?"g":"r",gDiff===tDiff?"":(tDiff>gDiff?"⬆️":"⬇️"))}${cell(gLen,gLen===tLen?"g":"r",gLen===tLen?"":(tLen>gLen?"⬆️":"⬇️"))}`;
  document.getElementById("ld-rows").prepend(row);if(g.id===target.id)win();
}
function win(){finished=true;document.getElementById("guess").disabled=true;document.getElementById("ld-result").innerHTML=`<div class="ld-win"><img src="${champIcon(target.id)}"><div><div class="ld-win-t">¡Correcto! 🎉</div><div class="ld-win-s">Era <b>${target.name}</b> · en ${guessedIds.size} intento${guessedIds.size===1?"":"s"}</div></div><button class="btn primary" onclick="newGame()">Jugar otra</button></div>`;toast(`¡${target.name}! 🎉`);}
window.newGame=newGame;
document.addEventListener("DOMContentLoaded",initLoldle);
