import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Calendar, Heart, Shield, Waves, UserPlus, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import logoHeader from "@/assets/logo-header.png";
import { ReferralRequestDialog } from "@/components/ReferralRequestDialog";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between flex-wrap gap-4">
          <img 
            src={logoHeader} 
            alt="I CAN SWIM" 
            className="h-12 sm:h-16 w-auto object-contain"
          />
          <div className="flex gap-2 sm:gap-4 flex-wrap">
            <Link to="/login">
              <Button variant="outline" size="sm" className="sm:size-default">Login</Button>
            </Link>
            <Link to="/booking">
              <Button size="sm" className="sm:size-default">Book a Session</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent leading-tight">
            Adaptive Swim Lessons for Every Child
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            Building confidence, safety, and joy in the water through personalized, adaptive instruction tailored to each swimmer's unique needs.
          </p>
          <div className="flex gap-3 sm:gap-4 justify-center flex-wrap px-4">
            <Link to="/booking">
              <Button size="lg" className="text-base sm:text-lg w-full sm:w-auto">
                <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Book Your First Lesson
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-base sm:text-lg w-full sm:w-auto">
                View Progress
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Heart className="h-12 w-12 text-primary mb-2" />
              <CardTitle>Individualized Approach</CardTitle>
              <CardDescription>
                Every swimmer receives personalized instruction designed around their unique strengths, interests, and learning style.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-accent/50 transition-colors">
            <CardHeader>
              <Shield className="h-12 w-12 text-accent mb-2" />
              <CardTitle>Safety First</CardTitle>
              <CardDescription>
                Expert instructors trained in adaptive techniques ensure a safe, supportive environment for building water confidence.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-secondary/50 transition-colors">
            <CardHeader>
              <Award className="h-12 w-12 text-secondary mb-2" />
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>
                Follow your swimmer's journey with detailed skill assessments, video reviews, and instructor recommendations.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Enrollment Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4">
            <UserPlus className="inline-block h-6 w-6 sm:h-8 sm:w-8 mr-2 text-primary" />
            Ready to Start Swimming?
          </h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-12">
            Choose the enrollment option that's right for you
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Direct Enrollment */}
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <FileText className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Direct Enrollment</CardTitle>
                <CardDescription className="text-base">
                  For private-pay clients ready to enroll and start lessons right away
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>✓ Complete enrollment form</li>
                  <li>✓ Schedule initial assessment</li>
                  <li>✓ Book your first lessons</li>
                  <li>✓ Start swimming within days</li>
                </ul>
                <Link to="/booking" className="block">
                  <Button className="w-full" size="lg">
                    <Calendar className="mr-2 h-5 w-5" />
                    Enroll Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* VMRC/Referral */}
            <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
              <CardHeader>
                <Heart className="h-12 w-12 text-accent mb-4" />
                <CardTitle className="text-xl">VMRC / Referral Request</CardTitle>
                <CardDescription className="text-base">
                  For VMRC clients or those with coordinator referrals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>✓ Submit referral request</li>
                  <li>✓ Coordinator reviews and approves</li>
                  <li>✓ Complete enrollment process</li>
                  <li>✓ Schedule assessment</li>
                </ul>
                <ReferralRequestDialog
                  trigger={
                    <Button variant="outline" className="w-full" size="lg">
                      <Heart className="mr-2 h-5 w-5" />
                      Request Referral
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-sm text-blue-900">
              <strong>Not sure which option is right for you?</strong> Contact us and we'll help guide you through the enrollment process.
            </p>
          </div>
        </div>
      </section>

      {/* Levels Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12">
            <Waves className="inline-block h-6 w-6 sm:h-8 sm:w-8 mr-2 text-primary" />
            Our Swim Levels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: "Tadpole", emoji: "🐸", description: "Water comfort and basic safety awareness" },
              { name: "Minnow", emoji: "🐠", description: "Floating, kicking, and breath control" },
              { name: "Starfish", emoji: "⭐", description: "Independent floating and water recovery" },
              { name: "Dolphin", emoji: "🐬", description: "Swimming independently with proper form" },
              { name: "Shark", emoji: "🦈", description: "Advanced strokes and water safety mastery" },
            ].map((level) => (
              <Card key={level.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-3xl">{level.emoji}</span>
                    {level.name}
                  </CardTitle>
                  <CardDescription>{level.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-2">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-3xl">Ready to Get Started?</CardTitle>
            <CardDescription className="text-lg">
              Join our community of confident swimmers. Book your assessment session today!
            </CardDescription>
            <Link to="/booking">
              <Button size="lg" className="mt-4">
                Schedule Your Session
              </Button>
            </Link>
          </CardHeader>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t">
        <div className="text-center text-muted-foreground text-sm">
          <p>© 2024 I CAN SWIM. All rights reserved.</p>
          <p className="mt-2">Building confidence and safety in the water, one swimmer at a time.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
