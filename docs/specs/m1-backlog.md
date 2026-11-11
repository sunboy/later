# M1 backlog (carried from M0 review)

Items deferred when M0 was closed. Each needs a decision in the M1 spec.

1. **Recipient confirmation must not survive edits.** `recipientConfirmed` is a plain flag. Replace it with a hash of the confirmed recipient set, and offer `send` only when it matches the draft's current recipients.
2. **Per-Space allowlist of domains for open egress**, so a user-requested lookup during a run that has read mail does not need an approval every time. The allowlist is a user setting, never writable by an agent.
3. **Tool availability is fixed at run start.** A run that can read private data is never given model-provider server-side tools with open egress, because those execute outside the policy gate.
4. **Source URLs on cards produced by private, tainted runs** must be URLs a tool actually observed, not model-composed, so a link cannot carry private data in its query string.
5. **`surface: true` decisions** must produce an `fyi` card with undo and be counted in the day's brief. Enforce in the host with a test that no surfaced decision is dropped.
6. **Fixed-egress tools with free-text arguments** (search): consider length limits and redaction of obvious secrets before the call.
7. **Device confirmation signatures** are verified at the runtime boundary; M1 defines device keys, pairing and nonce storage.
8. **Mail transport interface**, account-level poller, connectivity self-test, checkpoint per turn (see architecture 4g).
9. **Installer and self-update** with signed releases (see architecture 4f).
