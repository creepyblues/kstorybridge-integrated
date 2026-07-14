# Brevo Campaign Reconciliation Runbook

**Status:** Aggregate evidence pending

**Tasks:** `AR-008`, `AR-104`, `AR-110`

## Why this evidence is required

GA recorded 529 scanner-attributed sessions on the June 17, June 24, and July 8, 2026 campaign dates. Those redirects cannot honestly reveal how many messages Brevo delivered, how many recipients clicked, or how many clicks were known to be human.

The three historical sends also predate the production release of `email_landing_engaged`. They can close the provider-evidence task `AR-008`, but they cannot retroactively validate the new on-site event or close `AR-104`.

## Privacy boundary

[BREVO_CAMPAIGN_AGGREGATE_EVIDENCE.json](BREVO_CAMPAIGN_AGGREGATE_EVIDENCE.json) accepts only:

- the three required send dates;
- delivered, unique-click, and known-human-click integer aggregates;
- a controlled source (`brevo-api`, `brevo-export`, or `brevo-ui`);
- a collection timestamp; and
- a controlled human-click method (`brevo-reported` or `manual-review`).

The validator rejects unknown fields. Do not store campaign names, campaign IDs, recipient addresses, contact IDs, URLs, free-text notes, exports, or credentials in the evidence file.

Use `brevo-reported` only when the Brevo evidence explicitly identifies the count as human or bot-filtered. If Brevo supplies only undifferentiated unique clicks, leave `knownHumanClicks` and `humanClickMethod` pending until a documented manual review is available. Do not relabel all provider clicks as human.

## Provider-evidence procedure

1. Obtain aggregate-only evidence from Brevo for each required date.
2. Replace the nulls in the tracked JSON record and set its controlled source and ISO-8601 `collectedAt` timestamp.
3. Run:

   ```bash
   npm run analytics:verify-brevo
   ```

4. Exit code `0` and `ready: true` prove the three aggregate records are structurally complete. Exit code `2` means the record is valid but incomplete; any other error is invalid evidence.
5. Review the original provider evidence privately and obtain founder confirmation before checking `AR-008` complete. The repository record is deliberately insufficient to reconstruct recipient-level activity.

## `AR-104` production acceptance

After Wave 1 releases `email_landing_engaged`:

1. Send at least one new, intentionally tagged Brevo campaign using campaign-level source, medium, and campaign values only.
2. Confirm the provider's delivered, unique-click, and known-human-click aggregates using the same provenance rules.
3. Query a complete Pacific window after the client cutover using the clean production filter.
4. Verify a trusted on-site interaction produces exactly one `email_landing_engaged`, while scanner-only landings produce none.
5. Compare provider human clicks with the conservative on-site engagement count as two different stages. Do not call the GA count a click count, and do not infer an ordered-user conversion rate from independent totals.
6. Explain material variance using attribution loss, consent/ad blocking, multiple clicks, or landing-page non-engagement evidence; never fill a gap with scanner sessions.

`AR-104` and `AR-110` remain open until this post-cutover runtime evidence exists. A healthy provider-aggregate gate alone does not complete either task.
