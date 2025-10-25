import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReferralRequest {
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  childName: string;
  childAge: string;
  referralType: string;
  coordinatorName?: string;
  coordinatorEmail?: string;
  previousSwimLessons?: string;
  swimGoals?: string[];
  strengthsInterests?: string;
  motivationFactors?: string;
  availabilityGeneral?: string[];
  availabilityOther?: string;
  photoRelease?: string;
  liabilityAgreement?: boolean;
  swimmerPhotoUrl?: string;
  additionalInfo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestData: ReferralRequest = await req.json();

    console.log("Processing referral request:", requestData);

    // Save to database
    const { data: savedRequest, error: dbError } = await supabaseClient
      .from("vmrc_referral_requests")
      .insert({
        parent_name: requestData.parentName,
        parent_email: requestData.parentEmail,
        parent_phone: requestData.parentPhone,
        child_name: requestData.childName,
        child_age: parseInt(requestData.childAge),
        referral_type: requestData.referralType,
        coordinator_name: requestData.coordinatorName,
        coordinator_email: requestData.coordinatorEmail,
        previous_swim_lessons: requestData.previousSwimLessons === "yes",
        swim_goals: requestData.swimGoals,
        strengths_interests: requestData.strengthsInterests,
        motivation_factors: requestData.motivationFactors,
        availability_general: requestData.availabilityGeneral,
        availability_other: requestData.availabilityOther,
        photo_release: requestData.photoRelease === "yes",
        liability_agreement: requestData.liabilityAgreement,
        swimmer_photo_url: requestData.swimmerPhotoUrl,
        additional_info: requestData.additionalInfo,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    console.log("Referral request saved to database:", savedRequest);

    // Determine recipient email
    let recipientEmail = requestData.coordinatorEmail;
    let recipientName = requestData.coordinatorName || "Coordinator";

    // If not VMRC or no coordinator email provided, send to default admin
    if (!recipientEmail || requestData.referralType !== "vmrc") {
      recipientEmail = "admin@swimschool.com"; // TODO: Replace with actual admin email
      recipientName = "Swim School Admin";
    }

    const referralTypeLabel = {
      vmrc: "VMRC Client",
      scholarship: "Scholarship Applicant",
      coordinator: "Coordinator Referral",
      other: "Other",
    }[requestData.referralType] || "Unknown";

    // Send email to coordinator/admin
    const emailResponse = await resend.emails.send({
      from: "I CAN SWIM <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `New Enrollment Request - ${requestData.childName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <div style="background-color: #0ea5e9; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🏊 New Enrollment Request</h2>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
            <p>Hello ${recipientName},</p>
            
            <p>You've received a new enrollment request. Please review the details below and contact the family to complete the referral process.</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                Referral Information
              </h3>
              <p><strong>Referral Type:</strong> ${referralTypeLabel}</p>
              
              <h4 style="color: #1f2937; margin-top: 20px; margin-bottom: 10px;">Parent/Guardian Details</h4>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${requestData.parentName}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${requestData.parentEmail}">${requestData.parentEmail}</a></p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${requestData.parentPhone}">${requestData.parentPhone}</a></p>
              
              <h4 style="color: #1f2937; margin-top: 20px; margin-bottom: 10px;">Child Information</h4>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${requestData.childName}</p>
              <p style="margin: 5px 0;"><strong>Age:</strong> ${requestData.childAge} years old</p>
              
              <h4 style="color: #1f2937; margin-top: 20px; margin-bottom: 10px;">Enrollment Details</h4>
              <p style="margin: 5px 0;"><strong>Previous Swim Lessons:</strong> ${requestData.previousSwimLessons === "yes" ? "Yes" : "No"}</p>
              
              ${requestData.swimGoals && requestData.swimGoals.length > 0 ? `
                <p style="margin: 10px 0;"><strong>Swim Goals:</strong></p>
                <ul style="margin: 5px 0 10px 20px;">
                  ${requestData.swimGoals.map(goal => `<li>${goal}</li>`).join("")}
                </ul>
              ` : ""}
              
              ${requestData.strengthsInterests ? `
                <p style="margin: 10px 0 5px 0;"><strong>Strengths & Interests:</strong></p>
                <p style="background-color: #f3f4f6; padding: 10px; border-radius: 6px; margin: 5px 0;">${requestData.strengthsInterests}</p>
              ` : ""}
              
              ${requestData.motivationFactors ? `
                <p style="margin: 10px 0 5px 0;"><strong>Motivation Factors:</strong></p>
                <p style="background-color: #f3f4f6; padding: 10px; border-radius: 6px; margin: 5px 0;">${requestData.motivationFactors}</p>
              ` : ""}
              
              ${requestData.availabilityGeneral && requestData.availabilityGeneral.length > 0 ? `
                <p style="margin: 10px 0;"><strong>Availability:</strong></p>
                <ul style="margin: 5px 0 10px 20px; columns: 2;">
                  ${requestData.availabilityGeneral.map(time => `<li>${time}</li>`).join("")}
                </ul>
              ` : ""}
              
              ${requestData.availabilityOther ? `
                <p style="margin: 5px 0;"><strong>Additional Availability:</strong> ${requestData.availabilityOther}</p>
              ` : ""}
              
              <p style="margin: 10px 0;"><strong>Photo/Video Release:</strong> ${requestData.photoRelease === "yes" ? "Yes" : "No"}</p>
              <p style="margin: 5px 0;"><strong>Liability Agreement:</strong> ${requestData.liabilityAgreement ? "Signed ✓" : "Not signed"}</p>
              
              ${requestData.swimmerPhotoUrl ? `
                <p style="margin: 10px 0;"><strong>Swimmer Photo:</strong> <a href="${requestData.swimmerPhotoUrl}" target="_blank">View Photo</a></p>
              ` : ""}
              
              ${requestData.additionalInfo ? `
                <h4 style="color: #1f2937; margin-top: 20px; margin-bottom: 10px;">Additional Information</h4>
                <p style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; white-space: pre-wrap;">${requestData.additionalInfo}</p>
              ` : ""}
            </div>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;">
                <strong>Next Steps:</strong> Please contact the family within 24-48 hours to discuss enrollment, assessment scheduling, and any required documentation.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; text-align: center;">
                <a href="mailto:${requestData.parentEmail}" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Contact Family
                </a>
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
              This enrollment request was submitted via the I CAN SWIM website.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Referral request email sent successfully:", emailResponse);

    // Send confirmation email to parent
    await resend.emails.send({
      from: "I CAN SWIM <onboarding@resend.dev>",
      to: [requestData.parentEmail],
      subject: "Enrollment Request Received - I CAN SWIM",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">✓ Enrollment Request Received!</h2>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
            <p>Hello ${requestData.parentName},</p>
            
            <p>Thank you for completing the enrollment request for <strong>${requestData.childName}</strong> at I CAN SWIM!</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">What Happens Next?</h3>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>Your coordinator will review your complete enrollment request</li>
                <li>They will contact you within 24-48 hours</li>
                <li>You'll discuss enrollment details and assessment scheduling</li>
                <li>Complete any remaining enrollment paperwork if needed</li>
                <li>Schedule your child's initial assessment</li>
              </ul>
            </div>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;">
                <strong>Questions?</strong> Feel free to reply to this email or call us directly. We're here to help!
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              We're excited to start this swimming journey with ${requestData.childName}!
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Best regards,<br>
              The I CAN SWIM Team
            </p>
          </div>
        </div>
      `,
    });

    console.log("Parent confirmation email sent");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Referral request submitted successfully",
        requestId: savedRequest.id,
        emailId: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-referral-request:", error);
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