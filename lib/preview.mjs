import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
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
      const filename=decodeURIComponent(url.pathname);
      if(filename.includes('\\')||filename.includes('\0')) {res.writeHead(400);res.end();return;}
      const target=path.resolve(root,'.'+filename);
      if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
      const full=await fs.realpath(target).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
      if(!full||full!==root&&!full.startsWith(root+path.sep)){res.writeHead(404);res.end();return;}
      let stat=await fs.stat(full);
      const file=stat.isDirectory()?path.join(full,'index.html'):full;
      stat=await fs.stat(file);
      if(!stat.isFile()) {res.writeHead(404);res.end();return;}
      const ext=path.extname(file);
      if(!types[ext]) {res.writeHead(403);res.end();return;}
      res.writeHead(200,{'content-type':types[ext],'x-content-type-options':'nosniff','cache-control':'no-store','content-security-policy':"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'"});
      if(req.method==='HEAD'){res.end();return;}
      res.end(await fs.readFile(file));
    } catch {res.writeHead(404);res.end('Not found');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  console.log(`Local preview: http://127.0.0.1:${port}\nNo Vercel requests will be made.`);
}
