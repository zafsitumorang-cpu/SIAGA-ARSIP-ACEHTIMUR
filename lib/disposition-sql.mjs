import {fail,text} from './security.mjs';
import {supervises,dispositionStatuses} from './dispositions.mjs';

function add(where,params,sql,value){params.push(value);where.push(sql.replace('?',`$${params.length}`));}
export function dispositionSqlFilters(params,user,scopeValues=[]){
  const filters={q:text(params.get('q')||'','Kata kunci',200).toLowerCase(),assignment:params.get('assignment')||(supervises(user)?'all':'mine'),status:params.get('status')||'',year:params.get('year')||''};
  if(!['all','mine','team'].includes(filters.assignment))fail(422,'Filter penugasan tidak valid.');
  if(filters.status&&!['active',...dispositionStatuses].includes(filters.status))fail(422,'Status disposisi tidak valid.');
  if(filters.year&&!/^\d{4}$/.test(filters.year))fail(422,'Tahun surat harus empat digit.');
  return {...filters,scopeValues:[...new Set(scopeValues)]};
}

export function buildDispositionListQuery({user,filters,page=1,pageSize=25,summary=false}){
  const where=['(a.payload->>\'deletedAt\' IS NULL OR a.payload->>\'deletedAt\' = \'\')'];const params=[];
  if(!supervises(user)){params.push(filters.scopeValues);where.push(`a.subsection = ANY($${params.length}::text[])`);}
  if(filters.assignment==='mine'){params.push(user.id);const userSlot=`$${params.length}`;params.push(filters.scopeValues);const scopeSlot=`$${params.length}`;where.push(`(d.payload->>'assignedUserId'=${userSlot} OR (COALESCE(d.payload->>'assignedUserId','')='' AND d.payload->>'assignedSubsection'=ANY(${scopeSlot}::text[]))`);}
  if(filters.assignment==='team'){params.push(filters.scopeValues);where.push(`COALESCE(d.payload->>'assignedUserId','')='' AND d.payload->>'assignedSubsection'=ANY($${params.length}::text[])`);}
  if(filters.status)where.push(filters.status==='active'?`d.payload->>'status' <> 'Selesai'`:(()=>{params.push(filters.status);return `d.payload->>'status'=$${params.length}`;})());
  if(filters.year)add(where,params,"a.payload->>'letterDate' LIKE ?",`${filters.year}-%`);
  if(filters.q){params.push(`%${filters.q}%`);const slot=`$${params.length}`;where.push(`concat_ws(' ',a.payload->>'number',a.payload->>'subject',d.payload->>'instruction',d.payload->>'assignedSubsection',u.payload->>'name') ILIKE ${slot}`);}
  const predicate=where.join(' AND ');
  const base=`FROM siaga_dispositions d JOIN siaga_archives a ON a.id=d.archive_id LEFT JOIN siaga_users u ON u.id=d.payload->>'assignedUserId' WHERE ${predicate}`;
  if(summary){
    const summaryWhere=['(a.payload->>\'deletedAt\' IS NULL OR a.payload->>\'deletedAt\' = \'\')'];const summaryParams=[];
    if(!supervises(user)){summaryParams.push(filters.scopeValues);summaryWhere.push(`a.subsection = ANY($${summaryParams.length}::text[])`);}
    const summaryPredicate=summaryWhere.join(' AND ');return {summary:{text:`SELECT count(*) FILTER (WHERE d.payload->>'status' <> 'Selesai')::int AS active,count(*) FILTER (WHERE d.payload->>'status' = 'Selesai')::int AS completed,count(*)::int AS total ${base.replace(predicate,summaryPredicate)}`,values:summaryParams}};
  }
  const count={text:`SELECT count(*)::int AS total ${base}`,values:params};
  const limitSlot=params.length+1,offsetSlot=params.length+2,updateUserSlot=params.length+3,updateScopeSlot=params.length+4;
  const rowsValues=supervises(user)?[...params,pageSize,(page-1)*pageSize]:[...params,pageSize,(page-1)*pageSize,user.id,filters.scopeValues];
  const rows={text:`SELECT (COALESCE(d.payload,'{}'::jsonb) - 'notificationReads' - 'statusReceipts') || jsonb_build_object('archive',jsonb_build_object('id',a.id,'number',a.payload->>'number','subject',a.payload->>'subject','subsection',a.subsection,'letterDate',a.payload->>'letterDate','type',a.payload->>'type'),'assignedUserName',COALESCE(u.payload->>'name',d.payload->>'assignedSubsection'),'createdByName',COALESCE(c.payload->>'name',''),'canUpdate',${supervises(user)?'true':`(d.payload->>'assignedUserId'=$${updateUserSlot} OR (COALESCE(d.payload->>'assignedUserId','')='' AND d.payload->>'assignedSubsection'=ANY($${updateScopeSlot}::text[]))`}) AS payload FROM siaga_dispositions d JOIN siaga_archives a ON a.id=d.archive_id LEFT JOIN siaga_users u ON u.id=d.payload->>'assignedUserId' LEFT JOIN siaga_users c ON c.id=d.payload->>'createdBy' WHERE ${predicate} ORDER BY (d.payload->>'createdAt') DESC NULLS LAST,d.id LIMIT $${limitSlot} OFFSET $${offsetSlot}`,values:rowsValues};
  return {count,rows};
}

export function dispositionSqlPage(total,page,pageSize){const pages=Math.max(1,Math.ceil(total/pageSize));return {page:Math.min(page,pages),page_size:pageSize,total,pages};}
