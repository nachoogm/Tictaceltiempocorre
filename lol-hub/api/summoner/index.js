/* Azure Function: /api/summoner — rango (SoloQ+Flex), nivel, maestrías, en-partida */
const ACCOUNT_ROUTING = {
  euw1:"europe", eun1:"europe", tr1:"europe", ru:"europe", me1:"europe",
  na1:"americas", br1:"americas", la1:"americas", la2:"americas",
  kr:"asia", jp1:"asia", oc1:"sea", sg2:"sea", tw2:"sea", vn2:"sea"
};
const CACHE = new Map(); const TTL = 5*60*1000;
async function riotGet(url, key){
  const r = await fetch(url, { headers:{ "X-Riot-Token": key } });
  if(!r.ok){ const b = await r.text().catch(()=> ""); const e = new Error(`Riot ${r.status}`); e.status=r.status; e.body=b; throw e; }
  return r.json();
}
module.exports = async function (context, req) {
  const send=(s,b)=>{ context.res={ status:s, headers:{ "Content-Type":"application/json","Cache-Control":"public, max-age=120" }, body:b }; };
  const key=(process.env.RIOT_API_KEY||"").trim(); if(!key) return send(500,{error:"RIOT_API_KEY no configurada en Azure."});
  const riotId=(req.query.riotId||"").trim(); const platform=(req.query.platform||"").trim().toLowerCase();
  if(!riotId.includes("#")||!ACCOUNT_ROUTING[platform]) return send(400,{error:"Parámetros inválidos."});
  const ck=`${platform}:${riotId}`; const h=CACHE.get(ck); if(h&&(Date.now()-h.t)<TTL) return send(200,h.data);
  const [gameName,tagLine]=riotId.split("#"); const acc=ACCOUNT_ROUTING[platform];
  try{
    const account=await riotGet(`https://${acc}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, key);
    const puuid=account.puuid;
    const [summoner,entries,masteries,live]=await Promise.all([
      riotGet(`https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,key).catch(()=>({})),
      riotGet(`https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,key).catch(()=>[]),
      riotGet(`https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=3`,key).catch(()=>[]),
      riotGet(`https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,key)
        .then(g=>({inGame:true,gameMode:g.gameMode,gameLength:g.gameLength})).catch(()=>({inGame:false}))
    ]);
    const pick=q=>{ const e=entries.find(x=>x.queueType===q); if(!e) return null; const g=e.wins+e.losses;
      return { tier:e.tier,rank:e.rank,lp:e.leaguePoints,wins:e.wins,losses:e.losses,winrate:g?Math.round((e.wins/g)*100):0 }; };
    const data={ riotId,puuid, gameName:account.gameName||gameName,tagLine:account.tagLine||tagLine,
      level:summoner.summonerLevel||null, profileIconId:summoner.profileIconId??null,
      solo:pick("RANKED_SOLO_5x5"), flex:pick("RANKED_FLEX_SR"),
      topChamps:(masteries||[]).map(m=>({championId:m.championId,points:m.championPoints,level:m.championLevel})),
      live: live.inGame?{gameMode:live.gameMode,minutes:Math.floor((live.gameLength||0)/60)}:null };
    CACHE.set(ck,{t:Date.now(),data}); return send(200,data);
  }catch(e){
    const s=e.status===404?404:(e.status===429?429:502);
    return send(s,{ error: e.status===404?"Jugador no encontrado (revisa Riot ID / región)."
      : e.status===429?"Límite de la Riot API alcanzado."
      : (e.status===401||e.status===403)?"API key inválida o caducada." : "Error consultando la Riot API.",
      riotStatus:e.status||null, riotId });
  }
};
