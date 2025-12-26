/**
 * Assessment completion email automation
 * Replicates Airtable workflow for sending assessment results to parents
 */

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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2a5e84; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .section { margin: 25px 0; }
    .section-title { color: #2a5e84; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #e8f4f8; padding-bottom: 5px; }
    .highlight { background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2a5e84; }
    .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
    .info-row { margin: 8px 0; }
    .label { color: #666; }
    .preformatted { white-space: pre-line; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏊 Assessment Results</h1>
    </div>
    <div class="content">
      <p>Hi ${data.parentName},</p>

      <p>Thank you for bringing <strong>${data.clientName}</strong> for their swim assessment with I Can Swim.</p>

      <div class="highlight">
        <p><strong>Assessment Status:</strong> Not Approved at this time</p>
        <p>After careful evaluation, our team has determined that ${data.clientName} would benefit from additional preparation before starting swim lessons.</p>
      </div>

      <div class="section">
        <div class="section-title">Assessment Summary</div>

        <p><strong>Strengths:</strong></p>
        <div class="preformatted">${data.assessmentData.strengths}</div>

        <p><strong>Areas for Development:</strong></p>
        <div class="preformatted">${data.assessmentData.challenges}</div>

        <p><strong>Goals:</strong></p>
        <div class="preformatted">${data.assessmentData.goals}</div>
      </div>

      <div class="section">
        <div class="section-title">Next Steps</div>
        <p>We recommend focusing on water comfort and basic safety skills before reconsidering swim lessons. Our team is available for guidance on preparing for future assessments.</p>

        <p>You can view the full assessment details in your parent portal.</p>
      </div>

      <p>Thank you for considering I Can Swim for your child's aquatic education.</p>

      <div class="footer">
        <p><strong>I Can Swim</strong></p>
        <p>📍 Modesto: 1212 Kansas Ave, Modesto, CA 95351</p>
        <p>📞 (209) 778-7877 | ✉️ info@icanswim209.com</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

// Generate approved email template
export function generateApprovedEmail(data: AssessmentEmailData): EmailContent {
  const { currentSkills, skillsToDevelop } = categorizeSkills(data.assessmentData.swimSkills);
  const isPrivatePay = data.isPrivatePay;

  const subject = `🎉 ${data.clientName} is Approved for Swim Lessons!`;

  const welcomeInfoHtml = WELCOME_INFO.split('\n').map(line => {
    if (line.includes('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')) {
      return `<div style="text-align: center; color: #2a5e84; font-weight: bold; margin: 20px 0; padding: 10px; background: #e8f4f8; border-radius: 4px;">${line}</div>`;
    }
    return `<p style="margin: 8px 0;">${line}</p>`;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2a5e84; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .section { margin: 25px 0; }
    .section-title { color: #2a5e84; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #e8f4f8; padding-bottom: 5px; }
    .highlight { background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2a5e84; }
    .button { display: inline-block; background: #2a5e84; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
    .info-row { margin: 8px 0; }
    .label { color: #666; }
    .preformatted { white-space: pre-line; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 10px 0; }
    .skill-list { margin: 10px 0; padding-left: 20px; }
    .skill-item { margin: 5px 0; }
    .ready-to-book { background: #d1fae5; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
    .awaiting-po { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Assessment Complete - Approved!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.parentName},</p>

      <p>Great news! <strong>${data.clientName}</strong> has successfully completed their swim assessment and is approved for swim lessons with I Can Swim!</p>

      <div class="ready-to-book">
        <h3 style="margin-top: 0; color: #065f46;">✅ Ready to Book!</h3>
        <p>You can now book recurring swim lessons for ${data.clientName}.</p>
        ${isPrivatePay ? `
        <p>As a private-pay client, sessions will be billed after each lesson.</p>
        ` : `
        <p>Your 12-session authorization has been submitted to your coordinator for approval. You can start booking lessons now!</p>
        `}
        <p style="text-align: center;">
          <a href="https://icanswim209.com/booking" class="button">Book Lessons Now</a>
        </p>
      </div>

      <div class="section">
        <div class="section-title">Assessment Summary</div>

        <p><strong>Instructor:</strong> ${data.assessmentData.instructorName || 'I Can Swim Instructor'}</p>
        <p><strong>Assessment Date:</strong> ${data.assessmentData.assessmentDate || new Date().toLocaleDateString()}</p>

        <p><strong>Strengths:</strong></p>
        <div class="preformatted">${data.assessmentData.strengths}</div>

        <p><strong>Areas for Development:</strong></p>
        <div class="preformatted">${data.assessmentData.challenges}</div>

        <p><strong>Current Skills:</strong></p>
        <div class="preformatted">${currentSkills}</div>

        <p><strong>Skills to Develop:</strong></p>
        <div class="preformatted">${skillsToDevelop}</div>

        <p><strong>Goals:</strong></p>
        <div class="preformatted">${data.assessmentData.goals}</div>
      </div>

      <div class="section">
        <div class="section-title">Welcome to I Can Swim!</div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 15px 0;">
          ${welcomeInfoHtml}
        </div>
      </div>

      <p>We're excited to work with ${data.clientName} and help them achieve their swimming goals!</p>

      <div class="footer">
        <p><strong>I Can Swim</strong></p>
        <p>📍 Modesto: 1212 Kansas Ave, Modesto, CA 95351</p>
        <p>📞 (209) 778-7877 | ✉️ info@icanswim209.com</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

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