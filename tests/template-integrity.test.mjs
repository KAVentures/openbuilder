import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('all generated-app audit engines exactly match toolkit audit engine',async()=>{
 const master=await fs.readFile(path.join(root,'lib/audit.mjs'));
 for(const template of ['web','game']){
  const current=await fs.readFile(path.join(root,'templates',template,'scripts/audit.mjs'));
  assert.deepEqual(current,master,template+' audit drifted; copy the master audit and run CI.');
 }
});
test('both app templates include Dependabot and a GitHub Actions workflow',async()=>{
 for(const template of ['web','game']){
  const dep=await fs.readFile(path.join(root,'templates',template,'.github','dependabot.yml'),'utf8');
  assert.match(dep,/package-ecosystem: "npm"/);
  assert.match(dep,/package-ecosystem: "github-actions"/);
  await fs.access(path.join(root,'templates',template,'.github','workflows','ci.yml'));
 }
});

test('design reviewer is identical in toolkit and app templates',async()=>{
 const master=await fs.readFile(path.join(root,'lib/design-review.mjs'));
 for(const template of ['web','game']){
  const installed=await fs.readFile(path.join(root,'templates',template,'scripts/design-review.mjs'));
  assert.deepEqual(installed,master,template+' design evaluator must be kept in sync.');
 }
});
