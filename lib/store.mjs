import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import {isDeepStrictEqual} from 'node:util';
export const emptyData=()=>({users:[],archives:[],classifications:[],categories:[],audit:[],notifications:[],sessions:[]});
export function validateData(data){for(const key of ['users','archives','classifications','categories','audit','notifications'])if(!Array.isArray(data[key]))throw Error(`Data ${key} rusak; startup dibatalkan tanpa reset.`);data.sessions||=[];return data;}
export async function atomicWrite(file,data,beforePublish=()=>{}){await fs.mkdir(path.dirname(file),{recursive:true,mode:0o700});const tmp=`${file}.${process.pid}.tmp`;const handle=await fs.open(tmp,'w',0o600);try{await handle.writeFile(JSON.stringify(data,null,2));await handle.sync();}finally{await handle.close();}beforePublish();await fs.rename(tmp,file);}
export async function createStore({file,databaseUrl}){
  const pool=databaseUrl?new pg.Pool({connectionString:databaseUrl,max:4}):null;let queue=Promise.resolve();
  async function load(client){
    if(!client){try{return validateData(JSON.parse(await fs.readFile(file,'utf8')));}catch(error){if(error.code==='ENOENT')return null;throw error;}}
    const version=await client.query("SELECT payload FROM siaga_meta WHERE id='schema_version'");if(version.rows[0]?.payload!==1)throw Error('Jalankan npm run db:migrate.');
    const data=emptyData();for(const key of ['users','archives','dispositions','audit','sessions','classifications','categories']){const result=await client.query(`SELECT payload FROM siaga_${key}`);data[key]=result.rows.map(row=>row.payload);}
    for(const archive of data.archives)archive.dispositions=data.dispositions.filter(d=>d.archiveId===archive.id).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt))||a.id.localeCompare(b.id)).map(({archiveId,...d})=>d);delete data.dispositions;
    data.audit.sort((a,b)=>String(b.at).localeCompare(String(a.at)));return data.users.length?data:null;
  }
  async function save(client,data,beforePublish){
    validateData(data);if(!client)return atomicWrite(file,data,beforePublish);
    const records={users:data.users,archives:data.archives.map(({dispositions,...a})=>a),dispositions:data.archives.flatMap(a=>a.dispositions.map(d=>({...d,archiveId:a.id}))),audit:data.audit,sessions:data.sessions,classifications:data.classifications.map(item=>{const value=typeof item==='string'?{id:item,label:item}:item;return {id:value.id||value.code||value.label,label:value.label,payload:value};}),categories:data.categories.map(item=>{const value=typeof item==='string'?{id:item,label:item}:item;return {id:value.id||value.code||value.label,label:value.label,payload:value};})};
    for(const [key,items]of Object.entries(records)){
      const old=await client.query(`SELECT id,payload FROM siaga_${key}`);const previous=new Map(old.rows.map(r=>[r.id,r.payload]));
      for(const item of items){const payload=['classifications','categories'].includes(key)?item.payload:item;const oldPayload=previous.get(item.id);if(isDeepStrictEqual(oldPayload,payload))continue;
        if(key==='users')await client.query('INSERT INTO siaga_users(id,username,payload) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET username=$2,payload=$3',[item.id,item.username.toLowerCase(),JSON.stringify(payload)]);
        else if(key==='archives')await client.query('INSERT INTO siaga_archives(id,subsection,recorded_by,payload) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET subsection=$2,payload=$4',[item.id,item.subsection,item.createdBy,JSON.stringify(payload)]);
        else if(key==='dispositions')await client.query('INSERT INTO siaga_dispositions(id,archive_id,payload) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET payload=$3',[item.id,item.archiveId,JSON.stringify(payload)]);
        else if(key==='audit')await client.query('INSERT INTO siaga_audit(id,occurred_at,payload) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[item.id,item.at,JSON.stringify(payload)]);
        else if(key==='sessions')await client.query('INSERT INTO siaga_sessions(id,user_id,expires_at,payload) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET payload=$4,expires_at=$3',[item.id,item.userId,new Date(item.expiresAt),JSON.stringify(payload)]);
        else await client.query(`INSERT INTO siaga_${key}(id,payload) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET payload=$2`,[item.id,JSON.stringify(payload)]);
      }
    }
    await client.query('DELETE FROM siaga_sessions WHERE NOT (id=ANY($1::text[]))',[data.sessions.map(s=>s.id)]);
  }
  return {
    async read(callback){
      if(!pool){const data=validateData(JSON.parse(await fs.readFile(file,'utf8')));return callback({client:null,data});}
      const client=await pool.connect();try{return await callback({client,data:null});}finally{client.release();}
    },
    async transaction(callback){
      const task=queue.then(async()=>{
        const client=pool?await pool.connect():null,rollback=[];
        let publicationStarted=false;
        const write=async data=>{await save(client,data,()=>{publicationStarted=true;});};
        try{
          if(client){await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(734291)');}
          const data=await load(client);let dirty=false;
          const result=await callback(data,()=>{dirty=true;},write,{onRollback:action=>rollback.push(action)});
          if(dirty)await write(data);
          if(client){publicationStarted=true;await client.query('COMMIT');}
          return result;
        }catch(error){
          // A lost COMMIT/rename response may mean metadata is already durable.
          // Retain binaries in that case for read-only reconciliation.
          if(!publicationStarted)for(const action of rollback.reverse())try{await action();}catch{console.error('File rollback cleanup failed.');}
          if(client)try{await client.query('ROLLBACK');}catch{}
          throw error;
        }finally{client?.release();}
      });queue=task.catch(()=>{});return task;
    },
    async close(){await queue;await pool?.end();}
  };
}
