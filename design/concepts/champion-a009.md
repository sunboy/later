# Later: concept

Phone first, installable web app. Payment for the AI is open.

## 1. The idea in three sentences
Later is a small team of AI agents that does your admin: tell it once and it drafts, chases and books. It only comes back with a card when it needs your decision, and nothing goes out without your press-and-hold. Unlike a chat agent, you never scroll to find out what happened: the screen rearranges around what needs you.

## 2. The organising model
Four things, one gesture, one shortcut.
- **Keep** (the mascot, a fanned hand of cards) with its **crew** (Wren mail, Scout chases, Juno plans, Ledger money). Keep is the only way to create or capture anything: talk, type, photo, new Space, template. It files what you say and deals the crew in.
- **Spaces.** One per part of life, each with its own mail, plans, memory, crew and budget.
- **Cards.** How work reaches you: one action per card, stacked, a short daily deck.
- **Your yes.** One fixed approval form, press and hold, for anything that sends, pays or deletes.
- Gesture: **Later.** Flick any card down, pick a return time, it comes back.
- Shortcut: **Templates.** Start a Space from someone else's, through Keep; share your own.

Kept: Keep, the crew, Spaces, Cards, Your yes, rings with story playback, Harbour. Cut: Now/Next/Later sections (they complicate things). Merged: Threads into Spaces (a text box and log each; Keep's chat is the Keep sheet); Templates into Keep. Demoted: the edition leaves version one. Renamed: Later, from a place to a gesture.

## 3. Core screens
The model sends typed data (card kind, size, emphasis); the client picks components. Navigation: bottom bar **Today | Keep | Spaces**, Keep (the deck) in the centre as the one way to create; a back arrow inside a Space.

**Today. Job: decide what needs you in under a minute.**
```
 Good evening, Sam   (H)(M)(T)(All) <- tap ring = open
 Wren has two replies drafted; Scout
 is chasing the plumber.
 +----------------------------+
 | H House move      due 6 pm |  <- hero card, clay
 | Dave can see the loft      |
 | Tuesday at 10. Your        |
 | calendar is free.          |
 |        [ Review reply > ]  |   one action
 +----------------------------+   (flick down = Later)
   |  Mum's 70th: pick venue |  <- behind
   |  Tax: upload P60        |
 [ Today ]   [ Keep deck ]   [ Spaces ]
```
- Grows: the card due soonest becomes the hero. Appears: a clay card dealt from Keep. Shrinks: finished work leaves in citrus; an empty deck reads "That's the lot".
- Review opens the draft beside his message, ending in Your yes.

**Your yes. Job: the same form every time.** One frame, three kinds.
```
 SEND   to dave@... from you        Subject: Loft viewing
 PAY    $240.00 to Dave Plumbing
 DELETE 14 emails in House move
 +------------------------------+
 | [exact arguments, fixed-     |  scrolls inside the frame
 |  height body]    line 1 of 40|
 +------------------------------+
 ( HOLD TO SEND  ======>      )   unlocks once the end is seen
```
The body is the real arguments, not a summary; the frame never resizes. "Sent" replaces the label in the same frame.

**Keep sheet. Job: say it once.**
```
  ( face, listening )
  "Mum's 70th: find a venue for 20."
  Filed to: Mum's 70th (new)  [change]
  [mic]  type here...  [photo]
  Start a Space: [ blank ] [ from a template ]
```
Keep's face shows listening, working, waiting or done. The cap shows before work starts.

**Spaces. Job: act on the part of life that needs you most.** Same cards as Today, by Space.
```
 (rings: tap = play week's story)
 +------------------------------+
 | H House move     (o) 2 need  |  <- grown: most waiting
 | Dave: loft Tuesday 10?       |
 |            [ Review reply > ]|  the real card, same action
 | Wren drafting - 3 of 8 done  |
 +------------------------------+
 +-------------+ +--------------+
 | M Mum's 70th| | T Taxes      |
 | Scout is    | | [Ask Ledger  |
 | searching.. | |  for the P60]|
 +-------------+ +--------------+
```
The tile with most waiting grows and carries its top card and action; acting there equals acting on Today. Busy tiles pulse; quiet tiles shrink and offer one suggestion, routed through Keep. Tap a name to enter.

**Space. Job: one part of life, with its crew and log.**
```
 < H House move      [Share as template]
 Crew:  [Wren] [Juno]  (tap = what they're doing)
 +----------------------------+
 | Dave: loft Tuesday 10?     |  <- cards waiting
 |             [ Review > ]   |
 +----------------------------+
 Log: Wren drafted reply . Juno held Tue 10
 [ Ask the House move crew...        ]
```
The text box is this Space's thread.

**Widget. Job: the deck without opening the app.** Offered after the user first acts on a card.
```
 +------------------+  empty: +------------------+
 | H Dave: loft Tue |         | Nothing needs you|
 | 10? [Review]  3  |         | (status line)    |
 +------------------+         +------------------+
```
Top card and count; tap opens it. The empty status line is true: "Keep is working" only while work runs, else "All clear", or "Connect Keep" with no model.

**Templates**, from Keep: a tile shows the crew and "Starts with 6 cards", with Preview and Use this.

## 4. Features
Version one: Keep capture (voice, text, photo) that files and assigns crew; Gmail and calendar; cards and the approval form; Later; Spaces with log, rings and story playback; spend cap reserved before any run; templates; the widget.

Left out: the edition, a Threads tab, Now/Next/Later, crew builders, undo.

## 5. Onboarding storyboard
Nine screens: about 123 seconds to the first useful moment connected, about 100 without. The app is explained before the user is asked for more than a tap. Asked: Next taps, one flick (screen 5), one hold (6), one sentence of their own (7), the account (8). The flick and hold play by themselves first, then invite a try. Screens 2 to 6 use one plain example tagged "Example". Zippy sounds; mute toggle.

**1. "An app that does things for you."** Line: "Later is a team of AI agents. Tell it once, it gets on with it."
```
        .---.
       / o o \  <- top card blinks
      [ fanned cards ]
   An app that does things for you.
        [ Next ]
```
Shown: the deck on navy. Moves: cards fan out, the face wakes, a crew card bounces. Sound: riffle, blip. User: taps Next. (~10 s)

**2. "Tell it once."** Line: "Say it or type it. Keep files it and puts someone on it."
```
 [Example]
 "The plumber can come Tuesday."
      -> card -> ( Plumber )
```
Moves: the words become a card that Keep flicks into a ring. Sound: whoosh. (~10 s)

**3. "One Space for each part of life."** Line: "Each has its own mail, plans and memory. Or start from someone else's."
Shown: [Example] tag. Moves: three rings pop in; a template tile slides in, its crew dealing into a new ring. Sound: pings. (~14 s)

**4. "A crew does the work."** Line: "They are AI. Wren writes mail, Scout chases, Juno plans, Ledger checks money."
Moves: Keep deals four cards; each acts its verb (Wren types, Scout knocks, Juno ticks, Ledger counts). Sound: stings. (~12 s)

**5. "You get a card when it needs you."** Line: "Not a chat to read. One card, one action."
```
 [Example]
 +----------------------------+
 | Plumber: "Tuesday at 10?"  |
 | Reply drafted: "Works..."  |
 |            [ Review ]      |
 +----------------------------+
```
Moves: two cards stack behind; the top card flicks down by itself, a chip shows "6 pm", it sinks, then bounces back: "It comes back." User: flicks (or Next). Sound: swish, bell. (~15 s)

**6. "Nothing leaves without your yes."** Line: "Press and hold. It always looks like this."
```
 [Example]
 SEND to the plumber from you
 Subject: Tuesday
 Tuesday at 10 works for me.
 ( HOLD TO SEND  ======>    )
 Practice. Nothing is sent.  <- outside frame
```
The real approval component. Moves: the bar fills once by itself, then waits; on the user's hold it fills, "Sent" replaces the label in the frame, the card turns citrus, stamped. Sound: hum, thunk. User: holds (or taps Next). (~12 s)

**7. "Tell Keep one thing."** Line: "Anything you are putting off."
Shown: Keep, mic, text box, starters ("Plan a trip", "Sort my taxes"). No Example tags: this is the user's own. User: says or types one thing. Nothing runs yet. (~15 s)

**8. "Wake Keep up."** Line: "Connect your AI account. Every job shows its cap before it starts."
Shown: sleepy Keep with a plug card; "Connect", "Not now". On connect the face wakes. Sound: power-up. User: connects (however payment is decided) or skips. (~20 s, or ~3 s)

**9. "Your Space, and a card to start it."** Line: "Nothing runs until you press Start."
```
 (B) <- new ring, named from your words
 +----------------------------+
 | Boiler keeps breaking      |
 | Scout can look into it.    |
 | Cap shown before it runs  |
 |        [ Start it > ]      |
 +----------------------------+
```
With a model: Keep's face shows "working" for up to about 8 s while it names the Space, picks the crew (trip: Juno; taxes: Ledger; mail: Wren) and writes the card; budget is reserved before that call. "Start it" reserves the job's cap and runs it; Today shows the crew at work. First useful moment: your sentence is a Space with a named agent doing it. Sound: riffle, bell.
Without a model: the Space and card are local, with the user's words and no crew. The one action, "Connect to start", returns to screen 8. (~15 s, or ~10 s)

## 6. Look and feel
Harbour carries meaning: clay means "needs you", ink navy means structure and the crew, citrus means done. Rings are one navy line, told apart by initial and name; a clay dot appears only when that Space needs you. Dark leads. Type: a confident serif for headlines, plain sans for actions; no eyebrow labels, no popup pills. Motion explains change: cards are dealt, stacked, flicked, stamped. The mascot is a character that needs you: Keep changes face when working, waiting or done, and is the one way in.

## 7. Why this will work, and its biggest risk
Why it works:
- Four things and a gesture explain in a minute.
- The screen shows work done and a decision to make.
- The fixed approval form is a visible trust mark, practised on the real component.

Biggest risk:
- The value depends on cards being good and short; a vague first card looks like a list again.
- Users who skip model access see only their own notes; the deck must make connecting worth it.
