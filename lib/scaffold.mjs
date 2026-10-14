import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function scaffold({name,template='web',parent='.'}) {
  if(!/^[a-z][a-z0-9-]{1,48}$/.test(name)||name.endsWith('-')||name.includes('--')) throw Error('Use a lowercase project name (2–49 letters, digits, hyphens).');
  if(!['web','game'].includes(template)) throw Error('Template must be web or game.');
  const target=path.resolve(parent,name);
  // No overwriting, including an existing empty folder or symlink.
  try { await fs.lstat(target); throw Error('Destination already exists: '+target); }
  catch(e) {if(e.code!=='ENOENT') throw e;}
  const source=path.join(root,'templates',template);
  await fs.cp(source,target,{recursive:true,errorOnExist:true,force:false});
  // Personalize the title without executing user-supplied text.
  const manifestFile=path.join(target,'openbuilder.json');
  const manifest=JSON.parse(await fs.readFile(manifestFile,'utf8'));
  manifest.name=name;
  await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
  if(template==='web'){
    const pkgFile=path.join(target,'package.json');
    const pkg=JSON.parse(await fs.readFile(pkgFile,'utf8'));
    pkg.name=name;
    await fs.writeFile(pkgFile,JSON.stringify(pkg,null,2)+'\n');
  }
  return target;
}
