import fs from 'node:fs';
const R='/Users/leetaerim/Downloads/dotgame-taerim/';
const doc=fs.readFileSync(R+'GAME_DESIGN.md','utf8');
const fails=[];const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails.push(m)};
const pal=[...doc.matchAll(/^\| (\d) \| `(#[0-9a-f]{6})`/gm)].map(m=>m[2]);
ok(pal.length===8,'8 palette hex parsed from ch.6: '+pal.join(' '));
for(const f of ['index.html','src/main.js','src/logic.js']){
 const t=fs.readFileSync(R+f,'utf8');const hx=[...t.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(m=>m[0]);
 ok(hx.every(h=>pal.includes(h)),`${f}: hex literals ${JSON.stringify(hx)} all in ch.6`);
 // also rgb()/named colors
 ok(!/rgba?\(|hsla?\(/.test(t),`${f}: no rgb()/hsl()`);
}
const mainT=fs.readFileSync(R+'src/main.js','utf8');
ok(!/\b(red|blue|white|black|green)\b/.test(mainT),'main.js no named colors');
ok(!fs.existsSync(R+'package.json'),'no package.json');
ok(!fs.existsSync(R+'src/strings.js'),'no src/strings.js');
ok(!fs.existsSync(R+'node_modules')&&!fs.existsSync(R+'package-lock.json'),'no node_modules/lockfile');
const block=(label)=>{const i=doc.indexOf('\n'+label+':\n```\n');const s=doc.indexOf('```\n',i)+4;return doc.slice(s,doc.indexOf('```',s)).trimEnd().split('\n')};
const S=await import(R+'src/sprites.js');const Lv=await import(R+'src/levels.js');
const conv=(rows)=>rows.map(r=>[...r].map(c=>c==='.'?null:+c));
const mk=(rows,tr)=>rows.map(r=>[...r].map(c=>(tr&&c==='.')?null:+c));
ok(JSON.stringify(S.SPRITE_BEAR)===JSON.stringify(mk(block('곰'),true)),'SPRITE_BEAR == ch.4 bear block');
ok(JSON.stringify(S.SPRITE_FLOOR)===JSON.stringify(mk(block('바닥'))),'SPRITE_FLOOR == ch.4 floor block');
ok(JSON.stringify(S.SPRITE_WALL)===JSON.stringify(mk(block('벽'))),'SPRITE_WALL == ch.4 wall block');
ok(JSON.stringify(S.PALETTE)===JSON.stringify(pal),'PALETTE == ch.6 table');
const grid=doc.match(/레벨 1 맵 격자[^\n]*\n\n```\n([\s\S]*?)```/)[1].trimEnd().split('\n');
ok(JSON.stringify(Lv.LEVEL1)===JSON.stringify(grid),'LEVEL1 == ch.5 grid');
ok(Object.keys(Lv).join()==='LEVEL1','levels.js exports only LEVEL1: '+Object.keys(Lv));
// magic numbers in main.js
const nums=[...mainT.matchAll(/(?<![\w.#'"])\d+(?![\w'"])/g)].map(m=>m[0]);console.log('numeric literals in main.js:',nums.join(',')||'(none)');
ok(!/\b(352|320|288|100|32)\b/.test(mainT),'main.js has no re-typed ch.2 numbers (352/320/288/100/32)');
const lt=fs.readFileSync(R+'src/logic.js','utf8');
ok((lt.match(/\b100\b/g)||[]).length===1,'logic.js: "100" appears exactly once');
ok(!/setTimeout|setInterval|Date\.now|requestAnimationFrame/.test(mainT+lt),'only performance.now time source (no Date/timers/rAF)');
ok(/performance\.now\(\)/.test(mainT),'main.js uses performance.now()');
console.log('failures',fails.length);process.exit(fails.length?1:0)
