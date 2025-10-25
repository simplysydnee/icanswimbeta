import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, addDays, isSameDay, startOfWeek } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "America/Los_Angeles";

interface WeeklyBookingTabProps {
  currentMonth: Date;
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

const AVAILABLE_TIMES = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

export const WeeklyBookingTab = ({ currentMonth }: WeeklyBookingTabProps) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const remainingDates = useMemo(() => {
    if (selectedDay === null) return [];

    const now = toZonedTime(new Date(), TIMEZONE);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const dates: Date[] = [];
    let currentDate = monthStart;

    while (currentDate <= monthEnd) {
      if (currentDate.getDay() === selectedDay && currentDate >= now) {
        dates.push(currentDate);
      }
      currentDate = addDays(currentDate, 1);
    }

    return dates;
  }, [selectedDay, currentMonth]);

  const sessionCount = remainingDates.length;
  const pricePerSession = 65;
  const totalPrice = sessionCount * pricePerSession;

  const handleConfirm = () => {
    console.log("Booking confirmed:", {
      day: DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label,
      time: selectedTime,
      dates: remainingDates,
      total: totalPrice,
    });
    // TODO: Create bookings via Supabase
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
            <CardDescription>All times shown in Pacific Time (America/Los_Angeles)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AVAILABLE_TIMES.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  onClick={() => setSelectedTime(time)}
                  className="justify-start gap-2"
                >
                  <Clock className="h-4 w-4" />
                  {time}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDay !== null && selectedTime !== null && (
        <>
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Your Selected Dates
              </CardTitle>
              <CardDescription>
                You're booking {sessionCount} remaining {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}s this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {remainingDates.map((date, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        Session {index + 1}
                      </Badge>
                      <span className="font-medium">
                        {format(date, "EEEE, MMMM d, yyyy")}
                      </span>
                      <span className="text-muted-foreground">at {selectedTime}</span>
                    </div>
                    <span className="font-semibold">${pricePerSession}</span>
                  </div>
                ))}

                {remainingDates.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No remaining {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}s this month. 
                      Try selecting next month or a different day.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {remainingDates.length > 0 && (
            <Card className="bg-primary/5 border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold">${totalPrice}</div>
                    <div className="text-sm text-muted-foreground">
                      {sessionCount} sessions × ${pricePerSession} each
                    </div>
                  </div>
                  <Button size="lg" onClick={handleConfirm}>
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
                    <span>Instructor: Sutton Lucas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
