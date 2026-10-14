import fs from 'node:fs/promises';
import path from 'node:path';

const plain = x => typeof x === 'string' && x.trim().length >= 15 && !/^(?:todo|tbd|replace|placeholder|coming soon)/i.test(x.trim());
const text = x => typeof x === 'string' && x.trim().length >= 4;
const color = x => typeof x === 'string' && /^#[\da-f]{6}$/i.test(x);

function safePublicSite(raw) {
 try {
  const u=new URL(raw);
  if(u.protocol!=='https:'||u.username||u.password||u.searchParams.has('key'))return null;
  const h=u.hostname.toLowerCase();
  if(!h.includes('.')||h==='localhost'||/^(?:\d+\.){3}\d+$/.test(h)
    ||h.endsWith('.local')||h.endsWith('.test')||h.endsWith('.invalid')
    ||h.endsWith('.example')||h==='example.com'||h.endsWith('.example.com'))return null;
  return h.replace(/^www\./,'');
 }catch {return null;}
}
function checkedRecently(value){
 const time=Date.parse(value);
 return typeof value==='string'&&Number.isFinite(time)&&time<=Date.now()+300000&&time>=Date.now()-90*86400000;
}
function checkCompetitorFallback(research,issues){
 if(research?.status!=='researched'){
  issues.push('SuperDesign fallback requires completed live competitor research; do not use a generic invented design.');
  return;
 }
 if(!plain(research.industry))issues.push('Specify the actual industry and geographic/audience segment researched.');
 if(!Array.isArray(research.queries)||research.queries.length<2||
   research.queries.some(q=>!text(q)))issues.push('Record at least two real search queries used to discover competitor designs.');
 const candidates=research.candidates;
 if(!Array.isArray(candidates)||candidates.length<3){
  issues.push('Research at least three distinct, relevant LIVE competitor websites before choosing a reference.');
  return;
 }
 const unique=new Set();
 let best=0;
 for(const c of candidates){
  const domain=safePublicSite(c?.url);
  if(!domain)issues.push('Each competitor must have a real HTTPS website URL (no localhost/placeholders).');
  else if(unique.has(domain))issues.push('Competitor candidates must be on distinct website domains.');
  else unique.add(domain);
  if(!checkedRecently(c?.inspectedAt))issues.push('Competitor inspections need a real ISO timestamp within 90 days.');
  if(!Number.isInteger(c?.visualScore)||c.visualScore<1||c.visualScore>5)
   issues.push('Record an honest, subjective visualScore from 1 to 5 for each competitor.');
  else best=Math.max(best,c.visualScore);
  for(const k of ['layout','typography','color','motion','mobile']){
   if(!plain(c?.observations?.[k]))issues.push('Record observed competitor '+k+' details, not only its name or ranking.');
  }
  if(!plain(c?.visualEvidence))issues.push('Record browser screenshot/visual inspection evidence for each competitor; search snippets alone are not visual review.');
  if(!plain(c?.selectionRationale))issues.push('Explain what specifically works or fails about each competitor design.');
 }
 const selected=candidates.find(c=>c.url===research.selectedUrl);
 if(!selected)issues.push('Select one of the inspected competitor URLs as primary reference.');
 else if(selected.visualScore<best&&!plain(research.whyChosen))
  issues.push('Explain why the selected reference scores below the most visually appealing candidate.');
 if(!Array.isArray(research.adaptedPatterns)||research.adaptedPatterns.length<3||
   research.adaptedPatterns.some(x=>!plain(x)))
  issues.push('Specify at least three observed layout/type/motion patterns to reinterpret in the new website.');
 if(!plain(research.originality?.distinctBrand))
  issues.push('Document how the new brand, logo, wording, and page composition differ from the competitor.');
 if(!plain(research.originality?.assetsAndFonts))
  issues.push('Document original/licensed imagery, fonts and icons; do not copy competitor assets.');
 if(!plain(research.originality?.effects))
  issues.push('Explain how interactions will be independently implemented or licensed rather than copied from source.');
 if(!plain(research.originality?.fit))
  issues.push('Explain which competitor elements are unsuitable for this product and why.');
}
export async function evaluateDesign(project){
 const file=path.join(project,'design-review.json');
 const issues=[];
 let plan;
 try{plan=JSON.parse(await fs.readFile(file,'utf8'));}
 catch{return {ready:false,issues:['Missing or invalid design-review.json. Design the app before releasing it.'],plan:null};}
 if(plan.version!==1)issues.push('design-review.json version must equal 1.');
 if(plan.status!=='ready')issues.push('Design review status is not ready. Complete the design pass; do not mark a starter ready.');
 if(!plain(plan.product?.goal))issues.push('Describe the actual product goal (15+ characters).');
 if(!plain(plan.product?.audience))issues.push('Describe the real target audience and devices (15+ characters).');
 if(!plain(plan.direction?.concept))issues.push('Specify a distinctive visual direction and rationale (15+ characters).');
 if(!text(plan.direction?.typeface))issues.push('Specify the actual typeface or font stack.');
 for(const key of ['background','foreground','primary','surface','accent'])
  if(!color(plan.direction?.palette?.[key]))issues.push('Set a six-digit hex palette color: '+key+'.');
 if(!Array.isArray(plan.pages)||!plan.pages.length||plan.pages.some(x=>
   !x||typeof x.route!=='string'||!x.route.startsWith('/')||!plain(x.purpose)||!plain(x.mobile)))
  issues.push('Describe each key page route, purpose and mobile behavior.');
 const sd=plan.superdesign;
 if(!['used','unavailable','declined'].includes(sd?.status))
  issues.push('Set SuperDesign status to used, unavailable or declined; do not guess.');
 else if(sd.status==='used'&&(!text(sd.projectId)||!text(sd.draftId)||!plain(sd.implementation)))
  issues.push('Used SuperDesign: record real project ID, draft ID and implementation evidence.');
 else if(sd.status!=='used'){
  if(!plain(sd.reason))issues.push('Explain why SuperDesign was unavailable/declined (15+ chars).');
  checkCompetitorFallback(plan.competitorResearch,issues);
 }
 const cu=plan.canvasUi;
 if(!['used','not-suitable','declined','unavailable'].includes(cu?.decision))
  issues.push('Evaluate Canvas UI suitability explicitly; a component is not mandatory.');
 else if(!plain(cu.reason))issues.push('Record the Canvas UI design/performance/licensing rationale (15+ chars).');
 else if(cu.decision==='used'&&(!text(cu.component)||!plain(cu.implementation)))
  issues.push('For selected Canvas UI components, record the exact component and actual integration evidence.');
 for(const key of ['mobile','accessibility','performance','visual']){
  const v=plan.review?.[key];
  if(v?.done!==true||!plain(v?.evidence))
   issues.push('Verify '+key+' in an actual review and record specific evidence (not a fabricated check).');
 }
 return {ready:issues.length===0,issues,plan};
}
