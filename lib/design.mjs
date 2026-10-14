import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {evaluateDesign} from './design-review.mjs';

function cliAvailable(binary){
 // Do not auto-install, log in, purchase design credits or mutate external accounts.
 const result=spawnSync(binary,['--help'],{encoding:'utf8',timeout:7000,stdio:'ignore',shell:false});
 return !result.error && result.status===0;
}
function ensureChoice(value,description){
 if(typeof value!=='string'||value.trim().length<3||value.length>4000)throw Error(description+' must contain meaningful text.');
 return value.trim();
}
async function perform(project,binary,args){
 if(process.platform==='win32'){
  throw Error('External design commands require a safely executable CLI shell; use the installed SuperDesign/Codex/Claude skill on Windows or run these documented CLI steps directly. No command executed.');
 }
 return new Promise((resolve,reject)=>{
  const child=spawn(binary,args,{cwd:project,stdio:'inherit',shell:false});
  const timeout=setTimeout(()=>child.kill('SIGTERM'),180000);
  child.once('error',e=>{clearTimeout(timeout);reject(Error('Cannot start '+binary+': '+e.message));});
  child.once('exit',(status,signal)=>{clearTimeout(timeout);status===0?resolve({success:true}):reject(Error(binary+' exited with '+(signal||'code '+status)+'. No retries were attempted.'));});
 });
}
export async function designAction({project,operation,query,projectId,title,prompt,component,approveExternal=false,acceptLicense=false}){
 if(!['status','check','inspire','draft','canvas'].includes(operation))throw Error('design operation must be status, check, inspire, draft or canvas.');
 const review=await evaluateDesign(project);
 const superdesignAvailable=cliAvailable('superdesign');
 if(operation==='status')return {designReady:review.ready,issues:review.issues,
  superdesignCliAvailable:superdesignAvailable,
  next:superdesignAvailable?'Use SuperDesign draft generation after initializing its skill context and obtaining approval.':'Install/login to the maintained SuperDesign skill in a shell-capable agent, or document an honest no-shell fallback.'};
 if(operation==='check')return {designReady:review.ready,issues:review.issues};
 if(!approveExternal)throw Error('External SuperDesign/Canvas UI operations require explicit --approve-external (and a valid design environment).');
 if(operation==='canvas'){
  if(!acceptLicense)throw Error('Canvas UI is MIT + Commons Clause: require --accept-canvas-license after reviewing its terms.');
  if(typeof component!=='string'|| !/^[a-z][a-z0-9-]{1,60}-(?:react|vue|svelte|solid|preact|vanilla)(?:-webgpu)?$/.test(component))
    throw Error('Use a Canvas UI registry component name, e.g. liquid-react.');
  await fs.access(path.join(project,'components.json')).catch(()=>{throw Error('Canvas UI requires a preconfigured shadcn registry (components.json). No dependencies changed.');});
  await perform(project,'npx',['shadcn@latest','add','@canvas-ui/'+component]);
  return {installed:true,component,warning:'Inspect generated source/licensing and test reduced motion, mobile and bundle size before marking Canvas UI used.'};
 }
 if(!superdesignAvailable)throw Error('SuperDesign CLI unavailable: install the maintained skill/CLI, authenticate and approve its service costs; no fallback was falsely executed.');
 if(operation==='inspire'){
  await perform(project,'superdesign',['search-prompts','--query',ensureChoice(query,'style query')]);
  return {searched:true,next:'Choose a design direction, then create a SuperDesign draft using its skill.'};
 }
 // An existing codebase MUST complete SuperDesign init before drafts; do not
 // shortcut the upstream skill's source-context requirements.
 const root=path.join(project,'.superdesign','init');
 for(const name of ['components.md','layouts.md','routes.md','theme.md','pages.md','extractable-components.md']){
  const content=await fs.readFile(path.join(root,name),'utf8').catch(()=>null);
  if(!content?.trim())throw Error('SuperDesign initialization incomplete (missing '+name+'). Run the maintained SuperDesign skill init first. No design credits spent.');
 }
 await fs.access(path.join(project,'.superdesign','design-system.md')).catch(()=>{throw Error('SuperDesign design system missing. Run its design-system setup first.');});
 const id=ensureChoice(projectId,'existing SuperDesign project ID');
 const name=ensureChoice(title,'draft title');
 const message=ensureChoice(prompt,'draft prompt');
 // This invokes the ACTUAL upstream design-draft command. The SDK's output
 // (which includes design IDs) is displayed, not fabricated or parsed.
 await perform(project,'superdesign',['create-design-draft','--project-id',id,'--title',name,
  '-p',message,'--context-file','.superdesign/design-system.md']);
 return {generated:true,provider:'SuperDesign',
  next:'Read the real returned draft ID, inspect the generated HTML/canvas, implement it in the app, and fill design-review.json with true evidence. No automatic claim of visual quality.'};
}
