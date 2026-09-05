/**
 * create-oauth-profile — legacy entry point (only the archived dashboard-legacy
 * app called it). Kept JWT-bound so it is no longer an anonymous profile-creation
 * endpoint: identity comes from the caller's token; `account_type` selects the
 * table; `profile_data` (or the pending metadata namespace) supplies the fields.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createBuyerProfile, createCreatorProfile, json, serveProfileFunction } from '../_shared/profile-create.ts';

serve(
  serveProfileFunction(async (admin, caller, body) => {
    const accountType = body.account_type;
    const profileData = (body.profile_data && typeof body.profile_data === 'object' ? body.profile_data : {}) as Record<string, unknown>;
    if (accountType === 'buyer') return createBuyerProfile(admin, caller, profileData);
    if (accountType === 'creator') return createCreatorProfile(admin, caller, profileData);
    return json(400, { success: false, code: 'INVALID_INPUT', error: 'account_type must be buyer or creator' });
  }),
);
