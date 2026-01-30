import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - I Can Swim',
  description: 'Terms and conditions for using the I Can Swim platform',
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700">
            By accessing and using the I Can Swim platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
          <p className="text-gray-700 mb-4">
            Permission is granted to temporarily use the I Can Swim platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to decompile or reverse engineer any software contained on the platform</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
          <p className="text-gray-700">
            To access certain features of the platform, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
          <p className="text-gray-700 mb-4">
            You are responsible for:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Providing accurate information about swimmers and their medical conditions</li>
            <li>Ensuring all payments are made in a timely manner</li>
            <li>Complying with all applicable laws and regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
          <p className="text-gray-700">
            All fees for swim lessons and related services are due at the time of booking or as otherwise specified. We reserve the right to change our pricing at any time, but price changes will not affect existing bookings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Cancellation and Refund Policy</h2>
          <p className="text-gray-700">
            Cancellations must be made at least 24 hours in advance to receive a full refund. Late cancellations or no-shows may be subject to full charge. Refunds for medical emergencies will be considered on a case-by-case basis.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
          <p className="text-gray-700">
            In no event shall I Can Swim or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Modifications to Terms</h2>
          <p className="text-gray-700">
            I Can Swim may revise these terms of service at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
          <p className="text-gray-700">
            These terms and conditions are governed by and construed in accordance with the laws of the state where I Can Swim operates and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
          <p className="text-gray-700">
            If you have any questions about these Terms of Service, please contact us at:
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