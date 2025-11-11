import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RevenueData {
  lessonsAttended: number;
  assessmentsCompleted: number;
  canceled: number;
  noShows: number;
  openSpots: number;
  vmrcAssessments: { count: number; revenue: number };
  privateAssessments: { count: number; revenue: number };
  vmrcLessons: { count: number; revenue: number };
  privateLessons: { count: number; revenue: number };
}

export const AdminBookingsRevenueTab = () => {
  const [revenueMonth, setRevenueMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [revenueData, setRevenueData] = useState<RevenueData>({
    lessonsAttended: 0,
    assessmentsCompleted: 0,
    canceled: 0,
    noShows: 0,
    openSpots: 0,
    vmrcAssessments: { count: 0, revenue: 0 },
    privateAssessments: { count: 0, revenue: 0 },
    vmrcLessons: { count: 0, revenue: 0 },
    privateLessons: { count: 0, revenue: 0 },
  });

  useEffect(() => {
    fetchRevenueData();
  }, [revenueMonth]);

  const fetchRevenueData = async () => {
    try {
      const [year, month] = revenueMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Fetch all sessions in the month with bookings and attendance
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select(`
          *,
          bookings!inner (
            id,
            status,
            swimmer_id,
            swimmers!inner (
              payment_type
            )
          ),
          session_attendance (
            attended,
            booking_id
          )
        `)
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString());

      if (sessionsError) throw sessionsError;

      let lessonsAttended = 0;
      let assessmentsCompleted = 0;
      let canceled = 0;
      let noShows = 0;
      let openSpots = 0;

      let vmrcAssessmentCount = 0;
      let privateAssessmentCount = 0;
      let vmrcLessonCount = 0;
      let privateLessonCount = 0;

      // Process each session
      (sessionsData || []).forEach((session: any) => {
        const sessionType = session.session_type?.toLowerCase() || '';
        const isAssessment = sessionType.includes('assessment') || sessionType.includes('initial');
        
        // Count open spots
        const bookedCount = session.bookings?.filter((b: any) => b.status === 'confirmed').length || 0;
        openSpots += Math.max(0, (session.max_capacity || 1) - bookedCount);

        // Process bookings
        session.bookings?.forEach((booking: any) => {
          const paymentType = booking.swimmers?.payment_type || 'private_pay';
          const isVMRC = paymentType === 'vmrc';
          
          if (booking.status === 'cancelled') {
            canceled++;
            return;
          }

          // Check attendance
          const attendance = session.session_attendance?.find((att: any) => att.booking_id === booking.id);
          
          if (attendance?.attended) {
            // Attended sessions generate revenue
            if (isAssessment) {
              assessmentsCompleted++;
              if (isVMRC) {
                vmrcAssessmentCount++;
              } else {
                privateAssessmentCount++;
              }
            } else {
              lessonsAttended++;
              if (isVMRC) {
                vmrcLessonCount++;
              } else {
                privateLessonCount++;
              }
            }
          } else if (attendance && !attendance.attended) {
            noShows++;
          }
        });
      });

      // Calculate revenue (only for attended sessions)
      const RATES = {
        vmrcAssessment: 175,
        privateAssessment: 75,
        vmrcLesson: 96.44,
        privateLesson: 75,
      };

      setRevenueData({
        lessonsAttended,
        assessmentsCompleted,
        canceled,
        noShows,
        openSpots,
        vmrcAssessments: {
          count: vmrcAssessmentCount,
          revenue: vmrcAssessmentCount * RATES.vmrcAssessment,
        },
        privateAssessments: {
          count: privateAssessmentCount,
          revenue: privateAssessmentCount * RATES.privateAssessment,
        },
        vmrcLessons: {
          count: vmrcLessonCount,
          revenue: vmrcLessonCount * RATES.vmrcLesson,
        },
        privateLessons: {
          count: privateLessonCount,
          revenue: privateLessonCount * RATES.privateLesson,
        },
      });
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch revenue data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Month Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Input
                type="month"
                value={revenueMonth}
                onChange={(e) => setRevenueMonth(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Activity KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Lessons Attended
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {revenueData.lessonsAttended}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Assessments Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {revenueData.assessmentsCompleted}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Canceled
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {revenueData.canceled}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              No-Shows
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {revenueData.noShows}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Open Spots
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {revenueData.openSpots}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  VMRC Initial Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${revenueData.vmrcAssessments.revenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {revenueData.vmrcAssessments.count} × $175.00
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Private Pay Initial Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${revenueData.privateAssessments.revenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {revenueData.privateAssessments.count} × $75.00
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  VMRC Lessons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${revenueData.vmrcLessons.revenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {revenueData.vmrcLessons.count} × $96.44
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Private Pay Lessons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${revenueData.privateLessons.revenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {revenueData.privateLessons.count} × $75.00
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Grand Total */}
          <Card className="bg-primary/5 border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Monthly Revenue Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ${(
                  revenueData.vmrcAssessments.revenue +
                  revenueData.privateAssessments.revenue +
                  revenueData.vmrcLessons.revenue +
                  revenueData.privateLessons.revenue
                ).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
