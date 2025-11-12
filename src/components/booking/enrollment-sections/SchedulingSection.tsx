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
    availabilityGeneral: string[];
    startDate: Date | undefined;
    clientBookingLimit: number;
    attendanceStanding: string;
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
                  checked={formData.availabilityGeneral.includes(slot)}
                  onCheckedChange={() => onMultiSelectToggle("availabilityGeneral", slot)}
                />
                <Label htmlFor={`availability-${slot}`} className="font-normal">
                  {slot}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Preferred Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? (
                  format(formData.startDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => onChange("startDate", date)}
                disabled={(date) => date < new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientBookingLimit">Maximum Sessions Per Week</Label>
          <Input
            id="clientBookingLimit"
            type="number"
            min="1"
            max="5"
            placeholder="1"
            value={formData.clientBookingLimit}
            onChange={(e) => onChange("clientBookingLimit", parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attendanceStanding">Expected Attendance Frequency</Label>
          <Select
            value={formData.attendanceStanding}
            onValueChange={(value) => onChange("attendanceStanding", value)}
          >
            <SelectTrigger id="attendanceStanding">
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
