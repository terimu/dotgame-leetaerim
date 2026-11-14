import { spawn } from 'node:child_process'; import fs from 'node:fs';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const A=new URL('.',import.meta.url).pathname;
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--disable-gpu','--remote-debugging-port=9339','--user-data-dir=/tmp/r4/qa3prof/p5','--no-first-run','about:blank'],{stdio:'ignore'});
for(let i=0;i<50;i++){try{await fetch('http://127.0.0.1:9339/json/version');break}catch{await sleep(200)}}
const t=await (await fetch('http://127.0.0.1:9339/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pend=new Map();
ws.onmessage=(m)=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){pend.get(d.id)(d);pend.delete(d.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const ev=async(e)=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value};
await send('Page.enable');await send('Page.navigate',{url:'http://127.0.0.1:8797/index.html'});await sleep(1500);
// replicates main.js textBitmap/alignedX + cleanAlpha alpha>=128 using the real page font; lamps text "등불 N/N" with N/total in 0..9
const out=await ev(`(async()=>{await document.fonts.load('20px Galmuri9','점수');await document.fonts.load('40px Galmuri9','등대지기 곰');const meas=(txt,px)=>{const c=document.createElement('canvas');c.width=500;c.height=80;const x=c.getContext('2d');x.font=px+'px Galmuri9';x.textBaseline='top';x.fillStyle='#fff';const w=Math.ceil(x.measureText(txt).width);x.fillText(txt,2,2);const d=x.getImageData(0,0,500,80).data;let l=1e9,r=-1;for(let y=0;y<80;y++)for(let p=0;p<500;p++)if(d[(y*500+p)*4+3]>=128){l=Math.min(l,p-2);r=Math.max(r,p-2)}const X=Math.round(176-w/2);return{advanceW:w,x:X,advMarginL:X,advMarginR:352-(X+w),inkL:l,inkR:r,bearingL:l,bearingR:w-1-r,predictedInkMarginL:X+l,predictedInkMarginR:352-(X+r+1)}};return{name:meas('등대지기 곰',40),prompt:meas('스페이스바로 시작',20)}})()`);
console.log(JSON.stringify(out));fs.writeFileSync(A+'qa5_center_result.json',JSON.stringify(out,null,1));chrome.kill();process.exit(0)
