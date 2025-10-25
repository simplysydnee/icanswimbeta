import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const ASSESSMENT_TIMES = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
];

export const AssessmentTab = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleConfirm = () => {
    console.log("Assessment booking confirmed:", {
      date: selectedDate,
      time: selectedTime,
    });
    // TODO: Create assessment booking via Supabase
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          🔑 Complete your Initial Assessment to unlock weekly and floating sessions
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>What to Expect</CardTitle>
          <CardDescription>
            Your Initial Assessment is a 45-minute one-on-one session to evaluate your swimmer's current abilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>Duration:</strong> 45 minutes
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>What to Bring:</strong> Swimsuit, towel, goggles (optional), water bottle
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>What We'll Do:</strong> Evaluate comfort in water, floating ability, basic skills, and discuss goals
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>Price:</strong> $65 (one-time fee)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Assessment Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date() || date.getDay() === 0}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>Select Time</CardTitle>
            <CardDescription>
              Available times for {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ASSESSMENT_TIMES.map((time) => (
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

      {selectedDate && selectedTime && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold mb-1">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
                </div>
                <div className="text-2xl font-bold">$65</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Initial Assessment (45 minutes)
                </div>
              </div>
              <Button size="lg" onClick={handleConfirm}>
                Confirm Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
