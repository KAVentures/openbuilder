import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {scaffold,shouldCopyTemplateFile} from '../lib/scaffold.mjs';
import {audit} from '../lib/audit.mjs';
import {decideRetry,retryCommand} from '../lib/retry.mjs';
import {release} from '../lib/release.mjs';
import {resolveAsset} from '../lib/preview.mjs';

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
  await assert.rejects(retryCommand({project:dir,operation:'reset',reason:'oops'}),/owner|meaningful/);
  await retryCommand({project:dir,operation:'reset',reason:'Fixed the underlying DNS configuration with a verified manual deployment',ownerApproved:true});
  assert.equal((await retryCommand({...p,operation:'allow'})).allowed,true);
});
test('release gate requires tests, build, and external attestations',async t=>{
  const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  await fs.writeFile(path.join(dir,'openbuilder.json'),JSON.stringify({template:'web',features:{}}));
  await fs.writeFile(path.join(dir,'package.json'),JSON.stringify({scripts:{test:'node --eval "process.exit(0)"',build:'node --eval "process.exit(0)"'}}));
  const before=await release(dir);
  assert.equal(before.ready,false);
  const git=(args)=>execFileSync('git',args,{cwd:dir,stdio:'ignore'});git(['init']);git(['config','user.name','OpenBuilder Tests']);git(['config','user.email','tests@example.invalid']);git(['add','.']);git(['commit','-m','fixture']);const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:dir,encoding:'utf8'}).trim();
  const attest={};for(const step of before.steps.filter(x=>x.name.startsWith('Manual: '))){attest[step.name.slice(8)]={verified:true,notes:'Confirmed by an actual external test',at:new Date().toISOString(),commitSha:revision};}
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
  assert.equal(report.steps.find(s=>s.name==='Game build').status,'pass');
});

test('local preview refuses configuration files, traversal and escaped symlinks',async t=>{
  const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const game=await scaffold({name:'safe-game',template:'game',parent:dir});
  const root=await fs.realpath(game);
  assert.equal(await resolveAsset(root,'/openbuilder.json'),null);
  assert.equal(await resolveAsset(root,'/.openbuilder/launch-evidence.json'),null);
  assert.equal(await resolveAsset(root,'/assets/%2E%2E/openbuilder.json'),null);
  assert.equal(await resolveAsset(root,'/%2E%2E/package.json'),null);
  assert.equal(await resolveAsset(root,'/%E0%A4%A'),null);
  assert.ok((await resolveAsset(root,'/game.js')).endsWith('game.js'));
  await fs.mkdir(path.join(game,'assets'));
  const outside=path.join(dir,'outside.txt');await fs.writeFile(outside,'secret');
  await fs.symlink(outside,path.join(game,'assets','secret.txt'));
  assert.equal(await resolveAsset(root,'/assets/secret.txt'),null);
});

test('scaffold never copies secrets, dependency folders or local build caches',()=>{
  const root=path.resolve('/project/templates/web');
  assert.equal(shouldCopyTemplateFile(root,path.join(root,'node_modules','some-package','index.js')),false);
  assert.equal(shouldCopyTemplateFile(root,path.join(root,'.next','server.js')),false);
  assert.equal(shouldCopyTemplateFile(root,path.join(root,'.env.local')),false);
  assert.equal(shouldCopyTemplateFile(root,path.join(root,'.env')),false);
  assert.equal(shouldCopyTemplateFile(root,path.join(root,'.env.example')),true);
  assert.equal(shouldCopyTemplateFile(root,path.join(root,'app','page.tsx')),true);
});
test('untracked local env values are not treated as committed credentials',async t=>{
  const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  await fs.writeFile(path.join(dir,'openbuilder.json'),JSON.stringify({template:'game',features:{}}));
  await fs.writeFile(path.join(dir,'index.html'),'<h1>Hello</h1>');
  await fs.writeFile(path.join(dir,'.env.local'),'TOKEN='+'sk-proj-'+'A'.repeat(40));
  const report=await audit(dir);
  assert.equal(report.summary.blockers,0);
});

test('retry signatures normalize line numbers; resets require explicit owner approval',async t=>{
 const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const x={project:dir,kind:'preview',signature:'Build failed at page.tsx:41 at 2026-10-14T12:00:00Z'};
 await retryCommand({...x,operation:'record'});
 const same={...x,signature:'Build failed at page.tsx:53 at 2026-10-15T18:00:00Z'};
 assert.equal((await retryCommand({...same,operation:'allow'})).identicalFailures,1);
 await assert.rejects(retryCommand({project:dir,operation:'reset',reason:'I have reviewed and fixed the error'}),/owner/);
 assert.equal((await retryCommand({project:dir,operation:'reset',reason:'Fixed error, confirmed manual recovery with user',ownerApproved:true})).reset,true);
});
test('old evidence cannot qualify as verified launch evidence',async t=>{
 const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 await fs.writeFile(path.join(dir,'openbuilder.json'),JSON.stringify({template:'game',features:{}}));
 await fs.writeFile(path.join(dir,'index.html'),'<h1>Example</h1>');
 await fs.writeFile(path.join(dir,'style.css'),'html{}');
 await fs.writeFile(path.join(dir,'game.js'),'console.log("ok")');
 const git=(args)=>execFileSync('git',args,{cwd:dir,stdio:'ignore'});
 git(['init']);git(['config','user.name','OpenBuilder Tests']);git(['config','user.email','tests@example.invalid']);git(['add','.']);git(['commit','-m','fixture']);
 const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:dir,encoding:'utf8'}).trim();
 const before=await release(dir);
 const checks={};for(const step of before.steps.filter(s=>s.name.startsWith('Manual: ')))checks[step.name.slice(8)]={verified:true,at:'2026-01-01T00:00:00Z',notes:'Ancient check without current confirmation',commitSha:revision};
 await fs.mkdir(path.join(dir,'.openbuilder'));
 await fs.writeFile(path.join(dir,'.openbuilder','launch-evidence.json'),JSON.stringify({checks}));
 const after=await release(dir);
 assert.equal(after.ready,false);
 assert.ok(after.steps.some(x=>x.name.startsWith('Manual:')&&x.status==='blocked'));
});

test('no-shell human-readable attempts are counted without SHA-256 fingerprints',async t=>{
 const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const file=path.join(dir,'.github','openbuilder','retries.json');
 await fs.mkdir(path.dirname(file),{recursive:true});
 await fs.writeFile(file,JSON.stringify({version:2,attempts:[
  {at:'2026-10-14T12:00:00Z',kind:'preview',errorSummary:'Next build failed at page.tsx:41',rootCause:'typescript-build'},
  {at:'2026-10-14T12:01:00Z',kind:'preview',errorSummary:'Next build failed at page.tsx:53',rootCause:'typescript-build'}
 ],resets:[]}));
 const result=await retryCommand({project:dir,operation:'allow',kind:'preview',signature:'Next build failed at page.tsx:78',rootCause:'typescript-build'});
 assert.equal(result.used,2);
 assert.equal(result.identicalFailures,2);
 assert.equal(result.allowed,false);
});
test('CLI saves readable attempts and the next chat session can count them',async t=>{
 const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 await retryCommand({project:dir,operation:'record',kind:'preview',signature:'Missing Vercel env variable',rootCause:'env-missing'});
 const state=JSON.parse(await fs.readFile(path.join(dir,'.github/openbuilder/retries.json'),'utf8'));
 assert.equal(state.attempts.length,1);
 assert.equal(state.attempts[0].errorSummary,'Missing Vercel env variable');
 assert.equal(state.attempts[0].rootCause,'env-missing');
 assert.equal((await retryCommand({project:dir,operation:'allow',kind:'preview',signature:'Missing Vercel env variable'})).identicalFailures,1);
});
test('a malformed manual ledger fails closed instead of granting retries',()=>{
 assert.throws(()=>decideRetry({attempts:[{kind:'preview',errorSummary:'error'}]},'preview','error'),/malformed/);
 assert.throws(()=>decideRetry({attempts:'fake'},'deploy','failure'),/malformed/);
});
test('Git repository requirement has a clear action before attestation',async t=>{
 const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const app=await scaffold({name:'no-git-app',template:'game',parent:dir});
 const report=await release(app);
 const git=report.steps.find(s=>s.name==='Git repository');
 assert.equal(git.status,'blocked');
 assert.match(git.detail,/git init/);
 assert.match(report.steps.find(s=>s.name==='Manual: rollback').detail,/git init/);
});
test('an app nested in a parent Git repository must create its own Git history',async t=>{
 const dir=await temp();t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const git=args=>execFileSync('git',args,{cwd:dir,stdio:'ignore'});
 git(['init']);git(['config','user.name','OpenBuilder Tests']);git(['config','user.email','tests@example.invalid']);
 await fs.writeFile(path.join(dir,'README.md'),'Parent repo');
 git(['add','.']);git(['commit','-m','parent']);
 const app=await scaffold({name:'my-app',template:'game',parent:dir});
 const report=await release(app);
 assert.equal(report.steps.find(s=>s.name==='Git repository').status,'blocked');
});

test('CLI never commits raw secret-shaped values in readable retry history',async tt=>{
 const dir=await temp();tt.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const token='sk-proj-'+'A'.repeat(42);
 await retryCommand({project:dir,operation:'record',kind:'preview',signature:'Build failed: '+token,rootCause:'secrets-config'});
 const raw=await fs.readFile(path.join(dir,'.github/openbuilder/retries.json'),'utf8');
 assert.equal(raw.includes(token),false);
 assert.match(raw,/REDACTED_KEY/);
 assert.equal((await retryCommand({project:dir,operation:'allow',kind:'preview',signature:'Build failed: '+token,rootCause:'secrets-config'})).identicalFailures,1);
});
test('publishing templates is dry-run by default and never needs GitHub credentials to plan',()=>{
 const cli=execFileSync(process.execPath,['scripts/publish-template-repos.mjs'],{cwd:path.resolve(''),encoding:'utf8'});
 assert.match(cli,/DRY RUN ONLY/);
 assert.match(cli,/openbuilder-web-template/);
 assert.match(cli,/openbuilder-game-template/);
});
