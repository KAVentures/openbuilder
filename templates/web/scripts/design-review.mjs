import fs from 'node:fs/promises';
import path from 'node:path';

const plain = x => typeof x === 'string' && x.trim().length >= 15 && !/^(?:todo|tbd|replace|placeholder|coming soon)/i.test(x.trim());
const text = x => typeof x === 'string' && x.trim().length >= 4;
const color = x => typeof x === 'string' && /^#[\da-f]{6}$/i.test(x);
export async function evaluateDesign(project){
 const file=path.join(project,'design-review.json');
 const issues=[];
 let plan;
 try{plan=JSON.parse(await fs.readFile(file,'utf8'));}
 catch {return {ready:false,issues:['Missing or invalid design-review.json. Design the app before releasing it.'],plan:null};}
 if(plan.version!==1)issues.push('design-review.json version must equal 1.');
 if(plan.status!=='ready')issues.push('Design review status is not ready. Complete the design pass; do not mark a starter ready.');
 if(!plain(plan.product?.goal))issues.push('Describe the actual product goal (15+ characters).');
 if(!plain(plan.product?.audience))issues.push('Describe the real target audience and devices (15+ characters).');
 if(!plain(plan.direction?.concept))issues.push('Specify a distinctive visual direction and rationale (15+ characters).');
 if(!text(plan.direction?.typeface))issues.push('Specify the actual typeface or font stack.');
 for(const key of ['background','foreground','primary','surface','accent'])if(!color(plan.direction?.palette?.[key]))issues.push('Set a six-digit hex palette color: '+key+'.');
 if(!Array.isArray(plan.pages)||!plan.pages.length||plan.pages.some(x=>
  !x||typeof x.route!=='string'||!x.route.startsWith('/')||!plain(x.purpose)||
  !plain(x.mobile)))issues.push('Describe each key page route, purpose and mobile behavior.');
 const sd=plan.superdesign;
 if(!['used','unavailable','declined'].includes(sd?.status))issues.push('Set SuperDesign status to used, unavailable or declined; do not guess.');
 else if(sd.status==='used'&&(!text(sd.projectId)||!text(sd.draftId)||!plain(sd.implementation)))issues.push('Used SuperDesign: record real project ID, draft ID and implementation evidence.');
 else if(sd.status!=='used'&&!plain(sd.reason))issues.push('Explain why SuperDesign was unavailable/declined (15+ chars), then use the design-first fallback.');
 const cu=plan.canvasUi;
 if(!['used','not-suitable','declined','unavailable'].includes(cu?.decision))issues.push('Evaluate Canvas UI suitability explicitly; a component is not mandatory.');
 else if(!plain(cu.reason))issues.push('Record the Canvas UI design/performance/licensing rationale (15+ chars).');
 else if(cu.decision==='used'&&(!text(cu.component)||!plain(cu.implementation)))issues.push('For selected Canvas UI components, record the exact component and actual integration evidence.');
 for(const key of ['mobile','accessibility','performance','visual']) {
  const v=plan.review?.[key];
  if(v?.done!==true||!plain(v?.evidence))issues.push('Verify '+key+' in an actual review and record specific evidence (not a fabricated check).');
 }
 return {ready:issues.length===0,issues,plan};
}
