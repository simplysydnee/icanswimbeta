import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LiabilityWaiverModal } from "@/components/LiabilityWaiverModal";
import { CancellationPolicyAgreementModal } from "@/components/CancellationPolicyAgreementModal";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function WaiverCompletion() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [swimmerId, setSwimmerId] = useState<string | null>(null);
  const [liabilityModalOpen, setLiabilityModalOpen] = useState(false);
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    photoVideoPermission: "",
    photoVideoSignature: "",
    liabilityWaiverAgreed: false,
    liabilityWaiverSignature: "",
    cancellationPolicyAgreed: false,
    cancellationPolicySignature: "",
  });

  useEffect(() => {
    checkWaiverStatus();
  }, []);

  const checkWaiverStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get the swimmer record for this parent
      const { data: swimmers, error } = await supabase
        .from("swimmers")
        .select("id, photo_video_signature, liability_waiver_signature, cancellation_policy_signature")
        .eq("parent_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!swimmers) {
        // No swimmer record yet, stay on this page
        setCheckingStatus(false);
        return;
      }

      setSwimmerId(swimmers.id);

      // Check if all waivers are completed
      if (
        swimmers.photo_video_signature &&
        swimmers.liability_waiver_signature &&
        swimmers.cancellation_policy_signature
      ) {
        // All waivers completed, redirect to landing
        navigate("/");
        return;
      }

      setCheckingStatus(false);
    } catch (error) {
      console.error("Error checking waiver status:", error);
      setCheckingStatus(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.photoVideoPermission) {
      toast({
        title: "Missing Information",
        description: "Please select your photo/video permission preference",
        variant: "destructive",
      });
      return;
    }

    if (!formData.photoVideoSignature) {
      toast({
        title: "Missing Signature",
        description: "Please provide your signature for photo/video permission",
        variant: "destructive",
      });
      return;
    }

    if (!formData.liabilityWaiverAgreed || !formData.liabilityWaiverSignature) {
      toast({
        title: "Liability Waiver Required",
        description: "Please read, agree to, and sign the liability waiver",
        variant: "destructive",
      });
      return;
    }

    if (!formData.cancellationPolicyAgreed || !formData.cancellationPolicySignature) {
      toast({
        title: "Cancellation Policy Required",
        description: "Please read, agree to, and sign the cancellation policy",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let targetSwimmerId = swimmerId;

      // If no swimmer record exists, we need to wait for enrollment
      // For now, we'll store this in the user's profile metadata or create a pending record
      if (!targetSwimmerId) {
        toast({
          title: "Complete Enrollment First",
          description: "Please complete your swimmer enrollment to finalize waivers",
        });
        navigate("/");
        return;
      }

      // Update the swimmer record with signatures
      const { error } = await supabase
        .from("swimmers")
        .update({
          photo_release: formData.photoVideoPermission === "yes",
          photo_video_signature: formData.photoVideoSignature,
          liability_waiver_signature: formData.liabilityWaiverSignature,
          cancellation_policy_signature: formData.cancellationPolicySignature,
        })
        .eq("id", targetSwimmerId);

      if (error) throw error;

      toast({
        title: "Waivers Completed",
        description: "Thank you for completing all required waivers",
      });

      navigate("/");
    } catch (error) {
      console.error("Error saving waivers:", error);
      toast({
        title: "Error",
        description: "Failed to save waivers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Required Waivers</h1>
          <p className="text-muted-foreground">
            Please complete all required waivers before accessing your account
          </p>
        </div>

        {/* Photo/Video Permission */}
        <Card>
          <CardHeader>
            <CardTitle>Photo & Video Permission</CardTitle>
            <CardDescription>Media release authorization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photoVideoPermission">
                Do you give permission for I CAN SWIM, LLC to use photos or videos of your swimmer
                for promotional or educational purposes (e.g., social media, website, flyers)?
              </Label>
              <Select
                value={formData.photoVideoPermission}
                onValueChange={(value) =>
                  setFormData({ ...formData, photoVideoPermission: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoVideoSignature">Parent/Guardian Signature *</Label>
              <Input
                id="photoVideoSignature"
                placeholder="Type your full name to sign"
                value={formData.photoVideoSignature}
                onChange={(e) =>
                  setFormData({ ...formData, photoVideoSignature: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Liability Waiver */}
        <Card>
          <CardHeader>
            <CardTitle>Liability Waiver</CardTitle>
            <CardDescription>Required legal agreement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="liabilityWaiverAgreed"
                  checked={formData.liabilityWaiverAgreed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, liabilityWaiverAgreed: checked as boolean })
                  }
                />
                <Label htmlFor="liabilityWaiverAgreed" className="font-normal">
                  I have read and agree to the full{" "}
                  <button
                    type="button"
                    onClick={() => setLiabilityModalOpen(true)}
                    className="text-primary underline hover:text-primary/80"
                  >
                    Waiver and Release of Liability
                  </button>
                  . *
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="liabilityWaiverSignature">Parent/Guardian Signature *</Label>
                <Input
                  id="liabilityWaiverSignature"
                  placeholder="Type your full name to sign"
                  value={formData.liabilityWaiverSignature}
                  onChange={(e) =>
                    setFormData({ ...formData, liabilityWaiverSignature: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Cancellation Policy Agreement</CardTitle>
            <CardDescription>Required policy acknowledgment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cancellationPolicyAgreed"
                  checked={formData.cancellationPolicyAgreed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, cancellationPolicyAgreed: checked as boolean })
                  }
                />
                <Label htmlFor="cancellationPolicyAgreed" className="font-normal">
                  I have read and agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setCancellationModalOpen(true)}
                    className="text-primary underline hover:text-primary/80"
                  >
                    Cancellation Policy
                  </button>
                  . *
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellationPolicySignature">Parent/Guardian Signature *</Label>
                <Input
                  id="cancellationPolicySignature"
                  placeholder="Type your full name to sign"
                  value={formData.cancellationPolicySignature}
                  onChange={(e) =>
                    setFormData({ ...formData, cancellationPolicySignature: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete & Continue"
            )}
          </Button>
        </div>

        <LiabilityWaiverModal open={liabilityModalOpen} onOpenChange={setLiabilityModalOpen} />
        <CancellationPolicyAgreementModal
          open={cancellationModalOpen}
          onOpenChange={setCancellationModalOpen}
        />
      </div>
    </div>
  );
}
