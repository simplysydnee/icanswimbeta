'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { AssessmentWizard } from '@/components/assessments/AssessmentWizard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ClipboardCheck, Smartphone, Save, Upload, User } from 'lucide-react';
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

export default function InstructorCompleteAssessmentPage() {
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

      // Redirect to instructor dashboard or assessments list
      router.push('/instructor?assessment_completed=true');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit assessment');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['instructor', 'admin']}>
      <div className="container mx-auto py-4 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center">
                <User className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Complete Assessment</h1>
                <p className="text-muted-foreground">
                  Instructor poolside assessment completion
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/instructor">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
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
                  <h4 className="font-medium text-amber-800">Poolside Mobile Form</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Designed for use at poolside. Each step is optimized for mobile.
                    Your progress auto-saves so you can complete between lessons.
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
            {/* Instructor Instructions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Instructor Instructions
                </CardTitle>
                <CardDescription>
                  Tips for effective assessment completion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <div className="font-medium text-cyan-800 text-sm">Complete Immediately</div>
                    <div className="text-xs text-cyan-700 mt-1">
                      Complete assessments right after the lesson while observations are fresh.
                    </div>
                  </div>
                  <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <div className="font-medium text-cyan-800 text-sm">Be Objective</div>
                    <div className="text-xs text-cyan-700 mt-1">
                      Focus on observable behaviors and skills. Avoid assumptions.
                    </div>
                  </div>
                  <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <div className="font-medium text-cyan-800 text-sm">Use Positive Language</div>
                    <div className="text-xs text-cyan-700 mt-1">
                      Frame challenges as opportunities. Parents will read this.
                    </div>
                  </div>
                  <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <div className="font-medium text-cyan-800 text-sm">Set Realistic Goals</div>
                    <div className="text-xs text-cyan-700 mt-1">
                      Goals should be achievable in 4-8 lessons based on current abilities.
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
                      <div className="font-medium text-sm">Work Between Lessons</div>
                      <div className="text-xs text-muted-foreground">
                        Save progress and continue during breaks between swimmers
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
                        Drafts saved for 24 hours if you need to finish tomorrow
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
                        Submit only when complete. Admin will review if needed.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Assessment Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">•</span>
                    <span><strong>Strengths:</strong> What did they do well today?</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">•</span>
                    <span><strong>Challenges:</strong> What was difficult? Be specific.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">•</span>
                    <span><strong>Skills:</strong> Rate based on today's performance only</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">•</span>
                    <span><strong>Roadblocks:</strong> What actually interfered with learning?</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">•</span>
                    <span><strong>Goals:</strong> What should we work on next?</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-600 mr-2">•</span>
                    <span><strong>Approval:</strong> Are they ready for regular lessons?</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* What Happens Next Card */}
            <Card>
              <CardHeader>
                <CardTitle>After Submission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-800 text-sm">Assessment Review</div>
                    <ul className="text-xs text-blue-700 mt-1 space-y-1">
                      <li>• Admin reviews all assessments</li>
                      <li>• Parents receive email summary</li>
                      <li>• Swimmer status updated in system</li>
                      <li>• You can view submitted assessments</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-800 text-sm">Next Steps</div>
                    <ul className="text-xs text-green-700 mt-1 space-y-1">
                      <li>• Continue with next swimmer's assessment</li>
                      <li>• Check dashboard for new assessments</li>
                      <li>• Review past assessments for progress tracking</li>
                      <li>• Contact admin with any questions</li>
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
              <Link href="/instructor">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
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