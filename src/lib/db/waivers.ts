import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { LEGAL_DOCUMENTS } from '@/constants/legal-text';

// Create a service client that bypasses RLS for public operations
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY; // Service role key

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase service role configuration:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey
    });
    throw new Error(`Supabase service role configuration missing: ${!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : ''} ${!supabaseKey ? 'SUPABASE_SECRET_KEY' : ''}`.trim());
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}

export interface WaiverTokenValidation {
  valid: boolean;
  tokenId?: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  expiresAt?: string;
  error?: string;
}

export interface SwimmerWaiverStatus {
  id: string;
  firstName: string;
  lastName: string;
  hasLiability: boolean;
  hasPhotoRelease: boolean;
  hasCancellationPolicy: boolean;
  isComplete: boolean;
}

export interface WaiverUpdateResult {
  success: boolean;
  error?: string;
  updatedFields?: string[];
}

export interface WaiverCompletionStats {
  totalSwimmers: number;
  completedSwimmers: number;
  completionRate: number;
  missingLiability: number;
  missingPhotoRelease: number;
  missingCancellationPolicy: number;
  needingWaivers: number;
  parents: Array<{
    id: string;
    name: string;
    email: string;
    swimmerCount: number;
    completeCount: number;
    emailSentAt: string | null;
  }>;
}

/**
 * Extract a reasonable name from an email address
 * Example: MARYJEAN_83@LIVE.COM -> Mary Jean
 */
function extractNameFromEmail(email: string): string {
  if (!email) return 'Parent';

  // Get local part before @
  const localPart = email.split('@')[0];

  // Remove numbers and special chars, split by underscore/dot/dash
  const cleaned = localPart
    .replace(/\d+/g, '') // Remove numbers
    .replace(/[_.-]/g, ' ') // Replace separators with spaces
    .trim();

  // Capitalize each word
  const words = cleaned.split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

  return words.length > 0 ? words.join(' ') : 'Parent';
}

/**
 * Get parent name from profile if they have an account
 */
async function getParentNameFromProfile(parentId: string): Promise<string> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', parentId)
    .single();

  return data?.full_name || 'Parent';
}

// Validate token and return parent info
export async function validateWaiverToken(token: string): Promise<WaiverTokenValidation> {
  try {
    if (!token || token.trim() === '') {
      return { valid: false, error: 'Token is required' };
    }

    const supabase = createServiceClient(); // Use service client to bypass RLS

    // Query token with parent_email and optionally join profiles
    const { data, error } = await supabase
      .from('waiver_update_tokens')
      .select(`
        id,
        parent_id,
        parent_email,
        expires_at,
        used,
        profiles:parent_id (
          id,
          full_name,
          email
        )
      `)
      .eq('token', token.trim())
      .single();

    if (error) {
      console.error('Error validating waiver token:', error);
      return { valid: false, error: 'Invalid or expired token' };
    }

    if (!data) {
      return { valid: false, error: 'Token not found' };
    }

    // Check if token is expired
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    if (expiresAt < now) {
      return { valid: false, error: 'This link has expired' };
    }

    // Determine parent info based on whether they have an account
    let parentName: string;
    let parentEmail: string;
    let parentId: string | undefined;

    if (data.parent_id) {
      // Parent has an account - get info from profiles
      const parent = data.profiles as any;
      parentId = data.parent_id;
      parentName = parent?.full_name || 'Parent';
      parentEmail = parent?.email || data.parent_email || '';
    } else {
      // Parent doesn't have an account - use email only
      parentId = undefined;
      parentEmail = data.parent_email || '';
      parentName = extractNameFromEmail(parentEmail);
    }

    return {
      valid: true,
      tokenId: data.id,
      parentId,
      parentName,
      parentEmail,
      expiresAt: data.expires_at
    };
  } catch (error) {
    console.error('Unexpected error validating token:', error);
    return { valid: false, error: 'An unexpected error occurred' };
  }
}

// Get swimmers needing waivers for a parent
export async function getSwimmersNeedingWaivers(
  parentId: string | null,
  parentEmail: string
): Promise<SwimmerWaiverStatus[]> {
  try {
    if (!parentEmail) {
      throw new Error('Parent email is required');
    }

    const supabase = createServiceClient(); // Use service client to bypass RLS

    // Build query based on whether parent has an account
    let query = supabase
      .from('swimmers')
      .select(`
        id,
        first_name,
        last_name,
        signed_waiver,
        liability_waiver_signature,
        photo_video_permission,
        photo_video_signature,
        cancellation_policy_signature
      `)
      .in('enrollment_status', ['enrolled', 'pending_enrollment'])
      .order('first_name', { ascending: true });

    if (parentId) {
      // Parent has an account - query by parent_id
      query = query.eq('parent_id', parentId);
    } else {
      // Parent doesn't have an account - query by parent_email
      query = query.eq('parent_email', parentEmail);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching swimmers for waivers:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    console.log(`[getSwimmersNeedingWaivers] Found ${data.length} swimmers for ${parentEmail}`);

    return data.map(swimmer => ({
      id: swimmer.id,
      firstName: swimmer.first_name || '',
      lastName: swimmer.last_name || '',
      hasLiability: !!(swimmer.signed_waiver && swimmer.liability_waiver_signature),
      hasPhotoRelease: !!(swimmer.photo_video_permission && swimmer.photo_video_signature),
      hasCancellationPolicy: !!swimmer.cancellation_policy_signature,
      isComplete: !!(swimmer.signed_waiver &&
                    swimmer.liability_waiver_signature &&
                    swimmer.photo_video_permission &&
                    swimmer.photo_video_signature &&
                    swimmer.cancellation_policy_signature)
    }));
  } catch (error) {
    console.error('Error in getSwimmersNeedingWaivers:', error);
    throw error;
  }
}

// Update swimmer waivers
export async function updateSwimmerWaivers(
  swimmerId: string,
  waivers: {
    liabilitySignature?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    liabilityConsent?: boolean;
    photoPermission: boolean;
    photoSignature?: string;
    photoSignatureConsent?: boolean;
    cancellationSignature?: string;
    cancellationAgreed?: boolean;
  },
  metadata: {
    parentId: string | null;
    parentEmail: string;
    tokenId: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<WaiverUpdateResult> {
  try {
    if (!swimmerId || !metadata.parentEmail || !metadata.tokenId) {
      return { success: false, error: 'Missing required parameters' };
    }

    const supabase = createServiceClient(); // Use service client to bypass RLS

    // First, validate the token is still valid
    const { data: tokenData, error: tokenError } = await supabase
      .from('waiver_update_tokens')
      .select('id, used, parent_id, parent_email')
      .eq('id', metadata.tokenId)
      .single();

    if (tokenError || !tokenData) {
      return { success: false, error: 'Invalid token' };
    }

    // Token can be reused for multiple swimmers, so we don't check if it's used

    // Verify token matches the parent (either by ID or email)
    if (tokenData.parent_id) {
      // Parent has an account - must match parentId
      if (metadata.parentId !== tokenData.parent_id) {
        return { success: false, error: 'Token does not match parent' };
      }
    } else {
      // Parent doesn't have an account - must match email
      if (metadata.parentEmail !== tokenData.parent_email) {
        return { success: false, error: 'Token does not match parent email' };
      }
    }

    // Prepare update data for swimmer
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Build signature metadata with document versions and consent information
    const signatureMetadata: any = {};
    const now = new Date().toISOString();

    // Electronic consent tracking
    if (waivers.liabilityConsent || waivers.photoSignatureConsent || waivers.cancellationAgreed) {
      updateData.electronic_consent_given = true;
      updateData.electronic_consent_timestamp = now;
      signatureMetadata.electronic_consent = {
        liabilityConsent: waivers.liabilityConsent || false,
        photoSignatureConsent: waivers.photoSignatureConsent || false,
        cancellationAgreed: waivers.cancellationAgreed || false,
        timestamp: now
      };
    }

    // Liability waiver timestamp and version
    if (waivers.liabilitySignature) {
      updateData.liability_waiver_signed_at = now;
      signatureMetadata.liability_waiver = {
        version: LEGAL_DOCUMENTS.LIABILITY_WAIVER.version,
        signed_at: now
      };
    }

    // Cancellation policy timestamp and version
    if (waivers.cancellationSignature) {
      updateData.cancellation_policy_signed_at = now;
      signatureMetadata.cancellation_policy = {
        version: LEGAL_DOCUMENTS.CANCELLATION_POLICY.version,
        signed_at: now
      };
    }

    // Photo release timestamp and version
    if (waivers.photoPermission && waivers.photoSignature) {
      updateData.photo_release_signed_at = now;
      signatureMetadata.photo_release = {
        version: LEGAL_DOCUMENTS.PHOTO_RELEASE.version,
        signed_at: now
      };
    }

    // IP address and user agent for audit trail
    if (metadata.ipAddress) {
      updateData.signature_ip_address = metadata.ipAddress;
    }
    if (metadata.userAgent) {
      updateData.signature_user_agent = metadata.userAgent;
    }

    // Store signature metadata if we have any
    if (Object.keys(signatureMetadata).length > 0) {
      updateData.signature_metadata = signatureMetadata;
    }

    const updatedFields: string[] = [];

    if (waivers.liabilitySignature) {
      updateData.signed_waiver = true;
      updateData.liability_waiver_signature = waivers.liabilitySignature;
      updatedFields.push('liability_waiver');
    }

    // Emergency contact information
    if (waivers.emergencyContactName) {
      updateData.emergency_contact_name = waivers.emergencyContactName;
    }
    if (waivers.emergencyContactPhone) {
      updateData.emergency_contact_phone = waivers.emergencyContactPhone;
    }
    if (waivers.emergencyContactRelationship) {
      updateData.emergency_contact_relationship = waivers.emergencyContactRelationship;
    }

    if (waivers.photoPermission && waivers.photoSignature) {
      updateData.photo_video_permission = true;
      updateData.photo_video_signature = waivers.photoSignature;
      updatedFields.push('photo_release');
    } else if (!waivers.photoPermission) {
      updateData.photo_video_permission = false;
      updateData.photo_video_signature = null;
      updatedFields.push('photo_release');
    }

    if (waivers.cancellationSignature) {
      updateData.cancellation_policy_signature = waivers.cancellationSignature;
      updatedFields.push('cancellation_policy');
    }

    // Update swimmer record with appropriate parent check
    console.log('Updating swimmer waivers for parent:', { parentId: metadata.parentId, parentEmail: metadata.parentEmail });
    console.log('Update data fields:', Object.keys(updateData).filter(key => !key.includes('signature')));
    let updateQuery = supabase
      .from('swimmers')
      .update(updateData)
      .eq('id', swimmerId);

    if (metadata.parentId) {
      // Parent has an account - check by parent_id
      updateQuery = updateQuery.eq('parent_id', metadata.parentId);
    } else {
      // Parent doesn't have an account - check by parent_email
      updateQuery = updateQuery.eq('parent_email', metadata.parentEmail);
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      console.error('Error updating swimmer waivers:', updateError);
      console.error('Update error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
      return { success: false, error: 'Failed to update waiver information' };
    }

    // Update token's updated_at timestamp to track last activity (token not marked as used to allow multiple swimmers)
    const { error: tokenUpdateError } = await supabase
      .from('waiver_update_tokens')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', metadata.tokenId);

    if (tokenUpdateError) {
      console.error('Error updating token timestamp:', tokenUpdateError);
      // Don't fail the entire operation if token update fails
    }

    // Log the waiver updates for audit trail with parent_email
    if (updatedFields.length > 0) {
      const logPromises = [];

      if (waivers.liabilitySignature) {
        logPromises.push(
          supabase.from('waiver_update_log').insert({
            parent_id: metadata.parentId,
            parent_email: metadata.parentEmail,
            swimmer_id: swimmerId,
            waiver_type: 'liability',
            ip_address: metadata.ipAddress,
            user_agent: metadata.userAgent,
            token_id: metadata.tokenId
          })
        );
      }

      if (waivers.photoPermission && waivers.photoSignature) {
        logPromises.push(
          supabase.from('waiver_update_log').insert({
            parent_id: metadata.parentId,
            parent_email: metadata.parentEmail,
            swimmer_id: swimmerId,
            waiver_type: 'photo_release',
            ip_address: metadata.ipAddress,
            user_agent: metadata.userAgent,
            token_id: metadata.tokenId
          })
        );
      }

      if (waivers.cancellationSignature) {
        logPromises.push(
          supabase.from('waiver_update_log').insert({
            parent_id: metadata.parentId,
            parent_email: metadata.parentEmail,
            swimmer_id: swimmerId,
            waiver_type: 'cancellation_policy',
            ip_address: metadata.ipAddress,
            user_agent: metadata.userAgent,
            token_id: metadata.tokenId
          })
        );
      }

      // Execute all log inserts
      await Promise.all(logPromises);
    }

    console.log(`[updateSwimmerWaivers] Updated waivers for swimmer ${swimmerId}`);

    return {
      success: true,
      updatedFields
    };
  } catch (error) {
    console.error('Unexpected error in updateSwimmerWaivers:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Generate secure random token
export function generateSecureToken(length: number = 32): string {
  try {
    // Try to use crypto.getRandomValues if available (browser/Next.js edge)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').slice(0, length * 2);
    }
    // Fallback for older environments
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  } catch (error) {
    console.error('Error generating secure token:', error);
    // Ultimate fallback
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Create a new waiver update token for a parent
export async function createWaiverUpdateToken(
  parentId: string | null,
  parentEmail: string,
  expiresInHours: number = 72
): Promise<{ token: string; expiresAt: Date; id: string } | null> {
  try {
    if (!parentEmail) {
      throw new Error('Parent email is required');
    }

    const supabase = createServiceClient(); // Use service client for system operations

    const token = generateSecureToken(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const { data, error } = await supabase
      .from('waiver_update_tokens')
      .insert({
        parent_id: parentId, // Can be null for parents without accounts
        parent_email: parentEmail, // Always required
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
        email_sent_at: new Date().toISOString()
      })
      .select('id, token, expires_at')
      .single();

    if (error) {
      console.error('Error creating waiver update token:', error);
      return null;
    }

    console.log(`[createWaiverUpdateToken] Created token for ${parentEmail}`);

    return {
      token: data.token,
      expiresAt: new Date(data.expires_at),
      id: data.id
    };
  } catch (error) {
    console.error('Error in createWaiverUpdateToken:', error);
    return null;
  }
}

// Get waiver completion stats for admin dashboard
export async function getWaiverCompletionStats(): Promise<WaiverCompletionStats> {
  try {
    const supabase = createServiceClient(); // Use service client to bypass RLS

    // Get all swimmers with their waiver status and parent info (including parent_email)
    const { data: swimmers, error: swimmersError } = await supabase
      .from('swimmers')
      .select(`
        id,
        parent_id,
        parent_email,
        signed_waiver,
        liability_waiver_signature,
        photo_video_permission,
        photo_video_signature,
        cancellation_policy_signature,
        profiles:parent_id (
          id,
          full_name,
          email
        )
      `)
      .in('enrollment_status', ['enrolled', 'pending_enrollment'])
      .order('parent_email', { ascending: true });

    if (swimmersError) {
      console.error('Error fetching swimmers for waiver stats:', swimmersError);
      throw swimmersError;
    }

    if (!swimmers) {
      return {
        totalSwimmers: 0,
        completedSwimmers: 0,
        completionRate: 0,
        missingLiability: 0,
        missingPhotoRelease: 0,
        missingCancellationPolicy: 0,
        needingWaivers: 0,
        parents: []
      };
    }

    // Get latest email sent dates for each parent from waiver_update_tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('waiver_update_tokens')
      .select('parent_id, parent_email, email_sent_at')
      .order('email_sent_at', { ascending: false });

    if (tokenError) {
      console.error('Error fetching token email dates:', tokenError);
      // Continue without email dates
    }

    // Create map of parent identifier -> latest email_sent_at
    const emailSentMap = new Map<string, string>();
    if (tokenData) {
      tokenData.forEach(token => {
        const parentIdentifier = token.parent_id || token.parent_email;
        if (parentIdentifier && token.email_sent_at) {
          // Only keep the latest email_sent_at per parent
          if (!emailSentMap.has(parentIdentifier)) {
            emailSentMap.set(parentIdentifier, token.email_sent_at);
          }
        }
      });
    }

    // Calculate overall stats
    let completedSwimmers = 0;
    let missingLiability = 0;
    let missingPhotoRelease = 0;
    let missingCancellationPolicy = 0;

    swimmers.forEach(swimmer => {
      const hasLiability = !!(swimmer.signed_waiver && swimmer.liability_waiver_signature);
      const hasPhotoRelease = !!(swimmer.photo_video_permission && swimmer.photo_video_signature);
      const hasCancellationPolicy = !!swimmer.cancellation_policy_signature;

      if (!hasLiability) missingLiability++;
      if (!hasPhotoRelease) missingPhotoRelease++;
      if (!hasCancellationPolicy) missingCancellationPolicy++;

      if (hasLiability && hasPhotoRelease && hasCancellationPolicy) {
        completedSwimmers++;
      }
    });

    // Calculate stats by parent (include both parent_id and parent_email parents)
    const parentsMap = new Map<string, {
      id: string;
      name: string;
      email: string;
      swimmerCount: number;
      completeCount: number;
      emailSentAt: string | null;
    }>();

    swimmers.forEach(swimmer => {
      // Use parent_id if exists, otherwise parent_email as identifier
      const parentIdentifier = swimmer.parent_id || swimmer.parent_email;
      if (!parentIdentifier) return; // Skip swimmers with no parent info

      // Determine parent name and email
      let parentName: string;
      let parentEmail: string;

      if (swimmer.parent_id && swimmer.profiles) {
        // Parent has an account
        const parent = swimmer.profiles as any;
        parentName = parent?.full_name || 'Parent';
        parentEmail = parent?.email || swimmer.parent_email || '';
      } else {
        // Parent doesn't have an account
        parentEmail = swimmer.parent_email || '';
        parentName = extractNameFromEmail(parentEmail);
      }

      if (!parentsMap.has(parentIdentifier)) {
        parentsMap.set(parentIdentifier, {
          id: parentIdentifier, // Can be parent_id UUID or parent_email
          name: parentName,
          email: parentEmail,
          swimmerCount: 0,
          completeCount: 0,
          emailSentAt: emailSentMap.get(parentIdentifier) || null
        });
      }

      const parentStats = parentsMap.get(parentIdentifier)!;
      parentStats.swimmerCount++;

      const hasLiability = !!(swimmer.signed_waiver && swimmer.liability_waiver_signature);
      const hasPhotoRelease = !!(swimmer.photo_video_permission && swimmer.photo_video_signature);
      const hasCancellationPolicy = !!swimmer.cancellation_policy_signature;

      if (hasLiability && hasPhotoRelease && hasCancellationPolicy) {
        parentStats.completeCount++;
      }
    });

    // Calculate needingWaivers (parents with at least one incomplete swimmer)
    let needingWaivers = 0;
    const parentsArray = Array.from(parentsMap.values());
    parentsArray.forEach(parent => {
      if (parent.completeCount < parent.swimmerCount) {
        needingWaivers++;
      }
    });

    console.log(`[getWaiverCompletionStats] Processed ${swimmers.length} swimmers, ${parentsArray.length} parents`);

    return {
      totalSwimmers: swimmers.length,
      completedSwimmers,
      completionRate: swimmers.length > 0 ? (completedSwimmers / swimmers.length) * 100 : 0,
      missingLiability,
      missingPhotoRelease,
      missingCancellationPolicy,
      needingWaivers,
      parents: parentsArray
    };
  } catch (error) {
    console.error('Error in getWaiverCompletionStats:', error);
    throw error;
  }
}

// Get parents with incomplete waivers (for admin email sending)
export async function getParentsWithIncompleteWaivers(): Promise<Array<{
  parentId: string | null;
  parentName: string;
  parentEmail: string;
  totalSwimmers: number;
  incompleteSwimmers: number;
  incompleteSwimmerNames: string[];
}>> {
  try {
    const supabase = createServiceClient(); // Use service client to bypass RLS

    // Get all enrolled swimmers with parent info (including parent_email)
    const { data: swimmers, error } = await supabase
      .from('swimmers')
      .select(`
        id,
        first_name,
        last_name,
        parent_id,
        parent_email,
        signed_waiver,
        liability_waiver_signature,
        photo_video_permission,
        photo_video_signature,
        cancellation_policy_signature,
        profiles:parent_id (
          id,
          full_name,
          email
        )
      `)
      .in('enrollment_status', ['enrolled', 'pending_enrollment'])
      .not('parent_email', 'is', null) // Only swimmers with parent email
      .order('parent_email', { ascending: true });

    if (error) {
      console.error('Error fetching swimmers for incomplete waivers:', error);
      throw error;
    }

    if (!swimmers || swimmers.length === 0) {
      return [];
    }

    const parentsMap = new Map<string, {
      parentId: string | null;
      parentName: string;
      parentEmail: string;
      totalSwimmers: number;
      incompleteSwimmers: number;
      incompleteSwimmerNames: string[];
    }>();

    // Process each swimmer
    for (const swimmer of swimmers) {
      // Use parent_id if exists, otherwise use parent_email as key
      const parentKey = swimmer.parent_id || swimmer.parent_email;
      if (!parentKey) continue;

      // Determine parent info
      let parentId: string | null = swimmer.parent_id;
      let parentEmail: string = swimmer.parent_email || '';
      let parentName: string;

      if (swimmer.parent_id && swimmer.profiles) {
        // Parent has an account - get name from profile
        const parent = swimmer.profiles as any;
        parentName = parent?.full_name || 'Parent';
        parentEmail = parent?.email || parentEmail; // Prefer email from profile
      } else {
        // Parent doesn't have an account - extract name from email
        parentName = extractNameFromEmail(parentEmail);
      }

      // Initialize parent entry if not exists
      if (!parentsMap.has(parentKey)) {
        parentsMap.set(parentKey, {
          parentId,
          parentName,
          parentEmail,
          totalSwimmers: 0,
          incompleteSwimmers: 0,
          incompleteSwimmerNames: []
        });
      }

      const parentData = parentsMap.get(parentKey)!;
      parentData.totalSwimmers++;

      // Check waiver completion
      const hasLiability = !!(swimmer.signed_waiver && swimmer.liability_waiver_signature);
      const hasPhotoRelease = !!(swimmer.photo_video_permission && swimmer.photo_video_signature);
      const hasCancellationPolicy = !!swimmer.cancellation_policy_signature;

      if (!hasLiability || !hasPhotoRelease || !hasCancellationPolicy) {
        parentData.incompleteSwimmers++;
        parentData.incompleteSwimmerNames.push(`${swimmer.first_name} ${swimmer.last_name}`);
      }
    }

    // Filter to only parents with incomplete waivers
    const result = Array.from(parentsMap.values())
      .filter(parent => parent.incompleteSwimmers > 0)
      .sort((a, b) => b.incompleteSwimmers - a.incompleteSwimmers);

    console.log(`[getParentsWithIncompleteWaivers] Found ${result.length} parents needing waiver updates`);

    return result;
  } catch (error) {
    console.error('Error in getParentsWithIncompleteWaivers:', error);
    throw error;
  }
}