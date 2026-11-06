import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { fileTypeFromBuffer } from 'file-type';
import { isSubsection, sameSubsection } from './subsection-taxonomy.mjs';
import { defaultArchiveCategory, isArchiveCategory } from './archive-taxonomy.mjs';
const scrypt = promisify(crypto.scrypt);
export function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
export async function passwordHash(password) { const salt=crypto.randomBytes(16).toString('hex');const derived=await scrypt(password,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024});return `scrypt$32768$8$3$${salt}$${derived.toString('hex')}`; }
export async function verifyPassword(password, stored, legacy=false) {
  if(typeof password!=='string'||password.length>1024||typeof stored!=='string')return false;
  if(stored.startsWith('scrypt$')){const parts=stored.split('$');const modern=parts.length===6&&parts[1]==='32768'&&parts[2]==='8'&&parts[3]==='3';const old=parts.length===3;if(!modern&&!old)return false;const salt=modern?parts[4]:parts[1],hex=modern?parts[5]:parts[2];if(!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{128}$/.test(hex))return false;const actual=await scrypt(password,salt,64,{N:modern?32768:16384,r:8,p:modern?3:1,maxmem:64*1024*1024});return crypto.timingSafeEqual(actual,Buffer.from(hex,'hex'));}
  if(legacy&&/^[a-f0-9]{64}$/.test(stored))return crypto.timingSafeEqual(crypto.createHash('sha256').update(password).digest(),Buffer.from(stored,'hex'));
  return false;
}
export const tokenHash = value => crypto.createHash('sha256').update(value||'').digest('hex');
export function text(value,label,max=1000,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))fail(422,`${label} tidak valid.`);return value.trim();}
export function validDate(value,label){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)fail(422,`${label} tidak valid.`);return value;}
export function validateArchive(b,u,db,subsections){
  if(!['incoming','outgoing','administrative'].includes(b.type))fail(422,'Jenis arsip tidak valid.');
  if(!isSubsection(b.subsection))fail(422,'Subbagian tidak valid.');
  if(u.role==='recorder'&&!sameSubsection(u.subsection,b.subsection))fail(403,'Pencatat hanya dapat mencatat arsip subbagiannya.');
  if(!db.classifications.includes(b.classification))fail(422,'Klasifikasi tidak terdaftar.');
  const category=b.category||defaultArchiveCategory(b.type);
  if(!isArchiveCategory(category,db.categories))fail(422,'Kategori arsip tidak terdaftar.');
  text(b.number,'Nomor surat',200,true);text(b.subject,'Perihal',2000,true);validDate(b.letterDate,'Tanggal surat');
  if(b.type==='incoming'){validDate(b.receivedDate,'Tanggal diterima');text(b.origin,'Asal surat',500,true);}else if(b.type==='outgoing'){text(b.destination,'Tujuan surat',500,true);text(b.signatory,'Penandatangan',300,true);}
}
export async function validateUpload(b){
  const name=text(b.fileName,'Nama berkas',180,true);if(/[\x00-\x1f\x7f/\\]/.test(name))fail(422,'Nama berkas tidak valid.');
  if(typeof b.data!=='string')fail(422,'Isi berkas wajib diisi.');const encoded=b.data.replace(/^data:[^;]+;base64,/,'');
  if(!encoded||encoded.length%4||!/^[a-zA-Z0-9+/]*={0,2}$/.test(encoded))fail(422,'Encoding berkas tidak valid.');
  const raw=Buffer.from(encoded,'base64');if(raw.length>15*1024*1024)fail(413,'Ukuran berkas maksimal 15 MB.');
  let actual;try{actual=await fileTypeFromBuffer(raw);}catch{fail(422,'Isi berkas tidak valid.');}
  const extensions={'application/pdf':['pdf'],'image/jpeg':['jpg','jpeg'],'image/png':['png'],'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['xlsx'],'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['docx']};
  const extension=name.split('.').at(-1).toLowerCase();if(!actual||!extensions[actual.mime]?.includes(extension)||b.mimeType!==actual.mime)fail(422,'Isi, ekstensi, dan jenis berkas harus sesuai (PDF, JPG, PNG, XLSX, DOCX).');
  return {raw,name,mime:actual.mime,checksum:crypto.createHash('sha256').update(raw).digest('hex')};
}
