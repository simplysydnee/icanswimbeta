import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Plus, Filter, X, Edit, FileText, UserX } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, addDays, isSameDay, parseISO, startOfMonth, endOfMonth, addMonths, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { SwimmersNeedingUpdate } from "@/components/SwimmersNeedingUpdate";
import { UpdateProgressDrawer } from "@/components/admin/UpdateProgressDrawer";
import { InstructorNotificationBell } from "@/components/InstructorNotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoHeader from "@/assets/logo-header.png";

interface Session {
  id: string;
  start_time: string;
  end_time: string;
  session_type: string;
  session_type_detail: string | null;
  location: string;
  status: string;
  instructor: {
    id: string;
    full_name: string;
  } | null;
  bookings: Array<{
    id: string;
    status: string;
    swimmer: {
      id: string;
      first_name: string;
      last_name: string;
      parent_id: string;
      payment_type: string;
      is_vmrc_client: boolean;
      vmrc_sessions_used: number;
      vmrc_sessions_authorized: number;
    };
  }>;
}

const INSTRUCTOR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-indigo-500",
];

const AdminSchedule = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [instructorColorMap, setInstructorColorMap] = useState<Record<string, string>>({});
  
  // Filters
  const [selectedInstructor, setSelectedInstructor] = useState<string>("all");
  const [selectedSessionType, setSelectedSessionType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showVmrcOnly, setShowVmrcOnly] = useState(false);
  const [searchSwimmer, setSearchSwimmer] = useState("");

  // Update Progress Drawer
  const [progressDrawerOpen, setProgressDrawerOpen] = useState(false);
  const [selectedSwimmer, setSelectedSwimmer] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchSessions();
    }
  }, [currentWeek, selectedDate, currentMonth, userRole]);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(user.id);

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setUserRole(roleData.role);
    } catch (error) {
      console.error("Error fetching user role:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user role",
        variant: "destructive",
      });
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });

      let query = supabase
        .from("sessions")
        .select(`
          id,
          start_time,
          end_time,
          session_type,
          session_type_detail,
          location,
          status,
          instructor_id,
          profiles!sessions_instructor_id_fkey (
            id,
            full_name
          ),
          bookings (
            id,
            status,
            swimmer_id,
            swimmers (
              id,
              first_name,
              last_name,
              parent_id,
              payment_type,
              is_vmrc_client,
              vmrc_sessions_used,
              vmrc_sessions_authorized
            )
          )
        `)
        .gte("start_time", weekStart.toISOString())
        .lte("start_time", weekEnd.toISOString())
        .in("status", ["available", "draft"])
        .order("start_time");

      // If user is an instructor, only show their sessions
      if (userRole === "instructor" && currentUserId) {
        query = query.eq("instructor_id", currentUserId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data
      const transformedSessions: Session[] = (data || []).map((session: any) => ({
        id: session.id,
        start_time: session.start_time,
        end_time: session.end_time,
        session_type: session.session_type,
        session_type_detail: session.session_type_detail,
        location: session.location,
        status: session.status,
        instructor: session.profiles ? {
          id: session.profiles.id,
          full_name: session.profiles.full_name,
        } : null,
        bookings: (session.bookings || []).map((booking: any) => ({
          id: booking.id,
          status: booking.status,
          swimmer: {
            id: booking.swimmers.id,
            first_name: booking.swimmers.first_name,
            last_name: booking.swimmers.last_name,
            parent_id: booking.swimmers.parent_id,
            payment_type: booking.swimmers.payment_type,
            is_vmrc_client: booking.swimmers.is_vmrc_client || false,
            vmrc_sessions_used: booking.swimmers.vmrc_sessions_used,
            vmrc_sessions_authorized: booking.swimmers.vmrc_sessions_authorized,
          },
        })),
      }));

      // Assign colors to instructors
      const instructorIds = [...new Set(transformedSessions.map(s => s.instructor?.id).filter(Boolean))];
      const colorMap: Record<string, string> = {};
      instructorIds.forEach((id, index) => {
        if (id) {
          colorMap[id] = INSTRUCTOR_COLORS[index % INSTRUCTOR_COLORS.length];
        }
      });
      setInstructorColorMap(colorMap);

      setSessions(transformedSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = (swimmerId: string, sessionId: string, bookingId: string) => {
    setSelectedSwimmer(swimmerId);
    setSelectedSession(sessionId);
    setSelectedBooking(bookingId);
    setProgressDrawerOpen(true);
  };

  const getFilteredSessions = (sessionsList: Session[]) => {
    return sessionsList.filter(session => {
      // Instructor filter
      if (selectedInstructor !== "all" && session.instructor?.id !== selectedInstructor) {
        return false;
      }

      // Session type filter
      if (selectedSessionType !== "all" && session.session_type !== selectedSessionType) {
        return false;
      }

      // Status filter (booked vs open)
      if (selectedStatus === "booked" && session.bookings.length === 0) {
        return false;
      }
      if (selectedStatus === "open" && session.bookings.length > 0) {
        return false;
      }

      // VMRC filter
      if (showVmrcOnly && !session.bookings.some(b => b.swimmer.is_vmrc_client)) {
        return false;
      }

      // Swimmer search
      if (searchSwimmer.trim()) {
        const searchLower = searchSwimmer.toLowerCase();
        const hasMatchingSwimmer = session.bookings.some(b => 
          `${b.swimmer.first_name} ${b.swimmer.last_name}`.toLowerCase().includes(searchLower)
        );
        if (!hasMatchingSwimmer) {
          return false;
        }
      }

      return true;
    });
  };

  const getSessionsForDay = (date: Date) => {
    const daySessions = sessions.filter(session => 
      isSameDay(parseISO(session.start_time), date)
    );
    return getFilteredSessions(daySessions);
  };

  const renderSessionCard = (session: Session, compact: boolean = false) => {
    const needsUpdate = session.bookings.some(b => 
      b.swimmer.is_vmrc_client &&
      b.swimmer.vmrc_sessions_used >= b.swimmer.vmrc_sessions_authorized
    );
    const isBooked = session.bookings.length > 0;
    
    // Check if any VMRC swimmer is at lesson 11/12
    const hasLesson11 = session.bookings.some(b => 
      b.swimmer.is_vmrc_client && 
      b.swimmer.vmrc_sessions_used === 10 && 
      b.swimmer.vmrc_sessions_authorized === 12
    );

    return (
      <Card 
        key={session.id}
        className={cn(
          "transition-shadow",
          session.instructor?.id && instructorColorMap[session.instructor.id] 
            ? `border-l-4 ${instructorColorMap[session.instructor.id]}` 
            : "",
          needsUpdate && "border-destructive border-2",
          hasLesson11 && "border-amber-500 border-2",
          !isBooked && "bg-muted/30"
        )}
      >
        <CardContent className={cn("p-3", !compact && "space-y-3")}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>
                {format(parseISO(session.start_time), "h:mm a")} - {format(parseISO(session.end_time), "h:mm a")}
              </div>
              <div className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
                {session.instructor?.full_name || "No instructor"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {session.session_type_detail || session.session_type}
              </div>
              {hasLesson11 && (
                <Badge variant="outline" className="mt-1 text-xs bg-amber-50 text-amber-700 border-amber-300">
                  11/12 – Prepare Next POS
                </Badge>
              )}
            </div>

            {userRole === "admin" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    ⋮
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isBooked && (
                    <DropdownMenuItem 
                      onClick={() => handleUpdateProgress(
                        session.bookings[0].swimmer.id,
                        session.id,
                        session.bookings[0].id
                      )}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Update Progress
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate(`/admin/master-schedule?edit=${session.id}`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Session
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <X className="h-4 w-4 mr-2" />
                    Cancel Session
                  </DropdownMenuItem>
                  {isBooked && (
                    <DropdownMenuItem className="text-destructive">
                      <UserX className="h-4 w-4 mr-2" />
                      Mark No-show
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {session.bookings.length > 0 ? (
            <div className="space-y-1">
              {session.bookings.map(booking => {
                const swimmerNeedsUpdate = booking.swimmer.is_vmrc_client &&
                  booking.swimmer.vmrc_sessions_used >= booking.swimmer.vmrc_sessions_authorized;
                const lessonProgress = booking.swimmer.is_vmrc_client
                  ? `${booking.swimmer.vmrc_sessions_used + 1}/${booking.swimmer.vmrc_sessions_authorized}`
                  : null;
                return (
                  <div key={booking.id} className="flex items-center gap-2">
                    <Badge 
                      variant={swimmerNeedsUpdate ? "destructive" : "secondary"} 
                      className={cn(compact ? "text-xs" : "text-sm")}
                    >
                      {booking.swimmer.first_name} {booking.swimmer.last_name}
                      {swimmerNeedsUpdate && " ⚠️"}
                      {booking.swimmer.payment_type === "private_pay" && " (Private Pay)"}
                      {booking.swimmer.is_vmrc_client && lessonProgress && ` (VMRC ${lessonProgress})`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <Badge variant="outline" className="text-xs">
              Open
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const daySessions = getSessionsForDay(day);
          return (
            <div key={day.toISOString()} className="space-y-2">
              <div className="text-center font-semibold p-2 bg-muted rounded sticky top-0 z-10">
                <div className="text-sm">{format(day, "EEE")}</div>
                <div className="text-lg">{format(day, "d")}</div>
              </div>
              <div className="space-y-2 min-h-[400px]">
                {daySessions.length > 0 ? (
                  daySessions.map(session => renderSessionCard(session, true))
                ) : (
                  <p className="text-xs text-center text-muted-foreground p-4">No sessions</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const daySessions = getSessionsForDay(selectedDate).sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    return (
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading sessions...</p>
        ) : daySessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No sessions scheduled for {format(selectedDate, "MMMM d, yyyy")}
            </CardContent>
          </Card>
        ) : (
          daySessions.map(session => renderSessionCard(session, false))
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center font-semibold p-2 text-sm">
            {day}
          </div>
        ))}
        
        {/* Calendar grid */}
        {days.map(day => {
          const daySessions = getSessionsForDay(day);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] border p-2 space-y-1",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                isToday && "border-primary border-2"
              )}
            >
              <div className={cn(
                "text-sm font-medium",
                isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
              )}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {daySessions.slice(0, 3).map(session => (
                  <div
                    key={session.id}
                    className={cn(
                      "text-xs p-1 rounded truncate",
                      session.instructor?.id && instructorColorMap[session.instructor.id]
                        ? instructorColorMap[session.instructor.id].replace("bg-", "bg-opacity-20 bg-")
                        : "bg-muted"
                    )}
                  >
                    {format(parseISO(session.start_time), "h:mm a")}
                  </div>
                ))}
                {daySessions.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{daySessions.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const uniqueInstructors = Array.from(
    new Set(sessions.map(s => s.instructor).filter(Boolean))
  ).filter((instructor): instructor is NonNullable<typeof instructor> => instructor !== null);

  const uniqueSessionTypes = Array.from(
    new Set(sessions.map(s => s.session_type))
  );

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-4">
            <img 
              src={logoHeader} 
              alt="I CAN SWIM" 
              className="h-12 w-auto object-contain"
            />
          </div>
          {/* Header with Create Master Schedule Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">
                {userRole === "admin" ? "Admin Schedule" : "My Schedule"}
              </h1>
              <p className="text-muted-foreground">
                {userRole === "admin" 
                  ? "Manage all sessions and track swimmer progress" 
                  : "View your scheduled sessions"}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <InstructorNotificationBell />
              {userRole === "admin" && (
                <Button
                  size="lg"
                  onClick={() => navigate("/admin/master-schedule")}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Master Schedule
                </Button>
              )}
            </div>
          </div>

          {/* Swimmers Needing Progress Updates - Only for instructors */}
          {userRole === "instructor" && (
            <div className="mb-6">
              <SwimmersNeedingUpdate />
            </div>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Instructors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instructors</SelectItem>
                    {uniqueInstructors.map(instructor => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueSessionTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="vmrc-only"
                    checked={showVmrcOnly}
                    onChange={(e) => setShowVmrcOnly(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="vmrc-only" className="text-sm font-medium">
                    VMRC Only
                  </label>
                </div>

                <Input
                  placeholder="Search swimmer..."
                  value={searchSwimmer}
                  onChange={(e) => setSearchSwimmer(e.target.value)}
                  className="col-span-2"
                />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="week" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>

            <TabsContent value="week" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {format(startOfWeek(currentWeek, { weekStartsOn: 0 }), "MMM d")} - {format(endOfWeek(currentWeek, { weekStartsOn: 0 }), "MMM d, yyyy")}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentWeek(new Date())}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Loading sessions...
                    </div>
                  ) : (
                    renderWeekView()
                  )}
                </CardContent>
              </Card>

              {/* Instructor Legend */}
              {Object.keys(instructorColorMap).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Instructor Color Key</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(instructorColorMap).map(([instructorId, color]) => {
                        const instructor = sessions.find(s => s.instructor?.id === instructorId)?.instructor;
                        return (
                          <div key={instructorId} className="flex items-center gap-2">
                            <div className={cn("w-4 h-4 rounded", color)} />
                            <span className="text-sm">{instructor?.full_name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="day" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{format(selectedDate, "EEEE, MMMM d, yyyy")}</CardTitle>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Select Date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderDayView()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="month" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date())}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Loading sessions...
                    </div>
                  ) : (
                    renderMonthView()
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Update Progress Drawer */}
      <UpdateProgressDrawer
        open={progressDrawerOpen}
        onOpenChange={setProgressDrawerOpen}
        swimmerId={selectedSwimmer}
        sessionId={selectedSession}
        bookingId={selectedBooking}
      />
    </>
  );
};

export default AdminSchedule;
