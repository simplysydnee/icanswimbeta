import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParentSwimmers } from "@/hooks/useParentSwimmers";
import { Calendar, User, Plus, LogOut, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoHeader from "@/assets/logo-header.png";

const ParentHome = () => {
  const { swimmers, loading, error } = useParentSwimmers();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getStatusBadge = (enrollmentStatus: string, assessmentStatus: string) => {
    if (enrollmentStatus === "enrolled") {
      return <Badge className="bg-green-500">Enrolled</Badge>;
    }
    if (enrollmentStatus === "approved") {
      return <Badge className="bg-blue-500">Approved</Badge>;
    }
    if (assessmentStatus === "scheduled") {
      return <Badge className="bg-yellow-500">Assessment Scheduled</Badge>;
    }
    return <Badge variant="secondary">Waitlist</Badge>;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-ocean-light/10 to-background">
        <p className="text-muted-foreground">Loading swimmers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-ocean-light/10 to-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth")}>Back to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img 
              src={logoHeader} 
              alt="I CAN SWIM" 
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/schedule")}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Welcome Back! 👋</h1>
          <p className="text-muted-foreground text-lg">
            Select a swimmer to view their progress or book a session
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/booking")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Book a Session</h3>
                  <p className="text-sm text-muted-foreground">Schedule lessons for your swimmers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/schedule")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-accent/10 p-3 rounded-full">
                  <CalendarDays className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">View Schedule</h3>
                  <p className="text-sm text-muted-foreground">See all upcoming sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Swimmers Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Swimmers</h2>
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Coming Soon", description: "Add swimmer functionality" })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Swimmer
            </Button>
          </div>

          {swimmers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">You don't have any swimmers yet</p>
                <Button onClick={() => navigate("/booking")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Enroll a Swimmer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {swimmers.map((swimmer) => (
                <Card 
                  key={swimmer.id} 
                  className="hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => navigate(`/dashboard?swimmerId=${swimmer.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                        <AvatarImage src={swimmer.photo_url} alt={`${swimmer.first_name} ${swimmer.last_name}`} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {getInitials(swimmer.first_name, swimmer.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl mb-1 truncate">
                          {swimmer.first_name} {swimmer.last_name}
                        </CardTitle>
                        <CardDescription className="flex flex-col gap-1">
                          <span className="font-medium text-foreground">
                            {swimmer.current_level}
                          </span>
                          {getStatusBadge(swimmer.enrollment_status, swimmer.assessment_status)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard?swimmerId=${swimmer.id}`);
                        }}
                      >
                        View Progress
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/booking?swimmerId=${swimmer.id}`);
                        }}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentHome;
