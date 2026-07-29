/* =====================================================================
   /api/cron-lp — snapshot diario de LP de TODO el grupo (server-side)
   Lo dispara un GitHub Action a las 23:00. Protegido por un token simple.
   Recorre los jugadores, consulta su rango en Riot y hace upsert en la
   tabla "lphistory" (misma que usa /api/lp).
   ---------------------------------------------------------------------
   Requiere env: RIOT_API_KEY, TABLES_CONNECTION_STRING, CRON_SECRET
   Llamada:  GET/POST /api/cron-lp?key=<CRON_SECRET>
   ===================================================================== */
const PLATFORM = "euw1";
const ACCOUNT_ROUTING = { euw1:"europe" };
const TABLE_NAME = "lphistory";

// ⚠️ Mantén esta lista igual que la de config.js
const PLAYERS = [
  "Cebolokoh98#SOC","BARI POPPYNS#2025","MLVVND El Piruko#EUW","ette secht#EUW",
  "Hi Im Gonza#7385","Parisuko#EUW","tacua#EUW","Tacuoptero#3612","sukooo#suko"
];

const TIER_ORDER={IRON:0,BRONZE:1,SILVER:2,GOLD:3,PLATINUM:4,EMERALD:5,DIAMOND:6,MASTER:7,GRANDMASTER:8,CHALLENGER:9};
const DIV_ORDER={IV:0,III:1,II:2,I:3};
function absLp(s){if(!s)return null;return TIER_ORDER[s.tier]*400+(DIV_ORDER[s.rank]||0)*100+s.lp;}
function todayStr(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function sanitizeKey(s){return String(s||"").replace(/[\\/#?\u0000-\u001F\u007F-\u009F]/g,"_").slice(0,240);}

async function riotGet(url,key,tries=3){
  for(let i=0;i<=tries;i++){
    const r=await fetch(url,{headers:{"X-Riot-Token":key}});
    if(r.status===429&&i<tries){const w=(parseInt(r.headers.get("Retry-After"))||2)*1000;await new Promise(s=>setTimeout(s,w));continue;}
    if(!r.ok){const e=new Error(`Riot ${r.status}`);e.status=r.status;throw e;}
    return r.json();
  }
}

module.exports = async function (context, req) {
  const send=(s,b)=>{context.res={status:s,headers:{"Content-Type":"application/json"},body:b};};
  const secret=(process.env.CRON_SECRET||"").trim();
  const given=((req.query&&req.query.key)|| (req.headers&&req.headers["x-cron-key"]) ||"").trim();
  if(!secret || given!==secret) return send(401,{error:"No autorizado (key inválida)."});

  const riotKey=(process.env.RIOT_API_KEY||"").trim();
  const conn=(process.env.TABLES_CONNECTION_STRING||"").trim();
  if(!riotKey) return send(500,{error:"RIOT_API_KEY no configurada."});
  if(!conn) return send(500,{error:"TABLES_CONNECTION_STRING no configurada."});

  let client;
  try{const {TableClient}=require("@azure/data-tables");client=TableClient.fromConnectionString(conn,TABLE_NAME);await client.createTable().catch(()=>{});}
  catch(e){return send(500,{error:"No se pudo iniciar Table Storage.",detail:String(e.message||e).slice(0,150)});}

  const acc=ACCOUNT_ROUTING[PLATFORM]||"europe";
  const results=[];
  for(const riotId of PLAYERS){
    try{
      const [gameName,tagLine]=riotId.split("#");
      const account=await riotGet(`https://${acc}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,riotKey);
      const entries=await riotGet(`https://${PLATFORM}.api.riotgames.com/lol/league/v4/entries/by-puuid/${account.puuid}`,riotKey);
      const e=(entries||[]).find(x=>x.queueType==="RANKED_SOLO_5x5");
      if(!e){results.push({riotId,skipped:"sin SoloQ"});continue;}
      const solo={tier:e.tier,rank:e.rank,lp:e.leaguePoints};
      const name=sanitizeKey(gameName);
      await client.upsertEntity({partitionKey:name,rowKey:todayStr(),lp:solo.lp,abs:absLp(solo),tier:solo.tier,rank:solo.rank,ts:Date.now()},"Replace");
      results.push({riotId,saved:`${solo.tier} ${solo.rank} ${solo.lp}LP`});
      await new Promise(s=>setTimeout(s,120)); // respeta rate limit
    }catch(err){results.push({riotId,error:String(err.status||err.message||err)});}
  }
  return send(200,{ok:true,date:todayStr(),count:results.length,results});
};
