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
export const CLEAR_BONUS_PER_SECOND = 10;

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

// ---- 화면 흐름과 점수 마무리 (GAME_DESIGN.md 2장 점수 표, 3장) ----

// 2장 점수 표 "클리어 시간 보너스": 남은 시간(ms)을 초 단위로 내림한 값 × 10점.
export function clearBonus(remainingMs) {
  if (remainingMs <= 0) return 0;
  return Math.floor(remainingMs / 1000) * CLEAR_BONUS_PER_SECOND;
}

// 2장 "맵 순서·승리·실패": 레벨 N 클리어 → N+1, 마지막 레벨 클리어 → 엔딩.
export function afterClear(levelIndex, levelCount) {
  return levelIndex + 1 < levelCount ? 'next' : 'ending';
}

export function createGame() {
  return { screen: 'title', levelIndex: 0, level: null };
}

// 클리어 순간의 남은 시간으로 보너스를 더한다. tick의 클리어 전환 한 지점에서만 호출한다.
function settleClear(level) {
  return { ...level, score: level.score + clearBonus(remainingMs(level, level.endMs)) };
}

// play 화면의 시간을 진행하고 클리어·실패에 따라 화면을 바꾼다. 다른 화면은 그대로.
export function tick(game, levels, nowMs) {
  if (game.screen !== 'play') return game;
  const level = advance(game.level, nowMs);
  if (level.status === 'failed') return { ...game, screen: 'fail', level };
  if (level.status === 'cleared') {
    const settled = settleClear(level);
    if (afterClear(game.levelIndex, levels.length) === 'ending') {
      return { ...game, screen: 'ending', level: settled };
    }
    const levelIndex = game.levelIndex + 1;
    return { screen: 'play', levelIndex, level: createState(levels[levelIndex], nowMs, settled.score) };
  }
  return { ...game, level };
}

// 3장 "화면 전환 keydown 소비 규칙": 한 keydown은 하나의 효과만 낸다. 먼저 시간을 진행해 화면이 바뀌었으면 입력은 버린다.
export function pressKey(game, key, levels, nowMs) {
  const g = tick(game, levels, nowMs);
  if (g.screen !== game.screen || g.levelIndex !== game.levelIndex) return g;
  if (g.screen === 'title') {
    if (key !== ' ') return g;
    return { screen: 'play', levelIndex: 0, level: createState(levels[0], nowMs, 0) };
  }
  if (g.screen === 'play') {
    if (key === ' ') return tick({ ...g, level: pressLight(g.level, nowMs) }, levels, nowMs);
    if (directionDelta(key) === null) return g;
    return tick({ ...g, level: pressMove(g.level, key, nowMs) }, levels, nowMs);
  }
  return key === ' ' ? createGame() : g;
}

// ---- R4 (goal-5): 최고 점수·효과음·타이틀 배치 (GAME_DESIGN.md 2장 최고 점수, 4장 타이틀, 7장) ----

export const BEST_SCORE_MAX = 3000;

// 7장 최고 점수: 값은 0~3000 정수 십진 문자열. 없거나 정수가 아니거나 3000 초과면 0.
export function parseBest(raw) {
  if (typeof raw !== 'string' || !/^(0|[1-9][0-9]*)$/.test(raw)) return 0;
  const n = Number(raw);
  return n <= BEST_SCORE_MAX ? n : 0;
}

// 7장 최고 점수: 판 점수가 저장값보다 클 때만 저장한다.
export function nextBest(stored, score) {
  return { best: Math.max(stored, score), save: score > stored };
}

// 7장 효과음: 이전·다음 상태 한 쌍에서 사건 하나를 고른다. 순위 낮은 숫자 우선.
export function soundEvent(prev, next) {
  if (prev.screen !== 'play') return null;
  if (next.screen === 'ending') return 'ending';
  if (next.screen === 'fail') return 'fail';
  if (next.screen !== 'play') return null;
  if (next.levelIndex > prev.levelIndex) return 'clear';
  if (next.level.stunUntilMs !== null && next.level.stunUntilMs !== prev.level.stunUntilMs) return 'stun';
  if (next.level.lit.length > prev.level.lit.length) return 'lamp';
  return null;
}

// ---- R4 (goal-6): 웹폰트 글자 배치 (GAME_DESIGN.md 4장 타이틀 이름, 7장 글자 규칙) ----
export const TEXT_PX = 20;
export const TITLE_NAME_PX = 40;
export const TITLE_NAME_Y = 88;
export const TITLE_LINE_Y = 176;
export const HUD_TEXT_Y = 295;
export const HUD_LEFT_X = 6;
export const HUD_CENTER_X = 176;
export const HUD_RIGHT_X = 348;
export const ENDING_LINE_Y = [80, 110, 160, 190, 240];
export const FAIL_LINE_Y = [100, 150, 200];
export const ALPHA_CUTOFF = 128;

// 글자 왼쪽 x: align이 left면 anchor가 왼쪽 끝, center면 가운데, right면 오른쪽 칸 끝.
export function alignedX(align, anchorX, widthPx) {
  if (align === 'left') return anchorX;
  if (align === 'center') return anchorX - widthPx / 2;
  if (align === 'right') return anchorX - widthPx;
  throw new RangeError(`unknown align ${align}`);
}

// 7장: 캔버스에 쓴 글자의 반투명 가장자리는 알파 절반 이상이면 팔레트 색 그대로 불투명, 아니면 투명으로 정리한다.
// 반투명 픽셀의 RGB는 곱해진 알파 때문에 부정확하므로 읽은 RGB를 쓰지 않고 글자 색 hex를 쓴다. RGBA 배열을 새로 돌려준다.
export function cleanAlpha(rgba, hex) {
  const color = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const out = new Uint8ClampedArray(rgba.length);
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < ALPHA_CUTOFF) continue;
    out[i] = color[0];
    out[i + 1] = color[1];
    out[i + 2] = color[2];
    out[i + 3] = 255;
  }
  return out;
}
