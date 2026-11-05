import path from 'node:path';
import {createStore} from '../lib/store.mjs';
import {inspectArchiveFiles} from '../lib/file-io.mjs';
if(process.argv.length>2)throw Error('Read-only command: no mutation arguments supported.');
const directory=path.resolve(process.env.DATA_DIR||'data');
const store=await createStore({file:path.join(directory,'data.json'),databaseUrl:process.env.DATABASE_URL});
try{await store.transaction(async data=>{
  if(!data)throw Error('Database belum tersedia.');
  console.log(JSON.stringify(await inspectArchiveFiles(data,path.join(directory,'files')),null,2));
});}finally{await store.close();}
