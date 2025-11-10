import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Send, AlertCircle, CheckCircle2 } from "lucide-react";

interface ProgressSummaryButtonProps {
  swimmerId: string;
  swimmerName: string;
  currentLevel?: string;
  coordinatorEmail?: string;
  coordinatorName?: string;
  posNumber?: string;
  masteredSkills?: string[];
  inProgressSkills?: string[];
  lessonsCompleted?: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const ProgressSummaryButton = ({
  swimmerId,
  swimmerName,
  currentLevel,
  coordinatorEmail,
  coordinatorName,
  posNumber,
  masteredSkills = [],
  inProgressSkills = [],
  lessonsCompleted = 12,
  variant = "default",
  size = "default",
}: ProgressSummaryButtonProps) => {
  const [open, setOpen] = useState(false);
  const [progressSummary, setProgressSummary] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Auto-generate a template summary
  const generateTemplate = () => {
    const template = `${swimmerName} has completed ${lessonsCompleted} lessons and made excellent progress in their swim development.

SKILLS MASTERED:
${masteredSkills.length > 0 ? masteredSkills.map(skill => `• ${skill}`).join('\n') : '• [List mastered skills here]'}

SKILLS IN PROGRESS:
${inProgressSkills.length > 0 ? inProgressSkills.map(skill => `• ${skill}`).join('\n') : '• [List skills currently working on]'}

OVERALL ASSESSMENT:
${swimmerName} has demonstrated consistent improvement and is ready to continue advancing their swimming abilities. They show good water confidence and are progressing well through the ${currentLevel || 'current'} level.

RECOMMENDATION:
I recommend authorizing an additional 12 lessons to continue building on this progress and work toward the next skill level.`;

    setProgressSummary(template);
  };

  const handleSend = async () => {
    if (!progressSummary.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a progress summary",
        variant: "destructive",
      });
      return;
    }

    if (!coordinatorEmail) {
      toast({
        title: "Error",
        description: "No coordinator email found for this swimmer",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase.functions.invoke("send-vmrc-progress-summary", {
        body: {
          swimmerId,
          instructorId: userData.user.id,
          progressSummary,
          skillsSummary: {
            masteredSkills,
            inProgressSkills,
            currentLevel: currentLevel || "Not Assigned",
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Progress Summary Sent! ✓",
        description: `The summary has been sent to ${coordinatorName || "the coordinator"} with a POS renewal request.`,
      });

      setOpen(false);
      setProgressSummary("");
    } catch (error: any) {
      console.error("Error sending progress summary:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send progress summary",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <FileText className="h-4 w-4" />
          Send Progress Summary & Request POS
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Progress Summary to VMRC Coordinator</DialogTitle>
          <DialogDescription>
            Create a comprehensive summary of {swimmerName}'s progress to request a new POS authorization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Coordinator Info */}
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <strong>Sending to:</strong> {coordinatorName || "VMRC Coordinator"}
              <br />
              <strong>Email:</strong> {coordinatorEmail || "Not specified"}
              <br />
              <strong>Current POS:</strong> {posNumber || "N/A"}
            </AlertDescription>
          </Alert>

          {/* Summary Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>What will be sent:</strong>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                <li>Your progress summary (below)</li>
                <li>Skills mastered and in progress</li>
                <li>Recent lesson notes from the past 5 sessions</li>
                <li>Current level and recommendations</li>
                <li>Request for 12 additional lessons</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Progress Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="progressSummary">Progress Summary</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateTemplate}
                disabled={sending}
              >
                Generate Template
              </Button>
            </div>
            <Textarea
              id="progressSummary"
              placeholder="Describe the swimmer's overall progress, skills mastered, areas of improvement, and readiness to continue..."
              value={progressSummary}
              onChange={(e) => setProgressSummary(e.target.value)}
              rows={12}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Be specific and thorough. This summary will be included in the email to the coordinator along with recent lesson notes.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !progressSummary.trim()}>
            {sending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Summary & Request POS
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};