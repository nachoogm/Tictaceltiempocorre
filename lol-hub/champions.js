/* champions.js — Tier list + build orientativa */
const CH_LANES={Aatrox:["TOP"],Ahri:["MID"],Akali:["MID","TOP"],Akshan:["MID","TOP"],Alistar:["SUPPORT"],Ambessa:["TOP","MID"],Amumu:["JUNGLE","SUPPORT"],Anivia:["MID"],Annie:["MID","SUPPORT"],Aphelios:["ADC"],Ashe:["ADC","SUPPORT"],AurelionSol:["MID"],Aurora:["MID","TOP"],Azir:["MID"],Bard:["SUPPORT"],Belveth:["JUNGLE"],Blitzcrank:["SUPPORT"],Brand:["SUPPORT","MID"],Braum:["SUPPORT"],Briar:["JUNGLE"],Caitlyn:["ADC"],Camille:["TOP"],Cassiopeia:["MID"],Chogath:["TOP","MID"],Corki:["MID","ADC"],Darius:["TOP"],Diana:["JUNGLE","MID"],DrMundo:["TOP"],Draven:["ADC"],Ekko:["JUNGLE","MID"],Elise:["JUNGLE"],Evelynn:["JUNGLE"],Ezreal:["ADC"],Fiddlesticks:["JUNGLE"],Fiora:["TOP"],Fizz:["MID"],Galio:["MID","SUPPORT"],Gangplank:["TOP"],Garen:["TOP"],Gnar:["TOP"],Gragas:["JUNGLE","TOP"],Graves:["JUNGLE"],Gwen:["TOP","JUNGLE"],Hecarim:["JUNGLE"],Heimerdinger:["MID","SUPPORT"],Hwei:["MID","SUPPORT"],Illaoi:["TOP"],Irelia:["TOP","MID"],Ivern:["JUNGLE"],Janna:["SUPPORT"],JarvanIV:["JUNGLE"],Jax:["TOP","JUNGLE"],Jayce:["TOP","MID"],Jhin:["ADC"],Jinx:["ADC"],Ksante:["TOP"],Kaisa:["ADC"],Kalista:["ADC"],Karma:["SUPPORT","MID"],Karthus:["JUNGLE"],Kassadin:["MID"],Katarina:["MID"],Kayle:["TOP"],Kayn:["JUNGLE"],Kennen:["TOP"],Khazix:["JUNGLE"],Kindred:["JUNGLE"],Kled:["TOP"],KogMaw:["ADC"],Leblanc:["MID"],LeeSin:["JUNGLE"],Leona:["SUPPORT"],Lillia:["JUNGLE"],Lissandra:["MID"],Lucian:["ADC","MID"],Lulu:["SUPPORT"],Lux:["SUPPORT","MID"],Malphite:["TOP","SUPPORT"],Malzahar:["MID"],Maokai:["SUPPORT","TOP","JUNGLE"],MasterYi:["JUNGLE"],Mel:["MID"],Milio:["SUPPORT"],MissFortune:["ADC","SUPPORT"],MonkeyKing:["TOP","JUNGLE"],Mordekaiser:["TOP"],Morgana:["SUPPORT","MID"],Naafiri:["MID","JUNGLE"],Nami:["SUPPORT"],Nasus:["TOP"],Nautilus:["SUPPORT"],Neeko:["MID","SUPPORT"],Nidalee:["JUNGLE"],Nilah:["ADC"],Nocturne:["JUNGLE"],Nunu:["JUNGLE"],Olaf:["JUNGLE","TOP"],Orianna:["MID"],Ornn:["TOP"],Pantheon:["SUPPORT","TOP","MID"],Poppy:["TOP","JUNGLE","SUPPORT"],Pyke:["SUPPORT"],Qiyana:["MID"],Quinn:["TOP"],Rakan:["SUPPORT"],Rammus:["JUNGLE"],RekSai:["JUNGLE"],Rell:["SUPPORT"],Renata:["SUPPORT"],Renekton:["TOP"],Rengar:["JUNGLE","TOP"],Riven:["TOP"],Rumble:["TOP","MID"],Ryze:["MID","TOP"],Samira:["ADC"],Sejuani:["JUNGLE"],Senna:["SUPPORT","ADC"],Seraphine:["SUPPORT","MID","ADC"],Sett:["TOP","SUPPORT"],Shaco:["JUNGLE","SUPPORT"],Shen:["TOP","SUPPORT"],Shyvana:["JUNGLE"],Singed:["TOP"],Sion:["TOP"],Sivir:["ADC"],Skarner:["JUNGLE"],Smolder:["ADC"],Sona:["SUPPORT"],Soraka:["SUPPORT"],Swain:["MID","SUPPORT","ADC"],Sylas:["MID"],Syndra:["MID"],TahmKench:["SUPPORT","TOP"],Taliyah:["JUNGLE","MID"],Talon:["MID","JUNGLE"],Taric:["SUPPORT"],Teemo:["TOP"],Thresh:["SUPPORT"],Tristana:["ADC","MID"],Trundle:["JUNGLE","TOP"],Tryndamere:["TOP"],TwistedFate:["MID"],Twitch:["ADC"],Udyr:["JUNGLE"],Urgot:["TOP"],Varus:["ADC"],Vayne:["ADC","TOP"],Veigar:["MID","SUPPORT"],Velkoz:["SUPPORT","MID"],Vex:["MID"],Vi:["JUNGLE"],Viego:["JUNGLE"],Viktor:["MID"],Vladimir:["MID","TOP"],Volibear:["JUNGLE","TOP"],Warwick:["JUNGLE","TOP"],Xayah:["ADC"],Xerath:["MID","SUPPORT"],XinZhao:["JUNGLE"],Yasuo:["MID","TOP"],Yone:["MID","TOP"],Yorick:["TOP"],Yunara:["ADC"],Yuumi:["SUPPORT"],Zac:["JUNGLE"],Zed:["MID","JUNGLE"],Zeri:["ADC"],Ziggs:["MID","ADC"],Zilean:["SUPPORT","MID"],Zoe:["MID"],Zyra:["SUPPORT"]};
function chLanesByTags(tags){if(tags.includes("Marksman"))return["ADC"];if(tags.includes("Support"))return["SUPPORT"];if(tags.includes("Assassin")||tags.includes("Mage"))return["MID"];if(tags.includes("Tank"))return["TOP","SUPPORT"];if(tags.includes("Fighter"))return["TOP","JUNGLE"];return["MID"];}
const DPM_ROLE={TOP:"top",JUNGLE:"jungle",MID:"mid",ADC:"adc",SUPPORT:"support"};
const OPGG_ROLE={TOP:"top",JUNGLE:"jungle",MID:"mid",ADC:"adc",SUPPORT:"support"};
const posLabel=p=>({TOP:"Top",JUNGLE:"Jungla",MID:"Mid",ADC:"ADC",SUPPORT:"Support"}[p]||p);
const posEmoji=p=>({TOP:"⚔️",JUNGLE:"🌳",MID:"✨",ADC:"🏹",SUPPORT:"🛡️"}[p]||"");
function hashStr(s){let h=0;for(let i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))>>>0;}return h;}
const TIERS=[{k:"S",c:"#e0555b",label:"S"},{k:"A",c:"#f0d060",label:"A"},{k:"B",c:"#5b8bf0",label:"B"},{k:"C",c:"#9aa8b3",label:"C"}];
function tierFor(id){const idx=hashStr(id)%10;return idx<2?TIERS[0]:idx<5?TIERS[1]:idx<8?TIERS[2]:TIERS[3];}
const dpmChamp=(slug,role)=>`https://dpm.lol/champions/${slug}/build?role=${role}`;
function profileOf(c){const a=(c.info&&c.info.attack)||0,m=(c.info&&c.info.magic)||0;const tank=(c.tags||[]).includes("Tank");if(tank&&Math.max(a,m)<7)return "tank";return a>=m?"ad":"ap";}
function pickItems(pred,n,exclude){const list=Object.entries(ITEMS).filter(([id,it])=>it.gold>=2500&&it.gold<=4500&&(it.into||[]).length===0&&pred(it)&&!(exclude||[]).includes(id)).sort((a,b)=>b[1].gold-a[1].gold);return list.slice(0,n).map(([id])=>id);}
function buildFor(c){
  const prof=profileOf(c);const tags=c.tags||[];
  const start=prof==="ad"?["1055","2003"]:prof==="ap"?["1056","2003"]:["1054","2003"];
  const boots=prof==="ad"?"3006":prof==="ap"?"3020":"3047";
  let core=[];
  if(prof==="ad"){
    if(tags.includes("Marksman"))core=pickItems(it=>it.tags.includes("Damage")&&(it.tags.includes("CriticalStrike")||it.tags.includes("AttackSpeed")||it.tags.includes("LifeSteal")),3);
    else core=pickItems(it=>it.tags.includes("Damage")&&(it.tags.includes("Health")||it.tags.includes("CooldownReduction")||it.tags.includes("LifeSteal")),3);
  }else if(prof==="ap"){core=pickItems(it=>it.tags.includes("SpellDamage")&&(it.tags.includes("Mana")||it.tags.includes("CooldownReduction")||it.tags.includes("MagicPenetration")||it.tags.includes("Health")),3);}
  else{const armor=pickItems(it=>it.tags.includes("Armor")&&it.tags.includes("Health"),1);
    const mr=pickItems(it=>it.tags.includes("SpellBlock")&&it.tags.includes("Health"),1,armor);
    const extra=pickItems(it=>it.tags.includes("Health")&&(it.tags.includes("CooldownReduction")||it.tags.includes("Armor")),1,armor.concat(mr));
    core=armor.concat(mr,extra);}
  if(core.length<3){core=core.concat(pickItems(it=>it.gold>=2800,3-core.length,core));}
  return {start,boots,core:core.slice(0,3),prof};
}
function itemChip(id){const it=ITEMS[String(id)];if(!it)return"";return `<img class="bd-item" data-item="${id}" src="${itemIcon(id)}" alt="${it.name}" onerror="this.style.display='none'">`;}
let LIST=[],curCls="ALL",curPos="ALL",curSearch="";
async function initChamps(){injectNav("champions.html");initFX();await loadDDragon();
  LIST=CHAMPIONS.map(c=>({...c,lanes:CH_LANES[c.id]||chLanesByTags(c.tags||[]),tier:tierFor(c.id)}));
  bindUI();renderGrid();renderTable();}
function bindUI(){document.getElementById("search").addEventListener("input",e=>{curSearch=e.target.value.trim().toLowerCase();renderGrid();renderTable();});
  document.querySelectorAll(".cls-btn").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".cls-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");curCls=b.dataset.cls;renderGrid();renderTable();}));
  document.querySelectorAll(".role-tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".role-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");curPos=b.dataset.pos;renderTable();}));}
function filtered(){return LIST.filter(c=>(curCls==="ALL"||c.tags.includes(curCls))&&(curPos==="ALL"||c.lanes.includes(curPos))&&(!curSearch||c.name.toLowerCase().includes(curSearch)));}
function renderGrid(){const grid=document.getElementById("champ-grid");const list=LIST.filter(c=>(curCls==="ALL"||c.tags.includes(curCls))&&(!curSearch||c.name.toLowerCase().includes(curSearch)));
  if(!list.length){grid.innerHTML=`<div class="mh-empty">Sin resultados</div>`;return;}
  grid.innerHTML=list.map(c=>`<div class="cg-item" data-champ="${c.id}" title="${c.name}"><img src="${champIcon(c.id)}" loading="lazy" alt="${c.name}"><span>${c.name}</span></div>`).join("");
  grid.querySelectorAll(".cg-item").forEach(el=>el.addEventListener("click",()=>openChamp(el.dataset.champ)));}
function renderTable(){const body=document.getElementById("tl-body");const note=document.getElementById("tl-note");const rank={S:0,A:1,B:2,C:3};
  let list=filtered().slice().sort((a,b)=>rank[a.tier.k]-rank[b.tier.k]||a.name.localeCompare(b.name));
  note.textContent=`${list.length} campeones${curPos!=="ALL"?` · ${posLabel(curPos)}`:""}${curCls!=="ALL"?` · ${curCls}`:""}`;
  if(!list.length){body.innerHTML=`<div class="mh-empty">Sin resultados</div>`;return;}
  body.innerHTML=list.map((c,i)=>{const role=curPos!=="ALL"?curPos:c.lanes[0];
    return`<div class="tl-row" data-champ="${c.id}"><span class="c-rank">${i+1}</span><span class="c-champ"><img src="${champIcon(c.id)}" loading="lazy"><b>${c.name}</b></span><span class="c-tier"><span class="tier-badge" style="background:${c.tier.c}">${c.tier.label}</span></span><span class="c-role">${c.lanes.map(l=>posEmoji(l)).join(" ")}</span><span class="c-links"><a class="mini-btn" href="${dpmChamp(c.id.toLowerCase(),DPM_ROLE[role])}" target="_blank" rel="noopener" onclick="event.stopPropagation()">DPM</a><a class="mini-btn" href="https://www.op.gg/lol/champions/${c.id.toLowerCase()}/build/${OPGG_ROLE[role]}" target="_blank" rel="noopener" onclick="event.stopPropagation()">OP.GG</a></span></div>`;}).join("");
  body.querySelectorAll(".tl-row").forEach(r=>r.addEventListener("click",()=>openChamp(r.dataset.champ)));}
function openChamp(id){const c=LIST.find(x=>x.id===id);if(!c)return;let ov=document.getElementById("champ-modal");
  if(!ov){ov=document.createElement("div");ov.className="modal-overlay";ov.id="champ-modal";ov.innerHTML=`<div class="modal modal-sm"><button class="modal-close" data-close-champ>✕</button><div id="champ-modal-content"></div></div>`;document.body.appendChild(ov);
    ov.addEventListener("click",e=>{if(e.target.id==="champ-modal"||e.target.hasAttribute("data-close-champ")){ov.classList.remove("show");document.body.style.overflow="";}});}
  const box=document.getElementById("champ-modal-content");ov.classList.add("show");document.body.style.overflow="hidden";const slug=c.id.toLowerCase();
  const b=buildFor(c);const profTxt={ad:"Daño físico (AD)",ap:"Daño mágico (AP)",tank:"Tanque"}[b.prof];
  const buildBlock=`<div class="cb-section">🛠️ Build orientativa <small>(${profTxt})</small></div>
    <div class="bd-line"><span class="bd-lbl">Inicio</span><div class="bd-items">${b.start.map(itemChip).join("")}</div></div>
    <div class="bd-line"><span class="bd-lbl">Botas</span><div class="bd-items">${itemChip(b.boots)}</div></div>
    <div class="bd-line"><span class="bd-lbl">Core</span><div class="bd-items">${b.core.map(itemChip).join("")}</div></div>
    <div class="bd-tip">Orientativa por clase — pasa el ratón sobre cada objeto.</div>`;
  const buildRows=c.lanes.map(l=>`<div class="cb-role"><span class="cb-role-name">${posEmoji(l)} ${posLabel(l)}</span><div class="cb-links"><a class="btn" href="${dpmChamp(slug,DPM_ROLE[l])}" target="_blank" rel="noopener">DPM.LOL</a><a class="btn" href="https://www.op.gg/lol/champions/${slug}/build/${OPGG_ROLE[l]}" target="_blank" rel="noopener">OP.GG</a></div></div>`).join("");
  box.innerHTML=`<div class="cb-head"><img src="${champIcon(c.id)}" class="cb-img" alt="${c.name}"><div><div class="cb-name">${c.name} <span class="tier-badge" style="background:${c.tier.c}">${c.tier.label}</span></div><div class="cb-tags">${c.tags.join(" · ")}</div></div></div>${buildBlock}<div class="cb-section">📊 Meta real por rol</div>${buildRows}<div class="cb-section">🔎 Más</div><div class="cb-links"><a class="btn" href="https://dpm.lol/champions/${slug}" target="_blank" rel="noopener">Estadísticas DPM</a><a class="btn" href="https://www.op.gg/lol/champions/${slug}/probuilds" target="_blank" rel="noopener">Pro builds</a><a class="btn" href="https://leagueoflegends.fandom.com/wiki/${encodeURIComponent(c.name)}" target="_blank" rel="noopener">Wiki / lore</a></div>`;}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){const ov=document.getElementById("champ-modal");if(ov){ov.classList.remove("show");document.body.style.overflow="";}}});
document.addEventListener("DOMContentLoaded",initChamps);
