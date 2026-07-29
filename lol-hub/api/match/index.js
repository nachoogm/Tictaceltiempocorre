/* /api/match — detalle COMPLETO enriquecido de una partida (10 jugadores + objetivos + bans) */
const REGION_ROUTING={euw1:"europe",eun1:"europe",tr1:"europe",ru:"europe",me1:"europe",na1:"americas",br1:"americas",la1:"americas",la2:"americas",kr:"asia",jp1:"asia",oc1:"sea",sg2:"sea",tw2:"sea",vn2:"sea"};
const QUEUE={400:"Normal Draft",420:"Clasificatoria SoloQ",430:"Normal Blind",440:"Clasificatoria Flex",450:"ARAM",490:"Normal",700:"Clash",720:"ARAM Clash",900:"URF",1020:"One for All",1300:"Nexus Blitz",1400:"Ultimate Spellbook",1700:"Arena",1900:"URF",0:"Personalizada"};
const CACHE=new Map();
async function riotGet(url,key,tries=2){for(let i=0;i<=tries;i++){const r=await fetch(url,{headers:{"X-Riot-Token":key}});if(r.status===429&&i<tries){const w=(parseInt(r.headers.get("Retry-After"))||1)*1000;await new Promise(s=>setTimeout(s,w));continue;}if(!r.ok){const b=await r.text().catch(()=> "");const e=new Error(`Riot ${r.status}`);e.status=r.status;e.body=b;throw e;}return r.json();}}
function inferRouting(matchId,platform){const prefix=(matchId.split("_")[0]||"").toLowerCase();if(REGION_ROUTING[prefix])return REGION_ROUTING[prefix];return REGION_ROUTING[(platform||"").toLowerCase()]||"europe";}
module.exports=async function(context,req){
  const send=(s,b)=>{context.res={status:s,headers:{"Content-Type":"application/json","Cache-Control":"public, max-age=86400"},body:b};};
  const key=(process.env.RIOT_API_KEY||"").trim();if(!key)return send(500,{error:"RIOT_API_KEY no configurada en Azure."});
  const matchId=(req.query.matchId||"").trim();const platform=(req.query.platform||"").trim().toLowerCase();
  if(!matchId.includes("_"))return send(400,{error:"matchId inválido."});
  const hit=CACHE.get(matchId);if(hit)return send(200,hit);
  const acc=inferRouting(matchId,platform);
  try{
    const m=await riotGet(`https://${acc}.api.riotgames.com/lol/match/v5/matches/${matchId}`,key);const info=m.info;
    const durSec=info.gameDuration||0; const durMin=durSec/60||1;
    const maxDmg=Math.max(1,...(info.participants||[]).map(p=>p.totalDamageDealtToChampions||0));
    const parts=(info.participants||[]).map(p=>{
      const cs=(p.totalMinionsKilled||0)+(p.neutralMinionsKilled||0);
      return {riotId:(p.riotIdGameName?`${p.riotIdGameName}#${p.riotIdTagline}`:(p.summonerName||"—")),
      championName:p.championName,championId:p.championId,champLevel:p.champLevel,teamId:p.teamId,position:p.teamPosition||"",
      kills:p.kills,deaths:p.deaths,assists:p.assists,kda:p.deaths===0?(p.kills+p.assists):+(((p.kills+p.assists)/p.deaths).toFixed(1)),
      cs,csPerMin:+(cs/durMin).toFixed(1),gold:p.goldEarned||0,damage:p.totalDamageDealtToChampions||0,damagePct:Math.round(((p.totalDamageDealtToChampions||0)/maxDmg)*100),
      damageTaken:p.totalDamageTaken||0,vision:p.visionScore||0,wards:p.wardsPlaced||0,wardsKilled:p.wardsKilled||0,
      largestMultiKill:p.largestMultiKill||0,doubleKills:p.doubleKills||0,tripleKills:p.tripleKills||0,quadraKills:p.quadraKills||0,pentaKills:p.pentaKills||0,
      items:[p.item0,p.item1,p.item2,p.item3,p.item4,p.item5,p.item6],spell1:p.summoner1Id,spell2:p.summoner2Id,
      keystone:(p.perks&&p.perks.styles&&p.perks.styles[0]&&p.perks.styles[0].selections&&p.perks.styles[0].selections[0]&&p.perks.styles[0].selections[0].perk)||0,win:p.win};});
    const teams=(info.teams||[]).map(t=>({teamId:t.teamId,win:t.win,bans:(t.bans||[]).map(b=>b.championId).filter(c=>c>0),objectives:{baron:t.objectives?.baron?.kills||0,dragon:t.objectives?.dragon?.kills||0,herald:t.objectives?.riftHerald?.kills||0,tower:t.objectives?.tower?.kills||0,inhibitor:t.objectives?.inhibitor?.kills||0}}));
    const data={matchId,queue:QUEUE[info.queueId]||"Partida",durationMin:Math.round(durSec/60),durationSec:durSec,when:info.gameEndTimestamp||info.gameCreation||null,participants:parts,teams};
    CACHE.set(matchId,data);return send(200,data);
  }catch(e){const s=e.status===404?404:(e.status===429?429:502);return send(s,{error:e.status===404?"Partida no encontrada.":e.status===429?"Límite de la Riot API alcanzado.":(e.status===401||e.status===403)?"API key inválida o caducada.":"Error consultando la Riot API.",riotStatus:e.status||null});}
};
