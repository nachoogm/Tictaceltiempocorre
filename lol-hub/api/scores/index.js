/* =====================================================================
   /api/scores — leaderboards COMPARTIDOS genéricos (Azure Table Storage)
   Sirve para: ranking del Entreno, resultados del LoLdle, retos, etc.
   ---------------------------------------------------------------------
   GET  /api/scores?board=arena_aim        -> top del leaderboard (mejor por jugador)
   POST /api/scores {board, name, score, lower?}  -> guarda si es mejor marca
   ---------------------------------------------------------------------
   Requiere env: TABLES_CONNECTION_STRING.  Tabla: "scores"
   PartitionKey = board  ·  RowKey = nombre  ·  score, lower, ts
   ===================================================================== */
const TABLE_NAME="scores";
let _client=null,_tried=false;
async function getClient(){
  if(_client)return _client;if(_tried)return null;_tried=true;
  const conn=(process.env.TABLES_CONNECTION_STRING||"").trim();if(!conn)return null;
  try{const {TableClient}=require("@azure/data-tables");_client=TableClient.fromConnectionString(conn,TABLE_NAME);await _client.createTable().catch(()=>{});return _client;}catch(e){return null;}
}
function sane(s){return String(s||"").replace(/[\\/#?\u0000-\u001F\u007F-\u009F]/g,"_").slice(0,200);}

module.exports=async function(context,req){
  const send=(s,b)=>{context.res={status:s,headers:{"Content-Type":"application/json","Cache-Control":"no-store"},body:b};};
  const client=await getClient();
  if(!client)return send(503,{error:"Table Storage no configurado.",configured:false});
  try{
    if((req.method||"GET").toUpperCase()==="POST"){
      const b=req.body||{};const board=sane(b.board),name=sane(b.name);
      if(!board||!name||b.score==null)return send(400,{error:"Faltan datos (board, name, score)."});
      const score=Number(b.score)||0;const lower=!!b.lower;
      // leer marca actual para guardar solo si mejora
      let prev=null;try{prev=await client.getEntity(board,name);}catch(e){}
      let isRecord=false;
      if(!prev){isRecord=true;}
      else{isRecord = lower ? score<prev.score : score>prev.score;}
      if(isRecord){await client.upsertEntity({partitionKey:board,rowKey:name,score,lower,ts:Date.now()},"Replace");}
      return send(200,{ok:true,isRecord,score});
    }
    const board=sane(req.query.board);if(!board)return send(400,{error:"Falta board."});
    const rows=[];let lower=false;
    for await (const e of client.listEntities({queryOptions:{filter:`PartitionKey eq '${board.replace(/'/g,"''")}'`}})){rows.push({name:e.rowKey,score:e.score,ts:e.ts});lower=!!e.lower;}
    rows.sort((a,b)=>lower?a.score-b.score:b.score-a.score);
    return send(200,{configured:true,board,lower,scores:rows});
  }catch(e){return send(500,{error:"Error accediendo a Table Storage.",detail:String(e&&e.message||e).slice(0,150)});}
};
