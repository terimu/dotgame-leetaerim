# R3 Architect review pass 2 (delta) — stage-02-revision sha256 90a2bcc8…

## 결론
pass 1의 A-1~A-11이 수정본에서 모두 해소됐다. 블로커 없음. 새 지적은 P3 하나(아래 B-1)이며 진행을 막지 않는다.

## Architectural Status: CLEAR
## 판정: APPROVE

## 이전 지적 해소 확인
| id | 상태 | 근거 |
|---|---|---|
| A-1 | 해소 | 음절 16×16·배율 3(48 px). 폭 5×48+3×6+18=276 재계산 일치, x=(352−276)/2=38 일치, 좌우 여백 38≥12. 키측 176×48 x=88, 이름 높이 48(y 88~136) < 키 y=176이라 겹침 없음. 굵기 규칙 완화, design-v3에서 점 찍기·판독 게이트(§3 ①)로 순서 문제도 해소. 16×16이라 기존 순회 테스트에 합침 적절. |
| A-2, A-3 | 해소 | 옛 47번을 확인 범위로 이동, goal-4=36~48 재번호, 전환 테스트는 `deepEqual(결과.level, createState(LEVELS[1], 클리어_nowMs, 670))`(실제 tick이 createState(levels[N+1], nowMs, settled.score)를 만드는 것과 일치), 3장 소비 규칙 문장 보강. |
| A-4 | 해소 | `createStorage(getStorage=()=>globalThis.localStorage)`에서 접근자 평가·getItem·setItem 모두 try, main.js 최상위 localStorage 참조 금지, 접근자 예외 테스트 추가. |
| A-5 | 해소 | 55번 문장에 favicon 제외, 8장 외부 파일 항목에도 명시. |
| A-6 | 해소 | 확정 전 가정 문구·M1 옵션 표 제거, ADR 대안에만 잔존, `material-open-items: none`. |
| A-7 | 해소 | 배치 상수 sprites.js export, `drawSprite(sprite,x,y,scale)` 명시(현 main.js drawSprite는 SPRITE_SCALE 고정이라 필수였음). |
| A-8 | 부분 해소 | 표 구동 경계(2970·1200) 추가는 좋으나 B-1 참조. 2970=1200+3×590, 2040=670/1360/2040 체인 재계산 일치, 타이틀 t=1000 시작으로 서술 불일치도 정리됨. |
| A-9 | 해소 | §8 `apply(next)` 단일 깔때기(frame tick·keydown pressKey 모두), `enteredEndOrFail` 술어 soundEvent와 공유. |
| A-10 | 해소 | 유지+에이전트 제안 표기+글자 영향·되돌림·기각 대안 명시. |
| A-11 | 해소 | goal-5 3·4단계와 §5에 test·main.js TITLE_* import 정리 명시. |

## 새 지적 (수정이 새로 만든 문제)
- **B-1 | §5 goal-4 3레벨 점수 경계 표 구동 | change | LOW(P3)** | §5 경로·경계 항목 | "경과 1 ms 클리어 ×3 → 2970"은 이동 사이 ≥100 ms 쿨다운을 지킨 실제 경로(레벨 1만 9칸 이상)로는 만들 수 없다. 이 경계 케이스는 기존 `lastLamp()`처럼 곰 위치·lit를 직접 놓은 상태로 레벨마다 시작해야 한다(경과 60 000 ms는 걸어서도 가능하나 같은 패치 권장). 권고: §5에 '경계 표는 레벨 시작 직후 곰을 마지막 등불 칸에 놓고 lit을 채운 패치 상태로, 전환 경로는 pressKey로' 한 줄. novelty: pass 1 A-8이 경계 표를 권했고 수정본이 그 구현 경로를 정해 드러났다. 블로커 아님(실행 단계 테스트 작성 시 즉시 자연 해결).

## 합성
추가 수정 없이 design-v3 진행 가능. B-1은 실행자에게 메모로 넘기면 충분.
