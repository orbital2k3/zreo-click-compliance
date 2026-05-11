import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Supabase Admin Client
 * Uses SERVICE_ROLE_KEY for unrestricted server-side operations
 * Bypasses RLS policies for backend processing
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Extract and validate user from Bearer token Authorization header
 * @param authHeader - The Authorization header value (e.g., "Bearer <token>")
 * @returns Decoded JWT claims including user_id or null if invalid
 */
export async function extractUserFromToken(authHeader?: string): Promise<{
  userId: string;
  email?: string;
  role?: string;
} | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    // Verify the token with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      console.error('[Auth] Invalid token:', error?.message);
      return null;
    }

    return {
      userId: data.user.id,
      email: data.user.email,
      role: data.user.role,
    };
  } catch (err) {
    console.error('[Auth] Token extraction failed:', err);
    return null;
  }
}

/**
 * Validate a user exists and is active in the system
 * @param userId - The user UUID to validate
 * @returns true if user is valid and active
 */
export async function validateUser(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !data.user) {
      return false;
    }

    return !data.user.banned_until;
  } catch (err) {
    console.error('[Auth] User validation failed:', err);
    return false;
  }
}
