const {read}=require('./common');const t=read('v1.md');const o=[];let ok=true;const a=(c,m)=>{o.push((c?'ok   ':'FAIL ')+m);if(!c)ok=false;};
const T=32,AW=352,AH=288;
for(const [n,w,h,ex] of [['L1',9,7,[32,32]],['L2',10,7,[16,32]],['L3',11,9,[0,0]]]){
 const ox=(AW-w*T)/2,oy=(AH-h*T)/2;o.push(`${n} ${w}x${h}=${w*T}x${h*T} offset=(${ox},${oy}) right=${AW-ox-w*T} bottom=${AH-oy-h*T}`);
 a(Number.isInteger(ox)&&Number.isInteger(oy),n+' integer offset');
 a(ox>=0&&oy>=0&&ox+w*T<=AW&&oy+h*T<=AH,n+' inside 352x288');
 a(ox===ex[0]&&oy===ex[1],n+' equals doc-stated/plan value '+ex);
 a(ox+w*T<=352&&oy+h*T<=320,n+' inside 352x320 canvas and above HUD (y<288)');
 if(n==='L1')a(ox===32&&oy===32&&AW-ox-w*T===32&&AH-oy-h*T===32,'L1 margin 32 on all four sides');}
const row=t.split('\n').find(l=>l.startsWith('| 화면 크기'));o.push(row);
a(/352 px × 320 px/.test(row)&&/352 × 288/.test(row)&&/아래 32 px는 HUD/.test(row),'screen row: 352x320, map area 352x288, HUD 32');
a(288+32===320,'288+32=320');
const pos=t.split('\n').find(l=>l.startsWith('| 맵 위치'));o.push(pos);
a(/\(32, 32\)/.test(pos)&&/\(0, 0\)/.test(pos)&&/288 × 224/.test(pos)&&/352 × 288 px\)은/.test(pos),'position row numbers match computed');
a(!/레벨 2/.test(pos),'NOTE: pos row omits L2 (16,32) — rule general, L2 value not stated in doc');
o.push('L2 (16,32) stated in doc? '+/\(16, 32\)/.test(t));
a(/맵 칸 수.*레벨 1: 9 칸 × 7 칸.*레벨 3.*11 칸 × 9 칸/.test(t.split('\n').find(l=>l.startsWith('| 맵 칸 수'))),'cell-count row');
o.push('L2 10x7 present in doc as number? '+/10 ?칸? ?× ?7/.test(t));
o.push('VERDICT '+(ok?'PASS':'FAIL'));console.log(o.join('\n'));
