# Analytics Internal-Traffic Approval Runbook

**Status:** Founder approval required

**Scope:** Non-admin staff, contractors, investors, and automated QA identities

## Current evidence

- Active database administrators are already classified through the separate authoritative-admin workflow.
- A read-only production audit on 2026-07-14 matched the official automated QA Auth identity, but its protected `app_metadata.internal_traffic` claim was `false`.
- No production Auth metadata was changed during that audit. Until approved and updated, activity from this identity is classified as external customer traffic after the canonical client release.
- Additional non-admin internal identities have not been supplied. Email addresses, credentials, and Auth UUIDs are deliberately not stored in this document or committed scripts.

## Approval required

The founder must:

1. Approve or reject the official automated QA identity as internal traffic.
2. Supply the Auth UUIDs for every additional staff, contractor, investor, or automated-test identity to exclude.
3. Confirm that these identities should never contribute to external-customer KPIs.

The recommended decision is to approve the official automated QA identity and every account used primarily for operating, demonstrating, developing, or testing KStoryBridge. A real prospective or paying customer account should remain external even when a team member assists that user.

## Safe operator procedure

The command accepts comma-separated Supabase Auth UUIDs only. It rejects emails, duplicate or malformed identifiers, and lists longer than 100. Output contains aggregate counts only.

1. Put the founder-approved UUIDs in an ephemeral environment variable; do not add them to `.env.local`, shell history, source, or this runbook.
2. Run the default read-only audit:

   ```bash
   INTERNAL_TRAFFIC_USER_IDS="$APPROVED_UUIDS" npm run analytics:internal-users
   ```

3. Require `missingCount: 0`. Review `alreadyInternalCount` and `allInternal`; do not apply a partial or ambiguous list.
4. In an approved production window, run the explicit write command:

   ```bash
   INTERNAL_TRAFFIC_USER_IDS="$APPROVED_UUIDS" npm run analytics:internal-users -- --apply-users --confirm=MARK_APPROVED_USERS_INTERNAL
   ```

5. The tool preserves every existing `app_metadata` field, updates only identities not already marked internal, and verifies the complete list after the writes. A mid-request service failure can still leave an incomplete update, so rerun the dry audit immediately if the command fails.
6. Every updated user must sign out and sign back in, or otherwise refresh the Supabase session, before the protected claim reaches client analytics.

## Acceptance criteria

`AR-109` remains open until all of the following are true:

1. The founder-approved UUID inventory is complete and the approval is recorded without credentials or personal data.
2. A dry run matches every approved identity and reports no missing users.
3. The confirmed apply and post-write verification report `allInternal: true`.
4. After Wave 1 is live, a refreshed approved identity emits `traffic_type=internal` on a representative production event.
5. A separate external test identity emits `traffic_type=external` for the same event shape.
6. GA's Internal traffic exclusion filter is visibly verified in **Testing** mode under `AR-108`, and DebugView/processed evidence distinguishes the two classifications without collecting email or credentials.

Do not activate the GA filter as part of this procedure. Testing mode preserves evidence while the classification is validated.
