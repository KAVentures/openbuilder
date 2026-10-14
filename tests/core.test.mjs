import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {scaffold} from '../lib/scaffold.mjs';
import {audit} from '../lib/audit.mjs';
import {decideRetry,retryCommand} from '../lib/retry.mjs';
import {release} from '../lib/release.mjs';

async function temp(){return fs.mkdtemp(path.join(os.tmpdir(),'openbuilder-'));}
test('scaffolds working web and game manifests without overwriting',async t=>{
  const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const web=await scaffold({name:'hello-web',template:'web',parent:dir});
  const game=await scaffold({name:'hello-game',template:'game',parent:dir});
  assert.equal(JSON.parse(await fs.readFile(path.join(web,'package.json'),'utf8')).name,'hello-web');
  assert.equal(JSON.parse(await fs.readFile(path.join(game,'openbuilder.json'),'utf8')).template,'game');
  assert.equal(JSON.parse(await fs.readFile(path.join(web,'vercel.json'),'utf8')).git.deploymentEnabled,false);
  assert.ok((await fs.readFile(path.join(game,'index.html'),'utf8')).includes('Star Catcher'));
  await assert.rejects(scaffold({name:'hello-web',parent:dir}),/already exists/);
});
test('rejects path injection and bad templates',async()=>{
  for(const name of ['../x','Bad','-bad','a--b','x/evil','a']) await assert.rejects(scaffold({name}),/name/);
  await assert.rejects(scaffold({name:'valid-name',template:'php'}),/[Tt]emplate/);
});
test('auditor reports exposed high-risk keys without printing values',async t=>{
  const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const secret='sk-proj-'+'A'.repeat(35);
  await fs.writeFile(path.join(dir,'main.js'),`const apiKey="${secret}";`);
  await fs.writeFile(path.join(dir,'openbuilder.json'),JSON.stringify({template:'game',features:{}}));
  const report=await audit(dir);
  assert.ok(report.findings.some(f=>f.id==='OPENAI_KEY'&&f.severity==='blocker'));
  assert.ok(!JSON.stringify(report).includes(secret));
});
test('checks on a generated game have no static blocker',async t=>{
  const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const game=await scaffold({name:'hello-game',template:'game',parent:dir});
  const result=await audit(game);
  assert.equal(result.summary.blockers,0,JSON.stringify(result.findings));
  assert.ok(result.summary.manual>0);
});
test('retry guard blocks repeated identical errors and cumulative attempts',async t=>{
  assert.equal(decideRetry({},'preview','one').allowed,true);
  const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const p={project:dir,kind:'preview',signature:'failed 500'};
  assert.equal((await retryCommand({...p,operation:'record'})).allowed,true);
  assert.equal((await retryCommand({...p,operation:'record'})).allowed,true);
  assert.equal((await retryCommand({...p,operation:'allow'})).allowed,false);
  assert.equal((await retryCommand({...p,operation:'record'})).recorded,false);
  const deploy={project:dir,kind:'deploy',signature:'same error'};
  await retryCommand({...deploy,operation:'record'});
  assert.equal((await retryCommand({...deploy,operation:'allow'})).allowed,false);
  await assert.rejects(retryCommand({project:dir,operation:'reset',reason:'oops'}),/meaningful/);
  await retryCommand({project:dir,operation:'reset',reason:'Fixed the underlying DNS configuration'});
  assert.equal((await retryCommand({...p,operation:'allow'})).allowed,true);
});
test('release gate requires tests, build, and external attestations',async t=>{
  const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  await fs.writeFile(path.join(dir,'openbuilder.json'),JSON.stringify({template:'web',features:{}}));
  await fs.writeFile(path.join(dir,'package.json'),JSON.stringify({scripts:{test:'node --eval "process.exit(0)"',build:'node --eval "process.exit(0)"'}}));
  const before=await release(dir);
  assert.equal(before.ready,false);
  const attest={};for(const step of before.steps.filter(x=>x.name.startsWith('Manual: '))){attest[step.name.slice(8)]={verified:true,notes:'Confirmed by an actual external test',at:'2026-10-14T10:00:00Z'};}
  await fs.mkdir(path.join(dir,'.openbuilder'));
  await fs.writeFile(path.join(dir,'.openbuilder','launch-evidence.json'),JSON.stringify({checks:attest}));
  const after=await release(dir);
  assert.equal(after.ready,true,JSON.stringify(after.steps));
});
test('static game release requires attestation but no fictional build step',async t=>{
  const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const game=await scaffold({name:'simple-game',template:'game',parent:dir});
  const report=await release(game);
  assert.equal(report.ready,false);
  assert.equal(report.steps.find(s=>s.name==='Game source checks').status,'pass');
  assert.equal(report.steps.find(s=>s.name==='Game static build').status,'pass');
});
