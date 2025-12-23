'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ClipboardList, Target, AlertCircle, Waves, User, Stethoscope, MessageSquare, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface SwimmerAssessmentData {
  id: string;
  first_name: string;
  last_name: string;
  swim_goals?: string[];
  strengths_interests?: string;
  comfortable_in_water?: string;
  previous_swim_lessons?: boolean;
  diagnosis?: string[];
  has_medical_conditions?: boolean;
  medical_conditions_description?: string;
  has_allergies?: boolean;
  allergies_description?: string;
  communication_type?: string;
  toilet_trained?: boolean;
  current_level_id?: string;
  swim_levels?: {
    name: string;
    display_name: string;
  };
}

interface AssessmentData {
  id?: string;
  scheduled_date?: string;
  completed_at?: string;
  instructor_notes?: string;
  status?: string;
  profiles?: {
    full_name: string;
  };
}

interface SwimmerAssessmentInfoProps {
  swimmerData: SwimmerAssessmentData | null;
  assessmentData: AssessmentData | null;
}

export default function SwimmerAssessmentInfo({ swimmerData, assessmentData }: SwimmerAssessmentInfoProps) {
  if (!swimmerData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No swimmer data available</p>
      </div>
    );
  }

  const hasAssessment = assessmentData?.status === 'completed';
  const hasMedicalInfo = swimmerData.has_medical_conditions || swimmerData.has_allergies || swimmerData.diagnosis?.length;
  const hasGoals = swimmerData.swim_goals?.length || swimmerData.strengths_interests;

  return (
    <div className="space-y-6">
      {/* Assessment Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            Assessment Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasAssessment ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Assessment Date</p>
                  <p className="font-medium">
                    {assessmentData.completed_at
                      ? format(new Date(assessmentData.completed_at), 'MMMM d, yyyy')
                      : 'Not completed'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assessed by</p>
                  <p className="font-medium">
                    {assessmentData.profiles?.full_name || 'Unknown instructor'}
                  </p>
                </div>
              </div>

              {swimmerData.swim_levels && (
                <div>
                  <p className="text-sm text-muted-foreground">Initial Level Assigned</p>
                  <Badge variant="outline" className="mt-1">
                    {swimmerData.swim_levels.display_name || swimmerData.swim_levels.name}
                  </Badge>
                </div>
              )}

              {assessmentData.instructor_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Assessment Notes</p>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    {assessmentData.instructor_notes}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>No assessment completed yet.</p>
              <p className="text-sm">Assessment pending or not scheduled.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Swimmer Goals */}
      {hasGoals && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Goals & Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {swimmerData.swim_goals?.length ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Swim Goals</p>
                <ul className="space-y-1">
                  {swimmerData.swim_goals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {swimmerData.strengths_interests && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Strengths & Interests</p>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {swimmerData.strengths_interests}
                </div>
              </div>
            )}

            {swimmerData.comfortable_in_water && (
              <div>
                <p className="text-sm text-muted-foreground">Comfort in Water</p>
                <p className="font-medium capitalize">
                  {swimmerData.comfortable_in_water.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Previous Swim Lessons</p>
              <p className="font-medium">
                {swimmerData.previous_swim_lessons ? 'Yes' : 'No'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medical & Safety Information */}
      {hasMedicalInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {swimmerData.diagnosis?.length ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Diagnosis</p>
                <div className="flex flex-wrap gap-2">
                  {swimmerData.diagnosis.map((diagnosis, index) => (
                    <Badge key={index} variant="secondary">
                      {diagnosis}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {swimmerData.has_medical_conditions && swimmerData.medical_conditions_description && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Medical Conditions</p>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {swimmerData.medical_conditions_description}
                </div>
              </div>
            )}

            {swimmerData.has_allergies && swimmerData.allergies_description && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Allergies</p>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {swimmerData.allergies_description}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {swimmerData.communication_type && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Communication
                  </p>
                  <p className="font-medium capitalize">
                    {swimmerData.communication_type.replace(/_/g, ' ')}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Toilet Trained
                </p>
                <p className="font-medium">
                  {swimmerData.toilet_trained === true ? 'Yes' :
                   swimmerData.toilet_trained === false ? 'No' : 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Swimming Background */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Waves className="h-5 w-5" />
            Swimming Background
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Previous Lessons</p>
              <p className="font-medium">
                {swimmerData.previous_swim_lessons ? 'Yes' : 'No'}
              </p>
            </div>

            {swimmerData.comfortable_in_water && (
              <div>
                <p className="text-sm text-muted-foreground">Comfort Level</p>
                <p className="font-medium capitalize">
                  {swimmerData.comfortable_in_water.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            {swimmerData.swim_levels && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Current Level</p>
                <Badge variant="outline" className="mt-1">
                  {swimmerData.swim_levels.display_name || swimmerData.swim_levels.name}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* No Data Message */}
      {!hasAssessment && !hasGoals && !hasMedicalInfo && (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No assessment or background information available for this swimmer.</p>
          <p className="text-sm mt-2">Complete an assessment to see detailed information here.</p>
        </div>
      )}
    </div>
  );
}