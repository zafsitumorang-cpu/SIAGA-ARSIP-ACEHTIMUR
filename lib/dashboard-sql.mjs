export function buildDashboardArchiveQuery({user,scopeValues=[]}){
  const where=["(a.payload->>'deletedAt' IS NULL OR a.payload->>'deletedAt' = '')"],values=[];
  if(!['admin','leader'].includes(user.role)){values.push(scopeValues);where.push(`a.subsection = ANY($${values.length}::text[])`);}
  const predicate=where.join(' AND ');
  return {
    aggregate:{text:`SELECT count(*)::int AS total,count(*) FILTER (WHERE a.payload->>'type'='incoming')::int AS incoming,count(*) FILTER (WHERE a.payload->>'type'='outgoing')::int AS outgoing ${'FROM siaga_archives a WHERE '+predicate}`,values},
    rows:{text:`SELECT a.payload FROM siaga_archives a WHERE ${predicate}`,values}
  };
}
