#!/usr/bin/env node
/**
 * Maintainer-only one-time publishing helper for standalone GitHub template repos.
 * Dry run by default. Requires authenticated GitHub CLI and explicit --publish.
 * Never stores credentials, overwrites an existing repository, or enables previews.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {scaffold} from '../lib/scaffold.mjs';

const owner='KAVentures';
const names=[{kind:'web',repo:'openbuilder-web-template',
 description:'OpenBuilder Next.js starter: independent CI, safe previews, security and SEO checks'},
 {kind:'game',repo:'openbuilder-game-template',
 description:'OpenBuilder browser game starter: independent CI and no automatic cloud previews'}];

function command(binary,args,options={}){
 return (execFileSync(binary,args,{encoding:'utf8',timeout:90000,...options})||'').trim();
}
async function publish(){
 const allowed=new Set(['--publish','--help']);
 const unknown=process.argv.slice(2).filter(a=>!allowed.has(a));
 if(unknown.length)throw Error('Unknown arguments: '+unknown.join(', '));
 if(process.argv.includes('--help')){
  console.log('Usage: node scripts/publish-template-repos.mjs [--publish]');
  console.log('Requires GitHub CLI (gh) authenticated as KAVentures and Git user identity.');
  console.log('Dry run by default. Does not overwrite existing repositories.');
  return;
 }
 const real=process.argv.includes('--publish');
 console.log('Target repositories:\n'+names.map(n=>'  https://github.com/'+owner+'/'+n.repo).join('\n'));
 if(!real){
  console.log('\nDRY RUN ONLY. To create both PUBLIC repositories as GitHub templates, run:');
  console.log('node scripts/publish-template-repos.mjs --publish');
  return;
 }
 command('gh',['auth','status'],{stdio:'pipe'});
 const login=command('gh',['api','user','--jq','.login']);
 if(login.toLowerCase()!==owner.toLowerCase())throw Error('Sign in to gh as '+owner+' before publishing; current user is '+login);
 command('git',['config','user.name']);
 command('git',['config','user.email']);
 for(const entry of names){
  const full=owner+'/'+entry.repo;
  try {
   command('gh',['repo','view',full,'--json','name']);
   throw Error('Repository '+full+' already exists. Refusing overwrite; synchronize it via a reviewed PR.');
  } catch(e){
   if(String(e.message).includes('already exists'))throw e;
   // gh repo view returns nonzero when missing; verify with REST to distinguish
   // a permission/network error from a genuinely unused repo name.
   try{
    const status=command('gh',['api','-i','repos/'+full]);
    if(status.startsWith('HTTP/2 200')||status.startsWith('HTTP/1.1 200'))throw Error(full+' already exists.');
    throw Error('Cannot verify repository availability for '+full);
   }catch(err){
    if(!String(err.message).includes('HTTP 404') && !String(err.stderr||'').includes('HTTP 404')){
     throw Error('Cannot confirm '+full+' is available. Check permissions/network. '+String(err.message).slice(0,300));
    }
   }
  }
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'openbuilder-publish-'));
  try{
   const folder=await scaffold({name:entry.repo,template:entry.kind,parent:temp});
   // The generated template itself is the root of its own GitHub repository.
   command('git',['init','-b','main'],{cwd:folder});
   command('git',['add','-A'],{cwd:folder});
   command('git',['commit','-m','Initial OpenBuilder '+entry.kind+' template'],{cwd:folder});
   console.log('Creating '+full+' (public)...');
   command('gh',['repo','create',full,'--public','--source',folder,
    '--remote','origin','--push','--description',entry.description],{stdio:'inherit'});
   // Mark template repository so GitHub exposes "Use this template".
   command('gh',['api','-X','PATCH','repos/'+full,'-F','is_template=true'],{stdio:'pipe'});
   console.log('Published template: https://github.com/'+full);
  }finally{
   await fs.rm(temp,{recursive:true,force:true});
  }
 }
 console.log('Verify the Use this template button and test a fresh generated repo from each source.');
}
publish().catch(e=>{console.error('Template publishing failed: '+e.message);process.exitCode=1;});
