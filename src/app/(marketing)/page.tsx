export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-white py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-2">
              I Can Swim
            </h1>
            <div className="w-full max-w-lg mx-auto mb-4">
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
              <a href="/enroll" className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 font-inter text-lg">
                Get Started
              </a>
              <a href="/about" className="border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 font-inter text-lg">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#1E3A5F] font-playfair-display">500+</div>
              <div className="text-gray-600 font-inter">Swimmers Served</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#1E3A5F] font-playfair-display">15+</div>
              <div className="text-gray-600 font-inter">Years Experience</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#1E3A5F] font-playfair-display">98%</div>
              <div className="text-gray-600 font-inter">Parent Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1E3A5F] font-playfair-display mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 font-inter max-w-2xl mx-auto">
              Simple, safe, and effective swim lessons designed specifically for children with special needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#1E3A5F] text-white rounded-full flex items-center justify-center text-2xl font-bold font-playfair-display mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold text-[#1E3A5F] font-inter">Initial Assessment</h3>
              <p className="text-gray-600 font-inter leading-relaxed">
                We evaluate your child&apos;s comfort level and swimming abilities to create a personalized lesson plan
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#1E3A5F] text-white rounded-full flex items-center justify-center text-2xl font-bold font-playfair-display mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold text-[#1E3A5F] font-inter">Personalized Lessons</h3>
              <p className="text-gray-600 font-inter leading-relaxed">
                One-on-one instruction tailored to your child&apos;s unique needs and learning style
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#1E3A5F] text-white rounded-full flex items-center justify-center text-2xl font-bold font-playfair-display mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold text-[#1E3A5F] font-inter">Progress Tracking</h3>
              <p className="text-gray-600 font-inter leading-relaxed">
                Regular updates on your child&apos;s achievements and skill development
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1E3A5F] font-playfair-display mb-4">
              Why Choose I Can Swim
            </h2>
            <p className="text-xl text-gray-600 font-inter max-w-2xl mx-auto">
              The experts you can trust with your child&apos;s swimming journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-4">
              <div className="w-12 h-12 bg-[#23a1c0] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1E3A5F] font-inter">Specialized Expertise</h3>
              <p className="text-gray-600 font-inter leading-relaxed">
                Our instructors are trained in adaptive swim techniques for children with autism, Down syndrome, and other special needs
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-4">
              <div className="w-12 h-12 bg-[#23a1c0] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1E3A5F] font-inter">Funding Approved</h3>
              <p className="text-gray-600 font-inter leading-relaxed">
                We work directly with regional centers and funding sources to provide state-funded swim lessons for eligible families
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-4">
              <div className="w-12 h-12 bg-[#23a1c0] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1E3A5F] font-inter">Safety First Approach</h3>
              <p className="text-gray-600 font-inter leading-relaxed">
                Certified lifeguards and specialized safety protocols ensure your child&apos;s wellbeing in and around the water
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-4">
              <div className="w-12 h-12 bg-[#23a1c0] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1E3A5F] font-inter">Individualized Attention</h3>
              <p className="text-gray-600 font-inter leading-relaxed">
                One-on-one instruction allows us to focus on your child&apos;s specific goals and comfort level
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-4">
              <div className="w-12 h-12 bg-[#23a1c0] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1E3A5F] font-inter">Proven Results</h3>
              <p className="text-gray-600 font-inter leading-relaxed">
                Track record of helping children build confidence, improve coordination, and develop essential water safety skills
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-4">
              <div className="w-12 h-12 bg-[#23a1c0] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1E3A5F] font-inter">Flexible Scheduling</h3>
              <p className="text-gray-600 font-inter leading-relaxed">
                Convenient locations in Turlock and Modesto with flexible scheduling to fit your family&apos;s needs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-[#1E3A5F]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white font-playfair-display mb-6">
              Ready to Start Your Child&apos;s Swimming Journey?
            </h2>
            <p className="text-xl text-gray-200 font-inter mb-8 max-w-2xl mx-auto">
              Join hundreds of families who trust I Can Swim with their child&apos;s water safety and swimming development
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="/enroll" className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 font-inter text-lg">
                Book Your Assessment
              </a>
              <a href="/contact" className="border-2 border-white text-white hover:bg-white hover:text-gray-800 font-semibold px-8 py-4 rounded-lg transition-colors duration-200 font-inter text-lg">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}