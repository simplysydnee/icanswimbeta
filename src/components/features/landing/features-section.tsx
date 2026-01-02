import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Shield, Award } from 'lucide-react';

export function FeaturesSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
  );
}