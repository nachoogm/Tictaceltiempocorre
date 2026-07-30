/* /api/live — partida en vivo de una cuenta */
const ACCOUNT_ROUTING={euw1:"europe",eun1:"europe",tr1:"europe",ru:"europe",me1:"europe",na1:"americas",br1:"americas",la1:"americas",la2:"americas",kr:"asia",jp1:"asia",oc1:"sea",sg2:"sea",tw2:"sea",vn2:"sea"};
const QUEUE={400:"Normal Draft",420:"SoloQ",430:"Normal Blind",440:"Flex",450:"ARAM",490:"Normal",700:"Clash",900:"URF",1700:"Arena",0:"Personalizada"};
const PUUID=new Map(),LIVE=new Map();const PUUID_TTL=6*60*60*1000,LIVE_TTL=25*1000;
async function riotGet(url,key,tries=2){for(let i=0;i<=tries;i++){const r=await fetch(url,{headers:{"X-Riot-Token":key}});if(r.status===429&&i<tries){await new Promise(s=>setTimeout(s,1000));continue;}if(!r.ok){const e=new Error("Riot "+r.status);e.status=r.status;throw e;}return r.json();}}
async function getPuuid(acc,g,t,key){const ck=`${acc}:${g}#${t}`.toLowerCase();const h=PUUID.get(ck);if(h&&(Date.now()-h.t)<PUUID_TTL)return h.puuid;const a=await riotGet(`https://${acc}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(g)}/${encodeURIComponent(t)}`,key);PUUID.set(ck,{t:Date.now(),puuid:a.puuid});return a.puuid;}
module.exports=async function(context,req){
  const send=(s,b)=>{context.res={status:s,headers:{"Content-Type":"application/json","Cache-Control":"public, max-age=25"},body:b};};
  const key=(process.env.RIOT_API_KEY||"").trim();if(!key)return send(500,{error:"RIOT_API_KEY no configurada."});
  const riotId=(req.query.riotId||"").trim();const platform=(req.query.platform||"").trim().toLowerCase();
  if(!riotId.includes("#")||!ACCOUNT_ROUTING[platform])return send(400,{error:"Parámetros inválidos."});
  const acc=ACCOUNT_ROUTING[platform];const [g,t]=riotId.split("#");
  const ck=`${platform}:${riotId}`;const h=LIVE.get(ck);if(h&&(Date.now()-h.t)<LIVE_TTL)return send(200,h.data);
  try{
    const puuid=await getPuuid(acc,g,t,key);
    let gm;try{gm=await riotGet(`https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,key);}
    catch(err){if(err.status===404){const data={riotId,inGame:false};LIVE.set(ck,{t:Date.now(),data});return send(200,data);}throw err;}
    const data={riotId,inGame:true,gameMode:gm.gameMode,queue:QUEUE[gm.gameQueueConfigId]||gm.gameMode,minutes:Math.floor((gm.gameLength||0)/60),mapId:gm.mapId,bans:(gm.bannedChampions||[]).map(b=>({championId:b.championId,teamId:b.teamId})),participants:(gm.participants||[]).map(p=>({riotId:p.riotId||p.summonerName||"—",championId:p.championId,teamId:p.teamId,spell1:p.spell1Id,spell2:p.spell2Id,keystone:(p.perks&&p.perks.perkIds&&p.perks.perkIds[0])||0,isMe:p.puuid===puuid}))};
    LIVE.set(ck,{t:Date.now(),data});return send(200,data);
  }catch(e){return send(502,{error:"Error consultando la Riot API.",riotStatus:e.status||null,riotId,inGame:false});}
};
