const {read}=require('./common');const t=read('v1.md');const o=[];let ok=true;const a=(c,m)=>{o.push((c?'ok   ':'FAIL ')+m);if(!c)ok=false;};
const heads=[...t.matchAll(/^## (\d+)\. (.*)$/gm)].map(m=>m[1]);o.push('chapters: '+heads.join(','));
const rows=[...t.matchAll(/^\| ([^|]+) \|/gm)].map(m=>m[1].trim());o.push('table first-col: '+rows.join(' / '));
const s9=t.slice(t.indexOf('## 9.'),t.indexOf('## 10.'));
const cites=[...s9.matchAll(/\(([^()\n]*(?:\d장)[^()\n]*)\)/g)].map(m=>m[1]);
const ch2=t.slice(t.indexOf('## 2.'),t.indexOf('## 3.'));
for(const c of cites){o.push('citation: '+c);
 for(const m of c.matchAll(/(\d+)장/g))a(heads.includes(m[1]),'chapter '+m[1]+' exists');
 for(const m of c.matchAll(/"([^"]+)"/g))a(rows.includes(m[1])&&ch2.includes('| '+m[1]+' |'),'row "'+m[1]+'" is a ch.2 table row');}
// shorthand names
a(/## 4\. 오브젝트/.test(t)&&/\| 곰 \|/.test(t)&&/\| 바닥 \|/.test(t)&&/\| 벽 \|/.test(t),'ch4 "곰·바닥·벽" = rows 곰/바닥/벽 in ch4 table');
a(/## 6\. 팔레트/.test(t),'ch6 팔레트 heading');
a(/레벨 1 맵 격자/.test(t.slice(t.indexOf('## 5.'),t.indexOf('## 6.'))),'ch5 "레벨 1 격자" bullet exists');
a(/확인 방법:.*1번은.*canvas.*2번은 가로 9칸/.test(s9),'verification method refs 1 and 2');
const items=[...s9.matchAll(/^(\d+)\. /gm)].map(m=>m[1]);o.push('criteria numbered '+items);a(items.join()==='1,2,3,4,5,6,7','numbered 1..7');
// ch refs elsewhere
for(const m of t.matchAll(/(\d+)장/g))if(!heads.includes(m[1]))a(false,'dangling chapter ref '+m[1]);
o.push('VERDICT '+(ok?'PASS':'FAIL'));console.log(o.join('\n'));
