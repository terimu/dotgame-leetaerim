import { spawn } from 'node:child_process';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { LEVELS } from '/Users/leetaerim/Downloads/dotgame-taerim/src/levels.js';
import { createGame, pressKey, tick, lampCells } from '/Users/leetaerim/Downloads/dotgame-taerim/src/logic.js';

function planWalk() {
  const steps = []; let t = 1000; let g = createGame();
  const emit = (k, dt) => { t += dt; steps.push({ key: k, t }); g = pressKey(g, k, LEVELS, t); };
  emit(' ', 0);
  let guard = 0;
  while (g.screen === 'play' && guard++ < 3000) {
    const s = g.level; const lampsLeft = lampCells(s.grid).filter(c => !s.lit.some(l => l.col === c.col && l.row === c.row));
    if (s.stunUntilMs !== null && t < s.stunUntilMs) { t = s.stunUntilMs + 1; steps.push({ wait: true, t }); g = tick(g, LEVELS, t); continue; }
    if (lampsLeft.some(c => c.col === s.bear.col && c.row === s.bear.row)) { emit(' ', 110); continue; }
    // BFS to nearest unlit lamp
    const q = [{ ...s.bear, path: [] }], seen = new Set([s.bear.col + ',' + s.bear.row]); let found = null;
    const dirs = [['ArrowUp', 0, -1], ['ArrowDown', 0, 1], ['ArrowLeft', -1, 0], ['ArrowRight', 1, 0]];
    while (q.length && !found) { const c = q.shift(); if (lampsLeft.some(l => l.col === c.col && l.row === c.row)) { found = c; break; }
      for (const [k, dc, dr] of dirs) { const n = { col: c.col + dc, row: c.row + dr }; const ch = s.grid[n.row]?.[n.col]; if (!ch || ch === '#' || seen.has(n.col + ',' + n.row)) continue; seen.add(n.col + ',' + n.row); q.push({ ...n, path: [...c.path, k] }); } }
    emit(found.path[0], 110);
  }
  return { steps, final: g.screen, score: g.level?.score, endT: t };
}

const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--disable-gpu','--remote-debugging-port=9337','--user-data-dir=/tmp/r4/qa3prof/p3','--no-first-run','about:blank'],{stdio:'ignore'});
for(let i=0;i<50;i++){try{await fetch('http://127.0.0.1:9337/json/version');break}catch{await sleep(200)}}
const t=await (await fetch('http://127.0.0.1:9337/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pend=new Map();
ws.onmessage=(m)=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){pend.get(d.id)(d);pend.delete(d.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const ev=async(e)=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value};
await send('Page.enable');
await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__t=1000;performance.now=()=>window.__t;`});
await send('Page.navigate',{url:'http://127.0.0.1:8797/index.html'});await sleep(1200);
const key=(k)=>ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(k)},repeat:false,cancelable:true}));0`);
const bbox=(y0,y1,color)=>ev(`(()=>{const c=document.getElementById('game');const d=c.getContext('2d').getImageData(0,0,352,320).data;const want=${JSON.stringify(color)};let x0=1e9,x1=-1,ya=1e9,yb=-1;for(let y=${y0};y<${y1};y++)for(let x=0;x<352;x++){const i=(y*352+x)*4;const h=[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');if(h===want){x0=Math.min(x0,x);x1=Math.max(x1,x);ya=Math.min(ya,y);yb=Math.max(yb,y)}}return{x0,x1,y0:ya,y1:yb,leftMargin:x0,rightMargin:351-x1}})()`);
const out={};
out.titleName=await bbox(0,170,'d08a3c');out.titlePromptRows=await bbox(170,320,'f2efe0');
out.titleOtherColorPixelsInName=await bbox(0,170,'f2efe0');
const plan=planWalk();const keys=[];let storageBeforeEnding=[];
const rows=async()=>ev(`(()=>{const c=document.getElementById('game');const d=c.getContext('2d').getImageData(0,0,352,320).data;const r=[];let cur=null;for(let y=0;y<320;y++){let on=0;for(let x=0;x<352;x++){const i=(y*352+x)*4;if(d[i]!==0x0b||d[i+1]!==0x0e||d[i+2]!==0x1a)on++}if(on&&cur===null)cur=y;if(!on&&cur!==null){r.push([cur,y-1]);cur=null}}return r})()`);
for(let i=0;i<plan.steps.length;i++){const s=plan.steps[i];await ev(`window.__t=${s.t}`);await key(s.key);keys.push(s.key+'@'+s.t);await sleep(25);
 if(i<plan.steps.length-1){const st=await ev(`localStorage.getItem('lighthouse-bear-best')`);storageBeforeEnding.push(st)}}
await sleep(200);
out.storageNullAtEveryKeyBeforeFinal=storageBeforeEnding.every(v=>v===null);out.storageBeforeFinalDistinct=[...new Set(storageBeforeEnding)];
out.storageAfterEnding=await ev(`localStorage.getItem('lighthouse-bear-best')`);
out.endingInkRowBands=await rows();
out.keys=keys;
// fail rows
await send('Page.navigate',{url:'http://127.0.0.1:8797/index.html'});await sleep(1200);
await key(' ');await sleep(80);await ev(`window.__t+=61000`);await sleep(200);out.failInkRowBands=await rows();out.storageAfterFail=await ev(`localStorage.getItem('lighthouse-bear-best')`);
console.log(JSON.stringify(out));fs.writeFileSync('/Users/leetaerim/Downloads/dotgame-taerim/.gjc/_session-01a1d4dc-f979-76b1-9209-e56593695637/ultragoal/artifacts/qa3/qa3_result.json',JSON.stringify(out,null,1));chrome.kill();process.exit(0)
