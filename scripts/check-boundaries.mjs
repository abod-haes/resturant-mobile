#!/usr/bin/env node
/** Dependency-boundary guard. No external dependencies. */
import {readdirSync,readFileSync,existsSync} from "node:fs";
import {join,relative,resolve,sep} from "node:path";
const root=process.cwd(),issues=[];
const kind=process.env.ARCH_KIND??(existsSync(join(root,"apps/admin"))?"dashboard":existsSync(join(root,"app/_layout.tsx"))?"mobile":existsSync(join(root,"src/app.module.ts"))?"backend":"customer");
const extensions=/\.(?:ts|tsx|js|jsx|mjs)$/;
function files(dir){if(!existsSync(dir))return [];return readdirSync(dir,{withFileTypes:true}).flatMap(e=>{if(["node_modules","dist","build","coverage",".git",".expo"].includes(e.name))return [];const p=join(dir,e.name);return e.isDirectory()?files(p):extensions.test(e.name)?[p]:[]})}
function fail(file,message){issues.push(relative(root,file)+": "+message)}
function matches(source){return [...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(|\brequire\s*\()\s*["']([^"']+)["']/g)].map(x=>x[1])}
function target(file,spec){return spec.startsWith(".")?resolve(file,"..",spec):null}
function isWithin(p,dir){return p===dir||p.startsWith(dir+sep)}
const roots=kind==="dashboard"?["apps/admin/src","apps/restaurant/src","packages"]:kind==="backend"?["src"]:kind==="mobile"?["app","src"]:["src"];
for(const file of roots.flatMap(x=>files(join(root,x)))){
 const from=relative(root,file).replaceAll("\\","/");
 const content=readFileSync(file,"utf8");
 for(const spec of matches(content)){
  const dest=target(file,spec);
  if(kind==="dashboard"){
   if(from.startsWith("apps/admin/")&&dest&&isWithin(dest,join(root,"apps/restaurant")))fail(file,"Admin must not import restaurant app");
   if(from.startsWith("apps/restaurant/")&&dest&&isWithin(dest,join(root,"apps/admin")))fail(file,"Restaurant must not import admin app");
   if(from.startsWith("packages/")&&dest&&(isWithin(dest,join(root,"apps/admin"))||isWithin(dest,join(root,"apps/restaurant"))))fail(file,"Shared package must not import an app");
   if(from.startsWith("apps/")&&dest&&isWithin(dest,join(root,"packages")))fail(file,"Import shared code through @restaurant/* package exports");
   if(from.startsWith("packages/")&&spec.startsWith("@restaurant/"))fail(file,"Shared package cannot import sibling package without explicit dependency review");
  }
  if(kind==="backend"){
   const m=from.match(/^src\/modules\/([^/]+)\//);
   if(m&&dest){const to=relative(root,dest).replaceAll("\\","/").match(/^src\/modules\/([^/]+)\//);if(to&&to[1]!==m[1])fail(file,"Cross-module deep import forbidden; use exported provider contracts");}
   if(from.includes("/domain/")&&(/@nestjs\//.test(spec)||/prisma|typeorm|sequelize|axios|fetch/.test(spec)))fail(file,"Domain must be framework and persistence independent");
  }
  if(kind==="mobile"||kind==="customer"){
   const feature=from.match(/^src\/features\/([^/]+)\//);
   if(feature&&dest){const to=relative(root,dest).replaceAll("\\","/").match(/^src\/features\/([^/]+)\//);if(to&&to[1]!==feature[1])fail(file,"Feature-to-feature deep import forbidden");}
   if(from.startsWith("src/shared/")&&dest&&isWithin(dest,join(root,"src/features")))fail(file,"Shared must not depend on features");
   if(kind==="mobile"&&from.startsWith("app/")&&/src\/features\/[^/]+\//.test(spec))fail(file,"Expo routes must import from feature public entrypoints");
   if(kind==="customer"&&from==="src/App.tsx"&&/features\/[^/]+\//.test(spec))fail(file,"App must import from feature public entrypoints");
  }
 }
}
if(issues.length){console.error("Architecture boundary violations:\n"+issues.map(x=>" - "+x).join("\n"));process.exit(1)}
console.log("Architecture boundaries OK ("+kind+")");
