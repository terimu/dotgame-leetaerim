// 순수 로직. canvas·DOM을 모른다. 숫자는 GAME_DESIGN.md 2장 값이다.

export const MOVE_COOLDOWN_MS = 100;
export const TILE_SIZE = 32;
export const SCREEN_WIDTH = 352;
export const SCREEN_HEIGHT = 320;
export const MAP_AREA_HEIGHT = 288;
export const LEVEL1_COLS = 9;
export const LEVEL1_ROWS = 7;

const DIRECTIONS = {
  ArrowUp: { dc: 0, dr: -1 },
  ArrowDown: { dc: 0, dr: 1 },
  ArrowLeft: { dc: -1, dr: 0 },
  ArrowRight: { dc: 1, dr: 0 },
};

export function createState(grid) {
  for (let row = 0; row < grid.length; row += 1) {
    const col = grid[row].indexOf('B');
    if (col !== -1) {
      return { grid, bear: { col, row } };
    }
  }
  throw new Error('grid has no B cell');
}

export function tileAt(grid, col, row) {
  if (row < 0 || row >= grid.length) return null;
  if (col < 0 || col >= grid[row].length) return null;
  return grid[row][col];
}

export function directionDelta(key) {
  return Object.hasOwn(DIRECTIONS, key) ? DIRECTIONS[key] : null;
}

export function moveBear(state, key) {
  const delta = directionDelta(key);
  if (delta === null) return state;
  const col = state.bear.col + delta.dc;
  const row = state.bear.row + delta.dr;
  const tile = tileAt(state.grid, col, row);
  if (tile === null || tile === '#') return state;
  return { grid: state.grid, bear: { col, row } };
}

export function canAcceptMove(lastMoveMs, nowMs) {
  return nowMs - lastMoveMs >= MOVE_COOLDOWN_MS;
}

// 2장 "맵 위치": 맵 표시 영역(SCREEN_WIDTH × MAP_AREA_HEIGHT) 안에서 가로·세로 가운데.
export function mapOffset(cols, rows) {
  return {
    x: (SCREEN_WIDTH - cols * TILE_SIZE) / 2,
    y: (MAP_AREA_HEIGHT - rows * TILE_SIZE) / 2,
  };
}
