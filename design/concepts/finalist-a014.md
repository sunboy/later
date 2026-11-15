# Later: concept

## 1. The idea in three sentences

Later is an app that does things for you. You tell it what is on your plate, and a small team of AI helpers drafts, chases and books while you get on with your day. They come back with a card only when they need your yes, or when something you set aside is due. Unlike a chat agent, you never face a blank box: work arrives as cards that grow, shrink and return on their own, and nothing leaves without your press-and-hold.

## 2. Questions I settled first

- **Is Now, Next, Later needed?** No. Size says it: needs you is big and clay, crew work is one quiet line.
- **Why is Spaces weak?** It lists labels. Each Space now shows a live top card and crew faces.
- **Is value instant?** No. The backend lives in the user's own Cloudflare account, so setup is real work.

## 3. The organising model

Three things to learn, two moves.

- **Keep and the crew.** Keep is the one place to talk, type or capture. It hands work to Wren (mail), Scout (chasing people), Juno (plans) and Ledger (money). They are AI, and say so.
- **Spaces.** One per part of life, each with its own mail, memory, budget and crew.
- **Cards.** What a helper hands you: one thing, one action.
- **Later (move).** Set a card aside with a time. It returns.
- **Yes (move).** Press and hold on the one fixed approval form to send, pay or delete.

**What I did.** Kept: Keep, crew, Spaces, cards, Later, Yes, Today, edition, rings, card stacking, Harbour. Merged: Templates into Spaces; Threads into the Space and Keep. Cut: Now, Next, Later as sections, because they make a list. Renamed: Later dock to Later shelf. No plus button: Keep starts everything.

## 4. Core screens

Tabs: Today, Keep (centre), Spaces.

**Today: what needs you, as a hand of cards.**
```
Keep: Wren has a draft for Dave.
(House)(Taxes)(Trip) <- rings
+------------------------------+
| Wren . House move       HERO |
| Dave: view the loft Tue      |
| 10:00? Reply drafted.        |
| [Later]    [Review and send] |
+------------------------------+
| Ledger . Rent due Fri [Review]|
Crew: (Scout)(Juno) working  >
| Edition . 6 pieces, 8 min [Read]|
Later shelf: [Dentist 6pm][Gift Sat]
```
Grows: a card nearing its deadline goes compact, regular, hero, with a draining bar. Appears: an urgent card is dealt from Keep. Shrinks: the crew line folds to piled faces. Empty deck: "That's the lot"; the edition takes the page. Cap: seven.

**Card, open, and the Yes form.** The card shows the actual draft, recipient and time. "Review and send" opens the one approval form. It has one shape for send, pay and delete: same slots, same single line, same hold. Only the data in the slots changes.
```
+------------------------------+
| Action:  Send                |
| To:      Dave                |
| What:    "Hi Dave, Tuesday   |
|           at 10:00 works."   |
| Happens when you hold.       |
|       (    HOLD    )         |
| [Not yet]                    |
+------------------------------+
```
Pay and delete fill the same slots with the payee and amount, or the item. Contents come from the tool call itself, never a model summary. The hold is 1.2 seconds.

**Keep: talk, type, capture.** Tap the deck: it fans open, mic first.
```
 ( Keep, listening ) ~~~
 "Dave can see the loft Tue"
 Filed: House move. Wren: reply
 [Move]  [Looks right]
```
Keep shows where it filed and who has it. It also starts new Spaces.

**Spaces: the table.** A single column in the user's own fixed order. Need changes a row's height and edge, never its position: a Space that needs you grows tall with a clay edge, a working one stays medium, a quiet one shrinks to a slim row.
```
+------------------------------+
|(ring) House move   clay edge |
| Dave, Tue 10:00. Reply ready |
| (Wren)(Scout)   [Review]     |
+------------------------------+
|(ring) Taxes  (Ledger) waiting|
 (ring) Trip   (Juno) quiet
+- Keep: "Tell me about a new  -+
  part of life, or borrow one" 
```
The last row is a Keep card that opens Keep's mic. No plus.

**Inside a Space.**
```
House move        (ring: play week)
+------------------------------+
| TOP CARD: Dave, Tue 10:00    |
| [Later]    [Review and send] |
+------------------------------+
Crew  (Wren: drafting)(Scout: waiting
      on 2 quotes)(Juno)(Ledger)
Plan  Keys by 30 Nov
Memory  "Loft is 2nd floor" [edit]
Thread  Ask the House crew...
```
Grows: a crew member who needs you becomes a card at the top. Shrinks: idle crew fold into one line of faces. Memory is editable, so the user can fix what the crew believes.

**Templates.** Reached from Keep, or the Spaces closing card.
```
+-Moving house-+ +-School year-+
| 4 crew       | | 3 crew      |
| [Preview]    | | [Preview]   |
Preview: crew, first cards,
what it connects. [Start it]
```
Starting deals its crew into a new Space.


## 5. Features

First version: voice and text capture; filing with one-tap correction; four crew; cards with Later and Yes; the daily deck; the edition (6 to 8 pieces, with sources); rings; Space threads; five templates; spend cap per Space; mail connection with a no-mail path.

Leave out: a Threads tab, calendar writing, voice conversation, phone calls, an open template store, an infinite feed.

## 6. Onboarding storyboard

Twelve screens in two parts. **Tour, screens 1 to 8: about 75 seconds, watch only.** Nothing is asked. **Setup, screens 9 to 12: about 8 minutes the first time**, because the backend deploys into the user's own Cloudflare account. All tour cards carry a "Sample" tag and tell one plain story: Dave, a loft viewing, a reply.

**1. "An app that does things for you."** Support: "Tell it what's on your plate. It gets on with it." Navy field, Keep's cards fanned; they riffle open. Sound: paper riffle. Tap "Show me". 5 s.
```
        (  ^_^  )  <- Keep
      /___/___/___\
   An app that does things for you.
   Tell it what's on your plate.
        [ Show me ]
```
**2. "This is Keep."**  Support: "Say it once, out loud or typed. Keep takes it." A sample line flies into Keep. 7 s.

**3. "Every part of life gets a Space."** Support: "House move, taxes, a trip. Each has its own mail, plans and memory." The line lands in a House move tile; Taxes and Trip appear, each with a ring. 8 s.

**4. "Each Space has helpers."** Support: "Wren writes mail. Scout chases people. Juno plans. Ledger watches money. They are AI, and work while you're away." Four cards deal in; each does its verb once. 9 s.

**5. "They only come to you when they need you."** Support: "That's a card. One thing to decide." Dave's email slides in, Wren drafts, a clay card rises. One chime. 9 s.
```
+----------------------------+
| Sample                     |
| Wren . House move          |
| Dave: view the loft Tue    |
| 10:00? Reply is ready.     |
| [Later]  [Review and send] |
+----------------------------+
```
**6. "Not now? Say later."** Support: "It sinks, and comes back when you said." The card sinks below a horizon, a clock sweeps, it rises again; Keep says "You said later. Here it is."  9 s.

**7. "Nothing goes out without your yes."** Support: "You press and hold. Nothing else sends, pays or deletes." The fixed Yes form appears with the sample reply, tagged "Sample", and a ghost hand holds it; the ring fills and the card goes citrus. 10 s.
```
Sample. Action: Send  To: Dave
"Hi Dave, Tuesday at 10:00 works."
Happens when you hold. (HOLD)
```
**8. "Your day, dealt."** Support: "Cards land here. Rings replay each Space. The edition is your reading, short." The card settles on Today; a ring plays a two-second story; the edition slides up. A last beat shows a template tile: "Or borrow a ready-made Space." 18 s.

**9. "First, Later needs a home."** Support: "It runs in your own Cloudflare account, so your mail and keys stay yours. This takes a few minutes." Three steps, Keep carrying a card to each: sign in to Cloudflare, install, check. Each ticks citrus.  2 to 3 min.

**10. "Give Wren your mail."** Support: "So it can find what needs you. The password stays in your account." Shown: guided steps for a Google app password (it needs 2-Step Verification; some Workspace accounts cannot), with a link to the advanced route. A second button: "Not now: I'll tell Keep instead". 3 to 5 min.

**11. "Set what it can spend."** Support: "A monthly cap, set by you. Keep stops at the cap." A default is pre-filled; one row picks how the AI is paid for. 1 min.

**12. The first real cards.** Keep deals real cards onto Today, as the tour showed. The headline depends on what happened.
- Mail read, two or more finds: "Two things need you." (real count, three at most). Support: "Wren drafted the first reply."
- Mail read, nothing found: "Nothing urgent. Good." Support: "What's on your plate?"
- Mail skipped: "What's on your plate?" Support: "Say it or tap one. Keep will file it." Three tap starters: "A bill to pay", "Someone to reply to", "Something coming up".

The user taps the hero card. Then: "Want a nudge when a card is due?" (notification permission). 15 s.

## 7. Look and feel

Dark first, navy ground, raised cards; Light is paper-white and needs its own pass. Colour carries meaning only: clay means needs you, navy means structure and the crew, citrus means done. Type: a humanist serif for reading, a rounded grotesque for interface text; no eyebrow labels, no pop-up pills. Motion has three verbs, deal, sink and fill, each settling with one overshoot. The mascot is a character that needs you: it deals, holds the shelf and carries the setup steps, so deleting it breaks the app.

## 8. Why it will work, and its biggest risk

**Why.**
- Each concept arrives once, in one story the user can say back.
- Cards carry real words and one action, and change size with need.
- Trust shows early: one unchanging approval form, a cap, keys in the user's account.

**Risk.**
- Real value waits behind a Cloudflare deploy, mail and an AI source, so the setup must feel like progress and the first real card must be good.
- A watch-only tour followed by eight minutes of setup can lose people at screen 9; the no-mail path stays one tap.

Assumptions: the seven-card cap, 1.2-second hold, default cap and setup times are proposals. The deploy route is unconfirmed in the architecture, so screen 9 adapts to whichever installer works. The AI payment row on screen 11 is swappable.
