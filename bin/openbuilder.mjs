#!/usr/bin/env node
import path from 'node:path';
import { parseArgs } from 'node:util';
import { scaffold } from '../lib/scaffold.mjs';
import { audit } from '../lib/audit.mjs';
import { preview } from '../lib/preview.mjs';
import { retryCommand } from '../lib/retry.mjs';
import { release } from '../lib/release.mjs';
import { githubAction } from '../lib/github.mjs';
import { designAction } from '../lib/design.mjs';

const help = `OpenBuilder 0.1 — local-first app builder guardrails

Usage:
  node bin/openbuilder.mjs init <name> --template web|game [--dir <parent>]
  node bin/openbuilder.mjs check [project-path] [--json] [--strict]
  node bin/openbuilder.mjs preview [project-path] [--port 4173]
  node bin/openbuilder.mjs retry allow|record --kind preview|deploy --signature <error-summary> [--root-cause <label>] [--project <path>]
  node bin/openbuilder.mjs retry reset --reason <reason> --owner-approved [--project <path>]
  node bin/openbuilder.mjs release [project-path] [--json]
  node bin/openbuilder.mjs design status|check [--project <path>]
  node bin/openbuilder.mjs design inspire --query <style> --approve-external [--project <path>]
  node bin/openbuilder.mjs design draft --project-id <id> --title <title> --prompt <direction> --approve-external [--project <path>]
  node bin/openbuilder.mjs design canvas --component liquid-react --approve-external --accept-canvas-license [--project <path>]
  node bin/openbuilder.mjs github status [--project <path>]
  node bin/openbuilder.mjs github create [--name <repo-name>] [--visibility private|public] --confirm [--project <path>]
  node bin/openbuilder.mjs github connect --repo owner/name --confirm [--project <path>]

Preview never triggers Vercel. Release never deploys automatically.
All external provider operations require a connected agent or explicit manual action.`;

function argv(command, options) {
  return parseArgs({args:command,options,allowPositionals:true,strict:true});
}
async function main() {
  const [cmd,...args] = process.argv.slice(2);
  if (!cmd || ['help','--help','-h'].includes(cmd)) { console.log(help); return; }
  if (cmd==='init') {
    const {values,positionals}=argv(args,{template:{type:'string',default:'web'},dir:{type:'string',default:'.'}});
    if (!positionals[0]) throw Error('Provide a project name.');
    const dir=await scaffold({name:positionals[0],template:values.template,parent:values.dir});
    console.log(`Created ${dir}\nNext: cd ${path.relative(process.cwd(),dir) || '.'} && npm ci (web only).\nRead CONNECT.md for optional services.`);
    return;
  }
  if (cmd==='check') {
    const {values,positionals}=argv(args,{json:{type:'boolean',default:false},strict:{type:'boolean',default:false}});
    const report=await audit(path.resolve(positionals[0] || '.'));
    if(values.json) console.log(JSON.stringify(report,null,2));
    else {
      console.log(`OpenBuilder audit: ${report.project}\n`);
      for(const item of report.findings) console.log(`[${item.severity}] ${item.id}: ${item.message}`);
      console.log(`\nBlockers: ${report.summary.blockers}; manual verification items: ${report.summary.manual}; passed checks: ${report.summary.passed}`);
      console.log('Static scanning is not a full security, privacy, performance, or SEO certification.');
    }
    if(values.strict && report.summary.blockers) process.exitCode=1;
    return;
  }
  if (cmd==='preview') {
    const {values,positionals}=argv(args,{port:{type:'string',default:'4173'}});
    const port=Number(values.port);
    if(!Number.isInteger(port)||port<1024||port>65535) throw Error('Port must be an integer between 1024 and 65535.');
    await preview(path.resolve(positionals[0]||'.'),port);
    return;
  }
  if (cmd==='retry') {
    const {values,positionals}=argv(args,{kind:{type:'string'},signature:{type:'string'},'root-cause':{type:'string'},project:{type:'string',default:'.'},reason:{type:'string'},'owner-approved':{type:'boolean',default:false}});
    const result=await retryCommand({operation:positionals[0],kind:values.kind,signature:values.signature,rootCause:values['root-cause'],project:path.resolve(values.project),reason:values.reason,ownerApproved:values['owner-approved']});
    console.log(JSON.stringify(result,null,2));
    if(!result.allowed) process.exitCode=2;
    return;
  }
  if (cmd==='design') {
    const {values,positionals}=argv(args,{
      project:{type:'string',default:'.'},query:{type:'string'},
      'project-id':{type:'string'},title:{type:'string'},prompt:{type:'string'},
      component:{type:'string'},'approve-external':{type:'boolean',default:false},
      'accept-canvas-license':{type:'boolean',default:false}
    });
    const result=await designAction({project:path.resolve(values.project),operation:positionals[0],
      query:values.query,projectId:values['project-id'],title:values.title,prompt:values.prompt,
      component:values.component,approveExternal:values['approve-external'],
      acceptLicense:values['accept-canvas-license']});
    console.log(JSON.stringify(result,null,2));
    if(positionals[0]==='check'&&!result.designReady)process.exitCode=1;
    return;
  }
  if (cmd==='github') {
    const {values,positionals}=argv(args,{
      project:{type:'string',default:'.'},name:{type:'string'},visibility:{type:'string',default:'private'},
      repo:{type:'string'},confirm:{type:'boolean',default:false},
      'no-push':{type:'boolean',default:false}
    });
    const result=await githubAction({operation:positionals[0],project:path.resolve(values.project),
      repoName:values.name,visibility:values.visibility,repo:values.repo,
      confirm:values.confirm,push:!values['no-push']});
    console.log(JSON.stringify(result,null,2));
    return;
  }
  if (cmd==='release') {
    const {values,positionals}=argv(args,{json:{type:'boolean',default:false}});
    const report=await release(path.resolve(positionals[0]||'.'));
    if(values.json) console.log(JSON.stringify(report,null,2));
    else {
      console.log(`Release readiness: ${report.ready ? 'PASS (local checks only)' : 'BLOCKED'}`);
      for(const item of report.steps) console.log(`[${item.status}] ${item.name}: ${item.detail}`);
      console.log('No deployment was initiated. Real service and production smoke tests remain separate.');
    }
    if(!report.ready) process.exitCode=1;
    return;
  }
  throw Error(`Unknown command: ${cmd}\n\n${help}`);
}
main().catch(e=>{console.error(`OpenBuilder: ${e.message}`);process.exitCode=1;});
