import { SwimmerHeader } from "@/components/SwimmerHeader";
import { LevelSkillsCard } from "@/components/LevelSkillsCard";
import { ProgressBadge, SwimLevel } from "@/components/ProgressBadge";
import { InstructorRecommendations } from "@/components/InstructorRecommendations";
import { VideoUpload } from "@/components/VideoUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const swimLevels: SwimLevel[] = ["tadpole", "minnow", "starfish", "dolphin", "shark"];

const levelSkills = {
  tadpole: [
    { name: "Comfortable entering the water", completed: true, dateMastered: "2024-01-15" },
    { name: "Blowing bubbles at water surface", completed: true, dateMastered: "2024-01-20" },
    { name: "Getting face wet", completed: false },
    { name: "Basic water safety awareness", completed: false },
  ],
  minnow: [
    { name: "Submerging face voluntarily", completed: false },
    { name: "Front float with support", completed: false },
    { name: "Back float with support", completed: false },
    { name: "Kicking with kickboard", completed: false },
  ],
  starfish: [
    { name: "Independent front float (5 seconds)", completed: false },
    { name: "Independent back float (5 seconds)", completed: false },
    { name: "Recovering from float to standing", completed: false },
    { name: "Treading water with support", completed: false },
  ],
  dolphin: [
    { name: "Swimming 10 feet independently", completed: false },
    { name: "Freestyle arm movements", completed: false },
    { name: "Backstroke basics", completed: false },
    { name: "Deep water comfort", completed: false },
  ],
  shark: [
    { name: "Swimming 25 feet continuously", completed: false },
    { name: "Diving from side of pool", completed: false },
    { name: "Advanced stroke refinement", completed: false },
    { name: "Water safety skills mastery", completed: false },
  ],
};

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/20 to-background">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <SwimmerHeader swimmerName="Emma" currentLevel="Tadpole" />

        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="progress">Progress Tracker</TabsTrigger>
            <TabsTrigger value="assessment">Initial Assessment</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="videos">Progress Videos</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-8">
            {/* Level Overview */}
            <Card className="bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader>
                <CardTitle className="text-2xl">🏊 Swim Journey Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center gap-4 overflow-x-auto pb-4">
                  {swimLevels.map((level, index) => (
                    <ProgressBadge
                      key={level}
                      level={level}
                      isActive={index === 0}
                      isCompleted={false}
                      size="md"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skills Cards */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Current Level Skills</h2>
              <LevelSkillsCard
                level="tadpole"
                skills={levelSkills.tadpole}
                isActive={true}
                notes="Emma is doing wonderfully! She's gaining confidence each session."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <LevelSkillsCard
                  level="minnow"
                  skills={levelSkills.minnow}
                />
                <LevelSkillsCard
                  level="starfish"
                  skills={levelSkills.starfish}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assessment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">📋 Initial Assessment</CardTitle>
                <p className="text-sm text-muted-foreground">Assessment Date: January 10, 2024</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-primary">Swimmer Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> Emma Johnson</p>
                      <p><span className="font-medium">Date of Birth:</span> March 15, 2018</p>
                      <p><span className="font-medium">Age:</span> 6 years old</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-primary">Strengths & Interests</h3>
                    <p className="text-sm text-muted-foreground">
                      Emma loves water play and shows great enthusiasm. She enjoys singing and responds well to music during activities.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-lg mb-3 text-primary">Goals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-medium text-sm mb-1">Swimming Skills</p>
                      <p className="text-sm text-muted-foreground">Build water confidence and learn basic floating</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-medium text-sm mb-1">Safety Skills</p>
                      <p className="text-sm text-muted-foreground">Learn to recognize pool boundaries and safe entry</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-lg mb-3 text-primary">Skills Assessment</h3>
                  <div className="space-y-3">
                    {[
                      { skill: "Water Properties", assessment: "Shows curiosity about how water feels and moves" },
                      { skill: "Front Float", assessment: "Needs support; working on face-down comfort" },
                      { skill: "Back Float", assessment: "Relaxes well with support; building trust" },
                      { skill: "Safety", assessment: "Learning pool rules; responds well to instructor guidance" },
                      { skill: "Body & Breath Control", assessment: "Can hold breath; practicing bubble blowing" },
                    ].map((item, index) => (
                      <div key={index} className="bg-card border rounded-lg p-4">
                        <p className="font-medium text-sm mb-1">{item.skill}</p>
                        <p className="text-sm text-muted-foreground">{item.assessment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-lg mb-2 text-primary">Recommendations</h3>
                  <p className="text-sm text-muted-foreground">
                    Continue with twice-weekly sessions focusing on water comfort and breath control. Incorporate sensory-friendly activities and music to maintain engagement.
                  </p>
                </div>

                <div className="pt-4 text-xs text-muted-foreground">
                  <p>Assessment completed by: Sutton Lucas, I CAN SWIM</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <InstructorRecommendations />
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">🎥 Progress Videos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload and track swimmer progress videos for skill development and instructor review
                </p>
              </CardHeader>
              <CardContent>
                <VideoUpload />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
