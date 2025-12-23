import Image from 'next/image';

export default function RegionalCentersPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-4">
          Regional Centers
        </h1>
        <p className="text-xl text-gray-600 font-inter max-w-3xl mx-auto">
          Partnering with regional centers to provide funded swim lessons
        </p>
      </div>

      {/* VMRC Section */}
      <div className="max-w-6xl mx-auto mb-16">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="lg:w-1/3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="relative h-48 w-full">
                  <Image
                    src="/images/vmrc-logo.jpg"
                    alt="Valley Mountain Regional Center Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
            <div className="lg:w-2/3">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Valley Mountain Regional Center (VMRC)</h2>
              <p className="text-gray-700 mb-6">
                We are proud to partner with Valley Mountain Regional Center to provide fully funded adaptive swim lessons for eligible children. VMRC serves individuals with developmental disabilities in Stanislaus, San Joaquin, Amador, Calaveras, and Tuolumne counties.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Services Covered</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Initial assessment</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Weekly swim lessons</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Progress tracking</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Eligibility</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">VMRC client</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Approved by coordinator</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Purchase Order required</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CVR Center */}
      <div className="max-w-6xl mx-auto mb-16">
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="lg:w-1/3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="relative h-48 w-full">
                  <Image
                    src="/images/cvrc-logo.webp"
                    alt="Central Valley Regional Center Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
            <div className="lg:w-2/3">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Central Valley Regional Center (CVR)</h2>
              <p className="text-gray-700 mb-6">
                We also work with Central Valley Regional Center to provide adaptive swim lessons for eligible children. CVR serves individuals with developmental disabilities in Fresno, Kings, Madera, Mariposa, Merced, and Tulare counties.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Get Started</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-cyan-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <span className="text-cyan-700 text-sm font-bold">1</span>
                      </div>
                      <span className="text-gray-700">Contact your regional center coordinator</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-cyan-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <span className="text-cyan-700 text-sm font-bold">2</span>
                      </div>
                      <span className="text-gray-700">Request swim lessons as a service</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-cyan-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <span className="text-cyan-700 text-sm font-bold">3</span>
                      </div>
                      <span className="text-gray-700">Submit referral to I Can Swim</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What We Provide</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">All necessary paperwork</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Progress reports for coordinators</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-cyan-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Purchase Order management</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">The Funding Process</h2>
        <div className="space-y-8">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-blue-700 font-bold">1</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Coordinator Referral</h3>
              <p className="text-gray-700">
                Your regional center coordinator submits a referral to I Can Swim for swim lessons as an approved service.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-blue-700 font-bold">2</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Assessment & Plan</h3>
              <p className="text-gray-700">
                We conduct an initial assessment and create a personalized swim lesson plan for approval.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-blue-700 font-bold">3</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Purchase Order</h3>
              <p className="text-gray-700">
                The regional center issues a Purchase Order (PO) authorizing a specific number of lessons.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-blue-700 font-bold">4</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lessons Begin</h3>
              <p className="text-gray-700">
                Weekly lessons start, with progress reports sent to coordinators for continued funding approval.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-4xl mx-auto mt-16 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-8 lg:p-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Help with Regional Centers?</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Our team is experienced in working with regional centers and can help guide you through the process.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200"
          >
            Contact Us for Assistance
          </a>
        </div>
      </div>
    </div>
  );
}