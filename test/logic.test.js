// 기대값은 GAME_DESIGN.md v2의 숫자(2장·점수 표)와 5장 레벨 1 격자에서 손으로 가져왔다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVEL1, LEVEL2, LEVEL3, LEVELS } from '../src/levels.js';
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
import {
  ENDING_LINE_1,
  ENDING_LINE_2,
  FAIL_LINE,
  RESTART_HINT,
  TITLE_NAME,
  TITLE_PROMPT,
  hudLamps,
  hudScore,
  hudTime,
} from '../src/strings.js';
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
  CLEAR_BONUS_PER_SECOND,
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
  clearBonus,
  afterClear,
  createGame,
  tick,
  pressKey,
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

// ---- R2 (goal-3): 점수 마무리와 화면 전환 ----
// 기대값은 2장 점수 표(100점/등불, 남은 시간 초 내림 × 10)와 3장 화면 흐름 표에서 손으로 가져왔다.
// 레벨 1만 있는 순서: 레벨 1 클리어가 곧 엔딩인 R2 시나리오를 그대로 쓴다 (2장 맵 순서 일반형).
const ONE = [LEVEL1];
const playing = (level) => ({ screen: 'play', levelIndex: 0, level });
// 등불 2개를 켠 상태에서 마지막 L (3,4) 위에 곰이 서 있고 갈매기는 멈춰 있는 레벨.
const lastLamp = (extra = {}) =>
  calm({ col: 3, row: 4 }, { lit: [{ col: 2, row: 2 }, { col: 6, row: 2 }], score: 200, ...extra });

test('문서 숫자 대조: 보너스 초당 10점 (2장 점수 표)', () => {
  assert.equal(CLEAR_BONUS_PER_SECOND, 10);
});

test('클리어 보너스: 남은 시간 초 내림 × 10 (2장 점수 표 예시와 경계)', () => {
  assert.equal(clearBonus(37900), 370);
  assert.equal(clearBonus(400), 0);
  assert.equal(clearBonus(0), 0);
  assert.equal(clearBonus(60000), 600);
  assert.equal(clearBonus(59999), 590);
  assert.equal(clearBonus(999), 0);
  assert.equal(clearBonus(1000), 10);
  assert.equal(clearBonus(1999), 10);
  assert.equal(clearBonus(2000), 20);
});

test('맵 순서 일반형: 레벨 1만 있으면 엔딩, 3개면 레벨 3에서만 엔딩 (2장 맵 순서·승리·실패)', () => {
  assert.equal(afterClear(0, 1), 'ending');
  assert.equal(afterClear(0, 3), 'next');
  assert.equal(afterClear(1, 3), 'next');
  assert.equal(afterClear(2, 3), 'ending');
});

test('페이지를 열면 타이틀이고 level은 없다 (3장 타이틀)', () => {
  assert.deepEqual(createGame(), { screen: 'title', levelIndex: 0, level: null });
});

test('점수 합산: 경과 22 100 ms에 마지막 등불 → 300 + 370 = 670, 엔딩 화면 (점수 표)', () => {
  const g = pressKey(playing(lastLamp()), ' ', ONE, 22100);
  assert.equal(g.screen, 'ending');
  assert.equal(g.level.score, 670);
});

test('클리어 우선: 경과 정확히 60 000 ms에 마지막 등불 → 300 + 0 = 300 (2장 마지막 등불 vs 만료)', () => {
  const g = pressKey(playing(lastLamp()), ' ', ONE, 60000);
  assert.equal(g.screen, 'ending');
  assert.equal(g.level.score, 300);
});

test('실패 판은 보너스가 없다: 등불 2개 후 만료 → 실패 화면, 점수 200 (점수 표 실패)', () => {
  const g = tick(playing(lastLamp()), ONE, 60001);
  assert.equal(g.screen, 'fail');
  assert.equal(g.level.score, 200);
});

test('보너스는 한 번만 더해진다: ending에서 tick을 두 번 불러도 670 (점수 표)', () => {
  let g = pressKey(playing(lastLamp()), ' ', ONE, 22100);
  g = tick(tick(g, ONE, 30000), ONE, 90000);
  assert.equal(g.screen, 'ending');
  assert.equal(g.level.score, 670);
});

test('tick은 play가 아니면 그대로, 시간만 지나서 클리어되지는 않는다 (3장)', () => {
  const title = createGame();
  assert.deepEqual(tick(title, ONE, 99999), title);
  const g = playing(lastLamp());
  assert.equal(tick(g, ONE, 1000).screen, 'play');
});

test('새 판은 점수 0의 처음 상태: 실패 화면(200점) → 타이틀 → 스페이스 (점수 표 실패, 2장 맵 순서·승리·실패)', () => {
  let g = tick(playing(lastLamp()), ONE, 60001);
  assert.equal(g.level.score, 200);
  g = pressKey(g, ' ', ONE, 70000);
  assert.deepEqual(g, createGame());
  g = pressKey(g, ' ', ONE, 80000);
  assert.equal(g.screen, 'play');
  assert.equal(g.level.score, 0);
  assert.deepEqual(g.level.lit, []);
  assert.deepEqual(g.level.bear, { col: 1, row: 1 });
  assert.deepEqual(g.level.gull, { col: 7, row: 5 });
  assert.equal(g.level.startMs, 80000);
  assert.equal(g.level.rng, 20261113);
  assert.equal(g.level.lastMoveMs, -Infinity);
  assert.equal(g.level.status, 'playing');
  assert.equal(g.level.stunUntilMs, null);
});

test('같은 시드로 두 번 시작하면 같은 상태 (2장 난수)', () => {
  const start = (t) => pressKey(createGame(), ' ', ONE, t).level;
  const a = start(5000);
  const b = start(5000);
  assert.deepEqual(a, b);
  assert.deepEqual(advance(a, 15000), advance(b, 15000));
});

test('시작 점수 이월: createState(grid, now, 450).score === 450 (점수 표 맵 사이 합산)', () => {
  assert.equal(createState(LEVEL1, 0, 450).score, 450);
});

test('타이머는 타이틀에서 스페이스를 누른 순간 시작한다 (9장 26번, 2장 제한시간)', () => {
  const g = pressKey(createGame(), ' ', ONE, 10000);
  assert.equal(remainingSeconds(g.level, 10000), 60);
  assert.equal(remainingSeconds(g.level, 11000), 59);
});

test('타이틀: 스페이스만 시작, 방향키·엔터는 불변 (3장 타이틀)', () => {
  const title = createGame();
  for (const key of ['ArrowRight', 'ArrowUp', 'Enter', 'Escape', 'a']) {
    assert.deepEqual(pressKey(title, key, ONE, 1000), title);
  }
  assert.equal(pressKey(title, ' ', ONE, 1000).screen, 'play');
});

test('플레이 중 엔터·Esc는 상태 불변 (3장 플레이)', () => {
  const g = playing(calm({ col: 1, row: 1 }));
  for (const key of ['Enter', 'Escape', 'Shift']) {
    assert.deepEqual(pressKey(g, key, ONE, 1000), g);
  }
});

test('플레이 중 방향키는 이동, 스페이스는 점등 (3장 플레이)', () => {
  const g = playing(calm({ col: 1, row: 1 }));
  assert.deepEqual(pressKey(g, 'ArrowRight', ONE, 1000).level.bear, { col: 2, row: 1 });
  const onLamp = playing(calm({ col: 2, row: 2 }));
  assert.equal(pressKey(onLamp, ' ', ONE, 1000).level.score, 100);
});

test('엔딩·실패: 스페이스는 타이틀로, 방향키·엔터는 불변 (3장 엔딩·실패)', () => {
  const ending = pressKey(playing(lastLamp()), ' ', ONE, 22100);
  const fail = tick(playing(lastLamp()), ONE, 60001);
  for (const g of [ending, fail]) {
    for (const key of ['ArrowDown', 'Enter', 'Escape']) {
      assert.deepEqual(pressKey(g, key, ONE, 90000), g);
    }
    assert.deepEqual(pressKey(g, ' ', ONE, 90000), createGame());
  }
});

test('keydown 소비: 스페이스 한 번은 한 화면 전환만 일으킨다 (3장 소비 규칙)', () => {
  // 엔딩 → 타이틀에서 멈춘다 (곧바로 플레이로 가지 않는다).
  const ending = pressKey(playing(lastLamp()), ' ', ONE, 22100);
  assert.equal(pressKey(ending, ' ', ONE, 23000).screen, 'title');
  // 마지막 등불을 켠 스페이스는 엔딩까지만 간다 (같은 입력이 타이틀로 넘기지 않는다).
  assert.equal(pressKey(playing(lastLamp()), ' ', ONE, 22100).screen, 'ending');
  // 타이틀 → 플레이에서 같은 스페이스가 점등을 일으키지 않는다.
  const started = pressKey(createGame(), ' ', ONE, 1000);
  assert.equal(started.level.score, 0);
  assert.deepEqual(started.level.lit, []);
});

test('만료로 실패 화면이 된 뒤 도착한 입력은 버린다 (3장 소비 규칙)', () => {
  const g = playing(calm({ col: 1, row: 1 }));
  const after = pressKey(g, ' ', ONE, 60001);
  assert.equal(after.screen, 'fail');
  const afterMove = pressKey(g, 'ArrowRight', ONE, 60001);
  assert.equal(afterMove.screen, 'fail');
  assert.deepEqual(afterMove.level.bear, { col: 1, row: 1 });
});

test('엔딩 문구 두 문자열을 공백 하나로 이으면 스펙 원문 (3장 R2 임시 문구, 스펙 F10)', () => {
  assert.equal(`${ENDING_LINE_1} ${ENDING_LINE_2}`, '등대에 다시 불이 들어왔다. 곰은 아침까지 등불을 지킨다.');
});

test('타이틀·실패·안내 문구 (3장 R2 임시 문구)', () => {
  assert.equal(TITLE_NAME, '등대지기 곰');
  assert.equal(TITLE_PROMPT, '스페이스바로 시작');
  assert.equal(FAIL_LINE, '밤이 끝났다.');
  assert.equal(RESTART_HINT, '스페이스바로 처음 화면');
});

test('같은 입력 스크립트를 두 번 재생하면 같은 게임 상태 (타이틀부터 실패까지)', () => {
  const script = [[1000, ' '], [1200, 'ArrowRight'], [1500, 'ArrowDown'], [2000, ' '], [3000, 'ArrowRight']];
  const play = () => {
    let g = createGame();
    for (const [t, key] of script) g = pressKey(g, key, ONE, t);
    return tick(g, ONE, 70000);
  };
  const a = play();
  assert.deepEqual(a, play());
  assert.equal(a.screen, 'fail');
});

test('다음 레벨이 있으면 보너스를 더한 점수로 이어서 시작한다 (점수 표 맵 사이 합산, 일반형 순서)', () => {
  const two = [LEVEL1, LEVEL1];
  const g = pressKey(playing(lastLamp()), ' ', two, 22100);
  assert.equal(g.screen, 'play');
  assert.equal(g.levelIndex, 1);
  assert.equal(g.level.score, 670);
  assert.equal(g.level.startMs, 22100);
  assert.deepEqual(g.level.lit, []);
});

// ---- R3 (goal-4): 레벨 2·3 ----
// 기대값은 GAME_DESIGN.md 5장 격자와 2장 점수 표·맵 위치, 9장 36~48번에서 손으로 가져왔다.
const cellKey = (c) => `${c.col},${c.row}`;
const lampsOf = (grid) => lampCells(grid).map(cellKey);

test('5장 격자 3개는 src/levels.js와 글자까지 같다 (5장, 스펙 R13)', () => {
  const doc = readFileSync(new URL('../GAME_DESIGN.md', import.meta.url), 'utf8');
  const chapter = doc.slice(doc.indexOf('## 5.'), doc.indexOf('## 6.'));
  const blocks = [...chapter.matchAll(/```\n([\s\S]*?)```/g)].map((m) => m[1].trimEnd().split('\n'));
  assert.deepEqual(blocks, [LEVEL1, LEVEL2, LEVEL3]);
});

test('맵 순서는 레벨 1 → 2 → 3이고 칸 수는 9×7, 10×7, 11×9 (2장 맵 칸 수·맵 순서)', () => {
  assert.deepEqual(LEVELS, [LEVEL1, LEVEL2, LEVEL3]);
  assert.deepEqual([LEVEL1, LEVEL2, LEVEL3].map((g) => [g[0].length, g.length]), [[9, 7], [10, 7], [11, 9]]);
  for (const grid of LEVELS) for (const row of grid) assert.equal(row.length, grid[0].length);
});

test('등불 수는 3·4·5개이고 합 12 (2장 점수 표 1200점, 9장 37·42번 HUD)', () => {
  assert.deepEqual(LEVELS.map((g) => lampCells(g).length), [3, 4, 5]);
  assert.equal(lampTotal(createState(LEVEL2, 0)), 4);
  assert.equal(lampTotal(createState(LEVEL3, 0)), 5);
});

test('레벨 2·3 등불 위치는 5장 격자의 L 칸 (9장 36·42번)', () => {
  assert.deepEqual(lampsOf(LEVEL2), ['3,2', '8,2', '2,4', '7,4']);
  assert.deepEqual(lampsOf(LEVEL3), ['2,2', '8,2', '4,4', '6,4', '2,6']);
});

test('곰은 왼쪽 위 안쪽 칸, 갈매기는 오른쪽 아래 안쪽 칸에서 시작한다 (2장 갈매기 배치, 9장 37·40·42번)', () => {
  for (const [grid, gull] of [[LEVEL2, { col: 8, row: 5 }], [LEVEL3, { col: 9, row: 7 }]]) {
    const s = createState(grid, 0);
    assert.deepEqual(s.bear, { col: 1, row: 1 });
    assert.deepEqual(s.gull, gull);
    assert.equal(tileAt(grid, gull.col, gull.row), '.');
  }
});

test('맵 위치: 레벨 2는 위 32 px·좌우 16 px 여백, 레벨 3은 352×288을 채운다 (2장 맵 위치, 9장 37·42번)', () => {
  assert.deepEqual(mapOffset(10, 7), { x: 16, y: 32 });
  assert.deepEqual(mapOffset(11, 9), { x: 0, y: 0 });
});

test('레벨 2·3에서 갈매기는 첫 이동(300 ms)에 곰에게 가까워지고 벽·맵 밖으로 나가지 않는다 (2장 갈매기 이동, 9장 40번)', () => {
  for (const grid of [LEVEL2, LEVEL3]) {
    let s = createState(grid, 0);
    const dist = (g) => Math.abs(g.col - s.bear.col) + Math.abs(g.row - s.bear.row);
    const before = dist(s.gull);
    assert.equal(dist(advance(s, 300).gull), before - 1);
    for (let t = 0; t <= 30000; t += 100) {
      s = advance(s, t);
      const tile = tileAt(grid, s.gull.col, s.gull.row);
      assert.ok(tile !== null && tile !== '#', `t=${t}`);
    }
  }
});

test('레벨 2·3에서 곰이 갈매기 칸으로 걸어 들어가면 3 000 ms 기절한다 (2장 기절, 9장 41번)', () => {
  for (const [grid, gull] of [[LEVEL2, { col: 8, row: 5 }], [LEVEL3, { col: 9, row: 7 }]]) {
    const s = {
      ...createState(grid, 0),
      bear: { col: gull.col - 1, row: gull.row },
      nextGullMoveMs: Infinity,
    };
    const stunned = pressMove(s, 'ArrowRight', 1000);
    assert.equal(stunned.stunUntilMs, 4000);
    assert.deepEqual(pressMove(stunned, 'ArrowLeft', 2000).bear, stunned.bear);
    assert.equal(pressLight(stunned, 2000).lit.length, 0);
  }
});

// 레벨마다 등불을 차례로 켜는 걷기 경로. L 왼쪽 위 (1,1)에서 출발, R/L/U/D = 방향키, * = 스페이스.
// 각 칸은 5장 격자에서 손으로 따라가 확인했다.
const PATHS = [
  ['DR*', 'RRRR*', 'LLLDD*'],
  ['RRD*', 'RRRRR*', 'LDD*', 'LLLLL*'],
  ['RD*', 'RRRRRR*', 'LLDD*', 'LL*', 'LLDD*'],
];
const KEYS = { R: 'ArrowRight', L: 'ArrowLeft', U: 'ArrowUp', D: 'ArrowDown', '*': ' ' };

// 갈매기를 멈춘 채 (경로 테스트가 갈매기 경로에 기대지 않도록) 레벨 하나의 경로를 걷는다.
// lamps개만 켜고 마지막 등불은 clearAtMs에 켠다. 이동은 100 ms 간격이다.
function walkLevel(game, levelIndex, startMs, lamps, clearAtMs) {
  let g = { ...game, level: { ...game.level, nextGullMoveMs: Infinity } };
  let t = startMs;
  let lit = 0;
  for (const seg of PATHS[levelIndex]) {
    for (const ch of seg) {
      if (ch === '*') {
        lit += 1;
        const isLast = lit === lampTotal(g.level);
        g = pressKey(g, ' ', LEVELS, isLast ? clearAtMs : t);
        if (lit === lamps) return g;
      } else {
        t += 100;
        g = pressKey(g, KEYS[ch], LEVELS, t);
      }
    }
  }
  return g;
}

test('세 레벨을 걸어서 깨면 점수가 이어지고 레벨마다 시간이 60초로 돌아온다: 670 → 1360 → 2040 (2장 점수 표 계산 예, 9장 38·43·45번)', () => {
  let g = pressKey(createGame(), ' ', LEVELS, 0);
  g = walkLevel(g, 0, 0, 3, 22100); // 남은 37.9초 → 보너스 370
  assert.equal(g.screen, 'play');
  assert.equal(g.levelIndex, 1);
  assert.equal(g.level.score, 670);
  assert.equal(g.level.startMs, 22100);
  assert.equal(remainingSeconds(g.level, 22100), 60);
  assert.deepEqual(g.level.lit, []);
  assert.equal(litCount(g.level), 0);
  g = walkLevel(g, 1, 22100, 4, 52600); // 경과 30.5초, 남은 29.5초 → 290
  assert.equal(g.levelIndex, 2);
  assert.equal(g.level.score, 1360);
  assert.equal(remainingSeconds(g.level, 52600), 60);
  g = walkLevel(g, 2, 52600, 5, 94599); // 경과 41.999초, 남은 18.001초 → 180
  assert.equal(g.screen, 'ending');
  assert.equal(g.level.score, 2040);
});

test('점등마다 100점이 오른다: 레벨 2 첫 등불 670 → 770 (2장 점수 표, 9장 39번)', () => {
  let g = pressKey(createGame(), ' ', LEVELS, 0);
  g = walkLevel(g, 0, 0, 3, 22100);
  g = walkLevel(g, 1, 22100, 1, 22100);
  assert.equal(g.level.score, 770);
  assert.equal(litCount(g.level), 1);
});

// 마지막 등불 칸에 곰을 놓고 나머지 등불을 켠 상태 (이동 쿨다운 때문에 걸어서는 경계 시각을 만들 수 없다).
function atLastLamp(game) {
  const cells = lampCells(LEVELS[game.levelIndex]);
  const lit = cells.slice(0, -1);
  const score = game.level.score + lit.length * 100;
  return { ...game, level: { ...game.level, bear: cells[cells.length - 1], lit, score, nextGullMoveMs: Infinity } };
}

// 세 레벨 모두 레벨 시작 후 elapsedMs에 마지막 등불을 켠다. 엔딩 점수를 돌려준다.
function clearAllAt(elapsedMs) {
  let g = pressKey(createGame(), ' ', LEVELS, 0);
  let start = 0;
  for (let i = 0; i < 3; i++) {
    g = pressKey(atLastLamp(g), ' ', LEVELS, start + elapsedMs);
    start += elapsedMs;
  }
  assert.equal(g.screen, 'ending');
  return g.level.score;
}

test('점수 경계: 모두 경과 1 ms → 2970, 모두 정확히 60 000 ms → 1200, 모두 경과 0 ms → 3000 상한 (2장 점수 표 맵 사이 합산)', () => {
  assert.equal(clearAllAt(1), 2970);
  assert.equal(clearAllAt(60000), 1200);
  assert.equal(clearAllAt(0), 3000);
});

test('레벨 2·3 실패 점수는 이전 레벨 합 + 켠 등불 × 100: 870, 1660 (2장 점수 표 실패, 9장 46·47번)', () => {
  let g = pressKey(createGame(), ' ', LEVELS, 0);
  g = walkLevel(g, 0, 0, 3, 22100);
  const l2 = walkLevel(g, 1, 22100, 2, 22100);
  const fail2 = tick(l2, LEVELS, 22100 + 60001);
  assert.equal(fail2.screen, 'fail');
  assert.equal(fail2.level.score, 870);
  g = walkLevel(g, 1, 22100, 4, 52600);
  const l3 = walkLevel(g, 2, 52600, 3, 52600);
  const fail3 = tick(l3, LEVELS, 52600 + 60001);
  assert.equal(fail3.screen, 'fail');
  assert.equal(fail3.level.score, 1660);
});

test('레벨 2·3의 실패 화면과 엔딩에서 스페이스 → 타이틀 → 스페이스는 항상 레벨 1 처음 상태 (9장 48번)', () => {
  let g = pressKey(createGame(), ' ', LEVELS, 0);
  g = walkLevel(g, 0, 0, 3, 22100);
  const failed2 = tick(walkLevel(g, 1, 22100, 2, 22100), LEVELS, 100000);
  g = walkLevel(g, 1, 22100, 4, 52600);
  const failed3 = tick(walkLevel(g, 2, 52600, 3, 52600), LEVELS, 120000);
  const ending = walkLevel(g, 2, 52600, 5, 94599);
  for (const over of [failed2, failed3, ending]) {
    const title = pressKey(over, ' ', LEVELS, 200000);
    assert.deepEqual(title, createGame());
    const again = pressKey(title, ' ', LEVELS, 210000);
    assert.equal(again.screen, 'play');
    assert.equal(again.levelIndex, 0);
    assert.deepEqual(again.level, createState(LEVEL1, 210000, 0));
  }
});

test('레벨 전환 keydown은 한 번만 쓰인다: 전환 직후 레벨은 새 레벨 그대로 (3장 소비 규칙)', () => {
  const g = pressKey(atLastLamp(pressKey(createGame(), ' ', LEVELS, 0)), ' ', LEVELS, 5000);
  assert.equal(g.levelIndex, 1);
  assert.deepEqual(g.level, createState(LEVEL2, 5000, 300 + 550));
});
