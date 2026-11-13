// 최고 점수 저장 (GAME_DESIGN.md 7장). store는 localStorage 모양의 객체(getItem·setItem)를 인자로 받고,
// 접근이 막히거나 던져도 조용히 건너뛴다.
import { parseBest, nextBest } from './logic.js';

export const BEST_KEY = 'lighthouse-bear-best';

export function loadBest(store) {
  try {
    return parseBest(store.getItem(BEST_KEY));
  } catch {
    return 0;
  }
}

export function saveBest(store, n) {
  try {
    store.setItem(BEST_KEY, String(n));
  } catch {
    // 막히면 그 방문 동안은 메모리 값만 쓴다.
  }
}

// 엔딩에 들어가는 순간(이전 화면이 엔딩이 아니고 다음이 엔딩)에만 동작한다. 그 밖의 호출은 store를 건드리지 않는다.
export function recordBest(store, memoryBest, prevGame, nextGame) {
  if (prevGame.screen === 'ending' || nextGame.screen !== 'ending') return memoryBest;
  const base = Math.max(loadBest(store), memoryBest);
  const { best, save } = nextBest(base, nextGame.level.score);
  if (save) saveBest(store, best);
  return best;
}
