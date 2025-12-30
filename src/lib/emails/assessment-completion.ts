/**
 * Assessment completion email automation
 * Replicates Airtable workflow for sending assessment results to parents
 */

import { wrapEmailWithHeader, createButton, BRAND_MAIN } from './email-wrapper'
import { emailUrls } from './url-helpers'

export interface AssessmentEmailData {
  clientName: string;
  parentName: string;
  parentEmail: string;
  isPrivatePay: boolean;
  status: 'approved' | 'dropped';
  assessmentData: {
    strengths: string;
    challenges: string;
    swimSkills: Record<string, string>;
    goals: string;
    instructorName?: string;
    assessmentDate?: string;
  };
}

export interface EmailContent {
  subject: string;
  html: string;
}

// Welcome info content (replicates Airtable workflow)
const WELCOME_INFO = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WELCOME TO I CAN SWIM!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We are thrilled to have you join our team...

1. Finding Your Swimmer's Initial Assessment
- Click on Your Swimmer under ENROLLED
- Go to their Profile (click three dots)
- Open the profile and scroll to the bottom

2. Booking Your Spot
Key Booking Rules:
- Recurring Spot Limit: ONE recurring spot per swimmer
- Total Lesson Limit: Max two lessons per week

3. Tips for a Great Experience
Quieter times: Before 3pm Mon-Thu, Fridays, Sundays

Instructor Profiles:
- Lauren: ABA strategies, nervous swimmers
- Stephanie: SLP background, young children, pre-teens
- Alyah: Autism program, Spanish fluent
- Alexis: ABA center, becoming Behavior Analyst
- Jennifer: School-age and preschool Autism
- Sutton: Nervous/anxious swimmers, sensory-seeking
- Megan: Non-verbal/low-verbal communication
- Jada: Adaptive PE support
- Desiree: Aquatic background, paraprofessional
- Karolina: Water polo, all abilities

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANCELLATION POLICY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cancel at least 24 hours prior to lessons.
Pool Texting Line: 209-643-7969
`;

// Skill categorization function
export function categorizeSkills(swimSkills: Record<string, string>) {
  const currentSkills: string[] = [];
  const skillsToDevelop: string[] = [];

  const skillLabels: Record<string, string> = {
    walks_in_water: "Walking in water",
    swims_with_equipment: "Swimming with equipment",
    swims_with_pdf: "Swimming with approved PDF",
    swims_with_floaties: "Swimming with floaties",
    front_float: "Front float",
    back_float: "Back float",
    changing_directions: "Changing directions",
    rollovers: "Rollovers",
    blow_bubbles: "Blowing bubbles",
    submerging: "Submerging",
    jumping_in: "Jumping in",
    side_breathing: "Side breathing",
    streamline: "Streamline",
    front_crawl: "Front crawl/freestyle",
    back_crawl: "Back crawl/backstroke",
    elementary_backstroke: "Elementary backstroke",
    breaststroke: "Breaststroke",
    butterfly: "Butterfly",
    side_stroke: "Side stroke",
    sculling: "Sculling",
    treading_water: "Treading water",
    survival_float: "Survival float",
    enters_safely: "Enters safely",
    exits_safely: "Exits safely"
  };

  for (const [key, value] of Object.entries(swimSkills)) {
    const label = skillLabels[key] || key;
    if (value === 'yes') {
      currentSkills.push(label);
    } else if (value === 'no' || value === 'emerging') {
      skillsToDevelop.push(label);
    }
  }

  return {
    currentSkills: currentSkills.length > 0 ? currentSkills.join(", ") : "Building foundational skills",
    skillsToDevelop: skillsToDevelop.length > 0 ? skillsToDevelop.join(", ") : "See full assessment in portal"
  };
}

// Generate dropped email template
export function generateDroppedEmail(data: AssessmentEmailData): EmailContent {
  const subject = `Assessment Results for ${data.clientName} - I Can Swim`;

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Assessment Results</h2>

    <p>Hi ${data.parentName},</p>

    <p>Thank you for bringing <strong>${data.clientName}</strong> for their swim assessment with I Can Swim.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${BRAND_MAIN};">
      <p style="margin: 5px 0;"><strong>Assessment Status:</strong> Not Approved at this time</p>
      <p style="margin: 5px 0;">After careful evaluation, our team has determined that ${data.clientName} would benefit from additional preparation before starting swim lessons.</p>
    </div>

    <div style="margin: 25px 0;">
      <h3 style="color: ${BRAND_MAIN}; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #e8f4f8; padding-bottom: 5px;">Assessment Summary</h3>

      <p><strong>Strengths:</strong></p>
      <div style="white-space: pre-line; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 10px 0;">${data.assessmentData.strengths}</div>

      <p><strong>Areas for Development:</strong></p>
      <div style="white-space: pre-line; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 10px 0;">${data.assessmentData.challenges}</div>

      <p><strong>Goals:</strong></p>
      <div style="white-space: pre-line; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 10px 0;">${data.assessmentData.goals}</div>
    </div>

    <div style="margin: 25px 0;">
      <h3 style="color: ${BRAND_MAIN}; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #e8f4f8; padding-bottom: 5px;">Next Steps</h3>
      <p>We recommend focusing on water comfort and basic safety skills before reconsidering swim lessons. Our team is available for guidance on preparing for future assessments.</p>

      <p>You can view the full assessment details in your parent portal.</p>
    </div>

    ${createButton('Contact Us', 'mailto:info@icanswim209.com')}

    <p>Thank you for considering I Can Swim for your child's aquatic education.</p>
  `;

  const html = wrapEmailWithHeader(content);

  return { subject, html };
}

// Generate approved email template
export function generateApprovedEmail(data: AssessmentEmailData): EmailContent {
  const { currentSkills, skillsToDevelop } = categorizeSkills(data.assessmentData.swimSkills);
  const isPrivatePay = data.isPrivatePay;

  const subject = `${data.clientName} is Approved for Swim Lessons!`;

  const welcomeInfoHtml = WELCOME_INFO.split('\n').map(line => {
    if (line.includes('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')) {
      return `<div style="text-align: center; color: ${BRAND_MAIN}; font-weight: bold; margin: 20px 0; padding: 10px; background: #e8f4f8; border-radius: 4px;">${line}</div>`;
    }
    return `<p style="margin: 8px 0;">${line}</p>`;
  }).join('');

  // Determine which button to show based on payment type
  const buttonHtml = isPrivatePay
    ? createButton('Book Your Lessons', emailUrls.parentBook(data.parentEmail))
    : createButton('Log In to Your Account', emailUrls.login(data.parentEmail));

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Assessment Complete - Approved!</h2>

    <p>Hi ${data.parentName},</p>

    <p>Great news! <strong>${data.clientName}</strong> has successfully completed their swim assessment and is approved for swim lessons with I Can Swim!</p>

    <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin-top: 0; color: #065f46;">Ready to Book!</h3>
      <p>You can now book recurring swim lessons for ${data.clientName}.</p>
      ${isPrivatePay ? `
      <p>As a private-pay client, sessions will be billed after each lesson.</p>
      ` : `
      <p>Your 12-session authorization has been submitted to your coordinator for approval. You can start booking lessons now!</p>
      `}
    </div>

    ${buttonHtml}

    <div style="margin: 25px 0;">
      <h3 style="color: ${BRAND_MAIN}; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #e8f4f8; padding-bottom: 5px;">Assessment Summary</h3>

      <p style="margin: 5px 0;"><strong>Instructor:</strong> ${data.assessmentData.instructorName || 'I Can Swim Instructor'}</p>
      <p style="margin: 5px 0;"><strong>Assessment Date:</strong> ${data.assessmentData.assessmentDate || new Date().toLocaleDateString()}</p>

      <p><strong>Strengths:</strong></p>
      <div style="white-space: pre-line; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 10px 0;">${data.assessmentData.strengths}</div>

      <p><strong>Areas for Development:</strong></p>
      <div style="white-space: pre-line; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 10px 0;">${data.assessmentData.challenges}</div>

      <p><strong>Current Skills:</strong></p>
      <div style="white-space: pre-line; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 10px 0;">${currentSkills}</div>

      <p><strong>Skills to Develop:</strong></p>
      <div style="white-space: pre-line; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 10px 0;">${skillsToDevelop}</div>

      <p><strong>Goals:</strong></p>
      <div style="white-space: pre-line; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 10px 0;">${data.assessmentData.goals}</div>
    </div>

    <div style="margin: 25px 0;">
      <h3 style="color: ${BRAND_MAIN}; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #e8f4f8; padding-bottom: 5px;">Welcome to I Can Swim!</h3>
      <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 15px 0;">
        ${welcomeInfoHtml}
      </div>
    </div>

    <p>We're excited to work with ${data.clientName} and help them achieve their swimming goals!</p>
  `;

  const html = wrapEmailWithHeader(content);

  return { subject, html };
}

// Main function to generate appropriate email based on status
export function generateAssessmentCompletionEmail(data: AssessmentEmailData): EmailContent {
  if (data.status === 'dropped') {
    return generateDroppedEmail(data);
  } else {
    return generateApprovedEmail(data);
  }
}