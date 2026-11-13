const {read,blocks}=require('./common');const w=blocks(read('v1.md')).find(x=>x.label==='벽:').lines;
const edge=[w[0],w[15],w.map(r=>r[0]).join(''),w.map(r=>r[15]).join('')];
console.log('wall edges top,bottom,left,right:',edge);
const cnt={};w.join('').split('').forEach(c=>cnt[c]=(cnt[c]||0)+1);console.log('wall counts',cnt);
const f=blocks(read('v1.md')).find(x=>x.label==='바닥:').lines;const fc={};f.join('').split('').forEach(c=>fc[c]=(fc[c]||0)+1);console.log('floor counts',fc);
const b=blocks(read('v1.md')).find(x=>x.label==='곰:').lines;const bc={};b.join('').split('').forEach(c=>bc[c]=(bc[c]||0)+1);console.log('bear counts',bc);
