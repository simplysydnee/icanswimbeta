export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-6">
            I Can Swim
          </h1>
          <div className="w-full max-w-lg mx-auto mb-6">
            <svg
              viewBox="0 0 120 8"
              fill="none"
              className="w-full h-4 lg:h-6"
              preserveAspectRatio="none"
            >
              <mask id="taperMask">
                <linearGradient id="taperGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="white" stopOpacity="0" />
                  <stop offset="15%" stopColor="white" stopOpacity="1" />
                  <stop offset="85%" stopColor="white" stopOpacity="1" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <rect x="0" y="0" width="120" height="8" fill="url(#taperGradient)" />
              </mask>
              <path
                d="M0,4 C20,1 40,1 60,4 C80,7 100,7 120,4"
                stroke="url(#waveGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                mask="url(#taperMask)"
              />
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2a5e84" />
                  <stop offset="100%" stopColor="#23a1c0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="text-xl lg:text-2xl text-gray-600 font-inter mb-12 max-w-2xl mx-auto leading-relaxed">
            Adaptive Swim Lessons for Children with Special Needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/enroll"
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 font-inter text-lg"
            >
              Get Started
            </a>
            <a
              href="/contact"
              className="border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 font-inter text-lg"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-12">
            Why Choose I Can Swim?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Personalized Instruction</h3>
              <p className="text-gray-600">
                Every lesson is tailored to your child&apos;s unique abilities, learning style, and comfort level in the water.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Safety First</h3>
              <p className="text-gray-600">
                We prioritize water safety skills that can save lives, teaching swimmers how to be safe in and around water.
              </p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Inclusive Environment</h3>
              <p className="text-gray-600">
                Our program welcomes swimmers of all abilities, creating a supportive and encouraging learning environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Preview */}
      <section className="py-16 lg:py-24 bg-gray-50 rounded-3xl">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-12">
            Our Programs
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Private Pay Lessons</h3>
              <p className="text-gray-600 mb-6">
                One-on-one instruction with certified adaptive aquatics instructors. Perfect for families looking for personalized attention and flexible scheduling.
              </p>
              <a href="/programs" className="text-cyan-600 font-semibold hover:text-cyan-700">
                Learn more →
              </a>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">VMRC Funded Lessons</h3>
              <p className="text-gray-600 mb-6">
                We partner with Valley Mountain Regional Center to provide funded swim lessons for eligible children. No out-of-pocket cost for qualified families.
              </p>
              <a href="/regional-centers" className="text-cyan-600 font-semibold hover:text-cyan-700">
                Learn more →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of families who trust I Can Swim with their child&apos;s water safety and swimming development
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/enroll"
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 font-inter text-lg"
            >
              Book Your Assessment
            </a>
            <a
              href="/contact"
              className="border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 font-inter text-lg"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}