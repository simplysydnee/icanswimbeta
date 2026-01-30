import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HIPAA Notice of Privacy Practices - I Can Swim',
  description: 'How we protect your health information under HIPAA',
};

export default function HipaaNoticePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Notice of Privacy Practices</h1>
      <p className="text-gray-600 mb-8">Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

      <div className="space-y-8">
        <section className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-blue-800">THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.</h2>
          <p className="text-blue-700">
            I Can Swim is committed to protecting the privacy of your health information. This Notice describes our privacy practices and your rights regarding your protected health information (PHI) under the Health Insurance Portability and Accountability Act (HIPAA).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Our Responsibilities</h2>
          <p className="text-gray-700 mb-4">
            We are required by law to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Maintain the privacy of your protected health information</li>
            <li>Provide you with this notice of our legal duties and privacy practices</li>
            <li>Notify you following a breach of unsecured protected health information</li>
            <li>Follow the terms of this notice</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How We May Use and Disclose Your Health Information</h2>

          <h3 className="text-xl font-medium mb-2">For Treatment</h3>
          <p className="text-gray-700 mb-4">
            We may use your health information to provide swim instruction and ensure safety. For example, we may share information about medical conditions with instructors to provide appropriate accommodations.
          </p>

          <h3 className="text-xl font-medium mb-2">For Payment</h3>
          <p className="text-gray-700 mb-4">
            We may use and disclose your health information to obtain payment for services. For example, we may provide information to insurance companies or funding sources.
          </p>

          <h3 className="text-xl font-medium mb-2">For Health Care Operations</h3>
          <p className="text-gray-700 mb-4">
            We may use and disclose health information for our operations. For example, we may use information to improve the quality of our services or for training purposes.
          </p>

          <h3 className="text-xl font-medium mb-2">Other Permitted Uses and Disclosures</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Required by Law:</strong> When required by federal, state, or local law</li>
            <li><strong>Public Health Activities:</strong> To report public health risks</li>
            <li><strong>Victims of Abuse or Neglect:</strong> To report suspected abuse</li>
            <li><strong>Health Oversight:</strong> To health oversight agencies</li>
            <li><strong>Judicial Proceedings:</strong> In response to court orders</li>
            <li><strong>Law Enforcement:</strong> For specific law enforcement purposes</li>
            <li><strong>Serious Threat to Health or Safety:</strong> To prevent serious harm</li>
            <li><strong>Workers' Compensation:</strong> As authorized by workers' compensation laws</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Uses and Disclosures Requiring Your Authorization</h2>
          <p className="text-gray-700 mb-4">
            We will obtain your written authorization before using or disclosing your health information for purposes not described in this notice, including:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Most uses and disclosures of psychotherapy notes</li>
            <li>Marketing purposes</li>
            <li>Sale of your health information</li>
            <li>Other uses and disclosures not described in this notice</li>
          </ul>
          <p className="text-gray-700 mt-4">
            You may revoke your authorization in writing at any time, except to the extent we have already taken action in reliance on the authorization.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Rights Regarding Your Health Information</h2>

          <h3 className="text-xl font-medium mb-2">Right to Inspect and Copy</h3>
          <p className="text-gray-700 mb-4">
            You have the right to inspect and obtain a copy of your health information that we maintain.
          </p>

          <h3 className="text-xl font-medium mb-2">Right to Request Amendment</h3>
          <p className="text-gray-700 mb-4">
            You may request that we amend your health information if you believe it is incorrect or incomplete.
          </p>

          <h3 className="text-xl font-medium mb-2">Right to an Accounting of Disclosures</h3>
          <p className="text-gray-700 mb-4">
            You have the right to receive an accounting of certain disclosures of your health information.
          </p>

          <h3 className="text-xl font-medium mb-2">Right to Request Restrictions</h3>
          <p className="text-gray-700 mb-4">
            You may request restrictions on certain uses and disclosures of your health information.
          </p>

          <h3 className="text-xl font-medium mb-2">Right to Request Confidential Communications</h3>
          <p className="text-gray-700 mb-4">
            You may request that we communicate with you about health matters in a certain way or at a certain location.
          </p>

          <h3 className="text-xl font-medium mb-2">Right to a Paper Copy of This Notice</h3>
          <p className="text-gray-700">
            You have the right to a paper copy of this notice at any time.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Changes to This Notice</h2>
          <p className="text-gray-700">
            We reserve the right to change the terms of this notice. The new notice will be effective for all health information we maintain. We will post the revised notice on our website and make it available at our facility.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Complaints</h2>
          <p className="text-gray-700 mb-4">
            If you believe your privacy rights have been violated, you may file a complaint with us or with the Secretary of the Department of Health and Human Services. You will not be retaliated against for filing a complaint.
          </p>
          <p className="text-gray-700">
            To file a complaint with us, contact our Privacy Officer:
          </p>
          <p className="text-gray-700 mt-2">
            Privacy Officer<br />
            I Can Swim<br />
            Email: privacy@icanswim.com<br />
            Phone: (555) 123-4567<br />
            Address: 123 Swim Lane, Watertown, ST 12345
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <p className="text-gray-700">
            If you have any questions about this notice or our privacy practices, please contact our Privacy Officer at the information above.
          </p>
        </section>
      </div>
    </div>
  );
}