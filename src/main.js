// 화면 그리기와 입력 연결 (GAME_DESIGN.md 8장). requestAnimationFrame 루프가 performance.now() 하나로 상태를 진행하고 그린다.
// 게임 규칙은 logic.js, 효과음 재생은 sound.js, 최고 점수 저장은 storage.js에 있다.
import { LEVELS } from './levels.js';
import {
  PALETTE,
  SPRITE_BEAR,
  SPRITE_BEAR_STUNNED,
  SPRITE_FLOOR,
  SPRITE_LAMP_OFF,
  SPRITE_LAMP_ON,
  SPRITE_SEAGULL,
  SPRITE_TITLE_KEY,
  SPRITE_WALL,
  TITLE_NAME_SPRITES,
} from './sprites.js';
import {
  ENDING_LINE_1,
  ENDING_LINE_2,
  FAIL_LINE,
  RESTART_HINT,
  hudBest,
  hudLamps,
  hudScore,
  hudTime,
} from './strings.js';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  MAP_AREA_HEIGHT,
  TILE_SIZE,
  createGame,
  tick,
  pressKey,
  litCount,
  lampTotal,
  remainingSeconds,
  directionDelta,
  mapOffset,
  soundEvent,
  titleLayout,
  TITLE_NAME_DOT,
  TITLE_KEY_DOT,
} from './logic.js';
import { play, unlock } from './sound.js';
import { recordBest } from './storage.js';

const SPRITE_SCALE = TILE_SIZE / 16;
const HUD_FONT = '16px monospace';

const canvas = document.getElementById('game');
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;
const ctx = canvas.getContext('2d');

// localStorage 접근 자체가 던질 수 있다. 막히면 null이고 최고 점수는 이 방문 동안 메모리로만 유지한다 (7장).
function openStore() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const store = openStore();
let game = createGame();
let best = 0;

// 상태 변경의 유일한 입구: 효과음과 최고 점수 저장은 이전·다음 상태 한 쌍으로 여기서만 일어난다.
function commit(nextGame) {
  const event = soundEvent(game, nextGame);
  if (event !== null) play(event);
  best = recordBest(store, best, game, nextGame);
  game = nextGame;
}

function drawSprite(sprite, x, y, scale = SPRITE_SCALE) {
  for (let py = 0; py < sprite.length; py += 1) {
    for (let px = 0; px < sprite[py].length; px += 1) {
      const index = sprite[py][px];
      if (index === null) continue;
      ctx.fillStyle = PALETTE[index];
      ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
    }
  }
}

function drawHud(state, nowMs) {
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

function drawPlay(state, nowMs) {
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
  drawHud(state, nowMs);
}

// 3장 화면 흐름: 타이틀·엔딩·실패는 `배경`색 위의 가운데 정렬 글자다.
function drawText(text, y, colorIndex, font) {
  ctx.fillStyle = PALETTE[colorIndex];
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, SCREEN_WIDTH / 2, y);
}

function draw(nowMs) {
  ctx.fillStyle = PALETTE[0];
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  if (game.screen === 'title') {
    const layout = titleLayout();
    layout.name.forEach((p, i) => drawSprite(TITLE_NAME_SPRITES[i], p.x, p.y, TITLE_NAME_DOT));
    drawSprite(SPRITE_TITLE_KEY, layout.key.x, layout.key.y, TITLE_KEY_DOT);
  } else if (game.screen === 'play') {
    drawPlay(game.level, nowMs);
  } else if (game.screen === 'ending') {
    drawText(ENDING_LINE_1, 110, 7, HUD_FONT);
    drawText(ENDING_LINE_2, 140, 7, HUD_FONT);
    drawText(hudScore(game.level.score), 190, 7, HUD_FONT);
    // goal-5 임시 줄: 7장 글자 규칙(도트 글리프)과 y는 goal-6에서 바뀐다.
    drawText(hudBest(best), 210, 7, HUD_FONT);
    drawText(RESTART_HINT, 230, 7, HUD_FONT);
  } else {
    drawText(FAIL_LINE, 130, 7, HUD_FONT);
    drawText(hudScore(game.level.score), 175, 7, HUD_FONT);
    drawText(RESTART_HINT, 215, 7, HUD_FONT);
  }
}

function frame() {
  const now = performance.now();
  commit(tick(game, LEVELS, now));
  draw(now);
  requestAnimationFrame(frame);
}

document.addEventListener('keydown', (event) => {
  // 2장 "스페이스바 입력": 스크롤 방지는 event.repeat 확인보다 먼저.
  const isLight = event.key === ' ';
  if (isLight || directionDelta(event.key) !== null) event.preventDefault();
  if (event.repeat) return;
  unlock();
  commit(pressKey(game, event.key, LEVELS, performance.now()));
});

requestAnimationFrame(frame);
