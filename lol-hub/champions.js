/* champions.js — tier list + build orientativa (usa LD_LANES de loldle-data.js) */
const P2E={Top:"TOP",Jungla:"JUNGLE",Medio:"MID",ADC:"ADC",Support:"SUPPORT"};
const DPM_ROLE={TOP:"top",JUNGLE:"jungle",MID:"mid",ADC:"adc",SUPPORT:"support"};
const posLabel=p=>({TOP:"Top",JUNGLE:"Jungla",MID:"Mid",ADC:"ADC",SUPPORT:"Support"}[p]||p);
const posEmoji=p=>({TOP:"⚔️",JUNGLE:"🌳",MID:"✨",ADC:"🏹",SUPPORT:"🛡️"}[p]||"");
function hashStr(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h;}
const TIERS=[{k:"S",c:"#e0555b",label:"S"},{k:"A",c:"#f0d060",label:"A"},{k:"B",c:"#5b8bf0",label:"B"},{k:"C",c:"#9aa8b3",label:"C"}];
const tierFor=id=>{const i=hashStr(id)%10;return i<2?TIERS[0]:i<5?TIERS[1]:i<8?TIERS[2]:TIERS[3];};
const dpmChamp=(s,r)=>`https://dpm.lol/champions/${s}/build?role=${r}`;
function profileOf(c){const a=(c.info&&c.info.attack)||0,m=(c.info&&c.info.magic)||0;if((c.tags||[]).includes("Tank")&&Math.max(a,m)<7)return "tank";return a>=m?"ad":"ap";}
function pick(pred,n,ex){return Object.entries(ITEMS).filter(([id,it])=>it.gold>=2500&&it.gold<=4500&&(it.into||[]).length===0&&pred(it)&&!(ex||[]).includes(id)).sort((a,b)=>b[1].gold-a[1].gold).slice(0,n).map(([id])=>id);}
function buildFor(c){const pr=profileOf(c),tg=c.tags||[];
  const start=pr==="ad"?["1055","2003"]:pr==="ap"?["1056","2003"]:["1054","2003"];
  const boots=pr==="ad"?"3006":pr==="ap"?"3020":"3047";let core=[];
  if(pr==="ad")core=tg.includes("Marksman")?pick(it=>it.tags.includes("Damage")&&(it.tags.includes("CriticalStrike")||it.tags.includes("AttackSpeed")||it.tags.includes("LifeSteal")),3):pick(it=>it.tags.includes("Damage")&&(it.tags.includes("Health")||it.tags.includes("CooldownReduction")||it.tags.includes("LifeSteal")),3);
  else if(pr==="ap")core=pick(it=>it.tags.includes("SpellDamage")&&(it.tags.includes("Mana")||it.tags.includes("CooldownReduction")||it.tags.includes("MagicPenetration")||it.tags.includes("Health")),3);
  else{const a=pick(it=>it.tags.includes("Armor")&&it.tags.includes("Health"),1);const m=pick(it=>it.tags.includes("SpellBlock")&&it.tags.includes("Health"),1,a);
    core=a.concat(m,pick(it=>it.tags.includes("Health")&&it.tags.includes("CooldownReduction"),1,a.concat(m)));}
  if(core.length<3)core=core.concat(pick(it=>it.gold>=2800,3-core.length,core));
  return{start,boots,core:core.slice(0,3),prof:pr};}
const chip=id=>{const it=ITEMS[String(id)];return it?`<img class="bd-item" data-item="${id}" src="${itemIcon(id)}" alt="${it.name}" onerror="this.style.display='none'">`:"";};
let LIST=[],cCls="ALL",cPos="ALL",cSea="";
async function init(){injectNav("champions.html");initFX();await loadDDragon();
  LIST=CHAMPIONS.map(c=>({...c,lanes:(lanesOf(c)||[]).map(l=>P2E[l]||l),tier:tierFor(c.id)}));
  bind();grid();table();}
function bind(){document.getElementById("search").addEventListener("input",e=>{cSea=e.target.value.trim().toLowerCase();grid();table();});
  document.querySelectorAll(".cls-btn").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".cls-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");cCls=b.dataset.cls;grid();table();}));
  document.querySelectorAll(".role-tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".role-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");cPos=b.dataset.pos;table();}));}
const filt=()=>LIST.filter(c=>(cCls==="ALL"||c.tags.includes(cCls))&&(cPos==="ALL"||c.lanes.includes(cPos))&&(!cSea||c.name.toLowerCase().includes(cSea)));
function grid(){const g=document.getElementById("champ-grid");const l=LIST.filter(c=>(cCls==="ALL"||c.tags.includes(cCls))&&(!cSea||c.name.toLowerCase().includes(cSea)));
  if(!l.length){g.innerHTML=`<div class="mh-empty">Sin resultados</div>`;return;}
  g.innerHTML=l.map(c=>`<div class="cg-item" data-champ="${c.id}" title="${c.name}"><img src="${champIcon(c.id)}" loading="lazy"><span>${c.name}</span></div>`).join("");
  g.querySelectorAll(".cg-item").forEach(el=>el.addEventListener("click",()=>open(el.dataset.champ)));}
function table(){const b=document.getElementById("tl-body"),n=document.getElementById("tl-note"),rk={S:0,A:1,B:2,C:3};
  const l=filt().slice().sort((a,b)=>rk[a.tier.k]-rk[b.tier.k]||a.name.localeCompare(b.name));
  n.textContent=`${l.length} campeones${cPos!=="ALL"?` · ${posLabel(cPos)}`:""}${cCls!=="ALL"?` · ${cCls}`:""}`;
  if(!l.length){b.innerHTML=`<div class="mh-empty">Sin resultados</div>`;return;}
  b.innerHTML=l.map((c,i)=>{const r=cPos!=="ALL"?cPos:c.lanes[0];
    return`<div class="tl-row" data-champ="${c.id}"><span class="c-rank">${i+1}</span><span class="c-champ"><img src="${champIcon(c.id)}" loading="lazy"><b>${c.name}</b></span><span class="c-tier"><span class="tier-badge" style="background:${c.tier.c}">${c.tier.label}</span></span><span class="c-role">${c.lanes.map(posEmoji).join(" ")}</span><span class="c-links"><a class="mini-btn" href="${dpmChamp(c.id.toLowerCase(),DPM_ROLE[r])}" target="_blank" rel="noopener" onclick="event.stopPropagation()">DPM</a><a class="mini-btn" href="https://www.op.gg/lol/champions/${c.id.toLowerCase()}/build/${DPM_ROLE[r]}" target="_blank" rel="noopener" onclick="event.stopPropagation()">OP.GG</a></span></div>`;}).join("");
  b.querySelectorAll(".tl-row").forEach(r=>r.addEventListener("click",()=>open(r.dataset.champ)));}
function open(id){const c=LIST.find(x=>x.id===id);if(!c)return;let ov=document.getElementById("champ-modal");
  if(!ov){ov=document.createElement("div");ov.className="modal-overlay";ov.id="champ-modal";
    ov.innerHTML=`<div class="modal modal-sm"><button class="modal-close" data-close-champ>✕</button><div id="cmc"></div></div>`;document.body.appendChild(ov);
    ov.addEventListener("click",e=>{if(e.target.id==="champ-modal"||e.target.hasAttribute("data-close-champ")){ov.classList.remove("show");document.body.style.overflow="";}});}
  const box=document.getElementById("cmc");ov.classList.add("show");document.body.style.overflow="hidden";const s=c.id.toLowerCase();
  const b=buildFor(c),pt={ad:"Daño físico (AD)",ap:"Daño mágico (AP)",tank:"Tanque"}[b.prof];
  box.innerHTML=`<div class="cb-head"><img src="${champIcon(c.id)}" class="cb-img"><div><div class="cb-name">${c.name} <span class="tier-badge" style="background:${c.tier.c}">${c.tier.label}</span></div><div class="cb-tags">${c.tags.join(" · ")}</div></div></div>
  <div class="cb-section">🛠️ Build orientativa <small>(${pt})</small></div>
  <div class="bd-line"><span class="bd-lbl">Inicio</span><div class="bd-items">${b.start.map(chip).join("")}</div></div>
  <div class="bd-line"><span class="bd-lbl">Botas</span><div class="bd-items">${chip(b.boots)}</div></div>
  <div class="bd-line"><span class="bd-lbl">Core</span><div class="bd-items">${b.core.map(chip).join("")}</div></div>
  <div class="bd-tip">Orientativa — pasa el ratón sobre cada objeto.</div>
  <div class="cb-section">📊 Meta real por rol</div>
  ${c.lanes.map(l=>`<div class="cb-role"><span class="cb-role-name">${posEmoji(l)} ${posLabel(l)}</span><div class="cb-links"><a class="btn" href="${dpmChamp(s,DPM_ROLE[l])}" target="_blank" rel="noopener">DPM.LOL</a><a class="btn" href="https://www.op.gg/lol/champions/${s}/build/${DPM_ROLE[l]}" target="_blank" rel="noopener">OP.GG</a></div></div>`).join("")}
  <div class="cb-section">🔎 Más</div><div class="cb-links"><a class="btn" href="https://dpm.lol/champions/${s}" target="_blank" rel="noopener">Estadísticas</a><a class="btn" href="https://www.op.gg/lol/champions/${s}/probuilds" target="_blank" rel="noopener">Pro builds</a><a class="btn" href="https://leagueoflegends.fandom.com/wiki/${encodeURIComponent(c.name)}" target="_blank" rel="noopener">Wiki</a></div>`;}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){const o=document.getElementById("champ-modal");if(o){o.classList.remove("show");document.body.style.overflow="";}}});
document.addEventListener("DOMContentLoaded",init);
