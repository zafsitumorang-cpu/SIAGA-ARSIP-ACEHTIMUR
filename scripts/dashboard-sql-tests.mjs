import assert from 'node:assert/strict';
import {buildDashboardArchiveQuery} from '../lib/dashboard-sql.mjs';
let checks=0;const pass=message=>{checks++;console.log('✓ '+message);};
const employee=buildDashboardArchiveQuery({user:{role:'employee'},scopeValues:['Administrasi','administration']});
assert.ok(employee.aggregate.text.includes("a.subsection = ANY($1::text[])"));assert.ok(employee.aggregate.text.includes("FILTER (WHERE a.payload->>'type'='incoming')"));assert.deepEqual(employee.aggregate.values,[['Administrasi','administration']]);assert.deepEqual(employee.rows.values,employee.aggregate.values);pass('dashboard archive aggregates are scoped and parameterized');
const admin=buildDashboardArchiveQuery({user:{role:'admin'}});assert.ok(!admin.aggregate.text.includes('a.subsection = ANY'));assert.deepEqual(admin.aggregate.values,[]);pass('wide dashboard aggregate omits employee subsection predicate');
console.log(`${checks} dashboard SQL checks passed.`);
