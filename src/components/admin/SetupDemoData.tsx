import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const SetupDemoData = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSetup = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('setup-demo-accounts', {
        body: {}
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Success!",
        description: "Demo data has been created successfully. Check the console for login credentials.",
      });

      console.log("=== DEMO ACCOUNT CREDENTIALS ===");
      console.log("Parent 1:", data.summary?.testAccounts?.parent1);
      console.log("Parent 2:", data.summary?.testAccounts?.parent2);
      console.log("Instructor 1:", data.summary?.testAccounts?.instructor1);
      console.log("Instructor 2:", data.summary?.testAccounts?.instructor2);
      console.log("Admin:", data.summary?.testAccounts?.admin);
      console.log("Coordinator:", data.summary?.testAccounts?.coordinator);
      console.log("================================");
    } catch (error: any) {
      console.error("Error setting up demo data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to setup demo data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Demo Data Setup
        </CardTitle>
        <CardDescription>
          Generate comprehensive test data including accounts, swimmers, sessions, bookings, and more
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
          <p className="font-semibold">This will create:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>6 test accounts (2 parents, 2 instructors, 1 admin, 1 coordinator)</li>
            <li>4 swimmers with various statuses (enrolled, waitlist, VMRC)</li>
            <li>5 swim levels with skills</li>
            <li>40+ sessions over the next 2 weeks</li>
            <li>Multiple bookings and progress notes</li>
            <li>Purchase orders for VMRC clients</li>
          </ul>
        </div>

        {result && (
          <div className="rounded-lg bg-success/10 border border-success/20 p-4 space-y-2 text-sm">
            <p className="font-semibold text-success">Setup Complete!</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{result.summary?.accounts} accounts created</li>
              <li>{result.summary?.swimmers} swimmers created</li>
              <li>{result.summary?.sessions} sessions created</li>
              <li>{result.summary?.bookings} bookings created</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Check browser console for login credentials
            </p>
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              className="w-full" 
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up demo data...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Setup Demo Data
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Setup Demo Data?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>This will create test accounts and populate the database with sample data.</p>
                <p className="font-semibold text-foreground">
                  Note: If accounts already exist, this may create duplicates or fail.
                </p>
                <p>Login credentials will be displayed in the browser console.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSetup}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
