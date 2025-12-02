import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Heart, Calendar, UserPlus } from 'lucide-react';
import Link from 'next/link';

export function EnrollmentSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4">
          <UserPlus className="inline-block h-8 w-8 mr-2 text-primary" />
          Ready to Start Swimming?
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Choose the enrollment option that's right for you
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Private Pay Card */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <FileText className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Private Pay Enrollment</CardTitle>
              <CardDescription className="text-base">
                For families paying directly for swim lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-900">
                  <strong>⚠️ Not a VMRC Client?</strong> This enrollment is for private-pay families only. If you have VMRC authorization or a coordinator referral, use the "Request Referral" option instead.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>✓ Complete enrollment form</li>
                <li>✓ Schedule initial assessment</li>
                <li>✓ Book your first lessons</li>
                <li>✓ Start swimming within days</li>
              </ul>
              <Link href="/signup">
                <Button className="w-full" size="lg">
                  <Calendar className="mr-2 h-5 w-5" />
                  Enroll Now (Private Pay)
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* VMRC Referral Card */}
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
              <Button variant="outline" className="w-full" size="lg">
                <Heart className="mr-2 h-5 w-5" />
                Request Referral
              </Button>
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
  );
}