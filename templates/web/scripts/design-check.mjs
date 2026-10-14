import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {evaluateDesign} from './design-review.mjs';

async function blobHash(file){
 try{const bytes=await fs.readFile(file);
  return crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 }catch{return 'missing';}
}
const BASELINE={
  "app/page.tsx": "d50883e1552a82f50dccdbef4e188a3ced13194f",
  "app/globals.css": "ef5cbbd53d58d9c07e0c9b5e1060a0486804c9e9",
  "app/layout.tsx": "62b6d7bec375c900a71e38965c6c21bb9a4af20d"
};
async function isEdited(){
 for(const [rel,digest] of Object.entries(BASELINE)){
  if((await blobHash(path.resolve(process.cwd(),rel)))!==digest)return true;
 }
 const app=path.join(process.cwd(),'app');
const known=new Set(['page.tsx','contact/page.tsx','terms/page.tsx','privacy/page.tsx']);
async function collect(dir,rel=''){
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  if(entry.isSymbolicLink())continue;
  const next=rel?rel+'/'+entry.name:entry.name;
  if(entry.isDirectory()) {if(await collect(path.join(dir,entry.name),next))return true;}
  else if(/(?:^|\/)page\.tsx$/.test(next)&&!known.has(next))return true;
 }
 return false;
}
return await collect(app);
}
const report=await evaluateDesign(process.cwd());
const edited=await isEdited();
console.log('Design review: '+(report.ready?'complete':'pending or invalid')+'; frontend modified: '+edited);
for(const issue of report.issues)console.log(' - '+issue);
if(!report.ready&&(edited||process.argv.includes('--strict'))){
 console.error('BLOCKED: customized frontend requires a completed design-review.json and real visual evidence.');
 process.exitCode=1;
}
