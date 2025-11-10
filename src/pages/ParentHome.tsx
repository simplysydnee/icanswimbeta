import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParentSwimmers } from "@/hooks/useParentSwimmers";
import { Calendar, User, LogOut, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoHeader from "@/assets/logo-parent-header.png";

const ParentHome = () => {
  const { swimmers, loading, error } = useParentSwimmers();
  const navigate = useNavigate();

  // Redirect non-parent roles away from Parent Home
  useEffect(() => {
    const redirectNonParent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roles = (rolesData || []).map((r: any) => r.role as string);
      if (roles.includes("admin")) { navigate("/admin/dashboard"); return; }
      if (roles.includes("instructor")) { navigate("/schedule"); return; }
      if (roles.includes("vmrc_coordinator")) { navigate("/coordinator"); return; }
    };
    redirectNonParent();
  }, [navigate]);

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

  const scrollToSwimmers = () => {
    const element = document.getElementById("swimmer-cards");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-ocean-light/20 via-background to-background">
        <p className="text-muted-foreground">Loading swimmers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-ocean-light/20 via-background to-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate("/auth")}>Back to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-light/20 via-background to-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary via-accent to-secondary p-4 sm:p-6 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <img 
            src={logoHeader}
            alt="I CAN SWIM"
            className="h-10 sm:h-12 md:h-16 w-auto object-contain shrink-0"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/schedule")}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs sm:text-sm"
            >
              <span className="hidden xs:inline">Schedule</span>
              <Calendar className="h-4 w-4 xs:hidden" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs sm:text-sm"
            >
              <span className="hidden xs:inline">Sign Out</span>
              <LogOut className="h-4 w-4 xs:hidden" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        {/* Page Title */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            My Swimmers
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Select a swimmer to view their dashboard or start a booking.
          </p>
        </div>

        {/* Primary Actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8 sm:mb-12">
          <Button
            size="lg"
            className="h-auto py-6 text-lg font-semibold"
            onClick={() => navigate("/booking")}
          >
            <Calendar className="h-5 w-5 mr-2" />
            Book Sessions
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-auto py-6 text-lg font-semibold"
            onClick={scrollToSwimmers}
          >
            <User className="h-5 w-5 mr-2" />
            View Swimmer Dashboards
          </Button>
        </div>

        {/* Swimmers List */}
        <div id="swimmer-cards">
          <h2 className="text-2xl font-bold mb-6">My Swimmers</h2>
          
          {swimmers.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground text-lg mb-4">No swimmers enrolled yet</p>
                <Button onClick={() => navigate("/booking?tab=enrollment")}>
                  Enroll a Swimmer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {swimmers.map((swimmer) => (
                <Card key={swimmer.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                      {/* Swimmer Avatar */}
                      <Avatar className="h-16 w-16 sm:h-20 sm:w-20 shrink-0">
                        <AvatarImage src={swimmer.photo_url} alt={swimmer.first_name} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                          {getInitials(swimmer.first_name, swimmer.last_name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Swimmer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-xl font-bold">
                            {swimmer.first_name} {swimmer.last_name}
                          </h3>
                          {getStatusBadge(swimmer.enrollment_status, swimmer.assessment_status)}
                        </div>
                        
                        {/* Flexible Swimmer Alert */}
                        {swimmer.flexible_swimmer && (
                          <Alert className="mb-3 border-amber-500 bg-amber-50 dark:bg-amber-950">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-sm">
                              <p className="font-bold text-amber-900 dark:text-amber-100 mb-1">
                                Flexible Swimmer Status
                              </p>
                              <p className="text-amber-800 dark:text-amber-200">
                                Due to a late cancellation, recurring weekly sessions are temporarily unavailable. 
                                You can still book open single sessions as they become available.
                              </p>
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        <p className="text-muted-foreground mb-1">
                          <span className="font-medium">Level:</span> {swimmer.current_level}
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button
                            variant="default"
                            onClick={() => navigate(`/dashboard?swimmerId=${swimmer.id}`)}
                          >
                            Open Dashboard
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/booking?swimmerId=${swimmer.id}`)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Book for {swimmer.first_name}
                          </Button>
                        </div>
                      </div>
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
