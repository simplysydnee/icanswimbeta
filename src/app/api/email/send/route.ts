import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role (admin or instructor can send)
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || !['admin', 'instructor'].includes(userRole.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { to, toName, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // Convert plain text body to HTML
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        ${body.replace(/\n/g, '<br>')}
        <br><br>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          I Can Swim<br>
          📧 info@icanswim209.com<br>
          📞 (209) 778-7877<br>
          📱 Text: 209-643-7969
        </p>
      </div>
    `;

    // Call Supabase Edge Function to send email via Gmail
    const { data, error } = await supabase.functions.invoke('send-enrollment-email', {
      body: {
        to,
        toName,
        subject,
        html: htmlBody,
        templateType: 'custom'
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to send email');
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}