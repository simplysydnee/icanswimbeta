'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Lightbulb,
  Shield,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

// Types for assessment report
export interface AssessmentReport {
  id: string;
  assessment_id: string;
  swimmer_id: string;
  instructor_id: string;
  assessment_date: string;
  strengths?: string;
  challenges?: string;
  swim_skills?: any; // JSONB field
  roadblocks?: any; // JSONB field
  swim_skills_goals?: string;
  safety_goals?: string;
  approval_status?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface AssessmentReportTabProps {
  assessment: AssessmentReport | null;
}

// Helper component for skill badges
const SkillBadge = ({ skill, mastered }: { skill: string; mastered: boolean }) => (
  <Badge
    variant={mastered ? "default" : "outline"}
    className={`flex items-center gap-1 ${mastered ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}
  >
    {mastered ? (
      <CheckCircle className="h-3 w-3" />
    ) : (
      <XCircle className="h-3 w-3" />
    )}
    {skill}
  </Badge>
);

export function AssessmentReportTab({ assessment }: AssessmentReportTabProps) {
  if (!assessment) {
    return (
      <div className="text-center py-12">
        <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600">No Assessment Report</h3>
        <p className="text-gray-500 mt-2">
          This swimmer doesn't have a completed assessment report yet.
        </p>
      </div>
    );
  }

  // Parse JSON fields - handle both string and object formats
  const parseJsonField = (field: any) => {
    if (!field) return {};
    if (typeof field === 'object') return field;
    try {
      return JSON.parse(field);
    } catch (error) {
      console.error('Error parsing JSON field:', error, 'Field value:', field);
      return {};
    }
  };

  const swimSkills = parseJsonField(assessment.swim_skills);
  const roadblocks = parseJsonField(assessment.roadblocks);

  // Format date
  const formattedDate = assessment.assessment_date
    ? format(new Date(assessment.assessment_date), 'MMMM d, yyyy')
    : 'Date not specified';

  return (
    <div className="space-y-6">
      {/* Header with assessment info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Initial Assessment Report
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          </div>
          {assessment.approval_status && (
            <div className="mt-2">
              <Badge
                variant={assessment.approval_status === 'approved' ? "default" : "secondary"}
                className={assessment.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}
              >
                {assessment.approval_status === 'approved' ? 'Approved' : 'Pending Approval'}
              </Badge>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Strengths & Challenges Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assessment.strengths ? (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{assessment.strengths}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No strengths recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Challenges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Challenges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assessment.challenges ? (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{assessment.challenges}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No challenges recorded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Swim Skills Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Swim Skills Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(swimSkills).length > 0 ? (
              Object.entries(swimSkills).map(([category, skills]: [string, any]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-sm capitalize">{category.replace('_', ' ')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(skills).map(([skill, mastered]: [string, any]) => (
                      <SkillBadge
                        key={skill}
                        skill={skill.replace('_', ' ')}
                        mastered={mastered === true || mastered === 'true'}
                      />
                    ))}
                  </div>
                  <Separator className="my-2" />
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No swim skills recorded</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Goals Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Swim Skills Goals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              Swim Skills Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assessment.swim_skills_goals ? (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{assessment.swim_skills_goals}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No swim skills goals set</p>
            )}
          </CardContent>
        </Card>

        {/* Safety Goals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-600" />
              Safety Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assessment.safety_goals ? (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{assessment.safety_goals}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No safety goals set</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Roadblocks & Teaching Strategies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            Roadblocks & Teaching Strategies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(roadblocks).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(roadblocks).map(([roadblock, strategies]: [string, any]) => (
                <div key={roadblock} className="space-y-2">
                  <h4 className="font-medium text-sm capitalize">{roadblock.replace('_', ' ')}</h4>
                  {Array.isArray(strategies) ? (
                    <ul className="space-y-1 pl-5">
                      {strategies.map((strategy: string, index: number) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">{strategies}</p>
                  )}
                  <Separator className="my-2" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No roadblocks or teaching strategies recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Footer Notes */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t">
        <p>Assessment ID: {assessment.assessment_id.substring(0, 8)}...</p>
        <p className="mt-1">Report generated on {format(new Date(assessment.created_at), 'MMMM d, yyyy')}</p>
      </div>
    </div>
  );
}