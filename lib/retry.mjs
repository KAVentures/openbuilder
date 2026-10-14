import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const limits={preview:{identical:2,total:5},deploy:{identical:1,total:2}};
export function decideRetry(state,kind,signature) {
  if(!limits[kind]) throw Error('kind must be preview or deploy');
  if(typeof signature!=='string'||!signature.trim()||signature.length>500) throw Error('Provide an error signature (1–500 characters).');
  const fingerprint=crypto.createHash('sha256').update(signature.trim().toLowerCase()).digest('hex').slice(0,20);
  const group=state[kind] || {count:0,signatures:{}};
  const same=group.signatures[fingerprint]||0;
  const allowed=group.count<limits[kind].total && same<limits[kind].identical;
  return {allowed,fingerprint,used:group.count,identicalFailures:same,maxTotal:limits[kind].total,maxIdentical:limits[kind].identical,
    guidance:allowed?'Proceed only if the root cause has been investigated.':'STOP: diagnose logs, change strategy, or explain blocker. Do not repeat identical deployments.'};
}
export async function retryCommand({operation,kind,signature,project,reason}) {
  const file=path.join(project,'.openbuilder','retries.json');
  if(!['allow','record','reset'].includes(operation)) throw Error('retry operation must be allow, record or reset');
  if(operation==='reset') {
    if(!reason || reason.trim().length<10) throw Error('Reset requires a meaningful reason (at least 10 characters).');
    await fs.mkdir(path.dirname(file),{recursive:true});
    await fs.writeFile(file,JSON.stringify({preview:{count:0,signatures:{}},deploy:{count:0,signatures:{}},resetReason:reason},null,2)+'\n',{mode:0o600});
    return {allowed:true,reset:true,reason};
  }
  let state={};
  try {state=JSON.parse(await fs.readFile(file,'utf8'));} catch(e) { if(e.code!=='ENOENT') throw e; }
  const result=decideRetry(state,kind,signature);
  if(operation==='record'&&result.allowed){
    const g=state[kind] || {count:0,signatures:{}};
    g.count++;
    g.signatures[result.fingerprint]=(g.signatures[result.fingerprint]||0)+1;
    state[kind]=g;
    await fs.mkdir(path.dirname(file),{recursive:true});
    await fs.writeFile(file,JSON.stringify(state,null,2)+'\n',{mode:0o600});
  }
  return {...result,recorded:operation==='record'&&result.allowed};
}
