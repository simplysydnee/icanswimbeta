import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VmrcSwimmer {
  id: string;
  firstName: string;
  lastName: string;
  currentLevel: string;
  vmrcSessionsUsed: number;
  vmrcSessionsAuthorized: number;
  vmrcCurrentPosNumber: string | null;
}

interface VmrcPosEntryProps {
  swimmers: VmrcSwimmer[];
}

export const VmrcPosEntry = ({ swimmers }: VmrcPosEntryProps) => {
  const [selectedSwimmerId, setSelectedSwimmerId] = useState<string | null>(null);
  const [posNumber, setPosNumber] = useState("");
  const [sessionsAuthorized, setSessionsAuthorized] = useState("12");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const selectedSwimmer = swimmers.find((s) => s.id === selectedSwimmerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSwimmerId || !posNumber) {
      toast({
        title: "Missing Information",
        description: "Please select a swimmer and enter a POS number",
        variant: "destructive",
      });
      return;
    }

    // TODO: Call Supabase to create VMRC authorization
    console.log("Creating VMRC authorization:", {
      swimmerId: selectedSwimmerId,
      posNumber,
      sessionsAuthorized: parseInt(sessionsAuthorized),
      notes,
    });

    toast({
      title: "Authorization Added! ✅",
      description: `POS #${posNumber} authorized ${sessionsAuthorized} sessions for ${selectedSwimmer?.firstName} ${selectedSwimmer?.lastName}`,
    });

    // Reset form
    setPosNumber("");
    setSessionsAuthorized("12");
    setNotes("");
    setSelectedSwimmerId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            VMRC POS Authorization
          </CardTitle>
          <CardDescription>
            Enter a new POS number to authorize additional sessions for VMRC clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              VMRC clients receive free sessions but require a new POS authorization number
              every 12 sessions (or as specified by the authorization).
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {swimmers.map((swimmer) => {
              const needsAuth = swimmer.vmrcSessionsUsed >= swimmer.vmrcSessionsAuthorized;
              const remainingSessions = swimmer.vmrcSessionsAuthorized - swimmer.vmrcSessionsUsed;

              return (
                <Card
                  key={swimmer.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedSwimmerId === swimmer.id ? "ring-2 ring-primary" : ""
                  } ${needsAuth ? "border-destructive" : ""}`}
                  onClick={() => setSelectedSwimmerId(swimmer.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">
                          {swimmer.firstName} {swimmer.lastName}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {swimmer.currentLevel}
                          </Badge>
                          <Badge
                            variant={needsAuth ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {swimmer.vmrcSessionsUsed}/{swimmer.vmrcSessionsAuthorized} used
                          </Badge>
                        </div>
                        {swimmer.vmrcCurrentPosNumber && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Current POS: {swimmer.vmrcCurrentPosNumber}
                          </div>
                        )}
                      </div>
                      {needsAuth ? (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      ) : remainingSessions <= 3 ? (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedSwimmer && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="text-sm font-medium mb-1">
                  Adding authorization for: {selectedSwimmer.firstName}{" "}
                  {selectedSwimmer.lastName}
                </div>
                <div className="text-xs text-muted-foreground">
                  Current status: {selectedSwimmer.vmrcSessionsUsed}/
                  {selectedSwimmer.vmrcSessionsAuthorized} sessions used
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="posNumber">
                    POS Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="posNumber"
                    value={posNumber}
                    onChange={(e) => setPosNumber(e.target.value)}
                    placeholder="POS-2024-XXX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionsAuthorized">
                    Sessions Authorized <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sessionsAuthorized"
                    type="number"
                    min="1"
                    max="100"
                    value={sessionsAuthorized}
                    onChange={(e) => setSessionsAuthorized(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this authorization..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add Authorization
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedSwimmerId(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {!selectedSwimmerId && swimmers.length > 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              Select a swimmer above to add a new POS authorization
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
