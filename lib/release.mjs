import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {audit} from './audit.mjs';

async function run(project,command,args) {
  return new Promise(resolve=>{
    const child=spawn(command,args,{cwd:project,stdio:'ignore',shell:false,env:{...process.env,CI:'1'}});
    const timeout=setTimeout(()=>child.kill('SIGKILL'),120000);
    child.once('error',()=>{clearTimeout(timeout);resolve(false);});
    child.once('exit',code=>{clearTimeout(timeout);resolve(code===0);});
  });
}
const manualGeneral=['rollback','error_tracking','mobile','performance','contact','legal_review','backup_restore','production_smoke_test'];
const whenFeature={auth:['auth_routes','password_reset'],database:['rls_isolation'],email:['email_deliverability'],payments:['payment_e2e'],ai:['spending_limits','rate_limits'],personalData:['privacy_review'],indexed:['search_console','public_seo_review']};
export async function release(project) {
  const report=await audit(project);
  const steps=[{name:'Static security and configuration audit',status:report.summary.blockers?'blocked':'pass',detail:`${report.summary.blockers} blockers, ${report.scannedFiles} files scanned`}];
  let manifest={};
  try {manifest=JSON.parse(await fs.readFile(path.join(project,'openbuilder.json'),'utf8'));}
  catch {steps.push({name:'Project manifest',status:'blocked',detail:'Missing or invalid openbuilder.json'});}
  let evidence={};
  try {evidence=JSON.parse(await fs.readFile(path.join(project,'.openbuilder','launch-evidence.json'),'utf8'));}
  catch { /* no evidence means no attestation */ }
  let scripts={};
  try {scripts=JSON.parse(await fs.readFile(path.join(project,'package.json'),'utf8')).scripts||{};}
  catch { /* standalone game */ }
  if(scripts.test) steps.push({name:'Project tests',status:await run(project,'npm',['test'])?'pass':'blocked',detail:'npm test (exit status only)'});
  else steps.push({name:'Project tests',status:manifest.template==='game'?'manual':'blocked',detail:'No automated project test command'});
  if(scripts.build) steps.push({name:'Production build',status:await run(project,'npm',['run','build'])?'pass':'blocked',detail:'npm run build (exit status only)'});
  else steps.push({name:'Production build',status:manifest.template==='game'?'manual':'blocked',detail:'No production build configured'});
  const required=[...manualGeneral];
  for(const [feature,checks] of Object.entries(whenFeature)) if(manifest.features?.[feature]) required.push(...checks);
  for(const name of required){
    const item=evidence.checks?.[name];
    const valid=item?.verified===true && typeof item.notes==='string' && item.notes.trim().length>=15 && !Number.isNaN(Date.parse(item.at));
    steps.push({name:`Manual: ${name}`,status:valid?'attested':'blocked',detail:valid?'Owner-supplied attestation (not independently verified)':'Add timestamp and meaningful test evidence to .openbuilder/launch-evidence.json'});
  }
  return {version:1,project:path.basename(project),ready:steps.every(s=>['pass','attested'].includes(s.status)),steps,
    warning:'Attestation is not independent security verification. No hosting, payment, email, DB restore or live domain tests are executed by release.'};
}
