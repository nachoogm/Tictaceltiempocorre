/* =====================================================================
   Azure Function: /api/matches
   Historial de las últimas partidas de un jugador (match-v5).
   ---------------------------------------------------------------------
   Query params:
     riotId   = "Nombre#TAG"   (obligatorio)
     platform = "euw1"|"na1"|...  (obligatorio)
     count    = nº de partidas (opcional, def. 4, máx. 8)
   ===================================================================== */
const ACCOUNT_ROUTING = {
  euw1:"europe", eun1:"europe", tr1:"europe", ru:"europe", me1:"europe",
  na1:"americas", br1:"americas", la1:"americas", la2:"americas",
  kr:"asia", jp1:"asia", oc1:"sea", sg2:"sea", tw2:"sea", vn2:"sea"
};
const QUEUE = {
  400:"Normal", 420:"SoloQ", 430:"Normal", 440:"Flex", 450:"ARAM",
  490:"Normal", 700:"Clash", 720:"ARAM Clash", 900:"URF", 1020:"One for All",
  1300:"Nexus Blitz", 1400:"Ultimate Spellbook", 1700:"Arena", 1900:"URF", 0:"Personalizada"
};

const LIST_CACHE = new Map();   // idList por 5 min
const MATCH_CACHE = new Map();  // partidas inmutables → caché larga
const LIST_TTL = 5 * 60 * 1000;

async function riotGet(url, key){
  const r = await fetch(url, { headers: { "X-Riot-Token": key } });
  if(!r.ok){ const body = await r.text().catch(()=> ""); const e = new Error(`Riot ${r.status}`); e.status = r.status; e.body = body; throw e; }
  return r.json();
}

module.exports = async function (context, req) {
  const send = (status, body) => { context.res = { status, headers:{ "Content-Type":"application/json", "Cache-Control":"public, max-age=180" }, body }; };
  const key = (process.env.RIOT_API_KEY || "").trim();
  if(!key) return send(500, { error:"RIOT_API_KEY no configurada en Azure." });

  const riotId = (req.query.riotId || "").trim();
  const platform = (req.query.platform || "").trim().toLowerCase();
  const count = Math.min(Math.max(parseInt(req.query.count || "4",10) || 4, 1), 8);
  if(!riotId.includes("#") || !ACCOUNT_ROUTING[platform]) return send(400, { error:"Parámetros inválidos." });

  const acc = ACCOUNT_ROUTING[platform];
  const [gameName, tagLine] = riotId.split("#");

  try{
    // 1) PUUID
    const account = await riotGet(`https://${acc}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, key);
    const puuid = account.puuid;

    // 2) lista de IDs de partidas (con caché de 5 min)
    const listKey = `${acc}:${puuid}:${count}`;
    let ids;
    const lhit = LIST_CACHE.get(listKey);
    if(lhit && (Date.now()-lhit.t) < LIST_TTL){ ids = lhit.ids; }
    else{
      ids = await riotGet(`https://${acc}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`, key);
      LIST_CACHE.set(listKey, { t:Date.now(), ids });
    }

    // 3) detalle de cada partida (caché permanente por matchId)
    const matches = [];
    for(const id of ids){
      let m = MATCH_CACHE.get(id);
      if(!m){
        try{ m = await riotGet(`https://${acc}.api.riotgames.com/lol/match/v5/matches/${id}`, key); MATCH_CACHE.set(id, m); }
        catch(err){ continue; }
      }
      const me = (m.info.participants || []).find(p => p.puuid === puuid);
      if(!me) continue;
      matches.push({
        matchId: id,
        championName: me.championName,
        championId: me.championId,
        win: me.win,
        kills: me.kills, deaths: me.deaths, assists: me.assists,
        kda: me.deaths === 0 ? (me.kills + me.assists) : +(((me.kills + me.assists)/me.deaths).toFixed(1)),
        cs: (me.totalMinionsKilled||0) + (me.neutralMinionsKilled||0),
        position: me.teamPosition || "",
        queue: QUEUE[m.info.queueId] || "Partida",
        durationMin: Math.round((m.info.gameDuration||0)/60),
        when: m.info.gameEndTimestamp || m.info.gameCreation || null
      });
    }

    return send(200, { riotId, count: matches.length, matches });
  }catch(e){
    const status = e.status===404?404:(e.status===429?429:502);
    return send(status, {
      error: e.status===404?"Jugador no encontrado."
           : e.status===429?"Límite de la Riot API alcanzado."
           : (e.status===401||e.status===403)?"API key inválida o caducada."
           : "Error consultando la Riot API.",
      riotStatus: e.status || null, riotId
    });
  }
};
