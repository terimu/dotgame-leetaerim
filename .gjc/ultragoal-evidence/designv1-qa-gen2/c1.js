const {read,blocks,palette}=require('./common');const t=read('v1.md');
const b=blocks(t);const pal=palette(t);const out=[];let ok=true;const chk=(c,m)=>{out.push((c?'ok  ':'FAIL ')+m);if(!c)ok=false;};
const want={'곰:':['bear',/^[.456]+$/],'바닥:':['floor',/^[01]+$/],'벽:':['wall',/^[234]+$/]};
for(const k in want){const s=b.find(x=>x.label===k);chk(!!s,k+' block found');if(!s)continue;const [n,re]=want[k];
chk(s.lines.length===16,n+' rows=16 got '+s.lines.length);
s.lines.forEach((l,i)=>{chk(l.length===16,`${n} row${i} len=16 got ${l.length}`);chk(re.test(l)||(n!=='bear'?false:/^[.456]+$/.test(l)),`${n} row${i} chars ok`);});
const used=new Set(s.lines.join(''));out.push(n+' used: '+[...used].sort().join(''));
for(const c of used)if(c!=='.')chk(pal[c]!==undefined,`${n} index ${c} in palette`);
if(n!=='bear')chk(!used.has('.'),n+' no transparent');}
const keys=Object.keys(pal);chk(keys.length===8&&keys.join('')==='01234567','palette 8 rows idx 0-7');
const hx=keys.map(k=>pal[k].hex);hx.forEach((h,i)=>chk(/^#[0-9a-f]{6}$/.test(h),'hex valid '+i+' '+h));
chk(new Set(hx.map(h=>h.toLowerCase())).size===8,'8 unique hex');
for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)chk(hx[i]!==hx[j],`distinct ${i},${j}`);
out.push('wall idx 2,3,4 each used? '+['2','3','4'].map(c=>c+':'+b.find(x=>x.label==='벽:').lines.join('').includes(c)));
out.push('VERDICT '+(ok?'PASS':'FAIL'));console.log(out.join('\n'));
