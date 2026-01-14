'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Calendar, User, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface AssessmentReport {
  id: string
  assessment_date: string
  strengths: string
  challenges: string
  approval_status: 'approved' | 'dropped'
  created_at: string
  instructor_name: string
}

interface AssessmentTabProps {
  swimmerId: string
  swimmerName: string
  assessmentStatus: string | null
}

async function fetchAssessmentReports(swimmerId: string): Promise<AssessmentReport[]> {
  const supabase = createClient()

  try {
    // Fetch assessment reports with instructor name
    const { data: reports, error: reportsError } = await supabase
      .from('assessment_reports')
      .select(`
        id,
        assessment_date,
        strengths,
        challenges,
        approval_status,
        created_at,
        profiles!assessment_reports_instructor_id_fkey (
          full_name
        )
      `)
      .eq('swimmer_id', swimmerId)
      .order('assessment_date', { ascending: false })

    if (reportsError) {
      console.error('Error fetching assessment reports:', reportsError)
      throw new Error('Failed to fetch assessment reports')
    }

    // Transform the data to include instructor name
    const transformedReports: AssessmentReport[] = reports?.map(report => ({
      id: report.id,
      assessment_date: report.assessment_date,
      strengths: report.strengths,
      challenges: report.challenges,
      approval_status: report.approval_status,
      created_at: report.created_at,
      instructor_name: report.profiles?.full_name || 'Unknown Instructor'
    })) || []

    return transformedReports

  } catch (error) {
    console.error('Error in fetchAssessmentReports:', error)
    throw error
  }
}

export default function AssessmentTab({
  swimmerId,
  swimmerName,
  assessmentStatus
}: AssessmentTabProps) {
  const { data: assessmentReports, isLoading, error } = useQuery({
    queryKey: ['assessmentReports', swimmerId],
    queryFn: () => fetchAssessmentReports(swimmerId),
    enabled: !!swimmerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const hasAssessment = assessmentReports && assessmentReports.length > 0
  const latestAssessment = hasAssessment ? assessmentReports[0] : null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-[#2a5e84]" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 font-medium">Error loading assessment data</p>
            <p className="text-red-500 text-sm mt-2">
              {error instanceof Error ? error.message : 'Failed to fetch assessment reports'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Assessment Status Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#2a5e84]/10 rounded-lg">
                <FileText className="h-8 w-8 text-[#2a5e84]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Assessment Status</h3>
                <div className="flex items-center gap-3 mt-1">
                  <Badge
                    className={
                      assessmentStatus === 'completed'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200'
                    }
                  >
                    {assessmentStatus === 'completed' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {assessmentStatus || 'Not Started'}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {hasAssessment ? `${assessmentReports.length} assessment(s) on record` : 'No assessments completed'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Results */}
      {hasAssessment ? (
        <div className="space-y-6">
          {assessmentReports.map((report) => (
            <Card key={report.id}>
              <CardContent className="pt-6">
                {/* Assessment Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#2a5e84]/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-[#2a5e84]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Assessment on {format(new Date(report.assessment_date), 'MMMM d, yyyy')}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Completed by {report.instructor_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    className={
                      report.approval_status === 'approved'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200'
                    }
                  >
                    {report.approval_status === 'approved' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Dropped
                      </>
                    )}
                  </Badge>
                </div>

                {/* Strengths Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <h4 className="font-medium text-gray-900">Strengths</h4>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{report.strengths}</p>
                  </div>
                </div>

                {/* Challenges Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    <h4 className="font-medium text-gray-900">Challenges</h4>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{report.challenges}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Report created on {format(new Date(report.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* No Assessment State */
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">No Assessment Completed</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                {assessmentStatus === 'scheduled'
                  ? `An assessment is scheduled for ${swimmerName}. Assessment reports will appear here once completed by admin staff.`
                  : `No assessment has been completed for ${swimmerName}. Assessments are completed by admin staff during scheduled assessment sessions.`
                }
              </p>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Note:</span> Assessments are comprehensive evaluations completed by admin staff.
                  They include detailed analysis of swimmer strengths, challenges, and recommendations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Note */}
      <div className="text-center text-gray-500 text-sm">
        <p>Assessment reports provide detailed evaluation of swimmer progress and are used for placement and goal setting.</p>
        <p className="mt-1">Only admin staff can complete assessments. Contact an administrator to schedule an assessment.</p>
      </div>
    </div>
  )
}