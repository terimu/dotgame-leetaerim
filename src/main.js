// R2 임시 구현 (GAME_DESIGN.md 2장). 틱 루프·입력·렌더링 방식은 8장(R3)이 정한다.
// requestAnimationFrame 루프가 performance.now() 하나로 상태를 진행하고 그린다. 게임 규칙은 logic.js에 있다.
import { LEVEL1 } from './levels.js';
import {
  PALETTE,
  SPRITE_BEAR,
  SPRITE_BEAR_STUNNED,
  SPRITE_FLOOR,
  SPRITE_LAMP_OFF,
  SPRITE_LAMP_ON,
  SPRITE_SEAGULL,
  SPRITE_WALL,
} from './sprites.js';
import { hudLamps, hudScore, hudTime } from './strings.js';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  MAP_AREA_HEIGHT,
  TILE_SIZE,
  createState,
  advance,
  pressMove,
  pressLight,
  litCount,
  lampTotal,
  remainingSeconds,
  directionDelta,
  mapOffset,
} from './logic.js';

const SPRITE_SCALE = TILE_SIZE / 16;
const HUD_FONT = '16px monospace';

const canvas = document.getElementById('game');
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;
const ctx = canvas.getContext('2d');

let state = createState(LEVEL1, performance.now());

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

function drawHud(nowMs) {
  ctx.fillStyle = PALETTE[7];
  ctx.font = HUD_FONT;
  ctx.textBaseline = 'middle';
  const y = MAP_AREA_HEIGHT + (SCREEN_HEIGHT - MAP_AREA_HEIGHT) / 2;
  ctx.textAlign = 'left';
  ctx.fillText(hudLamps(litCount(state), lampTotal(state)), 8, y);
  ctx.textAlign = 'center';
  ctx.fillText(hudScore(state.score), SCREEN_WIDTH / 2, y);
  ctx.textAlign = 'right';
  ctx.fillText(hudTime(remainingSeconds(state, nowMs)), SCREEN_WIDTH - 8, y);
}

function draw(nowMs) {
  ctx.fillStyle = PALETTE[0];
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  const grid = state.grid;
  const offset = mapOffset(grid[0].length, grid.length);
  const at = (cell) => ({ x: offset.x + cell.col * TILE_SIZE, y: offset.y + cell.row * TILE_SIZE });
  // 그리는 순서 (4장): 바닥/벽 → 등불 → 갈매기 → 곰.
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      const p = at({ col, row });
      drawSprite(grid[row][col] === '#' ? SPRITE_WALL : SPRITE_FLOOR, p.x, p.y);
      if (grid[row][col] === 'L') {
        const isLit = state.lit.some((cell) => cell.col === col && cell.row === row);
        drawSprite(isLit ? SPRITE_LAMP_ON : SPRITE_LAMP_OFF, p.x, p.y);
      }
    }
  }
  const gull = at(state.gull);
  drawSprite(SPRITE_SEAGULL, gull.x, gull.y);
  const bear = at(state.bear);
  drawSprite(state.stunUntilMs === null ? SPRITE_BEAR : SPRITE_BEAR_STUNNED, bear.x, bear.y);
  drawHud(nowMs);
}

function frame() {
  const now = performance.now();
  state = advance(state, now);
  draw(now);
  requestAnimationFrame(frame);
}

document.addEventListener('keydown', (event) => {
  // 2장 "스페이스바 입력": 스크롤 방지는 event.repeat 확인보다 먼저.
  const isLight = event.key === ' ';
  if (isLight || directionDelta(event.key) !== null) event.preventDefault();
  if (event.repeat) return;
  const now = performance.now();
  if (isLight) state = pressLight(state, now);
  else state = pressMove(state, event.key, now);
});

requestAnimationFrame(frame);
