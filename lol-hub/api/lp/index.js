/* /api/lp — histórico de LP COMPARTIDO (Azure Table Storage) */
const TABLE_NAME = "lphistory";
let _client = null, _initTried = false;
async function getClient(){
  if(_client) return _client;
  if(_initTried) return null;
  _initTried = true;
  const conn = (process.env.TABLES_CONNECTION_STRING||"").trim();
  if(!conn) return null;
  try{ const { TableClient } = require("@azure/data-tables"); _client = TableClient.fromConnectionString(conn, TABLE_NAME); await _client.createTable().catch(()=>{}); return _client; }catch(e){ return null; }
}
function todayStr(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function sanitizeKey(s){return String(s||"").replace(/[\\/#?\u0000-\u001F\u007F-\u009F]/g,"_").slice(0,240);}
module.exports = async function (context, req) {
  const send=(s,b)=>{context.res={status:s,headers:{"Content-Type":"application/json","Cache-Control":"no-store"},body:b};};
  const client = await getClient();
  if(!client) return send(503, { error:"Table Storage no configurado (falta TABLES_CONNECTION_STRING).", configured:false });
  try{
    if((req.method||"GET").toUpperCase()==="POST"){
      const b = req.body || {};const name = sanitizeKey(b.name);
      if(!name || b.abs==null) return send(400, { error:"Faltan datos (name, abs)." });
      await client.upsertEntity({partitionKey:name,rowKey:todayStr(),lp:Number(b.lp)||0,abs:Number(b.abs)||0,tier:String(b.tier||""),rank:String(b.rank||""),ts:Date.now()}, "Replace");
      return send(200, { ok:true, saved:{name, date:todayStr()} });
    }
    const days = Math.min(Math.max(parseInt(req.query.days||"21",10)||21, 1), 90);
    const cutoff = new Date(Date.now() - days*86400000);
    const cutStr = cutoff.getFullYear()+"-"+String(cutoff.getMonth()+1).padStart(2,"0")+"-"+String(cutoff.getDate()).padStart(2,"0");
    const out = {};
    for await (const e of client.listEntities()){
      if(e.rowKey < cutStr) continue;
      (out[e.partitionKey] = out[e.partitionKey] || []).push({ date:e.rowKey, lp:e.lp, abs:e.abs, tier:e.tier, rank:e.rank });
    }
    Object.values(out).forEach(arr=>arr.sort((a,b)=>a.date.localeCompare(b.date)));
    return send(200, { configured:true, days, players:out });
  }catch(e){ return send(500, { error:"Error accediendo a Table Storage.", detail:String(e&&e.message||e).slice(0,200) }); }
};
