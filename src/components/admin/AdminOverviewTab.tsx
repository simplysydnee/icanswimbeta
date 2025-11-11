import { useState } from "react";
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
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { useSwimmersQuery, Swimmer } from "@/hooks/useSwimmersQuery";
import { useSessionsQuery, Session } from "@/hooks/useSessionsQuery";
import { AdminKPICards } from "./AdminKPICards";

interface AdminOverviewTabProps {
  onApproveSwimmer: (swimmer: Swimmer) => void;
  onDeclineSwimmer: (swimmer: Swimmer) => void;
  onViewSwimmer: (swimmerId: string) => void;
}

export const AdminOverviewTab = ({
  onApproveSwimmer,
  onDeclineSwimmer,
  onViewSwimmer,
}: AdminOverviewTabProps) => {
  const { data: swimmers = [], isLoading: swimmersLoading } = useSwimmersQuery();
  const { data: sessions = [], isLoading: sessionsLoading } = useSessionsQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("waitlist");
  const [sessionTab, setSessionTab] = useState("upcoming");

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

    return filtered;
  };

  const filterSessions = () => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let filtered = sessions;

    switch (sessionTab) {
      case "upcoming":
        filtered = filtered.filter((s) => new Date(s.start_time) >= now);
        break;
      case "booked":
        filtered = sessions.filter((s) => {
          return s.bookings?.some(
            (b) =>
              b.status === "confirmed" &&
              new Date(b.created_at) >= sevenDaysAgo
          );
        });
        break;
      case "canceled":
        filtered = sessions.filter((s) => {
          return s.bookings?.some(
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

  const filteredSwimmers = filterSwimmers();
  const filteredSessions = filterSessions();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards */}
      <AdminKPICards />

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
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
              <TabsTrigger value="waitlist" className="text-xs sm:text-sm">Waitlist</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending</TabsTrigger>
              <TabsTrigger value="awaiting" className="text-xs sm:text-sm">Awaiting</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs sm:text-sm">Approved</TabsTrigger>
              <TabsTrigger value="declined" className="text-xs sm:text-sm">Declined</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden md:table-cell">Parent</TableHead>
                      <TableHead>Swimmer</TableHead>
                      <TableHead className="hidden sm:table-cell">Client Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Date Added</TableHead>
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
                          <TableCell className="hidden md:table-cell">
                            <div>
                              <div className="font-medium">{swimmer.profiles?.full_name || "N/A"}</div>
                              <div className="text-sm text-muted-foreground">
                                {swimmer.profiles?.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{swimmer.first_name} {swimmer.last_name}</div>
                              <div className="text-xs text-muted-foreground md:hidden mt-1">
                                {swimmer.profiles?.full_name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{getClientTypeBadge(swimmer.payment_type)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(swimmer.enrollment_status)}
                              {swimmer.approval_status !== "pending" &&
                                getStatusBadge(swimmer.approval_status)}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{format(new Date(swimmer.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onViewSwimmer(swimmer.id)}
                                className="h-8 w-8 p-0 sm:w-auto sm:px-2"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {activeTab === "awaiting" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => onApproveSwimmer(swimmer)}
                                    className="h-8 px-2 text-xs"
                                  >
                                    <CheckCircle className="h-3 w-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Approve</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => onDeclineSwimmer(swimmer)}
                                    className="h-8 px-2 text-xs"
                                  >
                                    <XCircle className="h-3 w-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Decline</span>
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
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="upcoming" className="text-xs sm:text-sm">Upcoming</TabsTrigger>
              <TabsTrigger value="booked" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Booked (Last 7d)</span>
                <span className="sm:hidden">Booked</span>
              </TabsTrigger>
              <TabsTrigger value="canceled" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Canceled (Last 7d)</span>
                <span className="sm:hidden">Canceled</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={sessionTab} className="mt-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Swimmer</TableHead>
                      <TableHead className="hidden md:table-cell">Parent</TableHead>
                      <TableHead className="hidden lg:table-cell">Instructor</TableHead>
                      <TableHead className="hidden sm:table-cell">Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No sessions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSessions.map((session) =>
                        session.bookings?.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div className="text-sm">
                                <div>{format(new Date(session.start_time), "MMM d, yyyy")}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(session.start_time), "h:mm a")}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">
                                  {booking.swimmers?.first_name} {booking.swimmers?.last_name}
                                </div>
                                <div className="text-xs text-muted-foreground md:hidden mt-1">
                                  {booking.profiles?.full_name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{booking.profiles?.full_name}</TableCell>
                            <TableCell className="hidden lg:table-cell">{session.profiles?.full_name || "N/A"}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <span className="text-xs">{session.session_type}</span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={booking.status === "confirmed" ? "default" : "destructive"}
                                className="text-xs"
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
    </div>
  );
};
