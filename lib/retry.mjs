import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const limits={preview:{identical:2,total:5},deploy:{identical:1,total:2}};
function redact(value){
 return String(value)
  .replace(/\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,'[REDACTED_KEY]')
  .replace(/\bsb_secret_[A-Za-z0-9_-]{12,}\b/g,'[REDACTED_KEY]')
  .replace(/\bgh[pousr]_[A-Za-z0-9_]{25,}\b/g,'[REDACTED_KEY]')
  .replace(/\bre_[A-Za-z0-9]{22,}\b/g,'[REDACTED_KEY]')
  .replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,'[REDACTED_KEY]')
  .replace(/\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{8,}\b/g,'[REDACTED_JWT]');
}
function normalize(value){
 return redact(value).trim().toLowerCase()
  .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi,'<id>')
  .replace(/\b\d{4}-\d\d-\d\d[t ]\d\d:\d\d:[^\s]+/g,'<time>')
  .replace(/:\d+(?=\b|:)/g,':<line>')
  .replace(/\b[0-9a-f]{32,64}\b/g,'<hash>')
  .replace(/\s+/g,' ').slice(0,450);
}
function fingerprint(value){
 return crypto.createHash('sha256').update(normalize(value)).digest('hex').slice(0,20);
}
function activeAttempts(state){
 if(!Array.isArray(state.attempts)) {
  if(state.attempts===undefined)return [];
  throw Error('Retry history is malformed: attempts must be an array; do not retry.');
 }
 const resets=state.resets||[];
 if(!Array.isArray(resets))throw Error('Retry reset history is malformed; do not retry.');
 const cutoff=resets.length?Date.parse(resets.at(-1).at):0;
 if(resets.length&&!Number.isFinite(cutoff))throw Error('Retry reset timestamp is invalid; do not retry.');
 return state.attempts.filter(a=>{
  if(!a||!limits[a.kind]||typeof a.errorSummary!=='string'||!a.errorSummary.trim()||!Number.isFinite(Date.parse(a.at))){
   throw Error('Retry attempt is malformed; repair the ledger before proceeding.');
  }
  return Date.parse(a.at)>=cutoff;
 });
}
export function decideRetry(state,kind,signature,rootCause){
 if(!limits[kind])throw Error('kind must be preview or deploy');
 if(typeof signature!=='string'||!signature.trim()||signature.length>500)throw Error('Supply an error summary (1-500 chars).');
 if(rootCause!==undefined&&(typeof rootCause!=='string'||!rootCause.trim()||rootCause.length>150))throw Error('rootCause must be a short string.');
 const current=activeAttempts(state);
 const legacy=state[kind]||{count:0,signatures:{}};
 const hash=fingerprint(signature);
 const count=current.filter(a=>a.kind===kind).length+(Number(legacy.count)||0);
 const identical=current.filter(a=>a.kind===kind&&(
  normalize(a.errorSummary)===normalize(signature) ||
  (rootCause&&a.rootCause&&normalize(a.rootCause)===normalize(rootCause))
 )).length+(Number(legacy.signatures?.[hash])||0);
 const allowed=count<limits[kind].total&&identical<limits[kind].identical;
 return {allowed,fingerprint:hash,used:count,identicalFailures:identical,
  maxTotal:limits[kind].total,maxIdentical:limits[kind].identical,
  guidance:allowed?'Investigate the cause before retrying.':
   'STOP: retry budget exhausted. Inspect logs, change approach or explain the blocker.'};
}
export async function retryCommand({operation,kind,signature,rootCause,project,reason,ownerApproved=false}){
 const file=path.join(project,'.github','openbuilder','retries.json');
 if(!['allow','record','reset'].includes(operation))throw Error('retry operation must be allow, record or reset');
 let state={};
 try{state=JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(operation==='reset'){
  if(!ownerApproved)throw Error('The owner must explicitly approve retry reset: --owner-approved.');
  if(!reason||reason.trim().length<25)throw Error('Reset requires 25+ characters describing diagnosis and remediation.');
  activeAttempts(state); // Fail closed on corrupt ledgers.
  state.version=2;
  state.attempts=state.attempts||[];
  state.resets=[...(state.resets||[]),{at:new Date().toISOString(),reason}];
  state.preview={count:0,signatures:{}};state.deploy={count:0,signatures:{}};
  await fs.mkdir(path.dirname(file),{recursive:true});
  await fs.writeFile(file,JSON.stringify(state,null,2)+'\n',{mode:0o600});
  return {allowed:true,reset:true,reason};
 }
 const result=decideRetry(state,kind,signature,rootCause);
 if(operation==='record'&&result.allowed){
  state.version=2;
  state.attempts=state.attempts||[];
  const entry={at:new Date().toISOString(),kind,errorSummary:redact(signature.trim()),source:'cli'};
  if(rootCause)entry.rootCause=rootCause.trim();
  state.attempts.push(entry);
  await fs.mkdir(path.dirname(file),{recursive:true});
  await fs.writeFile(file,JSON.stringify(state,null,2)+'\n',{mode:0o600});
 }
 return {...result,recorded:operation==='record'&&result.allowed};
}
