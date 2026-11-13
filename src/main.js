// R1 임시 구현 (GAME_DESIGN.md 2장). 틱 루프·입력·렌더링 방식은 8장(R3)이 정한다.
import { LEVEL1 } from './levels.js';
import { PALETTE, SPRITE_BEAR, SPRITE_FLOOR, SPRITE_WALL } from './sprites.js';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  TILE_SIZE,
  createState,
  moveBear,
  canAcceptMove,
  mapOffset,
} from './logic.js';

const SPRITE_SCALE = TILE_SIZE / 16;

const canvas = document.getElementById('game');
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;
const ctx = canvas.getContext('2d');

let state = createState(LEVEL1);
let lastMoveMs = -Infinity;

function drawSprite(sprite, x, y) {
  for (let py = 0; py < sprite.length; py += 1) {
    for (let px = 0; px < sprite[py].length; px += 1) {
      const index = sprite[py][px];
      if (index === null) continue;
      ctx.fillStyle = PALETTE[index];
      ctx.fillRect(x + px * SPRITE_SCALE, y + py * SPRITE_SCALE, SPRITE_SCALE, SPRITE_SCALE);
    }
  }
}

function draw() {
  ctx.fillStyle = PALETTE[0];
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  const grid = state.grid;
  const offset = mapOffset(grid[0].length, grid.length);
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      const sprite = grid[row][col] === '#' ? SPRITE_WALL : SPRITE_FLOOR;
      drawSprite(sprite, offset.x + col * TILE_SIZE, offset.y + row * TILE_SIZE);
    }
  }
  drawSprite(
    SPRITE_BEAR,
    offset.x + state.bear.col * TILE_SIZE,
    offset.y + state.bear.row * TILE_SIZE,
  );
}

document.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const now = performance.now();
  if (!canAcceptMove(lastMoveMs, now)) return;
  const next = moveBear(state, event.key);
  if (next.bear.col !== state.bear.col || next.bear.row !== state.bear.row) {
    state = next;
    lastMoveMs = now;
  }
  draw();
});

draw();
