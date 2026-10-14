import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const limits={preview:{identical:2,total:5},deploy:{identical:1,total:2}};
function normalize(s){
 return s.trim().toLowerCase().replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi,'<id>')
  .replace(/\b\d{4}-\d\d-\d\d[t ]\d\d:\d\d:[^\s]+/g,'<time>')
  .replace(/:\d+(?=\b|:)/g,':<line>').replace(/\b[0-9a-f]{32,64}\b/g,'<hash>')
  .replace(/\s+/g,' ').slice(0,450);
}
export function decideRetry(state,kind,signature){
 if(!limits[kind])throw Error('kind must be preview or deploy');
 if(typeof signature!=='string'||!signature.trim()||signature.length>500)throw Error('Supply a short, nonempty failure signature (max 500 chars).');
 const fingerprint=crypto.createHash('sha256').update(normalize(signature)).digest('hex').slice(0,20);
 const group=state[kind]||{count:0,signatures:{}},same=group.signatures[fingerprint]||0;
 const allowed=group.count<limits[kind].total&&same<limits[kind].identical;
 return {allowed,fingerprint,used:group.count,identicalFailures:same,maxTotal:limits[kind].total,maxIdentical:limits[kind].identical,
  guidance:allowed?'Investigate and change the cause before proceeding.':'STOP. Examine logs, change strategy or report a blocker. Do not retry deployments.'};
}
export async function retryCommand({operation,kind,signature,project,reason,ownerApproved=false}){
 const file=path.join(project,'.github','openbuilder','retries.json');
 if(!['allow','record','reset'].includes(operation))throw Error('retry operation must be allow, record or reset');
 let state={};
 try{state=JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(operation==='reset'){
  if(!ownerApproved)throw Error('The owner must explicitly approve retry reset: --owner-approved.');
  if(!reason||reason.trim().length<25)throw Error('Reset requires at least 25 characters explaining diagnosis and remediation.');
  const cleared={version:1,preview:{count:0,signatures:{}},deploy:{count:0,signatures:{}},
   resets:[...(state.resets||[]),{at:new Date().toISOString(),reason}]};
  await fs.mkdir(path.dirname(file),{recursive:true});
  await fs.writeFile(file,JSON.stringify(cleared,null,2)+'\n',{mode:0o600});
  return {allowed:true,reset:true,reason};
 }
 const result=decideRetry(state,kind,signature);
 if(operation==='record'&&result.allowed){
  const group=state[kind]||{count:0,signatures:{}};
  group.count++;group.signatures[result.fingerprint]=(group.signatures[result.fingerprint]||0)+1;
  state[kind]=group;state.version=1;
  await fs.mkdir(path.dirname(file),{recursive:true});
  await fs.writeFile(file,JSON.stringify(state,null,2)+'\n',{mode:0o600});
 }
 return {...result,recorded:operation==='record'&&result.allowed};
}
