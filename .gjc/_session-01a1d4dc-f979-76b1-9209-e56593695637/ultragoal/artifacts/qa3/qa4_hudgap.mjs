import { spawn } from 'node:child_process'; import fs from 'node:fs';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const A=new URL('.',import.meta.url).pathname;
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--disable-gpu','--remote-debugging-port=9338','--user-data-dir=/tmp/r4/qa3prof/p4','--no-first-run','about:blank'],{stdio:'ignore'});
for(let i=0;i<50;i++){try{await fetch('http://127.0.0.1:9338/json/version');break}catch{await sleep(200)}}
const t=await (await fetch('http://127.0.0.1:9338/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pend=new Map();
ws.onmessage=(m)=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){pend.get(d.id)(d);pend.delete(d.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const ev=async(e)=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value};
await send('Page.enable');await send('Page.navigate',{url:'http://127.0.0.1:8797/index.html'});await sleep(1500);
// replicates main.js textBitmap/alignedX + cleanAlpha alpha>=128 using the real page font; lamps text "등불 N/N" with N/total in 0..9
const out=await ev(`(async()=>{await document.fonts.load('20px Galmuri9','점수 0123456789 남은 시간 등불/');
const ink=(txt)=>{const c=document.createElement('canvas');c.width=400;c.height=30;const x=c.getContext('2d');x.font='20px Galmuri9';x.textBaseline='top';x.fillStyle='#f2efe0';const w=Math.ceil(x.measureText(txt).width);x.fillText(txt,2,2);const d=x.getImageData(0,0,400,30).data;let l=1e9,r=-1;for(let y=0;y<30;y++)for(let px=0;px<400;px++)if(d[(y*400+px)*4+3]>=128){l=Math.min(l,px-2);r=Math.max(r,px-2)}return{w,l,r}};
let minS=1e9,minSArg,minL=1e9,minLArg,n=0;
const tin={};for(let s=0;s<=60;s++)tin[s]=ink('남은 시간 '+s);
for(let sc=0;sc<=3000;sc+=10){const si=ink('점수 '+sc);const sx=Math.round(176-si.w/2);
 for(let s=0;s<=60;s++){const ti=tin[s];const tx=348-ti.w;const gap=(tx+ti.l)-(sx+si.r)-1;n++;if(gap<minS){minS=gap;minSArg=[sc,s]}}
 for(let lit=0;lit<=9;lit++)for(let tot=1;tot<=9;tot++){const li=ink('등불 '+lit+'/'+tot);const gap=(sx+si.l)-(6+li.r)-1;if(gap<minL){minL=gap;minLArg=[sc,lit,tot]}}}
// 4-digit only
let min4=1e9,min4Arg;for(let sc=1000;sc<=3000;sc+=10){const si=ink('점수 '+sc);const sx=Math.round(176-si.w/2);for(let s=0;s<=60;s++){const ti=tin[s];const gap=(348-ti.w+ti.l)-(sx+si.r)-1;if(gap<min4){min4=gap;min4Arg=[sc,s]}}}

// reachable-in-HUD bound: levels 1+2 = 7 lamps*100 + clear bonus <=590 each (floor(s)*10, s<=59 since a lamp press needs >=100ms), level3 shows at most 4 lit lamps (+400) => <=2280
let minR=1e9,minRArg,lt5=[],lt0=[];for(let sc=1000;sc<=2280;sc+=10){const si=ink('점수 '+sc);const sx=Math.round(176-si.w/2);for(let s=1;s<=60;s++){const ti=tin[s];const gap=(348-ti.w+ti.l)-(sx+si.r)-1;if(gap<minR){minR=gap;minRArg=[sc,s]}if(gap<5)lt5.push([sc,s,gap]);if(gap<0)lt0.push([sc,s,gap])}}
return{reachableMinGap1000to2280:minR,reachableAt:minRArg,reachableCountGapLt5:lt5.length,reachableCountOverlap:lt0.length,reachableLt5Sample:lt5.slice(0,12),combos:n,minScoreToTimeGapAllScores0to3000:minS,at:minSArg,minScoreToTimeGap4digit1000to3000:min4,at4:min4Arg,minLampsToScoreGap:minL,atL:minLArg}})()`);
console.log(JSON.stringify(out));fs.writeFileSync(A+'qa4_hudgap_result.json',JSON.stringify(out,null,1));chrome.kill();process.exit(0)
