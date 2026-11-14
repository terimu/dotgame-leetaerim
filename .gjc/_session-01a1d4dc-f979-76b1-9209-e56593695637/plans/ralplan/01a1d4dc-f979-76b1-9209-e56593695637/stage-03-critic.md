# R4 Critic 리뷰 (pass 2, stage_n=3) — 대상: stage-03-revision.md (sha256 1a8bd582…)

## Verdict
**OKAY** (blocker 0, major 0, 비차단 caveat 3). delta-only 리뷰: 직전 패스 CR2-01~12 전부 해소 확인, stage-03에서 새로 생긴 차단 문제 없음.

## Claim Checks (해소 확인, stage-03 본문 대조)
- CR2-01 해소: §3.1 5a·§3.2가 `recordBest(store, memoryBest, prevGame, nextGame) → memoryBest`를 storage.js에 두고 `prev.screen !== 'ending' && next.screen === 'ending'`에서만 동작, 그 밖(ending→ending 재호출·fail 진입·play·title)은 store 무접촉으로 고정. main.js `commit(nextGame)` 한 곳(소리→저장→game 갱신). §3.4 테스트 행 ①~⑤(진입 1회, 재호출 0회, fail 진입 get·set 모두 0회, 저장값이 더 크면 미저장, 접근 예외)가 main.js import 없이 가능. 시나리오 헬퍼 `atLastLamp(game)`(test 711행)·`walkLevel`(663행)·`lastLamp`이 실제로 존재함. §5 54행 한계칸도 정정됨(호출 0회=테스트, commit이 모든 전이에서 recordBest를 부르는지=main.js diff).
- CR2-02 해소: `soundEvent`가 상태 모양(`{screen, levelIndex, level:{stunUntilMs, lit, score}}`, 타이틀 level=null; logic.js 238·250~260행 대조 일치)을 명시하고 판정 순서 ①~⑥에서 `prev.screen !== 'play'`이면 null을 level 접근 전에 박았다. ending/fail은 `prev.screen === 'play'` 조건이라 엔딩→엔딩 재소리 없음. 레벨 전환 프레임은 ④에서 먼저 걸러 stun/lamp 비교가 새 레벨을 보지 않는다. 테스트 표가 타이틀 시작·기절·클리어+점등 동시·엔딩+점등을 덮는다.
- CR2-03 해소: sound.js가 `SOUND_TABLE`·`MASTER_GAIN=0.25`·`ATTACK_MS=5`·`RELEASE_MS=40` export, 테스트가 7장 표 행·문장 `마스터 게인 0.25, 음마다 5 ms 어택·40 ms 릴리즈`와 대조, 앵커 없음·불일치는 실패. 후보 7장 문장과 일치.
- CR2-04 해소: 5c가 sprites.js·strings.js·main.js·logic.js·test = 5파일(한도 ≤5). 5a=5, 5b=4, 5d=3, 6a=3, 6b=4도 유지.
- CR2-05 해소: 접미사 −1,056(48×22), 범례 +약 29, "합계만 직접 측정" 정정. 내가 실제 파일에서 22자 접미사 × 48줄을 이미 확인했고 " 2.8 나머지 역산"은 합계 기준이라 총량 판정에 영향 없음(후보 13,765자+개행 = 13,766, 슬랙 34 — pass 1에서 정규식으로 확인한 값 그대로).
- CR2-06~09 해소: §4.3 글리프 키 집합이 (a) strings.js 문구·(b) 7장 `/한글 35 — (.+?) — 와/` 측정 양쪽과 비교(후보 7장 문장에 이 앵커 형태가 실제로 있음), 빈 그림 금지·서로 다른 그림 행 추가·중복 `인덱스={7}` 행 삭제, 오독 쌍이 집합 안 글자(대↔다·지↔처·시↔아·은↔을·남↔밤·났↔왔·점↔침 — 모두 35자 안), 수동 확인 2번 문장 정정("시작 점수가 이미 네 자리일 수도 있음").
- CR2-10~12 해소: §3.5 "마지막 등불은 클리어음(레벨 3은 엔딩음)" 한 줄, OI 표가 8.1(사람 결정)·8.2(가정)로 분리, OI-3 추정치 명시("불가능" 단정 제거), `parseBest` 출처 열 "7장 + 해석(앞 0·음수)".
- ARCH-02(4장 인덱스 테스트 파싱 규칙) 내가 후보 4장 문장에 모의 대입: `/사용 인덱스: (.+?)\. 16칸/s`는 후보 문장의 `…다름). 16칸·16줄`에 정확히 맞고, 괄호 제거 후 `, ` split→탐욕 이름 정규식으로 `곰 기절`·`등불 꺼짐` 공백 이름 처리 가능. 타이틀 `/색 인덱스 ([0-9]),/`·`/인덱스 ([0-9](?:·[0-9])+),/`도 후보 타이틀 단락(`색 인덱스 5, … x=88, y=176, 인덱스 4·6·7, 글자 없음`)에 맞는다.
- 사용자 원문 지시 위반 없음(pass 1 결론 유지): 1~48번 문장 불변, 글리프 격자 문서 금지, 쓰지 않는 글자 금지(`작`·`기` 제외 명시), 폰트·이미지 금지, 팔레트 6장 불변, 문서 ≤ 13,800.
- 저장소 파일은 수정하지 않음(`git status`에 내 변경 없음, .gjc 상태 파일만). 테스트·린트·wc는 실행하지 않음.

## Architect counter-review (rule 5)
Architect(stage-03-architect.md, CLEAR/APPROVE)는 이전 ARCH-01~05의 해소만 확인하고 신규 지적 0건이다. 범위 확장·과잉 요구 없음 — 인플레이션 결함 없음, 수용. 직전 Architect 요구 중 ARCH-03(logic.js 경계 해석 기록)은 해석 한 단락이고 ARCH-05(fillText 테스트를 6b로)는 goal 경계와 일치하여 정당하다. ITERATE로 변환할 부풀림 없음.

## Missing Evidence
None (차단). 비차단 caveat(신규 지적이 아니라 이번에 눈에 띄어 기록만 남김, 이미 리뷰한 영역이므로 rule 2에 따라 차단 아님):
- CAV-1 (minor, §2.8 옵션 (나)): 범례 줄 `[x] = 사람 브라우저 확인 2026-11-13`은 49~58번 `[x]`에도 문자상 적용된다. (나)를 고르면 "범례는 1~48번 날짜만"이라는 설명과 문서 문구가 어긋난다. 오늘이 2026-11-13이라 당장은 맞지만, 확인이 다른 날이면 범례가 거짓이 된다. 사람이 OI-12를 결정할 때 이 점을 함께 보여줄 것(계획 변경 불필요).
- CAV-2 (minor, §3.2): 메모리 최고값의 초기값(0)과 `unlock()`이 `commit`의 첫 소리 재생보다 먼저 불리는 순서가 문장으로는 명시되지 않았다. 첫 keydown이 타이틀 시작(무음)이라 영향 없고 구현자가 자연스럽게 정할 수 있는 수준.
- CAV-3 (minor, 유지): 모든 글자 수는 리더 측정(13,766)이고 장별 증감은 근사. design-v4 후 리더 `wc -m` 재측정 필수(계획이 이미 명시).

## Approval Boundary
- 진행 가능: design-v4 문서 편집(후보와 diff 0, 리더 `wc -m` 13,766·1~48번 접미사 외 동일 diff) → 사람 diff 승인 → goal-5(5a→5d) → 사람 49~54번 확인 → goal-6(6a→6b) → 사람 55~58번 확인, 모두 stage-03 계획대로.
- 승인 범위 밖(사람 확인 대상): OI-2(엔딩만 저장), OI-3(키 글자 없음), OI-4(효과음 수치·릴리즈 해석), OI-6(10×10 가독성 fix-N/design 경계), OI-7, OI-10, OI-11(키 색 4·6·7), OI-12(확인 날짜 표기). 브라우저별 AudioContext 동작·favicon 요청 표시·글리프 가독성은 미검증.

## Summary
- Clarity: 높음. 상태 경로·파싱 정규식·호출 순서가 실제 소스와 일치.
- Verifiability: 49~58번 = 사람이 보는(50·51은 듣는) 문장 + 근거 장 번호, 대응표가 한계·테스트 분리. 저장 시점 테스트 가능해짐.
- Completeness: 파일 목록·테스트·수동 절차·위험·ADR 충분.
- Big Picture: 사용자 원문 지시 전부 준수, goal 경계 유지.
- Principle/Option Consistency: 일치.
- Alternatives Depth: 충분(수치 비교 유지).
- Risk/Verification Rigor: 위험 행에 soundEvent 오구현·마지막 등불 오판 추가, 양호.

## Required Changes
None.
