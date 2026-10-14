import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.mp4':'video/mp4','.webm':'video/webm','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
const privateNames=new Set(['openbuilder.json','vercel.json','package.json','package-lock.json','tsconfig.json','LICENSE']);
export async function resolveAsset(root,requested){
 if(typeof requested!=='string')return null;
 let decoded;
 try{decoded=decodeURIComponent(requested);}catch{return null;}
 if(decoded.includes('\\')||decoded.includes('\0'))return null;
 const rel=decoded==='/'?'index.html':decoded.replace(/^\//,'');
 if(rel.split('/').some(segment=>!segment||segment==='.'||segment==='..'||segment.startsWith('.')))return null;
 if(privateNames.has(rel)||rel.startsWith('scripts/')||rel.startsWith('tests/')||!types[path.extname(rel).toLowerCase()])return null;
 const target=path.resolve(root,rel);
 if(!target.startsWith(root+path.sep))return null;
 try{
  const full=await fs.realpath(target);
  if(!full.startsWith(root+path.sep))return null;
  if(!(await fs.stat(full)).isFile())return null;
  return full;
 }catch{return null;}
}
export function npmCommand(args){
 // npm.cmd requires cmd.exe on Windows; arguments here are fully trusted
 // static literals with an integer-validated port.
 return process.platform==='win32'?['cmd.exe',['/d','/s','/c','npm',...args]]:['npm',args];
}
export async function preview(project,port){
 let manifest;
 try{manifest=JSON.parse(await fs.readFile(path.join(project,'openbuilder.json'),'utf8'));}catch{throw Error('Missing openbuilder.json.');}
 if(manifest.template==='web'){
  await fs.access(path.join(project,'package.json'));
  console.log(`Local Next.js preview http://127.0.0.1:${port} (no Vercel calls)`);
  const [cmd,args]=npmCommand(['run','dev','--','--hostname','127.0.0.1','--port',String(port)]);
  const child=spawn(cmd,args,{cwd:project,stdio:'inherit',shell:false});
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>child.kill(signal));
  await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error(`Preview exited ${code}`)));});
  return;
 }
 if(manifest.template!=='game')throw Error('Preview supports game and web.');
 const root=await fs.realpath(project);
 const server=http.createServer(async(req,res)=>{
  try{
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
   const url=new URL(req.url,'http://localhost');
   const file=await resolveAsset(root,url.pathname);
   if(!file){res.writeHead(404);res.end('Not found');return;}
   res.writeHead(200,{'content-type':types[path.extname(file).toLowerCase()],'x-content-type-options':'nosniff','cache-control':'no-store','content-security-policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; object-src 'none'; base-uri 'none'"});
   if(req.method==='HEAD'){res.end();return;}res.end(await fs.readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 console.log(`Local preview http://127.0.0.1:${port}; no Vercel calls.`);
}
