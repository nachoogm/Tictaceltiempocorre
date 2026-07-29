/* =====================================================================
   loldle.js — 3 modos:
   · Clásico: pistas (género, clase, recurso, rango, daño, dificultad, letras)
   · Habilidad: muestra el icono de una habilidad del campeón objetivo
   · Cita/Lore: muestra un fragmento del lore con el nombre censurado
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

let POOL=[],target=null,mode="classic",daily=true,guessedIds=new Set(),finished=false;
function seededPick(arr,salt){const d=new Date();let seed=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()+(salt||0);return arr[seed%arr.length];}

async function initLoldle(){
  injectNav("loldle.html"); initFX(); await loadDDragon();
  POOL=CHAMPIONS.slice();
  document.querySelectorAll(".ld-modes .rk-tab").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
  document.getElementById("daily-chk").addEventListener("change",e=>{daily=e.target.checked;newGame();});
  setupInput(); newGame();
}
function setMode(m){
  mode=m; document.querySelectorAll(".ld-modes .rk-tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===m));
  document.getElementById("mode-lbl").textContent={classic:"Clásico",ability:"Habilidad",quote:"Cita / Lore"}[m];
  document.getElementById("ld-legend").style.display=m==="classic"?"flex":"none";
  document.getElementById("ld-table").style.display=m==="classic"?"block":"none";
  newGame();
}
async function newGame(){
  guessedIds=new Set(); finished=false;
  document.getElementById("ld-rows").innerHTML="";
  document.getElementById("ld-result").innerHTML="";
  const inp=document.getElementById("guess"); inp.value=""; inp.disabled=false;
  const salt=mode==="classic"?0:(mode==="ability"?1:2);
  target = daily ? seededPick(POOL,salt) : POOL[Math.floor(Math.random()*POOL.length)];
  updateStats();
  await renderClue();
}
function updateStats(){document.getElementById("ld-stats").textContent=`${guessedIds.size} intento${guessedIds.size===1?"":"s"}`;}

/* Pista visual para modos habilidad / cita */
async function renderClue(){
  const clue=document.getElementById("ld-clue");
  if(mode==="classic"){clue.style.display="none";return;}
  clue.style.display="block";
  if(mode==="ability"){
    clue.innerHTML=`<div class="ld-clue-inner"><div class="ld-clue-t">✨ ¿De qué campeón es esta habilidad?</div><div class="mh-empty">Cargando habilidad…</div></div>`;
    try{
      const det=await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/data/es_ES/champion/${target.id}.json`).then(r=>r.json());
      const cd=det.data[target.id];
      const pool=[{img:`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/passive/${cd.passive.image.full}`,key:"Pasiva",name:cd.passive.name}]
        .concat(cd.spells.map((s,i)=>({img:`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/spell/${s.image.full}`,key:["Q","W","E","R"][i],name:s.name})));
      const pick=pool[Math.floor((daily? (new Date().getDate()) : Math.random()*pool.length))%pool.length];
      clue.innerHTML=`<div class="ld-clue-inner"><div class="ld-clue-t">✨ ¿De qué campeón es esta habilidad?</div><img class="ld-ability" src="${pick.img}"><div class="ld-ability-key">${pick.key} · <span>${pick.name}</span></div></div>`;
    }catch(e){clue.innerHTML=`<div class="ld-clue-inner"><div class="mh-empty">No se pudo cargar la habilidad</div></div>`;}
  }else if(mode==="quote"){
    let txt=(target.blurb||"").replace(/\s+/g," ").trim();
    // censura el nombre del campeón (y su primera palabra) en el texto
    const parts=[target.name,target.name.split(" ")[0]];
    parts.forEach(w=>{if(w)txt=txt.replace(new RegExp(w,"gi"),"█████");});
    if(txt.length>320)txt=txt.slice(0,320)+"…";
    clue.innerHTML=`<div class="ld-clue-inner"><div class="ld-clue-t">📜 ¿Quién es? (lore)</div><div class="ld-quote">“${txt||"Sin descripción disponible."}”</div></div>`;
  }
}

function setupInput(){
  const inp=document.getElementById("guess"),sug=document.getElementById("suggest");
  inp.addEventListener("input",()=>{const q=inp.value.trim().toLowerCase();if(!q){sug.innerHTML="";return;}const list=POOL.filter(c=>c.name.toLowerCase().includes(q)&&!guessedIds.has(c.id)).slice(0,6);sug.innerHTML=list.map(c=>`<div class="sug-item" data-id="${c.id}"><img src="${champIcon(c.id)}"> ${c.name}</div>`).join("");sug.querySelectorAll(".sug-item").forEach(el=>el.addEventListener("click",()=>{submitGuess(el.dataset.id);inp.value="";sug.innerHTML="";}));});
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"){const q=inp.value.trim().toLowerCase();const first=POOL.find(c=>c.name.toLowerCase()===q)||POOL.find(c=>c.name.toLowerCase().includes(q)&&!guessedIds.has(c.id));if(first){submitGuess(first.id);inp.value="";sug.innerHTML="";}}});
}
function cell(val,state,arrow){return `<span class="ld-cell ${state}">${val}${arrow?` <b>${arrow}</b>`:""}</span>`;}

function submitGuess(id){
  if(finished||guessedIds.has(id))return;
  const g=CHAMP_BY_ID[id];if(!g)return;
  guessedIds.add(id);updateStats();

  if(mode!=="classic"){
    // en habilidad/cita: fila simple con foto + acierto/fallo
    const ok=g.id===target.id;
    const row=document.createElement("div");row.className="ld-simple "+(ok?"win":"bad");
    row.innerHTML=`<img src="${champIcon(g.id)}"><b>${g.name}</b><span>${ok?"✅ ¡Correcto!":"❌ No es"}</span>`;
    document.getElementById("ld-rows").prepend(row);
    document.getElementById("ld-table").style.display="block";
    if(ok)win();
    return;
  }

  // modo clásico: pistas
  const gGender=genderOf(g.id),tGender=genderOf(target.id);
  const gCls=classesOf(g),tCls=classesOf(target);
  const gRes=resourceOf(g),tRes=resourceOf(target);
  const gRange=rangeOf(g),tRange=rangeOf(target);
  const gDmg=damageOf(g),tDmg=damageOf(target);
  const gDiff=(g.info&&g.info.difficulty)||0,tDiff=(target.info&&target.info.difficulty)||0;
  const gLen=g.name.length,tLen=target.name.length;
  const same=gCls.length===tCls.length&&gCls.every(c=>tCls.includes(c));
  const overlap=gCls.some(c=>tCls.includes(c));
  const clsState=same?"g":(overlap?"y":"r");
  const row=document.createElement("div");row.className="ld-row"+(g.id===target.id?" win":"");
  row.innerHTML=`<span class="ld-champ"><img src="${champIcon(g.id)}"><b>${g.name}</b></span>${cell(gGender,gGender===tGender?"g":"r")}${cell(gCls.join(", ")||"—",clsState)}${cell(gRes,gRes===tRes?"g":"r")}${cell(gRange,gRange===tRange?"g":"r")}${cell(gDmg,gDmg===tDmg?"g":"r")}${cell(gDiff,gDiff===tDiff?"g":"r",gDiff===tDiff?"":(tDiff>gDiff?"⬆️":"⬇️"))}${cell(gLen,gLen===tLen?"g":"r",gLen===tLen?"":(tLen>gLen?"⬆️":"⬇️"))}`;
  document.getElementById("ld-rows").prepend(row);
  if(g.id===target.id)win();
}
function win(){
  finished=true;document.getElementById("guess").disabled=true;
  document.getElementById("ld-result").innerHTML=`<div class="ld-win"><img src="${champIcon(target.id)}"><div><div class="ld-win-t">¡Correcto! 🎉</div><div class="ld-win-s">Era <b>${target.name}</b> · en ${guessedIds.size} intento${guessedIds.size===1?"":"s"}</div></div><button class="btn primary" onclick="newGame()">Jugar otra</button></div>`;
  toast(`¡${target.name}! 🎉 En ${guessedIds.size} intentos`);
}
window.newGame=newGame;
document.addEventListener("DOMContentLoaded",initLoldle);
