import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { addMonths, startOfMonth, format } from "date-fns";
import { SwimmerSelector } from "@/components/booking/SwimmerSelector";
import { WeeklyBookingTab } from "@/components/booking/WeeklyBookingTab";
import { FloatingSessionsTab } from "@/components/booking/FloatingSessionsTab";
import { AssessmentTab } from "@/components/booking/AssessmentTab";

const Booking = () => {
  // Mock parent's swimmers - in production, fetch from Supabase
  const mockSwimmers = [
    {
      id: "swimmer-1",
      firstName: "Emma",
      lastName: "Wilson",
      photoUrl: undefined,
      currentLevel: "Minnow",
      enrollmentStatus: "enrolled" as "waitlist" | "approved" | "enrolled",
      assessmentStatus: "complete" as "not_started" | "scheduled" | "complete",
      progressPercentage: 65,
      isVmrcClient: false,
      paymentType: "private_pay" as "private_pay" | "vmrc" | "scholarship" | "other",
      vmrcSessionsUsed: 0,
      vmrcSessionsAuthorized: 12,
      vmrcCurrentPosNumber: null,
    },
    {
      id: "swimmer-2",
      firstName: "Liam",
      lastName: "Wilson",
      photoUrl: undefined,
      currentLevel: "Tadpole",
      enrollmentStatus: "enrolled" as "waitlist" | "approved" | "enrolled",
      assessmentStatus: "complete" as "not_started" | "scheduled" | "complete",
      progressPercentage: 42,
      isVmrcClient: true,
      paymentType: "vmrc" as "private_pay" | "vmrc" | "scholarship" | "other",
      vmrcSessionsUsed: 8,
      vmrcSessionsAuthorized: 12,
      vmrcCurrentPosNumber: "POS-2024-001",
    },
    {
      id: "swimmer-3",
      firstName: "Olivia",
      lastName: "Wilson",
      photoUrl: undefined,
      currentLevel: "Not Assigned",
      enrollmentStatus: "approved" as "waitlist" | "approved" | "enrolled",
      assessmentStatus: "not_started" as "not_started" | "scheduled" | "complete",
      progressPercentage: 0,
      isVmrcClient: true,
      paymentType: "vmrc" as "private_pay" | "vmrc" | "scholarship" | "other",
      vmrcSessionsUsed: 12,
      vmrcSessionsAuthorized: 12,
      vmrcCurrentPosNumber: "POS-2024-002", // Needs new auth
    },
  ];

  const [selectedSwimmerIds, setSelectedSwimmerIds] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  // Get selected swimmers
  const selectedSwimmers = mockSwimmers.filter((s) =>
    selectedSwimmerIds.includes(s.id)
  );

  // Check VMRC authorization status
  const vmrcNeedsAuth = selectedSwimmers.some(
    (s) => s.isVmrcClient && s.vmrcSessionsUsed >= s.vmrcSessionsAuthorized
  );

  // Determine booking eligibility based on selected swimmers
  const canBookWeekly = selectedSwimmers.every(
    (s) => s.enrollmentStatus === "enrolled" && s.assessmentStatus === "complete"
  ) && !vmrcNeedsAuth;
  
  const needsAssessment = selectedSwimmers.some(
    (s) =>
      s.enrollmentStatus === "waitlist" ||
      (s.enrollmentStatus === "approved" && s.assessmentStatus !== "complete")
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

            {/* Banner for swimmers needing assessment or VMRC auth */}
            {needsAssessment && (
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

            {vmrcNeedsAuth && (
              <Alert className="mb-6 border-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>VMRC Authorization Needed:</strong>{" "}
                  {selectedSwimmers
                    .filter(
                      (s) =>
                        s.isVmrcClient &&
                        s.vmrcSessionsUsed >= s.vmrcSessionsAuthorized
                    )
                    .map((s) => `${s.firstName} ${s.lastName}`)
                    .join(", ")}{" "}
                  {selectedSwimmers.filter(
                    (s) =>
                      s.isVmrcClient &&
                      s.vmrcSessionsUsed >= s.vmrcSessionsAuthorized
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
                needsAssessment && !canBookWeekly ? "assessment" : "weekly"
              }
            >
              <div className="mb-6 overflow-x-auto">
                <TabsList className="inline-flex w-full min-w-max sm:grid sm:grid-cols-3 sm:w-full">
                  <TabsTrigger value="weekly" disabled={!canBookWeekly} className="flex-1 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">
                    Weekly (This Month)
                  </TabsTrigger>
                  <TabsTrigger value="floating" disabled={!canBookWeekly} className="flex-1 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">
                    Floating Sessions
                  </TabsTrigger>
                  <TabsTrigger
                    value="assessment"
                    disabled={canBookWeekly && !needsAssessment}
                    className="flex-1 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
                  >
                    Initial Assessment
                  </TabsTrigger>
                </TabsList>
              </div>

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

              <TabsContent value="assessment">
                <AssessmentTab />
              </TabsContent>
            </Tabs>

            {/* Back Link */}
            <div className="mt-8 text-center">
              <Link
                to="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Booking;
