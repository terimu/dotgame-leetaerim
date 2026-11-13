# Architect review pass 1 (stage_n 2, target stage-02-revision.md sha256 [REDACTED])

Architectural Status: WATCH
Code Review Recommendation: COMMENT

## Summary
구조는 건전하다: 순수 시각-인자 함수(advance/pressMove/pressLight/tick/pressKey), 단일 performance.now() 시간원, goal-2가 정한 레벨 상태를 goal-3이 game {screen, levelIndex, level}로 감싸는 확장, 5파일 수(goal-2: logic/main/sprites/strings/test, goal-3: logic/main/strings/levels/test)가 실제로 맞다. 사용자 확정 4건(100점/10점·초 내림/감점 없음/0 초기화, 일반형 순서+레벨1=엔딩, 타이틀+스페이스, 300 ms)은 0·1·2·3.1·3.1b·D10·D21~D25·ADR 전부에서 숫자 일치. blocker 없음. 아래 major 4건은 pass 2 전에 계획에서 닫을 것.

## Findings (id | target | action | severity | evidence)
- A-1 | goal-2 순수 함수 시그니처 / main.js 쿨다운 배선 (rev L354) | change | major | lastMoveMs를 main.js에 두면 goal-3 pressKey가 level 형태를 main에 노출시키고 쿨다운이 테스트 밖에 남는다(src/main.js 현 R1 패턴: canAcceptMove+bear 좌표 비교). 조치: lastMoveMs를 레벨 상태 필드로, pressMove가 canAcceptMove 적용(이동 성공 때만 갱신, 스페이스 무관), createState가 초기화.
- A-2 | goal-3 테스트 1번 (rev L385) | change | major | 'clearBonus 59 999 → 580'은 산술 오류. floor(59999/1000)=59 → 590. 기획서 점수 표에서 손으로 재도출하고 경계쌍(999→0,1000→10,1999→10,2000→20) 추가.
- A-3 | 2장 '갈매기 이동'·'난수' 행 / 테스트 7 (rev L89-92) | add | major | 난수→후보 인덱스 식과 mulberry32 갱신식이 문서에 없다. 구현마다 경로가 달라지고 '첫 3개 값'이 구현 되풀이가 된다. 조치: 정확한 식과 index=floor(value×후보수) 명문화, 기대값은 src와 독립된 node 한 줄로 산출했다고 기록.
- A-4 | goal-2 advance 명세·테스트 (rev L351-361) | add | major | 사건 시각 기준 stunUntilMs(프레임 시각 아님), 처리 상한 min(now, start+60000), nextGullMoveMs=직전 예약시각+300(기절 후 stunUntil+300)이 명시되지 않음. 테스트에 프레임 분할 불변식 없음. 조치: advance(advance(s,t1),t2) deep-equal advance(s,t2) 테스트, 기절·갈매기·만료가 섞인 catch-up 케이스, 스크립트 입력 두 번 재생 동일 상태.
- A-5 | createState 확장 (rev L454) | change | minor | R1 테스트가 createState(LEVEL1)만 호출 → nowMs undefined, nextGullMoveMs NaN으로 조용히 통과. nowMs 필수화+R1 테스트 호출 갱신.
- A-6 | settleClear/tick/pressKey | change | minor | settleClear 비멱등. 가산은 tick의 화면 전환 한 지점에서만, pressKey=tick∘입력∘tick 합성, 'ending에서 tick 두 번→점수 불변' 테스트 추가.
- A-7 | 2장 '스페이스바 입력' / main.js keydown | change | minor | preventDefault를 event.repeat 조기 return 앞에서 모든 화면의 스페이스·방향키에 적용, 스페이스는 event.key===' ' 명시.
- A-8 | R-3 탭 비활성 (rev L443) | add | minor | 복귀 시 catch-up으로 즉시 기절·실패 가능. 위험표에만 있고 2장 'R2 임시 구현 표기'·9장 확인 범위에 없음. 한 줄 추가.
- A-9 | 9장 확인 방법 | add | minor | goal-3부터 페이지를 열면 타이틀이라 R1 1~3·7번 문장은 스페이스 시작 뒤 플레이 화면에서 참. '1~7번은 스페이스바로 시작한 화면에서' 추가(문장 불변).
- A-10 | goal-3 5파일 상한 (rev L378) | change | minor | main.js 팽창 완화: 엔딩 문구를 strings.js에서 공백 위치 고정 2개 문자열로 두고 textAlign=center로 그린다(measureText 불필요). 테스트 9는 이은 값을 원문 리터럴과 비교. 9장 [ ]→[x]는 사람 확인 뒤 문서 커밋으로 파일 수 제외 명시.
- A-11 | D29 HUD 올림 vs 보너스 내림 | change | minor | 사용자 확정 '1초당 10점(내림)'과 화면 숫자 N이 어긋나 보일 수 있음. 에이전트 제안 표기와 29번 ±1초 허용 유지, 사람 승인 항목으로 계속 표시.

## 7개 집중 점검 결과
1. 상태·시간 모델: logic.js는 now/seed를 인자로 받아 순수 유지. rAF 루프는 R1 keydown-draw를 대체하나 R1 쿨다운·repeat·벽 규칙 불변, 8장(R3)이 대체 가능으로 표기. performance.now() 단일 시간원 유지(콜백 인자 대신 내부 호출). catch-up은 예약 시각 기반이라 프레임/탭 상태와 무관해야 하나 명세 보강 필요(A-4). 탭 복귀 결과는 수용된 위험(A-8).
2. 갈매기 결정성: 레벨 시작마다 시드 초기화 OK. 난수는 갈매기 이동 1회당 정확히 1개(후보 0개여도)로 입력 타이밍과 무관하게 소비 순서가 시간만의 함수; 곰 위치에 따라 후보가 달라질 뿐이다. '같은 타임스탬프 입력이면 같은 결과'는 A-3·A-4 조치 후 성립.
3. 동시 틱 판정: advance 후 입력, 만료는 >60000, 클리어 우선, 재점등 무시, 기절 중 타이머 진행이 단일 순서로 닫힌다. 점수 중복은 settleClear 경로만 정리하면 안전(A-6). 기절 시 갈매기 재배치로 같은 칸 재기절이 구조적으로 차단됨. 레벨1 좌표(등불 (2,2),(6,2),(3,4), 갈매기 (7,5), 후보 {(7,4),(6,5)}, 동률 (1,1))를 격자에서 직접 검산해 일치.
4. 화면 상태 기계: pressKey 한 번이 한 효과만 반환하는 구조라 소비 규칙이 구조적으로 보장됨. event.repeat가 모든 화면에서 무시되므로 스페이스 길게 누름은 전환 한 번뿐. goal-2 레벨 상태→goal-3 game 래핑은 재작업 없이 확장(goal-2 전제 인터페이스 명시). 단 쿨다운 위치(A-1).
5. 파일 수: goal-2 5개, goal-3 5개(logic/main/strings/levels/test) 정확. 신규 파일 strings.js는 goal-2 소속. 6회 규칙 위험은 main.js(goal-3 4화면+입력)와 logic.js 단일 파일 집중(5파일 상한이 monolith를 강제). 결합 지점 = 레벨 상태 형태, pressX의 non-playing no-op, createState(startScore).
6. R1 충돌: 스페이스 쿨다운 무관, L 칸=바닥 위 투명 등불로 R1 3번 불변, keydown-draw→rAF 교체를 R2 임시로 표기, moveBear {...state,bear}. 숫자는 상수 한 곳(LAMP_SCORE 등), 5장 격자 불변, 6장 hex 불변. 위반 없음. 잔여: A-5, A-9.
7. 사용자 확정 대조: 100/10(내림)/감점 없음/0 초기화/HUD, 일반형+레벨1 엔딩, 타이틀+스페이스+타이머 진입 시 시작, 300 ms가 모든 절에서 일치. 이전 초안의 갈매기 100 ms·엔터 재시작 잔재 없음(검색 확인). 예시 370/0/670/300/900 검산 OK; 유일한 불일치는 A-2(580).

## Tradeoff tensions
- 5파일 상한 vs logic.js 집중: 분리 파일(gull/screens)이 구조상 낫지만 상한에 걸림; 현재는 monolith 수용, R3 전 분리 후속 권장.
- HUD 올림(14번 60→0) vs 보너스 내림(사용자 확정): 14번 가독성 우선으로 올림 유지, 29번 근사 확인 비용.
- 탭 비활성 catch-up 결정성 vs UX: 일시정지는 기획서 외라 금지; 결정성 유지, 한계 문서화.
- 쿨다운 상태 내재화(A-1)는 R1 코드 변경량을 늘리나 goal-3 재작업을 제거.

## Adoptable fixes (pass 2 최소)
A-2 정정(필수), A-3 난수 식 명문화, A-4 advance 사건 규칙·불변식 테스트, A-1 lastMoveMs 상태화. 나머지 minor는 문서 한 줄씩. 범위 확장 없음.
