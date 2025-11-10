import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { addMonths, startOfMonth, format } from "date-fns";
import { SwimmerSelector } from "@/components/booking/SwimmerSelector";
import { WeeklyBookingTab } from "@/components/booking/WeeklyBookingTab";
import { FloatingSessionsTab } from "@/components/booking/FloatingSessionsTab";
import { AssessmentTab } from "@/components/booking/AssessmentTab";
import { EnrollmentTab } from "@/components/booking/EnrollmentTab";

const Booking = () => {
  const [searchParams] = useSearchParams();
  const swimmerIdFromUrl = searchParams.get("swimmerId");
  // Mock parent's swimmers - in production, fetch from Supabase
  const mockSwimmers = [
    {
      id: "swimmer-1",
      firstName: "Emma",
      lastName: "Wilson",
      photoUrl: undefined,
      currentLevel: "Minnow",
      enrollmentStatus: "enrolled" as "waitlist" | "approved" | "enrolled",
      assessmentStatus: "complete" as "not_started" | "scheduled" | "complete" | "progress_update",
      progressPercentage: 65,
      isVmrcClient: false,
      paymentType: "private_pay" as "private_pay" | "vmrc" | "scholarship" | "other",
      vmrcSessionsUsed: 0,
      vmrcSessionsAuthorized: 12,
      vmrcCurrentPosNumber: null,
      flexibleSwimmer: false,
    },
    {
      id: "swimmer-2",
      firstName: "Liam",
      lastName: "Wilson",
      photoUrl: undefined,
      currentLevel: "Tadpole",
      enrollmentStatus: "enrolled" as "waitlist" | "approved" | "enrolled",
      assessmentStatus: "progress_update" as "not_started" | "scheduled" | "complete" | "progress_update",
      progressPercentage: 42,
      isVmrcClient: true,
      paymentType: "vmrc" as "private_pay" | "vmrc" | "scholarship" | "other",
      vmrcSessionsUsed: 8,
      vmrcSessionsAuthorized: 12,
      vmrcCurrentPosNumber: "POS-2024-001",
      flexibleSwimmer: false,
    },
    {
      id: "swimmer-3",
      firstName: "Olivia",
      lastName: "Wilson",
      photoUrl: undefined,
      currentLevel: "Not Assigned",
      enrollmentStatus: "approved" as "waitlist" | "approved" | "enrolled",
      assessmentStatus: "not_started" as "not_started" | "scheduled" | "complete" | "progress_update",
      progressPercentage: 0,
      isVmrcClient: true,
      paymentType: "vmrc" as "private_pay" | "vmrc" | "scholarship" | "other",
      vmrcSessionsUsed: 12,
      vmrcSessionsAuthorized: 12,
      vmrcCurrentPosNumber: "POS-2024-002", // Needs new auth
      flexibleSwimmer: false,
    },
    {
      id: "swimmer-4",
      firstName: "Noah",
      lastName: "Wilson",
      photoUrl: undefined,
      currentLevel: "Not Assigned",
      enrollmentStatus: "waitlist" as "waitlist" | "approved" | "enrolled",
      assessmentStatus: "not_started" as "not_started" | "scheduled" | "complete" | "progress_update",
      progressPercentage: 0,
      isVmrcClient: false,
      paymentType: "private_pay" as "private_pay" | "vmrc" | "scholarship" | "other",
      vmrcSessionsUsed: 0,
      vmrcSessionsAuthorized: 12,
      vmrcCurrentPosNumber: null,
      flexibleSwimmer: false,
    },
  ];

  const [selectedSwimmerIds, setSelectedSwimmerIds] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  // Pre-select swimmer if coming from a child dashboard
  useEffect(() => {
    if (swimmerIdFromUrl && mockSwimmers.find(s => s.id === swimmerIdFromUrl)) {
      setSelectedSwimmerIds([swimmerIdFromUrl]);
    }
  }, [swimmerIdFromUrl]);

  // Get selected swimmers
  const selectedSwimmers = mockSwimmers.filter((s) =>
    selectedSwimmerIds.includes(s.id)
  );

  // Check VMRC authorization status (exclude waitlist swimmers as they only need assessments)
  const vmrcNeedsAuth = selectedSwimmers.some(
    (s) => s.isVmrcClient && s.vmrcSessionsUsed >= s.vmrcSessionsAuthorized && s.enrollmentStatus !== "waitlist"
  );

  // Check if all selected swimmers are Waitlist (restricted to assessments only)
  const allSwimmersWaitlist = selectedSwimmers.length > 0 && selectedSwimmers.every(
    (s) => s.enrollmentStatus === "waitlist"
  );

  // Check if any selected swimmers are Flexible (restricted to floating sessions only)
  const anyFlexibleSwimmers = selectedSwimmers.some(s => s.flexibleSwimmer);

  // Check if any swimmers need progress update (not initial assessment)
  const needsProgressUpdate = selectedSwimmers.some(
    (s) => s.assessmentStatus === "progress_update"
  );

  // Determine booking eligibility based on selected swimmers
  const canBookWeekly = selectedSwimmers.every(
    (s) => s.enrollmentStatus === "enrolled" && s.assessmentStatus === "complete" && !s.flexibleSwimmer
  ) && !vmrcNeedsAuth && !allSwimmersWaitlist && !needsProgressUpdate;
  
  const needsAssessment = selectedSwimmers.some(
    (s) =>
      s.enrollmentStatus === "waitlist" ||
      (s.enrollmentStatus === "approved" && s.assessmentStatus !== "complete" && s.assessmentStatus !== "progress_update")
  );

  const handlePreviousMonth = () => {
    const now = new Date();
    const prevMonth = addMonths(currentMonth, -1);
    if (prevMonth >= startOfMonth(now)) {
      setCurrentMonth(prevMonth);
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background">
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-6xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Book Swim Sessions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Select your swimmer(s) and book sessions for the month
          </p>
        </div>

        <SwimmerSelector
          swimmers={mockSwimmers}
          selectedSwimmerIds={selectedSwimmerIds}
          onSwimmersChange={setSelectedSwimmerIds}
        />

        {selectedSwimmerIds.length === 0 ? (
          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select at least one swimmer above to view booking options
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Month Selector */}
            <div className="flex items-center justify-between gap-2 mb-6 bg-card p-3 sm:p-4 rounded-lg border">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                disabled={currentMonth <= startOfMonth(new Date())}
                className="shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-center min-w-0">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button variant="outline" size="sm" onClick={handleNextMonth} className="shrink-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Banner for Flexible Swimmers */}
            {anyFlexibleSwimmers && (
              <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <strong>Flexible Swimmer Status:</strong>{" "}
                  {selectedSwimmers.filter(s => s.flexibleSwimmer).map(s => s.firstName).join(", ")}{" "}
                  {selectedSwimmers.filter(s => s.flexibleSwimmer).length === 1 ? "is" : "are"} currently in Flexible Swimmer status due to a late cancellation.
                  <br />
                  <span className="font-semibold mt-2 block">❌ Recurring weekly sessions are not available</span>
                  <span className="font-semibold">✅ You may book single Floating Sessions as they become available</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Banner for Waitlist swimmers */}
            {allSwimmersWaitlist && (
              <Alert className="mb-6 border-primary bg-primary/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Waitlist Swimmers:</strong> {selectedSwimmers.length === 1 ? "This swimmer is" : "These swimmers are"} currently on the Waitlist. 
                  You may book an Initial Assessment to begin the enrollment process. 
                  Once the assessment is completed and approved, full booking options will become available.
                </AlertDescription>
              </Alert>
            )}

            {/* Banner for swimmers needing assessment (but not waitlist) */}
            {needsAssessment && !allSwimmersWaitlist && (
              <Alert className="mb-6 border-primary">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {selectedSwimmers.filter(
                    (s) =>
                      s.enrollmentStatus === "waitlist" ||
                      (s.enrollmentStatus === "approved" &&
                        s.assessmentStatus !== "complete")
                  ).length === selectedSwimmers.length
                    ? "All selected swimmers need to complete their Initial Assessment first"
                    : "Some selected swimmers need to complete their Initial Assessment"}
                </AlertDescription>
              </Alert>
            )}

            {/* Banner for swimmers needing progress update */}
            {needsProgressUpdate && (
              <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <strong>Progress Update Required:</strong>{" "}
                  {selectedSwimmers
                    .filter((s) => s.assessmentStatus === "progress_update")
                    .map((s) => s.firstName)
                    .join(", ")}{" "}
                  {selectedSwimmers.filter((s) => s.assessmentStatus === "progress_update").length === 1 ? "needs" : "need"} a progress update from the instructor.
                  <br />
                  <span className="font-semibold mt-2 block">📋 This is for instructor evaluation only - not a new assessment</span>
                  {selectedSwimmers.some(s => s.isVmrcClient && s.assessmentStatus === "progress_update") && (
                    <span className="font-semibold block">💙 VMRC clients: You will also need to request a new POS for 12 additional lessons</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {vmrcNeedsAuth && (
              <Alert className="mb-6 border-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>VMRC Authorization Needed:</strong>{" "}
                  {selectedSwimmers
                    .filter(
                      (s) =>
                        s.isVmrcClient &&
                        s.vmrcSessionsUsed >= s.vmrcSessionsAuthorized &&
                        s.enrollmentStatus !== "waitlist"
                    )
                    .map((s) => `${s.firstName} ${s.lastName}`)
                    .join(", ")}{" "}
                  {selectedSwimmers.filter(
                    (s) =>
                      s.isVmrcClient &&
                      s.vmrcSessionsUsed >= s.vmrcSessionsAuthorized &&
                      s.enrollmentStatus !== "waitlist"
                  ).length === 1
                    ? "has"
                    : "have"}{" "}
                  used all 12 authorized sessions. Please contact your instructor or
                  admin to enter a new POS number before booking more sessions.
                </AlertDescription>
              </Alert>
            )}

            {/* Selected Swimmers Summary */}
            <div className="mb-6 p-3 sm:p-4 bg-primary/10 rounded-lg">
              <div className="text-sm font-medium mb-2 break-words">
                Booking for:{" "}
                {selectedSwimmers
                  .map((s) => `${s.firstName} ${s.lastName}`)
                  .join(", ")}
              </div>
              {selectedSwimmers.length > 1 && (
                <div className="text-xs text-muted-foreground mb-2">
                  All selected swimmers will be booked for the same sessions
                </div>
              )}
              {selectedSwimmers.some((s) => s.paymentType === "vmrc") && (
                <div className="text-xs text-primary font-medium break-words">
                  💙 VMRC Client(s):{" "}
                  {selectedSwimmers
                    .filter((s) => s.paymentType === "vmrc")
                    .map(
                      (s) =>
                        `${s.firstName} (${s.vmrcSessionsUsed}/${s.vmrcSessionsAuthorized} used)`
                    )
                    .join(", ")}{" "}
                  - Sessions tracked, no charge
                </div>
              )}
              {selectedSwimmers.some((s) => s.paymentType === "private_pay") && (
                <div className="text-xs text-muted-foreground">
                  💳 Private Pay Client(s):{" "}
                  {selectedSwimmers
                    .filter((s) => s.paymentType === "private_pay")
                    .map((s) => s.firstName)
                    .join(", ")}{" "}
                  - Will be charged per session
                </div>
              )}
            </div>

            {/* Booking Tabs */}
            <Tabs
              defaultValue={
                allSwimmersWaitlist ? "assessment" : anyFlexibleSwimmers ? "floating" : needsProgressUpdate ? "enrollment" : needsAssessment && !canBookWeekly ? "assessment" : "weekly"
              }
            >
              <div className="mb-6 overflow-x-auto">
                <TabsList className={`inline-flex w-full min-w-max sm:w-full ${allSwimmersWaitlist || needsProgressUpdate ? 'sm:grid-cols-2' : 'sm:grid sm:grid-cols-4'}`}>
                  {!allSwimmersWaitlist && !needsProgressUpdate && (
                    <>
                      <TabsTrigger value="weekly" disabled={!canBookWeekly || anyFlexibleSwimmers} className="flex-1 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">
                        Weekly (This Month)
                      </TabsTrigger>
                      <TabsTrigger value="floating" disabled={!canBookWeekly && !anyFlexibleSwimmers} className="flex-1 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">
                        Floating Sessions
                      </TabsTrigger>
                    </>
                  )}
                  {!needsProgressUpdate && (
                    <TabsTrigger
                      value="assessment"
                      className="flex-1 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
                    >
                      Initial Assessment
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="enrollment"
                    className="flex-1 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
                  >
                    {needsProgressUpdate ? "Contact for Progress Update" : "Enrollment Form"}
                  </TabsTrigger>
                </TabsList>
              </div>

              {!allSwimmersWaitlist && !needsProgressUpdate && (
                <>
                  <TabsContent value="weekly">
                    <WeeklyBookingTab
                      currentMonth={currentMonth}
                      swimmerId={selectedSwimmers[0]?.id}
                      parentId="demo-parent-123"
                      selectedSwimmers={selectedSwimmers.map((s) => ({
                        id: s.id,
                        name: `${s.firstName} ${s.lastName}`,
                        paymentType: s.paymentType,
                        vmrcSessionsUsed: s.vmrcSessionsUsed,
                        vmrcSessionsAuthorized: s.vmrcSessionsAuthorized,
                      }))}
                    />
                  </TabsContent>

                  <TabsContent value="floating">
                    <FloatingSessionsTab />
                  </TabsContent>
                </>
              )}

              {!needsProgressUpdate && (
                <TabsContent value="assessment">
                  <AssessmentTab />
                </TabsContent>
              )}

              <TabsContent value="enrollment">
                {needsProgressUpdate ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Progress Update Required</strong>
                      <br />
                      <br />
                      Please contact your instructor to schedule a progress update session. This is an instructor evaluation only and does not require booking a new initial assessment.
                      <br />
                      <br />
                      {selectedSwimmers.some(s => s.isVmrcClient && s.assessmentStatus === "progress_update") && (
                        <>
                          <strong>For VMRC Clients:</strong> You will also need to request a new Purchase Order (POS) for 12 additional lessons. Please contact your coordinator or instructor to submit the POS request.
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <EnrollmentTab swimmerId={selectedSwimmers[0]?.id} />
                )}
              </TabsContent>
            </Tabs>

            {/* Back Link */}
            <div className="mt-8 text-center">
              <Link
                to={swimmerIdFromUrl ? `/dashboard?swimmerId=${swimmerIdFromUrl}` : "/parent-home"}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to {swimmerIdFromUrl ? "Dashboard" : "My Swimmers"}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Booking;
