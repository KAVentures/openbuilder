import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseRepository,validateProjectName,githubAction,githubStatus} from '../lib/github.mjs';
import {release} from '../lib/release.mjs';
import {scaffold} from '../lib/scaffold.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
async function temp(t){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'openbuilder-github-'));
 t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 return dir;
}
test('GitHub repository name validation and explicit approval',async t=>{
 const dir=await temp(t);
 assert.equal(parseRepository('example-org/my-app').full,'example-org/my-app');
 for(const input of ['','..','hello','abc/../x','abc/.hidden','abc/bad.git','-'])assert.throws(()=>parseRepository(input));
 for(const n of ['','..','.hidden','bad/name','a'])assert.throws(()=>validateProjectName(n));
 await assert.rejects(githubAction({operation:'create',project:dir,repoName:'my-app'}),/explicit user approval/);
 await assert.rejects(githubAction({operation:'connect',project:dir,repo:'owner/app'}),/explicit user approval/);
});
test('read-only status reports missing Git without mutating project',async t=>{
 const dir=await temp(t);
 const before=githubStatus(dir);
 assert.equal(before.gitInitialized,false);
 assert.equal(before.connected,false);
 await assert.rejects(fs.access(path.join(dir,'.git')));
});
test('local release blocks when no app-specific GitHub origin exists',async t=>{
 const dir=await temp(t);
 const game=await scaffold({name:'demo-game',template:'game',parent:dir});
 const git=args=>execFileSync('git',args,{cwd:game,stdio:'ignore'});
 git(['init']);git(['config','user.name','OpenBuilder Tests']);git(['config','user.email','test@example.invalid']);
 git(['add','.']);git(['commit','-m','first']);
 const before=await release(game);
 assert.equal(before.steps.find(s=>s.name==='GitHub source repository').status,'blocked');
 git(['remote','add','origin','https://github.com/owner/demo-game.git']);
 const after=await release(game);
 assert.equal(after.steps.find(s=>s.name==='GitHub source repository').status,'pass');
});
test('authorized GitHub creation defaults to private and commits a new game locally',async t=>{
 if(process.platform==='win32')return t.skip('Unix fake gh executable fixture');
 const dir=await temp(t);
 const app=await scaffold({name:'demo-game',template:'game',parent:dir});
 const fakeBin=path.join(dir,'bin');
 await fs.mkdir(fakeBin);
 const fakeGh=path.join(fakeBin,'gh');
 const script=['#!/bin/sh',
  'if [ "$1" = "auth" ] && [ "$2" = "status" ]; then exit 0; fi',
  'if [ "$1" = "api" ] && [ "$2" = "user" ]; then echo mockuser; exit 0; fi',
  'if [ "$1" = "repo" ] && [ "$2" = "view" ]; then exit 1; fi',
  'if [ "$1" = "repo" ] && [ "$2" = "create" ]; then',
  '  git -C "$OPENBUILDER_TEST_APP" remote add origin https://github.com/mockuser/demo-game.git',
  '  printf "%s\n" "$@" >> "$OPENBUILDER_TEST_LOG"',
  '  exit 0',
  'fi',
  'exit 1'
 ].join('\n')+'\n';
 await fs.writeFile(fakeGh,script,{mode:0o755});
 await fs.chmod(fakeGh,0o755);
 const old={PATH:process.env.PATH,OPENBUILDER_TEST_APP:process.env.OPENBUILDER_TEST_APP,OPENBUILDER_TEST_LOG:process.env.OPENBUILDER_TEST_LOG};
 const log=path.join(dir,'commands.log');
 try{
  process.env.PATH=fakeBin+path.delimiter+process.env.PATH;
  process.env.OPENBUILDER_TEST_APP=app;process.env.OPENBUILDER_TEST_LOG=log;
  const result=await githubAction({operation:'create',project:app,repoName:'demo-game',confirm:true});
  assert.equal(result.created,true);
  assert.equal(result.connected,true);
  assert.equal(result.url,'https://github.com/mockuser/demo-game');
  const args=await fs.readFile(log,'utf8');
  assert.match(args,/--private/);
  assert.match(args,/--push/);
  assert.equal(execFileSync('git',['rev-parse','--verify','HEAD'],{cwd:app,encoding:'utf8'}).trim().length,40);
 }finally{
  for(const [k,v] of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
 }
});
test('starter apps include design brief and related GitHub documentation',async t=>{
 const dir=await temp(t);
 for(const template of ['web','game']){
  const app=await scaffold({name:'design-'+template,template,parent:dir});
  const design=await fs.readFile(path.join(app,'DESIGN.md'),'utf8');
  assert.match(design,/Canvas UI/);
  assert.match(design,/SuperDesign/);
 }
 const guide=await fs.readFile(path.join(root,'docs/GITHUB.md'),'utf8');
 assert.match(guide,/https:\/\/github.com\/new/);
 assert.match(guide,/private/);
});
