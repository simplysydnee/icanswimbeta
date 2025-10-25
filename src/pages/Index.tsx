import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpcomingSessionsCard } from "@/components/UpcomingSessionsCard";
import { useUpcomingSessions } from "@/hooks/useUpcomingSessions";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Index = () => {
  const { swimmerSessions, loading, error } = useUpcomingSessions();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/20 to-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/20 to-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your swimmers' upcoming sessions
          </p>
        </div>

        {swimmerSessions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-40" />
                <p className="text-lg mb-2">No swimmers found</p>
                <p className="text-sm">
                  Contact your administrator to add swimmers to your account
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Upcoming Sessions
            </h2>
            {swimmerSessions.map((swimmerSession) => (
              <UpcomingSessionsCard
                key={swimmerSession.swimmerId}
                swimmerSession={swimmerSession}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
