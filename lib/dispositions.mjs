import {fail,text} from './security.mjs';
import {sameSubsection} from './subsection-taxonomy.mjs';
export const supervises=user=>['admin','leader'].includes(user?.role);
export function canUpdateDisposition(user,disposition){
  return supervises(user)||Boolean(disposition.assignedUserId?disposition.assignedUserId===user?.id:user?.subsection&&sameSubsection(disposition.assignedSubsection,user.subsection));
}
export function dispositionRecipients(users,archive){
  return users.filter(user=>user.active&&sameSubsection(user.subsection,archive.subsection)&&!supervises(user)).map(({id,name,subsection})=>({id,name,subsection}));
}
export const dispositionStatuses=['Belum ditindaklanjuti','Sedang diproses','Selesai'];

export function dispositionUpdate(disposition,body,user,at){
  if(!dispositionStatuses.includes(body.status))fail(422,'Status tidak valid.');
  const note=text(body.note===undefined?'':body.note,'Catatan tindak lanjut',2000);
  const previousStatus=disposition.status,reopen=previousStatus==='Selesai'&&body.status!==previousStatus;
  if(reopen){
    if(!supervises(user))fail(403,'Hanya admin/pimpinan dapat membuka kembali tugas selesai.');
    if(body.status!=='Sedang diproses')fail(422,'Buka kembali ke status Sedang diproses.');
  }
  if((reopen||(previousStatus==='Sedang diproses'&&body.status==='Belum ditindaklanjuti'))&&!note)fail(422,'Alasan wajib untuk membuka kembali atau mengembalikan tugas.');
  if(body.status===previousStatus&&!note)return null;
  return {status:body.status,previousStatus,note,by:user.id,at,kind:reopen?'reopen':body.status===previousStatus?'note':'status'};
}
