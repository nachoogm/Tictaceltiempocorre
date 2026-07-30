/* /api/summoner — una cuenta suelta (buscador y "ver más") */
const ACCOUNT_ROUTING={euw1:"europe",eun1:"europe",tr1:"europe",ru:"europe",me1:"europe",na1:"americas",br1:"americas",la1:"americas",la2:"americas",kr:"asia",jp1:"asia",oc1:"sea",sg2:"sea",tw2:"sea",vn2:"sea"};
const CACHE=new Map();const TTL=5*60*1000;const PUUID_CACHE=new Map();const PUUID_TTL=6*60*60*1000;
async function riotGet(url,key,tries=2){for(let i=0;i<=tries;i++){const r=await fetch(url,{headers:{"X-Riot-Token":key}});if(r.status===429&&i<tries){const w=(parseInt(r.headers.get("Retry-After"))||1)*1000;await new Promise(s=>setTimeout(s,w));continue;}if(!r.ok){const e=new Error("Riot "+r.status);e.status=r.status;throw e;}return r.json();}}
async function getPuuid(acc,g,t,key){const ck=`${acc}:${g}#${t}`.toLowerCase();const h=PUUID_CACHE.get(ck);if(h&&(Date.now()-h.t)<PUUID_TTL)return h.puuid;const a=await riotGet(`https://${acc}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(g)}/${encodeURIComponent(t)}`,key);PUUID_CACHE.set(ck,{t:Date.now(),puuid:a.puuid});return a.puuid;}
module.exports=async function(context,req){
  const send=(s,b)=>{context.res={status:s,headers:{"Content-Type":"application/json","Cache-Control":"public, max-age=120"},body:b};};
  const key=(process.env.RIOT_API_KEY||"").trim();if(!key)return send(500,{error:"RIOT_API_KEY no configurada."});
  const riotId=(req.query.riotId||"").trim();const platform=(req.query.platform||"").trim().toLowerCase();
  if(!riotId.includes("#")||!ACCOUNT_ROUTING[platform])return send(400,{error:"Parámetros inválidos."});
  const ck=`${platform}:${riotId}`;const h=CACHE.get(ck);if(h&&(Date.now()-h.t)<TTL)return send(200,h.data);
  const [g,t]=riotId.split("#");const acc=ACCOUNT_ROUTING[platform];
  try{
    const puuid=await getPuuid(acc,g,t,key);
    const [sum,entries,mast]=await Promise.all([
      riotGet(`https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,key).catch(()=>({})),
      riotGet(`https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,key).catch(()=>[]),
      riotGet(`https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=3`,key).catch(()=>[])
    ]);
    const pick=q=>{const e=(entries||[]).find(x=>x.queueType===q);if(!e)return null;const gm=e.wins+e.losses;return{tier:e.tier,rank:e.rank,lp:e.leaguePoints,wins:e.wins,losses:e.losses,winrate:gm?Math.round((e.wins/gm)*100):0};};
    const data={riotId,gameName:g,tagLine:t,level:sum.summonerLevel||null,solo:pick("RANKED_SOLO_5x5"),flex:pick("RANKED_FLEX_SR"),topChamps:(mast||[]).map(m=>({championId:m.championId,points:m.championPoints,level:m.championLevel})),live:null};
    CACHE.set(ck,{t:Date.now(),data});return send(200,data);
  }catch(e){const s=e.status===404?404:(e.status===429?429:502);return send(s,{error:e.status===404?"Jugador no encontrado.":e.status===429?"Límite de la Riot API alcanzado.":"Error consultando la Riot API.",riotStatus:e.status||null});}
};
