import { SwimmerHeader } from "@/components/SwimmerHeader";
import { LevelSkillsCard } from "@/components/LevelSkillsCard";
import { ProgressBadge, SwimLevel } from "@/components/ProgressBadge";
import { VideoUpload } from "@/components/VideoUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, User, LogOut } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SwimmerSwitcher } from "@/components/SwimmerSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useParentSwimmersQuery } from "@/hooks/useParentSwimmersQuery";
import { useEffect, useState } from "react";
import logoHeader from "@/assets/logo-header.png";

interface SwimLevelData {
  id: string;
  name: string;
  display_name: string;
  description: string;
  sequence: number;
}

interface SkillData {
  id: string;
  name: string;
  description: string;
  sequence: number;
  level_id: string;
}

interface SwimmerSkillData {
  skill_id: string;
  status: string;
  date_mastered: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const swimmerId = searchParams.get("swimmerId");
  const { data: swimmers = [] } = useParentSwimmersQuery();
  const [swimLevels, setSwimLevels] = useState<SwimLevelData[]>([]);
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [swimmerSkills, setSwimmerSkills] = useState<SwimmerSkillData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch swim levels
        const { data: levelsData, error: levelsError } = await supabase
          .from("swim_levels")
          .select("*")
          .order("sequence");

        if (levelsError) throw levelsError;
        setSwimLevels(levelsData || []);

        // Fetch skills
        const { data: skillsData, error: skillsError } = await supabase
          .from("skills")
          .select("*")
          .order("sequence");

        if (skillsError) throw skillsError;
        setSkills(skillsData || []);

        // Fetch swimmer skills if swimmerId is available
        if (swimmerId) {
          const { data: swimmerSkillsData, error: swimmerSkillsError } = await supabase
            .from("swimmer_skills")
            .select("skill_id, status, date_mastered")
            .eq("swimmer_id", swimmerId);

          if (swimmerSkillsError) throw swimmerSkillsError;
          setSwimmerSkills(swimmerSkillsData || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [swimmerId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const currentSwimmer = swimmers.find((s) => s.id === swimmerId);
  const swimmerFullName = currentSwimmer 
    ? `${currentSwimmer.first_name} ${currentSwimmer.last_name}`
    : "Swimmer";

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-light/20 via-background to-background pb-8">
      {/* Sticky Header */}
      <header className="bg-gradient-to-r from-primary via-accent to-secondary p-3 sm:p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img 
              src={logoHeader}
              alt="I CAN SWIM"
              className="h-8 sm:h-10 md:h-12 w-auto object-contain shrink-0"
            />
            <div className="flex items-center gap-1 min-w-0">
              <span className="hidden md:inline text-white/80 text-xs lg:text-sm shrink-0">Viewing:</span>
              <div className="min-w-0">
                <SwimmerSwitcher currentSwimmerId={swimmerId || undefined} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/schedule")}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-8 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <span className="hidden xs:inline">Schedule</span>
              <Calendar className="h-4 w-4 xs:hidden" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-8 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <span className="hidden xs:inline">Sign Out</span>
              <LogOut className="h-4 w-4 xs:hidden" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-6">
        {swimmerId && (
          <Button
            variant="ghost"
            onClick={() => navigate("/parent-home")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Swimmers
          </Button>
        )}

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {swimmerFullName} — Dashboard
          </h1>
          <p className="text-muted-foreground">
            View progress, book sessions, and track development
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Button
            size="lg"
            onClick={() => navigate(`/booking?swimmerId=${swimmerId}`)}
            className="h-auto py-4"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Book Session
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/schedule")}
            className="h-auto py-4"
          >
            <Clock className="h-5 w-5 mr-2" />
            View All Sessions
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              alert("Update profile functionality coming soon");
            }}
            className="h-auto py-4"
          >
            <User className="h-5 w-5 mr-2" />
            Update Profile
          </Button>
        </div>

        <SwimmerHeader 
          swimmerName={swimmerFullName}
          currentLevel={currentSwimmer?.current_level || "Not Assigned"}
          swimmerPhotoUrl={currentSwimmer?.photo_url}
        />

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="progress">Progress / Skills</TabsTrigger>
            <TabsTrigger value="messages">Messages / Notes</TabsTrigger>
            <TabsTrigger value="videos">Progress Videos</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your upcoming sessions will appear here. Book a session to get started!
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-8">
            {loading ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Loading progress...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Level Overview */}
                <Card className="bg-gradient-to-br from-card via-card to-primary/5">
                  <CardHeader>
                    <CardTitle className="text-2xl">🏊 Swim Journey Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center gap-4 overflow-x-auto pb-4">
                      {swimLevels.map((levelData, index) => (
                        <ProgressBadge
                          key={levelData.id}
                          level={levelData.name as SwimLevel}
                          isActive={currentSwimmer?.current_level === levelData.display_name}
                          isCompleted={false}
                          size="md"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Skills Cards */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-foreground">Skills by Level</h2>
                  {swimLevels.map((levelData) => {
                    const levelSkills = skills
                      .filter((skill) => skill.level_id === levelData.id)
                      .map((skill) => {
                        const swimmerSkill = swimmerSkills.find((ss) => ss.skill_id === skill.id);
                        return {
                          name: skill.name,
                          completed: swimmerSkill?.status === "mastered",
                          dateMastered: swimmerSkill?.date_mastered || undefined,
                        };
                      });

                    return (
                      <LevelSkillsCard
                        key={levelData.id}
                        level={levelData.name as SwimLevel}
                        skills={levelSkills}
                        isActive={currentSwimmer?.current_level === levelData.display_name}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages & Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Instructor messages and notes will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <VideoUpload />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
