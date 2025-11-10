import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProgressSummaryRequest {
  swimmerId: string;
  instructorId: string;
  progressSummary: string;
  skillsSummary?: {
    masteredSkills: string[];
    inProgressSkills: string[];
    currentLevel: string;
    nextLevel?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { swimmerId, instructorId, progressSummary, skillsSummary }: ProgressSummaryRequest = await req.json();

    console.log("Processing progress summary request for swimmer:", swimmerId);

    // Fetch swimmer details
    const { data: swimmer, error: swimmerError } = await supabaseClient
      .from("swimmers")
      .select(`
        *,
        swim_levels (
          display_name
        )
      `)
      .eq("id", swimmerId)
      .single();

    if (swimmerError || !swimmer) {
      throw new Error("Swimmer not found");
    }

    // Fetch instructor details
    const { data: instructor, error: instructorError } = await supabaseClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", instructorId)
      .single();

    if (instructorError || !instructor) {
      throw new Error("Instructor not found");
    }

    // Fetch recent progress notes for this swimmer
    const { data: recentNotes } = await supabaseClient
      .from("progress_notes")
      .select("lesson_summary, skills_mastered, created_at")
      .eq("swimmer_id", swimmerId)
      .order("created_at", { ascending: false })
      .limit(5);

    const lessonsCompleted = swimmer.vmrc_sessions_used || 0;
    const currentPosNumber = swimmer.vmrc_current_pos_number || "N/A";

    // Generate comprehensive summary
    const comprehensiveSummary = `
<h2>Progress Summary for ${swimmer.first_name} ${swimmer.last_name}</h2>

<p><strong>Current Level:</strong> ${swimmer.swim_levels?.display_name || "Not Assigned"}</p>
<p><strong>Current POS Number:</strong> ${currentPosNumber}</p>
<p><strong>Lessons Completed:</strong> ${lessonsCompleted}/${swimmer.vmrc_sessions_authorized || 12}</p>
<p><strong>Instructor:</strong> ${instructor.full_name}</p>

<h3>Overall Progress Summary</h3>
<p>${progressSummary}</p>

${skillsSummary ? `
<h3>Skills Summary</h3>
${skillsSummary.masteredSkills && skillsSummary.masteredSkills.length > 0 ? `
<p><strong>✅ Skills Mastered:</strong></p>
<ul>
${skillsSummary.masteredSkills.map(skill => `<li>${skill}</li>`).join('')}
</ul>
` : ''}

${skillsSummary.inProgressSkills && skillsSummary.inProgressSkills.length > 0 ? `
<p><strong>🔄 Skills In Progress:</strong></p>
<ul>
${skillsSummary.inProgressSkills.map(skill => `<li>${skill}</li>`).join('')}
</ul>
` : ''}

${skillsSummary.nextLevel ? `<p><strong>Recommended Next Level:</strong> ${skillsSummary.nextLevel}</p>` : ''}
` : ''}

${recentNotes && recentNotes.length > 0 ? `
<h3>Recent Lesson Notes</h3>
${recentNotes.map((note, index) => `
<div style="margin-bottom: 15px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">
  <p style="margin: 0;"><strong>Session ${recentNotes.length - index}:</strong> ${new Date(note.created_at).toLocaleDateString()}</p>
  <p style="margin: 5px 0 0 0;">${note.lesson_summary || 'No summary provided'}</p>
</div>
`).join('')}
` : ''}

<h3>POS Renewal Request</h3>
<p>Based on the progress above, we are requesting authorization for an additional 12 lessons to continue ${swimmer.first_name}'s swim development.</p>

<p>Please review and provide a new POS number when approved.</p>

<hr />
<p style="font-size: 12px; color: #666;">
This is an automated message from I CAN SWIM. If you have any questions, please contact ${instructor.full_name} at ${instructor.email}.
</p>
    `.trim();

    // Store the request in database
    const { data: progressRequest, error: requestError } = await supabaseClient
      .from("progress_update_requests")
      .insert({
        swimmer_id: swimmerId,
        instructor_id: instructorId,
        coordinator_email: swimmer.vmrc_coordinator_email,
        coordinator_name: swimmer.vmrc_coordinator_name,
        current_pos_number: currentPosNumber,
        progress_summary: progressSummary,
        skills_summary: skillsSummary,
        lessons_completed: lessonsCompleted,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (requestError) {
      console.error("Error storing progress request:", requestError);
      throw requestError;
    }

    // Send email to VMRC coordinator
    if (swimmer.vmrc_coordinator_email) {
      const emailResponse = await resend.emails.send({
        from: "I CAN SWIM <onboarding@resend.dev>",
        to: [swimmer.vmrc_coordinator_email],
        cc: [instructor.email],
        subject: `POS Renewal Request - ${swimmer.first_name} ${swimmer.last_name}`,
        html: comprehensiveSummary,
      });

      console.log("Email sent to coordinator:", emailResponse);
    } else {
      console.warn("No coordinator email found for swimmer");
    }

    // Update swimmer assessment status to indicate progress update was sent
    await supabaseClient
      .from("swimmers")
      .update({
        assessment_status: "progress_update",
        last_status_update: new Date().toISOString(),
      })
      .eq("id", swimmerId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Progress summary sent successfully",
        requestId: progressRequest.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-vmrc-progress-summary:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);