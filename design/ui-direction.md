# Later: UI direction

Status: v1, 12 Nov 2026. Owner: UI lead. Read with `docs/architecture.md` 4b to 4h and `docs/backend/plan.md` section 4. Mascot sheet: `design/mascots/concepts.html`. Builder briefs: `design/briefs/`.

## 1. The one idea

**The interface keeps time.** Every card sits somewhere on a line from Now to Later, and the screen is the current arrangement of that line. What needs you rises and grows. What the crew have in hand shrinks to a line. What can wait sinks below a horizon and comes back on its own. The mascot family is made of the same material: the chief is a stack of cards, the crew are cards dealt from it.

Generative UI means this: agents change data and hints, the client moves the furniture, and every movement explains a change of state.

## 2. Information architecture

| Place | What it is |
|---|---|
| **Today** (tab) | The view by time. Top to bottom: one line from Keep, rings, **Now** (the decide-deck), **Next** (crew at work), **the edition** (the read-feed), and the **Later** dock. |
| **Spaces** (tab) | The view by place. Crew roster, then Spaces grouped Now, Next, Later, each with its crew member's card tucked into the tile. |
| **Templates** (tab) | Unchanged. |
| **Keep** (the chief, replaces plus) | One surface to talk, type and capture, and the only door to threads. |
| Story, Approval, Capture | Overlays, unchanged in form. |

Send delay and biometrics (backend questions): a queued send appears as a Next row with a draining 30-second line and Stop. A biometric check may follow a completed hold for new recipients, bulk actions and money; it never replaces the hold.

**How Today holds deck and feed.** One thing is loud at a time. Deciding is sans type on raised cards, one at a time, with buttons. Reading is a book serif set straight on the page, no card chrome, every piece under its source, ending in "That is the edition." By day the deck leads. When it is clear, or in the evening, the edition takes the page. An urgent card folds the edition to a strip.

**Threads.** One per Space and one with Keep, as the architect proposed, with three refinements. A thread is the Space's activity log with a place to talk: log lines, cards and messages interleave. "Ask about this" on any card opens the Space thread at that card; there are no per-card threads. The Keep thread is a router: it answers "Filed to House move, Scout has it" and stays short. Threads are reached from Keep and from a Space tile only; there is no Threads tab. Answers that need you land in Now. An approval block in a thread links to the fixed approval screen; nothing is approved in a thread.

## 3. Behaviour vocabulary

| Component | What changes | Trigger | Motion |
|---|---|---|---|
| Deck card | Size `compact`, `regular`, `hero` | Hint, deadline within the alert window, evening | Unveils from its old height; neighbours slide |
| Deck card | Dealt onto the top, in the needs-you colour | Item with `emphasis: strong` arrives | Flies from Keep, lands with one overshoot |
| Deck card | Promoted to the top with a filling deadline bar | `expires-soon` | Rises through the stack |
| Deck | Collapses to "That's the lot" | Deck empty | Fades to its small form; page closes up |
| Next row | Becomes its result, then leaves | Run finishes | Citrus outline, crew smiles, row closes after 4 s |
| Next list | Folds to one line with piled crew | Urgent, evening or cleared | Slide and fade |
| Edition | `strip`, `normal`, `full` | Urgent present; default; deck clear | Unveil, type scales up |
| Edition | Moves above the deck on the night surface | Evening (from active hours) | Blocks swap by sliding |
| Snippet | Opens in place, siblings dim; a group splits into lines | Tap | Unveil |
| Later dock | Counts up; grows a line in the evening | Snooze; evening | Card flies in; dock settles |
| Keep | State changes (section 5) | Runs, approvals, voice | Part transforms only |
| Crew card | Tucked into a Space tile | Assignment | Dealt from Keep |

**Never morphs:** everything in `docs/backend/plan.md` 4.6 (approval and hold, recipients, amounts, permissions, meters, undo, sources, end markers).

## 4. The edition

Finite: six to eight pieces, built once a day in batch. Each piece shows source name, why it is here ("your newsletter" or "you follow heat pumps"), a headline, a two-sentence gist, and on opening two more sentences, the original's length and link, Save to a Space, and Less like this. Four kinds: `gist`, `number`, `quote`, `group`. Plain text only: newsletters are untrusted. Followed topics are listed in words at the end with one edit link.

## 5. The mascot: the Deck

Chief **Keep** is a stack of three cards with a folded corner; the eyes are two slots cut through the card. Crew **Wren, Scout, Juno, Ledger** are single cards with different cuts (tab, clipped corner, arch, receipt edge). States: idle (breathes, blinks), listening (corner lifts, under-cards move as a level meter), thinking (cards shuffle), working (eyes scan, lines write), waiting on you (a clay card rises behind), done (citrus card, eyes close to arcs), resting (sinks behind a horizon), error (askew). The needs-you colour and the done colour appear on the mascot only with those meanings.

Why the others lost. **Floats** (buoys on a waterline): the sea comes from a palette name, not the product; objects with faces sit near Town; a bobbing toy is wrong beside money. **Hands** (clock hands on a pivot): clear at 24 px but an indicator, not a family; near Dots; reads as a loader.

## 6. What each screen needs from the backend

Differences from `docs/backend/client-api.md` are marked **(differs)**.

- **Today**, one surface **(differs: merge `home` and `today`)**: sections `rings`, `deck`, `next`, `edition` (the full edition inline, not a teaser), `later`; `handledToday`; next scheduled moment (time, label).
- **Deck item**: card, `size`, `emphasis`, `reason`, `fresh`, `expiresAt` **(add)**, `returned` (on time or early), stack depth.
- **Next item**: `runId`, Space, crew id, status line, `phase`, `progress?`, `reachesYouAt`; on finish, `result` (line, `cardId?`) held for display **(add)**.
- **Later item**: card or Space, waking condition as data (`time` or `event`), not prose.
- **Snippet**: `source`, `via` (`newsletter` or `interest`) and `topic?`, `kind`, `headline`, `gist`, `more?`, `figure?`, `items[]?`, `originalUrl`, `minutes`, `relatedSpaceId?`, `read`. Edition: `builtAt`, `count`, `nextAt`, `interests[]`.
- **Phase** **(add)**: `activeHours` and an evening start in settings; the client derives day or evening and "cleared". No server layout mode.
- **Spaces**: tiles as specified, plus crew id, crew status, `needsYou`, `reachesYouAt`, thread id.
- **Crew**: `form`; status vocabulary **(differs)**: `idle`, `working`, `waiting-on-you`, `resting`, `error`. `thinking` comes from `run.phase`, `done` from a run-finished event, `listening` is client-only. Chief status is aggregated.
- **Threads**: as specified. Plain paragraphs are enough. Activity-log lines as `system` messages. `routed` block in the Keep thread.
- **Assignment**: an event naming Space and crew, so the deal can be animated.

## 7. Open questions for the founder

1. The names: Keep, Wren, Scout, Juno, Ledger?
2. Is an evening edition wanted, or one a day?
3. Payments: the backend lead proposes "ready to pay" cards that open the bank. I agree; the hold stays for sends.
4. Does a book serif (Literata) suit you for reading? Should the edition ever show images? My answer is no for v1.
