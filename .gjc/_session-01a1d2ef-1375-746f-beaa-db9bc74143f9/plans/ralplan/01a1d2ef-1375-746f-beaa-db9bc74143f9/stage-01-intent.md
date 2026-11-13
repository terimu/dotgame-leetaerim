# Intent reconciliation (pre-consensus) - R1 "bear moves one tile"

## Evidence inspected
- GAME_DESIGN.md v0 (ch.2 movement table; ch.4/5-level1/6/9 empty; "아직 안 정한 것"; ch.10)
- AGENTS.md (doc-first rule, completion = ch.9 items, 6-attempt rule)
- deep-interview spec: Map Grids (approved R13), acceptance criteria
- Planner stage-01 artifact (O1..O8)

## Resolved material decisions (user, via ask)
- O1 wall: bear stays in place when moving into `#` (move ignored). Only wall-blocking is recorded in R1 ch.2; gull/other collision stays R2.
- O3 100 ms: instant logical+visual one-tile move, then 100 ms input cooldown. No interpolation animation, no render-loop design (ch.8 stays R3).
- O4 key hold: one keydown = one tile; browser auto-repeat (event.repeat) ignored.
- O7 ch.9: design-v1 writes "R1 임시 수용 기준" numbered items into ch.9; R2 extends it. Completion reports cite ch.9 item numbers.

## Retained non-goals
Gull, lamp lighting/sprite, timer, stun, HUD content, level 2/3, ending, restart, sound, ch.8 tech spec, all ch.10 items.

## Not escalated (design-v1 review defaults, human sees them in the doc diff)
- O2 `L` cell drawn as floor in R1 (grid kept verbatim; lamp behavior/art = R2)
- O5 map centered in 352x288 area (32px side/top-bottom margin), margin = ch.6 background color
- O6 sprites 16x16 palette-index arrays drawn at 2x
- O8 stun input: not an R1 item, stays closed.

material-open-items: none
