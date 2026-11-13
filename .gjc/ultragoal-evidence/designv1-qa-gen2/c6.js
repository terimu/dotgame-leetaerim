const {read,blocks}=require('./common');const fs=require('fs');const o=[];let ok=true;const a=(c,m)=>{o.push((c?'ok   ':'FAIL ')+m);if(!c)ok=false;};
const v0=read('v0.md'),v1=read('v1.md');
const nums=t=>[...t.matchAll(/\d+(?:\.\d+)?(?: ?(?:px|ms|칸|초|개|%))?/g)].map(m=>m[0]);
const spec=read('/Users/leetaerim/Downloads/dotgame-taerim/.gjc/_session-01a1d28e-b1c7-764f-a63a-be86e32361fc/specs/deep-interview-dotgame-lighthouse.md');
const sm=spec.match(/맵 1 \(등불 3개, 9x7\)\n```\n([\s\S]*?)\n```/)[1];
const g=v1.match(/9칸 × 7칸[^\n]*\n\n```\n([\s\S]*?)\n```/)[1];
a(Buffer.from(sm).equals(Buffer.from(g)),'L1 grid byte-identical to spec map1 ('+g.length+' bytes)');
a(!/\r/.test(g)&&!/[ \t]$/m.test(g),'no CR/trailing ws');
const hasMap=g.split('\n');a(hasMap.length===7&&hasMap.every(l=>l.length===9),'7 rows x 9');
// v0 numbers: pull each distinct unit-number token from v0 and check present in v1
const t0=[...new Set(nums(v0).map(s=>s.replace(/\s+/g,'')))];const t1=new Set(nums(v1).map(s=>s.replace(/\s+/g,'')));
o.push('v0 numeric tokens: '+t0.join(' '));
const miss=t0.filter(x=>!t1.has(x));o.push('v0 tokens absent in v1: '+JSON.stringify(miss));
o.push('v0 lines with numbers (for manual compare):');v0.split('\n').filter(l=>/\d/.test(l)).forEach(l=>o.push('  v0| '+l));
fs.writeFileSync('c6-v0num.txt',o.join('\n'));
console.log(o.join('\n'));
a(true,'(see above for numeric diffs)');console.log('VERDICT '+(ok?'PASS-pending-manual':'FAIL'));
