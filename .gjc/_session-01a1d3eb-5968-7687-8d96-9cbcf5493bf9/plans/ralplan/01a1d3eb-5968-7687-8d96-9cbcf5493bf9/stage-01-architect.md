# R3 Architect 검토 (review pass 1) — stage-01-planner sha256 58eb2b22…, intent M1=A 전제

## 결론
계획의 뼈대(design-v3 → goal-4 → goal-5, logic.js 순수 유지, 상태 비교 soundEvent, storage/sound 분리, goal-4 로직 무변경)는 코드와 대조해 성립한다. 블로커(CRITICAL/HIGH)는 없다. 다만 타이틀 한글 도트 규격, 47번 수용 기준의 무력함, localStorage 접근 예외 경로 3건(P2)과 문서 문장·테스트 설계 정리 8건(P3)을 design-v3 전에 반영해야 design-v4·fix 반복을 피한다.

## Architectural Status: WATCH
## 판정: COMMENT

## 직접 대조한 사실 (모두 일치)
- 맵 2 = 10×7, 곰 (1,1), 갈매기 (8,5)(거리 11 단독 최대), 등불 (3,2)(8,2)(2,4)(7,4), mapOffset (16,32) = ((352-320)/2, (288-224)/2). 맵 3 = 11×9, 갈매기 (9,7)(거리 14), 등불 (2,2)(8,2)(4,4)(6,4)(2,6), mapOffset (0,0). 격자 글자는 계획 §7과 일치.
- logic.js tick(클리어→createState(levels[N+1], nowMs, 점수+보너스), 마지막 레벨→ending), pressKey(점등 뒤 tick 한 번만)로 순서·합산·타이머 리셋·lastMoveMs=-Infinity·시드 초기화(2장 난수 행 '다음 레벨 시작마다')가 로직 변경 없이 성립. goal-4 logic.js 무변경 주장은 타당.
- LEVELS 3개로 깨지는 기존 테스트: 423(길이), 427·433·445·517·528 5곳(428, 434, 446-447, 518, 530, 533행 내부). Planner 목록이 정확하고 누락 없음. 16×16 테스트는 기존 7종만 순회하므로 수정 불필요. 단 A-11 참조.
- 3레벨 손계산: 670 → 1360 → 2040 전부 맞음(경과만 사용). 경로 이동 수·등불 순회도 격자에서 유효. 한 판 최대 1200+1800=3000 맞음(실제로는 경과≥1 ms라 2970).
- 타이틀 폭 246 = 4×42+3×6+18+42, x=53, 키 176 px x=88 정확. 7장 줄 배치 y 값은 352×320 안에서 겹침 없음.
- soundEvent 비교 방식: 점등(lit 증가)·기절 시작(null→값 또는 값 변경)·레벨 전환(levelIndex 증가)·ending·fail 모두 상태에서 도출 가능, 우선순위 ending>fail>clear>stun>lamp는 7장 표와 일치. 누락 사건 없음(탭 복귀 일괄 처리의 기절 시작·종료 무음은 의도된 한계).

## 발견 목록
| id | targetId | action | severity | evidence | 권고 |
|---|---|---|---|---|---|
| A-1 | §7 타이틀 배치·§6 4장·§10-4 (음절 14×14, 굵기 2점) | change | MEDIUM(P2) | stage-01-planner.md:164,191 | 안쪽 여백 1점이면 세로 12행. 받침 글자: 등 = ㄷ5+ㅡ2+ㅇ5 = 12행(간격 0), 곰 = ㄱ3+ㅗ4+ㅁ5 ≥ 12행(간격 0) → 굵기 2점이 성립하지 않아 뭉개짐. 점 찍기가 문서 단계라 61번(goal-5)에서야 드러나 design-v4 회귀. 음절을 16×16·3배(48 px)로: 폭 4×48+3×6+18+48=276 ≤ 328, x=38. 16×16이면 기존 스프라이트 테스트 순회에 합칠 수 있다. 굵기 2점 고정은 푼다(받침은 1점 허용). |
| A-2 | §4 47번, §5 keydown 소비 테스트 | change | MEDIUM(P2) | planner.md:60; GAME_DESIGN.md 확인 범위(타이틀 소비 항목); levels 격자 1행 `#B` | 모든 레벨 시작 칸은 B(등불 없음)라 소비 규칙이 깨져도 '점수 670, lit=[]'은 통과. 47번은 사람이 볼 수 없다. 테스트는 `deepEqual(결과.level, createState(levels[N+1], now, 이월점수))`로 전체 상태를 못박고, 47번은 확인 범위(단위 테스트가 덮음)로 옮기거나 문장을 '전환 직후 새 레벨이 초기 상태 그대로'로 낮춘다. |
| A-3 | §6 3장 '소비 규칙 단락 유지' | change | LOW(P3) | GAME_DESIGN.md:91 | 소비 규칙 단락이 레벨 전환을 다루지 않는데 47번이 근거로 인용. '레벨 N 클리어→N+1 전환도 한 입력에 한 번' 문장 추가, '마지막 등불은 엔딩까지만'은 '마지막 레벨에서'로 한정. |
| A-4 | §8 최고 점수·§3③ storage.js | change | MEDIUM(P2) | planner.md:19,178; src/main.js 최상위 | 저장소를 막은 브라우저는 `localStorage` 프로퍼티 접근에서 SecurityError. main.js가 `localStorage`를 인자로 넘기면 참조 평가가 storage.js try/catch 밖(모듈 최상위)이라 게임이 시작하지 않는다. 가짜 getItem/setItem 예외 테스트는 이 경로를 못 잡음. storage.js 안에서 try로 `globalThis.localStorage`에 접근(또는 접근자 함수 주입)하고 접근 예외 케이스를 테스트에 추가, 8장 문장도 접근자 평가를 덮게. |
| A-5 | §4 54번 | change | LOW(P3) | planner.md:67; index.html(아이콘 링크 없음) | 브라우저 자동 favicon.ico 요청이 Network에 보여 거짓 실패. 문장에 '자동 favicon 제외' 또는 `<link rel="icon" href="data:,">`를 8장에 명시. |
| A-6 | §4 62번, §3①, §7 M1 표, §11 | change | LOW(P3) | planner.md:30,75,165-172,198,212 | M1=A 확정 뒤 62번에 '(M1 확정 전 가정)', '미결 질문 M1 답 반영 확인', `material-open-items: 1`이 남아 문서 문장에 그대로 들어간다. 62번·3장 표기를 '(R3 사용자 확정)'으로, M1 옵션 표·미결 항목 삭제. |
| A-7 | §3③ 4단계, §5 타이틀 스프라이트 테스트 | change | LOW(P3) | planner.md:20,164; src/main.js:38-52 | 배치 상수를 main.js에 두면서 '배치 폭 246' 테스트를 계획했으나 main.js는 최상위 document 접근으로 node import 불가. drawSprite는 모듈 상수 scale(2) 고정이라 3배·4배용 scale 인자 필요한데 누락. 배치 상수(크기·간격·배율·좌표)를 sprites.js export로 옮기고 drawSprite(sprite,x,y,scale) 변경을 4단계에 명시. |
| A-8 | §5 3레벨 점수 테스트 | change | LOW(P3) | planner.md:102-110; test/logic.test.js:373(calm startMs=0), 다음 레벨 테스트 22100 | 'calm' 시작은 startMs=0이라 '타이틀 t=1000, 레벨 2 시작 23100' 서술과 어긋남(결과 2040은 같음). 시나리오 하나뿐이라 경과 60 000 ms(보너스 0)·1 ms 경계가 합산에 안 보임. 레벨 1은 `pressKey(createGame(),' ',LEVELS,1000)`로 시작 후 갈매기 예약만 패치, 기대값은 기획서 공식 1200+Σ10×floor((60000−경과_i)/1000)로 표 구동 2~3건(경과 1 ms ×3, 60 000 ms ×3 → 1500). |
| A-9 | §8 오디오·최고 점수, main.js 구조 | add | LOW(P3) | src/main.js:108-121 | frame tick과 keydown pressKey 두 곳에서 game이 바뀌는데 '호출 전후에 부른다'만 있어 소리·최고 점수 갱신이 복제·누락될 수 있다. `apply(next)` 한 함수(soundEvent 재생 + ending/fail 진입 시 최고 점수 갱신·저장 + game=next)로 명시하고 진입 술어는 soundEvent와 공유. |
| A-10 | §8 렌더링·O8 `image-rendering: pixelated` | remove(또는 명시) | LOW(P3) | planner.md:42,175,205; index.html | 사용자 요청·기획서에 없는 추가. DPR 2에서 canvas 전체가 최근접 확대되어 R2에서 확인된 monospace 글자 모양이 바뀐다(스프라이트에는 이득). 유지하면 8장에 글자 영향 한계를 쓰고 에이전트 제안으로 diff 검토 대상 표시, 아니면 제외. |
| A-11 | §5 삭제·교체, goal-5 3·4단계 | add | LOW(P3) | test/logic.test.js:20-21; src/main.js import | TITLE_NAME·TITLE_PROMPT를 지우고 단언만 삭제하면 import 링크 오류로 테스트 파일 전체 실패. test·main.js import 정리를 계획에 명시. |

## 계획이 놓치지 않은 점 (확인 완료)
- AGENTS·기획서 숫자 불변: 6장 hex 8개 불변, 9장 1~35번 문장 불변, 신규 숫자(3000, 0.25, 키 이름)는 전부 '에이전트 제안'이고 단일 위치 상수. 위반 없음.
- 기획서에 없는 기능 슬며들기: A-10 외에 없음. 신기록 연출·일시정지·음소거·레벨 번호 표시를 Out으로 명시했고 최고 점수에 실패 판을 포함하는 선택(O5)은 '에이전트 제안'으로 diff에서 사람이 본다(재고 불필요, 의미만 인지).
- keydown 소비·타이머 리셋·실패 점수 이월·새 판 레벨 1 복귀 로직은 코드가 이미 만족.

## 시간 이득·반대 의견(antithesis)과 트레이드오프
- design-v3 사람 게이트와 goal-4/5 게이트(3번 멈춤)는 사용자 요구('v3에서 10장 완성')와 AGENTS 6회 반복 금지에 맞는다. 반대 의견: goal-4는 데이터 두 개와 테스트뿐이라 v3 게이트 후 바로 연속 가능 — 시간은 절약되나 goal-4 사람 확인(36~46번)은 분량이 커서 게이트를 유지하는 쪽이 안전. 계획 유지.
- goal-5 파일 8개·한 커밋·내부 4단계: 대안(goal-5를 소리/저장과 타이틀로 나눔)은 사용자 goal 정의 변경이므로 불채택이 맞다. 대신 단계마다 사람이 node --test를 돌리는 비용만 감수.
- soundEvent(상태 비교) vs 이벤트 배열 반환: 상태 비교가 tick·pressKey 시그니처와 65개 테스트를 보존해 타당. 비용은 한 호출 안 복합 사건의 우선순위 손실뿐이며 A-9의 단일 apply로 호출 지점 일관성만 확보하면 충분.
- 최고 점수 저장 분리(storage.js)는 타당. 단 A-4의 접근자 평가 위치만 보강.

## 합성 제안
1) 타이틀 음절 16×16·3배 + 배치 상수 sprites.js export(A-1, A-7). 2) 47번을 확인 범위로 이동하고 전체 상태 deepEqual 테스트(A-2, A-3). 3) storage.js 내부 접근 try + main.js apply(next) 단일 깔때기(A-4, A-9). 4) 62번·M1 잔재 정리, 54번 favicon 예외, TITLE import 정리(A-6, A-5, A-11). 5) 3레벨 점수는 공식 기반 표 구동 테스트로 확장(A-8). pixelated는 명시 또는 제외 선택(A-10). 이상은 모두 design-v3 문서 지시서와 §5 테스트 계획의 문장 수준 수정이며 실행 순서·모듈 경계 자체는 바꾸지 않는다.
