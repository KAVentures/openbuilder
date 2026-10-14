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
  "index.html": "4871581f9a4afe91ecadd68588c30fa09968ae35",
  "style.css": "c62be15a2cfd3e891de722b262ed000b79f4f267",
  "game.js": "4b0856355f3269754dbba16d578397f360323d22"
};
async function isEdited(){
 for(const [rel,digest] of Object.entries(BASELINE)){
  if((await blobHash(path.resolve(process.cwd(),rel)))!==digest)return true;
 }
 const allowed=new Set(['game.js']);
const files=await fs.readdir(process.cwd());
return files.some(x=>x.endsWith('.js')&&!allowed.has(x));
}
const report=await evaluateDesign(process.cwd());
const edited=await isEdited();
console.log('Design review: '+(report.ready?'complete':'pending or invalid')+'; frontend modified: '+edited);
for(const issue of report.issues)console.log(' - '+issue);
if(!report.ready&&(edited||process.argv.includes('--strict'))){
 console.error('BLOCKED: customized frontend requires a completed design-review.json and real visual evidence.');
 process.exitCode=1;
}
