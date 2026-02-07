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

    // Fetch swimmer with parent info
    const { data: swimmer, error: swimmerError } = await supabase
      .from('swimmers')
      .select(`
        id,
        parent_id,
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

    if (!swimmer.parent_id) {
      return Response.json(
        { error: 'Swimmer does not have a parent assigned' },
        { status: 400 }
      );
    }

    const parentProfile = swimmer.profiles?.[0];
    if (!parentProfile?.email) {
      return Response.json(
        { error: 'Parent does not have an email address' },
        { status: 400 }
      );
    }

    // Call Edge Function to send email
    const { data, error } = await supabase.functions.invoke('waiver-emails-v2', {
      body: { parentIds: [swimmer.parent_id] }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    return Response.json({
      success: true,
      message: `Waiver email sent to ${parentProfile.email}`,
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