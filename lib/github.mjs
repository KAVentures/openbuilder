import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {audit} from './audit.mjs';

export function parseRepository(value){
 if(typeof value!=='string'|| !/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/.test(value))
  throw Error('Provide an owner/repository name, for example my-account/my-app.');
 const [owner,name]=value.split('/');
 if(name==='.'||name==='..'||name.endsWith('.git')||name.startsWith('.'))
  throw Error('Invalid GitHub repository name.');
 return {owner,name,full:`${owner}/${name}`};
}
export function validateProjectName(name){
 if(typeof name!=='string'|| !/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,99}$/.test(name)||name==='.'||name==='..'||name.endsWith('.git'))
  throw Error('Repository name must be 2–100 letters, digits, periods, hyphens or underscores.');
 return name;
}
function run(binary,args,cwd){
 try{return {ok:true,out:execFileSync(binary,args,{cwd,encoding:'utf8',timeout:30000,stdio:['ignore','pipe','pipe']}).trim()};}
 catch(e){
  if(e.code==='ENOENT') return {ok:false,missing:true,out:''};
  return {ok:false,out:'',exitStatus:e.status||1};
 }
}
function git(args,cwd){return run('git',args,cwd);}
function gh(args,cwd){return run('gh',args,cwd);}
function gitRoot(project){
 const root=git(['rev-parse','--show-toplevel'],project);
 if(!root.ok)return false;
 return path.resolve(root.out).toLowerCase()===path.resolve(project).toLowerCase();
}
function origin(project){
 const r=git(['remote','get-url','origin'],project);
 return r.ok?r.out:null;
}
export function githubStatus(project){
 const local=gitRoot(project),remote=local?origin(project):null;
 const ghStatus=gh(['auth','status'],project);
 return {project:path.basename(project),gitInitialized:local,remote,connected:!!remote,
  githubAuthenticated:ghStatus.ok,githubCliInstalled:!ghStatus.missing,
  next:remote?'GitHub remote is linked. Verify its branch and CI results.':
    !ghStatus.ok?'Connect GitHub through the available AI app, or install GitHub CLI and run gh auth login; no API token should be pasted into chat.':
    'Choose an existing repository or approve creating a private GitHub repository.'};
}
function requireGh(project){
 const x=gh(['auth','status'],project);
 if(!x.ok)throw Error(x.missing?'GitHub CLI missing: install gh from https://cli.github.com/ then run gh auth login.':
  'GitHub account not connected in this terminal: run gh auth login, or use a supported AI GitHub connector.');
}
async function verifySafe(project){
 const report=await audit(project);
 if(report.summary.blockers)throw Error(`GitHub publish blocked by ${report.summary.blockers} static security/configuration finding(s). Run openbuilder check and fix them.`);
 // Initial staging separately blocks sensitive filenames and generated directories.
 // Always review source manually before pushing; this heuristic is not a full secret scan.
}
function ensureGitRoot(project){
 if(gitRoot(project))return;
 const root=git(['rev-parse','--show-toplevel'],project);
 if(root.ok)throw Error('This app is inside another Git repository. Create its own Git repository first; do not publish the parent toolkit.');
 const init=git(['init','-b','main'],project);
 if(!init.ok)throw Error('Could not initialize Git. Install Git and configure your git identity.');
 if(!gitRoot(project))throw Error('Git initialized outside the application directory; publishing stopped.');
}
async function firstCommit(project){
 const rev=git(['rev-parse','--verify','HEAD'],project);
 if(rev.ok){
  const dirty=git(['status','--porcelain'],project);
  if(dirty.ok&&dirty.out)throw Error('Uncommitted changes exist. Review and commit them before connecting/pushing to GitHub.');
  return;
 }
 const add=git(['add','-A'],project);
 if(!add.ok)throw Error('Could not stage project files. Check Git permissions.');
 const staged=git(['diff','--cached','--name-only','-z'],project);
 if(!staged.ok)throw Error('Could not inspect staged files; publish stopped.');
 const bad=staged.out.split('\0').filter(Boolean).filter(f=>
  f.split(/[\/\\]/).some(n=>/^\.env(?:\.|$)|\.(?:pem|p12|pfx|key)$|^id_(?:rsa|ed25519)$/.test(n)&&n!=='.env.example') ||
  /(?:^|\/)(?:node_modules|\.next|\.openbuilder|\.vercel)(?:\/|$)/.test(f));
 if(bad.length){
  git(['reset'],project);
  throw Error('Publish blocked: sensitive/generated files were staged. Update .gitignore and rotate any exposed secrets.');
 }
 const commit=git(['commit','-m','Initial application'],project);
 if(!commit.ok)throw Error('Git first commit failed. Configure git user.name and user.email and retry.');
}
export async function githubAction({operation,project,repoName,visibility='private',repo,confirm=false,push=true}){
 if(!['status','create','connect'].includes(operation))throw Error('github operation must be status, create or connect.');
 if(operation==='status')return githubStatus(project);
 const state=githubStatus(project);
 if(state.remote)return {...state,alreadyConnected:true,action:'none'};
 if(!confirm)throw Error('GitHub changes require explicit user approval. Re-run with --confirm only after the owner approves the repository and visibility.');
 requireGh(project);
 let full,created=false;
 if(operation==='create'){
  if(!['private','public'].includes(visibility))throw Error('Visibility must be private or public.');
  const name=validateProjectName(repoName||path.basename(project));
  const account=gh(['api','user','--jq','.login'],project);
  if(!account.ok||!/^[a-zA-Z0-9-]{1,39}$/.test(account.out))throw Error('Could not determine authenticated GitHub account.');
  full=`${account.out}/${name}`;
  const found=gh(['repo','view',full,'--json','name'],project);
  if(found.ok)throw Error('A repository with that name already exists. Choose github connect instead; never overwrite.');
 }else {
  full=parseRepository(repo).full;
  const found=gh(['repo','view',full,'--json','url'],project);
  if(!found.ok)throw Error('Existing repository not found or no authorization. Check name and permissions.');
 }
 await verifySafe(project);
 ensureGitRoot(project);
 if(push)await firstCommit(project);
 if(operation==='create'){
  const args=['repo','create',full,visibility==='public'?'--public':'--private','--source',project,'--remote','origin'];
  if(push)args.push('--push');
  const result=gh(args,project);
  if(!result.ok)throw Error('GitHub repository creation failed. Check gh permissions, network, and whether the repo was partly created; do not retry blindly.');
  created=true;
 }else{
  const remote=git(['remote','add','origin',`https://github.com/${full}.git`],project);
  if(!remote.ok)throw Error('Could not link origin; inspect existing Git remotes.');
  if(push){
   const published=git(['push','-u','origin','HEAD'],project);
   if(!published.ok)throw Error('Connected to existing GitHub repository, but push failed. Check branch history/permissions. Do not force-push.');
  }
 }
 return {...githubStatus(project),created,action:operation,repo:full,
  url:`https://github.com/${full}`,pushed:push};
}
