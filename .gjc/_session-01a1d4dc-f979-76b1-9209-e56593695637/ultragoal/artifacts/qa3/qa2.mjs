import { spawn } from 'node:child_process'; import fs from 'node:fs';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--disable-gpu','--remote-debugging-port=9336','--user-data-dir=/tmp/r4/qa3prof/p2','--no-first-run','about:blank'],{stdio:'ignore'});
for(let i=0;i<50;i++){try{await fetch('http://127.0.0.1:9336/json/version');break}catch{await sleep(200)}}
const t=await (await fetch('http://127.0.0.1:9336/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pend=new Map();
ws.onmessage=(m)=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){pend.get(d.id)(d);pend.delete(d.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const ev=async(e)=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value};
await send('Page.enable');
await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__t=1000;performance.now=()=>window.__t;`});
await send('Page.navigate',{url:'http://127.0.0.1:8797/index.html'});await sleep(1200);
const key=(k,rep)=>ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(k)},repeat:${rep},cancelable:true}));0`);
const frame=async()=>{await sleep(80);return ev(`document.getElementById('game').toDataURL()`)};
const out={};console.log(await ev('location.href+" "+document.readyState+" "+document.title'));
// in-page canvas pixel audit of title (no PNG/color-management involvement)
out.titleCanvas=await ev(`(()=>{const c=document.getElementById('game');const d=c.getContext('2d').getImageData(0,0,352,320).data;const m={};for(let i=0;i<d.length;i+=4){const k=[d[i],d[i+1],d[i+2],d[i+3]].map(v=>v.toString(16).padStart(2,'0')).join('');m[k]=(m[k]||0)+1}return m})()`);
// repeat test with frozen clock
await key(' ',true);await sleep(80);out.titleAfterRepeatSpaceIsStillTitle=(await frame())===(await frame());
const f0=await frame();
await key(' ',true);const f1=await frame();out.repeatSpaceOnTitleNoChange=f0===f1;
await key(' ',false);const p0=await frame();
await key('ArrowRight',true);await key('ArrowDown',true);await key(' ',true);const p1=await frame();out.repeatMovesAndSpaceNoChange=p0===p1;
await key('ArrowRight',false);const p2=await frame();out.realMoveChanges=p0!==p2;
await key('ArrowDown',true);await key('ArrowDown',true);const p3=await frame();out.repeatDownAfterRealNoChange=p2===p3;
// glyph ink gap worst-case with real font: right ink of '점수 DDDD' block vs left ink of '남은 시간 60'
out.inkGap=await ev(`(async()=>{await document.fonts.load('20px Galmuri9','점수 0123456789 남은 시간');const mk=(txt)=>{const c=document.createElement('canvas');c.width=300;c.height=30;const x=c.getContext('2d');x.font='20px Galmuri9';x.textBaseline='top';x.fillStyle='#fff';const w=Math.ceil(x.measureText(txt).width);x.fillText(txt,2,2);const d=x.getImageData(0,0,300,30).data;let l=1e9,r=-1;for(let y=0;y<30;y++)for(let px=0;px<300;px++)if(d[(y*300+px)*4+3]>=128){l=Math.min(l,px-2);r=Math.max(r,px-2)}return{w,l,r}};
const res={};const time=mk('남은 시간 60');const tStart=348-time.w;const tInk=tStart+time.l;
for(const s of ['점수 0000','점수 1111','점수 2222','점수 3000','점수 5555','점수 7777','점수 8888','점수 9999','점수 4444','점수 6666','점수 3333']){const m=mk(s);const sStart=176-m.w/2;res[s]=tInk-(sStart+m.r)-1}
return{timeW:time.w,timeInkLeft:tInk,gaps:res}})()`);
console.log(JSON.stringify(out));fs.writeFileSync('/Users/leetaerim/Downloads/dotgame-taerim/.gjc/_session-01a1d4dc-f979-76b1-9209-e56593695637/ultragoal/artifacts/qa3/qa2_result.json',JSON.stringify(out,null,1));chrome.kill();process.exit(0)
