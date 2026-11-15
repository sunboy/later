# How personal agents and immersive apps onboard a new user

Research only. Compiled 15 November 2026 for Later's onboarding design. Claim tags: **[O]** official source, **[S]** secondary (reviews, press, tutorials), **[X]** could not confirm. No third-party screenshots are in the repository; working copies sit in the session scratchpad.

## 0. Method, coverage and honest gaps

- **Appllama** (about 45 of the 220 credits spent). In the library: Tolan, Finch, Duolingo, Wabi, Copilot Money, Monarch, Claude, ChatGPT, Gemini, Grok (the ordinary app, not Grok Bot), Meta AI (the older app, not Muse). **Not in the library** after several searches: Meta Muse, Claude Duet, OpenAI Dots, Grok Bot, Instinct, Town, Fo/Wajo, OpenClaw, Acorns, Cleo.
- **Images viewed in full:** Tolan (17 of 26 stills, plus metadata for the rest), Finch (6 stills, metadata for 20 of 42), Duolingo (4 stills, metadata for 20 of 32), Wabi (4 stills, metadata for all 10 onboarding screens). Copilot, Monarch, Claude, Meta AI and Grok are **metadata only** (screen names, element tags, colours). Flow videos could not be played. ChatGPT and Gemini were not walked.
- **Half A is mostly written, not seen.** No hands-on walkthrough with screens exists for any of these agents in the sources found. Several reviewers say they could not verify the live sign-up screens.

## 1. Which products the founder meant

| Dictation | Best identification | Confidence |
|---|---|---|
| "Muse" | Meta Muse, personal agent launched 8 Sept 2026, US and Canada, adults only [S] | High |
| "Fo" / "Flow" / "Wajo" | **Fo, the first consumer agent from Wajo** (San Francisco; founder Shivani Poddar, ex-Google/DeepMind; backed by Vinod Khosla). Alpha 25 Aug, public 28 Sept 2026. Works through iMessage and WhatsApp plus a web page of task cards [S: TechCrunch, Product Hunt, CryptoBriefing] | High that Wajo/Fo is the product. **Fo is the agent's name; a visual mascot is not mentioned in any source found [X].** The only mascot coverage in results was Muse's (Fast Company, "kawaii era", page blocked, headline only). Closest other candidate: Wabi (Replika founder, "AI assistant that gets your life organized"), which is in the library but has no character called Fo. |
| "Robot" | Grok Bot (xAI/SpaceXAI, beta 11 Aug 2026, Mac/iOS/PC) [S] | About 85 per cent |
| "Instinct" | Instinct, Spear Street Technology, a text-first agent with no app [S] | High |
| "Acorns" | Acorns investing app, not in the library; web only | High |

## 2. Half A: personal agents

| Product | Opening and entry | Setup sequence | Access asks | Personalisation | First value | Character |
|---|---|---|---|---|---|---|
| **Meta Muse** [S] | App Store or web, US/Canada, 18+, no invite; card required even on free tier (TechCrunch via a secondary guide) | One guide says: asks your name, lets you name the agent, prompts you to connect accounts. A second tutorial could not confirm this [X]. Recommended: set permissions defaults first, then "Connect my Gmail" in chat or Settings | Read-only option offered. Defaults "Ask for some actions" or "Always ask". Approval card: Allow once / for this task / for this site / Always / Deny. Training on by default, opt-out | Agent name (disputed) | First task is typically a scoped chat request; first approval card asks to read Gmail. No timing | Praised as "best-designed personal agent I've tested" (Lenny's); polish and cute character, no screens seen |
| **Claude Duet** [O help article] | Waitlist form (name, email, plan, phone type, optional "what would you hand off first"), invite email, TestFlight/Play tester, sign in with Claude | Uses connectors already set up; you start each connection; decide on past-chat search; read about approvals; send first task | Connectors you start yourself, disconnect any time. Approvals before sending, paying, signing, deleting; unapproved items return later. One-time card per purchase | None: no naming, no model choice | Suggested first tasks: sort inbox, brief for a meeting. Tasks tab shows work and "needs your input" | None. Reviewers: plan limits burn fast |
| **OpenAI Dots** [S] | Created on desktop only, Pro/Business Premium at launch | Intro, connect apps, name and style the dot, "talk through your priorities" as an interview. About 5 minutes of setup | Connections, permissions and instructions are separate decisions. Local computer access optional, off by default | Name, coloured avatar, personality via interview. Looks took longer than setup | Reviewer's first reply was sent **without review** and sounded like him; he then asked to see outgoing mail | Blue character in an iMessage-style thread; "giving him a face made me feel more attached" |
| **Grok Bot** [S] | Dedicated Mac/iOS app; paid tiers; onboarding runs through Cursor infrastructure | Create persistent bots with roles ("Chief of Staff", "Expense Manager"); teach by demonstration, saved as a routine | Bots sign in to your apps; mechanism unexplained [X] | Role per bot | Not documented [X] | Not documented [X] |
| **Instinct** [S] | No app: phone number plus SMS code at app.instinct.com, invite or waitlist | Then connect Google Workspace and others; text via iMessage/WhatsApp or call; Mac app and web workspace for settings | Broad (mail, calendar, screen, location). Terms backlash then revision. Purchases use a one-time Stripe Link card; no published approval for email or sharing | None found | Proactive texts. Praise: "most proactive agent I've used". Criticism: changed a seat, one chat thread for unrelated tasks | None |
| **Town** [S: Town docs and reviews] | Sign in | Name the assistant (it gets its own email address), connect Gmail, enable a first routine (Auto-inbox suggested), choose how much it checks with you | Gmail connection; nothing sends without OK by default | Assistant name ("Townie") | No hands-on account of the first five minutes found [X] | Named assistant |
| **Fo (Wajo)** [S] | iMessage or WhatsApp; invite-only OG plan, free Fo Mini | Not described in any source [X]. Connecting Google Workspace builds context over time | Own phone number, email and single-use virtual cards; real identity hidden from merchants. Founder asks launch commenters where trust broke | Not documented [X] | Test: Fo called an airline about upgrades (worked); a call to a partner about feeding cats "didn't go smoothly". Early users cite a forgotten trial found, a voucher found | Name only; mascot [X] |
| **OpenClaw** | Not researched beyond `docs/architecture.md`: each user makes their own Google OAuth client | [X] | [X] | [X] | [X] | [X] |

Library neighbours for context: the **Grok** app has only 3 onboarding screens (terms update, then a home with suggestion chips). The **Meta AI** app has 9, eight of them account creation, ending on a starter-prompt list. **Claude** has 8: serif headline and line artwork, sign-in, email check, terms, age notice, age-range permission, name, training consent. Progress dots and a soft pink gradient only. None teaches a concept.

## 3. Half B: immersive onboarding

### Tolan (full walk, 26 screens)

| # | Screen (what is shown) | Words | User does |
|---|---|---|---|
| 1 | Off-white splash, wordmark only | 1 | wait |
| 2 | Dark starfield, big "Tolan", "alien best friend", round white arrow | 4 | tap |
| 3 | Painted forest at night, blue alien playing a banjo, "Volume up" hint (voiced) | 3 | tap |
| 4-5 | Same scene, caption pill: "Welcome, traveler. Tolans are smart, curious little aliens" | 9 | watch |
| 6-9 | Starfield, glowing orb clusters and light trails. Oracle appears as a blurry particle figure with two eyes: "I am the Oracle, here to find the perfect Tolan for you. Let's get started!" | 17, split over pills | watch |
| 10 | **"What's your name?"** plus terms line, round arrow | 6 | type |
| 11 | "How old are you?" wheel picker | 4 | scroll |
| 12 | **Notification primer**: custom card with a flower-headed mascot, "You'll get messages from your Tolan, like that new song they found for you, or an update from their world", then the iOS alert, caption "Let's make sure your Tolan can reach you" | 25 | allow |
| 13-17 | **"Finding your Tolan"**: the Oracle grows a ring of lights. "There are so many Tolans out there, each...", "Every light represents a possible Tolan match. Now," | 20 | watch |
| 18 | Two chat bubbles tilt in: "Tap to text" or "Tap to talk" | 6 | choose |
| 19-20 | Oracle chat: "What's a goal or dream you have? It could be small... or large..." then, after a typed reply, a tailored answer and "what's your obsession?" | 40 plus | talk |

- First ask is at screen 10 (name), the first permission at 12. No sign-in or email in the screens captured. Not timed. Planet and the match reveal fall outside the library capture [X].
- **Concepts are felt, not explained**: "match" becomes lights, "reading" becomes a conversation with the Oracle, the notification ask is justified by the creature's world ("a new song they found").
- Illustrated world first (2D, painted, warm), then a abstract 3D particle figure on near-black. Subtitles as black pills carry the story; audio is expected.

### Others walked

| App | Sequence in brief | Concept introduction | First ask and framing | Real UI first appears | Immersion technique | Cost |
|---|---|---|---|---|---|---|
| **Finch** (42 screens) | Mascot + "Your new self-care best friend", button "Hatch a new pet" → pick an egg colour ("Finches are lively, social...") → **"Almost ready to hatch! Create an account to hatch your Finch, find friends, and save your progress"** (phone) → cracking egg → burst "You hatched a birb!" → name it, pick its trait ("Sun cares about...") → many short choice screens | Pet as object; each choice is about the pet | Account at screen 4, reframed as hatching | After about 40 screens | Ritual plus ownership: you make a thing before you are asked for anything | Flat colour, simple vector animals; cheap |
| **Duolingo** (32) | Owl logo, "Learn for free. Forever." → "Hi there! I'm Duo!" → language → "How much Japanese do you know?" in Duo's speech bubble → fake "Course building... join 3 million people" → goals, motivation, daily goal → notification primer with a pointer arrow to the system alert → widget prompt → benefits | Mascot speaks every question | Notifications after about 16 screens, preceded by a mock alert | Lessons start after the benefits screens | One speaking character on every screen, green progress bar, chunky buttons | Cheap once the mascot exists |
| **Wabi** (7 welcome, 10 onboarding) | 3D glossy bubbles cascade over a "+" orb, "The AI assistant that gets your life organized", "Swipe up to explore"; sign-in (Google, Apple, phone) is the welcome | Bubbles stand for mini-apps | Phone, OTP, tracking prompt, name (skippable), avatar | Not in onboarding | One striking object on empty off-white; motion on sign-in | Medium (3D bubbles) |
| **Copilot Money** (10, metadata) | Isometric video → account → email check → privacy and security (Face ID, two-factor) → **dashboard with a Demo Mode banner and a dashed "add account" tile** → link modal → notification preferences shown as sample alert cards → transaction guide with an "AI" badge | Shows the finished product with fake data | Bank link after the demo | At screen 6, as a demo | Seeing the destination before the ask | Cheap if real UI exists |
| **Monarch** (7, metadata) | Step counter, email, six-box code, password checklist, goal pills, name | Goal pills only | Account first | After onboarding | Typographic restraint, one orange accent | Cheapest |
| **Claude** / **Meta AI** / **Grok** | See section 2 | None | Terms, age, training consent up front | Home after sign-in | None | n/a |
| **Acorns** (web only, not in library) | Welcome animation → link bank (2 screens) → success → portfolio exercise with recommended portfolio, animated checkmark and projected-growth graph → short feature video [S: Appcues teardown]. A usability review counts five screens that explain the premise, main use case and the app's own terms [S] | Premise and vocabulary taught before the money ask | Bank link inside a guided path | Portfolio screen | Guided single path, small payoff animations | Light |

Acorns' "round-ups" and "acorn to oak" wording could not be confirmed [X].

## 4. Synthesis

### 4.1 Comparison (selected)

| Product | Screens to first ask | Access ask framing | Character | Personalisation | First value |
|---|---|---|---|---|---|
| Tolan | 10 (name) | In-world reason, custom card then system alert | Painted alien, particle Oracle | Name, age, spoken goals | Oracle conversation |
| Finch | 4 | "Hatch your Finch" | Pet bird | Egg, name, trait | Hatching |
| Duolingo | 5 (language) | Mock alert with arrow | Owl speaks | Level, goals | Lesson |
| Wabi | 0 (sign-in on welcome) | Standard | Bubbles | Name, avatar | Not in onboarding |
| Copilot | 1 (account) | Demo first, then link | None | Notification choices | Demo dashboard |
| Muse, Dots, Town, Duet | Name and connect | Approval cards, "ask first" defaults | Muse and Dots avatars [S] | Agent name and look | Task, minutes [S] |
| Instinct, Fo | Phone number | Texting | None | None found | First text task |

### 4.2 Common skeleton

Agents: eligibility or invite → sign in → name yourself or the agent → connect one account → permission defaults → first small task → approvals appear in use. Immersive apps: a world first, a small promise, a personal choice, a reveal, then permissions justified in the world's terms.

Where they differ: agents ask for access **before** showing anything; immersive apps make something with you first. Agents explain trust in settings; immersive apps do not explain trust at all.

### 4.3 Best moves

1. **Make a thing before asking for anything** (Finch). The account request becomes "to hatch your Finch". Cheap, works with a flat egg.
2. **Justify the permission in the product's own story** (Tolan notification card, Duolingo mock alert). The user sees the system alert second, already agreeing.
3. **Show the finished product with fake data before the connect step** (Copilot demo banner). Fits a card-based product.
4. **Approvals as a first-class, graded concept** (Muse "Always ask / Ask for some", Duet "returns later"). Names and limits made concrete.

### 4.4 What all of them do poorly or skip

- No agent shows **what it did, what it is waiting on, and what it will never do without a yes** as one early picture. Approvals appear mid-task.
- Concepts (memory, routines, connectors) are listed, not demonstrated.
- The first real task is the user's homework; Dots' first sent-without-review reply is the cautionary case.
- No agent explains **where it runs** or who can see the data in an early screen. Instinct and Muse put training defaults in settings.
- Agents have names and avatars but no **world**; immersive apps have worlds but no real work.

### 4.5 What fits Later

| Later concept | Fits | Does not fit |
|---|---|---|
| Mascot and crew (Keep) | Duolingo's speaking character; Finch's hatching; Tolan's captions as pills | Tolan's 3D particle Oracle and painted world (heavy art); naming that implies a person Keep is not |
| Spaces | Wabi's single sorting object; Copilot demo | Long quizzes |
| Cards, "your yes" | Copilot sample alert cards; Muse approval vocabulary | Settings-only trust |
| Later | Tolan's "a new song they found for you" notification justification | |
| Runs in your account | Needs its own steps; no reference exists | Hidden behind consent text (Claude, Instinct pattern) |
| Templates | Finch's choose-a-trait | Stores before a first card |

### 4.6 Immersion without heavy art, ranked

1. **One speaking character on a flat colour field** (Duolingo, Finch). Every question in a bubble.
2. **Reframe the account step as an in-world action** (Finch, screen 3-4).
3. **Subtitle pills over a still scene** (Tolan screens 4-9): words arrive on a timer.
4. **Giant type on empty space** (Tolan splash, Wabi welcome).
5. **A fake-progress screen with a social-proof line** (Duolingo "Course building").
6. **Sample cards in the real UI** (Copilot notification preferences).
7. **Round primary button, one per screen** (Tolan, Duolingo).
Needs heavy art: Tolan's painted forest and particle figure; Wabi's glossy 3D bubbles.

### 4.7 Pairing table for Later

| Later concept | Best reference | Technique to borrow |
|---|---|---|
| What the app is | Wabi welcome line; Tolan splash | One short sentence over one object |
| Keep | Duolingo, Finch | Speech bubble and a small ritual |
| The crew | Grok Bot roles ("Chief of Staff") | Name by job, not by technology |
| Spaces | Copilot dashed "add" tile | Empty tiles the user fills |
| Cards | Copilot sample alert cards | Real card, fake data |
| Later | Tolan notification card | Tie the ask to a promised return |
| Your yes | Muse approval card; Duet "returns later" | Show a held card and its hash-bound approval |
| Templates | Finch trait picker | One pick, visible effect |
| Runs in your account | None | Design from scratch; show the account as the home |

### 4.8 What Half A could learn from Half B

Agents skip the **make-first ritual**, the **in-story permission ask**, the **demo before connect**, and **characters that carry every screen**. The gap we can take: an agent that has a small world and a speaking character, shows a sample card before any connection, frames every access ask as a return promise, and makes "nothing leaves without your yes" visible in the first minute.

## 5. Sources

- Claude Duet help article [O]: https://support.claude.com/en/articles/17631495-getting-started-with-claude-duet
- Muse: https://theneuron.ai/explainer-articles/how-to-get-started-with-meta-muse/ ; https://www.datacamp.com/tutorial/meta-muse-tutorial ; https://www.lennysnewsletter.com/p/muse-review-the-personal-ai-agent ; https://www.fastcompany.com/91612532/with-metas-muse-charm-ai-enters-its-kawaii-era (blocked)
- Dots: https://www.theneuron.ai/explainer-articles/openai-dots-hands-on-review-herman/ ; https://techcrunch.com/2026/09/29/openai-launches-dots-its-bubbly-agentic-avatar/
- Grok Bot: https://venturebeat.com/ai/spacexais-grok-bot-turns-agents-into-persistent-digital-coworkers-that-can-operate-your-apps-for-120-per-month/
- Instinct: https://www.eesel.ai/blog/instinct-ai-review
- Town: https://www.town.com/docs ; https://www.saner.ai/blogs/town-review
- Fo/Wajo: https://techcrunch.com/?p=3173682 ; https://www.producthunt.com/products/wajo ; https://cryptobriefing.com/vinod-khosla-backs-wajo-fo-ai-agent/
- Wabi: https://techcrunch.com/2026/09/29/ai-powered-app-maker-wabi-pivots-to-a-messaging-experience/
- Acorns: https://goodux.appcues.com/blog/acorns-seamless-account-setup
- Appllama library: Tolan 6477549878, Finch 1528595748, Duolingo 570060128, Wabi 6747768928, Copilot 1447330651, Monarch 1459319842, Claude 6473753684, Grok 6670324846, Meta AI 1558240027.
