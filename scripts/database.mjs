import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import pg from 'pg';
import {createStore,emptyData,validateData} from '../lib/store.mjs';
import {passwordHash} from '../lib/security.mjs';
const databaseUrl=process.env.DATABASE_URL;if(!databaseUrl)throw Error('DATABASE_URL wajib diisi.');
const command=process.argv[2];
if(command==='migrate'){
  const pool=new pg.Pool({connectionString:databaseUrl});try{await pool.query(await fs.readFile(new URL('../db/schema.sql',import.meta.url),'utf8'));console.log('Schema PostgreSQL v1 siap.');}finally{await pool.end();}
}else if(['bootstrap','import','export'].includes(command)){
  const store=await createStore({databaseUrl});try{await store.transaction(async(current,dirty,replace)=>{
    if(command==='export'){const file=process.argv[3];if(!file)throw Error('Path export wajib.');const snapshot=structuredClone(current||emptyData());snapshot.sessions=[];await fs.writeFile(file,JSON.stringify(snapshot,null,2),{mode:0o600,flag:'wx'});console.log('Snapshot diekspor tanpa sesi.');return;}
    if(current)throw Error('Database tujuan harus kosong; tidak ada data yang ditimpa.');
    const username=process.env.BOOTSTRAP_ADMIN_USERNAME,password=process.env.BOOTSTRAP_ADMIN_PASSWORD;
    if(!username||!password||password.length<12)throw Error('Isi BOOTSTRAP_ADMIN_USERNAME dan BOOTSTRAP_ADMIN_PASSWORD minimal 12 karakter.');
    let data=command==='import'?validateData(JSON.parse(await fs.readFile(process.argv[3],'utf8'))):emptyData();
    if(command==='import'){for(const user of data.users){user.passwordHash=await passwordHash(crypto.randomBytes(32).toString('hex'));user.active=false;}}
    const admin=data.users.find(u=>u.username.toLowerCase()===username.toLowerCase());const account={id:admin?.id||`u_${crypto.randomUUID()}`,username,name:'Administrator Arsip',passwordHash:await passwordHash(password),role:'admin',subsection:null,email:'',active:true};
    if(admin)Object.assign(admin,account);else data.users.push(account);
    data.sessions=[];data.classifications.length||(data.classifications=['Administrasi umum']);data.categories.length||(data.categories=['Surat Masuk','Surat Keluar']);
    data.audit.push({id:`audit_${crypto.randomUUID()}`,actorId:account.id,action:command==='import'?'import_json':'bootstrap',entity:'system',entityId:'system',at:new Date().toISOString(),detail:'Inisialisasi terkontrol'});
    await replace(data);console.log(command==='import'?'Impor selesai; akun lama nonaktif, kata sandi lama tidak dipakai. Salin dan rekonsiliasi files secara terpisah.':'Admin awal dibuat tanpa data demo.');
  });}finally{await store.close();}
}else throw Error('Gunakan migrate | bootstrap | import PATH | export PATH');
