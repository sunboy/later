# Builder briefs

Two build packages, each to hand verbatim to one Opus builder. They touch different folders and can run in parallel.

| Brief | Folder it owns | Publishes to |
|---|---|---|
| `mascot-concepts.md` | `design/mascots/` | https://claude.ai/artifact/4VHg8EV2nk5ozB3jDwb1eJ (same URL) |
| `prototype-v4.md` | `design/prototype-v3/` | https://claude.ai/artifact/3wJVi91KkktbSajzbggFco (same URL) |

Status note from the UI lead. Before the architect's instruction not to build arrived, the UI lead had already built a first pass of both packages. It is in commit `a1c1a88` ("Snapshot in-progress UI direction work"). The mascot sheet from that pass is published at the URL above. The prototype pass is built in `design/prototype-v3/dist/index.html` and has **not** been published to the founder's URL. Each brief says how to treat that pass: as the starting point by default, or to be discarded if the architect prefers a clean build (`git checkout 3a7ef72 -- design/prototype-v3` and delete `design/mascots/`).

Both builders: read `/home/user/later/CLAUDE.md` and `/home/user/later/design/ui-direction.md` first. Do not git commit. Work only inside your folder. Do not touch `docs/`. Never commit third-party screenshots. Do not add dependencies. Do not run the `libraries-dev` Pro install, and do not use `hallmark` beyond its Floor checks.
