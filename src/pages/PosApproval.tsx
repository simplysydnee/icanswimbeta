import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PosApproval() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const [newPosNumber, setNewPosNumber] = useState("");
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from("progress_update_requests")
        .select(`
          *,
          swimmers (
            first_name,
            last_name,
            vmrc_coordinator_name,
            vmrc_coordinator_email,
            swim_levels (
              display_name
            )
          ),
          profiles!progress_update_requests_instructor_id_fkey (
            full_name,
            email
          )
        `)
        .eq("id", requestId)
        .single();

      if (error) throw error;

      setRequest(data);
    } catch (error: any) {
      console.error("Error fetching request:", error);
      toast({
        title: "Error",
        description: "Failed to load POS request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!newPosNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a POS number",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("approve-pos-request", {
        body: {
          requestId,
          newPosNumber: newPosNumber.trim(),
        },
      });

      if (error) throw error;

      setApproved(true);
      toast({
        title: "POS Approved! ✓",
        description: "The swimmer can now book new sessions",
      });
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve POS request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background flex items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            POS request not found. The link may be invalid or expired.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (approved || request.status === "approved") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <CardTitle>POS Request Approved</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Success!</strong> The POS request for {request.swimmers?.first_name} {request.swimmers?.last_name} has been approved.
                <br />
                <br />
                <strong>New POS Number:</strong> {request.new_pos_number || newPosNumber}
                <br />
                <br />
                The swimmer can now book new sessions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">VMRC POS Approval Request</h1>
          <p className="text-muted-foreground">
            Review progress summary and approve new POS authorization
          </p>
        </div>

        {/* Swimmer Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Swimmer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{request.swimmers?.first_name} {request.swimmers?.last_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Current Level</Label>
                <p className="font-medium">{request.swimmers?.swim_levels?.display_name || "Not Assigned"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Current POS Number</Label>
                <p className="font-medium">{request.current_pos_number || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Lessons Completed</Label>
                <p className="font-medium">{request.lessons_completed}/12</p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Instructor</Label>
              <p className="font-medium">{request.profiles?.full_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div>
                <Badge variant={request.status === "pending" ? "secondary" : "default"}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Progress Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap">{request.progress_summary}</p>
            </div>
          </CardContent>
        </Card>

        {/* Skills Summary */}
        {request.skills_summary && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Skills Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.skills_summary.masteredSkills && request.skills_summary.masteredSkills.length > 0 && (
                <div>
                  <Label className="text-green-600 font-semibold">✅ Skills Mastered</Label>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {request.skills_summary.masteredSkills.map((skill: string, index: number) => (
                      <li key={index}>{skill}</li>
                    ))}
                  </ul>
                </div>
              )}
              {request.skills_summary.inProgressSkills && request.skills_summary.inProgressSkills.length > 0 && (
                <div>
                  <Label className="text-amber-600 font-semibold">🔄 Skills In Progress</Label>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {request.skills_summary.inProgressSkills.map((skill: string, index: number) => (
                      <li key={index}>{skill}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Approval Section */}
        {request.status === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle>Approve POS Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-primary">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Action Required:</strong> Please enter the new POS authorization number for 12 additional lessons and click Approve.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="posNumber">New POS Authorization Number *</Label>
                <Input
                  id="posNumber"
                  placeholder="Enter POS number (e.g., POS-2025-001)"
                  value={newPosNumber}
                  onChange={(e) => setNewPosNumber(e.target.value)}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  This will authorize 12 additional swim lessons for the swimmer
                </p>
              </div>

              <Button
                onClick={handleApprove}
                disabled={submitting || !newPosNumber.trim()}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve POS Request
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
