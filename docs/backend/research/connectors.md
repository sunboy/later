# Research: connector catalogue (2026-11-12)

Purpose: evidence for `../plan.md` section 7.

Tags: **[O]** official page read today through a summarising fetcher (recheck before hard-coding); **[R]** already recorded in `docs/architecture.md` or the spikes, with the tag it carries there; **[S]** secondary source; **[?]** could not confirm. No account was created and no connection was attempted.

## 1. Catalogue

| Service | Public API | Sign-in a single user can complete | MCP server | Terms and limits that matter | Realistic path for Later | Tag |
|---|---|---|---|---|---|---|
| **Gmail** (app password) | IMAP and SMTP | App password; needs 2-Step Verification; blocked on some Workspace and Advanced Protection accounts | No | Full-mailbox credential; cannot be narrowed; revoked on password change | v1 default (D21 path 1). Polling only | R [D] |
| **Gmail** (own OAuth client) | Gmail REST API | User creates a Google Cloud project and OAuth client | No first-party hosted server confirmed | `gmail.readonly`, `gmail.modify`, `gmail.compose`, `gmail.metadata` and `mail.google.com` are **restricted**; `gmail.send` is **sensitive**; `gmail.labels` is non-sensitive. `gmail.modify` "does not allow immediate, permanent deletion … bypassing the trash". A project in **Testing** status issues refresh tokens that **expire in 7 days**. Push needs a Cloud Pub/Sub topic and a `watch` renewed at least every 7 days | v1.5 advanced path. Request `gmail.modify` + `gmail.send`, never `mail.google.com` | O |
| **Gmail** (broker) | Vendor API | Vendor account | Varies | Mail passes through the vendor | Later, clearly labelled | R [V/?] |
| **Google Calendar** (read) | Secret iCal address | Copy a URL from Calendar settings | No | Admin may hide it; freshness and contents undocumented; the URL is a credential | v1 | R [D/U] |
| **Google Calendar** (write) | Calendar REST API | Own OAuth client | Not confirmed | Scope classification is not on the scopes page read today; architecture records "reportedly sensitive" | With Gmail path 2 | O for scope names, ? for classification |
| **Microsoft 365 / Outlook.com calendar** | Microsoft Graph | Delegated OAuth with a user-registered Entra app | Not checked | `Calendars.Read` and `Calendars.ReadWrite` delegated: **no admin consent required**, **available to personal Microsoft accounts** | Next, after Gmail | O |
| **Microsoft 365 mail** | Microsoft Graph | As above | Not checked | `Mail.Read`, `Mail.ReadWrite`, `Mail.Send` rows were beyond the part of the page the fetcher read. Tenant admins can block user consent | Next; confirm the Mail rows first | ? |
| **Outlook / other calendars** (read) | Published ICS link | Copy a URL | No | As Google's | v1, same code as Google ICS | ? (not re-read; standard feature) |
| **Slack** | Web API; hosted MCP server at `https://mcp.slack.com/mcp` (Streamable HTTP; no SSE; **no Dynamic Client Registration**) | OAuth against a Slack app the user creates in their own workspace (an "internal" app). Workspace admins may have to approve | **Yes, first party** | "Only directory-published apps or internal apps may use MCP"; unlisted apps are prohibited. For commercially distributed non-Marketplace apps created after 29 May 2025, `conversations.history` and `conversations.replies` are limited to **1 request a minute, 15 objects**; "internal customer-built applications are not impacted". Write tools exist (`chat:write`, `canvases:write`, `files:write`, `reactions:write`) | v1.5: the user creates an internal Slack app from a manifest we supply. Read scopes by default; `chat:write` only when a routine needs it. A shared Later Slack app would have to be Marketplace-listed and reviewed (commercial tier) | O |
| **Notion** | REST API; hosted MCP server | OAuth | **Yes, first party** ("search your workspace, create and edit pages, and manage databases") | Workspace admins can manage MCP clients. Server URL, client-registration rules, delete tools and limits were not on the page read. The Agents SDK docs use `https://mcp.notion.so/mcp` as their example URL | v1.5 via MCP, with a reviewed tool profile | O for existence, ? for details |
| **Procare** | A third-party MCP project says a "Connect" API exists at `api-docs.procareconnect.com` with OAuth 2 client credentials created by a **centre administrator**; the page itself returned only a title today | None for parents found | No first party; one community server aimed at centres | Access is for the childcare centre, not the parent | **No parent API.** Use email and calendar fallbacks | S, ? |
| **Brightwheel** | None published: no developer portal, reference or self-serve access found | None | None | Terms reportedly forbid access to non-public areas without written consent | **Nothing.** Email fallback | S |
| **ClassDojo** | None today. ClassDojo's own page says it is "exploring" an API and MCP server for developers and "tech-savvy" parents: "This isn't available yet"; early-access sign-up | None today | Announced as an exploration, not available | — | **Nothing yet; watch.** The founder should join the early-access list | O |
| **Seesaw** | Nothing found | None | None | — | **Nothing.** Email fallback | ? |
| **ParentSquare** | Integrations are with school information systems and partners (API, SFTP); no public developer documentation found | None for parents | None | Data requests are redirected to the district | **Nothing.** Email and its own notification emails | S |
| **PowerSchool** | API exists but is enabled per district by an administrator who installs a plugin; reference behind a customer login | None for parents | A third-party connector aimed at districts | Parent access is the portal and mobile app with a school-issued id | **Nothing for parents.** Email digests, ICS if the district publishes one | S |
| **Canvas** | Full REST API, including observer (parent) endpoints. A token acts with its owner's permissions | Personal access token generated in the user's Canvas settings, **if the institution allows it**; OAuth developer keys are issued by the institution's admin | Not checked | Several institutions have disabled manual tokens; one university page says Instructure plans to deprecate API tokens in the first half of 2027 (single secondary source) | **Possible, school by school.** Offer as an advanced connector with a self-test; ICS calendar feed as the fallback | O for the API, S for the restrictions |
| **Google Classroom** | Classroom API | OAuth; scopes cover a user's **own** guardians and guardians of students the user **teaches or administers** | No | No documented method for a guardian to read their child's coursework. Guardians are described as people who receive information about a student's courses | **Nothing for parents by API.** Guardian summary emails via the mailbox | O |

## 2. The long tail: what actually works

Seven of the eight daycare and school products the founder named offer a parent no programmatic access today. All of them communicate with parents by **email** and several by **calendar feed**. The practical connectors are therefore generic:

| Generic connector | How it works | Requirements | Limits | Tag |
|---|---|---|---|---|
| **Sender rules on the connected mailbox** | The user names a service ("Procare", "school"); Later matches its sending domains and files that mail into a Space with its own routine | A connected mailbox | Only what the service chooses to email; some send "you have a new message, open the app" with no content | J |
| **Subscribed calendar (ICS)** | Paste the feed address a school or app publishes | The feed exists | Read-only, possibly stale | R [D/U] |
| **Forwarding address** | Mail forwarded to an address that a Cloudflare Email Worker in the user's account receives (`email()` handler; 25 MiB inbound limit; DMARC checked before the Worker runs) | **A domain on Cloudflare DNS in the user's account** ("You must be using Cloudflare DNS to use Email Service"). Not available on a bare `workers.dev` install | Excludes most default users; useful for power users and for a partner's mailbox | O |
| **Share to Later** | Share sheet, paste, photo of a paper letter, into Capture | The installed web app (Web Share Target support varies by platform) | Manual | ? |
| **Logged-in browser session** | An agent drives the parent portal | Cloudflare Browser Rendering (10 minutes a day on Free [R, V]); stored portal password | Breaks on login challenges; likely against several vendors' terms; architecture already keeps logged-in errands out of v1 | R |
| **Phone notifications** | Read the app's push notifications | A native Android app with notification access; not possible for a web app or on iOS | Not available to v1 clients | J |

## 3. Consequences recorded in the plan

1. The onboarding promise for daycare and school apps is "**anything that emails you**", with the catalogue naming each product and stating plainly that it is read from its emails.
2. Slack and Notion arrive as **MCP connectors with a Later-authored tool profile**; the profile, not the server, assigns risk tier, egress and privacy flags.
3. Gmail's OAuth scopes let the provider itself forbid permanent deletion (`gmail.modify`). The app-password path cannot, so the mail transport interface has no permanent-delete operation at all.
4. A shared one-click Slack or Google app is a reviewed, listed, commercial offering in both ecosystems; it cannot be part of the free default.

## 4. Sources

- Gmail scopes: https://developers.google.com/workspace/gmail/api/auth/scopes
- Gmail push: https://developers.google.com/workspace/gmail/api/guides/push
- Google OAuth token expiry: https://developers.google.com/identity/protocols/oauth2
- Calendar scopes: https://developers.google.com/workspace/calendar/api/auth
- Classroom guardians: https://developers.google.com/workspace/classroom/guides/manage-guardians
- Microsoft Graph permissions: https://learn.microsoft.com/en-us/graph/permissions-reference (first 100,000 characters only)
- Slack MCP: https://docs.slack.dev/ai/slack-mcp-server/
- Slack rate limits: https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps/
- Notion MCP: https://developers.notion.com/docs/mcp
- ClassDojo: https://www.classdojo.com/classdojo-api-mcp/
- Procare: https://api-docs.procareconnect.com/ (title only); https://images.glama.ai/mcp/servers/sanjibani/procare-mcp (secondary)
- Brightwheel: https://providers.apievangelist.com/providers/brightwheel/ , https://www.xpay.sh/agent-ready-index/brightwheel/ (secondary)
- PowerSchool: https://help.powerschool.com/t5/Community-Forum/PowerSchool-API-for-3rd-Party-vendors/m-p/542429 , https://ibl.ai/developer/connectors/powerschool-sis.md (secondary)
- ParentSquare: https://parentsquare.com/partners (secondary reading of partner pages)
- Canvas: https://developerdocs.instructure.com/services/canvas/file.all_resources/user_observees , https://developerdocs.instructure.com/services/canvas/oauth2/file.oauth , https://learn.canvas.cornell.edu/canvas-api-access-tokens , https://tdx.umsystem.edu/TDClient/66/MOOnline/KB/ArticleDet?ID=2193 (secondary)
- Cloudflare Email: https://developers.cloudflare.com/email-routing/email-workers/ , https://developers.cloudflare.com/email-routing/get-started/enable-email-routing/

## 5. Open items

- Microsoft Graph mail permission rows; tenant consent defaults.
- Notion MCP URL, client registration, delete tools.
- Whether a user-created internal Slack app can be installed by a non-admin in typical workspaces.
- Seesaw: no evidence either way.
- Whether any of the school products' terms forbid automated reading of their notification emails by the recipient's own software (none found; unlikely, not confirmed).
- Web Share Target behaviour on iOS for the installed web app.
