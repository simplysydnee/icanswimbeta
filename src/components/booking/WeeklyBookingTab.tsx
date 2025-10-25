import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, AlertCircle, AlertTriangle, Timer } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { useSessionAvailability } from "@/hooks/useSessionAvailability";
import { useBookingHold } from "@/hooks/useBookingHold";
import { useToast } from "@/hooks/use-toast";

interface WeeklyBookingTabProps {
  currentMonth: Date;
  swimmerId?: string;
  parentId?: string;
}

const DAYS_OF_WEEK = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

export const WeeklyBookingTab = ({ currentMonth, swimmerId, parentId }: WeeklyBookingTabProps) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
  const [skipConflicts, setSkipConflicts] = useState<boolean>(false);

  const { toast } = useToast();
  const { loading, remainingDates, availableTimes, availableInstructors } = useSessionAvailability(
    currentMonth,
    selectedDay,
    selectedTime
  );
  const { holdExpiresAt, createHold, releaseHold, validateAndBook } = useBookingHold();

  // Reset selections when dependencies change
  useEffect(() => {
    setSelectedTime(null);
    setSelectedInstructor(null);
    releaseHold();
  }, [selectedDay]);

  useEffect(() => {
    setSelectedInstructor(null);
    releaseHold();
  }, [selectedTime]);

  // Get selected instructor details
  const selectedInstructorData = availableInstructors.find(
    (i) => i.instructorId === selectedInstructor
  );

  const sessionCount = selectedInstructorData
    ? skipConflicts
      ? remainingDates.length - selectedInstructorData.conflictDates.length
      : remainingDates.length
    : remainingDates.length;

  const pricePerSession = 65;
  const totalPrice = sessionCount * pricePerSession;

  const handleInstructorSelect = async (instructorId: string) => {
    setSelectedInstructor(instructorId);

    // Create soft hold for the sessions
    // In production, this would query session IDs and hold them
    const mockSessionIds = remainingDates.map((_, i) => `session-${i}`);
    await createHold(mockSessionIds);
  };

  const handleConfirm = async () => {
    if (!swimmerId || !parentId || !selectedInstructor) {
      toast({
        title: "Missing Information",
        description: "Please complete your selection before confirming.",
        variant: "destructive",
      });
      return;
    }

    // Get actual session IDs for booking
    // In production, query sessions matching day/time/instructor for remaining dates
    const mockSessionIds = remainingDates
      .filter((date) => {
        if (!skipConflicts) return true;
        return !selectedInstructorData?.conflictDates.some((c) => 
          c.getTime() === date.getTime()
        );
      })
      .map((_, i) => `session-${i}`);

    const result = await validateAndBook(mockSessionIds, swimmerId, parentId);
    
    if (result.success) {
      // Reset selections
      setSelectedDay(null);
      setSelectedTime(null);
      setSelectedInstructor(null);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Select a day and time to automatically book all remaining weeks this month. 
          Sessions are billed monthly and renew when next month's schedule is posted.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Choose Your Day</CardTitle>
          <CardDescription>Pick the day of the week for your recurring lessons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <Button
                key={day.value}
                variant={selectedDay === day.value ? "default" : "outline"}
                onClick={() => setSelectedDay(day.value)}
                className="flex-1 min-w-[100px]"
              >
                {day.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDay !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Time</CardTitle>
            <CardDescription>
              All times shown in Pacific Time • Only showing times with available instructors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading available times...
              </div>
            ) : availableTimes.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No available times for {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}s this month. 
                  Try selecting a different day.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableTimes.map((slot) => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    onClick={() => setSelectedTime(slot.time)}
                    className="justify-start gap-2 flex-col items-start h-auto py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {slot.time}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {slot.availableInstructorsCount} instructor{slot.availableInstructorsCount !== 1 ? "s" : ""}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedDay !== null && selectedTime !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Instructor</CardTitle>
            <CardDescription>
              Showing instructors available for all {remainingDates.length} remaining {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}s
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Checking instructor availability...
              </div>
            ) : availableInstructors.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No instructors available for all occurrences at {selectedTime}. 
                  Try a different time or day.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {availableInstructors.map((instructor) => (
                  <Card
                    key={instructor.instructorId}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedInstructor === instructor.instructorId
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => handleInstructorSelect(instructor.instructorId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4" />
                            <span className="font-semibold">{instructor.instructorName}</span>
                            {instructor.availableForAll ? (
                              <Badge variant="default" className="ml-2">
                                Fully Available
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="ml-2">
                                {instructor.conflictDates.length} Conflict{instructor.conflictDates.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>

                          {!instructor.availableForAll && instructor.conflictDates.length > 0 && (
                            <Alert className="mt-2">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                Conflicts on: {instructor.conflictDates.map(d => format(d, "MMM d")).join(", ")}
                                <br />
                                <span className="text-muted-foreground">
                                  You can skip these weeks or we'll find alternatives
                                </span>
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedDay !== null && selectedTime !== null && selectedInstructor !== null && (
        <>
          {holdExpiresAt && (
            <Alert>
              <Timer className="h-4 w-4" />
              <AlertDescription>
                Session hold expires in {Math.ceil((holdExpiresAt.getTime() - Date.now()) / 1000 / 60)} minutes
              </AlertDescription>
            </Alert>
          )}

          {selectedInstructorData && !selectedInstructorData.availableForAll && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Conflict Resolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">
                  {selectedInstructorData.instructorName} has {selectedInstructorData.conflictDates.length} conflict{selectedInstructorData.conflictDates.length !== 1 ? "s" : ""}. 
                  You can skip those weeks or we'll find an alternative instructor.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant={skipConflicts ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSkipConflicts(true)}
                  >
                    Skip Conflict Weeks
                  </Button>
                  <Button
                    variant={!skipConflicts ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSkipConflicts(false)}
                  >
                    Find Alternatives
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Your Selected Dates
              </CardTitle>
              <CardDescription>
                Booking {sessionCount} {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}s this month
                {skipConflicts && selectedInstructorData && !selectedInstructorData.availableForAll && 
                  ` (${selectedInstructorData.conflictDates.length} week${selectedInstructorData.conflictDates.length !== 1 ? "s" : ""} skipped)`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {remainingDates.map((date, index) => {
                  const isConflict = selectedInstructorData?.conflictDates.some(
                    (c) => c.getTime() === date.getTime()
                  );
                  const isSkipped = isConflict && skipConflicts;

                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isSkipped ? "bg-muted/50 opacity-50" : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={isSkipped ? "secondary" : "outline"}>
                          Session {index + 1}
                        </Badge>
                        <span className="font-medium">
                          {format(date, "EEEE, MMMM d, yyyy")}
                        </span>
                        <span className="text-muted-foreground">at {selectedTime}</span>
                        {isConflict && (
                          <Badge variant="destructive" className="text-xs">
                            {skipConflicts ? "Skipped" : "Alternative"}
                          </Badge>
                        )}
                      </div>
                      <span className={`font-semibold ${isSkipped ? "line-through" : ""}`}>
                        ${pricePerSession}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold">${totalPrice}</div>
                  <div className="text-sm text-muted-foreground">
                    {sessionCount} sessions × ${pricePerSession} each
                  </div>
                </div>
                <Button size="lg" onClick={handleConfirm} disabled={!swimmerId || !parentId}>
                  Confirm Booking
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>Main Pool</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>Instructor: {selectedInstructorData?.instructorName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
