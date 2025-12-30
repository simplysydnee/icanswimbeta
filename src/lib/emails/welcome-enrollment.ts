/**
 * Welcome enrollment email templates
 * Sent when swimmers are approved for enrollment (private pay) or when referrals are completed (funded)
 */

import { wrapEmailWithHeader, createButton, BRAND_MAIN } from './email-wrapper'

const APP_URL = 'https://icanswimbeta.vercel.app'

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

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Welcome to I Can Swim!</h2>

    <p>Hi ${data.parentName},</p>

    <p>Welcome to I Can Swim! We're excited to have <strong>${data.swimmerName}</strong> join our swim family. Here's what you need to know to get started:</p>

    <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${BRAND_MAIN};">
      <h3 style="margin-top: 0; color: ${BRAND_MAIN};">First Step: Assessment Session</h3>
      <p><strong>Assessment is REQUIRED</strong> before starting regular lessons. This 30-minute session ($75) allows our instructors to:</p>
      <ul>
        <li>Evaluate ${data.swimmerName}'s current swimming abilities</li>
        <li>Create a customized swimming plan tailored to their needs</li>
        <li>Match them with the best instructor for their learning style</li>
        <li>Set realistic goals and expectations</li>
      </ul>
    </div>

    ${createButton('Book Your Assessment', `${APP_URL}/parent/book`)}

    <div style="margin: 30px 0;">
      <h3 style="color: ${BRAND_MAIN};">After Assessment: Regular Lessons</h3>
      <p>Once the assessment is complete, you can book regular lessons in two ways:</p>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <h4 style="margin-top: 0; color: ${BRAND_MAIN};">Option 1: Weekly Recurring</h4>
        <p>Book the same day and time each week for a month. This provides consistency and helps swimmers progress faster.</p>

        <h4 style="color: ${BRAND_MAIN};">Option 2: Single Sessions</h4>
        <p>Book individual sessions as needed. Perfect for flexible schedules.</p>
      </div>

      <p><strong>Pricing:</strong> $75 per session, billed after each lesson.</p>
    </div>

    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin-top: 0; color: #d97706;">Consistency is Key!</h3>
      <p>Regular attendance helps swimmers build confidence and skills faster. We recommend weekly lessons for best results.</p>
    </div>

    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
      <h3 style="margin-top: 0; color: #0ea5e9;">Stay Connected</h3>
      <p><strong>Text Line:</strong> 209-643-7969</p>
      <p>Use this number for:</p>
      <ul>
        <li>Morning-of lesson reminders</li>
        <li>Quick questions</li>
        <li>Schedule changes (24+ hours in advance)</li>
      </ul>
      <p><em>We'll text you the morning of each lesson as a reminder!</em></p>
    </div>

    <p>We're looking forward to helping ${data.swimmerName} become a confident swimmer!</p>

    <p>Warm regards,<br><strong>Sutton Lucas</strong><br>Owner, I Can Swim</p>
  `;

  const html = wrapEmailWithHeader(content);
  return { subject, html };
}

// Generate funded welcome email
export function generateFundedWelcomeEmail(data: WelcomeEmailData): EmailContent {
  const subject = `Welcome to I Can Swim, ${data.parentName}! 🏊`;
  const fundingSource = data.fundingSourceName || 'Regional Center';

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Welcome to I Can Swim!</h2>

    <p>Hi ${data.parentName},</p>

    <p>Welcome to I Can Swim! We're excited to have <strong>${data.swimmerName}</strong> join our swim family through ${fundingSource}. Here's what you need to know:</p>

    <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h3 style="margin-top: 0; color: #1d4ed8;">Assessment Authorization Submitted</h3>
      <p><strong>Great news!</strong> We've submitted the assessment authorization to ${fundingSource}. <em>You don't need to do anything at this time.</em></p>
      <p>We'll email you as soon as it's approved so you can book ${data.swimmerName}'s assessment session.</p>
    </div>

    <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${BRAND_MAIN};">
      <h3 style="margin-top: 0; color: ${BRAND_MAIN};">Assessment Session</h3>
      <p>Once approved, the 30-minute assessment will:</p>
      <ul>
        <li>Create a customized swimming plan for ${data.swimmerName}</li>
        <li>Match them with the best instructor for their needs</li>
        <li>Set personalized goals and expectations</li>
        <li><strong>No cost to you</strong> - covered by ${fundingSource}</li>
      </ul>
    </div>

    ${createButton('Log In to Your Account', `${APP_URL}/login`)}

    <div style="margin: 30px 0;">
      <h3 style="color: ${BRAND_MAIN};">After Assessment: Regular Lessons</h3>
      <p>After the assessment, we'll request a Lessons Authorization from ${fundingSource}. Once approved, you can book regular lessons in two ways:</p>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <h4 style="margin-top: 0; color: ${BRAND_MAIN};">Option 1: Weekly Recurring</h4>
        <p>Book the same day and time each week. Consistency helps swimmers progress faster.</p>

        <h4 style="color: ${BRAND_MAIN};">Option 2: Single Sessions</h4>
        <p>Book individual sessions as needed. Perfect for flexible schedules.</p>
      </div>

      <p><strong>All lessons are covered by ${fundingSource} at no cost to you.</strong></p>
    </div>

    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin-top: 0; color: #d97706;">Consistency is Crucial!</h3>
      <p><strong>Important:</strong> Regular attendance is essential for funded clients. Late cancellations or frequent absences can affect:</p>
      <ul>
        <li>Future authorizations from ${fundingSource}</li>
        <li>Your swimmer's spot in our program</li>
        <li>Their swimming progress and skill development</li>
      </ul>
      <p>We strongly recommend weekly recurring lessons for the best experience and results.</p>
    </div>

    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
      <h3 style="margin-top: 0; color: #0ea5e9;">Stay Connected</h3>
      <p><strong>Text Line:</strong> 209-643-7969</p>
      <p>Use this number for:</p>
      <ul>
        <li>Morning-of lesson reminders</li>
        <li>Quick questions</li>
        <li>Schedule changes (24+ hours in advance)</li>
      </ul>
      <p><em>We'll text you the morning of each lesson as a reminder!</em></p>
    </div>

    <p>We're looking forward to helping ${data.swimmerName} become a confident swimmer!</p>

    <p>Warm regards,<br><strong>Sutton Lucas</strong><br>Owner, I Can Swim</p>
  `;

  const html = wrapEmailWithHeader(content);
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

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Welcome to I Can Swim!</h2>

    <p>Hi ${data.parentName},</p>

    <p>Thanks for creating your I Can Swim account! We're excited you're interested in our program.</p>

    <div style="margin: 30px 0;">
      <h3 style="color: ${BRAND_MAIN};">Next Step: Enroll Your Swimmer</h3>
      <p>To get started, you'll need to enroll your swimmer. We offer two enrollment options:</p>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${BRAND_MAIN};">
        <h4 style="margin-top: 0; color: ${BRAND_MAIN};">Option 1: Private Pay</h4>
        <p>Enroll directly through your parent portal. You'll complete a short enrollment form, then book your swimmer's Initial Assessment.</p>
      </div>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${BRAND_MAIN};">
        <h4 style="margin-top: 0; color: ${BRAND_MAIN};">Option 2: Regional Center Funding</h4>
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

    ${createButton('Start Enrollment', `${APP_URL}/enroll`)}

    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
      <h3 style="margin-top: 0; color: #0ea5e9;">Questions?</h3>
      <p>We're happy to help you figure out the best option for your family!</p>
    </div>

    <p>We hope to see you at the pool soon!</p>

    <p>Warm regards,<br><strong>Sutton Lucas</strong><br>Owner, I Can Swim</p>
  `;

  const html = wrapEmailWithHeader(content);
  return { subject, html };
}