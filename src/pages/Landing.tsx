import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Calendar, Heart, Shield, Waves } from "lucide-react";
import { Link } from "react-router-dom";
import logoHeader from "@/assets/logo-header.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <img 
            src={logoHeader} 
            alt="I CAN SWIM" 
            className="h-16 w-auto object-contain"
          />
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/booking">
              <Button>Book a Session</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Adaptive Swim Lessons for Every Child
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Building confidence, safety, and joy in the water through personalized, adaptive instruction tailored to each swimmer's unique needs.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/booking">
              <Button size="lg" className="text-lg">
                <Calendar className="mr-2 h-5 w-5" />
                Book Your First Lesson
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg">
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

      {/* Levels Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            <Waves className="inline-block h-8 w-8 mr-2 text-primary" />
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
