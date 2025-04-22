import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Users, AlertCircle, ArrowRight, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Create an error logger for debugging mobile issues
const logError = (error: any, context: string = "") => {
  try {
    const timestamp = new Date().toISOString();
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "No stack available";
    const userAgent = navigator.userAgent || "Unknown";
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    
    console.error(`[${timestamp}] ERROR in ${context}:`, {
      message,
      stack,
      userAgent,
      isMobile,
      platform: navigator.platform || "Unknown",
      url: window.location.href
    });
    
    // If we're in production, we could send this to a logging service
    if (process.env.NODE_ENV === "production") {
      // Future: add remote logging service integration
    }
  } catch (loggingError) {
    // Fallback if our logger itself fails
    console.error("Error in error logger:", loggingError);
    console.error("Original error:", error);
  }
};

// Define types to handle both team and church responses
interface BaseEntity {
  id: number;
  name: string;
  inviteCode?: string;
}

interface Team extends BaseEntity {
  teamId?: number;  // Some endpoints use teamId instead of id
  teamName?: string; // Some endpoints use teamName instead of name
  plan?: string;
  churchId?: number;
}

interface Church extends BaseEntity {
  denomination: string;
  location: string;
  organization?: string;
  country?: string;
  city?: string;
  logoUrl?: string | null;
  createdById: number;
  createdAt?: string;
};

export default function JoinTeamPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [isCheckingMembership, setIsCheckingMembership] = useState(false);
  // Store whether we've already processed this invite in this session
  // to prevent duplicate API calls on page refreshes
  const [inviteProcessed, setInviteProcessed] = useState(false);

  // Get current path to determine if this is a team or church join
  const isChurchJoin = window.location.pathname.includes('/join-church/');
  
  // Fetch the team or church using the invite code
  const {
    data: team,
    isLoading: isLoadingTeam,
    error: teamError,
  } = useQuery<Team, Error, Team>({
    queryKey: [isChurchJoin ? `/api/churches/by-invite/${inviteCode}` : `/api/teams/by-invite/${inviteCode}`],
    enabled: !!inviteCode,
    retry: 1,
    select: (data) => {
      console.log(`[JoinTeamPage] Successfully fetched team data:`, data);
      // If the invite code was corrected (fuzzy matching), let the user know
      if (data.inviteCode && inviteCode && data.inviteCode.toLowerCase() !== inviteCode.toLowerCase()) {
        console.log(`[JoinTeamPage] Invite code was corrected from ${inviteCode} to ${data.inviteCode} (fuzzy matching)`);
        // Show toast notification about the corrected invite code
        setTimeout(() => {
          toast({
            title: "Invitation code corrected",
            description: `We found a team with a similar code (${data.inviteCode}).`,
            duration: 5000,
          });
        }, 100);
      }
      return data;
    }
  });
  
  // Handle errors outside the query options for better TypeScript compatibility
  useEffect(() => {
    if (teamError) {
      console.error(`[JoinTeamPage] Error fetching ${isChurchJoin ? 'church' : 'team'} details:`, teamError);
    }
    
    if (team) {
      console.log(`[JoinTeamPage] Team data is available:`, team);
    } else if (!isLoadingTeam && !teamError) {
      console.log(`[JoinTeamPage] Team data is null or undefined but no error was reported`);
    }
  }, [teamError, isChurchJoin, team, isLoadingTeam]);

  // State for tracking errors specifically for the join page
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // Global error handler to prevent blank screens
  useEffect(() => {
    // Log initial page load to help with debugging
    console.log("[JoinTeamPage] Page loaded successfully", {
      inviteCode,
      userAgent: navigator.userAgent,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    });
    
    // Set up global error handler
    const originalOnError = window.onerror;
    
    window.onerror = function(message, source, lineno, colno, error) {
      logError(error || message, "JoinTeamPage:GlobalErrorHandler");
      setHasError(true);
      setErrorDetails(String(message));
      
      // Still call original handler if it exists
      if (typeof originalOnError === 'function') {
        return originalOnError(message, source, lineno, colno, error);
      }
      
      return true; // Prevents default error handling
    };
    
    // Clean up event handler on unmount
    return () => {
      window.onerror = originalOnError;
    };
  }, [inviteCode]);

  // Mutation to join the team or church
  const joinTeamMutation = useMutation({
    mutationFn: async () => {
      try {
        if (isChurchJoin) {
          console.log("[JoinTeamPage] Joining church with invite code:", inviteCode);
          const res = await apiRequest("POST", `/api/churches/join/${inviteCode}`);
          const data = await res.json();
          console.log("[JoinTeamPage] Join church response:", data);
          return data;
        } else {
          console.log("[JoinTeamPage] Joining team with invite code:", inviteCode);
          const res = await apiRequest("POST", `/api/teams/join/${inviteCode}`);
          const data = await res.json();
          console.log("[JoinTeamPage] Join team response:", data);
          return data;
        }
      } catch (error) {
        logError(error, "JoinTeamPage:JoinTeamMutation");
        throw error; // Re-throw for the mutation error handler
      }
    },
    onSuccess: () => {
      setInviteProcessed(true); // Mark this invite as fully processed
      setIsCheckingMembership(false);
      
      toast({
        title: isChurchJoin ? "Joined church successfully" : "Joined team successfully",
        description: isChurchJoin ? "You are now a member of this church." : "You are now a member of this team.",
      });
      
      try {
        console.log("[JoinTeamPage] Join successful, redirecting after delay");
        // Use React Router navigation with a catch block
        setTimeout(() => {
          try {
            navigate("/questionnaire", { replace: true });
          } catch (navError) {
            logError(navError, "JoinTeamPage:NavigationAfterJoin");
            // Fallback if navigation fails
            window.location.href = "/questionnaire";
          }
        }, 1000);
      } catch (delayError) {
        logError(delayError, "JoinTeamPage:SetTimeoutAfterJoin");
        // Direct fallback
        window.location.href = "/questionnaire";
      }
    },
    onError: (error: Error) => {
      logError(error, "JoinTeamPage:JoinTeamMutationError");
      
      toast({
        title: "Failed to join team",
        description: error.message,
        variant: "destructive",
      });
      
      // Reset all states on error so the user can try again
      setIsJoining(false);
      setIsCheckingMembership(false);
      setInviteProcessed(false);
      
      // Set error state for UI display
      setHasError(true);
      setErrorDetails(error.message);
    },
  });

  // Handle joining the team or church
  const handleJoinTeam = () => {
    try {
      // Add validation - make sure we have an invite code
      if (!inviteCode) {
        toast({
          title: "Ontbrekende uitnodigingscode",
          description: "Er is geen uitnodigingscode gevonden. Controleer de link of vraag om een nieuwe uitnodiging.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if user is logged in
      if (!user) {
        // Save the invite code to local storage to redirect back after auth
        localStorage.setItem("pendingInviteCode", inviteCode);
        
        // Use React Router navigation with the appropriate redirect path
        const redirectPath = isChurchJoin ? `/join-church/${inviteCode}` : `/join/${inviteCode}`;
        
        // Add toast to inform user they need to authenticate first
        toast({
          title: "Aanmelding vereist",
          description: "Je wordt doorgestuurd naar de inlogpagina om je aan te melden of te registreren.",
          duration: 4000,
        });
        
        // Short delay to show the toast before navigation
        setTimeout(() => {
          navigate(`/auth?redirect=${redirectPath}`);
        }, 1000);
        return;
      }
      
      // All checks passed, proceed with join
      setIsJoining(true);
      joinTeamMutation.mutate();
      
    } catch (error) {
      // Log the error for debugging
      logError(error, "JoinTeamPage:handleJoinTeam");
      
      // Show error toast to user
      toast({
        title: "Fout bij toevoegen aan team",
        description: "Er is een onverwachte fout opgetreden. Probeer het later opnieuw.",
        variant: "destructive",
      });
      
      // Reset joining state
      setIsJoining(false);
    }
  };

  // Single handler for auto-join logic - handles both pending invite codes
  // and direct team links for already authenticated users
  useEffect(() => {
    // Early exit conditions
    if (!user || isJoining || isCheckingMembership || 
        joinTeamMutation.isPending || joinTeamMutation.isSuccess || inviteProcessed) {
      return;
    }

    // Store that we've processed this invite to prevent repeated API calls
    setInviteProcessed(true);

    // Handle pending invite code from localStorage (after login/registration)
    const pendingInviteCode = localStorage.getItem("pendingInviteCode");
    if (pendingInviteCode && pendingInviteCode === inviteCode) {
      // Remove the code from localStorage first
      localStorage.removeItem("pendingInviteCode");
      
      // Set joining state and trigger the mutation
      setIsJoining(true);
      joinTeamMutation.mutate();
      return; // Exit early to avoid the team membership check
    }
    
    // Only proceed with team membership check if we have team data
    if (!team) {
      setInviteProcessed(false); // Reset so we can try again when team data loads
      return;
    }
    
    // Set checking state to prevent multiple simultaneous checks
    setIsCheckingMembership(true);
    
    // Check if the user is already on this team or church before auto-joining
    console.log(`[JoinTeamPage] Checking ${isChurchJoin ? 'church' : 'team'} membership for user:`, user.id);
    
    // For church joins, we should check if the user is already in the church
    // But for now we'll use the team check since there's no separate endpoint for church membership
    apiRequest("GET", `/api/users/${user.id}/teams`)
      .then(res => res.json())
      .then(userTeams => {
        console.log("[JoinTeamPage] User teams response:", userTeams);
        try {
          // Support both formats - teamId from API or id from local state
          const teamIdToCheck = (team as Team).teamId || (team as Team).id; 
          const alreadyJoined = userTeams.some((t: any) => t.id === teamIdToCheck);
          
          if (!alreadyJoined) {
            console.log(`[JoinTeamPage] User not yet in ${isChurchJoin ? 'church' : 'team'}, auto-joining`);
            // User is not yet joined, auto-join them
            setIsJoining(true);
            joinTeamMutation.mutate();
          } else {
            console.log(`[JoinTeamPage] User already in ${isChurchJoin ? 'church' : 'team'}, redirecting to questionnaire`);
            // User is already joined, redirect to questionnaire
            toast({
              title: isChurchJoin ? "Already a church member" : "Already a team member",
              description: `You're already a member of "${(team as Team).teamName || (team as Team).name}". Taking you to the questionnaire.`,
              variant: "default",
            });
            
            // Small delay to show the toast before redirecting
            try {
              setTimeout(() => {
                try {
                  navigate("/questionnaire", { replace: true });
                } catch (navError) {
                  logError(navError, "JoinTeamPage:NavigateAfterMembershipCheck");
                  // Fallback if navigation fails
                  window.location.href = "/questionnaire";
                }
              }, 1500);
            } catch (timeoutError) {
              logError(timeoutError, "JoinTeamPage:SetTimeoutAfterMembershipCheck");
              // Fallback for setTimeout error
              window.location.href = "/questionnaire";
            }
          }
        } catch (err) {
          logError(err, "JoinTeamPage:TeamMembershipProcessingError");
          // Continue with default flow - let user manually join
          setIsCheckingMembership(false);
          setInviteProcessed(false);
        }
      })
      .catch((err) => {
        logError(err, "JoinTeamPage:TeamMembershipCheckError");
        // If error checking team membership, just show the join button
        setIsCheckingMembership(false);
        setInviteProcessed(false); // Reset so we can try again
      });
  }, [user, team, inviteCode, isJoining, isCheckingMembership, joinTeamMutation, toast, inviteProcessed, navigate]);

  if (isLoadingTeam) {
    return (
      <Layout>
        <div className="container py-12 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  if (teamError || !team) {
    // Check if there was a specific error with retrieving the invite code
    console.error("[JoinTeamPage] Error loading details:", teamError);
    
    return (
      <Layout>
        <div className="container py-12 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                Invalid Invitation
              </CardTitle>
              <CardDescription>
                This {isChurchJoin ? "church" : "team"} invitation link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                The {isChurchJoin ? "church" : "team"} you're trying to join doesn't exist or the invitation link is no longer valid.
                Please contact the {isChurchJoin ? "church" : "team"} leader for a new invitation.
              </p>
              
              {/* Log the error for debugging */}
              {process.env.NODE_ENV !== 'production' && teamError && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  <p className="font-bold">Debug info:</p>
                  <p>{teamError.message || 'Unknown error'}</p>
                  <p>Path: {window.location.pathname}</p>
                  <p>Invite code: {inviteCode}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => navigate("/")}
                className="w-full"
              >
                Go to Homepage
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }
  
  // Check if this invite code was corrected by our fuzzy matching
  const codeWasCorrected = team && (team as Team).inviteCode && inviteCode && (team as Team).inviteCode.toLowerCase() !== inviteCode.toLowerCase();

  // If we have an error but the team loaded successfully, show the error with retry options
  if (hasError && team) {
    return (
      <Layout>
        <div className="container py-12 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
                Error Loading Join Page
              </CardTitle>
              <CardDescription>
                We encountered a problem while loading the team join page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Technical Details</AlertTitle>
                <AlertDescription className="text-xs break-all">
                  {errorDetails || "Unknown error occurred"}
                </AlertDescription>
              </Alert>
              
              <p className="mb-4">
                You can try the following solutions:
              </p>
              
              <ul className="space-y-2 mb-4">
                <li className="flex items-start text-sm">
                  <span className="font-medium mr-2">•</span>
                  <span>Refresh the page and try again</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="font-medium mr-2">•</span>
                  <span>Try a different browser (Chrome, Safari, Firefox)</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="font-medium mr-2">•</span>
                  <span>Contact the team leader for a new invitation link</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex-col space-y-2">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
              <Button 
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full"
              >
                Go to Homepage
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Join "{(team as Team).teamName || (team as Team).name}"
            </CardTitle>
            <CardDescription>
              You've been invited to join this {isChurchJoin ? "church" : "team"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              By joining this {isChurchJoin ? "church" : "team"}, you'll be able to complete the Five-Fold Ministry assessment
              and your results will be shared with the {isChurchJoin ? "church" : "team"} leader.
            </p>
            
            <div className="bg-muted/30 p-4 rounded-md mb-4">
              <h3 className="font-medium mb-2">What happens when you join:</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                  <span>You'll take the assessment to discover your Five-Fold Ministry profile</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                  <span>You'll receive personalized insights about your role</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                  <span>Your results will be added to the {isChurchJoin ? "church" : "team"} dashboard</span>
                </li>
              </ul>
            </div>
            
            {/* If we found a team with a similar invite code, show a notification */}
            {codeWasCorrected && (
              <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle>Invite Code Corrected</AlertTitle>
                <AlertDescription>
                  The invite code you entered ({inviteCode}) was slightly incorrect. We found the team "{(team as Team).name}" with 
                  a similar code ({(team as Team).inviteCode}). If this is the wrong team, please contact the team leader for the 
                  correct invitation link.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Display custom reload directive for mobile users */}
            {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
              <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm text-blue-800">
                <p className="font-medium mb-1">Using a mobile device?</p>
                <p>If this page becomes unresponsive, try refreshing and reopening the link.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <Button
              onClick={handleJoinTeam}
              className="w-full h-auto py-3 text-base font-medium"
              disabled={isJoining || joinTeamMutation.isPending}
              aria-label={`Join ${isChurchJoin ? "Church" : "Team"}`}
            >
              {isJoining || joinTeamMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Bezig met toetreden...
                </>
              ) : (
                <>
                  Word lid van {isChurchJoin ? "kerk" : "team"} <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            
            {/* Add cancel/back button for mobile users */}
            <Button
              variant="outline"
              className="w-full mt-2 h-auto py-2.5"
              onClick={() => navigate("/")}
            >
              Terug naar homepagina
            </Button>
            
            {joinTeamMutation.isSuccess && (
              <div className="bg-green-50 text-green-700 p-2 rounded-md text-sm flex items-center">
                <Check className="h-4 w-4 mr-1" />
                Successfully joined! Redirecting to the questionnaire...
              </div>
            )}
            
            {!user && (
              <p className="text-xs text-gray-500 text-center">
                You'll need to login or create an account to join this {isChurchJoin ? "church" : "team"}
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}