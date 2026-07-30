/* /api/lp — histórico de LP compartido (Table Storage) */
const TABLE="lphistory";let _c=null,_tried=false;
async function cli(){if(_c)return _c;if(_tried)return null;_tried=true;const conn=(process.env.TABLES_CONNECTION_STRING||"").trim();if(!conn)return null;
  try{const {TableClient}=require("@azure/data-tables");_c=TableClient.fromConnectionString(conn,TABLE);await _c.createTable().catch(()=>{});return _c;}catch(e){return null;}}
function today(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function sane(s){return String(s||"").replace(/[\\/#?\u0000-\u001F\u007F-\u009F]/g,"_").slice(0,240);}
module.exports=async function(context,req){
  const send=(s,b)=>{context.res={status:s,headers:{"Content-Type":"application/json","Cache-Control":"no-store"},body:b};};
  const c=await cli();if(!c)return send(503,{error:"Table Storage no configurado.",configured:false});
  try{
    if((req.method||"GET").toUpperCase()==="POST"){
      const b=req.body||{};const name=sane(b.name);
      if(!name||b.abs==null)return send(400,{error:"Faltan datos."});
      await c.upsertEntity({partitionKey:name,rowKey:today(),lp:Number(b.lp)||0,abs:Number(b.abs)||0,tier:String(b.tier||""),rank:String(b.rank||""),ts:Date.now()},"Replace");
      return send(200,{ok:true});
    }
    const days=Math.min(Math.max(parseInt(req.query.days||"21",10)||21,1),90);
    const co=new Date(Date.now()-days*86400000);
    const cut=co.getFullYear()+"-"+String(co.getMonth()+1).padStart(2,"0")+"-"+String(co.getDate()).padStart(2,"0");
    const out={};
    for await(const e of c.listEntities()){if(e.rowKey<cut)continue;(out[e.partitionKey]=out[e.partitionKey]||[]).push({date:e.rowKey,lp:e.lp,abs:e.abs,tier:e.tier,rank:e.rank});}
    Object.values(out).forEach(a=>a.sort((x,y)=>x.date.localeCompare(y.date)));
    return send(200,{configured:true,days,players:out});
  }catch(e){return send(500,{error:"Error en Table Storage.",detail:String(e.message||e).slice(0,150)});}
};
