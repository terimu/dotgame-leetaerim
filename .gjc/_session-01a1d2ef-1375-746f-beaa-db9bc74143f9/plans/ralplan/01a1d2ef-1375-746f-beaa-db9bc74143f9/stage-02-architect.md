# Architect review pass 1 - R1 plan (stage-02 revision)

## Summary
Plan is sound: doc-first (design-v1 then goal-1), scope held to bear one-tile move, logic.js pure, levels and sprites as data, strings.js not created. No blockers. Several non-blocking gaps to close inside design-v1 text (no new scope).

## Claims verified
- Grid in interview spec Map Grids round 13: map 1 row 1 is #B......#, so B=(1,1) and (7,1)+right hits # at col 8. Plan tests are consistent with the grid.
- 9x7x32 = 288x224; centered in 352x288 area gives 32 px margins on all four sides; canvas 352x320 incl. 32 px empty HUD strip. No numeric contradiction.
- L is not mentioned in blocking logic: only # or out-of-range blocks.

## (a) Scope leaks - none blocking
- Gull/lamp/timer/stun/level2-3/ending/sound/HUD content: absent as tasks. Palette needing all 8 hex (ch.6) is required by ch.6 itself, not a leak.
- WATCH: main.js keydown handler + redraw-on-keydown is an input-handling and rendering choice that GAME_DESIGN ch.8 / not-yet-decided list assigns to R3 (tick loop, input handling, rendering). User resolved O3/O4 only for event.repeat and no render loop. Mitigation: design-v1 should label this as R1 provisional implementation, ch.8 stays R3, R3 may replace it. Do not write it into ch.8.

## (b) Module boundaries - OK
- logic.js pure with injected time. directionDelta takes DOM key-name strings (ArrowUp...) which is acceptable and canvas-free. sprites.js holds palette+indices (AGENTS allows). strings.js correctly not created. Sprite and palette tests import data-only modules, fine.
- LOW: say where the single cooldown constant (100) lives (e.g. exported const in logic.js) so main.js does not hardcode it.

## (c) Doc-first sufficiency
Sufficient in shape (2/4/5/6/9). Gaps to fix in design-v1 wording (MEDIUM, non-blocking):
1. L walkability undefined. Plan only says L is drawn as floor; moveBear lets bear step onto L. Write in ch.5 legend that L is walkable and drawn as floor in R1, and add one test (move onto L cell allowed) with expected value from the grid (e.g. (2,2) reachable from (1,1) by right then down... actually from (1,1) down to (1,2) then right to (2,2)=L).
2. Existing ch.2 row says 한 칸 이동 시간 100 ms. User decision reinterprets it as instant move + 100 ms input cooldown. Rewrite/rename that row (not just add a decision row) so the table does not contradict itself.
3. Map offset: specify numerically (32,32) relative to the 352x288 map area, not ambiguous central offset that could be read against 352x320 (would give 32,48).
4. Acceptance items 1,5,7 are weakly eyeball-checkable (exact px, 0.1 s, in-palette color). Keep, but state the checking aid (devtools canvas size; item 7 verified by reading ch.6 hex vs sprites.js) so a human can actually decide. Not a scope change.

## (d) 100 ms cooldown clock
Handled correctly: canAcceptMove(lastMoveMs, nowMs, cooldownMs) is pure, timestamps injected, lastMoveMs held in main.js outside the logic state; no ch.8 tick design invented. Open details to pin in ch.2 decision row (LOW-MEDIUM, non-blocking):
- Does a wall-blocked key press start the cooldown or only a real move? Plan wording says after a move. State it; recommended: cooldown starts only when bear actually moves... either is fine but must be written and tested consistently.
- First press: lastMoveMs initial value (null/-Infinity) must make canAcceptMove true. Add to test.
- Time source: pick one (event.timeStamp or performance.now) and use it consistently.

## (e) Numeric consistency
No contradictions: 352x320, 32 px, 9x7, 288x224 in 352x288 all consistent.

## Findings
- MEDIUM: L walkability undefined (ch.5) - add rule + test.
- MEDIUM: ch.2 row 한 칸 이동 시간 conflicts with cooldown decision - rewrite row.
- LOW: map offset numeric (32,32).
- LOW: R1-provisional label for main.js input/redraw vs ch.8.
- LOW: cooldown start semantics, initial lastMoveMs, time source, constant location.
- LOW: weak eyeball checks for criteria 1,5,7.

## Architectural Status
WATCH

## Code Review Recommendation
COMMENT
