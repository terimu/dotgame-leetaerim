const {read,blocks}=require('./common');const t=read('v1.md');
const g=blocks(t).find(x=>x.lines.length===7&&x.lines[0]==='#########').lines;
const COOL=100;const KEY={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
function mk(){let pos;g.forEach((r,y)=>{const x=r.indexOf('B');if(x>=0)pos={x,y}});let last=-Infinity;
 return {get pos(){return {...pos}},set(x,y){pos={x,y}},
 key(code,now,repeat=false){ if(repeat)return 'ignored-repeat'; const d=KEY[code]; if(!d)return 'ignored-nonarrow';
  if(now-last<COOL)return 'ignored-cooldown'; const nx=pos.x+d[0],ny=pos.y+d[1];
  if(ny<0||ny>=g.length||nx<0||nx>=g[0].length||g[ny][nx]==='#')return 'blocked'; pos={x:nx,y:ny}; last=now; return 'moved';}};}
const out=[];let ok=true;const eq=(n,a,b)=>{const s=JSON.stringify(a)===JSON.stringify(b);if(!s)ok=false;out.push((s?'ok   ':'FAIL ')+n+' got '+JSON.stringify(a)+' want '+JSON.stringify(b));};
let m=mk();eq('start B at (1,1)',m.pos,{x:1,y:1});
eq('left at (1,1)',[m.key('ArrowLeft',0),m.pos],['blocked',{x:1,y:1}]);
eq('up at (1,1) t=0 (first input accepted semantics, but wall)',[m.key('ArrowUp',0),m.pos],['blocked',{x:1,y:1}]);
eq('wall bump then immediate valid move t=0 (bump no cooldown)',[m.key('ArrowRight',0),m.pos],['moved',{x:2,y:1}]);
m=mk();eq('first input at t=0 moves',[m.key('ArrowRight',0),m.pos],['moved',{x:2,y:1}]);
eq('repeat ignored',[m.key('ArrowRight',500,true),m.pos],['ignored-repeat',{x:2,y:1}]);
m=mk();m.key('ArrowDown',1000);eq('two keys 0ms apart: 2nd ignored',[m.key('ArrowRight',1000),m.pos],['ignored-cooldown',{x:1,y:2}]);
eq('99ms ignored',[m.key('ArrowRight',1099),m.pos],['ignored-cooldown',{x:1,y:2}]);
eq('99ms ignored did not extend cooldown; 100ms accepted',[m.key('ArrowRight',1100),m.pos],['moved',{x:2,y:2}]);
m=mk();m.key('ArrowDown',50);eq('exactly 100 inclusive',[m.key('ArrowDown',150),m.pos],['moved',{x:1,y:3}]);
m=mk();m.set(7,1);eq('(7,1) right is wall',[m.key('ArrowRight',0),m.pos],['blocked',{x:7,y:1}]);
m=mk();m.set(1,2);eq('onto L (2,2) allowed',[m.key('ArrowRight',0),m.pos,g[2][2]],['moved',{x:2,y:2},'L']);
m=mk();m.set(7,5);eq('(7,5) down wall',[m.key('ArrowDown',0)],['blocked']);
m=mk();eq('non-arrow key',[m.key('Space',0),m.key('KeyW',0),m.pos],['ignored-nonarrow','ignored-nonarrow',{x:1,y:1}]);
m=mk();m.key('ArrowRight',0);eq('non-arrow during cooldown does not matter; walls in cooldown no effect',[m.key('ArrowUp',10),m.pos],['ignored-cooldown',{x:2,y:1}]);
m=mk();m.key('ArrowRight',0);m.key('ArrowUp',50);eq('blocked bump during cooldown does not extend; move at 100',[m.key('ArrowDown',100),m.pos],['moved',{x:2,y:2}]);
out.push('--- Divergence points (doc text under-specifies) ---');
['D1 Time source at the instant of comparison: doc says performance.now() only, but not whether sampled inside the keydown handler vs event.timeStamp (both are DOMHighResTimeStamp on same origin; low risk).',
'D2 Input during cooldown that would ALSO be a wall bump: both ignored; no observable difference. No divergence.',
'D3 Ignored-during-cooldown inputs: doc says "무시" -> no buffering/queueing; implementers could buffer but text says ignore. Low risk.',
'D4 Modifier-key combos (Shift/Ctrl/Meta + arrow) and non-event.key vs event.code matching (ArrowLeft key name vs WASD): doc says only 방향키; WASD/numpad excluded implicitly. Not stated whether preventDefault on arrows (page scroll). Low risk, non-blocking.',
'D5 event.repeat during cooldown vs after: ignored in both cases; and a repeat does not reset cooldown. Doc silent on whether a repeat event counts as "input" for cooldown purposes, but since ignored => no cooldown effect. No divergence.',
'D6 Cooldown measured from move time; fractional performance.now(): 99.9 ignored, 100.0 accepted, consistent with "100 ms 이상".',
'D7 Multi-key at 0ms apart: depends on event order, which key wins is browser/OS order; doc only requires exactly one tile (criterion 5). No divergence on count.',
'D8 Cooldown across window blur/keyup: no rule; irrelevant.'].forEach(x=>out.push(x));
out.push('VERDICT '+(ok?'PASS':'FAIL'));console.log(out.join('\n'));
