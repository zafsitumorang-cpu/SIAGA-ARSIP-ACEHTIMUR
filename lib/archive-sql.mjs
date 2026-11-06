const searchableFields=['id','agendaNumber','classificationCode','physicalLocation','sourceReference','number','origin','destination','subject','classification','category'];

function add(where, params, sql, value) { params.push(value); where.push(sql.replace('?', `$${params.length}`)); }

export function buildArchiveListQuery({user,filters,page=1,pageSize=25,classificationValues=[],categoryValues=[],scopeValues=[]}) {
  const where=["(a.payload->>'deletedAt' IS NULL OR a.payload->>'deletedAt' = '')"];
  const params=[];
  if(!['admin','leader'].includes(user.role)) { const scopes=[...new Set(scopeValues.length?scopeValues:[user.subsection])];params.push(scopes);where.push(`a.subsection = ANY($${params.length}::text[])`); }
  if(filters.type) add(where,params,"a.payload->>'type' = ?",filters.type);
  if(filters.year) add(where,params,"a.payload->>'letterDate' LIKE ?",`${filters.year}-%`);
  if(filters.from) add(where,params,"a.payload->>'letterDate' >= ?",filters.from);
  if(filters.to) add(where,params,"a.payload->>'letterDate' <= ?",filters.to);
  if(filters.subsection) add(where,params,'a.subsection = ?',filters.subsection);
  if(classificationValues.length) { params.push(classificationValues); where.push(`a.payload->>'classification' = ANY($${params.length}::text[])`); }
  if(categoryValues.length) { params.push(categoryValues); where.push(`a.payload->>'category' = ANY($${params.length}::text[])`); }
  if(filters.status) { params.push(filters.status); where.push(`EXISTS (SELECT 1 FROM siaga_dispositions ds WHERE ds.archive_id=a.id AND ds.payload->>'status'=$${params.length})`); }
  if(filters.q) { params.push(`%${filters.q}%`); const slot=`$${params.length}`;where.push(`concat_ws(' ',a.id,${searchableFields.map(field=>`a.payload->>'${field}'`).join(',')},a.subsection) ILIKE ${slot}`); }
  const predicate=where.join(' AND '),offset=(page-1)*pageSize;
  const count={text:`SELECT count(*)::int AS total FROM siaga_archives a WHERE ${predicate}`,values:params};
  const rowsParams=[...params,pageSize,offset];
  const rows={text:`SELECT a.payload || jsonb_build_object('dispositions',COALESCE(jsonb_agg(d.payload ORDER BY (d.payload->>'createdAt'),d.id) FILTER (WHERE d.id IS NOT NULL),'[]'::jsonb)) AS payload FROM siaga_archives a LEFT JOIN siaga_dispositions d ON d.archive_id=a.id WHERE ${predicate} GROUP BY a.id,a.payload ORDER BY (a.payload->>'createdAt') DESC NULLS LAST,a.id LIMIT $${rowsParams.length-1} OFFSET $${rowsParams.length}`,values:rowsParams};
  return {count,rows};
}

export function archiveSqlPage(total,page,pageSize) {
  const pages=Math.max(1,Math.ceil(total/pageSize));
  return {page:Math.min(page,pages),page_size:pageSize,total,pages};
}
