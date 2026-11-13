# Critic review, pass 1 (R1 plan, stage-02 revision sha256 7d17e152...)

## Verdict
**ITERATE** (4 blockers, all additive/wording fixes; no structural rejection. Process skeleton A, gates, 6-attempt rule are sound.)

## Claim Checks (verified against GAME_DESIGN.md v0, AGENTS.md, interview spec)
- Ch.2 table really contains: 방향키 한 번=한 칸 (스펙 R15); 한 칸 이동 시간 100 ms; 타일 32x32; 레벨1 9x7; 화면 352x320 (맵 영역 352x288 + HUD 32). Citations of items 1, 2, 4(first half) are correct.
- Level-1 grid in spec 'Map Grids (approved in Round 13)' is 9 cols x 7 rows; B at (1,1); row1 = '#B......#' so (7,1) is '.' and col 8 is '#'; (2,1) '.', (1,2) '.'; so every test expected value in the test table is correct and derives from grid/design numbers. Three wall tests = O1 reflection claim true.
- Ch.4/5/6/9 are empty in v0, so citations to them are valid only after design-v1; plan says so (design-v1 precedes code).
- Present and adequate: design-v1 human-approval stop before goal-1; browser-check-by-human completion (Principle 5, sec.7); 6-attempt rule with report contents (sec.7); 'fixture screenshots are not evidence' (sec.4 note); tests not completion; ch.9 list (sec.4) matches Resolved-decisions refs (O1->6, O3->4/5, O4->4, O7) and test-table note (1-3,7 human). Four user-resolved decisions are respected and not re-opened. No gull/lamp/timer/HUD/strings.js content leaks into R1; non-goals consistent with ch.10.
- Tests do not mirror code: expected values are hand-counted from grid/numbers; no moveBear re-implementation.

## Blocking
**B1. Criterion 5 is not human-visible as worded.** 'Roughly 0.1 s after a move, next input is ignored' cannot be observed by a person mashing keys (100 ms is at the edge of human tap cadence); sec.7 script 'press fast, move only at ~0.1 s intervals' is not a reliable check. Required: reword to something observable, e.g. 'press two different arrow keys at the same instant (e.g. -> and v together): bear moves exactly one tile, not two; after releasing and pressing again it moves again'. State explicitly that the exact 100 ms boundary is covered by the canAcceptMove 99/100 test and by goal-1 diff review that main.js passes the single doc-sourced constant (wiring is otherwise unverified by anything).
**B2. Criterion 7 is partly not human-visible.** 'colors used are within the 8 ch.6 colors' cannot be seen in a browser. Required: split. Visible sentence: 'bear, floor, wall and margin are visibly distinct colors' (ch.6, ch.4). Palette membership moves to the automated check + design-v1 diff review (hex in code == hex in ch.6, human compares text). Note hex-equality between sprites.js and the md is not tested by the plan; say it is reviewed by eye, not claimed as tested.
**B3. Ch.2 internal contradiction not addressed.** v0 row '한 칸 이동 시간 | 100 ms' says movement takes 100 ms; user-resolved decision is instant move + 100 ms cooldown. Plan only 'adds a decision row' and cites the old row for criteria 4/5 and the cooldown test ('근거: 2장 한 칸 이동 시간 100 ms'). Leaving both makes the doc self-contradictory (AGENTS: ambiguity => fix doc first). Required: design-v1 must rewrite that existing row (e.g. '이동 후 입력 쿨다운 | 100 ms | 에이전트 제안, R1 사용자 확정: 이동 자체는 즉시') and criteria 4/5 + test citations must cite the rewritten row/decision row by name, not 'design-v1 기록 결정' (see N1).
**B4. Human check script and final gate incomplete.** Sec.7 says 'ch.9 items 1~7 in order' but the listed steps cover only 3,4,4,5,6 (1,2,7 have no instruction; 4 appears twice; not in order). Also Handoff ends at 'goal-1 = executor' with no explicit step 'human browser check of ch.9 1~7 => only then done/commit'. Required: one numbered script item per criterion 1..7 (what to open, what to press, what to see), and a Handoff line: goal-1 executor stops and reports; done only after human confirms 1~7 in browser; failure => fix-N or replan per 6-attempt rule.

## Non-blocking (record; fix in same revision if cheap)
- N1. Items 4,5,6 cite 'design-v1 기록 ... 결정' without a chapter number. User constraint is each sentence cites a chapter; cite '2장 결정 행'.
- N2. Items 1,2 state px sizes 'shown by eye'. Give the how: canvas size via devtools element inspect (352x320, 100% zoom); tiles: count 9x7 and see squares.
- N3. Undocumented behavior that code would invent (doc-first): (a) is an 'L' tile walkable (moveBear blocks only '#'; plan only says L is drawn as floor); (b) 'B' tile rendered as floor after bear leaves; (c) does a wall bump start the cooldown; (d) initial lastMoveMs (first press must be accepted); (e) cooldown boundary inclusive (>=100). Add as design-v1 default lines (like O2/O5/O6) so the human sees them in the diff; add a test for (a) from the grid (e.g. (1,2) -> right -> (2,2) 'L' cell, expected moves) only if (a) is recorded.
- N4. Test gaps: no successful up/left move test (e.g. from (2,2): left->(1,2), up->(2,1)); no test that doc constants equal 100 / 32 / 352x320 / 9x7 (cooldown constant location unspecified: name the file). Not mirrors; cheap.
- N5. Risk not listed: `node --test test/` with ES-module .js and no package.json (forbidden) depends on Node module auto-detection (Node >= 22.7 / 20.19). Executor should check node version first; if ESM import fails, STOP and report under the 6-attempt rule, do not add package.json or rename to .mjs without doc/human. Also file:// blocks ES modules in Chrome, so server is effectively required for the human check; say so in script.
- N6. Alternatives: B is a straw man (violates AGENTS by definition); only A is truly viable given AGENTS.md. Acceptable, but label B/C as 'rule-violating, listed for completeness' rather than as viable options. Handoff order 'human approve -> critic review -> goal-1' should be critic before human approval.
- N7. No path stated if the human rejects design-v1 or dislikes colors after goal-1 (design-v2 / replan-N). One line.

## Approval Boundary
Nothing should proceed to executor design-v1 until B1-B4 are revised. After revision, a delta-only re-review should suffice; N-items do not gate approval. Still outside approval: any code, R2/R3 items, anything in ch.10.

## Summary
- Clarity: good; Verifiability: B1, B2, B4 gaps; Completeness: B3 plus N3; Big Picture: fits AGENTS doc-first flow; Principle/Option Consistency: ok (N6 straw-man B); Alternatives Depth: thin but constrained by AGENTS; Risk/Verification Rigor: 6-attempt and human gates present, ESM/node risk missing (N5).

## Required Changes
1. Rewrite criterion 5 into an observable check (two-key simultaneous press => one tile) and state what covers the exact 100 ms (test + diff review).
2. Split criterion 7 into visible distinctness vs automated/diff-review palette membership.
3. Make design-v1 rewrite the ch.2 '한 칸 이동 시간 100 ms' row to cooldown semantics; update citations in criteria 4/5 and test table.
4. Provide a full per-criterion 1..7 human script and an explicit post-goal-1 human browser gate in Handoff.
