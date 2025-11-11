import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { POSManagement } from "@/components/admin/POSManagement";
import { SwimmerDetailDrawer } from "@/components/admin/SwimmerDetailDrawer";
import { UserManagement } from "@/components/admin/UserManagement";
import { InstructorNotificationBell } from "@/components/InstructorNotificationBell";
import { LogoutButton } from "@/components/LogoutButton";
import logoHeader from "@/assets/logo-header.png";
import AdminSchedule from "./AdminSchedule";
import { SetupDemoData } from "@/components/admin/SetupDemoData";
import { useAdminKPIs } from "@/hooks/useAdminKPIs";
import { useSwimmers, Swimmer } from "@/hooks/useSwimmers";
import { useSessions } from "@/hooks/useSessions";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminBookingsRevenueTab } from "@/components/admin/AdminBookingsRevenueTab";
import { AdminSwimmersTab } from "@/components/admin/AdminSwimmersTab";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userRole, loading: roleLoading } = useUserRole();
  const { kpis, loading: kpisLoading, refetch: refetchKpis } = useAdminKPIs();
  const { swimmers, loading: swimmersLoading, refetch: refetchSwimmers } = useSwimmers();
  const { sessions, loading: sessionsLoading } = useSessions();
  
  const [selectedSwimmer, setSelectedSwimmer] = useState<Swimmer | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [mainTab, setMainTab] = useState("overview");
  const [selectedSwimmerForDetail, setSelectedSwimmerForDetail] = useState<string | null>(null);
  const [showSwimmerDrawer, setShowSwimmerDrawer] = useState(false);

  useEffect(() => {
    if (!roleLoading && userRole !== "admin") {
      navigate("/");
    }
  }, [userRole, roleLoading, navigate]);

  const handleApprove = async () => {
    if (!selectedSwimmer) return;

    try {
      const { error } = await supabase
        .from("swimmers")
        .update({
          approval_status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", selectedSwimmer.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Swimmer approved successfully",
      });

      setShowApproveDialog(false);
      refetchKpis();
      refetchSwimmers();
    } catch (error) {
      console.error("Error approving swimmer:", error);
      toast({
        title: "Error",
        description: "Failed to approve swimmer",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async () => {
    if (!selectedSwimmer || !declineReason) {
      toast({
        title: "Error",
        description: "Please provide a reason for declining",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("swimmers")
        .update({
          approval_status: "declined",
          declined_at: new Date().toISOString(),
          declined_by: (await supabase.auth.getUser()).data.user?.id,
          decline_reason: declineReason,
        })
        .eq("id", selectedSwimmer.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Swimmer declined",
      });

      setShowDeclineDialog(false);
      setDeclineReason("");
      refetchKpis();
      refetchSwimmers();
    } catch (error) {
      console.error("Error declining swimmer:", error);
      toast({
        title: "Error",
        description: "Failed to decline swimmer",
        variant: "destructive",
      });
    }
  };

  if (roleLoading || kpisLoading || swimmersLoading || sessionsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (userRole !== "admin") {
    return null;
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="mb-2 sm:mb-4 flex items-center justify-between">
        <img 
          src={logoHeader} 
          alt="I CAN SWIM" 
          className="h-10 sm:h-12 w-auto object-contain"
        />
        <LogoutButton />
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        <InstructorNotificationBell />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-4">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Overview</TabsTrigger>
          <TabsTrigger value="bookings-revenue" className="text-xs sm:text-sm py-2">Bookings + Revenue</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs sm:text-sm py-2">Schedule</TabsTrigger>
          <TabsTrigger value="pos" className="text-xs sm:text-sm py-2">Purchase Orders</TabsTrigger>
          <TabsTrigger value="swimmers" className="text-xs sm:text-sm py-2">Swimmers</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm py-2">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminOverviewTab
            onApproveSwimmer={(swimmer) => {
              setSelectedSwimmer(swimmer);
              setShowApproveDialog(true);
            }}
            onDeclineSwimmer={(swimmer) => {
              setSelectedSwimmer(swimmer);
              setShowDeclineDialog(true);
            }}
            onViewSwimmer={(swimmerId) => {
              setSelectedSwimmerForDetail(swimmerId);
              setShowSwimmerDrawer(true);
            }}
          />
        </TabsContent>

        <TabsContent value="bookings-revenue">
          <AdminBookingsRevenueTab />
        </TabsContent>

        <TabsContent value="schedule">
          <AdminSchedule />
        </TabsContent>

        <TabsContent value="pos">
          <POSManagement />
        </TabsContent>

        <TabsContent value="swimmers">
          <AdminSwimmersTab
            onViewSwimmer={(swimmerId) => {
              setSelectedSwimmerForDetail(swimmerId);
              setShowSwimmerDrawer(true);
            }}
          />
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-6">
            <SetupDemoData />
            <UserManagement />
          </div>
        </TabsContent>
      </Tabs>

      <SwimmerDetailDrawer
        swimmerId={selectedSwimmerForDetail}
        open={showSwimmerDrawer}
        onOpenChange={setShowSwimmerDrawer}
        onUpdate={() => {
          refetchSwimmers();
          refetchKpis();
        }}
      />

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Swimmer</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {selectedSwimmer?.first_name}{" "}
              {selectedSwimmer?.last_name}? This will allow them to book sessions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Swimmer</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining {selectedSwimmer?.first_name}{" "}
              {selectedSwimmer?.last_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter reason for declining..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDecline}>
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
