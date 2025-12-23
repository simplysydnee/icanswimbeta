import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-4">
            About I Can Swim
          </h1>
          <p className="text-xl text-gray-600 font-inter max-w-3xl mx-auto">
            Building confidence, safety, and joy in the water through personalized, adaptive instruction
          </p>
        </div>

        {/* Mission Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-6">
              At I Can Swim, we believe every child deserves the opportunity to experience the joy and freedom of swimming.
              Our mission is to provide adaptive swim lessons that are tailored to each swimmer&apos;s unique needs,
              building not just swimming skills but also confidence, safety awareness, and a lifelong love for the water.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-cyan-700 mb-2">Personalized Approach</h3>
                <p className="text-gray-600">
                  Each lesson is customized to the swimmer&apos;s abilities, learning style, and comfort level in the water.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-cyan-700 mb-2">Safety First</h3>
                <p className="text-gray-600">
                  We prioritize water safety skills that can save lives, teaching swimmers how to be safe in and around water.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-cyan-700 mb-2">Inclusive Environment</h3>
                <p className="text-gray-600">
                  Our program welcomes swimmers of all abilities, creating a supportive and encouraging learning environment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Story */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="prose prose-lg text-gray-700">
            <p>
              Founded in 2024 by Sutton Lucas, I Can Swim began with a simple observation: many children with special needs
              were missing out on the life-changing benefits of swimming due to a lack of specialized instruction.
            </p>
            <p>
              What started as a small program serving families in the Central Valley is growing into a
              comprehensive swim school. Our success comes from our commitment to understanding each swimmer&apos;s
              unique needs and creating personalized learning paths that celebrate every achievement, no matter how small.
            </p>
            <p>
              Today, we&apos;re proud to partner with Valley Mountain Regional Center (VMRC) and other organizations
              to make adaptive swim lessons accessible to all families, regardless of their financial situation.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Meet Our Founder</h2>
          <div className="bg-white rounded-2xl p-8 shadow-sm border">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/3">
                <div className="bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl p-1">
                  <div className="bg-white rounded-lg p-4">
                    <div className="aspect-square rounded-lg overflow-hidden">
                      <Image
                        src="/images/sutton-lucas.jpg"
                        alt="Sutton Lucas"
                        width={400}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-2/3">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sutton Lucas</h3>
                <p className="text-cyan-600 font-medium mb-4">Owner & Lead Instructor</p>
                <p className="text-gray-700 mb-4">
                  Sutton has been teaching individuals with special needs for more than 14 years. She holds a Bachelor of Arts in Liberal Studies from Cal Poly San Luis Obispo, a Master's in Education, and three teaching credentials in Special Education. She is Level 2 Adaptive Swim Whisper certified from Swim Angelfish.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm">BA Liberal Studies, Cal Poly SLO</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">MA Education</span>
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">3 Special Education Credentials</span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">Level 2 Adaptive Swim Whisper</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Locations</h2>
          <div className="grid grid-cols-1 gap-8">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Modesto</h3>
              <p className="text-gray-700 mb-4">
                1212 Kansas Ave, Modesto, CA 95351
              </p>
              <p className="text-gray-600 mb-4">
                Our lessons take place at Aquatic Dreams, a facility we rent for our swim program.
              </p>
              <div className="space-y-2 text-gray-600">
                <p>• Heated indoor pool</p>
                <p>• Private changing rooms</p>
                <p>• Sensory-friendly environment</p>
                <p>• Observation area for parents</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}