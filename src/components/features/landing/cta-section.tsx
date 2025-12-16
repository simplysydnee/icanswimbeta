import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-2">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-3xl">Ready to Get Started?</CardTitle>
          <CardDescription className="text-lg">
            Join our community of confident swimmers. Book your assessment session today!
          </CardDescription>
          <Link href="/signup">
            <Button size="lg" className="mt-4">
              Schedule Your Session
            </Button>
          </Link>
        </CardHeader>
      </Card>
    </section>
  );
}