import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah J.',
    location: 'Turlock',
    rating: 5,
    text: 'The progress tracking has been amazing for my son with autism. We can see exactly how he\'s improving each week.',
    swimmer: 'Age 8, Autism',
  },
  {
    name: 'Michael R.',
    location: 'Modesto',
    rating: 5,
    text: 'Funding source billing used to be so complicated. Now it\'s completely automated and we never miss a session.',
    swimmer: 'Age 6, Speech Delay',
  },
  {
    name: 'Jennifer L.',
    location: 'Turlock',
    rating: 5,
    text: 'Booking lessons is so easy now. I can schedule around my work and see all available time slots instantly.',
    swimmer: 'Age 7, Sensory Processing',
  },
  {
    name: 'David K.',
    location: 'Modesto',
    rating: 5,
    text: 'The adaptive lesson plans have made such a difference. My daughter is finally comfortable in the water.',
    swimmer: 'Age 9, Developmental Disability',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 sm:py-32 bg-muted/30">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            What Families Are{' '}
            <span className="gradient-text">Saying</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Hear from parents and caregivers about their experience with I Can Swim
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative group hover:shadow-glow transition-all duration-300">
              <CardContent className="pt-6">
                {/* Rating */}
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Testimonial text */}
                <blockquote className="text-lg text-muted-foreground mb-4 italic">
                  &ldquo;{testimonial.text}&rdquo;
                </blockquote>

                {/* Author info */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">{testimonial.swimmer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold mb-4">Ready to Get Started?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join the hundreds of families who have discovered the joy of swimming through our adaptive lessons.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/booking"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Book Your Assessment
            </a>
            <a
              href="tel:209-985-1538"
              className="inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Call 209-985-1538
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}