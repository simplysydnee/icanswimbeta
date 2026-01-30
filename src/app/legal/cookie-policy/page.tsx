import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy - I Can Swim',
  description: 'Information about how we use cookies and similar technologies',
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
      <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
          <p className="text-gray-700">
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
          <p className="text-gray-700 mb-4">
            We use cookies for several purposes:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Essential Cookies:</strong> Necessary for the website to function properly</li>
            <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our website</li>
            <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
            <li><strong>Analytics Cookies:</strong> Help us improve our website by collecting anonymous information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cookie Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Session Cookies</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Maintain your session while using our platform</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Session</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Authentication Cookies</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Remember your login status</td>
                  <td className="px-6 py-4 text-sm text-gray-500">30 days</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Preference Cookies</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Remember your language and display preferences</td>
                  <td className="px-6 py-4 text-sm text-gray-500">1 year</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Analytics Cookies</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Help us understand how our website is used</td>
                  <td className="px-6 py-4 text-sm text-gray-500">2 years</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Security Cookies</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Help prevent fraud and protect your account</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Session</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
          <p className="text-gray-700 mb-4">
            We may also use cookies from third-party services, including:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Google Analytics:</strong> For website analytics and performance tracking</li>
            <li><strong>Payment Processors:</strong> For secure payment processing</li>
            <li><strong>Social Media Platforms:</strong> For social sharing features (if applicable)</li>
            <li><strong>Advertising Networks:</strong> For marketing purposes (with your consent)</li>
          </ul>
          <p className="text-gray-700 mt-4">
            These third parties have their own privacy policies and cookie practices. We recommend reviewing their policies for more information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Managing Cookies</h2>
          <p className="text-gray-700 mb-4">
            You can control and manage cookies in various ways:
          </p>

          <h3 className="text-xl font-medium mb-2">Browser Settings</h3>
          <p className="text-gray-700 mb-4">
            Most web browsers allow you to control cookies through their settings. You can usually find these settings in the "Options" or "Preferences" menu of your browser.
          </p>

          <h3 className="text-xl font-medium mb-2">Opting Out</h3>
          <p className="text-gray-700 mb-4">
            You can opt out of certain types of cookies:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Analytics cookies through browser settings or opt-out tools</li>
            <li>Advertising cookies through industry opt-out programs</li>
            <li>Third-party cookies through individual service opt-outs</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">Important Note</h3>
          <p className="text-gray-700">
            Please note that if you disable cookies, some features of our website may not function properly. Essential cookies are necessary for the basic functionality of our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Do Not Track Signals</h2>
          <p className="text-gray-700">
            Some browsers have a "Do Not Track" feature that lets you tell websites you do not want to be tracked. Currently, we do not respond to "Do Not Track" signals because there is no industry standard for how to respond.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Changes to This Cookie Policy</h2>
          <p className="text-gray-700">
            We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions about our use of cookies, please contact us:
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