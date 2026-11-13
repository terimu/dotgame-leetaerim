// 기대값은 GAME_DESIGN.md v2의 숫자(2장·점수 표)와 5장 레벨 1 격자에서 손으로 가져왔다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL1 } from '../src/levels.js';
import {
  PALETTE,
  SPRITE_BEAR,
  SPRITE_BEAR_STUNNED,
  SPRITE_FLOOR,
  SPRITE_LAMP_OFF,
  SPRITE_LAMP_ON,
  SPRITE_SEAGULL,
  SPRITE_WALL,
} from '../src/sprites.js';
import { hudLamps, hudScore, hudTime } from '../src/strings.js';
import {
  MOVE_COOLDOWN_MS,
  TILE_SIZE,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  LEVEL1_COLS,
  LEVEL1_ROWS,
  LEVEL_TIME_MS,
  STUN_MS,
  SEAGULL_MOVE_INTERVAL_MS,
  RNG_SEED,
  LAMP_SCORE,
  createState,
  tileAt,
  moveBear,
  canAcceptMove,
  mapOffset,
  lampCells,
  farthestFloorCell,
  nextRandom,
  gullCandidates,
  advance,
  pressMove,
  pressLight,
  litCount,
  lampTotal,
  remainingSeconds,
} from '../src/logic.js';

const at = (col, row) => ({ grid: LEVEL1, bear: { col, row } });

test('레벨 1 격자는 9열 x 7행이다 (2장 맵 칸 수)', () => {
  assert.equal(LEVEL1.length, 7);
  for (const row of LEVEL1) assert.equal(row.length, 9);
});

test('문서 숫자 대조: 쿨다운 100, 타일 32, 화면 352x320, 칸 수 9x7 (2장)', () => {
  assert.equal(MOVE_COOLDOWN_MS, 100);
  assert.equal(TILE_SIZE, 32);
  assert.equal(SCREEN_WIDTH, 352);
  assert.equal(SCREEN_HEIGHT, 320);
  assert.equal(LEVEL1_COLS, 9);
  assert.equal(LEVEL1_ROWS, 7);
});

test('곰 시작 칸은 격자 B 칸 (1,1) (5장)', () => {
  assert.deepEqual(createState(LEVEL1, 0).bear, { col: 1, row: 1 });
});

test('범위 밖은 null (2장 벽 막힘: 맵 밖 이동 무시)', () => {
  assert.equal(tileAt(LEVEL1, -1, 0), null);
  assert.equal(tileAt(LEVEL1, 9, 0), null);
  assert.equal(tileAt(LEVEL1, 0, 7), null);
  assert.equal(tileAt(LEVEL1, 0, 0), '#');
});

test('(1,1)에서 → 는 (2,1) (2장 방향키 조작)', () => {
  assert.deepEqual(moveBear(at(1, 1), 'ArrowRight').bear, { col: 2, row: 1 });
});

test('(1,1)에서 ↓ 는 (1,2) (2장 방향키 조작)', () => {
  assert.deepEqual(moveBear(at(1, 1), 'ArrowDown').bear, { col: 1, row: 2 });
});

test('(2,2)에서 ← 는 (1,2), ↑ 는 (2,1) (2장 방향키 조작)', () => {
  assert.deepEqual(moveBear(at(2, 2), 'ArrowLeft').bear, { col: 1, row: 2 });
  assert.deepEqual(moveBear(at(2, 2), 'ArrowUp').bear, { col: 2, row: 1 });
});

test('L 칸 진입 허용: 격자 2행 #.L...L.# 이므로 (1,2)에서 → 는 (2,2) (5장 범례)', () => {
  assert.deepEqual(moveBear(at(1, 2), 'ArrowRight').bear, { col: 2, row: 2 });
});

test('벽 막힘: (1,1)에서 ←, ↑ 는 제자리 (2장 벽 막힘, 5장 테두리 #)', () => {
  assert.deepEqual(moveBear(at(1, 1), 'ArrowLeft').bear, { col: 1, row: 1 });
  assert.deepEqual(moveBear(at(1, 1), 'ArrowUp').bear, { col: 1, row: 1 });
});

test('벽 막힘: (7,1)에서 → 는 제자리, (1,5)에서 ↓ 는 제자리 (열 8, 행 6은 #)', () => {
  assert.deepEqual(moveBear(at(7, 1), 'ArrowRight').bear, { col: 7, row: 1 });
  assert.deepEqual(moveBear(at(1, 5), 'ArrowDown').bear, { col: 1, row: 5 });
});

test('방향키 외의 키는 이동하지 않는다 (2장 입력)', () => {
  for (const key of [' ', 'a', 'Enter', 'Shift']) {
    assert.deepEqual(moveBear(at(1, 1), key).bear, { col: 1, row: 1 });
  }
});

test('이동해도 원본 상태는 바뀌지 않는다 (AGENTS.md 순수 함수)', () => {
  const before = at(1, 1);
  moveBear(before, 'ArrowRight');
  assert.deepEqual(before.bear, { col: 1, row: 1 });
});

test('쿨다운 경계: 마지막 이동 후 99 ms 거부, 100 ms 수락 (2장 이동 후 입력 쿨다운)', () => {
  assert.equal(canAcceptMove(1000, 1099), false);
  assert.equal(canAcceptMove(1000, 1100), true);
});

test('첫 입력은 항상 수락 (2장 이동 후 입력 쿨다운)', () => {
  assert.equal(canAcceptMove(-Infinity, 0), true);
});

test('맵 위치: 레벨 1은 (32,32), 11x9 맵은 (0,0) (2장 맵 위치)', () => {
  assert.deepEqual(mapOffset(9, 7), { x: 32, y: 32 });
  assert.deepEqual(mapOffset(11, 9), { x: 0, y: 0 });
});

test('팔레트는 8색이고 모두 #rrggbb (6장)', () => {
  assert.equal(PALETTE.length, 8);
  for (const hex of PALETTE) assert.match(hex, /^#[0-9a-f]{6}$/);
});

test('스프라이트는 16x16이고 값은 null 또는 0..7 (4장, 6장)', () => {
  for (const sprite of [
    SPRITE_BEAR,
    SPRITE_FLOOR,
    SPRITE_WALL,
    SPRITE_SEAGULL,
    SPRITE_LAMP_OFF,
    SPRITE_LAMP_ON,
    SPRITE_BEAR_STUNNED,
  ]) {
    assert.equal(sprite.length, 16);
    for (const row of sprite) {
      assert.equal(row.length, 16);
      for (const v of row) assert.ok(v === null || (Number.isInteger(v) && v >= 0 && v <= 7));
    }
  }
});

// ---- R2 (goal-2) ----
// 곰·갈매기 위치를 직접 놓는 헬퍼. 갈매기 예약을 끄면(Infinity) 점등·기절 테스트가 갈매기 경로에 기대지 않는다.
const make = (bear, gull, extra = {}) => ({
  ...createState(LEVEL1, 0),
  bear,
  gull,
  ...extra,
});
const calm = (bear, extra = {}) => make(bear, { col: 7, row: 5 }, { nextGullMoveMs: Infinity, ...extra });

test('문서 숫자 대조: 60 000, 3 000, 300, 20261113, 100점 (2장 R2 규칙 표·점수 표)', () => {
  assert.equal(LEVEL_TIME_MS, 60000);
  assert.equal(STUN_MS, 3000);
  assert.equal(SEAGULL_MOVE_INTERVAL_MS, 300);
  assert.equal(RNG_SEED, 20261113);
  assert.equal(LAMP_SCORE, 100);
});

test('createState는 nowMs가 필수다', () => {
  assert.throws(() => createState(LEVEL1), TypeError);
});

test('레벨 1 등불은 3개이고 위치는 5장 격자의 (2,2), (6,2), (3,4)', () => {
  assert.deepEqual(lampCells(LEVEL1), [
    { col: 2, row: 2 },
    { col: 6, row: 2 },
    { col: 3, row: 4 },
  ]);
  assert.equal(lampTotal(createState(LEVEL1, 0)), 3);
});

test('갈매기 배치: 곰 (1,1) 기준 가장 먼 바닥 칸은 (7,5), 거리 동률이면 위쪽 행·왼쪽 열 (2장 갈매기 배치)', () => {
  assert.deepEqual(createState(LEVEL1, 0).gull, { col: 7, row: 5 });
  assert.deepEqual(farthestFloorCell(LEVEL1, { col: 4, row: 3 }), { col: 1, row: 1 });
});

test('mulberry32 시드 20261113의 첫 3개 값 (2장 난수 행)', () => {
  const first = nextRandom(RNG_SEED);
  const second = nextRandom(first.rng);
  const third = nextRandom(second.rng);
  assert.equal(first.value, 0.7961874215397984);
  assert.equal(second.value, 0.2869089210871607);
  assert.equal(third.value, 0.6110482160001993);
});

test('갈매기 후보: 곰에게 가까워지는 비벽 이웃만, 순서 위·아래·왼쪽·오른쪽 (2장 갈매기 이동)', () => {
  assert.deepEqual(gullCandidates(LEVEL1, { col: 7, row: 5 }, { col: 1, row: 1 }), [
    { col: 7, row: 4 },
    { col: 6, row: 5 },
  ]);
  assert.deepEqual(gullCandidates(LEVEL1, { col: 2, row: 1 }, { col: 1, row: 1 }), [{ col: 1, row: 1 }]);
});

test('갈매기 이동: 299 ms는 제자리, 300·600·900 ms에 한 칸씩 (6,5), (6,4), (5,4) (2장 이동 간격·후보 선택식)', () => {
  const s = createState(LEVEL1, 0);
  assert.deepEqual(advance(s, 299).gull, { col: 7, row: 5 });
  assert.deepEqual(advance(s, 300).gull, { col: 6, row: 5 });
  assert.deepEqual(advance(s, 600).gull, { col: 6, row: 4 });
  assert.deepEqual(advance(s, 900).gull, { col: 5, row: 4 });
});

test('갈매기는 벽·맵 밖으로 나가지 않는다 (2장 갈매기 이동)', () => {
  let s = createState(LEVEL1, 0);
  for (let t = 0; t <= 30000; t += 100) {
    s = advance(s, t);
    const tile = tileAt(LEVEL1, s.gull.col, s.gull.row);
    assert.ok(tile !== null && tile !== '#', `t=${t}`);
  }
});

test('점등: L 칸에서 스페이스바 → 켜짐 + 100점, 다른 칸·이미 켠 칸은 변화 없음 (2장 점등, 점수 표)', () => {
  const lit = pressLight(calm({ col: 2, row: 2 }), 100);
  assert.deepEqual(lit.lit, [{ col: 2, row: 2 }]);
  assert.equal(lit.score, 100);
  assert.equal(litCount(lit), 1);
  const plain = pressLight(calm({ col: 1, row: 1 }), 100);
  assert.equal(plain.score, 0);
  assert.equal(litCount(plain), 0);
  const again = pressLight(lit, 200);
  assert.equal(again.score, 100);
  assert.equal(litCount(again), 1);
});

test('등불 3개를 모두 켜면 300점이고 클리어, 시각이 기록된다 (점수 표, 2장 맵 순서·승리·실패)', () => {
  let s = calm({ col: 2, row: 2 });
  s = pressLight(s, 1000);
  s = pressLight({ ...s, bear: { col: 6, row: 2 } }, 2000);
  assert.equal(s.status, 'playing');
  s = pressLight({ ...s, bear: { col: 3, row: 4 } }, 3000);
  assert.equal(s.score, 300);
  assert.equal(s.status, 'cleared');
  assert.equal(s.endMs, 3000);
  const frozen = pressLight(pressMove(s, 'ArrowRight', 4000), 5000);
  assert.deepEqual(frozen.bear, { col: 3, row: 4 });
  assert.equal(frozen.score, 300);
});

test('제한시간 경계: 경과 60 000 ms 점등은 클리어, 60 001 ms는 실패이고 점수 불변 (2장 마지막 등불 vs 만료)', () => {
  const nearlyDone = calm({ col: 3, row: 4 }, { lit: [{ col: 2, row: 2 }, { col: 6, row: 2 }], score: 200 });
  const win = pressLight(nearlyDone, 60000);
  assert.equal(win.status, 'cleared');
  assert.equal(win.score, 300);
  const late = pressLight(nearlyDone, 60001);
  assert.equal(late.status, 'failed');
  assert.equal(late.score, 200);
  assert.equal(late.endMs, 60000);
  assert.equal(advance(nearlyDone, 60000).status, 'playing');
  assert.equal(advance(nearlyDone, 60001).status, 'failed');
});

test('HUD 남은 시간은 올림: 0 ms=60, 1 ms=60, 1000 ms=59, 59001 ms=1, 60000 ms=0 (2장 HUD)', () => {
  const s = calm({ col: 1, row: 1 });
  assert.equal(remainingSeconds(s, 0), 60);
  assert.equal(remainingSeconds(s, 1), 60);
  assert.equal(remainingSeconds(s, 1000), 59);
  assert.equal(remainingSeconds(s, 59001), 1);
  assert.equal(remainingSeconds(s, 60000), 0);
});

test('HUD 문구 형식 (9장 12·13·14번)', () => {
  assert.equal(hudLamps(0, 3), '등불 0/3');
  assert.equal(hudScore(0), '점수 0');
  assert.equal(hudTime(60), '남은 시간 60');
});

test('갈매기가 곰 칸으로 들어오면 그 이동 시각 300 ms에 기절, 3 000 ms 뒤 같은 칸에서 부활 (2장 기절)', () => {
  const s = make({ col: 1, row: 1 }, { col: 2, row: 1 });
  assert.equal(advance(s, 299).stunUntilMs, null);
  const stunned = advance(s, 300);
  assert.equal(stunned.stunUntilMs, 3300);
  assert.deepEqual(stunned.bear, { col: 1, row: 1 });
  assert.equal(advance(s, 3299).stunUntilMs, 3300);
  const awake = advance(s, 3300);
  assert.equal(awake.stunUntilMs, null);
  assert.deepEqual(awake.bear, { col: 1, row: 1 });
});

test('기절 시 갈매기는 곰에게서 가장 먼 칸 (7,5)로 옮겨져 부활 후 300 ms에 다시 움직인다 (2장 기절 시 갈매기)', () => {
  const s = make({ col: 1, row: 1 }, { col: 2, row: 1 });
  const stunned = advance(s, 300);
  assert.deepEqual(stunned.gull, { col: 7, row: 5 });
  assert.deepEqual(advance(s, 3599).gull, { col: 7, row: 5 });
  assert.notDeepEqual(advance(s, 3600).gull, { col: 7, row: 5 });
});

test('곰이 걸어서 갈매기 칸에 들어가도 기절, 시각은 입력 시각 + 3 000 ms (2장 충돌 판정 시점)', () => {
  const s = make({ col: 1, row: 1 }, { col: 2, row: 1 }, { nextGullMoveMs: Infinity });
  const next = pressMove(s, 'ArrowRight', 1000);
  assert.deepEqual(next.bear, { col: 2, row: 1 });
  assert.equal(next.stunUntilMs, 4000);
  assert.deepEqual(next.gull, { col: 7, row: 5 });
});

test('인접 칸은 기절하지 않는다 (2장 기절, 스펙 F9)', () => {
  const s = make({ col: 1, row: 1 }, { col: 3, row: 1 });
  const next = advance(s, 300);
  assert.deepEqual(next.gull, { col: 2, row: 1 });
  assert.equal(next.stunUntilMs, null);
});

test('기절 중 방향키·스페이스바는 무시, 3 000 ms 경계에서 다시 받는다 (2장 기절 중)', () => {
  const s = make({ col: 2, row: 2 }, { col: 3, row: 2 });
  assert.equal(advance(s, 300).stunUntilMs, 3300);
  assert.deepEqual(pressMove(s, 'ArrowRight', 3299).bear, { col: 2, row: 2 });
  assert.equal(litCount(pressLight(s, 3299)), 0);
  assert.equal(litCount(pressLight(s, 3300)), 1);
  assert.deepEqual(pressMove(s, 'ArrowRight', 3300).bear, { col: 3, row: 2 });
});

test('기절해도 점수는 줄지 않고 타이머는 계속 간다 (점수 표 기절, 2장 기절 중)', () => {
  const s = make({ col: 1, row: 1 }, { col: 2, row: 1 }, { score: 200 });
  const stunned = advance(s, 1000);
  assert.equal(stunned.score, 200);
  assert.equal(remainingSeconds(stunned, 1000), 59);
});

test('쿨다운: 이동 후 99 ms는 거부, 100 ms는 수락 (2장 이동 쿨다운 위치)', () => {
  const s = calm({ col: 1, row: 1 });
  const moved = pressMove(s, 'ArrowRight', 0);
  assert.deepEqual(moved.bear, { col: 2, row: 1 });
  assert.deepEqual(pressMove(moved, 'ArrowRight', 99).bear, { col: 2, row: 1 });
  assert.deepEqual(pressMove(moved, 'ArrowRight', 100).bear, { col: 3, row: 1 });
});

test('벽 막힘·스페이스바는 쿨다운을 시작하지 않는다 (2장 이동 쿨다운 위치)', () => {
  const s = calm({ col: 1, row: 1 });
  const bumped = pressMove(s, 'ArrowLeft', 0);
  assert.equal(bumped.lastMoveMs, -Infinity);
  const moved = pressMove(s, 'ArrowRight', 0);
  assert.equal(pressLight(moved, 50).lastMoveMs, 0);
  assert.deepEqual(pressMove(pressLight(s, 0), 'ArrowRight', 0).bear, { col: 2, row: 1 });
});

test('시간을 나눠 진행해도 한 번에 진행한 것과 같다 (2장 시간 진행 규칙)', () => {
  const s = make({ col: 2, row: 2 }, { col: 7, row: 5 });
  for (const end of [10000, 61000]) {
    let stepped = s;
    for (let t = 137; t < end; t += 137) stepped = advance(stepped, t);
    assert.deepEqual(advance(stepped, end), advance(s, end));
  }
});

test('같은 입력 스크립트를 두 번 재생하면 같은 상태 (2장 난수, 고정 시드)', () => {
  const script = [
    [0, 'ArrowRight'],
    [150, 'ArrowDown'],
    [300, ' '],
    [450, 'ArrowRight'],
    [800, 'ArrowDown'],
    [5000, ' '],
  ];
  const play = () => {
    let s = createState(LEVEL1, 0);
    for (const [t, key] of script) s = key === ' ' ? pressLight(s, t) : pressMove(s, key, t);
    return advance(s, 20000);
  };
  assert.deepEqual(play(), play());
});

test('새 스프라이트: 곰 기절은 곰과 0·6행만 다르고, 켜진 등불은 꺼진 등불과 4~9행만 다르다 (4장)', () => {
  const differing = (a, b) => a.flatMap((row, i) => (JSON.stringify(row) === JSON.stringify(b[i]) ? [] : [i]));
  assert.deepEqual(differing(SPRITE_BEAR, SPRITE_BEAR_STUNNED), [0, 6]);
  assert.deepEqual(differing(SPRITE_LAMP_OFF, SPRITE_LAMP_ON), [4, 5, 6, 7, 8, 9]);
});
