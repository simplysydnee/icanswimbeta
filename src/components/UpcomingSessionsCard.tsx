import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { SwimmerSessionsSummary } from "@/hooks/useUpcomingSessions";

interface UpcomingSessionsCardProps {
  swimmerSession: SwimmerSessionsSummary;
}

export const UpcomingSessionsCard = ({ swimmerSession }: UpcomingSessionsCardProps) => {
  const { swimmerName, photoUrl, sessions, remainingSessions, isVmrcClient } = swimmerSession;
  
  const initials = swimmerName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={photoUrl} alt={swimmerName} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{swimmerName}</CardTitle>
              {isVmrcClient && (
                <Badge variant="secondary" className="mt-1">
                  VMRC Client
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Sessions Remaining</p>
            <p className="text-2xl font-bold text-primary">
              {remainingSessions === "unlimited" ? "∞" : remainingSessions}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No upcoming sessions scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {session.sessionType}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{session.sessionDate}</span>
                    </div>
                  </div>
                  <Badge
                    variant={session.bookingStatus === "confirmed" ? "default" : "secondary"}
                  >
                    {session.bookingStatus}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{session.sessionStartTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{session.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{session.instructor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
