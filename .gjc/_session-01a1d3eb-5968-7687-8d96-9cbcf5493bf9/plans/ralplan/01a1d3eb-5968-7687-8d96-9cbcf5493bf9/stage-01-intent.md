# Pre-consensus intent reconciliation (R3)

## Evidence inspected
- 사용자 요청 원문, GAME_DESIGN.md v2 전체, 인터뷰 스펙 Map Grids·F4·F10, src/*.js, test/logic.test.js(65개 통과), Planner stage-01 (sha256 58eb2b22...).

## Resolved material decisions
- M1 타이틀 '스페이스바로 시작' = **A: 스페이스바 키캡 도트 그림만, 한글 글자 없음** (사용자 선택, R3 사용자 확정). TITLE_PROMPT 삭제, 9장 24번은 새 번호로 대체(문장 불변, 주석 표).

## Defaults retained as agent proposals (not material; shown in v3 diff for human review)
- O4 최종 화면 정리 = 엔딩·실패 줄 배치 고정 + `최고 점수 n` 줄, 새 기능 없음
- O5 최고 점수: 엔딩·실패 진입 시 1회, 실패 판 포함, 비정상값 0, 상한 3000, 키 하나
- O6 탭 비활성: 일시정지 만들지 않고 8장에 한계 명시, 10장 범위 밖
- O7 효과음 수치 전부 에이전트 제안, O10 monospace 16px 유지, O11 goal-5 한 커밋 내부 4단계

## Retained non-goals
- 일시정지, 음소거·볼륨, 신기록 연출, 레벨 번호 표시, 배경음악, 웹폰트·외부 파일, 9장 1~35번 문장 수정, 6장 hex 변경, 코드 수정(계획 단계).

material-open-items: none
(Planner revision 필요: M1=A는 Planner 기본값과 같아 변경 없음. 기본값 A로 작성된 stage-01이 그대로 유효.)
