import { spawn } from 'node:child_process';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { LEVELS } from '/Users/leetaerim/Downloads/dotgame-taerim/src/levels.js';
import { createGame, pressKey, tick, lampCells } from '/Users/leetaerim/Downloads/dotgame-taerim/src/logic.js';

const OUT = '/Users/leetaerim/Downloads/dotgame-taerim/.gjc/_session-01a1d4dc-f979-76b1-9209-e56593695637/ultragoal/artifacts/qa3';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MAIN = 'http://127.0.0.1:8797/index.html', BAD = 'http://127.0.0.1:8798/index.html';
const T = []; const log = (o) => { T.push(o); console.log(JSON.stringify(o)); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--remote-debugging-port=9335', '--user-data-dir=/tmp/r4/qa3prof/p', '--no-first-run', '--window-size=352,320', 'about:blank'], { stdio: 'ignore' });
let ver; for (let i = 0; i < 50; i++) { try { ver = await (await fetch('http://127.0.0.1:9335/json/version')).json(); break; } catch { await sleep(200); } }
log({ chrome: ver.Browser });

async function openPage({ url, init = '', clock = true }) {
  const t = await (await fetch('http://127.0.0.1:9335/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(); const events = []; const requests = [], consoleErrors = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else {
    if (d.method === 'Network.requestWillBeSent') requests.push(d.params.request.url);
    if (d.method === 'Runtime.exceptionThrown') consoleErrors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') consoleErrors.push(d.params.args.map(a => a.value).join(' '));
  } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Network.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 352, height: 320, deviceScaleFactor: 1, mobile: false });
  const clockJs = clock ? `window.__t = 1000; performance.now = () => window.__t;` : '';
  await send('Page.addScriptToEvaluateOnNewDocument', { source: clockJs + init });
  await send('Page.navigate', { url });
  await sleep(1200);
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result.result.value; };
  const key = (k, repeat = false) => ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(k)},repeat:${repeat},cancelable:true,bubbles:true}));0`);
  const advance = async (ms) => { await ev(`window.__t += ${ms}`); await sleep(60); };
  const shot = async (name) => { const hh = await ev(`(()=>{const c=document.getElementById('game');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;const m={};for(let i=0;i<d.length;i+=4){const k='#'+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('')+(d[i+3]===255?'':'a'+d[i+3]);m[k]=(m[k]||0)+1}return m})()`); (globalThis.CH = globalThis.CH || {})[name] = hh; const r = await send('Page.captureScreenshot', { format: 'png' }); const p = `${OUT}/${name}.png`; fs.writeFileSync(p, Buffer.from(r.result.data, 'base64')); return p; };
  const close = async () => { ws.close(); await fetch(`http://127.0.0.1:9335/json/close/${t.id}`); };
  return { ev, key, advance, shot, close, requests, consoleErrors };
}

// ---- PNG decode ----
function decodePng(p) {
  const b = fs.readFileSync(p); let o = 8, w, h, ct, idat = [];
  while (o < b.length) { const len = b.readUInt32BE(o), ty = b.toString('ascii', o + 4, o + 8), d = b.subarray(o + 8, o + 8 + len);
    if (ty === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; } if (ty === 'IDAT') idat.push(d); o += 12 + len; }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), st = w * bpp, px = Buffer.alloc(h * st);
  for (let y = 0; y < h; y++) { const f = raw[y * (st + 1)]; for (let x = 0; x < st; x++) {
    const c = raw[y * (st + 1) + 1 + x], a = x >= bpp ? px[y * st + x - bpp] : 0, u = y ? px[(y - 1) * st + x] : 0, ul = (y && x >= bpp) ? px[(y - 1) * st + x - bpp] : 0;
    let v; if (f === 0) v = c; else if (f === 1) v = c + a; else if (f === 2) v = c + u; else if (f === 3) v = c + ((a + u) >> 1); else { const pp = a + u - ul, pa = Math.abs(pp - a), pb = Math.abs(pp - u), pc = Math.abs(pp - ul); v = c + (pa <= pb && pa <= pc ? a : pb <= pc ? u : ul); }
    px[y * st + x] = v & 255; } }
  return { w, h, bpp, px };
}
const hex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
function histogram(p, y0, y1) { const { w, h, bpp, px } = decodePng(p); const m = {}; for (let y = y0; y < Math.min(y1, h); y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * bpp; const k = hex(px[i], px[i + 1], px[i + 2]); m[k] = (m[k] || 0) + 1; } return { w, h, hist: m }; }

// ---- plan ending walk using real logic (deterministic: fixed clock, seed) ----
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

const results = {};
// 1. title
let p = await openPage({ url: MAIN });
const titleShot = await p.shot('title');
results.titleReq = p.requests; results.titleErrors = p.consoleErrors;
log({ step: 'title', shot: titleShot, fontsStatus: await p.ev(`[...document.fonts].map(f=>f.family+':'+f.status).join(',')`), requests: p.requests });
// 2. play first frame and after lamp
await p.key(' '); await p.advance(50); const play1 = await p.shot('play_first'); log({ step: 'press space on title -> play', shot: play1 });
// walk level1 to first lamp with plan
const plan = planWalk(); log({ plan: { count: plan.steps.length, final: plan.final, score: plan.score } });
// Replay for level1 from fresh page to get 'after a lamp' screenshot: continue in same page using plan times (page clock at 1000, space pressed at t=1000 -> in plan t=1000 too, but we advanced 50: reload to keep it exact)
await p.close();
p = await openPage({ url: MAIN });
const keySeq = [];
async function replay(page, steps, until) {
  let lampSeen = false;
  for (const s of steps) {
    await page.ev(`window.__t = ${s.t}`);
    if (s.wait) { await sleep(30); continue; }
    await page.key(s.key); keySeq.push(`${s.key}@${s.t}`); await sleep(25);
    if (until && until(s)) return;
  }
}
// until first lamp: first space after a move
let firstLampIdx = plan.steps.findIndex((s, i) => i > 0 && s.key === ' ');
await replay(p, plan.steps.slice(0, firstLampIdx + 1));
await sleep(100);
const playLamp = await p.shot('play_after_lamp'); log({ step: 'level1 first lamp lit', keys: keySeq.slice(), shot: playLamp });
await replay(p, plan.steps.slice(firstLampIdx + 1));
await sleep(200);
const ending = await p.shot('ending'); log({ step: 'full walk to ending', totalKeys: keySeq.length, expectedFinal: plan.final, expectedScore: plan.score, shot: ending, stored: await p.ev(`JSON.stringify(Object.entries(localStorage))`) });
// fail screen on new page: first 3 lamps then wait >60s ... separate scenario below
await p.close();

// 3. fail screen with seeded storage
p = await openPage({ url: MAIN, init: `localStorage.setItem('lighthouse-bear-best','777');` });
const before = await p.ev(`JSON.stringify(Object.entries(localStorage))`);
await p.key(' '); await p.advance(100); await p.ev(`window.__t += 61000`); await sleep(150);
const fail = await p.shot('fail');
const after = await p.ev(`JSON.stringify(Object.entries(localStorage))`);
log({ step: 'start then +61s virtual', shot: fail, storageBefore: before, storageAfter: after });
// restart from fail
await p.key(' '); await sleep(80); const tit2 = await p.shot('after_fail_restart_title');
await p.close();

// HUD 4-digit score screenshot: ending score with best rendering plus a mid-play 4-digit isn't reachable (needs 1000+): use level 3 in walk; screenshot at level 3 start (score>=?)
p = await openPage({ url: MAIN });
let lvl3Shot = null, idx = 0, seenLevel = 0; // detect level 3 start: plan steps where after clearing second level; use score text probing by pixels not possible, so replay and screenshot just before final space
const lastSpace = plan.steps.map((s, i) => s.key === ' ' && i).filter(Boolean).pop();
await replay(p, plan.steps.slice(0, lastSpace)); await sleep(100);
lvl3Shot = await p.shot('play_level3_before_last_lamp'); log({ step: 'level3 before last lamp', shot: lvl3Shot });
await p.close();

// 4. adversarial
const adv = {};
// 4a storage throws
p = await openPage({ url: MAIN, init: `Storage.prototype.getItem=function(){throw new Error('blocked')};Storage.prototype.setItem=function(){throw new Error('blocked')};` });
await replay(p, plan.steps); await sleep(200);
adv.storageThrows = { shot: await p.shot('adv_storage_throws_ending'), errors: p.consoleErrors };
log({ adv: 'storage getItem/setItem throw -> full walk', errors: p.consoleErrors, shot: adv.storageThrows.shot });
await p.close();
// 4a2 localStorage property getter throws (SecurityError style)
p = await openPage({ url: MAIN, init: `Object.defineProperty(window,'localStorage',{get(){throw new DOMException('denied','SecurityError')}});` });
await replay(p, plan.steps); await sleep(200);
adv.lsGetterThrows = { shot: await p.shot('adv_ls_getter_throws_ending'), errors: p.consoleErrors };
log({ adv: 'window.localStorage getter throws -> full walk', errors: p.consoleErrors, shot: adv.lsGetterThrows.shot });
await p.close();
// 4b stored values
for (const [name, v] of [['3001', '3001'], ['abc', 'abc'], ['3000', '3000'], ['neg', '-5'], ['float', '12.5'], ['lead0', '0100']]) {
  p = await openPage({ url: MAIN, init: `localStorage.setItem('lighthouse-bear-best',${JSON.stringify(v)});` });
  await replay(p, plan.steps); await sleep(200);
  const sh = await p.shot(`adv_stored_${name}_ending`);
  const st = await p.ev(`localStorage.getItem('lighthouse-bear-best')`);
  log({ adv: `stored '${v}' then full walk (score ${plan.score})`, storedAfter: st, shot: sh, errors: p.consoleErrors });
  adv['stored_' + name] = { storedAfter: st, shot: sh }; await p.close();
}
// 4c font 404
p = await openPage({ url: BAD });
const bt = await p.shot('adv_font404_title'); await p.key(' '); await p.advance(50); const bp = await p.shot('adv_font404_play');
log({ adv: 'font 404 page', requests: p.requests, errors: p.consoleErrors, fontStatus: await p.ev(`[...document.fonts].map(f=>f.family+':'+f.status).join(',')`), shots: [bt, bp] });
await p.close();
// 4d repeat
p = await openPage({ url: MAIN });
await p.key(' ', true); await sleep(80); const rep1 = await p.shot('adv_repeat_title_ignored');
await p.key(' ', false); await p.advance(50);
const probe = async (k, rep) => { await p.ev(`window.__t += 150`); await p.key(k, rep); await sleep(60); };
const beforeMove = await p.shot('adv_repeat_before');
await probe('ArrowRight', true); await probe('ArrowRight', true); await probe('ArrowDown', true); await sleep(60);
const afterRep = await p.shot('adv_repeat_after_repeat_moves');
await probe('ArrowRight', false); const afterReal = await p.shot('adv_repeat_after_real_move');
const same = fs.readFileSync(beforeMove).equals(fs.readFileSync(afterRep)), diff = !fs.readFileSync(beforeMove).equals(fs.readFileSync(afterReal));
// prevent default check
const pd = await p.ev(`(()=>{const e=new KeyboardEvent('keydown',{key:' ',repeat:true,cancelable:true});document.dispatchEvent(e);return e.defaultPrevented})()`);
log({ adv: 'repeat=true ignored', titleStillTitle: fs.readFileSync(rep1).equals(fs.readFileSync(titleShot)), repeatMovesLeaveFrameIdentical: same, realMoveChangesFrame: diff, repeatSpaceDefaultPrevented: pd });
await p.close();
// 4e arrow/space preventDefault non-repeat
// ---- pixel checks ----
const PAL = new Set(['#0b0e1a', '#d08a3c', '#f2efe0']);
const pix = {};
for (const [n, y0, y1] of [['title', 0, 320], ['ending', 0, 320], ['fail', 0, 320], ['adv_storage_throws_ending', 0, 320], ['play_first', 288, 320], ['play_after_lamp', 288, 320], ['play_level3_before_last_lamp', 288, 320]]) {
  const r = histogram(`${OUT}/${n}.png`, y0, y1); const bad = Object.entries(r.hist).filter(([k]) => !PAL.has(k));
  pix[n] = { size: `${r.w}x${r.h}`, rows: `${y0}-${y1}`, nonPalette: bad.length, nonPaletteSamples: bad.slice(0, 5), hist: r.hist };
}
log({ pixelCheck: pix });
// nonuniform check
const uni = {}; for (const f of fs.readdirSync(OUT).filter(f => f.endsWith('.png'))) { const r = histogram(`${OUT}/${f}`, 0, 320); uni[f] = { colors: Object.keys(r.hist).length, size: `${r.w}x${r.h}` }; }
log({ screenshotColors: uni });
fs.writeFileSync(`${OUT}/canvas_hist.json`, JSON.stringify(globalThis.CH, null, 1));
fs.writeFileSync(`${OUT}/transcript.json`, JSON.stringify({ keySeqSample: keySeq.slice(0, 60), T }, null, 1));
chrome.kill(); process.exit(0);
