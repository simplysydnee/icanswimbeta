import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Hold duration in minutes
const HOLD_DURATION_MINUTES = 5;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Check if session is available
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status, is_full, held_by, held_until')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is already booked or full
    if (session.is_full) {
      return NextResponse.json({ error: 'Session is full' }, { status: 409 });
    }

    if (session.status !== 'available' && session.status !== 'open') {
      return NextResponse.json({ error: 'Session not available' }, { status: 409 });
    }

    // Check if held by someone else (and hold hasn't expired)
    if (session.held_by && session.held_by !== user.id) {
      const holdExpiry = new Date(session.held_until);
      if (holdExpiry > new Date()) {
        return NextResponse.json({
          error: 'Session is being held by another user',
          retryAfter: Math.ceil((holdExpiry.getTime() - Date.now()) / 1000)
        }, { status: 409 });
      }
    }

    // Create hold
    const holdUntil = new Date();
    holdUntil.setMinutes(holdUntil.getMinutes() + HOLD_DURATION_MINUTES);

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        held_by: user.id,
        held_until: holdUntil.toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error creating hold:', updateError);
      return NextResponse.json({ error: 'Failed to hold session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      holdUntil: holdUntil.toISOString(),
      holdDurationSeconds: HOLD_DURATION_MINUTES * 60,
    });

  } catch (error) {
    console.error('Hold session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Release a hold
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Only release if held by this user
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        held_by: null,
        held_until: null,
      })
      .eq('id', sessionId)
      .eq('held_by', user.id);

    if (updateError) {
      console.error('Error releasing hold:', updateError);
      return NextResponse.json({ error: 'Failed to release hold' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Release hold error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}