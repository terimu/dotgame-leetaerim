// 기대값은 GAME_DESIGN.md v1의 숫자(2장)와 5장 레벨 1 격자에서 손으로 가져왔다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL1 } from '../src/levels.js';
import { PALETTE, SPRITE_BEAR, SPRITE_FLOOR, SPRITE_WALL } from '../src/sprites.js';
import {
  MOVE_COOLDOWN_MS,
  TILE_SIZE,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  LEVEL1_COLS,
  LEVEL1_ROWS,
  createState,
  tileAt,
  moveBear,
  canAcceptMove,
  mapOffset,
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
  assert.deepEqual(createState(LEVEL1).bear, { col: 1, row: 1 });
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
  for (const sprite of [SPRITE_BEAR, SPRITE_FLOOR, SPRITE_WALL]) {
    assert.equal(sprite.length, 16);
    for (const row of sprite) {
      assert.equal(row.length, 16);
      for (const v of row) assert.ok(v === null || (Number.isInteger(v) && v >= 0 && v <= 7));
    }
  }
});
