import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const skip=new Set(['.git','.next','.vercel','.openbuilder','node_modules','dist','coverage','build','.turbo']);
const allowedExt=new Set(['.js','.mjs','.cjs','.jsx','.ts','.tsx','.json','.html','.css','.md','.sql','.yaml','.yml','.env','.txt']);
const secretPatterns=[
  ['OPENAI_KEY',/\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
  ['SUPABASE_SECRET',/\bsb_secret_[A-Za-z0-9_-]{12,}\b/g],
  ['STRIPE_SECRET',/\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g],
  ['GITHUB_TOKEN',/\bgh[pousr]_[A-Za-z0-9_]{25,}\b/g],
  ['RESEND_KEY',/\bre_[A-Za-z0-9]{22,}\b/g],
  ['PRIVATE_KEY',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
];
function finding(id,severity,message,location) {return {id,severity,message,...(location?{location}:{})};}
async function walk(dir,base='',limit=3500) {
  if(limit<=0) return [];
  let result=[];
  for(const d of await fs.readdir(dir,{withFileTypes:true})) {
    if(skip.has(d.name)||d.isSymbolicLink()) continue;
    const rel=path.join(base,d.name);
    if(d.isDirectory()) {result.push(...await walk(path.join(dir,d.name),rel,limit-result.length));}
    else if(d.isFile()&&result.length<limit) result.push(rel);
    if(result.length>=limit) break;
  }
  return result;
}
export async function audit(project) {
  const files=await walk(project);
  const findings=[]; let passed=0;
  const manifestFile=path.join(project,'openbuilder.json');
  let manifest=null;
  try {manifest=JSON.parse(await fs.readFile(manifestFile,'utf8'));}
  catch(e){findings.push(finding('MANIFEST','manual','No valid openbuilder.json; feature-specific checks need manual review.'));}
  const features=manifest?.features||{};
  let scanned=0;
  for(const rel of files) {
    const basename=path.basename(rel);
    const ext=path.extname(rel);
    // Local .env files are the correct place for server-side secrets if ignored by Git.\n    // Scan tracked env files separately; never open local secret stores to report values.\n    if(basename.startsWith('.env') && basename!=='.env.example') continue;\n    if(!allowedExt.has(ext)&&basename!=='.env.example') continue;
    const stat=await fs.stat(path.join(project,rel));
    if(stat.size>512000) continue;
    const content=await fs.readFile(path.join(project,rel),'utf8');
    scanned++;
    // Do not include matched secret values or source excerpts in reports.
    for(const [name,re] of secretPatterns){
      re.lastIndex=0; const match=re.exec(content);
      if(match) findings.push(finding(name,'blocker',`Potential hardcoded credential in source: ${name}. Revoke/rotate if previously published.`,`${rel}:${content.slice(0,match.index).split('\n').length}`));
    }
    if(/\bNEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|SERVICE_ROLE|PRIVATE_KEY|API_KEY)\b/.test(content))
      findings.push(finding('PUBLIC_SECRET','blocker','Potential secret configured for a public frontend variable.',rel));
    if((/\b(?:service_role|sb_secret_)\b/i.test(content))&&/\b(?:NEXT_PUBLIC_|VITE_|localStorage|window\.)/.test(content))
      findings.push(finding('PRIVILEGED_CLIENT','blocker','Possible privileged database credential in client-accessible code.',rel));
    if(rel.endsWith('vercel.json')) {
      try {
        const cfg=JSON.parse(content);
        if(cfg.git?.deploymentEnabled===false) passed++;
        else findings.push(finding('AUTO_DEPLOY','manual','Git-triggered Vercel deployments are not disabled in vercel.json.',rel));
      }catch {findings.push(finding('VERCEL_CONFIG','blocker','Invalid vercel.json.',rel));}
    }
  }
  if(scanned===0) findings.push(finding('NO_SCANNABLE_FILES','manual','No recognized source files scanned.'));
  else passed++;
  // Detect tracked secret files using Git when a repository is available.
  try {
    const tracked=execFileSync('git',['ls-files','--cached','-z'],{cwd:project,encoding:'utf8',timeout:3000,stdio:['ignore','pipe','ignore']}).split('\0').filter(Boolean);
    for(const f of tracked) if(/(^|\/)\.env(?:\.|$)/.test(f) && !f.endsWith('.env.example'))
      findings.push(finding('TRACKED_ENV','blocker','A .env file is tracked in Git. Remove from history and rotate exposed keys.',f));
  } catch {findings.push(finding('GIT_HISTORY','manual','Git index/history was not audited. Check for previously committed secrets.'));}
  if(features.auth) findings.push(finding('AUTHZ','manual','Verify server-side authorization on every protected route, including a second-user negative test.'));
  if(features.database) findings.push(finding('RLS','manual','Verify RLS and storage policies using two distinct test users.'));
  if(features.email) findings.push(finding('EMAIL','manual','Verify SPF/DKIM/DMARC and test actual inbox delivery and password reset.'));
  if(features.payments) findings.push(finding('PAYMENT','manual','Verify sandbox checkout, webhook signatures, idempotency, and refunds.'));
  if(features.ai) findings.push(finding('BUDGET','manual','Verify provider budgets plus enforced quotas, rate limits and alerting.'));
  if(features.personalData) findings.push(finding('PRIVACY','manual','Owner must confirm accurate legal terms, retention, lawful basis, deletion, and data processors.'));
  if(features.indexed) {
    if(!files.some(x=>/(?:sitemap\.(?:ts|js|xml)|sitemap\.xml)$/.test(x))) findings.push(finding('SITEMAP','manual','Public site has no detected sitemap.'));
    else passed++;
    if(!files.some(x=>/(?:robots\.(?:ts|js|txt)|robots\.txt)$/.test(x))) findings.push(finding('ROBOTS','manual','Public site has no detected robots configuration.'));
    else passed++;
    findings.push(finding('SEARCH_CONSOLE','manual','Verify real-domain indexing, canonicals, redirects, SEO content and Search Console.'));
  }
  findings.push(finding('LIVE_TESTS','manual','Runtime security, mobile/performance, backups, restores, observability and real provider behavior need separate verification.'));
  return {version:1,project:path.basename(project),template:manifest?.template||'unknown',scannedFiles:scanned,findings,
    summary:{blockers:findings.filter(x=>x.severity==='blocker').length,manual:findings.filter(x=>x.severity==='manual').length,passed}};
}
