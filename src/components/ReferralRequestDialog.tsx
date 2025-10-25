import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Heart, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReferralRequestDialogProps {
  trigger?: React.ReactNode;
}

export const ReferralRequestDialog = ({ trigger }: ReferralRequestDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    childName: "",
    childAge: "",
    referralType: "",
    coordinatorName: "",
    coordinatorEmail: "",
    additionalInfo: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-referral-request', {
        body: formData,
      });

      if (error) throw error;
      
      toast({
        title: "Referral Request Submitted! 📧",
        description: "Your coordinator will review your request and contact you within 24-48 hours.",
      });

      // Reset form and close dialog
      setFormData({
        parentName: "",
        parentEmail: "",
        parentPhone: "",
        childName: "",
        childAge: "",
        referralType: "",
        coordinatorName: "",
        coordinatorEmail: "",
        additionalInfo: "",
      });
      setOpen(false);
    } catch (error) {
      console.error("Referral request error:", error);
      toast({
        title: "Error",
        description: "Failed to submit referral request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" variant="outline">
            <Heart className="mr-2 h-5 w-5" />
            Request VMRC Referral
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Swim Lesson Referral</DialogTitle>
          <DialogDescription>
            If you're a VMRC client or referred by a coordinator, complete this form to begin the enrollment process.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parent Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Parent/Guardian Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent/Guardian Name *</Label>
              <Input
                id="parentName"
                required
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Email Address *</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  required
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentPhone">Phone Number *</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  required
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Child Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Child Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="childName">Child's Name *</Label>
                <Input
                  id="childName"
                  required
                  value={formData.childName}
                  onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                  placeholder="Child's full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="childAge">Child's Age *</Label>
                <Input
                  id="childAge"
                  type="number"
                  min={1}
                  max={18}
                  required
                  value={formData.childAge}
                  onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                  placeholder="Age in years"
                />
              </div>
            </div>
          </div>

          {/* Referral Type */}
          <div className="space-y-2">
            <Label htmlFor="referralType">Referral Type *</Label>
            <Select
              value={formData.referralType}
              onValueChange={(value) => setFormData({ ...formData, referralType: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select referral type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vmrc">VMRC Client</SelectItem>
                <SelectItem value="scholarship">Scholarship Applicant</SelectItem>
                <SelectItem value="coordinator">Coordinator Referral</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Coordinator Information */}
          {formData.referralType === "vmrc" && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-sm">VMRC Coordinator Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="coordinatorName">Coordinator Name *</Label>
                <Input
                  id="coordinatorName"
                  required={formData.referralType === "vmrc"}
                  value={formData.coordinatorName}
                  onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                  placeholder="Your VMRC coordinator's name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coordinatorEmail">Coordinator Email *</Label>
                <Input
                  id="coordinatorEmail"
                  type="email"
                  required={formData.referralType === "vmrc"}
                  value={formData.coordinatorEmail}
                  onChange={(e) => setFormData({ ...formData, coordinatorEmail: e.target.value })}
                  placeholder="coordinator@example.com"
                />
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional Information</Label>
            <Textarea
              id="additionalInfo"
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              placeholder="Any additional details about your child's needs, goals, or special considerations..."
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
