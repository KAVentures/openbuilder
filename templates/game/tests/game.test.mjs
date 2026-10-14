import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('static game and styles exist',()=>{assert.ok(fs.existsSync('index.html'));assert.ok(fs.existsSync('game.js'));assert.ok(fs.existsSync('style.css'));});
test('Git pushes do not automatically deploy on Vercel',()=>{assert.equal(JSON.parse(fs.readFileSync('vercel.json','utf8')).git.deploymentEnabled,false);});
test('public sitemap requires explicit owner setup',()=>{assert.equal(JSON.parse(fs.readFileSync('openbuilder.json','utf8')).features.indexed,false);});
