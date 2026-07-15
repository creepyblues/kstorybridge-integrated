-- Emergency pause for the prepared title-workflow analytics extension.
-- Run only with explicit production approval and after rolling back approve-title
-- so a durable approval cannot be stranded without a retryable enqueue path.

REVOKE EXECUTE ON FUNCTION public.enqueue_title_workflow_outcomes(
  uuid, uuid, uuid, text, timestamptz
) FROM service_role;

-- Preserve the function, publication linkage, analytics_event_outbox, and all
-- queued/delivered rows. Restoration is a separately reviewed GRANT after the
-- application and delivery boundaries are corrected and revalidated.
