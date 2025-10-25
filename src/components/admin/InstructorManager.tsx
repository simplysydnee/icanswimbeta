import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface InstructorManagerProps {
  selectedInstructors: string[];
  onInstructorsChange: (instructors: string[]) => void;
}

export const InstructorManager = ({ selectedInstructors, onInstructorsChange }: InstructorManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newInstructor, setNewInstructor] = useState({
    fullName: "",
    email: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  // Fetch instructors
  const { data: instructors, isLoading } = useQuery({
    queryKey: ["instructors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          user_roles!inner(role)
        `)
        .eq("user_roles.role", "instructor")
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });

  const handleToggleInstructor = (instructorId: string) => {
    if (selectedInstructors.includes(instructorId)) {
      onInstructorsChange(selectedInstructors.filter((id) => id !== instructorId));
    } else {
      onInstructorsChange([...selectedInstructors, instructorId]);
    }
  };

  const handleAddInstructor = async () => {
    if (!newInstructor.fullName || !newInstructor.email) {
      toast({
        title: "Validation Error",
        description: "Please provide both name and email",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      // Call edge function to create instructor
      const { data, error } = await supabase.functions.invoke("add-instructor", {
        body: {
          fullName: newInstructor.fullName,
          email: newInstructor.email,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to add instructor");
      }

      toast({
        title: "Instructor Added",
        description: `${newInstructor.fullName} has been added as an instructor`,
      });

      // Refresh instructors list
      queryClient.invalidateQueries({ queryKey: ["instructors"] });

      // Reset form and close dialog
      setNewInstructor({ fullName: "", email: "" });
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding instructor:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add instructor",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const getInstructorName = (instructorId: string) => {
    const instructor = instructors?.find((i) => i.id === instructorId);
    return instructor?.full_name || "Unknown";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Instructors</Label>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Instructor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Instructor</DialogTitle>
              <DialogDescription>
                Create a new instructor account. They will receive login credentials via email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={newInstructor.fullName}
                  onChange={(e) =>
                    setNewInstructor({ ...newInstructor, fullName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="instructor@example.com"
                  value={newInstructor.email}
                  onChange={(e) =>
                    setNewInstructor({ ...newInstructor, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleAddInstructor} disabled={isAdding}>
                {isAdding ? "Adding..." : "Add Instructor"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading instructors...</p>
      ) : !instructors || instructors.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No instructors found. Add your first instructor to get started.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {instructors.map((instructor) => (
              <div key={instructor.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`instructor-${instructor.id}`}
                  checked={selectedInstructors.includes(instructor.id)}
                  onCheckedChange={() => handleToggleInstructor(instructor.id)}
                />
                <Label
                  htmlFor={`instructor-${instructor.id}`}
                  className="font-normal flex-1 cursor-pointer"
                >
                  {instructor.full_name}
                  <span className="text-xs text-muted-foreground ml-2">
                    {instructor.email}
                  </span>
                </Label>
              </div>
            ))}
          </div>

          {selectedInstructors.length > 0 && (
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Selected Instructors:</p>
              <div className="flex flex-wrap gap-2">
                {selectedInstructors.map((id) => (
                  <Badge key={id} variant="secondary">
                    {getInstructorName(id)}
                    <button
                      type="button"
                      onClick={() => handleToggleInstructor(id)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
