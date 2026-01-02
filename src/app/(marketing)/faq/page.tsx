export default function FAQPage() {
  const faqs = [
    {
      question: "How do I get started with swim lessons?",
      answer: "Start by booking an assessment session. This 30-minute session helps us understand your swimmer's comfort level, abilities, and goals. After the assessment, we'll create a personalized lesson plan and schedule your regular lessons."
    },
    {
      question: "What should we bring to the first lesson?",
      answer: "Please bring a swimsuit, towel, and any necessary swim aids (goggles, swim cap, etc.). We provide all equipment including floatation devices and teaching aids. We also have private changing areas available."
    },
    {
      question: "Do you accept regional center funding?",
      answer: "Yes! We work with Valley Mountain Regional Center (VMRC) and Central Valley Regional Center (CVRC) to provide fully funded swim lessons for eligible children. We also accept private pay. We do not accept insurance."
    },
    {
      question: "What is your cancellation policy?",
      answer: "We require 24-hour notice for cancellations. Late cancellations (less than 24 hours) may result in being charged for the session. In case of illness or emergency, please contact us as soon as possible to discuss options."
    },
    {
      question: "How long are the lessons?",
      answer: "Assessment sessions are 30 minutes. Regular lessons are 30 minutes of one-on-one instruction. We find this duration is optimal for maintaining focus and making consistent progress."
    },
    {
      question: "What qualifications do your instructors have?",
      answer: "All our instructors are certified in adaptive aquatics, CPR, First Aid, and water safety. They undergo regular training in the latest teaching methodologies and special needs education. Many have additional certifications in areas like autism spectrum disorders and sensory processing."
    },
    {
      question: "Can parents watch the lessons?",
      answer: "Yes! We have observation areas where parents can watch lessons. For some swimmers, we may recommend starting with parents nearby for comfort, then gradually increasing independence as the swimmer becomes more comfortable."
    },
    {
      question: "What if my child has specific medical needs?",
      answer: "We work closely with families to understand any medical conditions, allergies, or special needs. Our instructors are trained to accommodate various medical needs and we maintain emergency action plans for each swimmer."
    },
    {
      question: "How do you handle swimmers who are afraid of water?",
      answer: "We use a gentle, gradual approach to build water confidence. We start with basic water exploration and play, gradually introducing new skills at the swimmer's pace. Our instructors are specially trained in working with water-anxious swimmers."
    },
    {
      question: "Do you offer make-up lessons?",
      answer: "Yes, we offer make-up lessons for cancellations with 24-hour notice, subject to availability. Make-up lessons must be scheduled within 30 days of the missed lesson. We recommend scheduling make-ups as soon as possible."
    },
    {
      question: "What ages do you teach?",
      answer: "We teach swimmers from 3 years old through adulthood. Our adaptive approach allows us to work with swimmers of all ages and ability levels."
    },
    {
      question: "How do you track progress?",
      answer: "We use a comprehensive progress tracking system that includes regular skill assessments, written progress reports, and parent-instructor conferences. For regional center clients, we also provide progress reports to coordinators."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-xl text-gray-600 font-inter max-w-3xl mx-auto">
          Find answers to common questions about our swim programs
        </p>
      </div>

      {/* FAQ Grid */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border">
              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h3 className="text-lg font-semibold text-gray-900 group-open:text-cyan-600">
                    {faq.question}
                  </h3>
                  <span className="flex-shrink-0 ml-4">
                    <svg className="w-5 h-5 text-gray-500 group-open:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <svg className="w-5 h-5 text-cyan-600 hidden group-open:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </span>
                </summary>
                <div className="mt-4 text-gray-700">
                  <p>{faq.answer}</p>
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>

      {/* Still Have Questions */}
      <div className="max-w-4xl mx-auto mt-16">
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-8 lg:p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            We&apos;re here to help! Contact us for more information or to schedule your assessment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/contact"
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200"
            >
              Contact Us
            </a>
            <a
              href="tel:2097787877"
              className="border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200"
            >
              Call: (209) 778-7877
            </a>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/programs"
            className="bg-white rounded-xl p-6 text-center border hover:border-cyan-300 hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Programs</h3>
            <p className="text-gray-600 text-sm">Learn about our swim lesson options</p>
          </a>
          <a
            href="/pricing"
            className="bg-white rounded-xl p-6 text-center border hover:border-cyan-300 hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pricing</h3>
            <p className="text-gray-600 text-sm">View our transparent pricing</p>
          </a>
          <a
            href="/regional-centers"
            className="bg-white rounded-xl p-6 text-center border hover:border-cyan-300 hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Funding</h3>
            <p className="text-gray-600 text-sm">Learn about regional center funding</p>
          </a>
        </div>
      </div>
    </div>
  );
}