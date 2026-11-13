// UI 문구는 이 파일 한 곳에 둔다. GAME_DESIGN.md 2장 "HUD" 행의 형식이다 (R2 임시, 7장 R3가 대체).
export const hudLamps = (lit, total) => `등불 ${lit}/${total}`;
export const hudScore = (score) => `점수 ${score}`;
export const hudTime = (seconds) => `남은 시간 ${seconds}`;
