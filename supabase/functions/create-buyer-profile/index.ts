/**
 * create-buyer-profile — creates the caller's user_buyers row.
 *
 * Identity is taken from the caller's JWT, never from the body. Profile fields come
 * from the body (OAuth CompleteProfile form) or from user_metadata.pending_buyer_profile
 * (email signup, created when the verification link lands). See _shared/profile-create.ts.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createBuyerProfile, serveProfileFunction } from '../_shared/profile-create.ts';

serve(serveProfileFunction(createBuyerProfile));
