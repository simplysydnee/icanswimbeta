import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://esm.sh/zod@3.22.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Validation schema
const referralSchema = z.object({
  // Client Information
  childName: z.string().trim().min(1).max(100),
  childDateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  diagnosis: z.enum(["ADD/ADHD", "Autism", "Developmental Disability", "Learning Disability", "Sensory Processing", "Speech Delay"]),
  parentName: z.string().trim().min(1).max(100),
  parentEmail: z.string().email().max(255),
  parentPhone: z.string().regex(/^[\d\s\-\(\)\+]+$/).max(20),
  
  // Medical & Physical Profile
  nonAmbulatory: z.string(),
  hasSeizureDisorder: z.string(),
  height: z.string().max(20),
  weight: z.string().max(20),
  toiletTrained: z.string(),
  hasMedicalConditions: z.string(),
  medicalConditionsDescription: z.string().max(1000).optional(),
  hasAllergies: z.string(),
  allergiesDescription: z.string().max(1000).optional(),
  hasOtherTherapies: z.string(),
  otherTherapiesDescription: z.string().max(1000).optional(),
  
  // Behavioral & Safety
  comfortableInWater: z.string(),
  selfInjuriousBehavior: z.string(),
  selfInjuriousDescription: z.string().max(1000).optional(),
  aggressiveBehavior: z.string(),
  aggressiveBehaviorDescription: z.string().max(1000).optional(),
  elopementBehavior: z.string(),
  elopementDescription: z.string().max(1000).optional(),
  hasSafetyPlan: z.string(),
  safetyPlanDescription: z.string().max(1000).optional(),
  
  // Referral & Consent
  referralType: z.enum(["vmrc", "scholarship", "coordinator", "other"]),
  coordinatorName: z.string().trim().max(100).optional(),
  coordinatorEmail: z.string().email().max(255).optional(),
  photoRelease: z.string().optional(),
  liabilityAgreement: z.boolean().optional(),
  swimmerPhotoUrl: z.string().url().max(500).optional().nullable(),
  
  // Optional retained fields
  previousSwimLessons: z.string().optional(),
  swimGoals: z.array(z.string().max(100)).max(10).optional(),
  strengthsInterests: z.string().max(1000).optional(),
  availabilityGeneral: z.array(z.string().max(50)).max(20).optional(),
  availabilityOther: z.string().max(500).optional(),
  additionalInfo: z.string().max(2000).optional(),
});

// HTML escape utility
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

    // Parse and validate input
    const rawData = await req.json();
    const validatedData = referralSchema.parse(rawData);

    console.log("Processing validated referral request");

    // Save to database
    const { data: savedRequest, error: dbError } = await supabaseClient
      .from("vmrc_referral_requests")
      .insert({
        // Client Information
        child_name: validatedData.childName,
        child_date_of_birth: validatedData.childDateOfBirth,
        diagnosis: validatedData.diagnosis,
        parent_name: validatedData.parentName,
        parent_email: validatedData.parentEmail,
        parent_phone: validatedData.parentPhone,
        
        // Medical & Physical Profile
        non_ambulatory: validatedData.nonAmbulatory === "yes",
        has_seizure_disorder: validatedData.hasSeizureDisorder === "yes",
        child_height: validatedData.height,
        child_weight: validatedData.weight,
        toilet_trained: validatedData.toiletTrained === "yes",
        has_medical_conditions: validatedData.hasMedicalConditions === "yes",
        medical_conditions_description: validatedData.medicalConditionsDescription,
        has_allergies: validatedData.hasAllergies === "yes",
        allergies_description: validatedData.allergiesDescription,
        has_other_therapies: validatedData.hasOtherTherapies === "yes",
        other_therapies_description: validatedData.otherTherapiesDescription,
        
        // Behavioral & Safety
        comfortable_in_water: validatedData.comfortableInWater === "yes",
        self_injurious_behavior: validatedData.selfInjuriousBehavior === "yes",
        self_injurious_description: validatedData.selfInjuriousDescription,
        aggressive_behavior: validatedData.aggressiveBehavior === "yes",
        aggressive_behavior_description: validatedData.aggressiveBehaviorDescription,
        elopement_behavior: validatedData.elopementBehavior === "yes",
        elopement_description: validatedData.elopementDescription,
        has_safety_plan: validatedData.hasSafetyPlan === "yes",
        safety_plan_description: validatedData.safetyPlanDescription,
        
        // Referral & Consent
        referral_type: validatedData.referralType,
        coordinator_name: validatedData.coordinatorName,
        coordinator_email: validatedData.coordinatorEmail,
        photo_release: validatedData.photoRelease === "yes",
        liability_agreement: validatedData.liabilityAgreement,
        swimmer_photo_url: validatedData.swimmerPhotoUrl,
        
        // Optional retained fields
        previous_swim_lessons: validatedData.previousSwimLessons === "yes",
        swim_goals: validatedData.swimGoals,
        strengths_interests: validatedData.strengthsInterests,
        availability_general: validatedData.availabilityGeneral,
        availability_other: validatedData.availabilityOther,
        additional_info: validatedData.additionalInfo,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save referral request");
    }

    console.log("Referral request saved to database");

    // Determine recipient email
    let recipientEmail = validatedData.coordinatorEmail;
    let recipientName = validatedData.coordinatorName || "Coordinator";

    if (!recipientEmail || validatedData.referralType !== "vmrc") {
      recipientEmail = "admin@swimschool.com";
      recipientName = "Swim School Admin";
    }

    const referralTypeLabel = {
      vmrc: "VMRC Client",
      scholarship: "Scholarship Applicant",
      coordinator: "Coordinator Referral",
      other: "Other",
    }[validatedData.referralType] || "Unknown";

    // Escape all user inputs for email
    const safeParentName = escapeHtml(validatedData.parentName);
    const safeChildName = escapeHtml(validatedData.childName);
    const safeRecipientName = escapeHtml(recipientName);

    // Send email to coordinator/admin
    const emailResponse = await resend.emails.send({
      from: "I CAN SWIM <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `New Enrollment Request - ${safeChildName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <div style="background-color: #0ea5e9; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🏊 New Enrollment Request</h2>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
            <p>Hello ${safeRecipientName},</p>
            
            <p>You've received a new enrollment request. Please review the details below.</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                Referral Information
              </h3>
              <p><strong>Referral Type:</strong> ${referralTypeLabel}</p>
              
              <h4 style="color: #1f2937; margin-top: 20px; margin-bottom: 10px;">Parent/Guardian Details</h4>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${safeParentName}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${validatedData.parentEmail}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${validatedData.parentPhone}</p>
              
              <h4 style="color: #1f2937; margin-top: 20px; margin-bottom: 10px;">Child Information</h4>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${safeChildName}</p>
              <p style="margin: 5px 0;"><strong>Date of Birth:</strong> ${validatedData.childDateOfBirth}</p>
              <p style="margin: 5px 0;"><strong>Diagnosis:</strong> ${validatedData.diagnosis}</p>
              
              <h4 style="color: #1f2937; margin-top: 20px; margin-bottom: 10px;">Medical & Physical Profile</h4>
              <p style="margin: 5px 0;"><strong>Height:</strong> ${validatedData.height}</p>
              <p style="margin: 5px 0;"><strong>Weight:</strong> ${validatedData.weight}</p>
              <p style="margin: 5px 0;"><strong>Toilet Trained:</strong> ${validatedData.toiletTrained}</p>
              <p style="margin: 5px 0;"><strong>Uses Wheelchair/Non-ambulatory:</strong> ${validatedData.nonAmbulatory}</p>
              <p style="margin: 5px 0;"><strong>Seizure Disorder:</strong> ${validatedData.hasSeizureDisorder}</p>
              ${validatedData.hasMedicalConditions === "yes" && validatedData.medicalConditionsDescription ? `
                <p style="margin: 10px 0 5px 0;"><strong>Medical Conditions:</strong></p>
                <p style="background-color: #f3f4f6; padding: 10px; border-radius: 6px; margin: 5px 0;">${escapeHtml(validatedData.medicalConditionsDescription)}</p>
              ` : ""}
              ${validatedData.hasAllergies === "yes" && validatedData.allergiesDescription ? `
                <p style="margin: 10px 0 5px 0;"><strong>Allergies:</strong></p>
                <p style="background-color: #f3f4f6; padding: 10px; border-radius: 6px; margin: 5px 0;">${escapeHtml(validatedData.allergiesDescription)}</p>
              ` : ""}
              
              <h4 style="color: #1f2937; margin-top: 20px; margin-bottom: 10px;">Behavioral & Safety Information</h4>
              <p style="margin: 5px 0;"><strong>Comfortable in Water:</strong> ${validatedData.comfortableInWater}</p>
              ${validatedData.selfInjuriousBehavior === "yes" && validatedData.selfInjuriousDescription ? `
                <p style="margin: 10px 0 5px 0;"><strong>Self-Injurious Behaviors:</strong></p>
                <p style="background-color: #fef3c7; padding: 10px; border-radius: 6px; margin: 5px 0;">${escapeHtml(validatedData.selfInjuriousDescription)}</p>
              ` : ""}
              ${validatedData.aggressiveBehavior === "yes" && validatedData.aggressiveBehaviorDescription ? `
                <p style="margin: 10px 0 5px 0;"><strong>Aggressive Behavior:</strong></p>
                <p style="background-color: #fef3c7; padding: 10px; border-radius: 6px; margin: 5px 0;">${escapeHtml(validatedData.aggressiveBehaviorDescription)}</p>
              ` : ""}
              ${validatedData.elopementBehavior === "yes" && validatedData.elopementDescription ? `
                <p style="margin: 10px 0 5px 0;"><strong>Elopement Behaviors:</strong></p>
                <p style="background-color: #fef3c7; padding: 10px; border-radius: 6px; margin: 5px 0;">${escapeHtml(validatedData.elopementDescription)}</p>
              ` : ""}
              ${validatedData.hasSafetyPlan === "yes" && validatedData.safetyPlanDescription ? `
                <p style="margin: 10px 0 5px 0;"><strong>Safety Plan/BIP:</strong></p>
                <p style="background-color: #dbeafe; padding: 10px; border-radius: 6px; margin: 5px 0;">${escapeHtml(validatedData.safetyPlanDescription)}</p>
              ` : ""}
              
              <h4 style="color: #1f2937; margin-top: 20px; margin-bottom: 10px;">Enrollment Details</h4>
              <p style="margin: 5px 0;"><strong>Previous Swim Lessons:</strong> ${validatedData.previousSwimLessons === "yes" ? "Yes" : "No"}</p>
              
              ${validatedData.swimGoals && validatedData.swimGoals.length > 0 ? `
                <p style="margin: 10px 0;"><strong>Swim Goals:</strong></p>
                <ul style="margin: 5px 0 10px 20px;">
                  ${validatedData.swimGoals.map(goal => `<li>${escapeHtml(goal)}</li>`).join("")}
                </ul>
              ` : ""}
              
              ${validatedData.strengthsInterests ? `
                <p style="margin: 10px 0 5px 0;"><strong>Strengths & Interests:</strong></p>
                <p style="background-color: #f3f4f6; padding: 10px; border-radius: 6px; margin: 5px 0;">${escapeHtml(validatedData.strengthsInterests)}</p>
              ` : ""}
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
              This enrollment request was submitted via the I CAN SWIM website.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Referral request email sent successfully");

    // Send confirmation email to parent
    await resend.emails.send({
      from: "I CAN SWIM <onboarding@resend.dev>",
      to: [validatedData.parentEmail],
      subject: "Enrollment Request Received - I CAN SWIM",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">✓ Enrollment Request Received!</h2>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
            <p>Hello ${safeParentName},</p>
            
            <p>Thank you for completing the enrollment request for <strong>${safeChildName}</strong> at I CAN SWIM!</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">What Happens Next?</h3>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>Your coordinator will review your complete enrollment request</li>
                <li>They will contact you within 24-48 hours</li>
                <li>You'll discuss enrollment details and assessment scheduling</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              We're excited to start this swimming journey with ${safeChildName}!
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
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-referral-request:", error);
    
    // Return validation errors without exposing internal details
    if (error.name === 'ZodError') {
      return new Response(
        JSON.stringify({ error: "Invalid input data", details: error.errors }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Failed to process referral request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);