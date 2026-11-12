# Brief: prototype advanced to the UI direction

## Goal
The working prototype shows the founder the new direction, moving: Today holds both the decide-deck and the read-feed; Keep (the chief mascot) replaces the plus button and opens one surface to talk, type and capture; the crew are visibly assigned to Spaces and working; threads exist; and a "Simulate" control fires events so he can watch components grow, shrink and appear. It is republished to the same URL.

## Read first
- `/home/user/later/CLAUDE.md`
- `/home/user/later/design/ui-direction.md` (the spec; this brief adds build detail)
- `/home/user/later/docs/architecture.md` sections 4b, 4c, 4d, 4h
- `/home/user/later/docs/backend/plan.md` section 4 (hints and what is never generative)
- `/home/user/later/design/prototype-v3/src/` (Vite, React 18, TypeScript; `npm run build` writes one file, `dist/index.html`)

## Starting point
A first pass by the UI lead is in commit `a1c1a88`. It builds, typechecks and covers most of this brief. Default: start from it and work the punch list in the last section. If the architect asks for a clean build instead, restore `3a7ef72` and build to the spec below. Either way the spec is the same.

## What must not change
- Harbour is the default palette; the other three and light and dark keep working. Three colour jobs: clay = needs you; navy = the crew and Later; citrus = done or back, briefly.
- Now, Next, Later; flick or press to Later with the return-time sheet and the fly to the dock; "In 15 seconds" demo return; rings with story playback; stack edges; spring rise; pressed buttons; the dry, brief voice.
- The approval screen and press-and-hold: one fixed form, exact recipient, amount and content, hold about 1.6 s, letting go cancels. No gesture or thread ever approves. Do not restyle it.
- Type: Mona Sans, Martian Mono. Add only Literata, for the edition. No eyebrow headings, tracked capitals, floating toasts or pill chips.

## Spec

**Tabs.** Today, Spaces, Templates, then Keep at the right end of the bar where the plus was. Remove `bot-avatars` and `liquid-gooey` usage.

**Mascot.** `src/Mascot.tsx` exports `Chief` and `Crew` (`who`: wren, scout, juno, ledger; `state`: idle, listening, thinking, working, waiting, done, rest, error; `size`). Drawing and states come from `design/mascots/mascots.css`, copied to `src/mascot.css`. Tokens `--m-body`, `--m-hole`, `--m-2`, `--m-3`, `--m-a`, `--m-pop`, `--m-ground` map to the palette and are overridden per surface so the eye slots always show the surface behind. Keep's state in the tab bar: waiting when an urgent or near-deadline card is on the deck; thinking while it answers; done for 1.4 s after something lands; resting when the deck is empty; otherwise idle.

**Today**, top to bottom: heading and one line from Keep; rings (labels wrap to two lines, never ellipsis); Now (the deck); Next (crew rows); the edition; the Later dock.
- Deck: one card on top with stack edges. Sizes `regular`, `hero`, `compact`. Primary action; "Tomorrow" (sideways flick does the same, with Undo); a "Later" handle that opens the return-time sheet. Payment cards open the approval screen.
- Next: one row per run with the crew member's mascot working, a status line and "reaches you" time.
- Edition: six snippets in Literata straight on the page, no cards. Each has a source line (monogram, source, "your newsletter" or "you follow X"), headline, gist. Kinds: gist, number (big figure), quote, group of three. Tapping opens it in place, dims the others, marks it read and shows two more sentences, the original's length, "Save to Space" and "Less like this". Ends with "That is the edition." and the followed topics in words.

**Generative behaviours** (all on mock state; layout motion by measuring blocks before and after, not by animating layout properties):
1. Urgent arrives: a clay hero card is dealt from Keep onto the deck; Next folds to one line; the edition folds to a strip; Keep shows waiting; the Inbox ring lights.
2. An agent finishes: its Next row turns into its result with a citrus outline and a smiling crew card, a new card joins the deck, the ring gains a segment, the row leaves after about 4 s.
3. A deadline nears: the deposit card rises to the top, becomes hero, its deadline bar fills, clay outline.
4. Evening comes: heading becomes "This evening"; the edition moves above the deck on the navy night surface; the deck becomes compact with "Send all to the morning"; Next folds; the dock grows a line about tomorrow.
5. Everything cleared: the deck collapses to "That's the lot"; Next folds; the edition's type scales up and takes the page; Keep rests.
6. Reading: an opened snippet grows and the rest recede.
7. Assignment (Spaces): "Ask Keep to put Juno on it" deals a crew card from Keep into the Space tile.

**Simulate control.** In the right-hand chrome on desktop: Something urgent arrives, An agent finishes, A deadline nears, Evening comes, You clear everything, Start again. Below 1060 px it is a sticky bar above the phone so events can be fired while watching.

**Spaces.** Wordmark; a roster of the four crew with how many Spaces each is on; Spaces grouped Now, Next, Later (Later on the navy band). Each tile: emblem, name, status line, "crew name, as of time", count, and the crew member's card tucked behind the tile's top edge in the matching state. Actions: "Thread with X", "Play n cards". One Space (Reading list) starts with no one on it.

**Keep surface.** Opens from the chief, growing from its corner. Large Keep (listening while the field is focused, thinking while answering), one field ("Say it, or type it") whose button is a microphone when empty and send when not, two ways (Ramble, Forward), then the thread list: Keep first, then one per Space with the crew member, last line and a clay dot if it needs you. A thread shows log lines with times, your messages, crew replies in plain text and compact card references. The Keep thread replies with a routing line and a card. The footer says sends and payments still come to Now for a press and hold.

## Constraints
- No new dependencies. No model-written markup anywhere; cards and snippets are typed data in `src/data.ts`.
- All motion honours `prefers-reduced-motion`. Animate transform, opacity and clip-path only.
- Example data only; keep the "Example data" note.
- Do not git commit. Work only in `design/prototype-v3/`.

## Verify (Playwright and Chromium are installed; do not install browsers)
- `npx tsc --noEmit` and `npm run build` pass.
- Screenshots at 390×844 and 1440×900, light and dark, Harbour: Today at rest; edition; snippet open; each of the five simulated events; Spaces top and Later band; after assignment; Keep; a thread after sending; Story; Approval before and after a full hold; Capture; Templates. One screenshot of Today in each other palette.
- No console errors. No horizontal overflow of the page or the phone scroller. No clipped ring labels.
- Interactions: sideways flick then Undo; Later then "In 15 seconds" returns with "Back, as promised"; early release of the hold does not pay, a full hold does; every simulate button from a fresh state and in sequence without reset.
- Frame time while dragging the deck card: median and worst frame.
- Contrast of small text at least 4.5:1 on every surface, including the clay urgent card and the navy night edition, in both themes.
- Reduced motion: no running animations after firing every event.

## Publish
Artifact tool, `file_path` `/home/user/later/design/prototype-v3/dist/index.html`, `url` `https://claude.ai/artifact/3wJVi91KkktbSajzbggFco`. Read the artifact first, then publish to the same URL. Do not create a new artifact.

## Report back
The URL; screenshot paths; the verification numbers; what you changed; what you could not do; anything in this brief you think is wrong.

## Punch list on the first pass (the UI lead's own review)
Verified on the first pass: typecheck and build; no console errors; no overflow at 390 or 1440; ring labels unclipped; flick, Undo, 15-second return, story, early and full hold, Capture from Keep; drag frames at 16.7 ms median and worst; no animations under reduced motion. Not yet right:
1. **Talk and capture are not truly merged.** "Ramble" leaves Keep for the old Capture screen. Record inside the Keep surface: Keep listens, the transcript appears under it, the proposed cards appear in the Keep thread, and "File all 3" stays there. Remove Capture as a separate destination.
2. **Send delay is not shown.** After "Queue reply", the Next row should carry a draining 30-second line and a Stop button, then say it has gone.
3. **Payments.** Pending the founder's answer, leave the approval as is. Do not add new payment moments.
4. **Keep's stack does not reflect the crew.** Show fewer under-cards when more crew are out working.
5. **Inert controls.** "Less like this", "Change what you follow" and "Forward" do nothing. Give each a small, real response or remove it.
6. **Urgent card.** Its second button reads "Not now" and opens the Later sheet; check that reads right, and that an urgent card cannot be flicked away by accident.
7. **Evening on dark.** The navy night surface is too close to the dark page. Give it separation.
8. **Desktop chrome** is taller than a 900 px window. Tighten the right column so Simulate is always in view.
9. **Contrast** has been reasoned about, not measured. Measure it.
10. **Other palettes** were only glanced at (Allotment, Pencil at rest). Check the urgent card, the night edition and the mascot in all four, both themes.
11. **Left panel legend** still describes the old colour copy in places; bring it in line with ui-direction section 1.
12. The old `NowItem` and `NOW0` in `data.ts` are unused; remove them.
