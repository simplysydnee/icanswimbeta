import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, User, DollarSign, Bell } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FloatingSession {
  id: string;
  startTime: Date;
  endTime: Date;
  instructor: string;
  price: number;
  location: string;
  sessionType: string;
}

export const FloatingSessionsTab = () => {
  const [floatingSessions, setFloatingSessions] = useState<FloatingSession[]>([]);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotificationPreference();
    fetchFloatingSessions();

    // Set up real-time subscription for new floating sessions
    const channel = supabase
      .channel("floating-sessions-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "floating_sessions",
        },
        (payload) => {
          console.log("New floating session available:", payload);
          toast({
            title: "New Session Available! 🏊‍♂️",
            description: "A spot just opened up. Check floating sessions now!",
          });
          fetchFloatingSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotificationPreference = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("floating_session_notification_preferences")
        .select("enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching notification preference:", error);
        return;
      }

      setNotifyEnabled(data?.enabled ?? false);
    } catch (error) {
      console.error("Error fetching notification preference:", error);
    }
  };

  const handleNotifyToggle = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to enable notifications",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("floating_session_notification_preferences")
        .upsert({
          user_id: user.id,
          enabled,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setNotifyEnabled(enabled);
      toast({
        title: enabled ? "Notifications Enabled" : "Notifications Disabled",
        description: enabled
          ? "You'll receive email notifications when drop-in sessions become available"
          : "You won't receive notifications for drop-in sessions",
      });
    } catch (error) {
      console.error("Error updating notification preference:", error);
      toast({
        title: "Error",
        description: "Failed to update notification preference",
        variant: "destructive",
      });
    }
  };

  const fetchFloatingSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("floating_sessions")
        .select(`
          id,
          available_until,
          claimed_by,
          sessions (
            id,
            start_time,
            end_time,
            session_type,
            price_cents,
            location,
            instructor_id
          )
        `)
        .is("claimed_by", null)
        .gte("available_until", new Date().toISOString())
        .order("available_until", { ascending: true });

      if (error) throw error;

      // Mock data for now - replace with actual data transformation
      setFloatingSessions([
        {
          id: "1",
          startTime: new Date(2025, 10, 15, 10, 0),
          endTime: new Date(2025, 10, 15, 10, 45),
          instructor: "Sutton Lucas",
          price: 65,
          location: "Main Pool",
          sessionType: "Private",
        },
        {
          id: "2",
          startTime: new Date(2025, 10, 16, 14, 0),
          endTime: new Date(2025, 10, 16, 14, 45),
          instructor: "Sutton Lucas",
          price: 45,
          location: "Main Pool",
          sessionType: "Semi-Private",
        },
      ]);
    } catch (error) {
      console.error("Error fetching floating sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load floating sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (sessionId: string) => {
    console.log("Booking floating session:", sessionId);
    // TODO: Create booking via Supabase
    toast({
      title: "Session Booked!",
      description: "You've successfully claimed this floating session.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <CardTitle>Floating Sessions (Cancelled Spots)</CardTitle>
              <div className="flex items-center gap-2">
                <Switch
                  id="notify-mode"
                  checked={notifyEnabled}
                  onCheckedChange={handleNotifyToggle}
                />
                <Label htmlFor="notify-mode" className="flex items-center gap-1 cursor-pointer">
                  <Bell className="h-4 w-4" />
                  Notify me
                </Label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              These are single sessions that opened up due to cancellations. Perfect for filling gaps or making up missed lessons.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {notifyEnabled && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg text-sm">
              ✅ You'll receive notifications when new spots open up
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading floating sessions...
            </div>
          ) : floatingSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No cancelled spots available right now</p>
              <p className="text-sm">
                {notifyEnabled
                  ? "We'll notify you when someone cancels and a spot opens up!"
                  : "Enable notifications to be alerted when cancelled spots become available"}
              </p>
              <p className="text-xs mt-3 italic">
                Cancelled sessions become available here for others to book, helping maintain consistency for all swimmers.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {floatingSessions.map((session) => (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="default">{session.sessionType}</Badge>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {format(session.startTime, "MMM d, h:mm a")} - {format(session.endTime, "h:mm a")}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{session.instructor}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{session.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">${session.price}</span>
                          </div>
                        </div>
                      </div>

                      <Button onClick={() => handleBook(session.id)} size="lg">
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
