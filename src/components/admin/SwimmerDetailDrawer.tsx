import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SwimmerDetailDrawerProps {
  swimmerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export const SwimmerDetailDrawer = ({
  swimmerId,
  open,
  onOpenChange,
  onUpdate,
}: SwimmerDetailDrawerProps) => {
  const [swimmer, setSwimmer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [swimLevels, setSwimLevels] = useState<any[]>([]);

  useEffect(() => {
    if (swimmerId && open) {
      fetchSwimmer();
      fetchSwimLevels();
    }
  }, [swimmerId, open]);

  const fetchSwimmer = async () => {
    if (!swimmerId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("swimmers")
        .select(`
          *,
          parent_profile:profiles!swimmers_parent_id_fkey (
            full_name,
            email,
            phone
          ),
          current_level:swim_levels!swimmers_current_level_id_fkey (
            display_name
          )
        `)
        .eq("id", swimmerId)
        .single();

      if (error) throw error;
      setSwimmer(data);
    } catch (error) {
      console.error("Error fetching swimmer:", error);
      toast({
        title: "Error",
        description: "Failed to fetch swimmer details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSwimLevels = async () => {
    try {
      const { data, error } = await supabase
        .from("swim_levels")
        .select("*")
        .order("sequence");

      if (error) throw error;
      setSwimLevels(data || []);
    } catch (error) {
      console.error("Error fetching swim levels:", error);
    }
  };

  const handleUpdate = async () => {
    if (!swimmer) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("swimmers")
        .update({
          first_name: swimmer.first_name,
          last_name: swimmer.last_name,
          date_of_birth: swimmer.date_of_birth,
          gender: swimmer.gender,
          current_level_id: swimmer.current_level_id,
          enrollment_status: swimmer.enrollment_status,
          approval_status: swimmer.approval_status,
          payment_type: swimmer.payment_type,
          is_vmrc_client: swimmer.is_vmrc_client,
          flexible_swimmer: swimmer.flexible_swimmer,
          client_booking_limit: swimmer.client_booking_limit,
          goals: swimmer.goals,
          strengths_interests: swimmer.strengths_interests,
          has_allergies: swimmer.has_allergies,
          allergies_description: swimmer.allergies_description,
          has_medical_conditions: swimmer.has_medical_conditions,
          medical_conditions_description: swimmer.medical_conditions_description,
          toilet_trained: swimmer.toilet_trained,
          non_ambulatory: swimmer.non_ambulatory,
        })
        .eq("id", swimmer.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Swimmer details updated successfully",
      });

      onUpdate?.();
    } catch (error) {
      console.error("Error updating swimmer:", error);
      toast({
        title: "Error",
        description: "Failed to update swimmer details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!swimmer) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>
            {swimmer.first_name} {swimmer.last_name}
          </SheetTitle>
          <div className="flex gap-2 mt-2">
            <Badge>{swimmer.payment_type === "vmrc" ? "VMRC" : "Private Pay"}</Badge>
            <Badge variant="outline">{swimmer.enrollment_status}</Badge>
            {swimmer.flexible_swimmer && (
              <Badge variant="secondary">Flexible Swimmer</Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="basic" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={swimmer.first_name}
                    onChange={(e) =>
                      setSwimmer({ ...swimmer, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={swimmer.last_name}
                    onChange={(e) =>
                      setSwimmer({ ...swimmer, last_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={swimmer.date_of_birth}
                  onChange={(e) =>
                    setSwimmer({ ...swimmer, date_of_birth: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={swimmer.gender || ""}
                  onValueChange={(value) =>
                    setSwimmer({ ...swimmer, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Current Level</Label>
                <Select
                  value={swimmer.current_level_id || ""}
                  onValueChange={(value) =>
                    setSwimmer({ ...swimmer, current_level_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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

              <div className="space-y-2">
                <Label>Goals</Label>
                <Textarea
                  value={swimmer.goals || ""}
                  onChange={(e) =>
                    setSwimmer({ ...swimmer, goals: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Strengths & Interests</Label>
                <Textarea
                  value={swimmer.strengths_interests || ""}
                  onChange={(e) =>
                    setSwimmer({
                      ...swimmer,
                      strengths_interests: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="medical" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Has Allergies</Label>
                <Switch
                  checked={swimmer.has_allergies}
                  onCheckedChange={(checked) =>
                    setSwimmer({ ...swimmer, has_allergies: checked })
                  }
                />
              </div>

              {swimmer.has_allergies && (
                <div className="space-y-2">
                  <Label>Allergy Details</Label>
                  <Textarea
                    value={swimmer.allergies_description || ""}
                    onChange={(e) =>
                      setSwimmer({
                        ...swimmer,
                        allergies_description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Has Medical Conditions</Label>
                <Switch
                  checked={swimmer.has_medical_conditions}
                  onCheckedChange={(checked) =>
                    setSwimmer({ ...swimmer, has_medical_conditions: checked })
                  }
                />
              </div>

              {swimmer.has_medical_conditions && (
                <div className="space-y-2">
                  <Label>Medical Condition Details</Label>
                  <Textarea
                    value={swimmer.medical_conditions_description || ""}
                    onChange={(e) =>
                      setSwimmer({
                        ...swimmer,
                        medical_conditions_description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Toilet Trained</Label>
                <Switch
                  checked={swimmer.toilet_trained}
                  onCheckedChange={(checked) =>
                    setSwimmer({ ...swimmer, toilet_trained: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Non-Ambulatory</Label>
                <Switch
                  checked={swimmer.non_ambulatory}
                  onCheckedChange={(checked) =>
                    setSwimmer({ ...swimmer, non_ambulatory: checked })
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Enrollment Status</Label>
                <Select
                  value={swimmer.enrollment_status}
                  onValueChange={(value) =>
                    setSwimmer({ ...swimmer, enrollment_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waitlist">Waitlist</SelectItem>
                    <SelectItem value="pending_enrollment">Pending Enrollment</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Approval Status</Label>
                <Select
                  value={swimmer.approval_status}
                  onValueChange={(value) =>
                    setSwimmer({ ...swimmer, approval_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select
                  value={swimmer.payment_type}
                  onValueChange={(value) =>
                    setSwimmer({ ...swimmer, payment_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private_pay">Private Pay</SelectItem>
                    <SelectItem value="vmrc">VMRC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>VMRC Client</Label>
                <Switch
                  checked={swimmer.is_vmrc_client}
                  onCheckedChange={(checked) =>
                    setSwimmer({ ...swimmer, is_vmrc_client: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Flexible Swimmer</Label>
                <Switch
                  checked={swimmer.flexible_swimmer}
                  onCheckedChange={(checked) =>
                    setSwimmer({ ...swimmer, flexible_swimmer: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Booking Limit</Label>
                <Input
                  type="number"
                  value={swimmer.client_booking_limit || 4}
                  onChange={(e) =>
                    setSwimmer({
                      ...swimmer,
                      client_booking_limit: parseInt(e.target.value) || 4,
                    })
                  }
                />
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Parent Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name: </span>
                    {swimmer.parent_profile?.full_name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    {swimmer.parent_profile?.email}
                  </div>
                  {swimmer.parent_profile?.phone && (
                    <div>
                      <span className="text-muted-foreground">Phone: </span>
                      {swimmer.parent_profile.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleUpdate} disabled={loading} className="flex-1">
            Save Changes
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
