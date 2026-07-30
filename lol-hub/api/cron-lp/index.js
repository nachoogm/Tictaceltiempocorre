/* /api/cron-lp — snapshot diario de LP + purga 90 días
   ⚠️ Sincronizar PLAYERS con config.js y api/group/index.js */
const PLATFORM="euw1",ACC="europe",TABLE="lphistory",RETENTION_DAYS=90;
const PLAYERS=[
  "Cebolokoh98#SOC","nachotheboss98#EUW","BARI POPPYNS#2025",
  "MLVVND El Piruko#EUW","hhecarim benzema#EUW",
  "ette secht#EUW","KASSSSSSS#EUW","Hi Im Gonza#7385",
  "Parisuko#EUW","sukooo#suko",
  "tacua#EUW","Tacuoptero#3612","tacuantino#3612"
];
const T={IRON:0,BRONZE:1,SILVER:2,GOLD:3,PLATINUM:4,EMERALD:5,DIAMOND:6,MASTER:7,GRANDMASTER:8,CHALLENGER:9};
const D={IV:0,III:1,II:2,I:3};
function absLp(s){return T[s.tier]*400+(D[s.rank]||0)*100+s.lp;}
function ds(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function sane(s){return String(s||"").replace(/[\\/#?\u0000-\u001F\u007F-\u009F]/g,"_").slice(0,240);}
async function riotGet(url,key,tries=3){for(let i=0;i<=tries;i++){const r=await fetch(url,{headers:{"X-Riot-Token":key}});if(r.status===429&&i<tries){await new Promise(s=>setTimeout(s,(parseInt(r.headers.get("Retry-After"))||2)*1000));continue;}if(!r.ok){const e=new Error("Riot "+r.status);e.status=r.status;throw e;}return r.json();}}
module.exports=async function(context,req){
  const send=(s,b)=>{context.res={status:s,headers:{"Content-Type":"application/json"},body:b};};
  const secret=(process.env.CRON_SECRET||"").trim();
  const given=((req.query&&req.query.key)||(req.headers&&req.headers["x-cron-key"])||"").trim();
  if(!secret||given!==secret)return send(401,{error:"No autorizado."});
  const key=(process.env.RIOT_API_KEY||"").trim();const conn=(process.env.TABLES_CONNECTION_STRING||"").trim();
  if(!key)return send(500,{error:"RIOT_API_KEY no configurada."});
  if(!conn)return send(500,{error:"TABLES_CONNECTION_STRING no configurada."});
  let c;try{const {TableClient}=require("@azure/data-tables");c=TableClient.fromConnectionString(conn,TABLE);await c.createTable().catch(()=>{});}
  catch(e){return send(500,{error:"No se pudo iniciar Table Storage."});}
  const results=[];
  for(const riotId of PLAYERS){
    try{
      const [g,t]=riotId.split("#");
      const a=await riotGet(`https://${ACC}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(g)}/${encodeURIComponent(t)}`,key);
      const en=await riotGet(`https://${PLATFORM}.api.riotgames.com/lol/league/v4/entries/by-puuid/${a.puuid}`,key);
      const e=(en||[]).find(x=>x.queueType==="RANKED_SOLO_5x5");
      if(!e){results.push({riotId,skipped:"sin SoloQ"});continue;}
      const solo={tier:e.tier,rank:e.rank,lp:e.leaguePoints};
      await c.upsertEntity({partitionKey:sane(g),rowKey:ds(new Date()),lp:solo.lp,abs:absLp(solo),tier:solo.tier,rank:solo.rank,ts:Date.now()},"Replace");
      results.push({riotId,saved:`${solo.tier} ${solo.rank} ${solo.lp}LP`});
      await new Promise(s=>setTimeout(s,150));
    }catch(err){results.push({riotId,error:String(err.status||err.message)});}
  }
  let purged=0;
  try{const cut=ds(new Date(Date.now()-RETENTION_DAYS*86400000));const del=[];
    for await(const e of c.listEntities())if(e.rowKey<cut)del.push({pk:e.partitionKey,rk:e.rowKey});
    for(const d of del){try{await c.deleteEntity(d.pk,d.rk);purged++;}catch(e){}}}catch(e){}
  return send(200,{ok:true,date:ds(new Date()),count:results.length,purged,retentionDays:RETENTION_DAYS,results});
};
