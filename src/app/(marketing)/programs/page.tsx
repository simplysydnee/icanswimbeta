import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default async function ProgramsPage() {
  return (
    <div>
      {/* Section 1: Hero */}
      <section className="py-16 bg-gradient-to-b from-cyan-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-600 mb-4">
            Our Programs
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A personalized approach to water safety and confidence for swimmers of all abilities
          </p>
        </div>
      </section>

      {/* Section 2: The Journey (3 Steps) */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Your Swim Journey</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-cyan-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Initial Assessment</h3>
              <p className="text-gray-600">
                A 30-minute evaluation where we assess water comfort, communication style,
                physical abilities, and individual needs to understand each swimmer&apos;s starting point.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-cyan-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Personalized Program</h3>
              <p className="text-gray-600">
                Based on the assessment, we design a customized lesson plan tailored
                to each swimmer&apos;s unique needs, learning style, and goals.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-cyan-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Progressive Skill Building</h3>
              <p className="text-gray-600">
                Swimmers advance through our level system at their own pace,
                building confidence and celebrating milestones along the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Swim Levels (Color-Coded Cards) */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Our Swim Levels</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our progressive level system guides swimmers from water introduction to advanced skills
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* White Level */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gray-100 border-2 border-gray-300 rounded-full mx-auto mb-3"></div>
              <h3 className="font-bold text-gray-800 mb-2">White</h3>
              <p className="text-sm text-gray-600">Water Introduction & Comfort</p>
            </div>

            {/* Yellow Level */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-yellow-400 rounded-full mx-auto mb-3"></div>
              <h3 className="font-bold text-yellow-800 mb-2">Yellow</h3>
              <p className="text-sm text-yellow-700">Basic Water Safety & Floating</p>
            </div>

            {/* Orange Level */}
            <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-400 rounded-full mx-auto mb-3"></div>
              <h3 className="font-bold text-orange-800 mb-2">Orange</h3>
              <p className="text-sm text-orange-700">Foundational Swim Skills</p>
            </div>

            {/* Green Level */}
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-3"></div>
              <h3 className="font-bold text-green-800 mb-2">Green</h3>
              <p className="text-sm text-green-700">Stroke Development</p>
            </div>

            {/* Blue Level */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1">
              <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-3"></div>
              <h3 className="font-bold text-blue-800 mb-2">Blue</h3>
              <p className="text-sm text-blue-700">Advanced Skills & Endurance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: What Makes Us Different */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Makes Us Different</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Individualized Attention</h3>
                <p className="text-gray-600 text-sm">Personalized instruction tailored to each swimmer&apos;s unique needs and pace</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Adaptive Techniques</h3>
                <p className="text-gray-600 text-sm">Specialized methods for swimmers of all abilities and learning styles</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Consistent Instructors</h3>
                <p className="text-gray-600 text-sm">Build trust and rapport with the same instructor each lesson</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Progress Tracking</h3>
                <p className="text-gray-600 text-sm">Regular updates and milestone celebrations to keep you informed</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Certified Instructors</h3>
                <p className="text-gray-600 text-sm">CPR/First Aid certified with adaptive swim training</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Family Communication</h3>
                <p className="text-gray-600 text-sm">Clear updates after each lesson so you&apos;re always in the loop</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: CTA */}
      <section className="py-16 bg-cyan-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
          <p className="text-cyan-100 mb-8 max-w-xl mx-auto">
            Every swimmer begins with an assessment. Let&apos;s find the right program for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                View Pricing
              </Button>
            </Link>
            <Link href="/regional-centers">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent text-white border-white hover:bg-white hover:text-cyan-600">
                Learn About Funding
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}