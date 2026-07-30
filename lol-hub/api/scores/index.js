/* /api/scores — leaderboards compartidos */
const TABLE="scores";let _c=null,_tried=false;
async function cli(){if(_c)return _c;if(_tried)return null;_tried=true;const conn=(process.env.TABLES_CONNECTION_STRING||"").trim();if(!conn)return null;
  try{const {TableClient}=require("@azure/data-tables");_c=TableClient.fromConnectionString(conn,TABLE);await _c.createTable().catch(()=>{});return _c;}catch(e){return null;}}
function sane(s){return String(s||"").replace(/[\\/#?\u0000-\u001F\u007F-\u009F]/g,"_").slice(0,200);}
module.exports=async function(context,req){
  const send=(s,b)=>{context.res={status:s,headers:{"Content-Type":"application/json","Cache-Control":"no-store"},body:b};};
  const c=await cli();if(!c)return send(503,{error:"Table Storage no configurado.",configured:false});
  try{
    if((req.method||"GET").toUpperCase()==="POST"){
      const b=req.body||{};const board=sane(b.board),name=sane(b.name);
      if(!board||!name||b.score==null)return send(400,{error:"Faltan datos."});
      const score=Number(b.score)||0,lower=!!b.lower;
      let prev=null;try{prev=await c.getEntity(board,name);}catch(e){}
      const rec=!prev||(lower?score<prev.score:score>prev.score);
      if(rec)await c.upsertEntity({partitionKey:board,rowKey:name,score,lower,ts:Date.now()},"Replace");
      return send(200,{ok:true,isRecord:rec,score});
    }
    const board=sane(req.query.board);if(!board)return send(400,{error:"Falta board."});
    const rows=[];let lower=false;
    for await(const e of c.listEntities({queryOptions:{filter:`PartitionKey eq '${board.replace(/'/g,"''")}'`}})){rows.push({name:e.rowKey,score:e.score});lower=!!e.lower;}
    rows.sort((a,b)=>lower?a.score-b.score:b.score-a.score);
    return send(200,{configured:true,board,lower,scores:rows});
  }catch(e){return send(500,{error:"Error en Table Storage."});}
};
