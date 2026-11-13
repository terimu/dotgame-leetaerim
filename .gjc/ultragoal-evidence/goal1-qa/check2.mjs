import fs from 'node:fs';
const R='/Users/leetaerim/Downloads/dotgame-taerim/';
const L=await import(R+'src/logic.js');
const doc=fs.readFileSync(R+'GAME_DESIGN.md','utf8');
const m=doc.match(/레벨 1 맵 격자[^\n]*\n\n```\n([\s\S]*?)```/);
const grid=m[1].trimEnd().split('\n');
let fails=[],n=0;
const chk=(c,msg)=>{n++;if(!c)fails.push(msg)};
const D={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
const cell=(c,r)=>grid[r]?.[c];
let walk=0;
for(let r=0;r<grid.length;r++)for(let c=0;c<grid[r].length;c++){
 if(grid[r][c]==='#')continue; walk++;
 for(const [k,[dc,dr]] of Object.entries(D)){
  const s={grid:L.LEVEL1??grid,bear:{col:c,row:r}};
  const o=L.moveBear({grid,bear:{col:c,row:r}},k).bear;
  const nb=cell(c+dc,r+dr);
  const exp=(nb===undefined||nb==='#')?{col:c,row:r}:{col:c+dc,row:r+dr};
  chk(o.col===exp.col&&o.row===exp.row,`cell ${c},${r} ${k}: got ${JSON.stringify(o)} exp ${JSON.stringify(exp)}`);
 }}
console.log('walkable cells',walk,'(expect 9*7 interior 7*5=35)');
// random walk, mulberry32 seed
function mb(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rnd=mb(20261113);const keys=Object.keys(D);
let st={grid,bear:{col:1,row:1}};let moved=0;
for(let i=0;i<5000;i++){const k=keys[Math.floor(rnd()*4)];const nx=L.moveBear(st,k);if(nx.bear.col!==st.bear.col||nx.bear.row!==st.bear.row)moved++;st=nx;
 const {col,row}=st.bear;chk(row>=0&&row<grid.length&&col>=0&&col<grid[0].length&&grid[row][col]!=='#',`walk step ${i} bad ${col},${row}`);}
console.log('random walk moved',moved,'of 5000 final',st.bear);
// mutation
const inp={grid,bear:{col:3,row:3}};const snap=JSON.stringify(inp);Object.freeze(inp);Object.freeze(inp.bear);
for(const k of [...keys,'x']){const o=L.moveBear(inp,k);chk(JSON.stringify(inp)===snap,'mutated');chk(o!==undefined,'undef')}
const og=Object.freeze(grid.slice());
// bad keys
for(const k of ['ArrowUpp','arrowup','',undefined,null,'constructor','__proto__','toString','hasOwnProperty','valueOf','ARROWUP','Up',' ','a',0,{},['ArrowUp']]){
 let o;try{o=L.moveBear({grid,bear:{col:3,row:3}},k)}catch(e){chk(false,'threw on '+String(k)+': '+e.message);continue}
 chk(o.bear.col===3&&o.bear.row===3,'moved on key '+String(k));}
// array key coerces to 'ArrowUp'? record
let arr=L.moveBear({grid,bear:{col:3,row:3}},['ArrowUp']).bear;console.log("key ['ArrowUp'] ->",JSON.stringify(arr),"(informational; KeyboardEvent.key is always string)");
// cooldown
const T=[[1000,1099,false],[1000,1100,true],[1000,1101,true],[1000,1000,false],[1000,999,false],[-Infinity,0,true],[-Infinity,-1e9,true]];
for(const [a,b,e] of T)chk(L.canAcceptMove(a,b)===e,`canAccept(${a},${b}) expected ${e}`);
for(const [a,b] of [[NaN,0],[0,NaN],[NaN,NaN],[Infinity,0],[0,Infinity],[Infinity,Infinity],[-Infinity,-Infinity],[0,-5],[0,-Infinity]])console.log(`canAcceptMove(${a},${b}) =`,L.canAcceptMove(a,b));
chk(L.canAcceptMove(NaN,0)===false&&L.canAcceptMove(0,NaN)===false,'NaN must reject');
chk(L.canAcceptMove(0,Infinity)===true,'now=Inf accept');
chk(L.canAcceptMove(Infinity,0)===false,'last=+Inf reject');
chk(L.canAcceptMove(0,-5)===false,'negative delta reject');
chk(L.canAcceptMove(-5,95)===true && L.canAcceptMove(-5,94)===false,'negative lastMove boundary');
console.log('checks',n,'failures',fails.length);fails.forEach(f=>console.log('FAIL',f));
process.exit(fails.length?1:0);
