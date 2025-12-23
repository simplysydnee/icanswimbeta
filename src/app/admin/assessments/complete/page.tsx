'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { AssessmentWizard } from '@/components/assessments/AssessmentWizard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ClipboardCheck, Smartphone, Save, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

interface AssessmentData {
  swimmerId: string;
  swimmerName?: string;
  instructor: string;
  assessmentDate: Date;
  strengths: string;
  challenges: string;
  swimSkills: Record<string, 'emerging' | 'na' | 'no' | 'yes'>;
  roadblocks: Record<string, { needsAddressing: boolean; intervention: string }>;
  swimSkillsGoals: string;
  safetyGoals: string;
  approvalStatus: 'approved' | 'dropped' | '';
}

export default function CompleteAssessmentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (data: AssessmentData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const response = await fetch('/api/assessments/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit assessment');
      }

      // Redirect to success page or assessments list
      router.push('/admin/assessments?status=completed');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit assessment');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'instructor']}>
      <div className="container mx-auto py-4 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Complete Assessment</h1>
            <p className="text-muted-foreground">
              5-step wizard for poolside assessment completion
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/assessments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Link>
          </Button>
        </div>

        {/* Mobile Warning */}
        <div className="md:hidden mb-6">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800">Mobile-Friendly Design</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    This form is optimized for mobile use at poolside. Each step is designed for
                    easy tapping and swiping. Your progress is automatically saved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wizard Column */}
          <div className="lg:col-span-2">
            {submitError && (
              <Card className="border-red-200 bg-red-50 mb-6">
                <CardContent className="pt-6">
                  <div className="text-red-700">
                    <h4 className="font-medium mb-1">Submission Error</h4>
                    <p className="text-sm">{submitError}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <AssessmentWizard
              onSubmit={handleSubmit}
              initialData={{
                assessmentDate: new Date(),
              }}
            />
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Instructions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Instructions
                </CardTitle>
                <CardDescription>
                  How to complete this assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-700 text-xs font-bold">1</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">Basic Information</div>
                      <div className="text-xs text-muted-foreground">
                        Select swimmer, instructor, date, and provide strengths/challenges
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-700 text-xs font-bold">2</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">Swim Skills</div>
                      <div className="text-xs text-muted-foreground">
                        Rate 24 swim skills (Emerging, N/A, No, Yes)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-700 text-xs font-bold">3</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">Roadblocks</div>
                      <div className="text-xs text-muted-foreground">
                        Identify 14 potential roadblocks and intervention strategies
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-700 text-xs font-bold">4</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">Goals</div>
                      <div className="text-xs text-muted-foreground">
                        Set swim skills and safety goals
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-700 text-xs font-bold">5</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">Approval & Submit</div>
                      <div className="text-xs text-muted-foreground">
                        Review and approve/drop for lessons
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auto-Save Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Auto-Save Feature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Save className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Progress Saved Automatically</div>
                      <div className="text-xs text-muted-foreground">
                        Your work is saved to your browser every few seconds
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Save className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">24-Hour Recovery</div>
                      <div className="text-xs text-muted-foreground">
                        Drafts are saved for 24 hours if you need to continue later
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Upload className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Submit When Ready</div>
                      <div className="text-xs text-muted-foreground">
                        Submit only when all steps are complete and reviewed
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">•</span>
                    <span>Be specific and objective in your observations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">•</span>
                    <span>Use positive, constructive language</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">•</span>
                    <span>Focus on what the swimmer CAN do</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">•</span>
                    <span>Set realistic, achievable goals</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">•</span>
                    <span>Consider the swimmer's unique needs and abilities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">•</span>
                    <span>Parents will see the strengths, challenges, and goals</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* What Happens Next Card */}
            <Card>
              <CardHeader>
                <CardTitle>What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-800 text-sm">If Approved:</div>
                    <ul className="text-xs text-blue-700 mt-1 space-y-1">
                      <li>• Swimmer enrolled in regular lessons</li>
                      <li>• Parents notified with assessment summary</li>
                      <li>• For funded clients: Lessons PO created</li>
                      <li>• Booking opens for regular sessions</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="font-medium text-amber-800 text-sm">If Dropped:</div>
                    <ul className="text-xs text-amber-700 mt-1 space-y-1">
                      <li>• Swimmer remains on waitlist</li>
                      <li>• Parents notified with recommendations</li>
                      <li>• Assessment saved for future reference</li>
                      <li>• Can reassess in 3-6 months</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Navigation for Mobile */}
        <div className="md:hidden mt-6">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/admin/assessments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Link>
            </Button>
            <Button variant="outline" className="flex-1" disabled>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}