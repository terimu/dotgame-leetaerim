import fs from 'node:fs';
const R='/Users/leetaerim/Downloads/dotgame-taerim/';
const doc=fs.readFileSync(R+'GAME_DESIGN.md','utf8');
// expected from doc
const pal=[...doc.matchAll(/^\| (\d) \| `(#[0-9a-f]{6})`/gm)].map(m=>m[2]);
const block=(label)=>{const i=doc.indexOf('\n'+label+':\n```\n');const s=doc.indexOf('```\n',i)+4;return doc.slice(s,doc.indexOf('```',s)).trimEnd().split('\n')};
const bear=block('곰'),floor=block('바닥'),wall=block('벽');
const gridM=doc.match(/레벨 1 맵 격자[^\n]*\n\n```\n([\s\S]*?)```/)[1].trimEnd().split('\n');
const fails=[];const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails.push(m)};
let T=0;
Object.defineProperty(globalThis,'performance',{value:{now:()=>T},configurable:true,writable:true});
let counter=0;
async function boot(){
  const listeners={};const calls=[];let fs_;
  const ctx={set fillStyle(v){fs_=v},get fillStyle(){return fs_},fillRect(x,y,w,h){calls.push({fs:fs_,x,y,w,h})}};
  const canvas={width:0,height:0,getContext:(t)=>{ctx.t=t;return ctx}};
  globalThis.document={getElementById:(id)=>{canvas.id=id;return canvas},addEventListener:(t,f)=>{(listeners[t]??=[]).push(f)}};
  T=0;
  await import(R+'src/main.js?run='+(counter++));
  const key=(k,repeat=false)=>{for(const f of listeners.keydown)f({key:k,repeat})};
  return {canvas,calls,key,listeners,get ctxType(){return ctx.t}};
}
// frame splitting + pixel buffer
function frames(calls){const fr=[];for(const c of calls){if(c.x===0&&c.y===0&&c.w===352&&c.h===320)fr.push([]);fr.at(-1).push(c)}return fr}
function render(fr){const px=Array.from({length:320},()=>Array(352).fill(null));for(const c of fr)for(let y=c.y;y<c.y+c.h;y++)for(let x=c.x;x<c.x+c.w;x++)px[y][x]=c.fs;return px}
function expected(bc,br){const px=Array.from({length:320},()=>Array(352).fill(pal[0]));
 const put=(spr,ox,oy,tr)=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const ch=spr[y][x];if(ch==='.')continue;for(let a=0;a<2;a++)for(let b=0;b<2;b++)px[oy+y*2+a][ox+x*2+b]=pal[+ch]}};
 for(let r=0;r<7;r++)for(let c=0;c<9;c++)put(gridM[r][c]==='#'?wall:floor,32+c*32,32+r*32);
 put(bear,32+bc*32,32+br*32);return px}
const bearPos=(h)=>{ // locate via last frame: compare against expected for all cells
 const px=render(frames(h.calls).at(-1));for(let r=1;r<=5;r++)for(let c=1;c<=7;c++){const e=expected(c,r);let same=true;for(let y=0;y<320&&same;y++)for(let x=0;x<352;x++)if(e[y][x]!==px[y][x]){same=false;break}if(same)return {col:c,row:r}}return null};

let h=await boot();
ok(h.canvas.width===352&&h.canvas.height===320,`canvas sized ${h.canvas.width}x${h.canvas.height}`);
ok(h.canvas.id==='game'&&h.ctxType==='2d','getElementById("game"), getContext("2d")');
ok(frames(h.calls).length===1,'initial draw once ('+frames(h.calls).length+' frames)');
const f0=frames(h.calls)[0];
ok(f0[0].fs==='#0b0e1a','first op of frame fills full 352x320 with #0b0e1a');
const used=new Set(h.calls.map(c=>c.fs));
ok([...used].every(c=>pal.includes(c)),'initial fillStyles subset of ch.6 palette: '+[...used].join(','));
ok(!used.has('#f2efe0'),'index 7 (reserved) unused');
const p0=render(f0);
let margin=true;for(let y=0;y<320;y++)for(let x=0;x<352;x++){const inMap=x>=32&&x<320&&y>=32&&y<256;if(!inMap&&p0[y][x]!=='#0b0e1a')margin=false}
ok(margin,'margin + HUD strip pixels all #0b0e1a (simulated pixel buffer)');
let allPx=true;for(const row of p0)for(const v of row)if(v===null)allPx=false;ok(allPx,'no unpainted pixel');
const e0=expected(1,1);let diff=0;for(let y=0;y<320;y++)for(let x=0;x<352;x++)if(e0[y][x]!==p0[y][x])diff++;
ok(diff===0,`initial frame pixel-identical to doc-derived expectation (diff=${diff}); includes map origin (32,32), bear over floor at (1,1), bear above floor`);
// bear after floor in same frame: index of last op in bear cell vs floor op
const idxFloor=f0.findIndex(c=>c.x===64&&c.y===64);const idxBearLast=f0.length-1;
const lastOpsAtBearCell=f0.map((c,i)=>[c,i]).filter(([c])=>c.x>=64&&c.x<96&&c.y>=64&&c.y<96);
ok(lastOpsAtBearCell.at(-1)[1]===f0.length-1&&f0.at(-1).fs!==pal[1],'last op of frame is a bear pixel (drawn last)');
// bear-cell floor ops come before first bear op: floor ops colour 1 / 0 with index; check first bear-colour (4/5/6 at cell) after all floor tile ops of all cells
// input scenarios
const dirs={ArrowRight:[1,0],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowUp:[0,-1]};
async function sc(name,fn){const hh=await boot();let exp;fn(hh,(e)=>exp=e);return {hh,exp,name}}
async function scen(name,steps,expPos,expFrames){const hh=await boot();for(const [t,k,rep] of steps){T=t;hh.key(k,!!rep)}const p=bearPos(hh);const nf=frames(hh.calls).length;const good=p&&p.col===expPos[0]&&p.row===expPos[1];ok(good&&(expFrames===undefined||nf===expFrames),`${name}: bear ${JSON.stringify(p)} expected ${expPos}, frames ${nf}`)}
await scen('repeat=true ignored',[[0,'ArrowRight',true]],[1,1]);
await scen('repeat=true after a real move ignored (even 500ms later)',[[0,'ArrowRight'],[500,'ArrowRight',true]],[2,1]);
await scen('two keys 0 ms apart move once',[[0,'ArrowRight'],[0,'ArrowDown']],[2,1]);
await scen('two keys 50 ms apart move once',[[0,'ArrowRight'],[50,'ArrowDown']],[2,1]);
await scen('99 ms ignored',[[1000,'ArrowRight'],[1099,'ArrowDown']],[2,1]);
await scen('100 ms accepted',[[1000,'ArrowRight'],[1100,'ArrowDown']],[2,2]);
await scen('101 ms accepted',[[1000,'ArrowRight'],[1101,'ArrowDown']],[2,2]);
await scen('wall bump no cooldown: bump ArrowUp @1000 then Right @1001 moves',[[1000,'ArrowUp'],[1001,'ArrowRight']],[2,1]);
await scen('wall bump same ms as move: Left bump @0 then Right @0',[[0,'ArrowLeft'],[0,'ArrowRight']],[2,1]);
await scen('non-arrow no cooldown: Space/a/Enter @1000 then Right @1001',[[1000,' '],[1000,'a'],[1000,'Enter'],[1001,'ArrowRight']],[2,1]);
await scen('first input at t=0 accepted',[[0,'ArrowDown']],[1,2]);
await scen('cooldown anchored to last real move, not to ignored input: move@0, ignored@60, accepted@100',[[0,'ArrowRight'],[60,'ArrowDown'],[100,'ArrowDown']],[2,2]);
await scen('cooldown not extended by bump: move@0, bump(Up)@100... then Down@150 rejected? (0->100 move ok; bump@150 up wall? )',[[0,'ArrowRight'],[100,'ArrowRight'],[199,'ArrowRight'],[200,'ArrowRight']],[4,1]);
await scen('walk into right wall from (7,1): bump no-op',[[0,'ArrowRight'],[100,'ArrowRight'],[200,'ArrowRight'],[300,'ArrowRight'],[400,'ArrowRight'],[500,'ArrowRight'],[600,'ArrowRight'],[700,'ArrowRight'],[800,'ArrowRight']],[7,1]);
await scen('prototype key via event: __proto__/constructor/toString ignored',[[0,'__proto__'],[0,'constructor'],[0,'toString'],[0,undefined]],[1,1]);
// every frame: palette-only + drawn bear last + pixel match after moves
{const hh=await boot();const seq=[[0,'ArrowRight'],[100,'ArrowDown'],[200,'ArrowDown'],[300,'ArrowLeft'],[400,'ArrowUp']];let pos=[1,1];let bad=0;
 for(const [t,k] of seq){T=t;hh.key(k);pos=[pos[0]+dirs[k][0],pos[1]+dirs[k][1]];const fr=frames(hh.calls).at(-1);const e=expected(...pos);const p=render(fr);for(let y=0;y<320;y++)for(let x=0;x<352;x++)if(e[y][x]!==p[y][x])bad++}
 ok(bad===0,`5-move path: every redrawn frame pixel-identical to expected (bad=${bad}); frames=${frames(hh.calls).length}`);
 ok(hh.calls.every(c=>pal.includes(c.fs)),'all fillStyles over whole session are palette hexes');
 const nfBefore=frames(hh.calls).length;T=1000;hh.key('ArrowLeft',true);ok(frames(hh.calls).length===nfBefore,'repeat=true does not redraw');}
console.log('failures',fails.length);process.exit(fails.length?1:0);
