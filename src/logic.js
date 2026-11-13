// 순수 로직. canvas·DOM을 모른다. 시각과 난수는 인자로 받는다.
// 숫자는 GAME_DESIGN.md 2장 값이다. 다른 파일은 이 상수를 가져다 쓴다.

export const MOVE_COOLDOWN_MS = 100;
export const TILE_SIZE = 32;
export const SCREEN_WIDTH = 352;
export const SCREEN_HEIGHT = 320;
export const MAP_AREA_HEIGHT = 288;
export const LEVEL1_COLS = 9;
export const LEVEL1_ROWS = 7;
export const LEVEL_TIME_MS = 60000;
export const STUN_MS = 3000;
export const SEAGULL_MOVE_INTERVAL_MS = 300;
export const RNG_SEED = 20261113;
export const LAMP_SCORE = 100;

const DIRECTIONS = {
  ArrowUp: { dc: 0, dr: -1 },
  ArrowDown: { dc: 0, dr: 1 },
  ArrowLeft: { dc: -1, dr: 0 },
  ArrowRight: { dc: 1, dr: 0 },
};

// 2장 "갈매기 이동": 후보 순서 위·아래·왼쪽·오른쪽.
const NEIGHBORS = [DIRECTIONS.ArrowUp, DIRECTIONS.ArrowDown, DIRECTIONS.ArrowLeft, DIRECTIONS.ArrowRight];

export function tileAt(grid, col, row) {
  if (row < 0 || row >= grid.length) return null;
  if (col < 0 || col >= grid[row].length) return null;
  return grid[row][col];
}

export function directionDelta(key) {
  return Object.hasOwn(DIRECTIONS, key) ? DIRECTIONS[key] : null;
}

function distance(a, b) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function sameCell(a, b) {
  return a.col === b.col && a.row === b.row;
}

export function lampCells(grid) {
  const cells = [];
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] === 'L') cells.push({ col, row });
    }
  }
  return cells;
}

// 2장 "갈매기 배치": from에서 맨해튼 거리가 가장 먼 바닥 칸. 같으면 위쪽 행, 그다음 왼쪽 열.
export function farthestFloorCell(grid, from) {
  let best = null;
  let bestDistance = -1;
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (grid[row][col] === '#') continue;
      const d = distance({ col, row }, from);
      if (d > bestDistance) {
        best = { col, row };
        bestDistance = d;
      }
    }
  }
  return best;
}

// 2장 "난수": 표준 mulberry32. 상태는 32비트 정수 하나, 값은 부호 없는 32비트 정수 / 2^32.
export function nextRandom(rng) {
  const next = (rng + 0x6d2b79f5) | 0;
  let t = Math.imul(next ^ (next >>> 15), 1 | next);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, rng: next };
}

export function createState(grid, nowMs, startScore = 0, seed = RNG_SEED) {
  if (typeof nowMs !== 'number' || Number.isNaN(nowMs)) {
    throw new TypeError('createState needs nowMs');
  }
  for (let row = 0; row < grid.length; row += 1) {
    const col = grid[row].indexOf('B');
    if (col !== -1) {
      const bear = { col, row };
      return {
        grid,
        bear,
        gull: farthestFloorCell(grid, bear),
        lit: [],
        score: startScore,
        status: 'playing',
        startMs: nowMs,
        endMs: null,
        lastMoveMs: -Infinity,
        nextGullMoveMs: nowMs + SEAGULL_MOVE_INTERVAL_MS,
        stunUntilMs: null,
        rng: seed,
      };
    }
  }
  throw new Error('grid has no B cell');
}

export function moveBear(state, key) {
  const delta = directionDelta(key);
  if (delta === null) return state;
  const col = state.bear.col + delta.dc;
  const row = state.bear.row + delta.dr;
  const tile = tileAt(state.grid, col, row);
  if (tile === null || tile === '#') return state;
  return { ...state, bear: { col, row } };
}

export function canAcceptMove(lastMoveMs, nowMs) {
  return nowMs - lastMoveMs >= MOVE_COOLDOWN_MS;
}

export function gullCandidates(grid, gull, bear) {
  const current = distance(gull, bear);
  const cells = [];
  for (const delta of NEIGHBORS) {
    const cell = { col: gull.col + delta.dc, row: gull.row + delta.dr };
    const tile = tileAt(grid, cell.col, cell.row);
    if (tile === null || tile === '#') continue;
    if (distance(cell, bear) < current) cells.push(cell);
  }
  return cells;
}

// 이동 한 번에 난수를 정확히 한 번 쓴다. 후보가 없어도 쓰고 제자리에 둔다.
export function stepGull(state) {
  const candidates = gullCandidates(state.grid, state.gull, state.bear);
  const { value, rng } = nextRandom(state.rng);
  if (candidates.length === 0) return { ...state, rng };
  return { ...state, rng, gull: candidates[Math.floor(value * candidates.length)] };
}

// 2장 "기절"·"기절 시 갈매기": 기절 사건 시각 t에서 곰은 3 000 ms 기절하고 갈매기는 곰에게서 가장 먼 칸으로 옮겨진다.
function startStun(state, eventMs) {
  const stunUntilMs = eventMs + STUN_MS;
  return {
    ...state,
    stunUntilMs,
    gull: farthestFloorCell(state.grid, state.bear),
    nextGullMoveMs: stunUntilMs + SEAGULL_MOVE_INTERVAL_MS,
  };
}

// 2장 "시간 진행 규칙": 사건을 사건 시각 순서로 처리한다. 처리 상한은 min(nowMs, startMs + 60 000).
export function advance(state, nowMs) {
  if (state.status !== 'playing') return state;
  const limit = Math.min(nowMs, state.startMs + LEVEL_TIME_MS);
  let current = state;
  for (;;) {
    if (current.stunUntilMs !== null) {
      if (current.stunUntilMs > limit) break;
      current = { ...current, stunUntilMs: null };
      continue;
    }
    const eventMs = current.nextGullMoveMs;
    if (eventMs > limit) break;
    current = { ...stepGull(current), nextGullMoveMs: eventMs + SEAGULL_MOVE_INTERVAL_MS };
    if (sameCell(current.gull, current.bear)) current = startStun(current, eventMs);
  }
  if (nowMs > state.startMs + LEVEL_TIME_MS) {
    return { ...current, status: 'failed', endMs: state.startMs + LEVEL_TIME_MS };
  }
  return current;
}

export function pressMove(state, key, nowMs) {
  const s = advance(state, nowMs);
  if (s.status !== 'playing' || s.stunUntilMs !== null) return s;
  if (directionDelta(key) === null) return s;
  if (!canAcceptMove(s.lastMoveMs, nowMs)) return s;
  const moved = moveBear(s, key);
  if (sameCell(moved.bear, s.bear)) return s;
  const next = { ...moved, lastMoveMs: nowMs };
  return sameCell(next.bear, next.gull) ? startStun(next, nowMs) : next;
}

export function pressLight(state, nowMs) {
  const s = advance(state, nowMs);
  if (s.status !== 'playing' || s.stunUntilMs !== null) return s;
  if (tileAt(s.grid, s.bear.col, s.bear.row) !== 'L') return s;
  if (s.lit.some((cell) => sameCell(cell, s.bear))) return s;
  const lit = [...s.lit, { ...s.bear }];
  const scored = { ...s, lit, score: s.score + LAMP_SCORE };
  if (lit.length === lampCells(s.grid).length) {
    return { ...scored, status: 'cleared', endMs: nowMs };
  }
  return scored;
}

export function litCount(state) {
  return state.lit.length;
}

export function lampTotal(state) {
  return lampCells(state.grid).length;
}

export function remainingMs(state, nowMs) {
  const at = state.status === 'playing' ? nowMs : state.endMs;
  return Math.min(LEVEL_TIME_MS, Math.max(0, state.startMs + LEVEL_TIME_MS - at));
}

// 2장 "HUD": 초 단위 올림. 경과 0 ms = 60, 59 001 ms = 1, 60 000 ms 이상 = 0.
export function remainingSeconds(state, nowMs) {
  return Math.ceil(remainingMs(state, nowMs) / 1000);
}

// 2장 "맵 위치": 맵 표시 영역(SCREEN_WIDTH × MAP_AREA_HEIGHT) 안에서 가로·세로 가운데.
export function mapOffset(cols, rows) {
  return {
    x: (SCREEN_WIDTH - cols * TILE_SIZE) / 2,
    y: (MAP_AREA_HEIGHT - rows * TILE_SIZE) / 2,
  };
}
