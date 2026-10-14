import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {scaffold} from '../lib/scaffold.mjs';
import {evaluateDesign} from '../lib/design-review.mjs';
import {designAction} from '../lib/design.mjs';
import {release} from '../lib/release.mjs';
import {spawnSync} from 'node:child_process';

async function fixture(t,template='web'){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ob-design-'));
 t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 return await scaffold({name:'design-project',template,parent:dir});
}
function completePlan(){
 const reviews={};
 for(const key of ['mobile','accessibility','performance','visual'])
  reviews[key]={done:true,evidence:'Personally checked '+key+' in the actual responsive app with a relevant test.'};
 return {
  version:1,status:'ready',
  product:{goal:'A responsive scheduling experience for customers.',
   audience:'Patients and reception teams using phones and desktop browsers.'},
  direction:{concept:'Quiet editorial layouts, high trust and strong information hierarchy.',
   typeface:'system-ui, sans-serif',
   palette:{background:'#f7f8fa',foreground:'#17222d',primary:'#1a5d68',surface:'#ffffff',accent:'#e6ae49'}},
  pages:[{route:'/',purpose:'Explain the service and let visitors begin the booking flow.',
   mobile:'Stack content clearly in a single column with touch-friendly actions.'}],
  superdesign:{status:'unavailable',projectId:'',draftId:'',implementation:'',
   reason:'This evaluation agent has no SuperDesign shell/CLI access; the design was manually reviewed.'},
  canvasUi:{decision:'not-suitable',component:'',implementation:'',
   reason:'GPU effects would distract from appointments and reduce performance on older phones.'},
  review:reviews
 };
}
test('new web and game templates cannot be mistaken for a finished visual design',async t=>{
 for(const template of ['web','game']){
  const app=await fixture(t,template);
  const result=await evaluateDesign(app);
  assert.equal(result.ready,false);
  assert.ok(result.issues.some(x=>x.includes('status is not ready')));
  assert.ok(result.issues.some(x=>x.includes('SuperDesign')));
 }
});
test('reviewer accepts a detailed fallback without falsely claiming SuperDesign used',async t=>{
 const app=await fixture(t);
 await fs.writeFile(path.join(app,'design-review.json'),JSON.stringify(completePlan(),null,2));
 const result=await evaluateDesign(app);
 assert.equal(result.ready,true,JSON.stringify(result.issues));
 assert.equal(result.plan.superdesign.status,'unavailable');
});
test('design review rejects invented SuperDesign IDs and incomplete visual QA',async t=>{
 const app=await fixture(t);
 const p=completePlan();p.superdesign={status:'used',draftId:'',projectId:'',implementation:''};
 p.review.mobile.done=false;
 await fs.writeFile(path.join(app,'design-review.json'),JSON.stringify(p));
 const report=await evaluateDesign(app);
 assert.equal(report.ready,false);
 assert.ok(report.issues.some(x=>x.includes('real project ID')));
 assert.ok(report.issues.some(x=>x.includes('mobile')));
});
test('design CLI status and check are safe without provider authorization',async t=>{
 const app=await fixture(t);
 const status=await designAction({project:app,operation:'status'});
 assert.equal(status.designReady,false);
 const report=await designAction({project:app,operation:'check'});
 assert.equal(report.designReady,false);
});
test('external draft and Canvas UI changes require explicit consent',async t=>{
 const app=await fixture(t);
 await assert.rejects(designAction({project:app,operation:'draft',projectId:'project-01',title:'Home page',
  prompt:'Make a clear mobile-first page with a strong brand.',approveExternal:false}),/explicit --approve-external/);
 await assert.rejects(designAction({project:app,operation:'canvas',component:'liquid-react',
  approveExternal:true}),/accept-canvas-license/);
});
test('release fails a website before design stage is complete',async t=>{
 const app=await fixture(t);
 const result=await release(app);
 const design=result.steps.find(s=>s.name==='Visual design review');
 assert.equal(design.status,'blocked');
 assert.match(design.detail,/not ready/);
});

test('generated app CI accepts an untouched starter but blocks customized UI without design evidence',async t=>{
 const app=await fixture(t,'web');
 const run=()=>spawnSync(process.execPath,['scripts/design-check.mjs'],{cwd:app,encoding:'utf8'});
 const fresh=run();
 assert.equal(fresh.status,0,fresh.stderr);
 const page=path.join(app,'app','page.tsx');
 await fs.appendFile(page,'\n// Updated product design\n');
 const changed=run();
 assert.equal(changed.status,1,changed.stdout+changed.stderr);
 assert.match(changed.stderr,/BLOCKED/);
 await fs.writeFile(path.join(app,'design-review.json'),JSON.stringify(completePlan(),null,2));
 assert.equal(run().status,0);
});
test('generated game CI also blocks custom UI until a documented design review exists',async t=>{
 const app=await fixture(t,'game');
 const run=()=>spawnSync(process.execPath,['scripts/design-check.mjs'],{cwd:app,encoding:'utf8'});
 assert.equal(run().status,0);
 await fs.appendFile(path.join(app,'style.css'),'\n/* Custom design */\n');
 assert.equal(run().status,1);
 await fs.writeFile(path.join(app,'design-review.json'),JSON.stringify(completePlan(),null,2));
 assert.equal(run().status,0);
});
