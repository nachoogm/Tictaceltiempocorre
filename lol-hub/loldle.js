/* =====================================================================
   loldle.js — Adivina el campeón con pistas (estilo LoLdle)
   Pistas desde Data Dragon: Clase, Recurso, Rango, Daño, Dificultad, Letras.
   Género: lista curada (Data Dragon no lo trae). Female por defecto listado.
   ===================================================================== */
// Campeonas femeninas (para la pista de género). El resto se marca "Masculino",
// y unos pocos casos especiales como "Otro".
const FEMALE=new Set(["Ahri","Akali","Anivia","Annie","Ashe","Aurora","Belveth","Briar","Caitlyn","Camille","Cassiopeia","Diana","Elise","Evelynn","Fiora","Gwen","Illaoi","Irelia","Janna","Jinx","Kaisa","Kalista","Karma","Katarina","Kayle","Kindred","Leblanc","Leona","Lillia","Lissandra","Lulu","Lux","Mel","MissFortune","Morgana","Naafiri","Nami","Neeko","Nidalee","Nilah","Orianna","Poppy","Qiyana","Quinn","Rell","RenataGlasc","Renata","Riven","Samira","Sejuani","Senna","Seraphine","Shyvana","Sivir","Sona","Soraka","Syndra","Taliyah","Tristana","Vayne","Vex","Vi","Xayah","Yunara","Yuumi","Zeri","Zoe","Zyra","Nunu"]);
const OTHER=new Set(["Kindred","Maokai","Ivern","Zac","Skarner","Rammus","Khazix","Chogath","Belveth","Malzahar","Kled","Rekai","RekSai","Fiddlesticks","Amumu","Bard","Aurelion","AurelionSol","Naafiri"]);
function genderOf(id){ if(OTHER.has(id))return "Otro"; if(FEMALE.has(id))return "Femenino"; return "Masculino"; }

// Rango: melee vs ranged por attackrange (>275 ≈ ranged)
function rangeOf(c){ return (c.stats && c.stats.attackrange>=275)?"A distancia":"Cuerpo a cuerpo"; }
// Daño principal: comparar info.attack vs info.magic
function damageOf(c){ const a=(c.info&&c.info.attack)||0,m=(c.info&&c.info.magic)||0; if(Math.abs(a-m)<=1)return "Híbrido"; return a>m?"Físico (AD)":"Mágico (AP)"; }
function resourceOf(c){ const p=(c.partype||"").trim(); const map={"Mana":"Maná","Energy":"Energía","None":"Sin recurso","Blood Well":"Pozo de sangre","Rage":"Furia","Fury":"Furia","Heat":"Calor","Ferocity":"Ferocidad","Flow":"Flujo","Shield":"Escudo","Health":"Vida","Grit":"Determinación","Crimson Rush":"Sangre","Bloodthirst":"Sed de sangre","Courage":"Coraje"}; return map[p]||p||"—"; }
const CLS_ES={Fighter:"Luchador",Tank:"Tanque",Mage:"Mago",Assassin:"Asesino",Marksman:"Tirador",Support:"Soporte"};
function classesOf(c){ return (c.tags||[]).map(t=>CLS_ES[t]||t); }

let POOL=[], target=null, mode="daily", guessedIds=new Set(), finished=false;

function seededPick(arr){
  // reto del día: semilla por fecha (mismo campeón todo el día para todos)
  const d=new Date(); const seed=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
  let x=seed%arr.length; return arr[x];
}

async function initLoldle(){
  injectNav("loldle.html"); initFX(); await loadDDragon();
  POOL=CHAMPIONS.slice();
  document.getElementById("m-daily").addEventListener("click",()=>setMode("daily"));
  document.getElementById("m-free").addEventListener("click",()=>setMode("free"));
  setupInput();
  newGame();
}
function setMode(m){
  mode=m; finished=false;
  document.getElementById("m-daily").classList.toggle("active",m==="daily");
  document.getElementById("m-free").classList.toggle("active",m==="free");
  document.getElementById("mode-lbl").textContent=m==="daily"?"Reto del día":"Juego libre";
  newGame();
}
function newGame(){
  guessedIds=new Set(); finished=false;
  document.getElementById("ld-rows").innerHTML="";
  document.getElementById("ld-result").innerHTML="";
  document.getElementById("guess").value=""; document.getElementById("guess").disabled=false;
  target = mode==="daily" ? seededPick(POOL) : POOL[Math.floor(Math.random()*POOL.length)];
  updateStats();
}
function updateStats(){
  document.getElementById("ld-stats").textContent = `${guessedIds.size} intento${guessedIds.size===1?"":"s"}`;
}

function setupInput(){
  const inp=document.getElementById("guess"); const sug=document.getElementById("suggest");
  inp.addEventListener("input",()=>{
    const q=inp.value.trim().toLowerCase(); if(!q){sug.innerHTML="";return;}
    const list=POOL.filter(c=>c.name.toLowerCase().includes(q)&&!guessedIds.has(c.id)).slice(0,6);
    sug.innerHTML=list.map(c=>`<div class="sug-item" data-id="${c.id}"><img src="${champIcon(c.id)}"> ${c.name}</div>`).join("");
    sug.querySelectorAll(".sug-item").forEach(el=>el.addEventListener("click",()=>{submitGuess(el.dataset.id);inp.value="";sug.innerHTML="";}));
  });
  inp.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      const q=inp.value.trim().toLowerCase();
      const first=POOL.find(c=>c.name.toLowerCase()===q)||POOL.find(c=>c.name.toLowerCase().includes(q)&&!guessedIds.has(c.id));
      if(first){submitGuess(first.id);inp.value="";sug.innerHTML="";}
    }
  });
}

function cell(val,state,arrow){ return `<span class="ld-cell ${state}">${val}${arrow?` <b>${arrow}</b>`:""}</span>`; }

function submitGuess(id){
  if(finished||guessedIds.has(id))return;
  const g=CHAMP_BY_ID[id]; if(!g)return;
  guessedIds.add(id); updateStats();

  const gGender=genderOf(g.id), tGender=genderOf(target.id);
  const gCls=classesOf(g), tCls=classesOf(target);
  const gRes=resourceOf(g), tRes=resourceOf(target);
  const gRange=rangeOf(g), tRange=rangeOf(target);
  const gDmg=damageOf(g), tDmg=damageOf(target);
  const gDiff=(g.info&&g.info.difficulty)||0, tDiff=(target.info&&target.info.difficulty)||0;
  const gLen=g.name.length, tLen=target.name.length;

  // clase: verde si idénticas, amarillo si hay solape, rojo si nada
  const same=gCls.length===tCls.length&&gCls.every(c=>tCls.includes(c));
  const overlap=gCls.some(c=>tCls.includes(c));
  const clsState=same?"g":(overlap?"y":"r");

  const row=document.createElement("div"); row.className="ld-row"+(g.id===target.id?" win":"");
  row.innerHTML=`
    <span class="ld-champ"><img src="${champIcon(g.id)}"><b>${g.name}</b></span>
    ${cell(gGender, gGender===tGender?"g":"r")}
    ${cell(gCls.join(", ")||"—", clsState)}
    ${cell(gRes, gRes===tRes?"g":"r")}
    ${cell(gRange, gRange===tRange?"g":"r")}
    ${cell(gDmg, gDmg===tDmg?"g":"r")}
    ${cell(gDiff, gDiff===tDiff?"g":"r", gDiff===tDiff?"":(tDiff>gDiff?"⬆️":"⬇️"))}
    ${cell(gLen, gLen===tLen?"g":"r", gLen===tLen?"":(tLen>gLen?"⬆️":"⬇️"))}`;
  document.getElementById("ld-rows").prepend(row);

  if(g.id===target.id){
    finished=true; document.getElementById("guess").disabled=true;
    document.getElementById("ld-result").innerHTML=`<div class="ld-win"><img src="${champIcon(target.id)}"><div><div class="ld-win-t">¡Correcto! 🎉</div><div class="ld-win-s">Era <b>${target.name}</b> · lo sacaste en ${guessedIds.size} intento${guessedIds.size===1?"":"s"}</div></div><button class="btn primary" onclick="newGame()">Jugar otra</button></div>`;
    toast(`¡${target.name}! 🎉 En ${guessedIds.size} intentos`);
  }
}
window.newGame=newGame;
document.addEventListener("DOMContentLoaded",initLoldle);
