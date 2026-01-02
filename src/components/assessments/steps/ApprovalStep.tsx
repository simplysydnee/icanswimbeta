'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, FileText, User, Calendar, Droplets, AlertTriangle, Target } from 'lucide-react';
import { format } from 'date-fns';

interface ApprovalStepProps {
  data: {
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
  };
  onChange: (data: { approvalStatus: 'approved' | 'dropped' }) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ApprovalStep({ data, onChange, onSubmit, isSubmitting }: ApprovalStepProps) {
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const handleApprovalChange = (value: 'approved' | 'dropped') => {
    onChange({ approvalStatus: value });
  };

  const handleSubmit = () => {
    if (!confirmSubmit) {
      setConfirmSubmit(true);
      return;
    }
    onSubmit();
  };

  // Calculate summary stats
  const swimSkillsYes = Object.values(data.swimSkills || {}).filter(v => v === 'yes').length;
  const swimSkillsEmerging = Object.values(data.swimSkills || {}).filter(v => v === 'emerging').length;
  const roadblocksToAddress = Object.values(data.roadblocks || {}).filter(r => r.needsAddressing).length;

  const instructorName = data.instructor
    ? data.instructor.charAt(0).toUpperCase() + data.instructor.slice(1)
    : 'Not selected';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-cyan-600" />
          <Label className="text-lg font-semibold">Approval & Submit</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Review the assessment summary and select approval status
        </p>
      </div>

      {/* Assessment Summary */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-lg">Assessment Summary</h3>

        {/* Basic Info Summary */}
        <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <Label className="text-sm">Swimmer</Label>
            </div>
            <div className="font-medium">
              {data.swimmerName || 'Not selected'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <Label className="text-sm">Instructor</Label>
            </div>
            <div className="font-medium">{instructorName}</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <Label className="text-sm">Assessment Date</Label>
            </div>
            <div className="font-medium">
              {data.assessmentDate ? format(data.assessmentDate, 'PPP') : 'Not selected'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <Label className="text-sm">Assessment Status</Label>
            </div>
            <div className="font-medium">
              {data.approvalStatus ? (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  data.approvalStatus === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {data.approvalStatus === 'approved' ? 'Approved for lessons' : 'Dropped for lessons'}
                </span>
              ) : (
                'Not selected'
              )}
            </div>
          </div>
        </div>

        {/* Skills Summary */}
        <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="border rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Droplets className="h-4 w-4 text-green-600" />
              <div className="text-xl font-bold text-green-600">{swimSkillsYes}</div>
            </div>
            <div className="text-xs text-muted-foreground">Skills Mastered</div>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Droplets className="h-4 w-4 text-amber-600" />
              <div className="text-xl font-bold text-amber-600">{swimSkillsEmerging}</div>
            </div>
            <div className="text-xs text-muted-foreground">Emerging Skills</div>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div className="text-xl font-bold text-red-600">{roadblocksToAddress}</div>
            </div>
            <div className="text-xs text-muted-foreground">Roadblocks to Address</div>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-600" />
              <div className="text-xl font-bold text-blue-600">
                {(data.swimSkillsGoals || '').split('\n').filter(l => l.trim()).length +
                 (data.safetyGoals || '').split('\n').filter(l => l.trim()).length}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Goals Set</div>
          </div>
        </div>

        {/* Key Observations */}
        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-sm font-medium">Key Strengths</Label>
            <div className="text-sm mt-1 line-clamp-2">{data.strengths || 'Not provided'}</div>
          </div>
          <div>
            <Label className="text-sm font-medium">Key Challenges</Label>
            <div className="text-sm mt-1 line-clamp-2">{data.challenges || 'Not provided'}</div>
          </div>
        </div>
      </div>

      {/* Approval Status */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Approval Status <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={data.approvalStatus}
          onValueChange={handleApprovalChange}
          className="space-y-3"
        >
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="approved" id="approved" />
              <div className="flex-1">
                <Label htmlFor="approved" className="flex items-center gap-2 cursor-pointer">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Approved for lessons by I Can Swim</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1 ml-7">
                  Swimmer is ready to begin regular lessons. They will be enrolled in the system
                  and parents will be notified. For funded clients, a lessons PO will be created.
                </p>
              </div>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="dropped" id="dropped" />
              <div className="flex-1">
                <Label htmlFor="dropped" className="flex items-center gap-2 cursor-pointer">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold">Dropped for lessons by I Can Swim</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1 ml-7">
                  Swimmer is not ready for lessons at this time. They will remain on the waitlist
                  and parents will be notified with recommendations for when to try again.
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Submission Warning */}
      {data.approvalStatus === 'dropped' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800">Important Notice</h4>
              <p className="text-sm text-amber-700 mt-1">
                Dropping a swimmer means they will not be enrolled in regular lessons.
                Parents will be notified and the swimmer will remain on the waitlist.
                Please ensure you have discussed this decision with the admin team.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4 border-t">
        {!confirmSubmit ? (
          <Button
            onClick={handleSubmit}
            disabled={!data.approvalStatus || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                Submitting Assessment...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Review and Submit Assessment
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800">Final Confirmation</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Are you sure you want to submit this assessment? Once submitted, it cannot be edited.
                    The swimmer will be {data.approvalStatus === 'approved' ? 'enrolled in' : 'dropped from'} lessons
                    and parents will be notified automatically.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="flex-1"
                size="lg"
                variant="destructive"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Yes, Submit Assessment
                  </>
                )}
              </Button>
              <Button
                onClick={() => setConfirmSubmit(false)}
                variant="outline"
                className="flex-1"
                size="lg"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!data.approvalStatus && (
          <p className="text-sm text-red-600 mt-2 text-center">
            Please select an approval status before submitting
          </p>
        )}
      </div>
    </div>
  );
}