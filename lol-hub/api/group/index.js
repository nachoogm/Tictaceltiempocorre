/* =====================================================================
   /api/group — ENDPOINT BATCH (la clave del rendimiento)
   ---------------------------------------------------------------------
   En vez de 24 peticiones desde el navegador, el front hace UNA sola y
   el servidor resuelve todas las cuentas contra Riot (latencia mínima
   Azure→Riot) con su propio control de rate limit + caché compartida.
     GET /api/group?what=ranks              -> rango/nivel/mains de todos
     GET /api/group?what=matches&count=3    -> historial de todos
     GET /api/group?what=live               -> estado en-partida de todos
   ===================================================================== */
const PLATFORM="euw1", ACC_ROUTE="europe";
/* ⚠️ Mantener sincronizado con config.js */
const ACCOUNTS=[
  "Cebolokoh98#SOC","nachotheboss98#EUW","BARI POPPYNS#2025",
  "MLVVND El Piruko#EUW","hhecarim benzema#EUW",
  "ette secht#EUW","KASSSSSSS#EUW",
  "Hi Im Gonza#7385",
  "Parisuko#EUW","sukooo#suko",
  "tacua#EUW","Tacuoptero#3612","tacuantino#3612"
];
const QUEUE={400:"Normal",420:"SoloQ",430:"Normal",440:"Flex",450:"ARAM",490:"Normal",700:"Clash",720:"ARAM Clash",900:"URF",1020:"One for All",1300:"Nexus Blitz",1400:"U. Spellbook",1700:"Arena",1900:"URF",0:"Personalizada"};
const RANKED={420:"solo",440:"flex"};

/* ---- cachés en memoria (compartidas por todos los usuarios) ---- */
const PUUID=new Map(), PUUID_TTL=6*60*60*1000;
const MATCH=new Map();                       // partidas: inmutables
const RESULT=new Map();                      // respuesta completa por 'what'
const TTL={ranks:3*60*1000, matches:3*60*1000, live:25*1000};

/* ---- rate limit servidor: token bucket 12/s, arranque suave ----
   Arranca con pocos tokens para que la primera ráfaga no supere 20/s. */
const RATE=12, BURST=5;
let bucket=BURST, lastRefill=Date.now();
async function token(){
  for(;;){
    const now=Date.now();
    bucket=Math.min(BURST,bucket+((now-lastRefill)/1000)*RATE); lastRefill=now;
    if(bucket>=1){bucket--;return;}
    await new Promise(r=>setTimeout(r,Math.ceil((1-bucket)/RATE*1000)));
  }
}
async function riotGet(url,key,tries=2){
  for(let i=0;i<=tries;i++){
    await token();
    const r=await fetch(url,{headers:{"X-Riot-Token":key}});
    if(r.status===429&&i<tries){const w=(parseInt(r.headers.get("Retry-After"))||1)*1000;await new Promise(s=>setTimeout(s,w));continue;}
    if(!r.ok){const e=new Error("Riot "+r.status);e.status=r.status;throw e;}
    return r.json();
  }
}
async function getPuuid(riotId,key){
  const ck=riotId.toLowerCase(); const h=PUUID.get(ck);
  if(h&&(Date.now()-h.t)<PUUID_TTL)return h.v;
  const [n,t]=riotId.split("#");
  const a=await riotGet(`https://${ACC_ROUTE}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(n)}/${encodeURIComponent(t)}`,key);
  PUUID.set(ck,{t:Date.now(),v:a.puuid}); return a.puuid;
}
/* concurrencia controlada */
async function mapLimit(arr,limit,fn){
  const out=new Array(arr.length); let i=0;
  await Promise.all(Array.from({length:Math.min(limit,arr.length)},async()=>{
    while(i<arr.length){const idx=i++;try{out[idx]=await fn(arr[idx]);}catch(e){out[idx]={error:String(e.status||e.message||e)};}}
  }));
  return out;
}

async function buildRanks(key){
  return mapLimit(ACCOUNTS,5,async riotId=>{
    const puuid=await getPuuid(riotId,key);
    const [sum,entries,mast]=await Promise.all([
      riotGet(`https://${PLATFORM}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,key).catch(()=>({})),
      riotGet(`https://${PLATFORM}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,key).catch(()=>[]),
      riotGet(`https://${PLATFORM}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=3`,key).catch(()=>[])
    ]);
    const pick=q=>{const e=(entries||[]).find(x=>x.queueType===q);if(!e)return null;const g=e.wins+e.losses;
      return{tier:e.tier,rank:e.rank,lp:e.leaguePoints,wins:e.wins,losses:e.losses,winrate:g?Math.round((e.wins/g)*100):0};};
    return{riotId,level:sum.summonerLevel||null,solo:pick("RANKED_SOLO_5x5"),flex:pick("RANKED_FLEX_SR"),
      topChamps:(mast||[]).map(m=>({championId:m.championId,points:m.championPoints,level:m.championLevel})),live:null};
  });
}
async function buildMatches(key,count){
  return mapLimit(ACCOUNTS,4,async riotId=>{
    const puuid=await getPuuid(riotId,key);
    const ids=await riotGet(`https://${ACC_ROUTE}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`,key);
    const matches=[];
    for(const id of ids){
      let m=MATCH.get(id);
      if(!m){try{m=await riotGet(`https://${ACC_ROUTE}.api.riotgames.com/lol/match/v5/matches/${id}`,key);MATCH.set(id,m);}catch(e){continue;}}
      const me=(m.info.participants||[]).find(p=>p.puuid===puuid); if(!me)continue;
      matches.push({matchId:id,platform:PLATFORM,championName:me.championName,championId:me.championId,win:me.win,
        kills:me.kills,deaths:me.deaths,assists:me.assists,
        kda:me.deaths===0?(me.kills+me.assists):+(((me.kills+me.assists)/me.deaths).toFixed(1)),
        cs:(me.totalMinionsKilled||0)+(me.neutralMinionsKilled||0),position:me.teamPosition||"",
        ranked:RANKED[m.info.queueId]||null,queue:QUEUE[m.info.queueId]||"Partida",
        durationMin:Math.round((m.info.gameDuration||0)/60),when:m.info.gameEndTimestamp||m.info.gameCreation||null});
    }
    return{riotId,matches};
  });
}
async function buildLive(key){
  return mapLimit(ACCOUNTS,5,async riotId=>{
    const puuid=await getPuuid(riotId,key);
    try{
      const g=await riotGet(`https://${PLATFORM}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,key);
      return{riotId,inGame:true,gameMode:g.gameMode,queue:QUEUE[g.gameQueueConfigId]||g.gameMode,
        minutes:Math.floor((g.gameLength||0)/60),mapId:g.mapId,
        bans:(g.bannedChampions||[]).map(b=>({championId:b.championId,teamId:b.teamId})),
        participants:(g.participants||[]).map(p=>({riotId:p.riotId||p.summonerName||"—",championId:p.championId,teamId:p.teamId,spell1:p.spell1Id,spell2:p.spell2Id,keystone:(p.perks&&p.perks.perkIds&&p.perks.perkIds[0])||0,isMe:p.puuid===puuid}))};
    }catch(e){ if(e.status===404) return {riotId,inGame:false}; return {riotId,inGame:false,error:String(e.status||e.message)}; }
  });
}

module.exports=async function(context,req){
  const send=(s,b)=>{context.res={status:s,headers:{"Content-Type":"application/json","Cache-Control":"public, max-age=60"},body:b};};
  const key=(process.env.RIOT_API_KEY||"").trim();
  if(!key)return send(500,{error:"RIOT_API_KEY no configurada."});
  const what=(req.query.what||"ranks").toLowerCase();
  const count=Math.min(Math.max(parseInt(req.query.count||"3",10)||3,1),10);
  const ck=what==="matches"?`matches:${count}`:what;
  const hit=RESULT.get(ck);
  if(hit&&(Date.now()-hit.t)<(TTL[what]||120000)) return send(200,{...hit.d,cached:true});
  try{
    let data;
    if(what==="matches")      data={what,count,players:await buildMatches(key,count)};
    else if(what==="live")    data={what,players:await buildLive(key)};
    else                      data={what:"ranks",players:await buildRanks(key)};
    data.ts=Date.now();
    RESULT.set(ck,{t:Date.now(),d:data});
    return send(200,data);
  }catch(e){
    const s=e.status===429?429:502;
    return send(s,{error:e.status===429?"Límite de la Riot API alcanzado.":(e.status===401||e.status===403)?"API key inválida.":"Error consultando la Riot API.",riotStatus:e.status||null});
  }
};
