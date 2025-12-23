export default function TeamPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-4">
          Our Team
        </h1>
        <p className="text-xl text-gray-600 font-inter max-w-3xl mx-auto">
          Meet the dedicated professionals who make I Can Swim possible
        </p>
      </div>

      {/* Team Members */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Founder */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center mb-6">
              <span className="text-4xl font-bold text-cyan-700">SL</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Sutton Lucas</h3>
            <p className="text-cyan-600 font-medium mb-4">Founder & Head Instructor</p>
            <p className="text-gray-700">
              With over a decade of experience in adaptive aquatics, Sutton brings passion, expertise, and compassion to every lesson.
            </p>
          </div>

          {/* Instructor 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-6">
              <span className="text-4xl font-bold text-blue-700">AI</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Alex Johnson</h3>
            <p className="text-cyan-600 font-medium mb-4">Senior Instructor</p>
            <p className="text-gray-700">
              Certified in multiple teaching methodologies with 8 years of experience working with children with special needs.
            </p>
          </div>

          {/* Instructor 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center mb-6">
              <span className="text-4xl font-bold text-cyan-700">MS</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Maria Sanchez</h3>
            <p className="text-cyan-600 font-medium mb-4">Instructor & Program Coordinator</p>
            <p className="text-gray-700">
              Specializes in working with non-verbal swimmers and creating sensory-friendly learning environments.
            </p>
          </div>
        </div>

        {/* Team Values */}
        <div className="mt-16 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Team Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Patience & Understanding</h3>
              <p className="text-gray-700">
                We understand that every child learns at their own pace. Our instructors are trained to be patient, observant, and responsive to each swimmer&apos;s needs.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Continuous Training</h3>
              <p className="text-gray-700">
                Our team undergoes regular training in the latest adaptive aquatics techniques, safety protocols, and special needs education.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Family Partnership</h3>
              <p className="text-gray-700">
                We believe in working closely with families to understand each swimmer&apos;s unique needs, goals, and progress.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Safety Certification</h3>
              <p className="text-gray-700">
                All instructors are certified in CPR, First Aid, and water safety, with additional training in special needs aquatic safety.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}