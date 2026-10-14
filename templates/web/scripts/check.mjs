import {audit} from './audit.mjs';
const r=await audit(process.cwd());
for(const f of r.findings)console.log(`[${f.severity}] ${f.id}: ${f.message}`);
console.log(JSON.stringify(r.summary));
if(r.summary.blockers)process.exitCode=1;
