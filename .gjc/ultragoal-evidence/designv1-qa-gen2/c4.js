const {read,palette}=require('./common');const p=palette(read('v1.md'));
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const lin=c=>{c/=255;return c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4};
const L=h=>{const [r,g,b]=rgb(h).map(lin);return .2126*r+.7152*g+.0722*b};
const cr=(a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const ids=['0','1','2','3','4','5','6'];const o=[];
ids.forEach(i=>o.push(`${i} ${p[i].hex} ${p[i].name} L=${L(p[i].hex).toFixed(4)}`));
const rows=[];
for(let i=0;i<7;i++)for(let j=i+1;j<7;j++){const a=p[ids[i]].hex,b=p[ids[j]].hex;const d=Math.hypot(...rgb(a).map((v,k)=>v-rgb(b)[k]));rows.push({a:ids[i],b:ids[j],d,c:cr(a,b)});}
rows.forEach(r=>o.push(`${r.a}-${r.b} dist=${r.d.toFixed(1)} CR=${r.c.toFixed(2)}${r.c<1.5?'  <1.5 FLAG':''}`));
const crit=[['0','1','margin vs floor'],['1','2','floor vs wall'],['1','5','floor vs bear'],['0','2','margin vs wall'],['2','5','wall vs bear'],['0','5','margin vs bear'],['1','6','floor vs bear light'],['2','4','wall face vs mortar'],['2','3','wall face vs highlight'],['4','5','bear outline vs body'],['5','6','bear body vs light'],['1','4','floor vs outline(bear on floor edge)'],['0','4','margin vs line']];
o.push('--- criterion 7 pairs (곰·바닥·벽·여백) ---');
crit.forEach(([a,b,n])=>o.push(`${n} (${a},${b}) CR=${cr(p[a].hex,p[b].hex).toFixed(2)}`));
const flagged=rows.filter(r=>r.c<1.5);o.push('flagged pairs: '+flagged.map(r=>r.a+'-'+r.b+'='+r.c.toFixed(2)).join(', '));
o.push('VERDICT '+(flagged.length? 'FLAGS(see list)':'PASS'));console.log(o.join('\n'));
