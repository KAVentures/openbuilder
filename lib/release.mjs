import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {audit} from './audit.mjs';
import {evaluateDesign} from './design-review.mjs';

const WEEK=7*86400*1000;
function safeExcerpt(s){
 return String(s).replace(/(?:sk-(?:proj-)?|sb_secret_|gh[pousr]_|re_)[A-Za-z0-9_-]{12,}/g,'[REDACTED_SECRET]')
  .replace(/-----BEGIN [^-]+ PRIVATE KEY-----[\s\S]*?-----END [^-]+ PRIVATE KEY-----/g,'[REDACTED_PRIVATE_KEY]')
  .trim().slice(-1800);
}
async function run(project,command,args){
 return await new Promise(resolve=>{
  const windows=process.platform==='win32'&&command==='npm';
  const exe=windows?'cmd.exe':command;
  const argv=windows?['/d','/s','/c','npm',...args]:args;
  const child=spawn(exe,argv,{cwd:project,stdio:['ignore','pipe','pipe'],shell:false,env:{...process.env,CI:'1'}});
  let output='',finished=false;
  const add=chunk=>{output=(output+chunk.toString('utf8')).slice(-8000);};
  child.stdout?.on('data',add);child.stderr?.on('data',add);
  const timeout=setTimeout(()=>child.kill('SIGKILL'),120000);
  const finish=(ok,reason)=>{if(finished)return;finished=true;clearTimeout(timeout);resolve({ok,detail:ok?'Command succeeded':safeExcerpt(reason||output)||'Command failed with no output'});};
  child.once('error',err=>finish(false,err.message));
  child.once('exit',code=>finish(code===0,code===0?'':`Exit status ${code}: ${output}`));
 });
}
const baseManual=['rollback','error_tracking','mobile','performance','contact','legal_review','backup_restore'];
const conditional={auth:['auth_routes','password_reset'],database:['rls_isolation'],email:['email_deliverability'],payments:['payment_e2e'],ai:['spending_limits','rate_limits'],personalData:['privacy_review'],indexed:['search_console','public_seo_review']};
function revision(project){
 try{
  const options={cwd:project,encoding:'utf8',timeout:3000,stdio:['ignore','pipe','ignore']};
  const root=execFileSync('git',['rev-parse','--show-toplevel'],options).trim();
  if(path.resolve(root).toLowerCase()!==path.resolve(project).toLowerCase())return null;
  return execFileSync('git',['rev-parse','--verify','HEAD'],options).trim();
 }catch{return null;}
}
export async function release(project){
 const report=await audit(project);
 const steps=[{name:'Static security and configuration audit',status:report.summary.blockers?'blocked':'pass',detail:`${report.summary.blockers} blockers; ${report.scannedFiles} scanned source files`}];
 let manifest=null;
 try{manifest=JSON.parse(await fs.readFile(path.join(project,'openbuilder.json'),'utf8'));}
 catch{steps.push({name:'Project manifest',status:'blocked',detail:'Missing or invalid openbuilder.json'});}
 if(manifest?.features?.designQuality){
  const design=await evaluateDesign(project);
  steps.push({name:'Visual design review',status:design.ready?'pass':'blocked',detail:design.ready?'Documented design decisions and reviews (claims, not independent visual proof)':design.issues.join(' | ')});
 }
 let evidence={};
 try{evidence=JSON.parse(await fs.readFile(path.join(project,'.openbuilder','launch-evidence.json'),'utf8'));}
 catch{}
 let scripts={};
 try{scripts=JSON.parse(await fs.readFile(path.join(project,'package.json'),'utf8')).scripts||{};}
 catch{}
 if(manifest?.template==='game'){
  let filesExist=false;
  try{await Promise.all(['index.html','style.css'].map(n=>fs.access(path.join(project,n))));filesExist=true;}catch{}
  const js=await run(project,'node',['--check','game.js']);
  const ok=filesExist&&js.ok;
  steps.push({name:'Game source checks',status:ok?'pass':'blocked',detail:ok?'Static resources and JavaScript syntax passed':js.detail});
  steps.push({name:'Game build',status:ok?'pass':'blocked',detail:'Static assets require no compilation; live browser E2E remains manual'});
 }else{
  for(const [name,command] of [['Project tests','test'],['Production build','build']]){
   if(!scripts[command]){steps.push({name,status:'blocked',detail:`Missing npm ${command} script`});continue;}
   const result=await run(project,'npm',['run',command]);
   steps.push({name,status:result.ok?'pass':'blocked',detail:result.detail});
  }
 }
 const sha=revision(project),age=Date.now();
 let remote=null;
 if(sha){
  try{remote=execFileSync('git',['remote','get-url','origin'],{cwd:project,encoding:'utf8',timeout:3000,stdio:['ignore','pipe','ignore']}).trim();}
  catch{}
 }
 const githubRemote=!!remote&&/^(?:https:\/\/github\.com\/|git@github\.com:)[A-Za-z0-9-]+\/[A-Za-z0-9._-]+(?:\.git)?$/.test(remote);
 steps.push({name:'GitHub source repository',status:githubRemote?'pass':'blocked',
  detail:githubRemote?'GitHub origin remote configured locally (online access/push permissions not independently verified)':
  'Application has no GitHub origin remote. Ask to connect an existing GitHub repo or approve a new private repo. Locally run: openbuilder github status; then github connect --repo owner/name --confirm or github create --confirm. Do this before production release.'});
 if(!sha)steps.push({name:'Git repository',status:'blocked',detail:'This app is not an initialized Git repository with its own first commit. In the app directory run: git init, git add ., git commit -m "Initial app". Configure Git name/email if asked. Do not use the toolkit parent repository.'});
 for(const name of [...baseManual,...Object.entries(conditional).flatMap(([feature,checks])=>manifest?.features?.[feature]?checks:[])]){
  const item=evidence.checks?.[name];
  const at=item?.at?Date.parse(item.at):NaN;
  const valid=item?.verified===true&&typeof item.notes==='string'&&item.notes.trim().length>=15
    &&Number.isFinite(at)&&at<=age+5*60*1000&&age-at<=WEEK
    &&!!sha&&item.commitSha===sha;
  steps.push({name:`Manual: ${name}`,status:valid?'attested':'blocked',detail:valid?'Owner attestation within 7 days for this Git commit (not independent verification)':!sha?'Run git init, git add . and git commit in this app directory first; then record the resulting commitSha.':'Recheck this item and record verified=true, current commitSha, recent at, and specific notes in ignored .openbuilder/launch-evidence.json'});
 }
 return {version:2,project:path.basename(project),revision:sha,ready:steps.every(s=>['pass','attested'].includes(s.status)),steps,warning:'This is not an independent security audit. Real production smoke tests are mandatory after release; nothing is deployed automatically.'};
}
