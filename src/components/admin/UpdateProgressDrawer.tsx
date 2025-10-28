import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Save } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const handleSave = async () => {
    if (!sessionId || !swimmerId || !bookingId) return;

    setLoading(true);
    try {
      // Check if attendance record exists
      const { data: existing } = await supabase
        .from("session_attendance")
        .select("id")
        .eq("session_id", sessionId)
        .eq("booking_id", bookingId)
        .eq("swimmer_id", swimmerId)
        .single();

      const { data: { user } } = await supabase.auth.getUser();

      if (existing) {
        // Update existing attendance
        const { error } = await supabase
          .from("session_attendance")
          .update({
            instructor_notes: instructorNotes,
            attended: true,
            marked_by: user?.id,
            marked_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new attendance record
        const { error } = await supabase
          .from("session_attendance")
          .insert({
            session_id: sessionId,
            booking_id: bookingId,
            swimmer_id: swimmerId,
            instructor_notes: instructorNotes,
            attended: true,
            marked_by: user?.id,
            marked_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast({
        title: "Progress Saved",
        description: "Swimmer progress has been updated successfully",
      });

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
                </div>
              </div>
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
                Parent Notes <span className="text-xs text-muted-foreground">(Visible to Parents)</span>
              </Label>
              <Textarea
                id="parent-notes"
                placeholder="Add notes that parents will see..."
                value={parentNotes}
                onChange={(e) => setParentNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                These notes will be visible to the swimmer's parents in their dashboard
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Progress"}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
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
