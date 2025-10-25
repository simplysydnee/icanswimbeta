import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, Plus, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InstructorManager } from "@/components/admin/InstructorManager";

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

const DURATIONS = [15, 20, 25, 30, 45, 60];

const SESSION_TYPES = [
  { value: "weekly_recurring_month", label: "Weekly Recurring (Month)" },
  { value: "single_lesson", label: "Single Lesson" },
  { value: "initial_assessment", label: "Initial Assessment" },
  { value: "single_initial_assessment", label: "Single Initial Assessment" },
];

interface Break {
  breakStart: string;
  breakEnd: string;
  label: string;
}

const MasterSchedule = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    mode: "next_month" as "next_month" | "custom",
    startDate: null as Date | null,
    endDate: null as Date | null,
    daysOfWeek: [] as number[],
    startTime: "09:00",
    endTime: "17:00",
    duration: 30,
    instructors: [] as string[],
    sessionType: "weekly_recurring_month",
    location: "",
    price: "",
    notesTags: "",
    additionalDates: [] as Date[],
    allowedSwimLevels: [] as string[],
  });

  // Fetch swim levels
  const { data: swimLevels } = useQuery({
    queryKey: ["swim-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("swim_levels")
        .select("*")
        .order("sequence");
      
      if (error) throw error;
      return data;
    },
  });

  const [breaks, setBreaks] = useState<Break[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<Date[]>([]);

  const addBreak = () => {
    setBreaks([...breaks, { breakStart: "", breakEnd: "", label: "" }]);
  };

  const removeBreak = (index: number) => {
    setBreaks(breaks.filter((_, i) => i !== index));
  };

  const updateBreak = (index: number, field: keyof Break, value: string) => {
    const updated = [...breaks];
    updated[index] = { ...updated[index], [field]: value };
    setBreaks(updated);
  };

  const handleGenerate = async () => {
    setLoading(true);
    
    try {
      // Validation
      if (formData.daysOfWeek.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please select at least one day of the week",
          variant: "destructive",
        });
        return;
      }

      if (formData.instructors.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please select at least one instructor",
          variant: "destructive",
        });
        return;
      }

      if (formData.startTime >= formData.endTime) {
        toast({
          title: "Validation Error",
          description: "Start time must be before end time",
          variant: "destructive",
        });
        return;
      }

      // Call edge function to generate sessions
      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: {
          mode: formData.mode,
          startDate: formData.startDate?.toISOString(),
          endDate: formData.endDate?.toISOString(),
          daysOfWeek: formData.daysOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
          duration: formData.duration,
          instructors: formData.instructors,
          breaks,
          sessionType: formData.sessionType,
          location: formData.location,
          price: formData.price ? parseFloat(formData.price) : null,
          notesTags: formData.notesTags,
          blackoutDates: blackoutDates.map((d) => d.toISOString()),
          additionalDates: formData.additionalDates.map((d) => d.toISOString()),
          allowedSwimLevels: formData.allowedSwimLevels,
        },
      });

      if (error) throw error;

      setSummary(data);
      setShowSummary(true);

      toast({
        title: "Sessions Generated! ✓",
        description: `Created ${data.created} sessions, skipped ${data.skipped}`,
      });
    } catch (error: any) {
      console.error("Error generating schedule:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!summary?.batchId) return;

    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("batch_id", summary.batchId)
        .eq("status", "draft");

      if (error) throw error;

      toast({
        title: "Batch Deleted",
        description: "All draft sessions from this batch have been deleted",
      });

      setShowSummary(false);
      setSummary(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete batch",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background p-6">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Master Schedule (Admin)</h1>
          <p className="text-muted-foreground">Generate swim sessions for instructors</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Sessions</CardTitle>
            <CardDescription>
              Configure session parameters and generate a schedule. New sessions start as Draft and automatically open on the last Sunday at 6:00 PM PT.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Scope */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Date Scope</Label>
              
              <div className="space-y-2">
                <Label htmlFor="mode">Mode</Label>
                <Select
                  value={formData.mode}
                  onValueChange={(value: "next_month" | "custom") =>
                    setFormData({ ...formData, mode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next_month">Generate Next Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.mode === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
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
                          {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.startDate || undefined}
                          onSelect={(date) => setFormData({ ...formData, startDate: date || null })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.endDate || undefined}
                          onSelect={(date) => setFormData({ ...formData, endDate: date || null })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={formData.daysOfWeek.includes(day.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              daysOfWeek: [...formData.daysOfWeek, day.value],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              daysOfWeek: formData.daysOfWeek.filter((d) => d !== day.value),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`day-${day.value}`} className="font-normal">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Window */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Time Window</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    step="300"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    step="300"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Session Duration (min)</Label>
                  <Select
                    value={formData.duration.toString()}
                    onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((d) => (
                        <SelectItem key={d} value={d.toString()}>
                          {d} minutes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Breaks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Breaks</Label>
                <Button type="button" variant="outline" size="sm" onClick={addBreak}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Break
                </Button>
              </div>

              {breaks.map((brk, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label>Break Start</Label>
                      <Input
                        type="time"
                        step="300"
                        value={brk.breakStart}
                        onChange={(e) => updateBreak(index, "breakStart", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Break End</Label>
                      <Input
                        type="time"
                        step="300"
                        value={brk.breakEnd}
                        onChange={(e) => updateBreak(index, "breakEnd", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        placeholder="e.g., Pool sanitize"
                        value={brk.label}
                        onChange={(e) => updateBreak(index, "label", e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBreak(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Instructors */}
            <InstructorManager
              selectedInstructors={formData.instructors}
              onInstructorsChange={(instructors) =>
                setFormData({ ...formData, instructors })
              }
            />

            {/* Swim Levels */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Allowed Swim Levels</Label>
              <p className="text-sm text-muted-foreground">
                Select which swim levels can book these sessions (leave empty to allow all levels)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {swimLevels?.map((level) => (
                  <div key={level.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`level-${level.id}`}
                      checked={formData.allowedSwimLevels.includes(level.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            allowedSwimLevels: [...formData.allowedSwimLevels, level.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            allowedSwimLevels: formData.allowedSwimLevels.filter((id) => id !== level.id),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`level-${level.id}`} className="font-normal">
                      {level.display_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Template */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Session Template</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionType">Session Type</Label>
                  <Select
                    value={formData.sessionType}
                    onValueChange={(value) => setFormData({ ...formData, sessionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SESSION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location/Pool</Label>
                  <Input
                    id="location"
                    placeholder="Pool location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price/Rate</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notesTags">Notes/Tags</Label>
                <Textarea
                  id="notesTags"
                  placeholder="Any additional notes..."
                  value={formData.notesTags}
                  onChange={(e) => setFormData({ ...formData, notesTags: e.target.value })}
                />
              </div>
            </div>

            {/* Blackout Dates */}
            <div className="space-y-2">
              <Label>Blackout Dates</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Selected: {blackoutDates.map((d) => format(d, "MMM d")).join(", ") || "None"}
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Select Dates
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="multiple"
                    selected={blackoutDates}
                    onSelect={(dates) => setBlackoutDates(dates || [])}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Generate Button */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                New sessions start as <strong>Draft</strong>. They'll automatically <strong>Open</strong> on the last Sunday of this month at 6:00 PM PT for next month's dates.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? "Generating..." : "Generate Sessions"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Sessions Generated
            </DialogTitle>
            <DialogDescription>
              Summary of the session generation batch
            </DialogDescription>
          </DialogHeader>

          {summary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Created</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">{summary.created}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Skipped</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-orange-600">{summary.skipped}</p>
                  </CardContent>
                </Card>
              </div>

              {summary.conflicts && summary.conflicts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Conflicts ({summary.conflicts.length})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {summary.conflicts.map((conflict: any, i: number) => (
                      <Alert key={i} variant="destructive">
                        <AlertDescription className="text-xs">
                          {conflict.date} at {conflict.time} - {conflict.instructor}: {conflict.reason}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setShowSummary(false)}>
                  Close
                </Button>
                <Button variant="destructive" onClick={handleDeleteBatch}>
                  Delete Drafts from This Batch
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterSchedule;
