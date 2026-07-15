# GA4 Internal-Traffic Filter Verification

<!-- analytics-ga-internal-filter:status=UNVERIFIED -->

**Property:** `496541587`

**Required state:** `Testing`

**Current evidence status:** Signed-in GA Admin inspection pending

**Updated:** 2026-07-13

## Why this is a manual gate

Google Analytics Admin API does not expose the property's Data Filters collection. A read-only request to the presumed resource returns HTTP 404, while the current official Admin API resource catalog contains no Data Filters resource. This is not evidence that the filter is absent. The supported inspection path is the signed-in GA Admin interface under **Data collection and modification → Data filters**.

Google documents three filter states. `Testing` labels matching events with the predefined **Test data filter name** dimension without permanently excluding them. `Active` exclusion permanently prevents matching future data from being processed, so KStoryBridge must not activate the filter as part of this verification. References: [Filter out internal traffic](https://support.google.com/analytics/answer/10104470) and [Data filters](https://support.google.com/analytics/answer/13296761).

## Read-only Data API evidence

On 2026-07-13, an Analytics-scoped read-only query covered 2026-04-14 through 2026-07-12 with dimensions `testDataFilterName` and `hostName` and metric `eventCount`. All six returned hosts had `testDataFilterName = (not set)`:

| Host | Events |
|---|---:|
| `kstorybridge.com` | 10,302 |
| `dashboard.kstorybridge.com` | 7,275 |
| `localhost` | 4,532 |
| `creator.kstorybridge.com` | 776 |
| `creator-staging.kstorybridge.com` | 87 |
| `dashboard-staging.kstorybridge.com` | 57 |

This result proves no matching test-filter label was observed in that window. It does **not** distinguish a missing filter from a filter that received no matching `traffic_type=internal` event, so it cannot close `AR-108`.

## Required visual evidence

1. Open property `496541587` in GA Admin.
2. Navigate to **Data collection and modification → Data filters**.
3. Capture the complete filter row and detail view without exposing user/account information.
4. Verify the filter type is **Internal traffic**, operation is **Exclude**, parameter value is `internal`, and state is **Testing**.
5. Record the filter display name, inspection date/time, and evidence location below.
6. Change the machine marker at the top from `UNVERIFIED` to `TESTING` only when those facts are visible. Never change it based solely on the empty Data API result.
7. Send one authenticated internal-admin test event after the Wave 1 client release, wait for GA processing, and confirm the filter name appears in the predefined test-filter dimension before considering any later activation decision.

## Evidence record

| Field | Value |
|---|---|
| Filter display name | Pending |
| Filter type | Pending |
| Operation | Pending |
| Parameter value | Pending |
| State | Unverified |
| Verified at | Pending |
| Verified by | Pending |
| Screenshot/evidence location | Pending |

## Acceptance rule

`AR-108` closes only when the signed-in UI proves the exact property filter is in `Testing` and the evidence record is complete. `Inactive` remains pending. `Active` is an unsafe state that triggers a scheduled alert and release pause because exclusion is irreversible for future incoming data.
