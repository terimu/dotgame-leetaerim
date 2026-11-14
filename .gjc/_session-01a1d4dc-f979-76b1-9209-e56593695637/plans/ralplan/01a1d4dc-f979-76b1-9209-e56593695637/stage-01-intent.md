# Intent reconciliation (pre-review), R4

## Evidence inspected
- User request R4 (goal-5, goal-6, common conditions), GAME_DESIGN.md v3 (14,081 chars, wc -m), AGENTS.md, src/{main,strings,sprites,logic}.js, test/logic.test.js, Planner stage-01 receipt e4f3134c..., candidate /tmp/r4/GAME_DESIGN_v4_candidate.md.
- Measured: v3 = 14,081 chars (already 281 over the 13,800 grader limit). Candidate after user decision = 13,766 chars (slack 34).

## Resolved material decisions (user, via ask, after session resume)
- OI-1 length method: option A. Remove the seven 4장 sprite grids from the document (src/sprites.js becomes the source of truth); 4장 keeps ONLY sprite name, size, used palette indices. Remove the 2장 RNG formula line. 9장 items 1~48 keep number, sentence, evidence citation AND the per-item `[x]`; only the trailing text ` 사람 브라우저 확인 2026-11-13` is folded into one legend line `[x] = 사람 브라우저 확인 2026-11-13` in 9장 head. Items 1~48 numbers/sentences unchanged (verified by diff).
- Result length re-measured by leader: 13,766 chars.

## Retained non-goals / constraints
- No code edits now. No font/image files, 6장 hex unchanged, grid of glyphs NOT in the document, doc <= 13,800 chars.
- 7장 `보류` wording replaced by real rules; 9장 49+ appended after 48.
- Last-session defaults D2 (best score only on ending, failures not stored/shown), D3 (title name 5 syllable sprites, key sprite with no text), D5, D6, D7, D8, D9 stay as proposed; they remain user-visible open items.

## Still-open (non-blocking, carried into plan table)
- Key sprite palette indices 4/6/7 are an agent proposal (user only said key shape).
- Sound values are agent proposals.
- 9장 58 gains `(favicon 요청 제외)`.
- Slack only 34 chars: any later date/legend growth must be paid by trimming.

material-open-items: none blocking (OI list continues in the plan)
