import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, addDays, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate, Navigate } from "react-router-dom";
import { SwimmersNeedingUpdate } from "@/components/SwimmersNeedingUpdate";
import { LogoutButton } from "@/components/LogoutButton";
import logoHeader from "@/assets/logo-header.png";
import { useAuth } from "@/hooks/useAuth";

interface Session {
  id: string;
  start_time: string;
  end_time: string;
  session_type: string;
  location: string;
  instructor: {
    id: string;
    full_name: string;
  } | null;
  bookings: Array<{
    id: string;
    swimmer: {
      id: string;
      first_name: string;
      last_name: string;
      parent_id: string;
      payment_type: string;
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

const Schedule = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAdmin, isInstructor, isLoading: authLoading } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructorColorMap, setInstructorColorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [currentWeek, selectedDate, user]);

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
          location,
          instructor_id,
          profiles!sessions_instructor_id_fkey (
            id,
            full_name
          ),
          bookings!inner (
            id,
            swimmer_id,
            swimmers (
              id,
              first_name,
              last_name,
              parent_id,
              payment_type,
              vmrc_sessions_used,
              vmrc_sessions_authorized
            )
          )
        `)
        .gte("start_time", weekStart.toISOString())
        .lte("start_time", weekEnd.toISOString())
        .eq("status", "available")
        .order("start_time");

      // If user is an instructor, only show their sessions
      if (isInstructor && user?.id) {
        query = query.eq("instructor_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data
      const transformedSessions: Session[] = (data || []).map((session: any) => ({
        id: session.id,
        start_time: session.start_time,
        end_time: session.end_time,
        session_type: session.session_type,
        location: session.location,
        instructor: session.profiles ? {
          id: session.profiles.id,
          full_name: session.profiles.full_name,
        } : null,
        bookings: (session.bookings || []).map((booking: any) => ({
          id: booking.id,
          swimmer: {
            id: booking.swimmers.id,
            first_name: booking.swimmers.first_name,
            last_name: booking.swimmers.last_name,
            parent_id: booking.swimmers.parent_id,
            payment_type: booking.swimmers.payment_type,
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

  const handleSessionClick = (session: Session) => {
    if (session.bookings.length > 0) {
      const swimmer = session.bookings[0].swimmer;
      // Navigate to dashboard with swimmer selected
      navigate(`/dashboard?swimmerId=${swimmer.id}`);
    }
  };

  const getSessionsForDay = (date: Date) => {
    return sessions.filter(session => 
      isSameDay(parseISO(session.start_time), date)
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
                          <div className="text-center font-semibold p-2 bg-muted rounded">
                            <div className="text-sm">{format(day, "EEE")}</div>
                            <div className="text-lg">{format(day, "d")}</div>
                          </div>
                          <div className="space-y-2 min-h-[300px]">
                            {daySessions.map(session => {
                              const needsUpdate = session.bookings.some((b: any) => 
                                b.swimmer.payment_type === "vmrc" &&
                                b.swimmer.vmrc_sessions_used >= b.swimmer.vmrc_sessions_authorized
                              );
                              return (
                                <Card 
                                  key={session.id}
                                  className={cn(
                                    "cursor-pointer hover:shadow-lg transition-shadow",
                                    session.instructor?.id && instructorColorMap[session.instructor.id] 
                                      ? `border-l-4 ${instructorColorMap[session.instructor.id]}` 
                                      : "",
                                    needsUpdate && "border-destructive border-2"
                                  )}
                                  onClick={() => handleSessionClick(session)}
                                >
                                  <CardContent className="p-3">
                                    <div className="text-xs font-semibold mb-1">
                                      {format(parseISO(session.start_time), "h:mm a")}
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-2">
                                      {session.instructor?.full_name || "No instructor"}
                                    </div>
                                    {session.bookings.map(booking => {
                                      const swimmerNeedsUpdate = booking.swimmer.payment_type === "vmrc" &&
                                        booking.swimmer.vmrc_sessions_used >= booking.swimmer.vmrc_sessions_authorized;
                                      return (
                                        <Badge 
                                          key={booking.id} 
                                          variant={swimmerNeedsUpdate ? "destructive" : "secondary"} 
                                          className="text-xs mb-1"
                                        >
                                          {booking.swimmer.first_name} {booking.swimmer.last_name}
                                          {swimmerNeedsUpdate && " ⚠️"}
                                        </Badge>
                                      );
                                    })}
                                  </CardContent>
                                </Card>
                              );
                            })}
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
          daySessions.map(session => {
            const needsUpdate = session.bookings.some((b: any) => 
              b.swimmer.payment_type === "vmrc" &&
              b.swimmer.vmrc_sessions_used >= b.swimmer.vmrc_sessions_authorized
            );
            return (
              <Card 
                key={session.id}
                className={cn(
                  "cursor-pointer hover:shadow-lg transition-shadow",
                  session.instructor?.id && instructorColorMap[session.instructor.id]
                    ? `border-l-8 ${instructorColorMap[session.instructor.id]}`
                    : "",
                  needsUpdate && "border-destructive border-2"
                )}
                onClick={() => handleSessionClick(session)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {format(parseISO(session.start_time), "h:mm a")} - {format(parseISO(session.end_time), "h:mm a")}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {session.session_type} • {session.location}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {session.instructor?.full_name || "No instructor"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <User className="h-4 w-4" />
                      Swimmers ({session.bookings.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {session.bookings.map(booking => {
                        const swimmerNeedsUpdate = booking.swimmer.payment_type === "vmrc" &&
                          booking.swimmer.vmrc_sessions_used >= booking.swimmer.vmrc_sessions_authorized;
                        return (
                          <Badge 
                            key={booking.id} 
                            variant={swimmerNeedsUpdate ? "destructive" : "secondary"} 
                            className="text-sm py-1 px-3"
                          >
                            {booking.swimmer.first_name} {booking.swimmer.last_name}
                            {swimmerNeedsUpdate && " ⚠️ Update Needed"}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin && !isInstructor) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between">
          <img 
            src={logoHeader} 
            alt="I CAN SWIM" 
            className="h-12 w-auto object-contain"
          />
          <LogoutButton />
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {isAdmin ? "Master Schedule" : "My Schedule"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "View all sessions and swimmers" 
              : "View your scheduled sessions"}
          </p>
        </div>

        {/* Swimmers Needing Progress Updates - Only for instructors */}
        {isInstructor && (
          <div className="mb-6">
            <SwimmersNeedingUpdate />
          </div>
        )}

        <Tabs defaultValue="week" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="week">Week View</TabsTrigger>
            <TabsTrigger value="day">Day View</TabsTrigger>
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
                  <CardTitle className="text-sm">Instructor Legend</CardTitle>
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
        </Tabs>
      </div>
    </div>
  );
};

export default Schedule;
