import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

// Heuristic only: this does not inspect complete Git history, production runtime,
// external provider policies or actual authorization behavior.
const skip=new Set(['.git','.next','.vercel','.openbuilder','node_modules','dist','coverage','build','.turbo']);
const allowedExt=new Set(['.js','.mjs','.cjs','.jsx','.ts','.tsx','.vue','.svelte','.astro','.py','.toml','.json','.html','.css','.md','.sql','.yaml','.yml','.txt','.sh','.go','.rs']);
const secrets=[
 ['OPENAI_KEY',/\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
 ['SUPABASE_SECRET',/\bsb_secret_[A-Za-z0-9_-]{12,}\b/g],
 ['STRIPE_SECRET',/\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g],
 ['GITHUB_TOKEN',/\b(?:gh[pousr]_[A-Za-z0-9_]{25,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
 ['RESEND_KEY',/\bre_[A-Za-z0-9]{22,}\b/g],
 ['GOOGLE_KEY',/\bAIza[0-9A-Za-z_-]{35}\b/g],
 ['AWS_ACCESS_KEY',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
 ['PRIVATE_KEY',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g]
];
const f=(id,severity,message,location)=>({id,severity,message,...(location?{location}:{})});
const publicVar=/(?:\b(?:NEXT_PUBLIC_|VITE_)[A-Z0-9_]+\s*[:=]\s*['"`]?)([^'"`\s;]+)/g;
function legacyServiceRoleJWT(content){
 const re=/\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{8,}\b/g;
 let m;
 while((m=re.exec(content))!==null){
  try {const claim=JSON.parse(Buffer.from(m[0].split('.')[1],'base64url').toString('utf8'));if(claim.role==='service_role')return m.index;}catch{}
 }
 return -1;
}
async function walk(dir,rel='',out=[],limit=4000){
 if(out.length>=limit)return out;
 for(const entry of await fs.readdir(path.join(dir,rel),{withFileTypes:true})){
  if(entry.isSymbolicLink()||skip.has(entry.name))continue;
  const name=path.join(rel,entry.name);
  if(entry.isDirectory())await walk(dir,name,out,limit);
  else if(entry.isFile())out.push(name);
  if(out.length>=limit)break;
 }
 return out;
}
export async function audit(project){
 const files=await walk(project),findings=[];let passed=0,scanned=0;
 let manifest=null;
 try{manifest=JSON.parse(await fs.readFile(path.join(project,'openbuilder.json'),'utf8'));}
 catch{findings.push(f('MANIFEST','blocker','Missing or invalid openbuilder.json.'));}
 const features=manifest?.features||{};
 const noAutoDeploy=manifest?.deployment?.provider==='vercel'&&manifest?.deployment?.automatic===false;
 const vercelFile=files.find(p=>p.replaceAll('\\','/')==='vercel.json');
 if(noAutoDeploy&&!vercelFile)findings.push(f('VERCEL_CONFIG_MISSING','blocker','vercel.json missing: Git-triggered Vercel builds may resume.'));
 for(const rel of files){
  const basename=path.basename(rel),ext=path.extname(rel);
  if(basename.startsWith('.env')&&basename!=='.env.example')continue;
  if(!allowedExt.has(ext)&&basename!=='.env.example')continue;
  const info=await fs.stat(path.join(project,rel));
  if(info.size>1024*1024)continue;
  const content=await fs.readFile(path.join(project,rel),'utf8');scanned++;
  for(const [id,re] of secrets){re.lastIndex=0;const m=re.exec(content);if(m)findings.push(f(id,'blocker',`Possible hardcoded ${id}. Revoke/rotate if exposed.`,`${rel}:${content.slice(0,m.index).split('\n').length}`));}
  const jwtPos=legacyServiceRoleJWT(content);
  if(jwtPos>=0)findings.push(f('SUPABASE_SERVICE_ROLE_JWT','blocker','Legacy service_role JWT is present in source; rotate credential if published.',`${rel}:${content.slice(0,jwtPos).split('\n').length}`));
  publicVar.lastIndex=0;let m;
  while((m=publicVar.exec(content))!==null){
   const value=m[1];
   // The Firebase web API key and Supabase anon/publishable keys are intentionally public.
   if(/(?:^sk_|^sk-|^sb_secret_|^gh[pousr]_|^re_[A-Za-z0-9]{22,}|-----BEGIN)/.test(value))
    findings.push(f('PUBLIC_SECRET','blocker','Secret-shaped value assigned to a public frontend variable.',rel));
  }
  if(rel.replaceAll('\\','/')==='vercel.json'){
   try{const cfg=JSON.parse(content);
    if(cfg.git?.deploymentEnabled===false)passed++;
    else if(noAutoDeploy)findings.push(f('AUTO_DEPLOY','blocker','Vercel Git deployments not disabled in vercel.json.',rel));
    else findings.push(f('AUTO_DEPLOY','manual','Verify actual Git deployment settings.',rel));
   }catch{findings.push(f('VERCEL_CONFIG','blocker','Invalid vercel.json.',rel));}
  }
  if(features.indexed&&/sitemap\.xml$/.test(rel)&&/(?:example\.com|localhost|your-domain\.example)/i.test(content))
   findings.push(f('PLACEHOLDER_SITEMAP','blocker','Public sitemap still contains a placeholder domain.',rel));
 }
 if(scanned)passed++;else findings.push(f('NO_SCANNABLE_FILES','manual','No recognized source files scanned.'));
 try{
  const tracked=execFileSync('git',['ls-files','--cached','-z'],{cwd:project,encoding:'utf8',timeout:3000,stdio:['ignore','pipe','ignore']}).split('\0').filter(Boolean);
  for(const rel of tracked)if(/(^|\/)\.env(?:\.|$)/.test(rel)&&!rel.endsWith('.env.example'))findings.push(f('TRACKED_ENV','blocker','.env file tracked in Git. Rotate if a real secret was published.',rel));
 }catch{findings.push(f('GIT_HISTORY','manual','Git index and full history were not audited.'));}
 if(features.auth)findings.push(f('AUTHZ','manual','Verify server-side auth on every protected route with negative tests.'));
 if(features.database)findings.push(f('RLS','manual','Verify Supabase RLS and Storage isolation with two users.'));
 if(features.email)findings.push(f('EMAIL','manual','Verify SPF/DKIM/DMARC and real inbox delivery.'));
 if(features.payments)findings.push(f('PAYMENT','manual','Verify payment sandbox flows and signed webhook behavior.'));
 if(features.ai)findings.push(f('BUDGET','manual','Verify quota enforcement, rate limits and actual provider budgets.'));
 if(features.personalData)findings.push(f('PRIVACY','manual','Owner must verify actual privacy and legal commitments.'));
 if(features.indexed){
  if(!files.some(x=>/(?:sitemap\.(?:ts|js|xml))$/.test(x)))findings.push(f('SITEMAP','manual','Public sitemap not detected.'));
  if(!files.some(x=>/(?:robots\.(?:ts|js|txt))$/.test(x)))findings.push(f('ROBOTS','manual','Robots configuration not detected.'));
  if(files.some(x=>x.replaceAll('\\','/')==='app/robots.ts')){
   findings.push(f('INDEX_ORIGIN','manual','Before launch set NEXT_PUBLIC_SITE_URL to the real HTTPS canonical origin; otherwise robots.txt intentionally disallows indexing.'));
  }
  findings.push(f('SEARCH_CONSOLE','manual','Verify real-domain indexing, canonical tags and Search Console.'));
 }
 findings.push(f('LIVE_TESTS','manual','Runtime security, mobile performance, backup restores and provider integration tests remain unverified.'));
 return {version:2,project:path.basename(project),template:manifest?.template||'unknown',scannedFiles:scanned,findings,summary:{blockers:findings.filter(x=>x.severity==='blocker').length,manual:findings.filter(x=>x.severity==='manual').length,passed}};
}
