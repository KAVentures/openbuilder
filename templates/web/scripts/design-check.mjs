import {evaluateDesign} from './design-review.mjs';
const result=await evaluateDesign(process.cwd());
console.log('Visual design review: '+(result.ready?'ready':'not ready'));
for(const problem of result.issues)console.log('- '+problem);
if(process.argv.includes('--strict')&&!result.ready)process.exitCode=1;
