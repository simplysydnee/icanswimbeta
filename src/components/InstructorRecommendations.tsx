import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lightbulb, Target, Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface Recommendation {
  category: string;
  icon: React.ElementType;
  content: string;
  color: string;
}

export const InstructorRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      category: "Current Focus",
      icon: Target,
      content: "Continue building water confidence through play-based activities. Emma responds well to songs and games.",
      color: "text-primary"
    },
    {
      category: "Teaching Strategies",
      icon: Lightbulb,
      content: "Use visual cues and demonstrations. Break down skills into smaller steps. Allow extra time for transitions.",
      color: "text-accent"
    },
    {
      category: "Strengths",
      icon: CheckCircle,
      content: "Emma shows great enthusiasm and willingness to try new activities. She has good body awareness in water.",
      color: "text-success"
    },
    {
      category: "Sensory Considerations",
      icon: Heart,
      content: "Prefers warmer water. May need breaks if overstimulated. Responds well to gentle encouragement.",
      color: "text-secondary"
    }
  ]);

  const [newRecommendation, setNewRecommendation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Current Focus");

  const handleAddRecommendation = () => {
    if (!newRecommendation.trim()) {
      toast({
        title: "Empty recommendation",
        description: "Please enter a recommendation before saving",
        variant: "destructive"
      });
      return;
    }

    const categoryIcons: Record<string, { icon: React.ElementType; color: string }> = {
      "Current Focus": { icon: Target, color: "text-primary" },
      "Teaching Strategies": { icon: Lightbulb, color: "text-accent" },
      "Strengths": { icon: CheckCircle, color: "text-success" },
      "Sensory Considerations": { icon: Heart, color: "text-secondary" }
    };

    const newRec: Recommendation = {
      category: selectedCategory,
      icon: categoryIcons[selectedCategory].icon,
      content: newRecommendation,
      color: categoryIcons[selectedCategory].color
    };

    setRecommendations([...recommendations, newRec]);
    setNewRecommendation("");
    
    toast({
      title: "Recommendation added",
      description: "Your recommendation has been saved successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Instructor Recommendations
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Personalized teaching strategies and observations for this swimmer
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.map((rec, index) => (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <rec.icon className={`h-5 w-5 ${rec.color} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">{rec.category}</h4>
                    <p className="text-sm text-muted-foreground">{rec.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Add New Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Recommendation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="category" className="mb-2 block">Category</Label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option>Current Focus</option>
              <option>Teaching Strategies</option>
              <option>Strengths</option>
              <option>Sensory Considerations</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="new-recommendation" className="mb-2 block">
              Recommendation Details
            </Label>
            <Textarea
              id="new-recommendation"
              placeholder="Enter teaching strategies, observations, or recommendations..."
              value={newRecommendation}
              onChange={(e) => setNewRecommendation(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button 
            onClick={handleAddRecommendation}
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Save Recommendation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
