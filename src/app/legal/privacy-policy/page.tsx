import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - I Can Swim',
  description: 'How we collect, use, and protect your personal information',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-gray-700">
            I Can Swim is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <p className="text-gray-700 mb-4">We collect several types of information from and about users of our platform:</p>

          <h3 className="text-xl font-medium mb-2">Personal Information</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Name, email address, phone number</li>
            <li>Billing and payment information</li>
            <li>Swimmer information (name, age, medical conditions, skill level)</li>
            <li>Emergency contact information</li>
            <li>Photographs or videos (with consent)</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">Usage Data</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>IP address, browser type, device information</li>
            <li>Pages visited, time spent on pages</li>
            <li>Booking history and preferences</li>
            <li>Communication preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">We use the information we collect for various purposes:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>To provide and maintain our services</li>
            <li>To process bookings and payments</li>
            <li>To communicate with you about lessons, schedule changes, or emergencies</li>
            <li>To personalize your experience</li>
            <li>To ensure swimmer safety and provide appropriate instruction</li>
            <li>To comply with legal obligations</li>
            <li>To improve our platform and services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
          <p className="text-gray-700 mb-4">We may share your information in the following circumstances:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>With Instructors:</strong> Necessary swimmer information for safety and instruction</li>
            <li><strong>With Payment Processors:</strong> To complete transactions</li>
            <li><strong>For Legal Compliance:</strong> When required by law or to protect rights</li>
            <li><strong>With Your Consent:</strong> For specific purposes you authorize</li>
            <li><strong>In Emergency Situations:</strong> To medical personnel or emergency contacts</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p className="text-gray-700">
            We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Children's Privacy</h2>
          <p className="text-gray-700">
            Our platform collects information about children only with parental consent. We take extra precautions to protect children's privacy and comply with applicable children's privacy laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
          <p className="text-gray-700 mb-4">Depending on your location, you may have the following rights:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Access to your personal information</li>
            <li>Correction of inaccurate information</li>
            <li>Deletion of your information (subject to legal requirements)</li>
            <li>Restriction of processing</li>
            <li>Data portability</li>
            <li>Objection to processing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
          <p className="text-gray-700">
            We use cookies and similar tracking technologies to track activity on our platform. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
          <p className="text-gray-700">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <p className="text-gray-700 mt-2">
            Email: privacy@icanswim.com<br />
            Phone: (555) 123-4567<br />
            Address: 123 Swim Lane, Watertown, ST 12345
          </p>
        </section>
      </div>
    </div>
  );
}