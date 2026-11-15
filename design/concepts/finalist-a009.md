# Later: concept

Phone first, installable web app. How the user pays for the AI is open; the app still works without model access (screen 7). I weighed three approaches (keep Now/Next/Later; Space-first home; one deck and a few nouns) and took the simplest, the last.

## 1. The idea in three sentences
Later is a small team of AI agents that does your admin: tell it once and it drafts, chases and books. It only comes back with a card when it needs your decision, and nothing goes out without your press-and-hold. Unlike a chat agent, you never scroll to find out what happened: the screen rearranges around what needs you.

## 2. The organising model
Four things, one gesture, one shortcut.
- **Keep** (the mascot, a fanned hand of cards) with its **crew** (Wren mail, Scout chases, Juno plans, Ledger money). Keep is the one place to talk, type or capture; it files what you say and deals the crew in.
- **Spaces.** One per part of life, each with its own mail, plans, memory, crew and budget.
- **Cards.** How work reaches you: one action per card, stacked, a short daily deck.
- **Your yes.** One fixed approval form, press and hold, for anything that sends, pays or deletes.
- Gesture: **Later.** Flick any card down, pick a return time, it comes back.
- Shortcut: **Templates.** Start a Space from someone else's; share your own.

Kept: Keep, the crew, Spaces, Cards, Later, Your yes, rings with story playback, Harbour. Cut: Now/Next/Later sections (the founder asked if they complicate things; they do). Merged: Threads into Spaces (each has a log and a text box; Keep's chat is the Keep sheet); Templates into the Spaces screen. Demoted: the edition leaves version one. Renamed: Later, from a place to a gesture.

## 3. Core screens
The model sends typed data (card kind, size, emphasis); the client picks components and does the moving.

**Today. Job: decide what needs you in under a minute.**
```
 Good evening, Sam            (H)(M)(T)(+)  <- Space rings
 Wren has two replies drafted and Scout
 is chasing the plumber.
 +----------------------------+
 | H House move      due 6 pm |  <- hero card, clay
 | Dave can see the loft      |
 | Tuesday at 10. Your        |
 | calendar is free.          |
 | [ Later v ]    [ Review > ]|
 +----------------------------+
   |  Mum's 70th: pick venue |  <- behind, compact
   |  Tax: upload P60        |
                     [Keep deck]
```
- Grows: the card due soonest becomes the hero, with a filling bar.
- Appears: a new needs-you card is dealt from Keep in clay.
- Shrinks: finished work leaves in citrus; an empty deck collapses to "That's the lot".
- Review opens the card: the draft beside his message and your calendar. Keep sits bottom-centre, the only button.

**Your yes. Job: the same form every time.** Never changes shape.
```
 Send to dave@... from you
 Subject: Loft viewing
 [full exact text, as it will be sent]
 ( HOLD TO SEND  ======>    )
```
The text is the real arguments, not a summary. Keep holds still. On completion "Sent" replaces the label inside the same frame.

**Keep sheet. Job: say it once.**
```
        ( face, listening )
  "Mum's 70th: find a venue
   for 20, under 600."
  Filed to: Mum's 70th (new)  [change]
  [mic]  type here...  [photo]
```
Keep's face shows listening, working, waiting or done. Scout takes it; the spend cap shows first.

**Spaces. Job: see each part of life and act on it from here.**
```
 (rings: tap to play this week's story)
 +------------------------------+
 | H House move       2 need you|  <- grown tile
 | Dave: loft Tuesday 10?       |
 | [Later]           [Review >] |
 | Wren  Juno                   |
 +------------------------------+
 +-------------+ +--------------+
 | M Mum's 70th| | T Taxes      |
 | Scout is    | | quiet        |
 | searching.. | | Ledger       |
 +-------------+ +--------------+
 [ + New Space ]  [ From a template ]
```
The tile with the most waiting grows and carries its top card. Busy tiles show the working agent's card and pulse; quiet tiles shrink to a name.

**Space. Job: one part of life, with its crew and log.**
```
 < H House move      [Share as template]
 Crew:  [Wren] [Juno]  (tap = what they're doing)
 +----------------------------+
 | Dave: loft Tuesday 10?     |  <- stacked cards waiting
 | [Later]        [Review >]  |
 +----------------------------+
 In progress: Scout chasing plumber (Thu)
 Log: Wren drafted reply . Juno held Tue 10
```

**Templates. Job: start from someone else's Space.**
```
 +----------------------------+
 | Moving house               |
 | Crew: Wren, Juno, Scout    |
 | Starts with 6 cards        |
 | [ Preview ]  [ Use this > ]|
 +----------------------------+
```
Use this deals the crew into a new Space of yours.

## 4. Features
Version one: Keep capture (voice, text, photo) that files and assigns crew; Gmail and calendar per Space; cards and the approval form; Later; Spaces with log, rings and story playback; spend cap reserved before any run; templates (use, share); a home-screen widget (top card, count).

Left out: the edition, a Threads tab, Now/Next/Later sections, custom crew builders, undo or send-delay options.

## 5. Onboarding storyboard
Nine screens, about 125 seconds to the first useful moment (times below, loading included). Skip everywhere. Screens 2 to 6 use one labelled "Example" (Sam, moving house). Nothing is asked of the user until screen 6's practice. Short zippy sounds; mute toggle.

**1. "An app that does things for you."** Line: "Later is a team of AI agents. Tell it once, it gets on with it."
```
        .---.
       / o o \  <- top card blinks
      [ fanned cards ]
   An app that does things for you.
        [ Next ]
```
Shown: the mascot deck on deep navy. Moves: cards fan out, the face wakes, a crew card is dealt and bounces. Sound: soft riffle, one blip. User: taps Next. (~10 s)

**2. "Tell it once."** Line: "Say it or type it. Keep files it and puts someone on it."
Shown: a speech line, "Dave wants to see the loft Tuesday." Moves: the words become a card that Keep flicks into a ring, House move. Sound: whoosh, tick. (~10 s)

**3. "One Space for each part of life."** Line: "Each has its own mail, plans and memory. Or start from someone else's."
Moves: three rings pop in and unfold; a template tile slides in and its crew deals into a new ring. Sound: rising pings. (~14 s)

**4. "A crew does the work."** Line: "They are AI. Wren writes mail, Scout chases, Juno plans, Ledger checks money."
Moves: Keep deals four cards; each acts out its verb (Wren types, Scout knocks, Juno ticks a calendar, Ledger counts). Sound: four short stings. (~12 s)

**5. "You get a card when it needs you."** Line: "Not a chat to read. One card, one action."
```
 +----------------------------+
 | Dave: "Loft Tuesday 10?"   |
 | Reply drafted: "Works..."  |
 | [ Later ]       [ Review ] |
 +----------------------------+
   (flick me down to try Later)
```
Moves: two cards stack behind; a hand-hint points down. User: flicks the card down; a chip shows "6 pm"; it sinks into a tray, then bounces back: "It comes back." Sound: swish, soft bell. (~15 s)

**6. "Nothing leaves without your yes."** Line: "Press and hold. It always looks like this."
```
 Send to dave@example.com from you
 Subject: Loft viewing
 Tuesday at 10 works for me. See you at the loft.
 ( HOLD TO SEND  ======>    )
 Practice. Nothing is sent.   <- caption, outside the form
```
This is the real form, field for field. Moves: the bar fills, "Sent" replaces the label in the same frame; after the form closes the card turns citrus and stamps. Sound: rising hum, thunk. User: press and hold. (~12 s)

**7. "Wake Keep up."** Line: "Connect your AI account and every job shows its cap before it starts."
Shown: Keep, sleepy, holding a plug card; buttons "Connect" and "Look around first". Moves: on connect the face wakes. Sound: soft power-up. User: connects (however payment is decided), or skips. If skipped, Keep stays sleepy, screens 8 and 9 run from templates, and the deck holds a card "Connect to let Keep do the work". (~20 s, or 3 s skipped)

**8. "Tell Keep one thing."** Line: "Anything you are putting off."
Shown: Keep with a mic, text box and starters ("Plan a trip", "Sort my taxes"). User: says or types one thing. (~15 s)

**9. "Done. Here is your first card."** Line: "Your Space is made. Someone has started."
```
 (T)  <- new ring, named from your words
 +----------------------------+
 | Juno: Plan a trip.         |
 | When are you thinking?     |
 | [ This month ] [ Next month]|
 | [ Not sure ]   [ Later ]   |
 +----------------------------+
 Connect mail to let Wren help.
```
Keep picks the crew from what you typed (trip: Juno; taxes: Ledger; mail: Wren). The first card is always one question with three answer chips; the action is to answer. Connected: a model run on your words writes it, budget reserved first. Skipped: the matching template supplies it. Loading: Keep's face shows "working", up to about 8 seconds. Sound: riffle, bell. First useful moment: your words became a Space and a decision. (~25 s)

## 6. Look and feel
Harbour carries meaning: clay means "needs you", ink navy means structure and the crew, citrus means done. Nothing else gets colour. Space rings are all the same navy line, told apart by an initial and name; a clay dot appears on a ring only when that Space needs you. Dark leads; Light needs more work. Type is a confident serif for headlines and a plain sans for actions; no eyebrow labels, no popup pills. Motion explains a change: cards are dealt, stacked, flicked and stamped. The mascot is a character that needs you: Keep changes face when working, waiting or done, and is the one way in; the crew are cards dealt to a Space, showing what they are doing.

## 7. Why this will work, and its biggest risk
Why it works:
- Four things and one gesture explain in a minute and are learned inside onboarding.
- The screen shows work being done and a decision to make, which a chat window cannot.
- The fixed approval form is a visible trust mark, and the practice shows the real form.

Biggest risk:
- The value depends on cards being good and short; a vague first card looks like a list again.
- Generative layout feels random unless each size change has a visible cause.
- Users who skip model access see only template cards; the deck must make connecting worth it.
