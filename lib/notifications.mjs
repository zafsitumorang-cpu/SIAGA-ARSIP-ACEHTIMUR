import {fail} from './security.mjs';
import {supervises,canUpdateDisposition} from './dispositions.mjs';

export function notificationEvents(data,user){
  const events=[];
  for(const archive of data.archives){
    if(!supervises(user)&&archive.subsection!==user.subsection)continue;
    for(const disposition of archive.dispositions){
      if(!canUpdateDisposition(user,disposition))continue;
      const history=[{id:disposition.id,kind:'created',by:disposition.createdBy,at:disposition.createdAt,status:'Belum ditindaklanjuti'},...(disposition.updates||[]).map((update,index)=>({...update,id:update.id||`legacy_${disposition.id}_${index}`,kind:update.kind||'status'}))];
      for(const event of history){
        if(event.by===user.id)continue; // Your own action is feedback, not a new incoming notification.
        events.push({id:event.id,archiveId:archive.id,dispositionId:disposition.id,kind:event.kind,text:`${event.kind==='created'?'Disposisi baru':event.kind==='reopen'?'Disposisi dibuka kembali':event.kind==='note'?'Catatan tindak lanjut':'Status disposisi diperbarui'} untuk ${archive.number}`,subject:archive.subject,status:event.status,taskStatus:disposition.status,createdAt:event.at,byName:data.users.find(account=>account.id===event.by)?.name||'',read:Boolean(disposition.notificationReads?.[user.id]?.[event.id])});
      }
    }
  }
  return events.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))||a.id.localeCompare(b.id));
}

export function notificationPage(data,user,params=new URLSearchParams()){
  const value=params.get('page')||'1';if(!/^[1-9]\d*$/.test(value)||!Number.isSafeInteger(Number(value)))fail(422,'Halaman notifikasi tidak valid.');
  const events=notificationEvents(data,user),pages=Math.max(1,Math.ceil(events.length/20)),page=Math.min(Number(value),pages);
  const activeTasks=data.archives.filter(archive=>supervises(user)||archive.subsection===user.subsection).flatMap(archive=>archive.dispositions).filter(disposition=>canUpdateDisposition(user,disposition)&&disposition.status!=='Selesai').length;
  return {items:events.slice((page-1)*20,page*20),page,pages,total:events.length,unread:events.filter(event=>!event.read).length,activeTasks};
}

export function markNotifications(data,user,ids,read,at){
  const events=notificationEvents(data,user),selected=ids===null?events:events.filter(event=>ids.includes(event.id));
  if(ids!==null&&selected.length!==new Set(ids).size)fail(404,'Notifikasi tidak ditemukan dalam akses Anda.');
  let changed=0;
  for(const event of selected){
    if(event.read===read)continue;
    const disposition=data.archives.find(archive=>archive.id===event.archiveId).dispositions.find(item=>item.id===event.dispositionId);
    const reads=(disposition.notificationReads||={})[user.id]||=(Object.create(null));
    if(read)reads[event.id]=at;else delete reads[event.id];changed++;
  }
  return changed;
}
