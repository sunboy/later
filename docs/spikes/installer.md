# Spike: installing Later into the user's Cloudflare account (2026-11-11)

Tags: [O] official Cloudflare docs, [S] secondary, [?] could not confirm, [T] my own curl test today. No account was used; nothing was deployed.

## Verdicts

**1. OAuth: GO WITH CONSTRAINTS.**
- Register under Manage account > OAuth clients [O]. New clients are private: only members of the creating account can authorize. Public needs name, logo, client URL, scopes and a DNS TXT domain verification (`cloudflare_oauth_client_publisher=`). Promotion is permanent [O]. No review process or user cap is documented [?].
- Public (desktop/browser) clients use Authorization Code + PKCE S256, auth method `none`. Client credentials, device and implicit are not supported for self-managed clients [O]. Redirect URIs are an exact-match list; a custom scheme is rejected, loopback `127.0.0.1` works [S].
- Scope names equal token permission names; list at `GET /client/v4/oauth/scopes`, which needs auth [O]. `workers-scripts.write` exists [S]. Optional scopes let users decline some at consent [O].
- (a)(b)(e)(f): script upload needs Workers Scripts Write [O]. Durable Objects have no separate permission group in the token list [O]. Secrets, workers.dev and cron endpoint pages state no permission [?].
- (c): D1, KV, R2, Queues and Vectorize permission groups exist [O]. Whether each is exposed as an OAuth scope is [?].
- Risk: an open issue reports Workers Scripts Write was non-selectable for Cloudflare's own CLI client's account-token delegation. Cloudflare has not answered [S, cloudflare/developer-platform#87].
- Lifetime of OAuth tokens is undocumented [?]; one user saw about 1 hour [S]. Refresh needs `offline_access`.

**2. API-token fallback: GO.**
- Account permissions: Workers Scripts Edit, Workers KV Storage Edit, D1 Edit, Workers R2 Storage Edit, Queues Edit, Vectorize Edit, Account Settings Read. Optional: Workers Tail Read. No Durable Object permission exists [O]. Whether Account Settings Read is enough to create the account workers.dev subdomain is [?].
- Prefill link exists [O]: `https://dash.cloudflare.com/?to=/:account/api-tokens&permissionGroupKeys=<urlencoded JSON [{"key":"..","type":"edit"}]>&name=Later`. The short keys for these groups are not published; take them from the List permission groups API and test in a browser.

**3. Upload without wrangler: GO WITH CONSTRAINTS (desktop only).**
- `PUT /accounts/{id}/workers/scripts/{name}` is multipart. The `metadata` part holds `main_module`, `bindings`, `compatibility_date`, `compatibility_flags`, `migrations` (`new_sqlite_classes`, `old_tag`) or the newer `exports`, and `annotations`. Modules go as `application/javascript+module` parts [O].
- Desktop calls the API natively (no relay) and discards the token after install; a browser-only path needs a relay or bootstrap Worker [?].
- [T] `OPTIONS api.cloudflare.com/client/v4/accounts` returns 400 "Method OPTIONS not available", and API responses carry no `Access-Control-Allow-Origin`. Browser calls with an Authorization header will fail. Treat a pure web page as unable to call the API. CORS on the OAuth token endpoint is inconclusive [?].
- Cleanest hosting-free design: the desktop app installs. The Worker then updates itself, Appflare-style, using a token or secret stored in its own account.

**4. "Deploy to Cloudflare": NO-GO for non-developers.**
- Cloudflare clones the repo into the user's GitHub or GitLab account and builds with Workers Builds [O]. The repo must be public and from github.com or gitlab.com [O].
- It provisions KV, D1, R2, Vectorize, Queues, Durable Objects, Workers AI and Secrets Store [O]. Secrets are prompted from `.dev.vars.example` [O].

**5. New accounts: GO WITH CONSTRAINTS.**
- No card is needed for the Free plan [S]. Email verification is required [O]. A 7-day wait applies only to additional Free accounts [O].
- SQLite Durable Objects are available on Free (100k requests/day, 100k rows written/day). The KV-backed kind is paid [O].
- Subdomain: each Worker gets a workers.dev route at creation [O]; the account subdomain (`PUT /workers/subdomain`) may not exist on a fresh account [?], so GET and create it.

**6. Updates: GO WITH CONSTRAINTS.**
- Versions carry a message and tag; you can roll back to any of the last 100 [O]. REST shapes for version and deployment creation are [?].
- Only one version of a Durable Object runs at a time, and lifecycle changes are atomic and cannot go gradual [O]. `versions upload` does not apply them.
- Policy: additive migrations only. Version the SQLite schema inside the object, for example with `PRAGMA user_version`. Never use `deleted` or `renamed`. Detect the installed version from an authenticated `/version` route and the version tag.

**7. Pairing: GO.**
- The installer creates the root secret as a Worker secret, and the desktop app holds it.
- Authenticate every route and rate-limit: workers.dev names are discoverable.
- The desktop asks `/pair/new` for a one-time code (128-bit, 5-minute TTL, single use). The QR encodes `later://pair?u=<workers.dev URL>&c=<code>`.
- The phone generates a keypair, posts its public key with the code, and the Worker stores it with a device id. Later requests are signed or use short-lived tokens. Revoke from the desktop.
- Access (free) is NO-GO as the default: onboarding requires payment details even for Free [O], and native clients need service tokens or mTLS [inference].

**8. Comparables: Appflare (appflare.dev, github.com/appflare/deploy).**
- A hosted deploy page installs one Worker after a Cloudflare sign-in, with no token or git repository. The Worker then updates itself, and an API token is requested in its wizard. Study this flow. The Deploy-button apps listed in awesome-cloudflare-selfhosted show the developer path.

Gating items: OAuth scopes for D1/KV/R2/Queues/Vectorize/Scripts and token lifetime with a real client; issue #87; fresh-account subdomain.

## Recommended flow (desktop-first)
1. Download and install the app (OS warning). 2. If there is no Cloudflare account: sign up and verify email (about 3 actions). 3. Click Connect Cloudflare. 4. Approve consent and pick the account. 5. Wait about 60 seconds while the app creates the resources, subdomain and Worker. 6. Scan the pairing QR on the phone.

That is about 5 actions with an account and about 9 without. If OAuth scopes fail, fall back to a prefilled token link plus a paste, which adds 3 to 4 actions.

Main drop-offs, in order: Cloudflare signup and email verification; desktop download; the consent screen (an unverified shield until the domain is verified); token fallback; and Free-plan CPU limits after install.


## Sources
- https://developers.cloudflare.com/changelog/post/2026-06-03-public-oauth-clients/
- https://developers.cloudflare.com/fundamentals/oauth/create-an-oauth-client/
- https://developers.cloudflare.com/fundamentals/oauth/authorizing-an-application/
- https://blog.cloudflare.com/task-based-oauth-consent/
- https://github.com/cloudflare/developer-platform/issues/87
- https://www.ubitools.com/cloudflare-oauth-client/
- https://developers.cloudflare.com/fundamentals/api/reference/permissions/
- https://developers.cloudflare.com/fundamentals/api/reference/template/
- https://developers.cloudflare.com/fundamentals/api/how-to/account-owned-token-template
- https://developers.cloudflare.com/api/resources/workers/subresources/scripts/methods/update/
- https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/
- https://developers.cloudflare.com/durable-objects/platform/known-issues/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/workers/configuration/versions-and-deployments/
- https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/
- https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/
- https://developers.cloudflare.com/workers/platform/deploy-buttons/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- https://developers.cloudflare.com/api/resources/workers/subresources/subdomains/
- https://developers.cloudflare.com/fundamentals/setup/account/create-account/
- https://developers.cloudflare.com/cloudflare-one/setup/
- https://developers.cloudflare.com/changelog/post/2026-10-01-artifacts-open-beta/
- https://appflare.dev/ and https://github.com/appflare/deploy
