# Deep Interview Spec: 등대지기 곰 (Lighthouse Bear)

## Metadata
- Interview ID: 01a1d28e-b1c7-764f-a63a-be86e32361fc
- Rounds: 20 scored (Round 0 topology + Round 1-20)
- Final Ambiguity Score: 5%
- Type: greenfield
- Generated: 2026-11-13T10:50+09:00
- Threshold: 0.05
- Threshold Source: default
- Initial Context Summarized: no
- Status: PASSED
- Auto-Answered Rounds: none
- Architect Failures: 0
- Lateral Reviews: none convened (no lateral panel recorded)
- Lateral Panel Failures: 0
- Refined Rounds: none
- Closure Overrides: none
- Restated Goal: 곰은 방향키로 한 칸씩 움직이며 3개 맵을 순서대로 지나고, 맵마다 60초 안에 꺼진 등불 칸에 서서 스페이스바로 모두 켜야 하고, 무작위로 다가오는 갈매기와 같은 칸에 들어가면 약 3초 기절 후 제자리에서 부활한다. 모든 맵을 클리어하면 엔딩 문구를 보여주고, 실패하면 1맵부터 다시 시작한다.
- Execution approval: not-approved

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.95 | 0.40 | 0.38 |
| Constraint Clarity | 0.95 | 0.30 | 0.285 |
| Success Criteria | 0.95 | 0.30 | 0.285 |
| **Total Clarity** | | | **0.95** |
| **Ambiguity** | | | **0.05** |

## Locked Intent
- artifact:single-screen-dot-game — 화면 하나짜리 도트 게임 (AGENTS.md 기준)
- surface:bear-keeper-control — 등대지기 곰 캐릭터 조작
- surface:unlit-lamps-goal — 꺼진 등불을 모두 켜는 목표
- integration:seagull-hazard — 갈매기 장애물
- constraint:night-deadline — 밤이 끝나기 전 제한시간

## Topology
| Component | Status | Description | Coverage / Deferral Note |
|-----------|--------|-------------|--------------------------|
| 곰 조작·갈매기 회피 | active | 곰 이동, 갈매기 접촉 시 기절·부활 | 방향키 이동, 같은 칸 기절 3초, 무작위 접근(고정 시드), 곰과 같은 속도 |
| 등불 점등 목표·맵 | active | 3개 맵 격자, 등불 점등 | 맵 1: 3개, 맵 2: 4개, 맵 3: 5개, 스페이스바 점등, 등불 칸 위에서만 점등 |
| 밤 제한시간 | active | 맵마다 60초 | 맵 클리어 후 다음 맵에서 타이머 리셋, 시간 초과 시 실패 |
| 승리·실패 흐름 | active | 엔딩과 재시작 | 전부 클리어 시 엔딩 문구 표시, 실패 시 1맵부터 재시작 |

## Established Facts
- F1 (Round 1): 갈매기 접촉 시 약 3초 기절 후 제자리에서 부활 (기절 시간은 Round 7에서 약 3초로 확정)
- F2 (Round 2): 승리 = 정해진 시간 안에 꺼진 등불을 모두 켬
- F3 (Round 3, 14): 제한시간 약 60초, 맵마다 적용, 다음 맵에서 리셋
- F4 (Round 4, 8, 10): 맵은 3개를 순서대로, 등불 개수는 맵 1: 3, 맵 2: 4, 맵 3: 5
- F5 (Round 5, 6): 등불은 곰이 등불 칸 위에 서서 스페이스바를 눌러 점등
- F6 (Round 9, 11, 16): 갈매기는 곰에게 고정 시드 무작위로 접근, 곰과 같은 속도(1칸)
- F7 (Round 13): 맵 격자 초안 3개 승인 (아래 Map Grids 참조)
- F8 (Round 15): 방향키로 1칸씩 이동, 스페이스바로 점등
- F9 (Round 18): 갈매기와 같은 칸에 들어가면 기절, 인접은 무시
- F10 (Round 19, 20): 전부 클리어 시 엔딩 화면, 실패 시 1맵부터 재시작. 엔딩 문구: "등대에 다시 불이 들어왔다. 곰은 아침까지 등불을 지킨다."

## Trigger Metadata
- Round 4: trigger D (scope expansion, 맵 여러 개) raised ambiguity 28% -> 34%. Resolved in Round 8 (3 maps, in order).
- No other triggers. No contradictions. No disputed facts.

## Lateral Review Panel
No panel convened. Ambiguity band transitions were recorded in the round records; the interview ran without a lateral panel.

## Goal
곰은 방향키로 한 칸씩 움직이며 3개 맵을 순서대로 지나고, 맵마다 60초 안에 꺼진 등불 칸에 서서 스페이스바로 모두 켜야 하고, 무작위로 다가오는 갈매기와 같은 칸에 들어가면 약 3초 기절 후 제자리에서 부활한다. 모든 맵을 클리어하면 엔딩 문구를 보여주고, 실패하면 1맵부터 다시 시작한다.

## Constraints
- 화면 하나짜리 도트 게임. HTML + Canvas 2D + ES modules, 의존성 0, 빌드 없음 (AGENTS.md)
- 색은 GAME_DESIGN.md 6장의 8색 hex만 사용
- 맵은 GAME_DESIGN.md 5장의 문자 격자를 src/levels.js에 그대로 복사 (AGENTS.md)
- 갈매기 무작위 접근은 고정 시드 (같은 입력이면 같은 결과, 테스트 가능)
- 기절 시간 약 3초, 맵 제한시간 약 60초 (숫자는 기획서에 그대로 기록)

## Non-Goals
- 모바일 터치, 반응형 레이아웃, 설정 화면, 난이도 선택, 리더보드, 계정, 서버, DB, 배경음악, 레벨 에디터, 랜덤 맵 (AGENTS.md 금지)
- 갈매기 인접 판정 (같은 칸만 기절)
- 기절 중 조작 규칙, 등불 점등 후 효과 등 인터뷰에서 다루지 않은 기능

## Acceptance Criteria
- [ ] 방향키 상하좌우로 곰이 한 칸씩 이동한다.
- [ ] 곰이 등불 칸 위에서 스페이스바를 누르면 그 등불이 켜진다. 다른 칸에서는 켜지지 않는다.
- [ ] 맵 1은 등불 3개, 맵 2는 4개, 맵 3은 5개로 순서대로 진행된다.
- [ ] 맵마다 60초 타이머가 시작되고, 다음 맵에서 리셋된다.
- [ ] 60초 안에 해당 맵의 등불을 모두 켜면 다음 맵으로 넘어간다.
- [ ] 60초 안에 못 켜면 실패하고 1맵부터 다시 시작한다.
- [ ] 갈매기는 곰에게 고정 시드 무작위로 접근하며, 곰과 같은 속도(1칸)로 움직인다.
- [ ] 갈매기와 곰이 같은 칸에 있으면 곰이 약 3초 기절하고, 기절 후 제자리에서 부활한다. 인접만으로는 기절하지 않는다.
- [ ] 3개 맵을 모두 클리어하면 "등대에 다시 불이 들어왔다. 곰은 아침까지 등불을 지킨다." 문구를 보여준다.
- [ ] 모든 색은 GAME_DESIGN.md 6장의 8색 hex다.
- [ ] 맵 격자는 아래 Map Grids와 글자 단위로 일치한다.
- [ ] 테스트 기대값은 이 명세의 숫자(60초, 3초, 3/4/5개, 9x7/10x7/11x9)에서 가져온다.

## Map Grids (approved in Round 13)
Legend: `#` 벽, `.` 바닥, `B` 곰 시작, `L` 등불 (글자 그대로 src/levels.js에 복사)

맵 1 (등불 3개, 9x7)
```
#########
#B......#
#.L...L.#
#.......#
#..L....#
#.......#
#########
```

맵 2 (등불 4개, 10x7)
```
##########
#B.......#
#..L....L#
#........#
#.L....L.#
#........#
##########
```

맵 3 (등불 5개, 11x9)
```
###########
#B........#
#.L.....L.#
#.........#
#...L.L...#
#.........#
#.L.......#
#.........#
###########
```

## Deferrals
- 없음. 모든 Round 0 구성요소는 active. 보류 항목 없음.

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| 갈매기 접촉은 게임 오버 | 실패 결과를 물음 | 기절 3초 후 제자리 부활 (Round 1) |
| 맵은 하나 | 맵 여러 개인지 질문 | 3개 맵 순서대로 (Round 8) |
| 제한시간은 전체 | 맵당인지 전체인지 질문 | 맵마다 60초, 다음 맵에서 리셋 (Round 14) |
| 갈매기 이동은 규칙적 | 접근 패턴 질문 | 고정 시드 무작위, 곰과 같은 속도 (Round 9, 11, 16) |
| 등불 점등은 자동 | 점등 방식 질문 | 등불 칸 위에서 스페이스바 (Round 5, 6) |

## Technical Context
Greenfield. 저장소에는 AGENTS.md만 있고 소스와 GAME_DESIGN.md는 없다. AGENTS.md는 GAME_DESIGN.md가 유일한 기준이라고 명시한다. 이 명세가 GAME_DESIGN.md의 내용 원천이 된다.

## Ontology (Key Entities)
| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| Bear | core | position, stunned | 방향키로 이동, 등불 칸에서 스페이스바로 점등, 갈매기와 같은 칸이면 기절 |
| Seagull | external obstacle | position, movement, seed, speed | 고정 시드 무작위 접근, 곰과 같은 속도, 같은 칸이면 곰 기절 3초 |
| Lamp | core | lit, tile | 곰이 등불 칸에서 스페이스바로 점등 |
| Night | time limit | duration_seconds=60, scope=per map | 맵마다 제한, 다음 맵에서 리셋 |
| Map | container | order, lamp_count, grid | 3개 맵, 순서대로 진행 |
| Ending | screen | text | 모든 맵 클리어 시 표시 |

## Ontology Convergence
| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|-------------|-----|---------|--------|----------------|
| 1 | 3 | 3 | - | - | - |
| 2 | 4 | 1 | 0 | 3 | 75% |
| 3 | 4 | 0 | 0 | 4 | 100% |
| 4-5 | 5 | 1 | 0 | 4 | 80% |
| 6-18 | 5-6 | 0-1 | 0 | 5 | 100% |
| 19-20 | 6 | 0 | 0 | 6 | 100% |

## Interview Transcript
Full Q&A is preserved in the interview state file (`.gjc/_session-01a1d28e-b1c7-764f-a63a-be86e32361fc/state/deep-interview-state.json`). Key answers:
- R0: 구조 확인 — 맞아요
- R1: 갈매기에 닿으면 — 일정 시간 기절 후 제자리에서 부활
- R2: 밤 제한시간 — 정해진 시간 내 모두 켜야 승리
- R3: 밤 길이 — 약 60초
- R4: 등불 개수 — 맵마다 다름
- R5: 점등 — 키를 누르면 켜짐
- R6: 등불 범위 — 곰이 등불이 있는 칸 위에 서 있어야 함
- R7: 기절 시간 — 약 3초
- R8: 맵 수 — 3개 정도 (순서대로)
- R9: 갈매기 이동 — 곰을 향해 무작위로 다가감
- R10: 등불 개수 — 맵마다 다름 (순서대로 증가)
- R11: 시드 — 고정 시드
- R12-13: 맵 격자 — 초안 제안 후 승인, 3개 맵 격자 승인
- R14: 제한시간 범위 — 맵마다 60초
- R15: 조작 — 방향키 1칸, 스페이스바 점등
- R16: 갈매기 속도 — 곰과 동일
- R18: 충돌 — 같은 칸이면 기절, 인접은 무시
- R19: 엔딩·재시작 — 엔딩 텍스트 표시, 처음(1맵)부터 재시작
- R20: 엔딩 문구 — 「등대에 다시 불이 들어왔다. 곰은 아침까지 등불을 지킨다.」 승인
- R21: 한 문장 목표 — 예, 이대로 확정
