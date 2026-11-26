import {execFileSync} from 'node:child_process';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',stdio:['ignore','pipe','ignore'],maxBuffer:1<<26});
const M=['0693be5','a44cda2','0a3895c','14d718b','ded8280','015d314','95572bf','5112e59','644cf38','0d1d177'];
const T=/(^|\/)(tests?|__tests__|specs?|e2e|pruebas)\/|[._-](test|spec)\.[A-Za-z0-9]+$|(^|\/)test_[^/]*\.py$/;
const X=/^(changes|docs)\/|\.(md|mdx|txt)$|(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.lock|poetry\.lock|go\.sum|composer\.lock|Gemfile\.lock)$/;
const out=[];
for(const h of M){
 const name=[...new Set(git('diff','--name-only',`${h}^1`,h).split('\n').filter(p=>/^changes\/done\/[^/]+\/plan\.md$/.test(p)).map(p=>p.split('/')[2]))].join('+');
 let t=0,pa=0,pd=0;
 for(const l of git('diff','--numstat','--no-renames',`${h}^1`,h).trim().split('\n')){const [a,d,p]=l.split('\t');
  if(a==='-'||/^(changes|docs)\//.test(p))continue; if(T.test(p))t+=+a; else if(!X.test(p)){pa+=+a;pd+=+d}}
 const r=pa+pd?t/(pa+pd):null; out.push({name,t,pa,pd,r});
}
for(const o of out)console.log(`| ${o.name} | ${o.t} | ${o.pa+o.pd} | ${o.r===null?'sin producto':o.r.toFixed(2)} |`);
const v=out.map(o=>o.r).filter(x=>x!==null).sort((a,b)=>a-b),n=v.length;
console.log('n',n,'mediana',((v[Math.floor((n-1)/2)]+v[Math.ceil((n-1)/2)])/2).toFixed(2),'max',v[n-1].toFixed(2),v.map(x=>x.toFixed(2)).join(' '));
console.log('agregado',(out.reduce((s,o)=>s+o.t,0)/out.reduce((s,o)=>s+o.pa+o.pd,0)).toFixed(2));
for(const u of [2,3,4]) console.log('umbral',u,out.filter(o=>o.r!==null&&o.r>u&&o.t>=100).map(o=>o.name).join(','));
