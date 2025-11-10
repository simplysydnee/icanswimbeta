import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Save, FileCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressSummaryButton } from "@/components/ProgressSummaryButton";

interface Skill {
  id: string;
  name: string;
  status: string;
}

interface UpdateProgressDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  swimmerId: string | null;
  sessionId: string | null;
  bookingId: string | null;
}

export const UpdateProgressDrawer = ({
  open,
  onOpenChange,
  swimmerId,
  sessionId,
  bookingId,
}: UpdateProgressDrawerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [swimmer, setSwimmer] = useState<any>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [instructorNotes, setInstructorNotes] = useState("");
  const [parentNotes, setParentNotes] = useState("");
  const [lessonSummary, setLessonSummary] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [shareWithParent, setShareWithParent] = useState(false);
  const [posInfo, setPosInfo] = useState<any>(null);
  const [swimLevels, setSwimLevels] = useState<any[]>([]);

  useEffect(() => {
    if (open && swimmerId) {
      fetchSwimmerData();
    }
  }, [open, swimmerId]);

  const fetchSwimmerData = async () => {
    try {
      // Fetch swimmer info
      const { data: swimmerData, error: swimmerError } = await supabase
        .from("swimmers")
        .select(`
          *,
          swim_levels (
            id,
            display_name
          )
        `)
        .eq("id", swimmerId)
        .single();

      if (swimmerError) throw swimmerError;
      setSwimmer(swimmerData);
      setSelectedLevel(swimmerData.current_level_id || "");

      // Fetch all swim levels
      const { data: levelsData } = await supabase
        .from("swim_levels")
        .select("*")
        .order("sequence");
      setSwimLevels(levelsData || []);

      // Fetch POS info for VMRC clients
      if (swimmerData.is_vmrc_client && sessionId) {
        const { data: sessionData } = await supabase
          .from("sessions")
          .select("start_time")
          .eq("id", sessionId)
          .single();

        if (sessionData) {
          const { data: posData, error: posError } = await supabase
            .rpc("get_active_pos_for_session", {
              _swimmer_id: swimmerId,
              _session_date: sessionData.start_time.split("T")[0],
            });

          if (!posError && posData && posData.length > 0) {
            setPosInfo(posData[0]);
            
            // Auto-fill lesson summary template
            const levelName = swimmerData.swim_levels?.display_name || "current level";
            const lessonNum = posData[0].lesson_number;
            const totalLessons = posData[0].lessons_authorized;
            setLessonSummary(
              `Swimmer has completed lesson ${lessonNum}/${totalLessons} in ${levelName}. Demonstrates [skills mastered] and continues to work on [skills not attained].`
            );
          }
        }
      }

      // Fetch swimmer skills
      if (swimmerData.current_level_id) {
        const { data: skillsData, error: skillsError } = await supabase
          .from("skills")
          .select(`
            id,
            name,
            swimmer_skills!inner (
              status
            )
          `)
          .eq("level_id", swimmerData.current_level_id)
          .eq("swimmer_skills.swimmer_id", swimmerId);

        if (skillsError) throw skillsError;
        
        const formattedSkills = skillsData?.map(skill => ({
          id: skill.id,
          name: skill.name,
          status: skill.swimmer_skills[0]?.status || "not_started",
        })) || [];

        setSkills(formattedSkills);
      }

      // Fetch existing notes if editing existing session
      if (bookingId) {
        const { data: attendanceData } = await supabase
          .from("session_attendance")
          .select("instructor_notes")
          .eq("booking_id", bookingId)
          .eq("session_id", sessionId)
          .single();

        if (attendanceData?.instructor_notes) {
          setInstructorNotes(attendanceData.instructor_notes);
        }
      }
    } catch (error) {
      console.error("Error fetching swimmer data:", error);
      toast({
        title: "Error",
        description: "Failed to load swimmer data",
        variant: "destructive",
      });
    }
  };

  const handleSkillToggle = async (skillId: string, currentStatus: string) => {
    const newStatus = currentStatus === "mastered" ? "in_progress" : "mastered";
    
    try {
      // Check if swimmer_skill record exists
      const { data: existing } = await supabase
        .from("swimmer_skills")
        .select("id")
        .eq("swimmer_id", swimmerId)
        .eq("skill_id", skillId)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from("swimmer_skills")
          .update({ 
            status: newStatus,
            date_mastered: newStatus === "mastered" ? new Date().toISOString() : null
          })
          .eq("swimmer_id", swimmerId)
          .eq("skill_id", skillId);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("swimmer_skills")
          .insert({
            swimmer_id: swimmerId,
            skill_id: skillId,
            status: newStatus,
            date_mastered: newStatus === "mastered" ? new Date().toISOString() : null,
          });

        if (error) throw error;
      }

      // Update local state
      setSkills(skills.map(skill => 
        skill.id === skillId ? { ...skill, status: newStatus } : skill
      ));

      toast({
        title: "Skill Updated",
        description: "Progress has been saved",
      });
    } catch (error) {
      console.error("Error updating skill:", error);
      toast({
        title: "Error",
        description: "Failed to update skill",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (createNextPos: boolean = false) => {
    if (!sessionId || !swimmerId || !bookingId || !lessonSummary.trim()) {
      toast({
        title: "Validation Error",
        description: "Lesson summary is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Get mastered skills
      const masteredSkills = skills
        .filter(s => s.status === "mastered")
        .map(s => s.id);

      const workingOnSkills = skills
        .filter(s => s.status === "in_progress")
        .map(s => s.name);

      // Save progress note
      const { error: progressError } = await supabase
        .from("progress_notes")
        .insert({
          session_id: sessionId,
          booking_id: bookingId,
          swimmer_id: swimmerId,
          instructor_id: user.id,
          lesson_summary: lessonSummary,
          current_level_id: selectedLevel || null,
          skills_mastered: masteredSkills,
          skills_working_on: workingOnSkills,
          instructor_notes: instructorNotes,
          parent_notes: parentNotes,
          shared_with_parent: shareWithParent,
          lesson_number: posInfo?.lesson_number || null,
          total_lessons: posInfo?.lessons_authorized || null,
        });

      if (progressError) throw progressError;

      // Update attendance
      const { data: existing } = await supabase
        .from("session_attendance")
        .select("id")
        .eq("session_id", sessionId)
        .eq("booking_id", bookingId)
        .eq("swimmer_id", swimmerId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("session_attendance")
          .update({
            instructor_notes: instructorNotes,
            attended: true,
            marked_by: user.id,
            marked_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("session_attendance")
          .insert({
            session_id: sessionId,
            booking_id: bookingId,
            swimmer_id: swimmerId,
            instructor_notes: instructorNotes,
            attended: true,
            marked_by: user.id,
            marked_at: new Date().toISOString(),
          });
        if (error) throw error;
      }

      // Create next POS if requested (VMRC only)
      if (createNextPos && swimmer?.is_vmrc_client && posInfo?.pos_id) {
        const { data: newPosId, error: posError } = await supabase
          .rpc("create_next_vmrc_pos", {
            _swimmer_id: swimmerId,
            _current_pos_id: posInfo.pos_id,
            _instructor_id: user.id,
          });

        if (posError) {
          console.error("Error creating next POS:", posError);
          toast({
            title: "Warning",
            description: "Progress saved but failed to create next POS",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Progress saved and next POS created for coordinator approval",
          });
        }
      } else {
        toast({
          title: "Progress Saved",
          description: "Swimmer progress has been updated successfully",
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving progress:", error);
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Update Progress</SheetTitle>
          <SheetDescription>
            Track skills and add notes for this session
          </SheetDescription>
        </SheetHeader>

        {swimmer && (
          <div className="mt-6 space-y-6">
            {/* Swimmer Info */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={swimmer.photo_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {swimmer.first_name} {swimmer.last_name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {swimmer.swim_levels?.display_name || "No Level"}
                  </Badge>
                  {swimmer.is_vmrc_client && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      VMRC
                    </Badge>
                  )}
                  {swimmer.payment_type === "private_pay" && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Private Pay - Unlimited Lessons
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* VMRC Lesson Progress Alert */}
            {swimmer.is_vmrc_client && posInfo && posInfo.lesson_number >= 11 && (
              <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <p className="font-bold text-amber-900 dark:text-amber-100 mb-1">
                    Lesson {posInfo.lesson_number} of {posInfo.lessons_authorized}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    This is the second-to-last lesson. Consider preparing the next POS for coordinator approval.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Lesson Summary */}
            <div className="space-y-2">
              <Label htmlFor="lesson-summary">
                Lesson Summary <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="lesson-summary"
                placeholder="Summarize the lesson progress and key observations..."
                value={lessonSummary}
                onChange={(e) => setLessonSummary(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Current Level */}
            <div className="space-y-2">
              <Label htmlFor="current-level">Current Level</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {swimLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Skills Section */}
            {skills.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold">Skills Progress</h4>
                <div className="space-y-2">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        skill.status === "mastered"
                          ? "bg-green-50 border-green-200"
                          : skill.status === "in_progress"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-card border-border"
                      )}
                    >
                      <Checkbox
                        checked={skill.status === "mastered"}
                        onCheckedChange={() => handleSkillToggle(skill.id, skill.status)}
                        className="h-5 w-5"
                      />
                      <span className="flex-1 font-medium">{skill.name}</span>
                      <Badge
                        variant={
                          skill.status === "mastered"
                            ? "default"
                            : skill.status === "in_progress"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {skill.status === "mastered"
                          ? "Mastered"
                          : skill.status === "in_progress"
                          ? "In Progress"
                          : "Not Started"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructor Notes (Private) */}
            <div className="space-y-2">
              <Label htmlFor="instructor-notes">
                Instructor Notes <span className="text-xs text-muted-foreground">(Private)</span>
              </Label>
              <Textarea
                id="instructor-notes"
                placeholder="Add private notes visible only to instructors and admins..."
                value={instructorNotes}
                onChange={(e) => setInstructorNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Parent-Visible Notes */}
            <div className="space-y-2">
              <Label htmlFor="parent-notes">
                Parent Notes
              </Label>
              <Textarea
                id="parent-notes"
                placeholder="Add notes for parents (optional)..."
                value={parentNotes}
                onChange={(e) => setParentNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex items-center space-x-2">
                <Switch
                  id="share-with-parent"
                  checked={shareWithParent}
                  onCheckedChange={setShareWithParent}
                />
                <Label htmlFor="share-with-parent" className="text-sm font-normal">
                  Share with parent
                </Label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              {swimmer.is_vmrc_client && posInfo && posInfo.lesson_number >= 11 && (
                <ProgressSummaryButton
                  swimmerId={swimmer.id}
                  swimmerName={`${swimmer.first_name} ${swimmer.last_name}`}
                  currentLevel={swimmer.swim_levels?.display_name}
                  coordinatorEmail={swimmer.vmrc_coordinator_email}
                  coordinatorName={swimmer.vmrc_coordinator_name}
                  posNumber={swimmer.vmrc_current_pos_number}
                  masteredSkills={skills.filter(s => s.status === "mastered").map(s => s.name)}
                  inProgressSkills={skills.filter(s => s.status === "in_progress").map(s => s.name)}
                  lessonsCompleted={posInfo.lessons_used + 1}
                  variant="default"
                  size="default"
                />
              )}
              
              {swimmer.is_vmrc_client && posInfo && posInfo.lesson_number >= 11 ? (
                <>
                  <Button
                    onClick={() => handleSave(false)}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Progress
                  </Button>
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={loading}
                    className="w-full"
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    {loading ? "Saving..." : "Save & Prepare Next POS"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleSave(false)}
                  disabled={loading}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save Progress"}
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
