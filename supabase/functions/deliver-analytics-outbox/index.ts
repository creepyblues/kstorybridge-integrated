import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildMeasurementProtocolPayload,
  retryDelaySeconds,
  type AnalyticsOutboxRow,
} from '../_shared/analytics-measurement-protocol.ts'

const jsonHeaders = { 'Content-Type': 'application/json' }

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization')
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
}

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: jsonHeaders,
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const measurementId = Deno.env.get('GA4_MEASUREMENT_ID') || 'G-DWL6MV0MC2'
  const apiSecret = Deno.env.get('GA4_MEASUREMENT_PROTOCOL_API_SECRET')
  const debugMode = Deno.env.get('GA4_MEASUREMENT_PROTOCOL_DEBUG') === 'true'

  if (!serviceRoleKey || bearerToken(request) !== serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: jsonHeaders,
    })
  }
  if (!supabaseUrl || !apiSecret) {
    return new Response(JSON.stringify({ error: 'analytics_delivery_not_configured' }), {
      status: 503,
      headers: jsonHeaders,
    })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await supabase.rpc('claim_analytics_event_outbox', {
    p_batch_size: 25,
  })
  if (error) {
    console.error('[deliver-analytics-outbox] claim_failed', { code: error.code })
    return new Response(JSON.stringify({ error: 'claim_failed' }), {
      status: 500,
      headers: jsonHeaders,
    })
  }

  const rows = (data || []) as AnalyticsOutboxRow[]
  const result = {
    claimed: rows.length,
    delivered: 0,
    retried: 0,
    retryScheduleFailures: 0,
  }
  const endpointPath = debugMode ? 'debug/mp/collect' : 'mp/collect'
  const endpoint = new URL(`https://www.google-analytics.com/${endpointPath}`)
  endpoint.searchParams.set('measurement_id', measurementId)
  endpoint.searchParams.set('api_secret', apiSecret)

  for (const row of rows) {
    try {
      const payload = buildMeasurementProtocolPayload(row)
      const requestPayload = debugMode
        ? { ...payload, validation_behavior: 'ENFORCE_RECOMMENDATIONS' }
        : payload
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(requestPayload),
      })

      let validationFailed = false
      if (debugMode && response.ok) {
        const debugResponse = await response.json()
        validationFailed = Array.isArray(debugResponse.validationMessages) &&
          debugResponse.validationMessages.length > 0
      }
      if (!response.ok || validationFailed) {
        throw new Error(validationFailed ? 'ga_validation_failed' : `ga_http_${response.status}`)
      }

      const { data: completed, error: completeError } = await supabase.rpc(
        'complete_analytics_event_outbox',
        { p_id: row.id }
      )
      if (completeError || completed !== true) {
        throw new Error('outbox_ack_failed')
      }
      result.delivered += 1
    } catch (deliveryError) {
      const rawCode = deliveryError instanceof Error ? deliveryError.message : 'delivery_failed'
      const errorCode = /^[a-z0-9_]{1,64}$/.test(rawCode) ? rawCode : 'delivery_failed'
      const { error: retryError } = await supabase.rpc('retry_analytics_event_outbox', {
        p_id: row.id,
        p_error_code: errorCode,
        p_retry_after_seconds: retryDelaySeconds(row.attempt_count),
      })
      if (retryError) {
        result.retryScheduleFailures += 1
        console.error('[deliver-analytics-outbox] retry_schedule_failed', {
          outboxId: row.id,
          code: retryError.code,
        })
      } else {
        result.retried += 1
      }
    }
  }

  return new Response(JSON.stringify({ success: true, result, debugMode }), {
    status: 200,
    headers: jsonHeaders,
  })
})
