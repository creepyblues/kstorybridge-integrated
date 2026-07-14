# KStoryBridge Analytics Founder Decision Brief

**Status:** Proposed; founder approval required

**Prepared:** 2026-07-13

**Applies to:** `AR-001` through `AR-008`, with immediate implementation impact on `AR-203`, `AR-204`, `AR-305`, `AR-306`, `AR-401`, `AR-403`, and `AR-404`

This brief turns the open business questions into specific recommended definitions. Nothing here is treated as approved merely because it is documented. The corresponding execution-plan checkboxes remain open until the founder accepts or revises each decision.

## Evidence from the current business model

KStoryBridge describes itself as a curated marketplace and deal-support layer: Korean creators list proven IP; global buyers discover and evaluate it; KStoryBridge supports rights and deal execution. The buyer promise is faster movement from a production brief or comparable title to a rights-verified title that can be shortlisted and pitched internally. The creator promise is a Hollywood-legible title submission that becomes discoverable after review, with optional packaging and active pitching.

That makes raw traffic, signups, generic app sessions, and subscription revenue important inputs—not the primary proof that the marketplace works. The strongest currently modeled demand outcome is a new, deduplicated buyer/title interest record. Completed introductions and deals would be stronger, but neither has an authoritative production data model today.

## Recommended decisions

| Decision | Recommendation | Why this fits KStoryBridge now |
|---|---|---|
| `AR-001` primary 90-day goal | **Buyer-interest generation** | It proves that qualified supply meets buyer demand. It is closer to the marketplace outcome than traffic or tool use and more available than introductions/deals. |
| North-star metric | **New external buyer–title interest pairs in a rolling 28-day window** | `title_interests` has one authoritative row per buyer/title pair and a creation timestamp. Count new pairs, not button clicks or repeat note refreshes. |
| `AR-002` buyer activation | **An authenticated external buyer saves their first title within 14 days of signup** | A shortlist is the first clear transition from browsing to evaluating a specific IP. It is available on the free tier and avoids defining activation as payment. |
| `AR-003` creator activation | **An external creator submits their first title within 30 days of profile creation** | Submission is the creator-controlled completion of the core job. Approval/publication depends on KStoryBridge operations and should not penalize creator activation. |
| `AR-004` buyer retention cadence | **28 days** | B2B development sourcing is episodic, not daily. A retained buyer must return within the next 28-day cycle and perform a meaningful discovery/evaluation action. |
| `AR-004` creator retention cadence | **90 days** | Title supply, review, packaging, and buyer-interest cycles are slower. A retained creator must perform a meaningful title, inquiry, or subscription action—not merely sign in. |
| `AR-007` operating model | **Intentionally hybrid** | Discovery, shortlisting, title submission, and checkout are self-serve; review, packaging, rights support, introductions, and deal execution are human-assisted. |
| `AR-006` outcome authority | **Approve the existing source map, including its explicit gaps** | Signup, title workflow, interest, trial, and creator subscription sources are known. Buyer approval, introductions, transition timestamps, and some payment history still require durable models. |

## Exact metric contracts

### North star: qualified buyer interest

**Metric name:** `new_external_buyer_title_interest_pairs_28d`

**Numerator:** Count of `title_interests` rows created during the rolling 28-day window after excluding approved internal/test identities.

**Deduplication:** The authoritative unique buyer/title constraint. A repeated request or note refresh does not create a new outcome.

**Behavioral reconciliation:** Canonical GA `interest_submitted` event count, enforced only after `ANALYTICS_INTEREST_CONTRACT_LIVE_AT` predates the complete reporting window.

**Do not substitute:** CTA clicks, title views, raw interest-event counts without database reconciliation, or introduction counts while no introduction record exists.

**Evolution path:** When an authoritative introduction workflow exists, promote completed qualified introductions as the north star or use them as the success metric immediately downstream of interest.

### Buyer activation: first shortlist

**Cohort denominator:** External buyer profiles created in the cohort window.

**Activation numerator:** Buyers whose first successful `user_favorites` insert occurs no more than 14 complete America/Los_Angeles calendar days after `user_buyers.created_at`.

**Required durable fact:** The current `user_favorites` row is deleted when a buyer removes a favorite. Before production activation reporting, persist an immutable first-shortlist fact such as `buyer_activated_at` plus the triggering favorite ID/title ID, or a dedicated milestone row. The historical activation fact must survive an unfavorite action.

**GA event after approval:** `buyer_activated`, emitted once only after the immutable fact is stored. `favorite_added` remains the repeatable product action and reconciliation input; it must not be relabeled as a one-time activation event.

**Why not use:**

- `title_detail_viewed`: too weak; it counts casual evaluation.
- `interest_submitted`: too late; it collapses activation and the north star into one stage.
- `subscription_started`: biases activation toward monetization and excludes successful free-tier discovery.
- Generic sign-in/session: proves access, not value.

### Creator activation: first submitted title

**Cohort denominator:** External creator profiles created in the cohort window.

**Activation numerator:** Creators with a first `title_drafts.submitted_at` no more than 30 complete America/Los_Angeles calendar days after `user_creators.created_at`.

**Authoritative fact:** The first successfully submitted `title_drafts` record owned by the creator.

**GA reconciliation:** Existing canonical `title_submitted`, counted after the client contract is fully production-live.

**Why not use approval/publication:** Those stages depend on review latency, content decisions, and the currently undeployed draft-to-title linkage. Report them as supply throughput and operational conversion, not creator activation.

### Buyer retention

**Cohort:** External buyers activated by first shortlist. If “approved buyer” becomes a real business status, eligibility must be added only after its authoritative field and timestamp exist.

**D28 retained:** A buyer with at least one meaningful action during days 15–42 after activation. This 28-day observation window accommodates episodic production work without calling an immediate repeat session retention.

**Meaningful actions:** `title_search_submitted`, `title_detail_viewed`, `chat_message_sent`, `comps_search_submitted`, `mandate_search_submitted`, `favorite_added`, `pitch_deck_opened`, or `interest_submitted`.

**Do not count alone:** `signin_completed`, page views outside the product, billing-page visits, or passive sessions.

### Creator retention

**Cohort:** External creators activated by first title submission.

**D90 retained:** A creator with at least one meaningful action during days 31–120 after activation.

**Meaningful actions:** Create or submit another draft, update/manage a published title, respond to a buyer inquiry, or start/maintain a paid title service.

**Current measurement gap:** Only draft creation/submission and subscription outcomes have canonical coverage. Title-management and buyer-inquiry response events need authoritative definitions before the full creator-retention numerator is reliable. `last_active_at` is a freshness field that overwrites history; it cannot prove cohort retention by itself.

## Leadership scorecard after approval

| Layer | Metric | Decision it answers |
|---|---|---|
| North star | New external buyer/title interest pairs, rolling 28 days | Is the marketplace creating qualified demand for listed IP? |
| Acquisition | Clean new external buyers and creators by source/app | Are the right sides of the marketplace entering? |
| Buyer activation | First-shortlist activation rate within 14 days | Do new buyers find an IP worth keeping? |
| Creator activation | First-title-submission rate within 30 days | Do new creators contribute usable supply? |
| Buyer retention | D28 meaningful-action retention | Do activated buyers return for another sourcing cycle? |
| Creator retention | D90 meaningful-action retention | Do activated creators continue managing supply/opportunities? |
| Supply throughput | Submitted → approved → published titles and elapsed time | Is KStoryBridge operations turning submissions into discoverable supply? |
| Commercial | Interest → introduction → subscription/deal outcomes | Does engagement progress into business value? |

Targets should be set only after the contracts are production-live and the two-week validation window is complete. The current sample is too small and contaminated historically to justify numeric targets.

## Remaining founder inputs

These cannot be inferred safely from product behavior:

1. `AR-005`: list every staff, contractor, investor, partner, and automated-test account/domain to exclude beyond the active admins already classified.
2. `AR-008`: provide delivered, unique-click, and known-human-click totals for the June 17, June 24, and July 8 Brevo sends.
3. Confirm whether “approved buyer” is a real business status. If yes, define the decision and owner so engineering can add an authoritative status and timestamp.
4. Confirm whether an “introduction” begins when a buyer asks KStoryBridge for contact, when KStoryBridge contacts the rights holder, or when both parties are connected. The database model depends on this boundary.

## Fast approval format

The founder can approve the recommended package with:

> Approve AR-001 through AR-004 and AR-007 as recommended. Approve AR-006 with the documented gaps. Staff/test exclusions: [list]. Introduction begins when [boundary].

Any single definition can instead be revised explicitly. Engineering must not check the corresponding decision or release activation/retention metrics until that approval is recorded.
