import { Button } from '@/components/ui/button';
import { Calendar, LogIn } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      {/* Wave background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 to-accent/20"></div>
        <div className="absolute bottom-0 right-0 w-full h-32 bg-gradient-to-l from-primary/20 to-accent/20"></div>
      </div>

      <div className="container mx-auto px-4 py-16 sm:py-20 md:py-28 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8 sm:space-y-10">
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent font-montserrat">
                Adaptive Swim Lessons
              </span>
              <br />
              <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent font-quicksand font-semibold">
                For Every Child
              </span>
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
          </div>

          {/* Subheading */}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Building <span className="font-semibold text-primary">confidence</span>,
            <span className="font-semibold text-accent"> safety</span>, and
            <span className="font-semibold text-secondary"> joy</span> in the water through
            personalized instruction tailored to each swimmer's unique needs.
          </p>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { text: "Special Needs Expertise", color: "text-primary" },
              { text: "Funding Approved Provider", color: "text-accent" },
              { text: "Swim Angel Fish Certified Instructors", color: "text-secondary" }
            ].map((benefit, index) => (
              <div key={index} className="flex items-center justify-center space-x-2 text-sm font-medium text-center">
                <div className={`w-2 h-2 rounded-full ${benefit.color} bg-current flex-shrink-0`}></div>
                <span className={benefit.color}>{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button size="lg" className="text-base sm:text-lg px-8 py-3 h-auto">
                <Calendar className="mr-2 h-5 w-5" />
                Book Your Assessment
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base sm:text-lg px-8 py-3 h-auto border-2">
                <LogIn className="mr-2 h-5 w-5" />
                Parent Dashboard
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Serving families in the Central Valley since 2024</span>
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto pt-4">
            {[
              { text: "Individualized Approach", color: "text-primary" },
              { text: "Safety First", color: "text-accent" },
              { text: "Progress Tracking", color: "text-secondary" }
            ].map((benefit, index) => (
              <div key={index} className="flex items-center justify-center space-x-2 text-sm font-medium">
                <div className={`w-2 h-2 rounded-full ${benefit.color} bg-current`}></div>
                <span className={benefit.color}>{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}