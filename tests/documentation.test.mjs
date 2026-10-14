import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const text = name => fs.readFileSync(path.join(root,name),'utf8');

test('MIT license is present and attributed', ()=>{
 const license=text('LICENSE');
 assert.match(license,/^MIT License/);
 assert.match(license,/Copyright \(c\) 2026 KAVentures and OpenBuilder contributors/);
 assert.match(license,/Permission is hereby granted/);
});
test('README has genuine paths to ChatGPT, Claude, Codex and CLI', ()=>{
 const r=text('README.md');
 for(const value of ['docs/GETTING_STARTED.md','skills/openbuilder/SKILL.md','AGENTS.md','claude','codex','--template game','--template web']) assert.ok(r.includes(value),value);
});
test('beginner docs and agent files exist', ()=>{
 for(const f of ['AGENTS.md','CLAUDE.md','skills/openbuilder/SKILL.md','docs/GETTING_STARTED.md','docs/CONNECTORS.md','docs/LAUNCH.md','docs/FAQ.md','docs/MAINTAINER_SETUP.md']) assert.ok(fs.existsSync(path.join(root,f)),f);
});
test('user-created projects are not accidentally checked into toolkit', ()=>{
 assert.match(text('.gitignore'),/^projects\/$/m);
});
