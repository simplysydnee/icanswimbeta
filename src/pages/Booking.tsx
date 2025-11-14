import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingHeader } from "@/components/BookingHeader";
import { SwimmerSelector } from "@/components/booking/SwimmerSelector";
import { WeeklyBookingTab } from "@/components/booking/WeeklyBookingTab";
import { AssessmentTab } from "@/components/booking/AssessmentTab";
import { FloatingSessionsTab } from "@/components/booking/FloatingSessionsTab";
import { EnrollmentTab } from "@/components/booking/EnrollmentTab";
import { supabase } from "@/integrations/supabase/client";
import { useSwimmersQuery } from "@/hooks/useSwimmersQuery";
import { LogoutButton } from "@/components/LogoutButton";
import logoHeader from "@/assets/logo-header.png";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addMonths, startOfMonth, format } from "date-fns";
import { useSearchParams, Link } from "react-router-dom";

const Booking = () => {
  const [searchParams] = useSearchParams();
  const swimmerIdFromUrl = searchParams.get("swimmerId");
  const [selectedSwimmerIds, setSelectedSwimmerIds] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [parentId, setParentId] = useState<string | undefined>();
  
  const { data: rawSwimmers = [], isLoading: loading } = useSwimmersQuery();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setParentId(user.id);
      }
    };

    fetchUser();
  }, []);

  // Transform swimmers to expected format
  const swimmers = rawSwimmers.map(s => ({
    id: s.id,
    firstName: s.first_name,
    lastName: s.last_name,
    photoUrl: s.photo_url || '',
    currentLevel: s.swim_levels?.display_name || '',
    enrollmentStatus: s.enrollment_status as any,
    assessmentStatus: s.assessment_status as any,
    progressPercentage: 0,
    isVmrcClient: s.is_vmrc_client,
    paymentType: s.payment_type as any,
    vmrcSessionsUsed: s.vmrc_sessions_used,
    vmrcSessionsAuthorized: s.vmrc_sessions_authorized,
    vmrcCurrentPosNumber: s.vmrc_current_pos_number || '',
    flexibleSwimmer: s.flexible_swimmer,
  }));

  // Pre-select swimmer if coming from a child dashboard
  useEffect(() => {
    if (swimmerIdFromUrl && swimmers.find(s => s.id === swimmerIdFromUrl)) {
      setSelectedSwimmerIds([swimmerIdFromUrl]);
    }
  }, [swimmerIdFromUrl, swimmers]);

  // Get selected swimmers
  const selectedSwimmers = swimmers.filter((s) =>
    selectedSwimmerIds.includes(s.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background">
        <div className="container mx-auto px-4 py-8">
          <p>Loading swimmers...</p>
        </div>
      </div>
    );
  }

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

  // Check if any swimmers need POS authorization or have request sent
  const needsPosAuth = selectedSwimmers.some(
    (s) => s.assessmentStatus === "pos_authorization_needed"
  );
  const posRequestSent = selectedSwimmers.some(
    (s) => s.assessmentStatus === "pos_request_sent"
  );
  const showPosMessage = needsPosAuth || posRequestSent;

  // Determine booking eligibility based on selected swimmers
  const canBookWeekly = selectedSwimmers.every(
    (s) => s.enrollmentStatus === "enrolled" && s.assessmentStatus === "complete" && !s.flexibleSwimmer
  ) && !vmrcNeedsAuth && !allSwimmersWaitlist && !showPosMessage;
  
  const needsAssessment = selectedSwimmers.some(
    (s) =>
      s.enrollmentStatus === "waitlist" ||
      (s.enrollmentStatus === "approved" && s.assessmentStatus !== "complete" && s.assessmentStatus !== "pos_authorization_needed" && s.assessmentStatus !== "pos_request_sent")
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
        <div className="mb-4 flex items-center justify-between">
          <img 
            src={logoHeader} 
            alt="I CAN SWIM" 
            className="h-12 w-auto object-contain"
          />
          <LogoutButton />
        </div>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Book Swim Sessions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Select your swimmer(s) and book sessions for the month
          </p>
        </div>

        <SwimmerSelector
          swimmers={swimmers}
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

            {/* Banner for POS authorization or request sent */}
            {showPosMessage && (
              <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <strong>{needsPosAuth ? "POS Authorization Needed" : "POS Request Sent"}</strong>
                  <br />
                  <br />
                  {needsPosAuth && (
                    <>
                      {selectedSwimmers
                        .filter((s) => s.assessmentStatus === "pos_authorization_needed")
                        .map((s) => s.firstName)
                        .join(", ")}{" "}
                      {selectedSwimmers.filter((s) => s.assessmentStatus === "pos_authorization_needed").length === 1 ? "has" : "have"} completed 12/12 authorized sessions.
                      <br />
                      <span className="font-semibold mt-2 block">📋 Your instructor will send a progress summary and request a new POS from your VMRC coordinator</span>
                    </>
                  )}
                  {posRequestSent && (
                    <>
                      Progress update and POS request have been sent to your VMRC coordinator.
                      <br />
                      <span className="font-semibold mt-2 block">✅ Request submitted - waiting for VMRC approval</span>
                      <span className="font-semibold block">📞 Please contact your coordinator to follow up on the authorization</span>
                      {selectedSwimmers.find(s => s.assessmentStatus === "pos_request_sent")?.vmrcCurrentPosNumber && (
                        <span className="block mt-1 text-sm">Current POS: {selectedSwimmers.find(s => s.assessmentStatus === "pos_request_sent")?.vmrcCurrentPosNumber}</span>
                      )}
                    </>
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
                allSwimmersWaitlist ? "assessment" : anyFlexibleSwimmers ? "floating" : showPosMessage ? "enrollment" : needsAssessment && !canBookWeekly ? "assessment" : "weekly"
              }
            >
              <div className="mb-6 overflow-x-auto">
                <TabsList className={`inline-flex w-full min-w-max sm:w-full ${allSwimmersWaitlist || showPosMessage ? 'sm:grid-cols-2' : 'sm:grid sm:grid-cols-4'}`}>
                  {!allSwimmersWaitlist && !showPosMessage && (
                    <>
                      <TabsTrigger value="weekly" disabled={!canBookWeekly || anyFlexibleSwimmers} className="flex-1 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">
                        <div className="flex flex-col items-center gap-0.5">
                          <span>Weekly Recurring</span>
                          <span className="text-[10px] opacity-70">(Same time each week)</span>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger value="floating" disabled={!canBookWeekly && !anyFlexibleSwimmers} className="flex-1 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">
                        <div className="flex flex-col items-center gap-0.5">
                          <span>Floating Sessions</span>
                          <span className="text-[10px] opacity-70">(Cancelled spots)</span>
                        </div>
                      </TabsTrigger>
                    </>
                  )}
                  {!showPosMessage && (
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
                    {showPosMessage ? "POS Status Info" : "Enrollment Form"}
                  </TabsTrigger>
                </TabsList>
              </div>

              {!allSwimmersWaitlist && !showPosMessage && (
                <>
                  <TabsContent value="weekly">
                    <WeeklyBookingTab
                      currentMonth={currentMonth}
                      swimmerId={selectedSwimmers[0]?.id}
                      parentId="demo-parent-123"
                      selectedSwimmers={selectedSwimmers.map((s) => ({
                        id: s.id,
                        name: `${s.firstName} ${s.lastName}`,
                        paymentType: s.paymentType as "private_pay" | "vmrc" | "scholarship" | "other",
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

              {!showPosMessage && (
                <TabsContent value="assessment">
                  <AssessmentTab
                    selectedSwimmers={selectedSwimmers.map((s) => ({
                      id: s.id,
                      name: `${s.firstName} ${s.lastName}`,
                      paymentType: s.paymentType as "private_pay" | "vmrc" | "scholarship" | "other",
                    }))}
                  />
                </TabsContent>
              )}

              <TabsContent value="enrollment">
                {showPosMessage ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{needsPosAuth ? "POS Authorization Needed" : "POS Request Sent - Awaiting Approval"}</strong>
                      <br />
                      <br />
                      {needsPosAuth && (
                        <>
                          This swimmer has completed all 12 authorized sessions (12/12 used). Your instructor will send a progress summary to your VMRC coordinator to request a new POS authorization for 12 additional lessons.
                          <br />
                          <br />
                          <strong>What happens next:</strong>
                          <br />
                          • Your instructor prepares and sends a comprehensive progress summary
                          <br />
                          • Request is sent to your VMRC coordinator for approval
                          <br />
                          • Once approved, you can continue booking sessions
                        </>
                      )}
                      {posRequestSent && (
                        <>
                          The progress update and POS request have been successfully submitted to your VMRC coordinator. You cannot book new sessions until the new POS is approved.
                          <br />
                          <br />
                          <strong>Next Steps:</strong>
                          <br />
                          • The instructor has submitted the progress summary and POS request
                          <br />
                          • Please contact your VMRC coordinator to follow up
                          <br />
                          • Once the new POS is approved, booking will be available again
                          <br />
                          <br />
                          {selectedSwimmers.find(s => s.assessmentStatus === "pos_request_sent") && (
                            <>
                              <strong>Coordinator Contact:</strong> {selectedSwimmers.find(s => s.assessmentStatus === "pos_request_sent")?.vmrcCurrentPosNumber || "Contact your instructor for coordinator information"}
                            </>
                          )}
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
