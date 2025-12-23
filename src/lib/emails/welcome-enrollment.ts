/**
 * Welcome enrollment email templates
 * Sent when swimmers are approved for enrollment (private pay) or when referrals are completed (funded)
 */

export interface WelcomeEmailData {
  parentName: string;
  parentEmail: string;
  swimmerName: string;
  isPrivatePay: boolean;
  fundingSourceName?: string;
}

export interface EmailContent {
  subject: string;
  html: string;
}

// Generate private pay welcome email
export function generatePrivatePayWelcomeEmail(data: WelcomeEmailData): EmailContent {
  const subject = `Welcome to I Can Swim, ${data.parentName}! 🏊`;

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
    .contact-info { background: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
    .consistency-message { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏊 Welcome to I Can Swim!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.parentName},</p>

      <p>Welcome to I Can Swim! We're excited to have <strong>${data.swimmerName}</strong> join our swim family. Here's what you need to know to get started:</p>

      <div class="highlight">
        <h3 style="margin-top: 0; color: #2a5e84;">📋 First Step: Assessment Session</h3>
        <p><strong>Assessment is REQUIRED</strong> before starting regular lessons. This 30-minute session ($75) allows our instructors to:</p>
        <ul>
          <li>Evaluate ${data.swimmerName}'s current swimming abilities</li>
          <li>Create a customized swimming plan tailored to their needs</li>
          <li>Match them with the best instructor for their learning style</li>
          <li>Set realistic goals and expectations</li>
        </ul>
      </div>

      <div class="section">
        <div class="section-title">📅 Book Your Assessment</div>
        <p style="text-align: center;">
          <a href="https://icanswim209.com" class="button">Log In to Book Your Assessment</a>
        </p>
        <p><em>After booking, you'll receive a confirmation email with all the details.</em></p>
      </div>

      <div class="section">
        <div class="section-title">🏊 After Assessment: Regular Lessons</div>
        <p>Once the assessment is complete, you can book regular lessons in two ways:</p>

        <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 15px 0;">
          <h4 style="margin-top: 0; color: #2a5e84;">Option 1: Weekly Recurring</h4>
          <p>Book the same day and time each week for a month. This provides consistency and helps swimmers progress faster.</p>

          <h4 style="color: #2a5e84;">Option 2: Single Sessions</h4>
          <p>Book individual sessions as needed. Perfect for flexible schedules.</p>
        </div>

        <p><strong>Pricing:</strong> $75 per session, billed after each lesson.</p>
      </div>

      <div class="consistency-message">
        <h3 style="margin-top: 0; color: #d97706;">🌟 Consistency is Key!</h3>
        <p>Regular attendance helps swimmers build confidence and skills faster. We recommend weekly lessons for best results.</p>
      </div>

      <div class="contact-info">
        <h3 style="margin-top: 0; color: #0ea5e9;">📱 Stay Connected</h3>
        <p><strong>Text Line:</strong> 209-643-7969</p>
        <p>Use this number for:</p>
        <ul>
          <li>Morning-of lesson reminders</li>
          <li>Quick questions</li>
          <li>Schedule changes (24+ hours in advance)</li>
        </ul>
        <p><em>We'll text you the morning of each lesson as a reminder!</em></p>
      </div>

      <div class="section">
        <div class="section-title">📞 Contact Information</div>
        <div class="info-row"><span class="label">Email:</span> info@icanswim209.com</div>
        <div class="info-row"><span class="label">Phone:</span> (209) 778-7877</div>
        <div class="info-row"><span class="label">Text:</span> 209-643-7969</div>
        <div class="info-row"><span class="label">Website:</span> icanswim209.com</div>
      </div>

      <div class="footer">
        <p>We're looking forward to helping ${data.swimmerName} become a confident swimmer!</p>
        <p><strong>Sutton Lucas</strong><br>
        Owner, I Can Swim</p>
        <p>📍 Turlock: 2705 Sebastian Drive, Turlock, CA 95382</p>
        <p>📍 Modesto: 1212 Kansas Ave, Modesto, CA 95351</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

// Generate funded welcome email
export function generateFundedWelcomeEmail(data: WelcomeEmailData): EmailContent {
  const subject = `Welcome to I Can Swim, ${data.parentName}! 🏊`;
  const fundingSource = data.fundingSourceName || 'Regional Center';

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
    .contact-info { background: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
    .consistency-message { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .awaiting-approval { background: #dbeafe; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏊 Welcome to I Can Swim!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.parentName},</p>

      <p>Welcome to I Can Swim! We're excited to have <strong>${data.swimmerName}</strong> join our swim family through ${fundingSource}. Here's what you need to know:</p>

      <div class="awaiting-approval">
        <h3 style="margin-top: 0; color: #1d4ed8;">📋 Assessment Authorization Submitted</h3>
        <p><strong>Great news!</strong> We've submitted the assessment authorization to ${fundingSource}. <em>You don't need to do anything at this time.</em></p>
        <p>We'll email you as soon as it's approved so you can book ${data.swimmerName}'s assessment session.</p>
      </div>

      <div class="highlight">
        <h3 style="margin-top: 0; color: #2a5e84;">🎯 Assessment Session</h3>
        <p>Once approved, the 30-minute assessment will:</p>
        <ul>
          <li>Create a customized swimming plan for ${data.swimmerName}</li>
          <li>Match them with the best instructor for their needs</li>
          <li>Set personalized goals and expectations</li>
          <li><strong>No cost to you</strong> - covered by ${fundingSource}</li>
        </ul>
      </div>

      <div class="section">
        <div class="section-title">📅 After Assessment: Regular Lessons</div>
        <p>After the assessment, we'll request a Lessons Authorization from ${fundingSource}. Once approved, you can book regular lessons in two ways:</p>

        <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 15px 0;">
          <h4 style="margin-top: 0; color: #2a5e84;">Option 1: Weekly Recurring</h4>
          <p>Book the same day and time each week. Consistency helps swimmers progress faster.</p>

          <h4 style="color: #2a5e84;">Option 2: Single Sessions</h4>
          <p>Book individual sessions as needed. Perfect for flexible schedules.</p>
        </div>

        <p><strong>All lessons are covered by ${fundingSource} at no cost to you.</strong></p>
      </div>

      <div class="consistency-message">
        <h3 style="margin-top: 0; color: #d97706;">🌟 Consistency is Crucial!</h3>
        <p><strong>Important:</strong> Regular attendance is essential for funded clients. Late cancellations or frequent absences can affect:</p>
        <ul>
          <li>Future authorizations from ${fundingSource}</li>
          <li>Your swimmer's spot in our program</li>
          <li>Their swimming progress and skill development</li>
        </ul>
        <p>We strongly recommend weekly recurring lessons for the best experience and results.</p>
      </div>

      <div class="contact-info">
        <h3 style="margin-top: 0; color: #0ea5e9;">📱 Stay Connected</h3>
        <p><strong>Text Line:</strong> 209-643-7969</p>
        <p>Use this number for:</p>
        <ul>
          <li>Morning-of lesson reminders</li>
          <li>Quick questions</li>
          <li>Schedule changes (24+ hours in advance)</li>
        </ul>
        <p><em>We'll text you the morning of each lesson as a reminder!</em></p>
      </div>

      <div class="section">
        <div class="section-title">📞 Contact Information</div>
        <div class="info-row"><span class="label">Email:</span> info@icanswim209.com</div>
        <div class="info-row"><span class="label">Phone:</span> (209) 778-7877</div>
        <div class="info-row"><span class="label">Text:</span> 209-643-7969</div>
        <div class="info-row"><span class="label">Website:</span> icanswim209.com</div>
      </div>

      <div class="footer">
        <p>We're looking forward to helping ${data.swimmerName} become a confident swimmer!</p>
        <p><strong>Sutton Lucas</strong><br>
        Owner, I Can Swim</p>
        <p>📍 Turlock: 2705 Sebastian Drive, Turlock, CA 95382</p>
        <p>📍 Modesto: 1212 Kansas Ave, Modesto, CA 95351</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

// Main function to generate appropriate welcome email
export function generateWelcomeEmail(data: WelcomeEmailData): EmailContent {
  if (data.isPrivatePay) {
    return generatePrivatePayWelcomeEmail(data);
  } else {
    return generateFundedWelcomeEmail(data);
  }
}

// Account Created - Next Steps Email (for users with no swimmers enrolled yet)
export interface AccountCreatedEmailData {
  parentName: string;
  parentEmail: string;
}

export function generateAccountCreatedEmail(data: AccountCreatedEmailData): EmailContent {
  const subject = "Welcome to I Can Swim! Here's How to Get Started 🏊";

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
    .contact-info { background: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
    .option-card { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2a5e84; }
    .option-title { color: #2a5e84; font-size: 16px; font-weight: bold; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏊 Welcome to I Can Swim!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.parentName},</p>

      <p>Thanks for creating your I Can Swim account! We're excited you're interested in our program.</p>

      <div class="section">
        <div class="section-title">🎯 Next Step: Enroll Your Swimmer</div>
        <p>To get started, you'll need to enroll your swimmer. We offer two enrollment options:</p>

        <div class="option-card">
          <h3 class="option-title">Option 1: Private Pay</h3>
          <p>Enroll directly through your parent portal. You'll complete a short enrollment form, then book your swimmer's Initial Assessment.</p>
          <p style="text-align: center;">
            <a href="https://icanswim209.com" class="button">Enroll Now</a>
          </p>
        </div>

        <div class="option-card">
          <h3 class="option-title">Option 2: Regional Center Funding</h3>
          <p>If your swimmer receives services through a Regional Center (such as Valley Mountain Regional Center, Central Valley Regional Center, etc.), swim lessons may be fully covered at no cost to you!</p>
          <p><strong>Here's how it works:</strong></p>
          <ol>
            <li>Contact your Regional Center coordinator</li>
            <li>Request a referral for swim lessons with I Can Swim</li>
            <li>Once we receive the referral, we'll reach out with next steps</li>
          </ol>
          <p><em>Not sure if your swimmer qualifies? Contact your Regional Center coordinator—they can help determine eligibility.</em></p>
        </div>
      </div>

      <div class="contact-info">
        <h3 style="margin-top: 0; color: #0ea5e9;">❓ Questions?</h3>
        <p>We're happy to help you figure out the best option for your family!</p>
        <div class="info-row"><span class="label">📧 Email:</span> info@icanswim209.com</div>
        <div class="info-row"><span class="label">📞 Phone:</span> (209) 778-7877</div>
        <div class="info-row"><span class="label">📱 Text:</span> 209-643-7969</div>
      </div>

      <div class="footer">
        <p>We hope to see you at the pool soon!</p>
        <p><strong>Warm regards,</strong><br>
        <strong>Sutton Lucas</strong><br>
        Owner, I Can Swim</p>
        <p>📍 Turlock: 2705 Sebastian Drive, Turlock, CA 95382</p>
        <p>📍 Modesto: 1212 Kansas Ave, Modesto, CA 95351</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}