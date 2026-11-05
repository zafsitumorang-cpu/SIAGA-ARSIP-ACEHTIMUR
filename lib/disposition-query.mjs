import {fail,text} from './security.mjs';
import {supervises,canUpdateDisposition,dispositionStatuses} from './dispositions.mjs';

export function dispositionWorklist(archives,user,params){
  const filters={q:text(params.get('q')||'','Kata kunci',200).toLowerCase(),assignment:params.get('assignment')||(supervises(user)?'all':'mine'),status:params.get('status')||'',year:params.get('year')||''};
  if(!['all','mine','team'].includes(filters.assignment))fail(422,'Filter penugasan tidak valid.');
  if(filters.status&&!['active',...dispositionStatuses].includes(filters.status))fail(422,'Status disposisi tidak valid.');
  if(filters.year&&!/^\d{4}$/.test(filters.year))fail(422,'Tahun surat harus empat digit.');
  const scoped=archives.filter(archive=>supervises(user)||archive.subsection===user.subsection).flatMap(archive=>archive.dispositions.map(disposition=>({...disposition,archive:{id:archive.id,number:archive.number,subject:archive.subject,subsection:archive.subsection,letterDate:archive.letterDate,type:archive.type},canUpdate:canUpdateDisposition(user,disposition)})));
  const actionable=scoped.filter(item=>item.canUpdate);
  const summary={active:actionable.filter(item=>item.status!=='Selesai').length,completed:actionable.filter(item=>item.status==='Selesai').length,total:actionable.length};
  const rows=scoped.filter(item=>{
    const mine=item.assignedUserId?item.assignedUserId===user.id:Boolean(user.subsection&&item.assignedSubsection===user.subsection);
    return (filters.assignment==='all'||(filters.assignment==='mine'?mine:!item.assignedUserId))
      &&(!filters.status||(filters.status==='active'?item.status!=='Selesai':item.status===filters.status))
      &&(!filters.year||item.archive.letterDate?.startsWith(filters.year))
      &&(!filters.q||[item.archive.number,item.archive.subject,item.instruction,item.assignedUserName,item.assignedSubsection].some(value=>String(value||'').toLowerCase().includes(filters.q)));
  });
  return {rows,summary,filters};
}
