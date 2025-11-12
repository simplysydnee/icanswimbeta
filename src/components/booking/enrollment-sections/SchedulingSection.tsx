import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const AVAILABILITY_SLOTS = [
  "Flexible",
  "Weekday Mornings",
  "Weekday Afternoons",
  "Weekday Evenings",
  "Saturday",
  "Sunday",
  "Other"
];

interface SchedulingSectionProps {
  formData: {
    availability: string[];
    preferredStartDate: Date | undefined;
    weeklyBookingLimit: number;
    attendanceExpectation: string;
  };
  onMultiSelectToggle: (field: string, value: string) => void;
  onChange: (field: string, value: any) => void;
}

export const SchedulingSection = ({ formData, onMultiSelectToggle, onChange }: SchedulingSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduling Preferences</CardTitle>
        <CardDescription>Your availability and scheduling needs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>General Availability for Swim Lessons</Label>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABILITY_SLOTS.map((slot) => (
              <div key={slot} className="flex items-start space-x-2">
                <Checkbox
                  id={`availability-${slot}`}
                  checked={formData.availability.includes(slot)}
                  onCheckedChange={() => onMultiSelectToggle("availability", slot)}
                />
                <Label htmlFor={`availability-${slot}`} className="font-normal">
                  {slot}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredStartDate">Preferred Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.preferredStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.preferredStartDate ? (
                  format(formData.preferredStartDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.preferredStartDate}
                onSelect={(date) => onChange("preferredStartDate", date)}
                disabled={(date) => date < new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weeklyBookingLimit">Maximum Sessions Per Week</Label>
          <Input
            id="weeklyBookingLimit"
            type="number"
            min="1"
            max="5"
            placeholder="1"
            value={formData.weeklyBookingLimit}
            onChange={(e) => onChange("weeklyBookingLimit", parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attendanceExpectation">Expected Attendance Frequency</Label>
          <Select
            value={formData.attendanceExpectation}
            onValueChange={(value) => onChange("attendanceExpectation", value)}
          >
            <SelectTrigger id="attendanceExpectation">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Every week">Every week</SelectItem>
              <SelectItem value="Every other week">Every other week</SelectItem>
              <SelectItem value="Once a month">Once a month</SelectItem>
              <SelectItem value="Flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
