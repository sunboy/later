# Feature tour research: how apps introduce themselves

14 Nov 2026. Meaning and sequence. Craft is in `onboarding-flows.md`; premise is in `premise/`.

- **Appllama credits.** I started with 1,141 and finished with 990, so 151 were spent. I ran the free credit check before and after.
- **Images.** Scratchpad only (`tour-research/img/`), none in the repository. Videos were read as frame strips.
- **Named apps.** I walked 15 of the 16 the founder named: Finch, Calm, Partiful, Structured, Duolingo and Duolingo ABC, Tolan, Opal, Bevel, MyFitnessPal, BitePal, Widgetsmith, Locket, one sec, Tiimo and Focus Friend. **Flighty is not in the library**, so I used its App Store page instead.
- **Similar apps (35).**
  - World and place: Focustown, Cat On Chair, MyDooors, Cozy Couples, Pokémon Sleep, Gossip Harbor, ThetaWave, Forest, Study Bunny, Headspace, FocusFlight, Creed.
  - Money: YNAB, Copilot, Monarch, Rocket Money.
  - Family, calendar and lists: FamilyWall, Any.do, Cozi, TimeTree, Superlist.
  - AI and agents: Base44 Superagent, Perplexity, ChatGPT, Claude, Gemini, Gizmo, Proactor, Chat AI Nova, Replika, ChatPod.
  - Tours and widgets: Livity, Simply Wall St, Loopy Pro, Pengu, Blessed, Luvu.
- **Web sources** (labelled **O** official, **S** secondary, **U** unconfirmed):
  - Tolan's design post "Designing Tolan, part 1" (O).
  - Flighty on the UK App Store (O).
  - NBC News and Fast Company on Focus Friend (S).
  - Pratt IXD critique of Finch (S).
  - Pokémon official app page, seen through search (O), and Pokémon GO Hub (S).

## 1. Screens before the first ask

| App | Intro screens | What they do | First ask |
|---|---|---|---|
| one sec | 1 | A reader sits under a shell while notification dots bounce off it. Headline: "saves 2 hours every day" | "Set up now (takes 5 mins)" or "Remind me tonight" |
| Locket | 1 | A phone outline with one live photo widget: "Live pics from your friends, on your home screen" | Create account |
| YNAB | 2 (8 s, no taps) | Worry bubbles pile up in the user's own voice, with line-art house, cart and car, then blur | "YNAB can help!" |
| Headspace | 2 | Breathe in, breathe out. The character rises and sinks like a sun | Sign up |
| Cat On Chair | 3 | An empty chair. "They say … a cat appears on your chair." The cat climbs up | Nickname |
| Tolan | 3 | A forest scene with a subtitle pill, then the Oracle | Name |
| Structured | 3 | A desk scene, then a real timeline (Buy Groceries, Prepare Food, Eat Lunch), then "helps you…" | "Plan today" |
| Opal | 4 | Rock, "Look closer.", then a gem: "I'll help protect your focus." | Name |
| Focus Friend | 1, then 9 story beats | The bean tells its story. Every button is the user's reply | Name, on screen 2, in the bean's voice |
| Focustown | 3 | The camera walks down a street into a library, with speech bubbles | A 30-screen survey |
| Bevel, MyFitnessPal | 5, 3 | Dot carousel | Sign in |
| Partiful | 0 | Splash, then phone number. People arrive through an invite, which is the product | Phone |

Strong openings take 1 to 4 screens and under 15 seconds before the first ask. Long openings work only when every beat is story (Focus Friend), and fail when the world gives way to forms (Focustown).

## 2. Patterns, ranked by how well they work

| # | Pattern | Apps (screen ids) | Why it works |
|---|---|---|---|
| 1 | **The problem plays itself.** The user's own open loops pile up on screen, untouched, then one line of empathy | YNAB `spl_s1kj9`, `spl_a63gr`; one sec `spl_mfxwh` | Recognition before any claim. No reading tax |
| 2 | **The character's job is half of a deal with you.** The CTA is the user's reply | Focus Friend `onb_wrwr7` to `onb_kxwyd` ("when you put your phone down, I can focus on my knitting"); Cat On Chair `spl_4yr1e`, `spl_106z5` | The character needs the user, so it is a product rather than a mascot |
| 3 | **Arrive in a place.** The camera travels and the world does the explaining | Focustown `spl_z4dxh`, `onb_va6q3`; MyDooors `onb_xvwdo`, `onb_sprsj` (into the doorway); Focus Friend clouds parting `onb_r9sif`; Tolan `onb_3hnz9` | Feels like entering, not reading. Copy rides in a pill or bubble over the scene |
| 4 | **One object, one line.** The same stage each time and a single hero object | Cozy Couples `onb_h2lro`, `onb_ywigu`, `onb_ju2go`; Opal `onb_j01b2` to `onb_25n4j`; Locket `spl_blne4` | Each screen holds one idea. A consistent stage reads as one place |
| 5 | **Real UI as the hero, with one realistic example** | Structured `onb_3ypjz`; Superlist (Daily To-Do card); BitePal `spl_ylgn1` (310 kcal chip); MyFitnessPal `spl_1lwn7` (one protein chart over a photo); Widgetsmith empty state `oth_7nrh0` (a dog photo, a ticking clock) | Users recognise the thing later. Clearly an example, not a wall of data |
| 6 | **One stage, cycling content.** Many features without a swipe | ThetaWave `spl_uas7n` (notes, then flashcards, then mind map, on one card); Base44 `spl_4j9a1` ("Build [travel itinerary / budget tracker] app") | Shows breadth in one screen, so there is no carousel |
| 7 | **Places you page between** | Pokémon Sleep `oth_6vizp` (one island per page, with a nameplate and %); Duolingo ABC `oth_uadod`; ThetaWave `oth_a1a1m`; Focustown buildings on cloud plinths | A natural home for "areas of your life" |
| 8 | **Character holds the permission and previews what arrives** | Tolan `onb_e1jgd` ("like that new song they found for you"); Pengu ("From Pengu: I miss you today!"); Base44 `oth_0kehz` (a job line per connection) | The ask is explained by its output |
| 9 | **Trust shown as an object** | Bevel `onb_04gn0` (a vault on the sign-in screen: "Privacy by design") | A safe is a picture of "kept" |
| 10 | **Just-in-time sheets for secondary features** | Tiimo `oth_5cynw` (widget), `oth_mw3rb` (desktop), `oth_q8efr` (AI with mascot) | Keeps the first tour short |

## 3. Anti-patterns

| Anti-pattern | Examples | What goes wrong |
|---|---|---|
| The boring carousel | Bevel (5 dots, embossed "Your Connected Health Coach"); MyFitnessPal; Cozy Couples' dots | A slogan per slide. Users swipe without reading |
| Feature lists | SwingVision `onb_1rtn3`; RP `onb_xfi27`; Proactor `onb_of2gt`; Structured "helps you…" `onb_c21sr` | Icons plus abstractions, nothing to recognise |
| Feature clouds | ChatPod `spl_sjp8v` (bubbles: "Summarize any text"); Chatbot `spl_gqa6t` (floating 3D email and calendar icons) | Capability without a job or a person |
| Coach-mark tours of empty screens | Livity `oth_wupof` (13 steps over "No data yet"); Loopy Pro (11 popovers) | Teaches controls before there is anything to control |
| Asking before explaining | Any.do permission on the welcome screen `spl_tydnz`; Partiful phone on screen 1; Focustown's 30-screen survey after a lovely arrival | Spends goodwill and switches the world off |
| Blank composer | Gemini `spl_v5y0o` ("What can I help with, Paul?" plus a disclaimer); Perplexity `spl_du1aj` | Hands the job back to the user |
| Brand mush | Tiimo "All-in-one planning and productivity"; Any.do "Organize it all"; "Personal AI Assistant" | True of everything |
| Heavy first load | Pokémon Sleep: 510 MB download first | Kills the arrival |

## 4. One-line positioning

| App | Line | Source | What it does |
|---|---|---|---|
| Flighty | "World's Fastest Delay Alerts"; "The flight tracker your pilot uses." | O (App Store) | A claim from the user's own world. Good |
| Locket | "Live pics from your friends, on your home screen" | O (in app) | Noun plus place. Best |
| Tolan | "alien best friend" (store name: "Your Friendly Guide") | O | A relationship noun. Good |
| Focus Friend | "ADHD-friendly Focus Timer" | O (store subtitle via Appllama) | Who it is for plus a plain noun |
| Opal | "Focus, App Blocker & Timer"; in app: "I'll help protect your focus." | O | The in-app line beats the store line |
| one sec | "App Blocker & Website Limits"; in app: "saves 2 hours every day" | O | Outcome in numbers |
| Partiful | "Event Invites & RSVP Tracker" | O | Plain nouns |
| Structured | "Visual Calendar & Organizer"; in app: "A Timeline of your day" | O | The in-app line names the one object |
| Bevel | "Exercise, Sleep & Nutrition"; in app: "Your Connected Health Coach" | O | A list, then a vague role |
| BitePal | "AI Scan Meals & Easy Tracking"; in app: "Reach your weight goals … with cute raccoon" | O | The character is named as a feature |
| Widgetsmith | "Widgets + Themes + Wallpapers" | O | A list |
| Finch, Duolingo | "Self-Care Pet"; "Learn Languages" | O (store names) | Genre in two words; category |

**What the good ones share.** A concrete noun, where it lives or whom it is for, and no list. The best in-app lines are in the first person and use one verb: "I'll help protect your focus."

## 5. How character-led apps state the job

| App | Job line | Lesson |
|---|---|---|
| Focus Friend | "When you put your phone down, I can focus on my knitting." | Mutual need. The strongest line studied |
| Cat On Chair | "I'll be keeping you company while you focus." | A myth first ("they say…"), then the job |
| Opal | "I'll help protect your focus." | First person, one verb |
| Ollie (video) | "juggles your eight things so you only have to hold one." | The body explains the job |
| Pokémon Sleep | Snorlax grows as you sleep (official site) | The world reflects the user's behaviour |
| Bevel | "Bevel is your health coach, helping you track fitness, nutrition, and sleep." | Third person and a list. Weak |
| Base44 | "An extra hand for your everyday." | Metaphor without a verb |

**Rule.** The job line is first person, has one verb, and names the user's half. Keep's equivalent: "I hold what you put off, so you don't have to."

## 6. Later's current front door, judged against this

The front door is in `prototype-v3`, walked at 390×844. Screen 1 is "Say later. It comes back ready." with Tap to start. Screen 2 is already a task: "What have you been putting off?", with a text box and chips.

| Test | Later today |
|---|---|
| Says plainly what it is | **No.** The tagline is a pun. "AI" and "does things for you" never appear before the ask |
| Explains before asking | **No.** It asks on screen 2 (Partiful's order without Partiful's invite) |
| Introduces Keep's job | Only implied. Keep is a small dark card in the corner: decoration, by the video's test |
| Crew | Introduced as rule output mid-task ("Ledger checks the money. This one's for Ledger.") |
| Spaces | First seen at step 13 ("Here's what I found") |
| Cards | Shown as a form-like plan, not as the deck card used in the app |
| Later | Good: a real return time. But the horizon is a pale line, not a place |
| Your yes | Good: the real approval layout, labelled as practice |
| Templates | **Absent** |
| Own account | Good copy with the cost stated ("About ten minutes on a computer"), but it is screen 7 |
| World | None. The same pale wash and the same layout on every step. Keep is mute in the scenery |

**Verdict.** The mechanics and honesty are right; the order is wrong and there is no place. It is a form with a mascot. Put patterns 1 to 5 in front of the existing hand-over rather than rewriting it.

## 7. Widgets and notifications worth using

| Pattern | Example | Use for Later |
|---|---|---|
| The widget is the product and is set up in onboarding | Locket `onb_0e7v9` ("Finally, add the widget") | Offer the lock-screen widget right after the first card returns, not in the tour |
| "It finds you" | Blessed `onb_d0sjg`: "God's Word finds you. No tapping required." | "What needs you finds you." |
| Mascot inside the widget | Luvu `onb_hw8y7`, with a Later link; lock-screen complications (I am `oth_hg30b`, Vocabulary `oth_evd4e`) | Keep's tower with a count. Clay means needs you |
| A sample notification in the character's voice before the ask | Pengu ("I miss you today!"); Tolan `onb_e1jgd` | Show one real-shaped Keep notification on the permission screen |
| Specific, timed, self-limiting (video notes) | Opal "You've been on Instagram for 15 minutes…"; Duolingo "We'll stop sending them for now." | Names, amounts, times; stop when ignored |

**Copy rules.** The sender is Keep or a crew member. There is one fact and one consequence. It never says "Don't forget" and never uses an exclamation mark.
