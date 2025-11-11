import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, AlertCircle, CheckCircle2, User, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/LogoutButton";

interface Swimmer {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  current_level: string | null;
  vmrc_sessions_used: number;
  vmrc_sessions_authorized: number;
  vmrc_current_pos_number: string | null;
  vmrc_coordinator_name: string | null;
  vmrc_coordinator_email: string | null;
}

const UpdateProgress = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const swimmerId = searchParams.get("swimmerId");
  const { toast } = useToast();

  const [swimmer, setSwimmer] = useState<Swimmer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progressNotes, setProgressNotes] = useState("");

  useEffect(() => {
    if (swimmerId) {
      fetchSwimmer();
    }
  }, [swimmerId]);

  const fetchSwimmer = async () => {
    try {
      const { data, error } = await supabase
        .from("swimmers")
        .select(`
          id,
          first_name,
          last_name,
          photo_url,
          current_level_id,
          vmrc_sessions_used,
          vmrc_sessions_authorized,
          vmrc_current_pos_number,
          vmrc_coordinator_name,
          vmrc_coordinator_email,
          swim_levels (
            display_name
          )
        `)
        .eq("id", swimmerId)
        .single();

      if (error) throw error;

      setSwimmer({
        ...data,
        current_level: data.swim_levels?.display_name || "Not Assigned",
      });
    } catch (error) {
      console.error("Error fetching swimmer:", error);
      toast({
        title: "Error",
        description: "Failed to load swimmer information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!swimmer || !progressNotes.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide progress notes",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Call edge function to send progress update request
      const { error } = await supabase.functions.invoke("send-progress-update-request", {
        body: {
          swimmerId: swimmer.id,
          swimmerName: `${swimmer.first_name} ${swimmer.last_name}`,
          currentLevel: swimmer.current_level,
          progressNotes,
          coordinatorEmail: swimmer.vmrc_coordinator_email,
          coordinatorName: swimmer.vmrc_coordinator_name,
          currentPosNumber: swimmer.vmrc_current_pos_number,
        },
      });

      if (error) throw error;

      toast({
        title: "Progress Update Sent",
        description: "The coordinator has been notified and will review the progress update.",
      });

      navigate("/schedule");
    } catch (error: any) {
      console.error("Error sending progress update:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send progress update",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!swimmer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Swimmer not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background p-6">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/schedule")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Schedule
          </Button>
          <LogoutButton />
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Update Swimmer Progress</h1>
          <p className="text-muted-foreground">
            Submit progress notes to request a new POS authorization
          </p>
        </div>

        {/* Swimmer Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Swimmer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={swimmer.photo_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">
                  {swimmer.first_name} {swimmer.last_name}
                </h3>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline">{swimmer.current_level}</Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    VMRC Client
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  POS: {swimmer.vmrc_current_pos_number || "N/A"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Usage Alert */}
        <Alert className="mb-6 border-destructive bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Sessions Used:</strong> {swimmer.vmrc_sessions_used} / {swimmer.vmrc_sessions_authorized}
            <br />
            This swimmer has used all authorized sessions. Submit a progress update to request a new POS authorization.
          </AlertDescription>
        </Alert>

        {/* Coordinator Info */}
        {swimmer.vmrc_coordinator_name && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">VMRC Coordinator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{swimmer.vmrc_coordinator_name}</p>
                <p className="text-muted-foreground">{swimmer.vmrc_coordinator_email}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Notes Form */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Notes</CardTitle>
            <CardDescription>
              Describe the swimmer's progress, skills mastered, and readiness to continue lessons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="progressNotes">Progress Summary</Label>
              <Textarea
                id="progressNotes"
                placeholder="Example: [Swimmer Name] has made excellent progress over the past 12 sessions. They have mastered:&#10;• Skill 1&#10;• Skill 2&#10;• Skill 3&#10;&#10;They are ready to continue advancing to the next level and would benefit from 12 additional sessions."
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                rows={12}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about skills mastered and areas of improvement. This information will be sent to the VMRC coordinator.
              </p>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Once submitted, this progress update will be sent to the VMRC coordinator for review. 
                They will process the request and provide a new POS authorization if approved.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !progressNotes.trim()}
                className="flex-1"
              >
                {submitting ? "Sending..." : "Submit Progress Update"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/schedule")}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateProgress;
