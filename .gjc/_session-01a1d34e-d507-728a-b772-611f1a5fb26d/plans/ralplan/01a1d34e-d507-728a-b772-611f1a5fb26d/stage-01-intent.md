# R2 intent reconciliation (stage intent, pass 1)

## Evidence inspected
- Planner stage-01 receipt: .gjc/_session-01a1d34e-d507-728a-b772-611f1a5fb26d/plans/ralplan/01a1d34e-d507-728a-b772-611f1a5fb26d/stage-01-planner.md (sha256 [REDACTED]), sections 2, 9
- GAME_DESIGN.md v1 (2장, 9장, "아직 안 정한 것"), deep-interview-dotgame-lighthouse.md (F1~F10, Non-Goals), AGENTS.md
- User request (R2 ralplan), and three user answers collected via ask in this pass

## Resolved material decisions (R2 사용자 확정; 문서 표기는 "R2 사용자 확정")
1. MOI-1 점수 표 = 해석 A (새 점수 규칙 표). 사용자 확정 값:
   - 등불 1개 켤 때마다 100점.
   - 맵 클리어 시 남은 시간 1초당 10점 보너스. 남은 시간은 초 단위 내림.
   - 기절해도 점수 감점 없음.
   - 실패하면 1맵부터 재시작하고 점수 0으로 초기화.
   - 점수는 HUD에 표시.
   - 점수 저장(localStorage)·최고 점수는 R3. R3의 최종 합계가 이 2장 표와 일치해야 하므로 표가 단일 기준.
   - 이 결정은 인터뷰 스펙 비목표("인터뷰에서 다루지 않은 기능")와 AGENTS.md "기획서에 없는 것은 만들지 않는다"를 소유자 결정으로 넘어선 것이다. v2 문서에 출처를 "R2 사용자 확정"으로 쓰고 10장 범위 밖 목록과 충돌하지 않음(점수는 10장에 없음; 리더보드는 계속 범위 밖).
2. MOI-2 R2 승리 범위 = 옵션 A: 맵 순서 규칙은 일반형(레벨 N 클리어 → N+1, 마지막 레벨 클리어 → 엔딩). R2 마지막 레벨 = 레벨 1이므로 레벨 1 클리어 시 엔딩 문구 표시.
3. 3장 화면 흐름에 타이틀 화면 추가 (사용자 신규 요구): 타이틀(게임 이름 + "스페이스바로 시작") → 플레이 → 엔딩(클리어) 또는 실패 → 스페이스바로 타이틀. 즉 재시작 입력은 스페이스바(Planner D15의 엔터 키 제안은 폐기). UI 문구는 src/strings.js 한 곳. 과제 제출물에 타이틀·플레이·클리어·실패 스크린샷 4장이 필요(사람이 실제 플레이 화면에서 찍음; 저장소 파일 아님; fixture 스크린샷은 증거 아님 규칙 유지).
4. MOI-3 갈매기 이동 간격 = 300 ms (사용자 선택). 2장 표에 적고 코드에서 바꾸지 않는다. 100 ms 위험 R-1은 해소.

## Retained non-goals (불변)
- 레벨 2·3 격자, 사운드, 점수 저장(localStorage)·최고 점수·리더보드, 10장 범위 밖 전부, 갈매기 인접 판정(같은 칸에서만 기절).
- 6장 팔레트 8색 hex 불변, 기존 색 재사용.
- R1 확정 결정(벽 막힘, 100 ms 쿨다운, keydown 1회=1칸, event.repeat 무시) 불변.
- 9장 1~7번 번호·문장 그대로, 8번부터 이어 붙임, 총 20항목 이상.

## Still-open (사용자 확인 불필요; 에이전트 제안으로 문서 diff에 노출하고 사람이 v2 검토 때 확인)
- MOI-4 실패 화면 문구, MOI-5 기절 시 갈매기 처리, 타이틀 화면에서 스페이스 입력이 같은 keydown으로 점등/재시작을 두 번 일으키지 않게 하는 규칙, 엔딩/실패 화면의 점수 표시 여부, 점수 표시 HUD 위치.

material-open-items: none (모든 사용자 결정 항목 확정). 아래 revision이 위 결정을 계획에 반영해야 한다.
