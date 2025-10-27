import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AlertCircle, User, FileEdit } from "lucide-react";

interface SwimmerNeedingUpdate {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  current_level: string | null;
  vmrc_sessions_used: number;
  vmrc_sessions_authorized: number;
  vmrc_current_pos_number: string | null;
}

export const SwimmersNeedingUpdate = () => {
  const navigate = useNavigate();
  const [swimmers, setSwimmers] = useState<SwimmerNeedingUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSwimmers();
  }, []);

  const fetchSwimmers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get instructor's swimmers who have used all 12 sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select(`
          bookings!inner (
            swimmer_id,
            swimmers!inner (
              id,
              first_name,
              last_name,
              photo_url,
              current_level_id,
              vmrc_sessions_used,
              vmrc_sessions_authorized,
              vmrc_current_pos_number,
              payment_type,
              swim_levels (
                display_name
              )
            )
          )
        `)
        .eq("instructor_id", user.id);

      if (sessionsError) throw sessionsError;

      // Extract unique swimmers who need updates
      const swimmerMap = new Map<string, SwimmerNeedingUpdate>();
      
      sessions?.forEach((session: any) => {
        session.bookings?.forEach((booking: any) => {
          const swimmer = booking.swimmers;
          if (
            swimmer &&
            swimmer.payment_type === "vmrc" &&
            swimmer.vmrc_sessions_used >= swimmer.vmrc_sessions_authorized &&
            !swimmerMap.has(swimmer.id)
          ) {
            swimmerMap.set(swimmer.id, {
              id: swimmer.id,
              first_name: swimmer.first_name,
              last_name: swimmer.last_name,
              photo_url: swimmer.photo_url,
              current_level: swimmer.swim_levels?.display_name || "Not Assigned",
              vmrc_sessions_used: swimmer.vmrc_sessions_used,
              vmrc_sessions_authorized: swimmer.vmrc_sessions_authorized,
              vmrc_current_pos_number: swimmer.vmrc_current_pos_number,
            });
          }
        });
      });

      setSwimmers(Array.from(swimmerMap.values()));
    } catch (error) {
      console.error("Error fetching swimmers needing update:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (swimmers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Swimmers Needing Progress Updates
          </CardTitle>
          <CardDescription>
            VMRC swimmers who have used all authorized sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No swimmers currently need progress updates
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileEdit className="h-5 w-5 text-destructive" />
          Swimmers Needing Progress Updates
        </CardTitle>
        <CardDescription>
          {swimmers.length} VMRC {swimmers.length === 1 ? "swimmer has" : "swimmers have"} used all authorized sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 border-destructive bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            These swimmers have used {swimmers[0]?.vmrc_sessions_used}/{swimmers[0]?.vmrc_sessions_authorized} sessions. 
            Submit progress updates to request new POS authorizations.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {swimmers.map((swimmer) => (
            <Card key={swimmer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={swimmer.photo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {swimmer.first_name} {swimmer.last_name}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {swimmer.current_level}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          VMRC
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {swimmer.vmrc_sessions_used}/{swimmer.vmrc_sessions_authorized} used
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/update-progress?swimmerId=${swimmer.id}`)}
                    className="shrink-0"
                  >
                    Update Progress
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
