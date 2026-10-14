import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
const assets=new Set(['index.html','game.js','style.css','robots.txt','sitemap.xml']);
export async function resolveAsset(root,requestPath) {
  // Only explicitly public files can be served. Not manifests, dotfiles,
  // ignored secrets, launch evidence, or arbitrary files in generated apps.
  if(typeof requestPath!=='string') return null;
  let decoded;
  try {decoded=decodeURIComponent(requestPath);}catch{return null;}
  if(decoded.includes('\\')||decoded.includes('\0')) return null;
  const rel=decoded==='/'?'index.html':decoded.replace(/^\//,'');
  if(!assets.has(rel)&&!(rel.startsWith('assets/')&&!rel.split('/').includes('..')))return null;
  if(rel.split('/').some(p=>p==='.'||p==='..'||p.startsWith('.')))return null;
  if(!types[path.extname(rel)])return null;
  const target=path.resolve(root,rel);
  if(!target.startsWith(root+path.sep))return null;
  try{
    const real=await fs.realpath(target);
    if(!real.startsWith(root+path.sep))return null; // prevent symlink escapes
    if(!(await fs.stat(real)).isFile())return null;
    return real;
  }catch{return null;}
}
export async function preview(project,port) {
  let manifest;
  try { manifest=JSON.parse(await fs.readFile(path.join(project,'openbuilder.json'),'utf8')); }
  catch { throw Error('Missing openbuilder.json. Use a generated project or configure the manifest.'); }
  if(manifest.template==='web') {
    await fs.access(path.join(project,'package.json'));
    console.log(`Starting Next.js locally at http://127.0.0.1:${port}. No Vercel preview is created.`);
    const child=spawn('npm',['run','dev','--','--hostname','127.0.0.1','--port',String(port)],{cwd:project,stdio:'inherit',shell:false});
    for(const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>child.kill(signal));
    await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error(`Dev server exited ${code}`)));});
    return;
  }
  if(manifest.template!=='game') throw Error('Preview supports only game and web templates.');
  const root=await fs.realpath(project);
  const server=http.createServer(async(req,res)=>{
    try {
      if(!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
      const url=new URL(req.url,'http://localhost');
      const file=await resolveAsset(root,url.pathname);
      if(!file){res.writeHead(404);res.end('Not found');return;}
      const ext=path.extname(file);
      res.writeHead(200,{'content-type':types[ext],'x-content-type-options':'nosniff','cache-control':'no-store','content-security-policy':"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'"});
      if(req.method==='HEAD'){res.end();return;}
      res.end(await fs.readFile(file));
    } catch {res.writeHead(404);res.end('Not found');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  console.log(`Local preview: http://127.0.0.1:${port}\nNo Vercel requests will be made.`);
}
