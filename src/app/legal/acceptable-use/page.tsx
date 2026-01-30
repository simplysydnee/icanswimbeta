import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy - I Can Swim',
  description: 'Rules and guidelines for using the I Can Swim platform',
};

export default function AcceptableUsePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Acceptable Use Policy</h1>
      <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-gray-700">
            This Acceptable Use Policy outlines the rules and guidelines for using the I Can Swim platform. By accessing or using our platform, you agree to comply with this policy. Violation of this policy may result in suspension or termination of your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Prohibited Activities</h2>
          <p className="text-gray-700 mb-4">You agree not to use the platform to:</p>

          <h3 className="text-xl font-medium mb-2">Illegal Activities</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Engage in any illegal or fraudulent activities</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon intellectual property rights</li>
            <li>Engage in money laundering or terrorist financing</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">Security Violations</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Attempt to gain unauthorized access to any part of the platform</li>
            <li>Test or scan the vulnerability of our systems</li>
            <li>Interfere with or disrupt the platform or servers</li>
            <li>Introduce viruses, malware, or other harmful code</li>
            <li>Use any automated system to access the platform without permission</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">Content Violations</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Upload or transmit harmful, threatening, or abusive content</li>
            <li>Share content that is defamatory, obscene, or harassing</li>
            <li>Post false or misleading information</li>
            <li>Share content that violates others' privacy rights</li>
            <li>Upload content containing viruses or malicious code</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">Platform Abuse</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Create multiple accounts to circumvent restrictions</li>
            <li>Use the platform for commercial purposes without authorization</li>
            <li>Attempt to manipulate booking systems or pricing</li>
            <li>Share account credentials with unauthorized users</li>
            <li>Use the platform to harass or intimidate others</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. User Content Guidelines</h2>
          <p className="text-gray-700 mb-4">When submitting content to the platform, you agree to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Provide accurate and complete information about swimmers</li>
            <li>Update information promptly when changes occur</li>
            <li>Obtain necessary consents before sharing others' information</li>
            <li>Ensure content is appropriate and relevant to swim instruction</li>
            <li>Respect the privacy and dignity of all individuals</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Communication Standards</h2>
          <p className="text-gray-700 mb-4">When communicating through our platform, you agree to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Use respectful and professional language</li>
            <li>Not send spam or unsolicited messages</li>
            <li>Not impersonate others or misrepresent your identity</li>
            <li>Not share confidential or sensitive information inappropriately</li>
            <li>Report any inappropriate communications to us immediately</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Booking and Payment Conduct</h2>
          <p className="text-gray-700 mb-4">You agree to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Make bookings in good faith</li>
            <li>Provide accurate payment information</li>
            <li>Not attempt to circumvent payment systems</li>
            <li>Follow cancellation policies and procedures</li>
            <li>Not engage in fraudulent booking activities</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Safety and Professionalism</h2>
          <p className="text-gray-700 mb-4">All users must maintain appropriate standards of safety and professionalism:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Follow all safety guidelines and instructions</li>
            <li>Report safety concerns immediately</li>
            <li>Treat instructors and staff with respect</li>
            <li>Maintain appropriate boundaries in all interactions</li>
            <li>Comply with facility rules and regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Monitoring and Enforcement</h2>
          <p className="text-gray-700 mb-4">
            We reserve the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Monitor platform usage to ensure compliance with this policy</li>
            <li>Investigate suspected violations</li>
            <li>Remove or disable access to content that violates this policy</li>
            <li>Suspend or terminate accounts for policy violations</li>
            <li>Cooperate with law enforcement when required</li>
          </ul>
          <p className="text-gray-700 mt-4">
            We may take any action we deem appropriate, including warning users, removing content, or terminating accounts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Reporting Violations</h2>
          <p className="text-gray-700 mb-4">
            If you become aware of any violation of this policy, please report it to us immediately:
          </p>
          <p className="text-gray-700">
            Email: abuse@icanswim.com<br />
            Phone: (555) 123-4567<br />
            Include as much detail as possible, including screenshots and relevant information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
          <p className="text-gray-700">
            We may update this Acceptable Use Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
          <p className="text-gray-700">
            If you have any questions about this Acceptable Use Policy, please contact us:
          </p>
          <p className="text-gray-700 mt-2">
            Email: legal@icanswim.com<br />
            Phone: (555) 123-4567<br />
            Address: 123 Swim Lane, Watertown, ST 12345
          </p>
        </section>
      </div>
    </div>
  );
}