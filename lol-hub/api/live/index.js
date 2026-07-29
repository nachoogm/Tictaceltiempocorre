/* /api/live — partida EN VIVO de un jugador (spectator-v5). Caché PUUID + 30s partida + reintento 429 */
const ACCOUNT_ROUTING={euw1:"europe",eun1:"europe",tr1:"europe",ru:"europe",me1:"europe",na1:"americas",br1:"americas",la1:"americas",la2:"americas",kr:"asia",jp1:"asia",oc1:"sea",sg2:"sea",tw2:"sea",vn2:"sea"};
const QUEUE={400:"Normal Draft",420:"SoloQ",430:"Normal Blind",440:"Flex",450:"ARAM",490:"Normal",700:"Clash",720:"ARAM Clash",900:"URF",1020:"One for All",1300:"Nexus Blitz",1400:"U. Spellbook",1700:"Arena",1900:"URF",0:"Personalizada"};
const PUUID_CACHE=new Map();const LIVE_CACHE=new Map();const PUUID_TTL=6*60*60*1000;const LIVE_TTL=30*1000;
async function riotGet(url,key,tries=2){for(let i=0;i<=tries;i++){const r=await fetch(url,{headers:{"X-Riot-Token":key}});if(r.status===429&&i<tries){const w=(parseInt(r.headers.get("Retry-After"))||1)*1000;await new Promise(s=>setTimeout(s,w));continue;}if(!r.ok){const b=await r.text().catch(()=> "");const e=new Error(`Riot ${r.status}`);e.status=r.status;e.body=b;throw e;}return r.json();}}
async function getPuuid(acc,gameName,tagLine,key){const ck=`${acc}:${gameName}#${tagLine}`.toLowerCase();const h=PUUID_CACHE.get(ck);if(h&&(Date.now()-h.t)<PUUID_TTL)return h.puuid;const a=await riotGet(`https://${acc}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,key);PUUID_CACHE.set(ck,{t:Date.now(),puuid:a.puuid});return a.puuid;}
module.exports=async function(context,req){
  const send=(s,b)=>{context.res={status:s,headers:{"Content-Type":"application/json","Cache-Control":"public, max-age=30"},body:b};};
  const key=(process.env.RIOT_API_KEY||"").trim();if(!key)return send(500,{error:"RIOT_API_KEY no configurada en Azure."});
  const riotId=(req.query.riotId||"").trim();const platform=(req.query.platform||"").trim().toLowerCase();
  if(!riotId.includes("#")||!ACCOUNT_ROUTING[platform])return send(400,{error:"Parámetros inválidos."});
  const acc=ACCOUNT_ROUTING[platform];const [gameName,tagLine]=riotId.split("#");
  const ck=`${platform}:${riotId}`;const h=LIVE_CACHE.get(ck);if(h&&(Date.now()-h.t)<LIVE_TTL)return send(200,h.data);
  try{
    const puuid=await getPuuid(acc,gameName,tagLine,key);
    let g; try{ g=await riotGet(`https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,key); }
    catch(err){ if(err.status===404){const data={riotId,inGame:false};LIVE_CACHE.set(ck,{t:Date.now(),data});return send(200,data);} throw err; }
    const parts=(g.participants||[]).map(p=>({riotId:p.riotId||p.summonerName||"—",championId:p.championId,teamId:p.teamId,spell1:p.spell1Id,spell2:p.spell2Id,isMe:p.puuid===puuid}));
    const data={riotId,inGame:true,gameMode:g.gameMode,queue:QUEUE[g.gameQueueConfigId]||g.gameMode,minutes:Math.floor((g.gameLength||0)/60),mapId:g.mapId,bans:(g.bannedChampions||[]).map(b=>({championId:b.championId,teamId:b.teamId})),participants:parts};
    LIVE_CACHE.set(ck,{t:Date.now(),data});return send(200,data);
  }catch(e){const s=e.status===429?429:502;return send(s,{error:e.status===429?"Límite de la Riot API alcanzado.":(e.status===401||e.status===403)?"API key inválida o caducada.":"Error consultando la Riot API.",riotStatus:e.status||null,riotId,inGame:false});}
};
