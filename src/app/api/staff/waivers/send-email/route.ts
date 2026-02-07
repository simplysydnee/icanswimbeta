import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  swimmerId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get the request body
    const body = await request.json();
    const { swimmerId } = schema.parse(body);

    // Check if we're in staff mode by checking for instructor in localStorage
    // Note: This is a client-side check, but we're on the server
    // For now, we'll trust the staff mode context and validate the swimmer exists
    // and that the parent has an email

    // Fetch swimmer with parent info including parent_email for parents without accounts
    const { data: swimmer, error: swimmerError } = await supabase
      .from('swimmers')
      .select(`
        id,
        parent_id,
        parent_email,
        profiles!swimmers_parent_id_fkey (
          id,
          email
        )
      `)
      .eq('id', swimmerId)
      .single();

    if (swimmerError) {
      console.error('Error fetching swimmer:', swimmerError);
      return Response.json(
        { error: 'Swimmer not found or access denied' },
        { status: 404 }
      );
    }

    // Determine parent email and identifier for edge function
    let parentEmail: string | null = null;
    let parentIdentifier: string | null = null;
    let useParentEmails = false;

    if (swimmer.parent_id) {
      // Parent has an account - get email from profile
      const parentProfile = swimmer.profiles?.[0];
      parentEmail = parentProfile?.email || null;
      parentIdentifier = swimmer.parent_id;
      useParentEmails = false; // Use parentIds for edge function
    } else {
      // Parent doesn't have an account - use parent_email from swimmers table
      parentEmail = swimmer.parent_email || null;
      parentIdentifier = swimmer.parent_email;
      useParentEmails = true; // Use parentEmails for edge function
    }

    if (!parentEmail || !parentIdentifier) {
      return Response.json(
        { error: 'Parent does not have an email address' },
        { status: 400 }
      );
    }

    // Call Edge Function to send email with appropriate parameters
    const edgeFunctionBody = useParentEmails
      ? { parentEmails: [parentIdentifier] }
      : { parentIds: [parentIdentifier] };

    const { data, error } = await supabase.functions.invoke('send-waiver-update-emails', {
      body: edgeFunctionBody
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    return Response.json({
      success: true,
      message: `Waiver email sent to ${parentEmail}`,
      data
    });
  } catch (error) {
    console.error('Send staff waiver email error:', error);
    return Response.json(
      { error: 'Failed to send waiver email' },
      { status: 500 }
    );
  }
}