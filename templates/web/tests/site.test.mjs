import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('no premature automatic preview deployments',()=>{assert.equal(JSON.parse(fs.readFileSync('vercel.json','utf8')).git.deploymentEnabled,false);});
test('public pages have explicit robots and sitemap implementations',()=>{assert.ok(fs.existsSync('app/robots.ts'));assert.ok(fs.existsSync('app/sitemap.ts'));});
test('no misleading real privacy policy',()=>{assert.match(fs.readFileSync('app/privacy/page.tsx','utf8'),/Draft required/);});
