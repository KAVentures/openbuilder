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
function researchFixture(){
 const now=new Date().toISOString();
 const hosts=['https://clinic-style-one.com','https://clinic-style-two.com','https://clinic-style-three.com'];
 const scores=[5,4,3];
 return {
  status:'researched',industry:'Independent healthcare practices targeting mobile visitors',
  queries:['healthcare clinic website designs Sweden','modern independent clinic websites Europe'],
  candidates:hosts.map((url,i)=>({
   url,inspectedAt:now,visualScore:scores[i],
   visualEvidence:'Browser screenshot of homepage stored in test evidence for candidate '+(i+1),
   selectionRationale:'Well composed hero section and mobile responsive navigation evaluated for candidate '+(i+1),
   observations:{
    layout:'Observed asymmetrical hero composition and modular content hierarchy on landing page.',
    typography:'Observed readable large editorial headings and a clean sans-serif body font stack.',
    color:'Observed restrained surface contrast and warm muted accent color relationships.',
    motion:'Observed subtle button hover and short scroll reveal transitions in the rendered page.',
    mobile:'Observed responsive menu, stacked content and generous finger-sized tap targets.'
   }
  })),
  selectedUrl:hosts[0],whyChosen:'',
  adaptedPatterns:['Use a split hero with original imagery and site-specific content.',
   'Introduce an editorial heading scale paired with licensed readable sans text.',
   'Implement a restrained original hover transition with reduced-motion support.'],
  originality:{
   distinctBrand:'Create a new name, logo, custom section structure, and original service copy.',
   assetsAndFonts:'Use new properly licensed typefaces, icons and photographs rather than copying reference assets.',
   effects:'Reimplement general interaction principles in authored CSS without copying scripts or shaders.',
   fit:'Remove distraction-heavy animations and prioritize booking clarity and accessibility.'
  }
 };
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
   reason:'This evaluation agent has no SuperDesign shell/CLI access; competitor sites were visually reviewed.'},
  competitorResearch:researchFixture(),
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

test('authorized SuperDesign and Canvas UI commands actually invoke their executables',async t=>{
 if(process.platform==='win32')return t.skip('POSIX test-only fake executables');
 const app=await fixture(t);
 const mockDir=await fs.mkdtemp(path.join(os.tmpdir(),'ob-design-cli-'));
 t.after(()=>fs.rm(mockDir,{recursive:true,force:true}));
 const realPath=process.env.PATH;
 const oldLog=process.env.OPENBUILDER_DESIGN_TEST_LOG;
 const log=path.join(mockDir,'calls.txt');
 const binary=(name)=>path.join(mockDir,name);
 const upstream=[
  '#!/bin/sh',
  'if [ "$1" = "--help" ]; then exit 0; fi',
  'echo "superdesign $*" >> "$OPENBUILDER_DESIGN_TEST_LOG"',
  'exit 0'
 ].join('\n')+'\n';
 const registry=[
  '#!/bin/sh',
  'echo "npx $*" >> "$OPENBUILDER_DESIGN_TEST_LOG"',
  'exit 0'
 ].join('\n')+'\n';
 await fs.writeFile(binary('superdesign'),upstream,{mode:0o755});
 await fs.writeFile(binary('npx'),registry,{mode:0o755});
 await fs.chmod(binary('superdesign'),0o755);
 await fs.chmod(binary('npx'),0o755);
 await fs.mkdir(path.join(app,'.superdesign','init'),{recursive:true});
 for(const file of ['components.md','layouts.md','routes.md','theme.md','pages.md','extractable-components.md'])
  await fs.writeFile(path.join(app,'.superdesign','init',file),'# valid initialization context');
 await fs.writeFile(path.join(app,'.superdesign','design-system.md'),'# Actual design-system');
 await fs.writeFile(path.join(app,'components.json'),'{}');
 try{
  process.env.PATH=mockDir+path.delimiter+realPath;
  process.env.OPENBUILDER_DESIGN_TEST_LOG=log;
  const a=await designAction({project:app,operation:'draft',projectId:'p-123',
   title:'Home page',prompt:'Editorial home page with expressive typography',approveExternal:true});
  assert.equal(a.generated,true);
  const b=await designAction({project:app,operation:'canvas',component:'liquid-react',
   approveExternal:true,acceptLicense:true});
  assert.equal(b.installed,true);
  const calls=await fs.readFile(log,'utf8');
  assert.match(calls,/superdesign create-design-draft --project-id p-123 --title Home page/);
  assert.match(calls,/npx shadcn@latest add @canvas-ui\/liquid-react/);
 }finally{
  process.env.PATH=realPath;
  if(oldLog===undefined)delete process.env.OPENBUILDER_DESIGN_TEST_LOG;
  else process.env.OPENBUILDER_DESIGN_TEST_LOG=oldLog;
 }
});

test('SuperDesign fallback cannot pass with generic inspiration or missing competitors',async t=>{
 const app=await fixture(t);
 const p=completePlan();delete p.competitorResearch;
 await fs.writeFile(path.join(app,'design-review.json'),JSON.stringify(p));
 const result=await evaluateDesign(app);
 assert.equal(result.ready,false);
 assert.ok(result.issues.some(x=>x.includes('live competitor research')));
});
test('fallback rejects single competitors, SEO snippets and fake localhost domains',async t=>{
 const app=await fixture(t);
 const p=completePlan();
 p.competitorResearch.candidates=p.competitorResearch.candidates.slice(0,1);
 p.competitorResearch.candidates[0].url='http://localhost:3000';
 p.competitorResearch.candidates[0].visualEvidence='Google snippet';
 await fs.writeFile(path.join(app,'design-review.json'),JSON.stringify(p));
 const result=await evaluateDesign(app);
 assert.equal(result.ready,false);
 assert.ok(result.issues.some(x=>x.includes('three distinct')));
});
test('fallback requires real visual observations, originality and selection rationale',async t=>{
 const app=await fixture(t);
 const p=completePlan();
 p.competitorResearch.candidates[0].observations.typography='';
 p.competitorResearch.originality.assetsAndFonts='';
 p.competitorResearch.selectedUrl=p.competitorResearch.candidates[2].url;
 await fs.writeFile(path.join(app,'design-review.json'),JSON.stringify(p));
 const result=await evaluateDesign(app);
 assert.equal(result.ready,false);
 assert.ok(result.issues.some(x=>x.includes('typography')));
 assert.ok(result.issues.some(x=>x.includes('fonts')));
 assert.ok(result.issues.some(x=>x.includes('scores below')));
});
test('real SuperDesign evidence does not require fallback research',async t=>{
 const app=await fixture(t);
 const p=completePlan();
 p.superdesign={status:'used',projectId:'prj-real-project-fixture',draftId:'draft-fixture-id',
  implementation:'Implemented selected SuperDesign draft into responsive React components.'};
 delete p.competitorResearch;
 await fs.writeFile(path.join(app,'design-review.json'),JSON.stringify(p));
 const result=await evaluateDesign(app);
 assert.equal(result.ready,true,JSON.stringify(result.issues));
});
