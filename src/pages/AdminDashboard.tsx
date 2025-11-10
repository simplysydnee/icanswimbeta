import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Calendar, Users, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { format } from "date-fns";
import { POSManagement } from "@/components/admin/POSManagement";
import { SwimmerDetailDrawer } from "@/components/admin/SwimmerDetailDrawer";
import { UserManagement } from "@/components/admin/UserManagement";
import { InstructorNotificationBell } from "@/components/InstructorNotificationBell";

interface Swimmer {
  id: string;
  first_name: string;
  last_name: string;
  payment_type: string;
  enrollment_status: string;
  approval_status: string;
  parent_id: string;
  created_at: string;
  current_level_id: string | null;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface Session {
  id: string;
  start_time: string;
  end_time: string;
  session_type: string;
  status: string;
  bookings: Array<{
    id: string;
    status: string;
    canceled_at: string | null;
    cancel_reason: string | null;
    cancel_source: string | null;
    swimmer_id: string;
    parent_id: string;
    created_at: string;
    swimmers: {
      first_name: string;
      last_name: string;
    };
    profiles: {
      full_name: string;
    };
  }>;
  instructor_profile?: {
    full_name: string;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userRole, loading: roleLoading } = useUserRole();
  const [kpis, setKpis] = useState({
    waitlist: 0,
    pendingEnrollment: 0,
    awaitingApproval: 0,
    approved: 0,
    declined: 0,
    sessionsBooked: 0,
    sessionsCanceled: 0,
  });
  
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSwimmers, setFilteredSwimmers] = useState<Swimmer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSwimmer, setSelectedSwimmer] = useState<Swimmer | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [activeTab, setActiveTab] = useState("waitlist");
  const [sessionTab, setSessionTab] = useState("upcoming");
  const [mainTab, setMainTab] = useState("overview");
  const [selectedSwimmerForDetail, setSelectedSwimmerForDetail] = useState<string | null>(null);
  const [showSwimmerDrawer, setShowSwimmerDrawer] = useState(false);

  useEffect(() => {
    if (!roleLoading && userRole !== "admin") {
      navigate("/");
    }
  }, [userRole, roleLoading, navigate]);

  useEffect(() => {
    fetchKPIs();
    fetchSwimmers();
    fetchSessions();
  }, []);

  useEffect(() => {
    filterSwimmers();
  }, [searchTerm, activeTab, swimmers]);

  const fetchKPIs = async () => {
    try {
      // Fetch counts for each status
      const { data: waitlistData } = await supabase
        .from("swimmers")
        .select("id", { count: "exact", head: true })
        .eq("enrollment_status", "waitlist");

      const { data: pendingData } = await supabase
        .from("swimmers")
        .select("id", { count: "exact", head: true })
        .eq("enrollment_status", "pending_enrollment");

      const { data: awaitingData } = await supabase
        .from("swimmers")
        .select("id", { count: "exact", head: true })
        .eq("enrollment_status", "enrolled")
        .eq("approval_status", "pending");

      const { data: approvedData } = await supabase
        .from("swimmers")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", "approved");

      const { data: declinedData } = await supabase
        .from("swimmers")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", "declined");

      // Fetch sessions booked in next 7 days
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const { data: upcomingBookings } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed")
        .gte("created_at", new Date().toISOString())
        .lte("created_at", sevenDaysFromNow.toISOString());

      // Fetch sessions canceled in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: canceledBookings } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "cancelled")
        .gte("canceled_at", sevenDaysAgo.toISOString());

      setKpis({
        waitlist: waitlistData?.length || 0,
        pendingEnrollment: pendingData?.length || 0,
        awaitingApproval: awaitingData?.length || 0,
        approved: approvedData?.length || 0,
        declined: declinedData?.length || 0,
        sessionsBooked: upcomingBookings?.length || 0,
        sessionsCanceled: canceledBookings?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching KPIs:", error);
    }
  };

  const fetchSwimmers = async () => {
    try {
      const { data, error } = await supabase
        .from("swimmers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch parent profiles separately
      const enrichedData = await Promise.all(
        (data || []).map(async (swimmer: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", swimmer.parent_id)
            .single();

          return {
            ...swimmer,
            profiles: profile,
          };
        })
      );
      
      setSwimmers(enrichedData);
    } catch (error) {
      console.error("Error fetching swimmers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch swimmers",
        variant: "destructive",
      });
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          bookings (
            id,
            status,
            swimmer_id,
            parent_id,
            created_at,
            canceled_at,
            cancel_reason,
            cancel_source
          )
        `)
        .order("start_time", { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Enrich sessions with related data
      const enrichedSessions = await Promise.all(
        (data || []).map(async (session: any) => {
          // Fetch instructor profile
          const instructorProfile = session.instructor_id
            ? await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", session.instructor_id)
                .single()
            : { data: null };

          // Enrich each booking with swimmer and parent info
          const enrichedBookings = await Promise.all(
            (session.bookings || []).map(async (booking: any) => {
              const [swimmerResult, parentResult] = await Promise.all([
                supabase
                  .from("swimmers")
                  .select("first_name, last_name")
                  .eq("id", booking.swimmer_id)
                  .single(),
                supabase
                  .from("profiles")
                  .select("full_name")
                  .eq("id", booking.parent_id)
                  .single(),
              ]);

              return {
                ...booking,
                swimmers: swimmerResult.data,
                profiles: parentResult.data,
              };
            })
          );

          return {
            ...session,
            instructor_profile: instructorProfile.data,
            bookings: enrichedBookings,
          };
        })
      );
      
      setSessions(enrichedSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const filterSwimmers = () => {
    let filtered = swimmers;

    // Filter by tab
    switch (activeTab) {
      case "waitlist":
        filtered = filtered.filter((s) => s.enrollment_status === "waitlist");
        break;
      case "pending":
        filtered = filtered.filter((s) => s.enrollment_status === "pending_enrollment");
        break;
      case "awaiting":
        filtered = filtered.filter(
          (s) => s.enrollment_status === "enrolled" && s.approval_status === "pending"
        );
        break;
      case "approved":
        filtered = filtered.filter((s) => s.approval_status === "approved");
        break;
      case "declined":
        filtered = filtered.filter((s) => s.approval_status === "declined");
        break;
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSwimmers(filtered);
  };

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
      fetchKPIs();
      fetchSwimmers();
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
      fetchKPIs();
      fetchSwimmers();
    } catch (error) {
      console.error("Error declining swimmer:", error);
      toast({
        title: "Error",
        description: "Failed to decline swimmer",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      waitlist: "outline",
      pending_enrollment: "secondary",
      pending: "secondary",
      approved: "default",
      declined: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status.replace("_", " ")}</Badge>;
  };

  const getClientTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "vmrc" ? "secondary" : "outline"}>
        {type === "vmrc" ? "VMRC" : "Private Pay"}
      </Badge>
    );
  };

  const filterSessions = () => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    let filtered = sessions;

    switch (sessionTab) {
      case "upcoming":
        filtered = filtered.filter((s) => new Date(s.start_time) >= now);
        break;
      case "booked":
        filtered = sessions.filter((s) => {
          return s.bookings.some(
            (b) =>
              b.status === "confirmed" &&
              new Date(b.created_at) >= sevenDaysAgo
          );
        });
        break;
      case "canceled":
        filtered = sessions.filter((s) => {
          return s.bookings.some(
            (b) =>
              b.status === "cancelled" &&
              b.canceled_at &&
              new Date(b.canceled_at) >= sevenDaysAgo
          );
        });
        break;
    }

    return filtered;
  };

  if (roleLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (userRole !== "admin") {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <InstructorNotificationBell />
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
          <TabsTrigger value="swimmers">Swimmers</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waitlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.waitlist}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Enrollment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pendingEnrollment}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Awaiting Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{kpis.awaitingApproval}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Declined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpis.declined}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Booked (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.sessionsBooked}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              Canceled (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.sessionsCanceled}</div>
          </CardContent>
          </Card>
          </div>

          {/* Clients Section */}
          <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Search by name or parent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
              <TabsTrigger value="pending">Pending Enrollment</TabsTrigger>
              <TabsTrigger value="awaiting">Awaiting Approval</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="declined">Declined</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parent</TableHead>
                      <TableHead>Swimmer</TableHead>
                      <TableHead>Client Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSwimmers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No swimmers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSwimmers.map((swimmer) => (
                        <TableRow key={swimmer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{swimmer.profiles?.full_name || "N/A"}</div>
                              <div className="text-sm text-muted-foreground">
                                {swimmer.profiles?.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {swimmer.first_name} {swimmer.last_name}
                          </TableCell>
                          <TableCell>{getClientTypeBadge(swimmer.payment_type)}</TableCell>
                          <TableCell>
                            {getStatusBadge(swimmer.enrollment_status)}
                            {swimmer.approval_status !== "pending" &&
                              getStatusBadge(swimmer.approval_status)}
                          </TableCell>
                          <TableCell>{format(new Date(swimmer.created_at), "MMM d, yyyy")}</TableCell>
                           <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSwimmerForDetail(swimmer.id);
                                  setShowSwimmerDrawer(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {activeTab === "awaiting" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSwimmer(swimmer);
                                      setShowApproveDialog(true);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedSwimmer(swimmer);
                                      setShowDeclineDialog(true);
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Decline
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            </Tabs>
          </CardContent>
          </Card>

          {/* Sessions Section */}
          <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={sessionTab} onValueChange={setSessionTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="booked">Booked (Last 7d)</TabsTrigger>
              <TabsTrigger value="canceled">Canceled (Last 7d)</TabsTrigger>
            </TabsList>

            <TabsContent value={sessionTab} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Swimmer</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterSessions().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No sessions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filterSessions().map((session) =>
                        session.bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              {format(new Date(session.start_time), "MMM d, yyyy h:mm a")}
                            </TableCell>
                            <TableCell>
                              {booking.swimmers.first_name} {booking.swimmers.last_name}
                            </TableCell>
                            <TableCell>{booking.profiles?.full_name}</TableCell>
                            <TableCell>{session.instructor_profile?.full_name || "N/A"}</TableCell>
                            <TableCell>{session.session_type}</TableCell>
                            <TableCell>
                              <Badge
                                variant={booking.status === "confirmed" ? "default" : "destructive"}
                              >
                                {booking.status}
                              </Badge>
                              {booking.canceled_at && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {booking.cancel_source} - {booking.cancel_reason}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            </Tabs>
          </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pos">
          <POSManagement />
        </TabsContent>

        <TabsContent value="swimmers">
          <Card>
            <CardHeader>
              <CardTitle>All Swimmers</CardTitle>
              <Input
                placeholder="Search swimmers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-4"
              />
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {swimmers
                      .filter(
                        (s) =>
                          !searchTerm ||
                          s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((swimmer) => (
                        <TableRow key={swimmer.id}>
                          <TableCell>
                            {swimmer.first_name} {swimmer.last_name}
                          </TableCell>
                          <TableCell>{swimmer.profiles?.full_name || "N/A"}</TableCell>
                          <TableCell>{getClientTypeBadge(swimmer.payment_type)}</TableCell>
                          <TableCell>{getStatusBadge(swimmer.enrollment_status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {swimmer.current_level_id ? "Assigned" : "Not Set"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSwimmerForDetail(swimmer.id);
                                setShowSwimmerDrawer(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>

      <SwimmerDetailDrawer
        swimmerId={selectedSwimmerForDetail}
        open={showSwimmerDrawer}
        onOpenChange={setShowSwimmerDrawer}
        onUpdate={() => {
          fetchSwimmers();
          fetchKPIs();
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