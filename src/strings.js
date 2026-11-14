// UI 문구는 이 파일 한 곳에 둔다. GAME_DESIGN.md 2장 "HUD"·"최고 점수" 행과 7장 엔딩·실패 줄.
export const hudLamps = (lit, total) => `등불 ${lit}/${total}`;
export const hudScore = (score) => `점수 ${score}`;
export const hudTime = (seconds) => `남은 시간 ${seconds}`;

export const hudBest = (score) => `최고 점수 ${score}`;

export const TITLE_NAME = '등대지기 곰';
export const TITLE_PROMPT = '스페이스바로 시작';
// 엔딩 문구 원문은 두 문자열을 공백 하나로 이은 것이다 (스펙 F10).
export const ENDING_LINE_1 = '등대에 다시 불이 들어왔다.';
export const ENDING_LINE_2 = '곰은 아침까지 등불을 지킨다.';
export const FAIL_LINE = '밤이 끝났다.';
export const RESTART_HINT = '스페이스바로 처음 화면';
