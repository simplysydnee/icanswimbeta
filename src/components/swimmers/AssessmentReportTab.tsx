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
  Calendar,
  HelpCircle,
  MinusCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  PauseCircle,
  FileText
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
const SkillBadge = ({ skill, status }: { skill: string; status: any }) => {
  // Normalize status value
  let normalizedStatus = status;

  // Handle boolean values for backward compatibility
  if (status === true || status === 'true') {
    normalizedStatus = 'Yes';
  } else if (status === false || status === 'false') {
    normalizedStatus = 'No';
  } else if (typeof status === 'number' || (typeof status === 'string' && /^\d+$/.test(status))) {
    // Handle numeric values (0 = No, 1 = Yes)
    const numValue = typeof status === 'number' ? status : parseInt(status, 10);
    if (numValue === 1) {
      normalizedStatus = 'Yes';
    } else if (numValue === 0) {
      normalizedStatus = 'No';
    }
  } else if (typeof status === 'string') {
    // Handle case variations
    normalizedStatus = status.trim();
    if (normalizedStatus.toLowerCase() === 'yes') normalizedStatus = 'Yes';
    if (normalizedStatus.toLowerCase() === 'no') normalizedStatus = 'No';
    if (normalizedStatus.toLowerCase() === 'na' || normalizedStatus.toLowerCase() === 'n/a') normalizedStatus = 'N/A';
    if (normalizedStatus.toLowerCase() === 'emerging' || normalizedStatus.toLowerCase() === 'emerging skill') normalizedStatus = 'Emerging Skill';
  }

  // Map status to display properties
  const statusConfig = {
    'Yes': {
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-200',
      label: 'Yes'
    },
    'Emerging Skill': {
      icon: HelpCircle,
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      label: 'Emerging'
    },
    'No': {
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-200',
      label: 'No'
    },
    'N/A': {
      icon: MinusCircle,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      label: 'N/A'
    }
  };

  const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig['N/A'];
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg bg-white">
      <div className="text-sm font-medium">{skill}</div>
      <Badge
        variant="outline"
        className={`flex items-center gap-1 ${config.className}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    </div>
  );
};

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
              // Check if swimSkills has categorized structure or flat structure
              (() => {
                // Check if first entry has nested skills object
                const firstEntry = Object.entries(swimSkills)[0];
                const hasCategories = firstEntry && typeof firstEntry[1] === 'object' && !Array.isArray(firstEntry[1]);

                if (hasCategories) {
                  // Categorized structure: { category: { skill: status, ... }, ... }
                  return Object.entries(swimSkills).map(([category, skills]: [string, any]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-sm capitalize">{category.replace('_', ' ')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(skills).map(([skill, status]: [string, any]) => (
                          <SkillBadge
                            key={skill}
                            skill={skill.replace('_', ' ')}
                            status={status}
                          />
                        ))}
                      </div>
                      <Separator className="my-2" />
                    </div>
                  ));
                } else {
                  // Flat structure: { skill: status, ... }
                  return (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(swimSkills).map(([skill, status]: [string, any]) => (
                          <SkillBadge
                            key={skill}
                            skill={skill.replace('_', ' ')}
                            status={status}
                          />
                        ))}
                      </div>
                    </div>
                  );
                }
              })()
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
            <>
              {/* Status Legend */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs font-medium text-gray-700 mb-2">Status Legend:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Needs Addressing
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Addressed
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> In Progress
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                    <PauseCircle className="h-3 w-3" /> Not Now
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Other
                  </Badge>
                </div>
              </div>

              <div className="space-y-6">
              {Object.entries(roadblocks).map(([roadblock, data]: [string, any]) => (
                <div key={roadblock} className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm capitalize text-gray-900">{roadblock.replace('_', ' ')}</h4>
                    {/* Status Legend Indicator */}
                    {data && typeof data === 'object' && ('status' in data || 'needs_addressing' in data) && 'intervention' in data && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        {(() => {
                          if (data.needs_addressing === true) return <><AlertCircle className="h-3 w-3" /> Requires attention</>;
                          if (data.needs_addressing === false) return <><CheckCircle2 className="h-3 w-3" /> Resolved</>;
                          if (data.status?.toLowerCase().includes('progress')) return <><Clock className="h-3 w-3" /> In progress</>;
                          return <><FileText className="h-3 w-3" /> Note</>;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Check if data has roadblock object structure (status/intervention or needs_addressing/intervention) */}
                  {data && typeof data === 'object' && ('status' in data || 'needs_addressing' in data) && 'intervention' in data ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        {(() => {
                          // Determine status text and color
                          let statusText = 'Unknown';
                          let badgeClass = 'bg-gray-100 text-gray-800 border-gray-200';
                          let IconComponent = FileText;

                          // Handle needs_addressing field (boolean)
                          if (data.needs_addressing === true) {
                            statusText = 'Needs Addressing';
                            badgeClass = 'bg-red-100 text-red-800 border-red-200';
                            IconComponent = AlertCircle;
                          } else if (data.needs_addressing === false) {
                            statusText = 'Addressed';
                            badgeClass = 'bg-green-100 text-green-800 border-green-200';
                            IconComponent = CheckCircle2;
                          }
                          // Handle status field (string)
                          else if (data.status) {
                            const status = data.status.toLowerCase();
                            if (status === 'needs_addressing' || status.includes('need') || status.includes('urgent')) {
                              statusText = 'Needs Addressing';
                              badgeClass = 'bg-red-100 text-red-800 border-red-200';
                              IconComponent = AlertCircle;
                            } else if (status === 'addressed' || status.includes('resolved') || status.includes('complete')) {
                              statusText = 'Addressed';
                              badgeClass = 'bg-green-100 text-green-800 border-green-200';
                              IconComponent = CheckCircle2;
                            } else if (status.includes('progress') || status.includes('working')) {
                              statusText = 'In Progress';
                              badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
                              IconComponent = Clock;
                            } else if (status.includes('not now') || status.includes('deferred') || status.includes('later')) {
                              statusText = 'Not Now';
                              badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                              IconComponent = PauseCircle;
                            } else {
                              // Default: capitalize the status
                              statusText = data.status.charAt(0).toUpperCase() + data.status.slice(1);
                              IconComponent = FileText;
                            }
                          }

                          return (
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium ${badgeClass} flex items-center gap-1`}
                            >
                              <IconComponent className="h-3 w-3" />
                              {statusText}
                            </Badge>
                          );
                        })()}
                      </div>
                      {data.intervention && (
                        <div className="bg-white p-3 rounded border">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-gray-700">Teaching Strategy:</span>
                          </div>
                          <p className="text-sm text-gray-800 pl-6">{data.intervention}</p>
                        </div>
                      )}
                    </div>
                  ) : Array.isArray(data) ? (
                    // Handle array of strategies (legacy format)
                    <div className="bg-white p-3 rounded border">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-gray-700">Teaching Strategies:</span>
                      </div>
                      <ul className="space-y-2 pl-6">
                        {data.map((strategy: string, index: number) => (
                          <li key={index} className="text-sm text-gray-800 flex items-start gap-2">
                            <span className="text-amber-600 mt-1">•</span>
                            <span>{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : typeof data === 'string' ? (
                    // Handle string format
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-800">{data}</p>
                    </div>
                  ) : (
                    // Fallback for unknown format
                    <div className="bg-gray-50 p-3 rounded border">
                      <p className="text-sm text-gray-500 italic">No details available</p>
                    </div>
                  )}
                </div>
              ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border">
              <Lightbulb className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 italic">No roadblocks or teaching strategies recorded</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Notes */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t">
        <p>Assessment ID: {assessment.assessment_id ? assessment.assessment_id.substring(0, 8) + '...' : 'N/A'}</p>
        <p className="mt-1">Report generated on {assessment.created_at ? format(new Date(assessment.created_at), 'MMMM d, yyyy') : 'date not available'}</p>
      </div>
    </div>
  );
}