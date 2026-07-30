/* /api/matches — historial resumido (match-v5) */
const ACCOUNT_ROUTING={euw1:"europe",eun1:"europe",tr1:"europe",ru:"europe",me1:"europe",na1:"americas",br1:"americas",la1:"americas",la2:"americas",kr:"asia",jp1:"asia",oc1:"sea",sg2:"sea",tw2:"sea",vn2:"sea"};
const QUEUE={400:"Normal",420:"SoloQ",430:"Normal",440:"Flex",450:"ARAM",490:"Normal",700:"Clash",720:"ARAM Clash",900:"URF",1020:"One for All",1300:"Nexus Blitz",1400:"U. Spellbook",1700:"Arena",1900:"URF",0:"Personalizada"};
const RANKED={420:"solo",440:"flex"};
const LIST_CACHE=new Map();const MATCH_CACHE=new Map();const PUUID_CACHE=new Map();const LIST_TTL=5*60*1000;const PUUID_TTL=6*60*60*1000;
async function riotGet(url,key,tries=2){for(let i=0;i<=tries;i++){const r=await fetch(url,{headers:{"X-Riot-Token":key}});if(r.status===429&&i<tries){const w=(parseInt(r.headers.get("Retry-After"))||1)*1000;await new Promise(s=>setTimeout(s,w));continue;}if(!r.ok){const b=await r.text().catch(()=> "");const e=new Error(`Riot ${r.status}`);e.status=r.status;e.body=b;throw e;}return r.json();}}
async function getPuuid(acc,gameName,tagLine,key){const ck=`${acc}:${gameName}#${tagLine}`.toLowerCase();const h=PUUID_CACHE.get(ck);if(h&&(Date.now()-h.t)<PUUID_TTL)return h.puuid;const a=await riotGet(`https://${acc}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,key);PUUID_CACHE.set(ck,{t:Date.now(),puuid:a.puuid});return a.puuid;}
module.exports=async function(context,req){
  const send=(s,b)=>{context.res={status:s,headers:{"Content-Type":"application/json","Cache-Control":"public, max-age=180"},body:b};};
  const key=(process.env.RIOT_API_KEY||"").trim();if(!key)return send(500,{error:"RIOT_API_KEY no configurada en Azure."});
  const riotId=(req.query.riotId||"").trim();const platform=(req.query.platform||"").trim().toLowerCase();
  const count=Math.min(Math.max(parseInt(req.query.count||"4",10)||4,1),10);
  if(!riotId.includes("#")||!ACCOUNT_ROUTING[platform])return send(400,{error:"Parámetros inválidos."});
  const acc=ACCOUNT_ROUTING[platform];const [gameName,tagLine]=riotId.split("#");
  try{
    const puuid=await getPuuid(acc,gameName,tagLine,key);
    const lk=`${acc}:${puuid}:${count}`;let ids;const lh=LIST_CACHE.get(lk);
    if(lh&&(Date.now()-lh.t)<LIST_TTL){ids=lh.ids;}else{ids=await riotGet(`https://${acc}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`,key);LIST_CACHE.set(lk,{t:Date.now(),ids});}
    const matches=[];
    for(const id of ids){let m=MATCH_CACHE.get(id);if(!m){try{m=await riotGet(`https://${acc}.api.riotgames.com/lol/match/v5/matches/${id}`,key);MATCH_CACHE.set(id,m);}catch(err){continue;}}
      const me=(m.info.participants||[]).find(p=>p.puuid===puuid);if(!me)continue;
      matches.push({matchId:id,platform,championName:me.championName,championId:me.championId,win:me.win,kills:me.kills,deaths:me.deaths,assists:me.assists,kda:me.deaths===0?(me.kills+me.assists):+(((me.kills+me.assists)/me.deaths).toFixed(1)),cs:(me.totalMinionsKilled||0)+(me.neutralMinionsKilled||0),position:me.teamPosition||"",queueId:m.info.queueId,ranked:RANKED[m.info.queueId]||null,queue:QUEUE[m.info.queueId]||"Partida",durationMin:Math.round((m.info.gameDuration||0)/60),when:m.info.gameEndTimestamp||m.info.gameCreation||null});}
    return send(200,{riotId,count:matches.length,matches});
  }catch(e){const s=e.status===404?404:(e.status===429?429:502);return send(s,{error:e.status===404?"Jugador no encontrado.":e.status===429?"Límite de la Riot API alcanzado.":(e.status===401||e.status===403)?"API key inválida o caducada.":"Error consultando la Riot API.",riotStatus:e.status||null,riotId});}
};
