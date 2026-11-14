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
  SPRITE_WALL,
} from './sprites.js';
import {
  ENDING_LINE_1,
  ENDING_LINE_2,
  FAIL_LINE,
  RESTART_HINT,
  TITLE_NAME,
  TITLE_PROMPT,
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
  alignedX,
  cleanAlpha,
  TEXT_PX,
  TITLE_NAME_PX,
  TITLE_NAME_Y,
  TITLE_LINE_Y,
  HUD_TEXT_Y,
  HUD_LEFT_X,
  HUD_CENTER_X,
  HUD_RIGHT_X,
  ENDING_LINE_Y,
  FAIL_LINE_Y,
} from './logic.js';
import { play, unlock } from './sound.js';
import { recordBest } from './storage.js';

const SPRITE_SCALE = TILE_SIZE / 16;

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

// 7장 글자: 웹폰트 Galmuri9로 쓴 글자의 반투명 가장자리를 정리한 비트맵을 문자열마다 한 번 만들어 둔다.
const FONT_FAMILY = 'Galmuri9';
const TEXT_PAD = 2;
const textBitmaps = new Map();

function textBitmap(text, px, colorIndex) {
  const key = `${px}|${colorIndex}|${text}`;
  let bitmap = textBitmaps.get(key);
  if (bitmap === undefined) {
    const font = `${px}px ${FONT_FAMILY}`;
    ctx.font = font;
    const width = Math.ceil(ctx.measureText(text).width);
    const layer = document.createElement('canvas');
    layer.width = width + TEXT_PAD * 2;
    layer.height = px + TEXT_PAD * 2;
    const layerCtx = layer.getContext('2d');
    layerCtx.font = font;
    layerCtx.textBaseline = 'top';
    layerCtx.fillStyle = PALETTE[colorIndex];
    layerCtx.fillText(text, TEXT_PAD, TEXT_PAD);
    const image = layerCtx.getImageData(0, 0, layer.width, layer.height);
    layerCtx.putImageData(new ImageData(cleanAlpha(image.data), layer.width, layer.height), 0, 0);
    bitmap = { canvas: layer, width };
    textBitmaps.set(key, bitmap);
  }
  return bitmap;
}

function drawText(text, align, anchorX, y, px = TEXT_PX, colorIndex = 7) {
  const bitmap = textBitmap(text, px, colorIndex);
  const x = alignedX(align, anchorX, bitmap.width);
  ctx.drawImage(bitmap.canvas, x - TEXT_PAD, y - TEXT_PAD);
}

function drawHud(state, nowMs) {
  drawText(hudLamps(litCount(state), lampTotal(state)), 'left', HUD_LEFT_X, HUD_TEXT_Y);
  drawText(hudScore(state.score), 'center', HUD_CENTER_X, HUD_TEXT_Y);
  drawText(hudTime(remainingSeconds(state, nowMs)), 'right', HUD_RIGHT_X, HUD_TEXT_Y);
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

// 3장 화면 흐름: 타이틀·엔딩·실패의 글자 줄은 `배경`색 위의 가로 가운데 정렬 글자다 (7장 줄 y).
const SCREEN_CENTER_X = SCREEN_WIDTH / 2;

function draw(nowMs) {
  ctx.fillStyle = PALETTE[0];
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  if (game.screen === 'title') {
    drawText(TITLE_NAME, 'center', SCREEN_CENTER_X, TITLE_NAME_Y, TITLE_NAME_PX, 5);
    drawText(TITLE_PROMPT, 'center', SCREEN_CENTER_X, TITLE_LINE_Y);
  } else if (game.screen === 'play') {
    drawPlay(game.level, nowMs);
  } else if (game.screen === 'ending') {
    const lines = [ENDING_LINE_1, ENDING_LINE_2, hudScore(game.level.score), hudBest(best), RESTART_HINT];
    lines.forEach((text, i) => drawText(text, 'center', SCREEN_CENTER_X, ENDING_LINE_Y[i]));
  } else {
    const lines = [FAIL_LINE, hudScore(game.level.score), RESTART_HINT];
    lines.forEach((text, i) => drawText(text, 'center', SCREEN_CENTER_X, FAIL_LINE_Y[i]));
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

// 7장: 폰트를 불러온 뒤 첫 화면을 그린다. 불러오지 못하면 브라우저 기본 글꼴로 계속한다.
async function start() {
  try {
    await Promise.all([
      document.fonts.load(`${TEXT_PX}px ${FONT_FAMILY}`, hudLamps(0, 0)),
      document.fonts.load(`${TITLE_NAME_PX}px ${FONT_FAMILY}`, TITLE_NAME),
    ]);
  } catch {
    // 글꼴 없이 계속한다.
  }
  requestAnimationFrame(frame);
}

start();
