import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import logoHeader from "@/assets/logo-header.png";
import logoCircular from "@/assets/logo-circular.jpg";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, hasRole, redirectByRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectPath = searchParams.get('redirect');
  
  const invitationToken = searchParams.get("token");
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");

  // Helper to check parent waiver status
  const checkParentWaiverStatus = async (userId: string) => {
    const { data: swimmer } = await supabase
      .from("swimmers")
      .select("id, photo_video_signature, liability_waiver_signature, cancellation_policy_signature")
      .eq("parent_id", userId)
      .maybeSingle();

    if (
      swimmer && (
        !swimmer.photo_video_signature ||
        !swimmer.liability_waiver_signature ||
        !swimmer.cancellation_policy_signature
      )
    ) {
      navigate("/waivers");
      return true;
    }
    return false;
  };

  // Check if user is already logged in
  useEffect(() => {
    const handleRedirect = async () => {
      if (!isAuthenticated) return;

      // For parents, check waiver status first
      if (hasRole('parent')) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const needsWaiver = await checkParentWaiverStatus(user.id);
          if (needsWaiver) return;
        }
      }

      // Use centralized role-based redirect
      redirectByRole(navigate);
    };

    handleRedirect();
  }, [isAuthenticated, navigate]);

  // Verify invitation token if present
  useEffect(() => {
    const verifyToken = async () => {
      if (invitationToken) {
        try {
          const { data, error } = await supabase
            .from("parent_invitations")
            .select("parent_email, claimed, expires_at")
            .eq("invitation_token", invitationToken)
            .single();

          if (error || !data) {
            setError("Invalid invitation link. Please contact support.");
            return;
          }

          if (data.claimed) {
            setError("This invitation has already been used.");
            return;
          }

          if (new Date(data.expires_at) < new Date()) {
            setError("This invitation has expired. Please request a new one.");
            return;
          }

          setInvitationEmail(data.parent_email);
          setSignupEmail(data.parent_email);
          toast({
            title: "Invitation Verified",
            description: "Please create your account to access your swimmer(s).",
          });
        } catch (err) {
          console.error("Error verifying invitation:", err);
          setError("Error verifying invitation. Please try again.");
        }
      }
    };
    verifyToken();
  }, [invitationToken, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate input
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please confirm your email address before logging in.");
        } else {
          setError(error.message);
        }
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      
      // Auth state will update automatically via useAuth
      // The useEffect above will handle redirection based on roles
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate input
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);

      if (!signupFullName.trim()) {
        setError("Please enter your full name");
        return;
      }

      const redirectUrl = `${window.location.origin}/parent-home`;

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signupFullName,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setError("An account with this email already exists. Please log in instead.");
        } else {
          setError(error.message);
        }
        return;
      }

      // If there's an invitation token, claim it
      if (invitationToken && data.user) {
        const { error: claimError } = await supabase
          .from("parent_invitations")
          .update({
            claimed: true,
            claimed_by: data.user.id,
            claimed_at: new Date().toISOString(),
          })
          .eq("invitation_token", invitationToken);

        if (claimError) {
          console.error("Error claiming invitation:", claimError);
        } else {
          // Link swimmers to this parent
          const { data: invitation } = await supabase
            .from("parent_invitations")
            .select("swimmer_ids")
            .eq("invitation_token", invitationToken)
            .single();

          if (invitation?.swimmer_ids) {
            // Update swimmers to link to this parent
            const { error: updateError } = await supabase
              .from("swimmers")
              .update({ parent_id: data.user.id })
              .in("id", invitation.swimmer_ids);

            if (updateError) {
              console.error("Error linking swimmers:", updateError);
            }
          }
        }
      }

      toast({
        title: "Account created!",
        description: invitationToken 
          ? "Your swimmers have been linked to your account. You can now access your dashboard."
          : "Check your email to confirm your account.",
      });

      if (invitationToken) {
        navigate("/parent-home");
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-ocean-light/10 to-background flex flex-col">
      <header className="container mx-auto px-4 py-6">
        <Link to="/">
          <img 
            src={logoHeader} 
            alt="I CAN SWIM" 
            className="h-12 sm:h-16 w-auto object-contain"
          />
        </Link>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={logoCircular} 
                alt="I CAN SWIM" 
                className="h-24 w-24 object-contain"
              />
            </div>
            <CardTitle className="text-2xl">
              {invitationToken ? "Create Your Account" : "Welcome to I CAN SWIM"}
            </CardTitle>
            <CardDescription>
              {invitationToken 
                ? "Complete your registration to access your swimmer(s)"
                : "Sign in to access your dashboard and manage swim lessons"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {invitationEmail && (
              <Alert className="mb-4">
                <AlertDescription>
                  Creating account for: <strong>{invitationEmail}</strong>
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue={invitationToken ? "signup" : "login"}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" disabled={!!invitationToken}>Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : "Log In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={!!invitationEmail}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
