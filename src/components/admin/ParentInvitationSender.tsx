import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Copy, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const ParentInvitationSender = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    parentEmail: "",
    swimmerIds: "", // Comma-separated swimmer IDs
    customMessage: "",
  });

  const handleGenerateAndSend = async () => {
    setLoading(true);
    setGeneratedLink(null);

    try {
      // Parse swimmer IDs
      const swimmerIdArray = formData.swimmerIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

      if (swimmerIdArray.length === 0) {
        toast({
          title: "Error",
          description: "Please enter at least one swimmer ID",
          variant: "destructive",
        });
        return;
      }

      // Get swimmer details to include in email
      const { data: swimmers, error: swimmersError } = await supabase
        .from("swimmers")
        .select("first_name, last_name")
        .in("id", swimmerIdArray);

      if (swimmersError) throw swimmersError;

      // Create invitation
      const { data: invitation, error: inviteError } = await supabase
        .from("parent_invitations")
        .insert({
          parent_email: formData.parentEmail,
          swimmer_ids: swimmerIdArray,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      const invitationLink = `${window.location.origin}/auth?token=${invitation.invitation_token}`;
      setGeneratedLink(invitationLink);

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-parent-invitation', {
        body: {
          parentEmail: formData.parentEmail,
          invitationLink,
          swimmers: swimmers || [],
          customMessage: formData.customMessage,
        },
      });

      if (emailError) {
        console.error("Error sending email:", emailError);
        toast({
          title: "Invitation Created",
          description: "Invitation link generated but email failed to send. Copy the link below.",
          variant: "default",
        });
      } else {
        toast({
          title: "Invitation Sent! 📧",
          description: `Invitation email sent to ${formData.parentEmail}`,
        });
      }

      // Reset form except the generated link
      setFormData({
        parentEmail: "",
        swimmerIds: "",
        customMessage: "",
      });
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast({
        title: "Copied!",
        description: "Invitation link copied to clipboard",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Send Parent Invitation
        </CardTitle>
        <CardDescription>
          Generate invitation links for parents to claim their swimmers and create accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="parentEmail">Parent Email Address *</Label>
          <Input
            id="parentEmail"
            type="email"
            placeholder="parent@example.com"
            value={formData.parentEmail}
            onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="swimmerIds">Swimmer IDs (comma-separated) *</Label>
          <Input
            id="swimmerIds"
            placeholder="e.g., abc123, def456, ghi789"
            value={formData.swimmerIds}
            onChange={(e) => setFormData({ ...formData, swimmerIds: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground">
            Enter the swimmer IDs from the database, separated by commas
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customMessage">Custom Message (Optional)</Label>
          <Textarea
            id="customMessage"
            placeholder="Add a personal message to the invitation email..."
            value={formData.customMessage}
            onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
            rows={4}
          />
        </div>

        <Button 
          onClick={handleGenerateAndSend} 
          disabled={loading || !formData.parentEmail || !formData.swimmerIds}
          className="w-full"
        >
          <Send className="mr-2 h-4 w-4" />
          {loading ? "Sending..." : "Generate & Send Invitation"}
        </Button>

        {generatedLink && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-semibold">Invitation Link Generated:</p>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="font-mono text-xs" />
                <Button onClick={copyToClipboard} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link expires in 30 days and can only be used once.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">How it works:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Enter the parent's email and their swimmer IDs</li>
            <li>An invitation email with a secure link is sent</li>
            <li>Parent clicks the link and creates their account</li>
            <li>Swimmers are automatically linked to the new parent account</li>
            <li>Parent can now log in and see only their swimmers</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
