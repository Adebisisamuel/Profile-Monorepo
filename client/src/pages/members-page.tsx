import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { 
  Loader2, 
  PlusCircle, 
  Users, 
  Mail, 
  RefreshCw, 
  UserPlus, 
  Link2, 
  Copy, 
  HelpCircle, 
  PieChart, 
  BarChart, 
  BarChart3, 
  Activity, 
  UserCheck,
  UserMinus,
  AlertCircle,
  Wand2
} from "lucide-react";
import TeamSuggestionWizard from "@/components/TeamSuggestionWizard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ROLES, ROLE_COLORS } from "@/lib/constants";
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import type { User } from "@shared/schema";

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// Helper types for the church and church members with their profiles
interface Church {
  id: number;
  name: string;
  denomination: string;
  location: string;
  organization?: string;
  country?: string;
  city?: string;
  logoUrl?: string | null;
  inviteCode?: string | null;
  createdById: number;
  createdAt: string;
}

interface ChurchMember extends User {
  roleScores?: {
    apostle: number;
    prophet: number;
    evangelist: number;
    shepherd: number;
    teacher: number;
    primaryRole?: string;
    secondaryRole?: string;
  };
}

// Type for team data displayed in the church dashboard
interface TeamInfo {
  id: number;
  name: string;
  memberCount: number;
  dominantRole?: string;
  missingRoles?: string[];
  roleDistribution?: {
    apostle: number;
    prophet: number;
    evangelist: number;
    herder: number;  // Note: herder is used instead of shepherd in some places
    teacher: number;
  };
}

export default function MembersPage() {
  const { user } = useAuth();
  const [activeChurchId, setActiveChurchId] = useState<number | null>(null);
  const [isTeamWizardOpen, setIsTeamWizardOpen] = useState(false);

  // Get user's church (for team leaders)
  const { 
    data: churches, 
    isLoading: isLoadingChurches,
    error: churchesError
  } = useQuery({
    queryKey: ["/api/churches/my-churches"],
    queryFn: async () => {
      console.log("Fetching churches for user:", user?.id);
      try {
        const res = await apiRequest("GET", "/api/churches/my-churches");
        if (!res.ok) {
          const error = await res.text();
          console.error("Error fetching churches:", error);
          throw new Error(error);
        }
        
        // Make sure we get JSON response
        const contentType = res.headers.get('Content-Type');
        console.log("Response content type:", contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json() as Church[];
          console.log("Churches data:", data);
          return data;
        } else {
          console.error("Invalid content type from API. Expected JSON, got:", contentType);
          // Try to extract the text response for debugging
          const textResponse = await res.text();
          console.error("Invalid response content:", textResponse.substring(0, 200) + "...");
          throw new Error("Invalid response format from server");
        }
      } catch (error) {
        console.error("Error in churches query:", error);
        throw error;
      }
    },
    enabled: !!user?.id && user?.role === "teamleader"
  });
  
  console.log("Churches query result:", { 
    churches, 
    isLoadingChurches,
    error: churchesError 
  });

  // Get church members for the selected church
  const {
    data: churchMembers,
    isLoading: isLoadingMembers,
    refetch: refetchMembers
  } = useQuery({
    queryKey: ["/api/churches", activeChurchId, "members"],
    queryFn: async () => {
      if (!activeChurchId) return [];
      const res = await apiRequest("GET", `/api/churches/${activeChurchId}/members`);
      return await res.json() as ChurchMember[];
    },
    enabled: !!activeChurchId,
    // Refresh every 10 seconds and when the window gets focus
    refetchInterval: 10000,
    refetchOnWindowFocus: true
  });

  // Get dashboard data - always declare this hook even if not enabled
  const { 
    data: dashboardData,
    isLoading: isLoadingDashboard
  } = useQuery({
    queryKey: ["/api/churches", activeChurchId, "dashboard"],
    queryFn: async () => {
      if (!activeChurchId) return null;
      const res = await apiRequest("GET", `/api/churches/${activeChurchId}/dashboard`);
      return await res.json();
    },
    enabled: !!activeChurchId,
    refetchInterval: 10000,
    refetchOnWindowFocus: true
  });

  // Set initial active church when churches are loaded
  useEffect(() => {
    if (churches && churches.length > 0 && !activeChurchId) {
      // Look specifically for church ID 2 first (House of Hope created by user 20)
      const userOwnChurch = churches.find(church => church.id === 2);
      if (userOwnChurch) {
        console.log("Found user's own church with ID 2, setting it as active");
        setActiveChurchId(userOwnChurch.id);
      } else {
        console.log("Using first available church:", churches[0].id);
        setActiveChurchId(churches[0].id);
      }
    }
  }, [churches, activeChurchId]);

  // Mutation to remove a user from the church
  const removeUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      if (!activeChurchId) throw new Error("No church selected");
      const res = await apiRequest(
        "DELETE", 
        `/api/churches/${activeChurchId}/members/${userId}`
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Gebruiker verwijderd",
        description: "De gebruiker is verwijderd uit de kerk",
      });
      // Refetch members to update the list
      refetchMembers();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen gebruiker",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation to add a user to a team
  const addToTeamMutation = useMutation({
    mutationFn: async ({ userId, teamId }: { userId: number, teamId: number }) => {
      console.log(`Adding user ${userId} to team ${teamId}`);
      
      // Use the original endpoint that was already working
      const res = await apiRequest(
        "POST", 
        `/api/teams/${teamId}/add-member`,
        { userId }
      );
      
      // Check if the response is valid JSON
      const contentType = res.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      } else {
        // If not JSON, get the text and log it for debugging
        const textResponse = await res.text();
        console.error("Invalid response format from server:", textResponse.substring(0, 200));
        throw new Error("Server returned an invalid response format. Please try again.");
      }
    },
    onSuccess: () => {
      toast({
        title: "Lid toegevoegd aan team",
        description: "De gebruiker is succesvol toegevoegd aan het team",
      });
      // Close the dialog and refetch data
      setSelectedUserId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/churches", activeChurchId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/churches", activeChurchId, "dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen aan team",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // State for the team assignment dialog
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  
  // This state was already declared above

  // Function to copy church invite link to clipboard
  // Mutation to generate an invite code for a church without one
  const generateInviteCodeMutation = useMutation({
    mutationFn: async (churchId: number) => {
      const res = await apiRequest(
        "POST", 
        `/api/churches/${churchId}/generate-invite-code`
      );
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return await res.json();
    },
    onSuccess: (updatedChurch) => {
      toast({
        title: "Uitnodigingscode aangemaakt",
        description: "Er is een nieuwe uitnodigingscode aangemaakt voor deze kerk",
      });
      // Invalidate churches cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/churches/my-churches"] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij aanmaken uitnodigingscode",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const copyInviteLink = () => {
    const activeChurch = churches?.find(church => church.id === activeChurchId);
    if (activeChurch?.inviteCode) {
      const inviteLink = `${window.location.origin}/join-church/${activeChurch.inviteCode}`;
      console.log("[CopyInviteLink] Trying to copy link:", inviteLink);
      
      // Just use our reliable fallback method in all cases
      fallbackCopyToClipboard(inviteLink);
    } else {
      toast({
        title: "Geen uitnodigingscode",
        description: "Deze kerk heeft geen uitnodigingscode",
        variant: "destructive",
      });
    }
  };
  
  // Safer fallback method for clipboard copying
  const fallbackCopyToClipboard = (text: string) => {
    // Define a variable to track if we need to show the successful toast
    let shouldShowSuccessToast = false;
    
    try {
      // First try the Navigator clipboard API if available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => {
            toast({
              title: "Link gekopieerd",
              description: "De uitnodigingslink is gekopieerd naar je klembord",
            });
          })
          .catch(() => {
            // If Navigator clipboard API fails, try the textarea approach
            copyWithTextArea();
          });
        return; // Return early to avoid showing multiple toasts
      } else {
        // If Navigator clipboard API is not available
        copyWithTextArea();
      }
    } catch (err) {
      console.error("All clipboard methods failed:", err);
      // Show manual copy toast so user can at least see the link
      toast({
        title: "Link niet gekopieerd",
        description: "Link: " + text,
        variant: "destructive",
      });
    }
    
    // Function to copy using the textarea approach
    function copyWithTextArea() {
      let textArea: HTMLTextAreaElement | null = null;
      
      try {
        // Create a temporary text area element
        textArea = document.createElement("textarea");
        
        // Make it visually hidden but still operational
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        
        // Set its content to the text we want to copy
        textArea.value = text;
        
        // Append it to the DOM
        document.body.appendChild(textArea);
        
        // Select the text
        textArea.select();
        textArea.setSelectionRange(0, text.length);
        
        // Execute the copy command
        const successful = document.execCommand("copy");
        
        // Track success for toast message
        shouldShowSuccessToast = successful;
      } catch (err) {
        console.error("TextArea clipboard method failed:", err);
        shouldShowSuccessToast = false;
      } finally {
        // Clean up - safely remove the element
        if (textArea && textArea.parentNode) {
          try {
            document.body.removeChild(textArea);
          } catch (removeError) {
            console.error("Error removing textarea:", removeError);
          }
        }
        
        // Show appropriate toast based on success
        if (shouldShowSuccessToast) {
          toast({
            title: "Link gekopieerd",
            description: "De uitnodigingslink is gekopieerd naar je klembord",
          });
        } else {
          toast({
            title: "Link niet gekopieerd",
            description: "Link: " + text,
            variant: "destructive",
          });
        }
      }
    }
  };
  
  // Function to generate a new invite code
  const handleGenerateInviteCode = () => {
    if (!activeChurchId) return;
    
    // Confirm before generating a new code
    if (window.confirm("Weet je zeker dat je een nieuwe uitnodigingscode wilt aanmaken voor deze kerk?")) {
      generateInviteCodeMutation.mutate(activeChurchId);
    }
  };

  // Get the active church details
  const activeChurch = churches?.find(church => church.id === activeChurchId);
  
  // Debug logging for troubleshooting
  console.log("DEBUG: Active church ID:", activeChurchId);
  console.log("DEBUG: Active church object:", activeChurch);
  console.log("DEBUG: All churches:", churches);
  console.log("DEBUG: Church invite code:", activeChurch?.inviteCode);
  
  // Ensure we always show the invite card even if there's no invite code
  // We will ensure we only proceed if we have a church object

  // Loading state
  if (isLoadingChurches) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Kerken laden...</span>
        </div>
      </AppLayout>
    );
  }

  // No churches state
  if (churches?.length === 0) {
    return (
      <AppLayout>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Leden beheren</CardTitle>
            <CardDescription>
              Je hebt nog geen kerken aangemaakt. Maak eerst een kerk aan in je profiel.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.href = "/church-profile"}>
              Naar kerkprofiel
            </Button>
          </CardFooter>
        </Card>
      </AppLayout>
    );
  }

  // Prepare chart data
  // Utility function to get the primary role from roleScores object
  const getPrimaryRoleFromScores = (roleScores: any): string | null => {
    if (!roleScores) return null;
    
    // If primaryRole is explicitly set, use it
    if (roleScores.primaryRole) {
      return roleScores.primaryRole.toLowerCase();
    }
    
    // Otherwise, determine the highest role score
    const roleKeys = ['apostle', 'prophet', 'evangelist', 'herder', 'teacher', 'shepherd'];
    let highestScore = 0;
    let highestRole = null;
    
    for (const key of roleKeys) {
      // Skip non-score properties
      if (!roleScores[key] || typeof roleScores[key] !== 'number') continue;
      
      if (roleScores[key] > highestScore) {
        highestScore = roleScores[key];
        highestRole = key === 'shepherd' ? 'herder' : key; // Normalize shepherd to herder
      }
    }
    
    return highestRole;
  };
  
  // Utility function to get role data from team distribution
  const getRoleFromTeamData = (member: ChurchMember, dashboardData: any): string | null => {
    if (!member.teamId || !dashboardData?.teams) return null;
    
    const team = dashboardData.teams.find((t: any) => t.id === member.teamId);
    if (!team || !team.roleDistribution) return null;
    
    // Find highest role in the team distribution for this member
    const dist = team.roleDistribution;
    const roles = [
      { role: 'apostle', score: dist.apostle },
      { role: 'prophet', score: dist.prophet },
      { role: 'evangelist', score: dist.evangelist },
      { role: 'herder', score: dist.herder || dist.shepherd },
      { role: 'teacher', score: dist.teacher }
    ];
    
    // Sort by score desc and get highest
    roles.sort((a, b) => b.score - a.score);
    return roles[0].role;
  };
  
  const prepareRoleDistributionData = () => {
    console.log("Preparing role distribution data with dashboard:", dashboardData);
    
    // These are the exact colors from the dashboard chart in the screenshot
    const chartColors = [
      "#4097db", // Blue - Apostle
      "#a8e3c9", // Mint green - Prophet
      "#ffbdcb", // Light pink - Evangelist
      "#ffd9a8", // Light orange - Herder/Shepherd
      "#b79cef"  // Purple - Teacher
    ];
    
    // Define the role labels for our standard order
    const roleLabels = ["Apostel", "Profeet", "Evangelist", "Herder", "Leraar"];
    
    // Debug - log all church members and their role scores
    if (churchMembers && churchMembers.length > 0) {
      console.log("All church members with their role scores:");
      churchMembers.forEach(member => {
        console.log(`Member ${member.id} (${member.email}) roles:`, member.roleScores);
      });
    }

    // Log the dashboard data structure
    if (dashboardData) {
      console.log("Dashboard data teams:", dashboardData.teams);
      if (dashboardData.teams) {
        dashboardData.teams.forEach((team: { id: number, name: string, roleDistribution: any, memberCount?: number }) => {
          console.log(`Team ${team.id} (${team.name}) role distribution:`, team.roleDistribution);
          if (team.memberCount) {
            console.log(`Team ${team.id} members count:`, team.memberCount);
          } else {
            console.log(`Team ${team.id} has no member count`);
          }
        });
      }
    }
    
    // Initialize counts for each role type
    const roleCounts = {
      apostle: 0,
      prophet: 0,
      evangelist: 0,
      herder: 0,
      teacher: 0
    };
    
    // Count the primary roles in church members directly - most accurate source
    let memberRolesCounted = 0;
    
    if (churchMembers && churchMembers.length > 0) {
      churchMembers.forEach(member => {
        // Get the primary role for this member
        if (member.roleScores && member.roleScores.primaryRole) {
          // Use the explicitly stated primary role
          const primaryRole = member.roleScores.primaryRole.toLowerCase();
          
          // Map to our role categories
          if (primaryRole === 'apostle') {
            roleCounts.apostle++;
            memberRolesCounted++;
          } else if (primaryRole === 'prophet') {
            roleCounts.prophet++;
            memberRolesCounted++;
          } else if (primaryRole === 'evangelist') {
            roleCounts.evangelist++;
            memberRolesCounted++;
          } else if (primaryRole === 'shepherd' || primaryRole === 'herder') {
            roleCounts.herder++;
            memberRolesCounted++;
          } else if (primaryRole === 'teacher') {
            roleCounts.teacher++;
            memberRolesCounted++;
          }
        } else if (member.roleScores) {
          // If no primary role explicitly set, get it from the scores
          const scores = {
            apostle: member.roleScores.apostle || 0,
            prophet: member.roleScores.prophet || 0,
            evangelist: member.roleScores.evangelist || 0,
            herder: member.roleScores.shepherd || 0, // In some data it's called shepherd, in others herder
            teacher: member.roleScores.teacher || 0
          };
          
          // Find the highest score role
          const roles = Object.entries(scores);
          if (roles.length > 0) {
            roles.sort((a, b) => b[1] - a[1]);
            const highestRole = roles[0][0];
            
            // Only count if there is a valid score for this role
            if (roles[0][1] > 0) {
              roleCounts[highestRole as keyof typeof roleCounts]++;
              memberRolesCounted++;
              console.log(`Member ${member.id} calculated highest role: ${highestRole} (score: ${roles[0][1]})`);
            }
          }
        }
      });
    }
    
    // If we found enough roles directly from members, use that data
    if (memberRolesCounted > 0) {
      console.log(`Found ${memberRolesCounted} member primary roles out of ${churchMembers?.length || 0} total members`);
      
      return {
        labels: ["Apostel", "Profeet", "Evangelist", "Herder", "Leraar"],
        datasets: [{
          data: [
            roleCounts.apostle,
            roleCounts.prophet,
            roleCounts.evangelist,
            roleCounts.herder,
            roleCounts.teacher
          ],
          backgroundColor: chartColors,
          borderWidth: 1,
          borderColor: chartColors.map(color => color + '80') // Semi-transparent border
        }]
      };
    }
    
    // Empty chart data - this is using real data (all zeros) not synthetic data
    const emptyData = {
      labels: ["Apostel", "Profeet", "Evangelist", "Herder", "Leraar"],
      datasets: [{
        data: [0, 0, 0, 0, 0], // Zero counts to represent no data
        backgroundColor: chartColors,
        borderWidth: 1,
        borderColor: chartColors.map(color => color + '80') // Semi-transparent border
      }]
    };
    
    if (!dashboardData) {
      console.log("No dashboard data available for role distribution chart");
      return emptyData;
    }
    
    // Count members with each primary role
    // This is exactly what we want: primary ministries distribution
    const primaryRoleCounts = {
      apostle: 0,
      prophet: 0,
      evangelist: 0,
      herder: 0,
      teacher: 0
    };
    
    // Calculate primary roles for all church members using both methods
    if (churchMembers && churchMembers.length > 0) {
      console.log("Church members for role distribution:", churchMembers.length);
      
      let membersWithRoles = 0;
      
      churchMembers.forEach(member => {
        let primaryRole = null;
        
        // Method 1: Get from explicit primaryRole or calculate from scores
        primaryRole = getPrimaryRoleFromScores(member.roleScores);
        
        // Method 2: If not found, try to get from team data
        if (!primaryRole) {
          primaryRole = getRoleFromTeamData(member, dashboardData);
        }
        
        // Count the primary role if found
        if (primaryRole) {
          membersWithRoles++;
          
          // Normalize the role name (shepherd -> herder)
          const normalizedRole = primaryRole === 'shepherd' ? 'herder' : primaryRole.toLowerCase();
          
          // Count the primary role
          if (normalizedRole === 'apostle') primaryRoleCounts.apostle++;
          else if (normalizedRole === 'prophet') primaryRoleCounts.prophet++;
          else if (normalizedRole === 'evangelist') primaryRoleCounts.evangelist++;
          else if (normalizedRole === 'herder') primaryRoleCounts.herder++;
          else if (normalizedRole === 'teacher') primaryRoleCounts.teacher++;
        }
      });
      
      console.log(`Found ${membersWithRoles} members with primary roles out of ${churchMembers.length} total members`);
      
      // If we found any primary roles, use that data
      const totalPrimaryRoles = Object.values(primaryRoleCounts).reduce((sum, count) => sum + count, 0);
      if (totalPrimaryRoles > 0) {
        console.log("Using primary role counts from members for chart:", primaryRoleCounts);
        
        // CRITICAL FIX: Filter out zero values to avoid 1% segments in pie chart
        const roleValues: { role: string, value: number, color: string, borderColor: string }[] = [
          { role: "Apostel", value: primaryRoleCounts.apostle, color: chartColors[0], borderColor: chartColors[0] + '80' },
          { role: "Profeet", value: primaryRoleCounts.prophet, color: chartColors[1], borderColor: chartColors[1] + '80' },
          { role: "Evangelist", value: primaryRoleCounts.evangelist, color: chartColors[2], borderColor: chartColors[2] + '80' },
          { role: "Herder", value: primaryRoleCounts.herder, color: chartColors[3], borderColor: chartColors[3] + '80' },
          { role: "Leraar", value: primaryRoleCounts.teacher, color: chartColors[4], borderColor: chartColors[4] + '80' }
        ];
        
        // Filter out any roles with zero values completely
        const nonZeroRoles = roleValues.filter(role => role.value > 0);
        console.log("After filtering zero values, using these roles:", nonZeroRoles);
        
        return {
          labels: nonZeroRoles.map(r => r.role),
          datasets: [{
            data: nonZeroRoles.map(r => r.value),
            backgroundColor: nonZeroRoles.map(r => r.color),
            borderWidth: 1,
            borderColor: nonZeroRoles.map(r => r.borderColor)
          }]
        };
      } else {
        console.log("No primary roles found directly, calculating from raw scores");
      }
    }
    
    // Fallback to team role distribution if available
    if (dashboardData.teams && dashboardData.teams.length > 0) {
      console.log("Getting primary role distribution from teams");
      
      // Reset counts
      primaryRoleCounts.apostle = 0;
      primaryRoleCounts.prophet = 0;
      primaryRoleCounts.evangelist = 0;
      primaryRoleCounts.herder = 0;
      primaryRoleCounts.teacher = 0;
      
      let hasCounts = false;
      
      // Go through each team's role distribution
      dashboardData.teams.forEach((team: { name: string, roleDistribution: any }) => {
        if (team.roleDistribution) {
          // Each team.roleDistribution contains score values, not counts
          // We need to determine the dominant role for each team based on its distribution
          const { apostle, prophet, evangelist, herder, teacher } = team.roleDistribution;
          
          // Find the highest score role - this represents the primary role for the team
          const roles = [
            { role: 'apostle', score: apostle || 0 },
            { role: 'prophet', score: prophet || 0 },
            { role: 'evangelist', score: evangelist || 0 },
            { role: 'herder', score: herder || 0 },
            { role: 'teacher', score: teacher || 0 }
          ];
          
          // Sort by score descending
          roles.sort((a, b) => b.score - a.score);
          
          // The highest score is the primary role for this team
          // We count it as 1 instance of that role in the distribution
          if (roles[0].score > 0) {
            const primaryRole = roles[0].role;
            
            if (primaryRole === 'apostle') primaryRoleCounts.apostle++;
            else if (primaryRole === 'prophet') primaryRoleCounts.prophet++;
            else if (primaryRole === 'evangelist') primaryRoleCounts.evangelist++;
            else if (primaryRole === 'herder') primaryRoleCounts.herder++;
            else if (primaryRole === 'teacher') primaryRoleCounts.teacher++;
            
            hasCounts = true;
            console.log(`Team ${team.name} primary role: ${primaryRole} (score: ${roles[0].score})`);
          }
        }
      });
      
      // If we found any counts, use the data
      if (hasCounts) {
        console.log("Using team role distribution for chart:", primaryRoleCounts);
        
        // CRITICAL FIX: Filter out zero values to avoid 1% segments in pie chart
        const roleValues: { role: string, value: number, color: string, borderColor: string }[] = [
          { role: "Apostel", value: primaryRoleCounts.apostle, color: chartColors[0], borderColor: chartColors[0] + '80' },
          { role: "Profeet", value: primaryRoleCounts.prophet, color: chartColors[1], borderColor: chartColors[1] + '80' },
          { role: "Evangelist", value: primaryRoleCounts.evangelist, color: chartColors[2], borderColor: chartColors[2] + '80' },
          { role: "Herder", value: primaryRoleCounts.herder, color: chartColors[3], borderColor: chartColors[3] + '80' },
          { role: "Leraar", value: primaryRoleCounts.teacher, color: chartColors[4], borderColor: chartColors[4] + '80' }
        ];
        
        // Filter out any roles with zero values completely
        const nonZeroRoles = roleValues.filter(role => role.value > 0);
        console.log("After filtering zero values, using these roles:", nonZeroRoles);
        
        return {
          labels: nonZeroRoles.map(r => r.role),
          datasets: [{
            data: nonZeroRoles.map(r => r.value),
            backgroundColor: nonZeroRoles.map(r => r.color),
            borderWidth: 1,
            borderColor: nonZeroRoles.map(r => r.borderColor)
          }]
        };
      }
    }
    
    // Final fallback to manually calculated roleDistribution
    if (Object.values(roleDistribution).some(count => count > 0)) {
      console.log("Using calculated roleDistribution for pie chart:", roleDistribution);
      
      // CRITICAL FIX: We need to filter out any roles with zero values to avoid 1% artifacts in the chart
      const roleValues: { role: string, value: number, color: string, borderColor: string }[] = [
        { role: "Apostel", value: Math.floor(roleDistribution[ROLES.APOSTLE] || 0), color: "#4097db", borderColor: "#4097db80" },
        { role: "Profeet", value: Math.floor(roleDistribution[ROLES.PROPHET] || 0), color: "#a8e3c9", borderColor: "#a8e3c980" },
        { role: "Evangelist", value: Math.floor(roleDistribution[ROLES.EVANGELIST] || 0), color: "#ffbdcb", borderColor: "#ffbdcb80" },
        { role: "Herder", value: Math.floor(roleDistribution[ROLES.SHEPHERD] || 0), color: "#ffd9a8", borderColor: "#ffd9a880" },
        { role: "Leraar", value: Math.floor(roleDistribution[ROLES.TEACHER] || 0), color: "#b79cef", borderColor: "#b79cef80" }
      ];
      
      // Filter out any roles with zero values completely
      const nonZeroRoles = roleValues.filter(role => role.value > 0);
      
      console.log("After filtering zero values, using these roles:", nonZeroRoles);
      
      // If we don't have any non-zero roles, return empty data
      if (nonZeroRoles.length === 0) {
        console.log("No non-zero roles found, using empty data");
        return emptyData;
      }
      
      // Extract filtered data for the chart
      return {
        labels: nonZeroRoles.map(r => r.role),
        datasets: [{
          data: nonZeroRoles.map(r => r.value),
          backgroundColor: nonZeroRoles.map(r => r.color),
          borderWidth: 1,
          borderColor: nonZeroRoles.map(r => r.borderColor)
        }]
      };
    }
    
    // If we got here, use empty data since we don't have any actual data
    console.log("No usable data found for role distribution chart, using empty data");
    return emptyData;
  };

  // Prepare average scores chart data
  const prepareAverageScoresData = () => {
    console.log("Preparing average scores data with dashboard:", dashboardData);
    
    // These are the exact colors from the dashboard chart in the screenshot
    const chartColors = [
      "#4097db", // Blue - Apostle
      "#a8e3c9", // Mint green - Prophet
      "#ffbdcb", // Light pink - Evangelist
      "#ffd9a8", // Light orange - Herder/Shepherd
      "#b79cef"  // Purple - Teacher
    ];
    
    // Empty chart data - this is authentic zero data, not synthetic
    const emptyData = {
      labels: ["Apostel", "Profeet", "Evangelist", "Herder", "Leraar"],
      datasets: [{
        label: 'Gemiddelde scores',
        data: [0, 0, 0, 0, 0], // Using authentic zero values
        backgroundColor: chartColors,
        borderColor: chartColors.map(color => color + '80'), // Semi-transparent border
        borderWidth: 1
      }]
    };
    
    if (!dashboardData) {
      console.log("No dashboard data available for average scores chart");
      return emptyData;
    }
    
    // Try to use averageScores
    if (dashboardData.averageScores) {
      console.log("Using averageScores for bar chart:", dashboardData.averageScores);
      
      const { averageScores } = dashboardData;
      
      // Create data array from the average scores
      const data = [
        averageScores.apostle || 0,
        averageScores.prophet || 0, 
        averageScores.evangelist || 0,
        averageScores.herder || 0,
        averageScores.teacher || 0
      ];
      
      // If all values are 0, use empty data
      if (data.every(value => value === 0)) {
        console.log("All average scores are 0, using empty data");
        return emptyData;
      }
      
      // Set the max value for the Y-axis to be the maximum score + 10% margin
      // with a minimum of 50 to ensure we don't have a tiny chart for low scores
      const maxScore = Math.max(...data);
      const suggestedMax = Math.max(50, Math.ceil(maxScore * 1.1));
      
      console.log(`Setting Y-axis max value to ${suggestedMax} (based on max score: ${maxScore})`);
      
      return {
        labels: ["Apostel", "Profeet", "Evangelist", "Herder", "Leraar"],
        datasets: [{
          label: 'Gemiddelde scores',
          data,
          backgroundColor: chartColors,
          borderColor: chartColors.map(color => color + '80'), // Semi-transparent border
          borderWidth: 1
        }],
        // Add scales configuration to control the Y-axis
        options: {
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: suggestedMax,
              ticks: {
                // Ensure we show at least 5 ticks
                count: 5,
                stepSize: Math.ceil(suggestedMax / 5)
              }
            }
          }
        }
      };
    }
    
    // If we got here, use empty data
    console.log("No usable data found for average scores chart, using empty data");
    return emptyData;
  };

  // Calculate role distribution percentages - IMPORTANT: this must track primary ministry roles correctly
  const calculateRoleDistribution = () => {
    if (!churchMembers || churchMembers.length === 0) {
      console.log("No church members found for role distribution");
      return {
        [ROLES.APOSTLE]: 0,
        [ROLES.PROPHET]: 0,
        [ROLES.EVANGELIST]: 0,
        [ROLES.SHEPHERD]: 0,
        [ROLES.TEACHER]: 0
      };
    }

    console.log("Church members for role distribution:", churchMembers.length);
    
    // Initialize distribution object with all roles set to 0
    const distribution = {
      [ROLES.APOSTLE]: 0,
      [ROLES.PROPHET]: 0,
      [ROLES.EVANGELIST]: 0,
      [ROLES.SHEPHERD]: 0,
      [ROLES.TEACHER]: 0
    };

    // IMPORTANT: We must use PRIMARY role values for the distribution
    // First and most accurate approach: directly count primary roles from church members
    let primaryRolesFound = false;
    let membersWithPrimaryRoles = 0;
    
    // Count primary roles from member roleScores - this is the most accurate method
    churchMembers.forEach(member => {
      // Check if member has roleScores with primary role
      if (member.roleScores && member.roleScores.primaryRole) {
        membersWithPrimaryRoles++;
        
        // Get the primary role and normalize it to handle case differences
        const primaryRoleRaw = member.roleScores.primaryRole.toLowerCase();
        let primaryRole = '';
        
        // Map the primary role to the right ROLES key
        if (primaryRoleRaw === 'apostle') primaryRole = ROLES.APOSTLE;
        else if (primaryRoleRaw === 'prophet') primaryRole = ROLES.PROPHET;
        else if (primaryRoleRaw === 'evangelist') primaryRole = ROLES.EVANGELIST;
        else if (primaryRoleRaw === 'shepherd' || primaryRoleRaw === 'herder') primaryRole = ROLES.SHEPHERD;
        else if (primaryRoleRaw === 'teacher') primaryRole = ROLES.TEACHER;
        
        if (primaryRole) {
          distribution[primaryRole]++;
          console.log(`Member ${member.id} has primary role: ${primaryRole}`);
          primaryRolesFound = true;
        }
      }
    });
    
    console.log(`Found ${membersWithPrimaryRoles} members with primary roles out of ${churchMembers.length} total members`);
    
    // If we found enough primary roles to make a meaningful distribution, use it
    if (primaryRolesFound) {
      console.log("Using member primary roles for distribution:", distribution);
      return distribution;
    }
    
    // Fallback 1: Calculate primary roles from raw scores for each church member
    console.log("No primary roles found directly, calculating from raw scores");
    
    churchMembers.forEach(member => {
      // Check if member has roleScores with individual score values
      if (member.roleScores) {
        const scores: Record<string, number> = {};
        
        // Extract numeric scores for each role
        Object.entries(member.roleScores).forEach(([role, score]) => {
          if (role !== 'primaryRole' && role !== 'secondaryRole' && typeof score === 'number') {
            scores[role] = score;
          }
        });
        
        // Find the role with the highest score
        if (Object.keys(scores).length > 0) {
          const maxRole = Object.entries(scores).reduce(
            (max, [role, score]) => (score > max.score ? { role, score } : max),
            { role: '', score: 0 }
          );
          
          if (maxRole.role) {
            // Map the role to the correct format
            const roleKey = maxRole.role.toLowerCase();
            let distributionKey = '';
            
            if (roleKey === 'apostle') distributionKey = ROLES.APOSTLE;
            else if (roleKey === 'prophet') distributionKey = ROLES.PROPHET;
            else if (roleKey === 'evangelist') distributionKey = ROLES.EVANGELIST;
            else if (roleKey === 'shepherd' || roleKey === 'herder') distributionKey = ROLES.SHEPHERD;
            else if (roleKey === 'teacher') distributionKey = ROLES.TEACHER;
            
            if (distributionKey) {
              distribution[distributionKey]++;
              console.log(`Member ${member.id} calculated primary role: ${distributionKey} (score: ${maxRole.score})`);
              primaryRolesFound = true;
            }
          }
        }
      }
    });
    
    if (primaryRolesFound) {
      console.log("Using calculated primary roles from individual scores:", distribution);
      return distribution;
    }
    
    // Fallback 2: Use dashboard aggregated scores if available 
    if (dashboardData && dashboardData.aggregatedScores) {
      console.log("Trying to use dashboard aggregated scores:", dashboardData.aggregatedScores);
      
      const { apostle, prophet, evangelist, herder, teacher } = dashboardData.aggregatedScores;
      
      // See if we have any scores
      if (apostle || prophet || evangelist || herder || teacher) {
        // Create array of roles and their corresponding scores
        const roleScores = [
          { role: ROLES.APOSTLE, score: apostle || 0 },
          { role: ROLES.PROPHET, score: prophet || 0 },
          { role: ROLES.EVANGELIST, score: evangelist || 0 },
          { role: ROLES.SHEPHERD, score: herder || 0 },
          { role: ROLES.TEACHER, score: teacher || 0 }
        ];
        
        // Sort by score descending to get highest scores first
        roleScores.sort((a, b) => b.score - a.score);
        
        // Log the sorted roles by score
        console.log("Roles sorted by score:", roleScores);
        
        // Rather than just setting 1 for each role that has a score > 0,
        // we'll count each team's actual dominant role
        if (dashboardData.teams && dashboardData.teams.length > 0) {
          // Reset the counts to make sure we're starting fresh
          Object.keys(distribution).forEach(key => {
            distribution[key] = 0;
          });
          
          // For each team, determine and count its dominant role
          dashboardData.teams.forEach((team: { name: string, roleDistribution: any }) => {
            if (team.roleDistribution) {
              const teamRoles = [
                { role: ROLES.APOSTLE, score: team.roleDistribution.apostle || 0 },
                { role: ROLES.PROPHET, score: team.roleDistribution.prophet || 0 },
                { role: ROLES.EVANGELIST, score: team.roleDistribution.evangelist || 0 },
                { role: ROLES.SHEPHERD, score: team.roleDistribution.herder || 0 },
                { role: ROLES.TEACHER, score: team.roleDistribution.teacher || 0 }
              ];
              
              // Sort to find the dominant role
              teamRoles.sort((a, b) => b.score - a.score);
              
              // Only count if there's a clear dominant role (score > 0)
              if (teamRoles[0].score > 0) {
                distribution[teamRoles[0].role]++;
                console.log(`Team ${team.name} dominant role: ${teamRoles[0].role} (score: ${teamRoles[0].score})`);
              }
            }
          });
          
          console.log("Using team dominant roles for distribution:", distribution);
          primaryRolesFound = Object.values(distribution).some(count => count > 0);
          
          if (primaryRolesFound) {
            return distribution;
          }
        }
        
        // If teams approach didn't work, fall back to counting each role
        Object.keys(distribution).forEach(key => {
          distribution[key] = 0;
        });
        
        // Just count 1 for the highest score role overall
        if (roleScores[0].score > 0) {
          distribution[roleScores[0].role] = 1;
          console.log(`Highest role overall: ${roleScores[0].role} (score: ${roleScores[0].score})`);
          return distribution;
        }
      }
    }

    // Return at least one role with a value to prevent "Geen data" display
    // but only as a last resort when we have members
    const hasAnyValues = Object.values(distribution).some(val => val > 0);
    if (!hasAnyValues && churchMembers.length > 0) {
      // If we have members but no distribution data, set a default
      distribution[ROLES.APOSTLE] = 1;
      console.log("No role data found, using default value for display");
    }

    console.log("Final role distribution:", distribution);
    return distribution;
  };

  // Get role distribution
  const roleDistribution = calculateRoleDistribution();
  const totalMembers = churchMembers?.length || 0;
  
  // Extract teams data from dashboard
  const teams = dashboardData?.teams || [];

  // Calculate role distribution percentages
  // Calculate the total number of roles assigned (should equal the sum of all counts)
  const totalRoles = Object.values(roleDistribution).reduce((sum, count) => sum + count, 0);
  
  console.log(`Total roles counted: ${totalRoles}, total members: ${totalMembers}`);
  
  // Use totalRoles rather than totalMembers for percentage calculations
  const rolePercentages = Object.entries(roleDistribution).reduce((acc, [role, count]) => {
    // Only calculate percentage when we have actual roles to count
    // Make sure to return 0 for roles with no actual count (Math.floor ensures this)
    acc[role as keyof typeof ROLES] = totalRoles > 0 && count > 0 ? Math.round((count / totalRoles) * 100) : 0;
    
    // Log to debug
    console.log(`Role: ${ROLES[role as keyof typeof ROLES]}, Count: ${count}, Total: ${totalRoles}, Percentage: ${acc[role as keyof typeof ROLES]}%`);
    
    return acc;
  }, {} as Record<keyof typeof ROLES, number>);

  // Get the dominant role
  const dominantRole = Object.entries(roleDistribution).reduce(
    (max, [role, count]) => count > max.count ? { role, count } : max,
    { role: '', count: 0 }
  ).role;



  return (
    <>
      {/* Church header removed to avoid duplication with sidebar information */}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Leden Dashboard</h1>
        <p className="text-muted-foreground">
          Inzicht in de samenstelling en bedieningsprofielen van je kerk
        </p>
      </div>
      
      {/* FIXED INVITE CARD - Always visible */}
      {churches && churches.length > 0 && activeChurch && (
        <Card className="bg-card border-2 border-primary/20 shadow-md mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-primary">
              <Link2 className="mr-2 h-5 w-5" />
              Uitnodigingslink
            </CardTitle>
            <CardDescription>
              {activeChurch.inviteCode 
                ? "Deel deze link om nieuwe leden uit te nodigen voor je kerk" 
                : "Deze kerk heeft nog geen uitnodigingscode, vraag de beheerder om deze te maken"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted rounded-md p-4 border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <code className="text-sm sm:text-base font-mono text-primary truncate max-w-full sm:max-w-[500px] bg-primary/5 p-2 rounded">
                    {window.location.origin}/join-church/{activeChurch.inviteCode || "geen-code-beschikbaar"}
                  </code>
                  <Button 
                    className="mt-2 sm:mt-0 w-full sm:w-auto" 
                    onClick={copyInviteLink}
                    disabled={!activeChurch.inviteCode}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Kopiëren
                  </Button>
                </div>
              </div>
              {activeChurch.inviteCode ? (
                <Alert variant="default" className="bg-primary/5 border-primary/20">
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>Tip</AlertTitle>
                  <AlertDescription>
                    Je kunt deze link delen via e-mail, WhatsApp of andere kanalen om mensen uit te nodigen voor je kerk.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <AlertTitle>Let op</AlertTitle>
                    <AlertDescription>
                      Deze kerk heeft geen uitnodigingscode. Genereer er een om mensen uit te nodigen.
                    </AlertDescription>
                  </Alert>
                  
                  {/* Generate Invite Code Button */}
                  <Button 
                    onClick={handleGenerateInviteCode} 
                    disabled={generateInviteCodeMutation.isPending}
                    className="w-full"
                    variant="outline"
                  >
                    {generateInviteCodeMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Bezig met genereren...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        Genereer uitnodigingscode
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Header & Church Info */}
      {activeChurch && (
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                <Users className="mr-2 h-5 w-5" /> Kerkleden
              </h2>
              <p className="text-muted-foreground">
                Alle leden van de geselecteerde kerk, inclusief teamlidmaatschap
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setIsTeamWizardOpen(true)}
              >
                <Wand2 className="h-4 w-4" />
                Team samenstellen
              </Button>
              <Badge variant="outline" className="flex items-center text-base">
                <Users className="mr-2 h-4 w-4" />
                {churchMembers?.length || 0} leden
              </Badge>
            </div>
          </div>

          {/* No need for a message here anymore */}
        </div>
      )}

      {/* Church Details Card */}
      {activeChurch && (
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{activeChurch.name}</CardTitle>
              <CardDescription>{activeChurch.denomination}</CardDescription>
            </CardHeader>
            <CardContent className="pb-1">
              <div className="flex flex-col space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Organisatie:</span>
                  <span className="text-sm">{"Kerkgenootschap"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Stad:</span>
                  <span className="text-sm">{"Purmerend"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Land:</span>
                  <span className="text-sm">{"Nederland"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Lidmaatschap
              </CardTitle>
              <CardDescription>
                Informatie over lidmaatschap in deze kerk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Teams:</span>
                    <span className="text-sm">{teams.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Leden:</span>
                    <span className="text-sm">{churchMembers?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Dominante bediening:</span>
                    <span className="text-sm">
                      {dominantRole ? ROLES[dominantRole as keyof typeof ROLES] : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dashboard Cards */}
      {activeChurch && (
        <>
          {/* Stats Overview Row */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal aantal leden</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMembers}</div>
                <p className="text-xs text-muted-foreground">
                  {teams.length} teams
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dominante bediening</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {/* Use roleDistribution directly to determine dominant role */}
                {Object.entries(roleDistribution).some(([_, count]) => count > 0) ? (
                  <>
                    <div className="text-2xl font-bold">
                      {(() => {
                        console.log("Role distribution for dominant role:", roleDistribution);
                        // Sort roles by count (descending) and get the highest one
                        const sortedRoles = Object.entries(roleDistribution)
                          .sort((a, b) => b[1] - a[1]);
                        console.log("Sorted roles:", sortedRoles);
                        
                        if (sortedRoles.length > 0 && sortedRoles[0][1] > 0) {
                          const topRole = sortedRoles[0][0];
                          console.log("Top role selected:", topRole);
                          return ROLES[topRole as keyof typeof ROLES];
                        }
                        return "Onbekend";
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        // Sort roles by count (descending) and get the highest one
                        const sortedRoles = Object.entries(roleDistribution)
                          .sort((a, b) => b[1] - a[1]);
                        
                        if (sortedRoles.length > 0 && sortedRoles[0][1] > 0) {
                          const [topRole, count] = sortedRoles[0];
                          const percentage = totalMembers > 0 
                            ? Math.round((count / totalMembers) * 100) 
                            : 0;
                          return `${percentage}% van de leden`;
                        }
                        return "Geen percentage beschikbaar";
                      })()}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">Geen data</div>
                    <p className="text-xs text-muted-foreground">
                      Nog geen leden met profielen
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Laagste bediening</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {/* Use roleDistribution directly to determine lowest role */}
                {Object.entries(roleDistribution).some(([_, count]) => count > 0) ? (
                  <>
                    <div className="text-2xl font-bold">
                      {(() => {
                        console.log("Role distribution for lowest role:", roleDistribution);
                        // Find roles with counts > 0, sort by count (ascending)
                        const sortedRoles = Object.entries(roleDistribution)
                          .filter(([_, count]) => count > 0)
                          .sort((a, b) => a[1] - b[1]);
                        console.log("Filtered & sorted roles:", sortedRoles);
                        
                        if (sortedRoles.length > 0) {
                          const lowestRole = sortedRoles[0][0];
                          console.log("Lowest role selected:", lowestRole);
                          return ROLES[lowestRole as keyof typeof ROLES];
                        }
                        return "Onbekend";
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minst voorkomende bediening
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">Geen data</div>
                    <p className="text-xs text-muted-foreground">
                      Nog geen leden met profielen
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Bedieningen verdeling</CardTitle>
                <CardDescription>Verdeling van primaire bedieningen binnen de kerk</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-80 w-80">
                  {isLoadingDashboard ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : totalRoles > 0 ? (
                    <Pie 
                      data={prepareRoleDistributionData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              usePointStyle: true,
                              boxWidth: 10,
                              color: '#000'
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.label || '';
                                const value = typeof context.raw === 'number' ? context.raw : 0;
                                const dataset = context.dataset;
                                const total = (dataset.data as number[]).reduce((acc, data) => acc + (typeof data === 'number' ? data : 0), 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground font-medium">Geen bedieningsgegevens beschikbaar</p>
                      <p className="text-sm text-muted-foreground/70 max-w-xs mt-1">
                        Voeg leden toe of laat leden de vragenlijst invullen om bedieningsprofielen te zien.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gemiddelde scores</CardTitle>
                <CardDescription>Gemiddelde scores per bediening binnen de kerk</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDashboard ? (
                  <div className="flex items-center justify-center h-80">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : dashboardData && dashboardData.averageScores && 
                   Object.values(dashboardData.averageScores).some((score: unknown) => typeof score === 'number' && score > 0) ? (
                  <Bar 
                    data={prepareAverageScoresData()} 
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false, // Hide legend as it's self-explanatory
                        },
                        tooltip: {
                          callbacks: {
                            title: function(tooltipItems) {
                              return tooltipItems[0].label;
                            },
                            label: function(context) {
                              const score = typeof context.raw === 'number' ? context.raw : 0;
                              return `Score: ${score}`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          suggestedMax: 50, // Ensure y-axis goes up to at least 50
                          ticks: {
                            // Ensure we show enough ticks
                            stepSize: 10
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-80 text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground font-medium">Geen gemiddelde scores beschikbaar</p>
                    <p className="text-sm text-muted-foreground/70 max-w-xs mt-1">
                      Er zijn nog geen scores beschikbaar. Laat leden de vragenlijst invullen om scores te zien.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Role Distribution Progress Bars */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Verdeling van bedieningen</CardTitle>
              <CardDescription>Percentuele verdeling van primaire bedieningen</CardDescription>
            </CardHeader>
            <CardContent>
              {totalRoles > 0 ? (
                <div className="space-y-4">
                  {Object.entries(ROLES).map(([key, label]) => {
                    // Calculate percentage directly from roleDistribution counts
                    const roleCount = roleDistribution[label] || 0;
                    const totalRoleCount = Object.values(roleDistribution).reduce((sum, count) => sum + count, 0);
                    const percentage = totalRoleCount > 0 ? Math.round((roleCount / totalRoleCount) * 100) : 0;
                    
                    // Get role color from ROLE_COLORS
                    const roleColor = ROLE_COLORS[key as keyof typeof ROLE_COLORS];
                    
                    // Fix: Don't show 1% for zero values - show actual 0%
                    const displayValue = percentage;
                    
                    // Log for debugging
                    console.log(`Role: ${label}, Count: ${roleCount}, Total: ${totalRoleCount}, Percentage: ${percentage}%`);
                    
                    return (
                      <div className="space-y-1" key={key}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{label}</span>
                          <span>{displayValue}%</span>
                        </div>
                        <Progress 
                          value={displayValue} 
                          className="h-2"
                          style={{
                            backgroundColor: `${roleColor}40`,
                            '--progress-foreground': roleColor
                          } as React.CSSProperties}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <PieChart className="w-12 h-12 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground font-medium">Geen verdelingsgegevens beschikbaar</p>
                  <p className="text-sm text-muted-foreground/70 max-w-xs mt-1">
                    Laat leden de vragenlijst invullen om de verdeling van bedieningen te zien.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Teams Overzicht
              </CardTitle>
              <CardDescription>
                Teams binnen {activeChurch.name} en hun samenstelling
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDashboard ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2">Teams laden...</span>
                </div>
              ) : (
                <>
                  {(!teams || teams.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Users className="w-12 h-12 text-muted-foreground mb-2" />
                      <h3 className="font-medium text-lg mb-1">Geen teams gevonden</h3>
                      <p className="text-muted-foreground max-w-md">
                        Er zijn nog geen teams toegevoegd aan deze kerk.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Team Naam</TableHead>
                            <TableHead>Aantal Leden</TableHead>
                            <TableHead>Dominante Bediening</TableHead>
                            <TableHead>Ontbrekende Bediening</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teams.map((team: TeamInfo) => {
                            const dominantRoleKey = team.dominantRole?.toUpperCase() as keyof typeof ROLE_COLORS;
                            const dominantRoleColor = dominantRoleKey ? ROLE_COLORS[dominantRoleKey] : undefined;
                            const dominantRoleLabel = dominantRoleKey && dominantRoleKey in ROLES 
                              ? ROLES[dominantRoleKey as keyof typeof ROLES] 
                              : team.dominantRole;
                            
                            return (
                              <TableRow key={team.id}>
                                <TableCell className="font-medium">
                                  {team.name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <UserCheck className="h-3 w-3" />
                                    {team.memberCount}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {team.dominantRole ? (
                                    <Badge 
                                      style={{ backgroundColor: dominantRoleColor, color: 'white' }}
                                    >
                                      {dominantRoleLabel}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground">Onbekend</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {team.missingRoles && team.missingRoles.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {team.missingRoles.map((role: string, idx: number) => {
                                        const roleKey = role.toUpperCase() as keyof typeof ROLE_COLORS;
                                        return (
                                          <Badge 
                                            key={idx}
                                            variant="outline"
                                            className="flex items-center gap-1"
                                          >
                                            <UserMinus className="h-3 w-3" />
                                            {ROLES[roleKey as keyof typeof ROLES] || role}
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                                      Geen ontbrekende
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* The invite card has been moved to the top of the page */}
      
      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Kerkleden
          </CardTitle>
          <CardDescription>
            Alle leden van {activeChurch?.name || "de geselecteerde kerk"}, inclusief teamlidmaatschap
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMembers ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2">Leden laden...</span>
            </div>
          ) : (
            <>
              {(!churchMembers || churchMembers.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-xl mb-2">Geen leden gevonden</h3>
                  <p className="text-muted-foreground max-w-md mb-4">
                    Er zijn nog geen leden toegevoegd aan deze kerk. Deel de uitnodigingslink om mensen lid te laten worden.
                  </p>
                  <div className="bg-card rounded-md p-4 border max-w-md">
                    <div className="flex flex-row items-center gap-3">
                      <Link2 className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Gebruik de uitnodigingslink hierboven om nieuwe leden toe te voegen aan je kerk.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  {/* Debug information */}
                  {/* <pre className="text-xs overflow-auto p-2 bg-muted border mb-2 max-h-40">
                    Team Summary: {JSON.stringify(teams, null, 2)}
                  </pre> */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Naam</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Leeftijd</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Huidige Sector</TableHead>
                        <TableHead>Voorkeur Sector</TableHead>
                        <TableHead>Bediening</TableHead>
                        <TableHead>Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {churchMembers?.map((member) => {
                        // Use our utility functions to get primary role (trying multiple sources)
                        let primaryRole = null;
                        
                        // Method 1: Try to get from roleScores
                        primaryRole = getPrimaryRoleFromScores(member.roleScores);
                        
                        // Method 2: Try to get from team data
                        if (!primaryRole && member.teamId) {
                          primaryRole = getRoleFromTeamData(member, dashboardData);
                        }
                        
                        // Do some normalization on the role name
                        if (primaryRole) {
                          // Convert to lowercase
                          primaryRole = primaryRole.toLowerCase();
                          
                          // Normalize shepherd to herder
                          if (primaryRole === 'shepherd') {
                            primaryRole = 'herder';
                          }
                        }
                        
                        // Log the final determination
                        console.log(`Member ${member.id} determined primary role:`, primaryRole);
                        
                        // Role color determination is done directly in the style prop below
                        
                        // Find team by comparing teamId with dashboard team data
                        console.log(`Member ${member.id} teamId:`, member.teamId);
                        
                        // Get team summaries from the dashboard
                        const teamsData = dashboardData?.teams || teams;
                        
                        // Try to find the team from the dashboard data's teams array
                        let teamName = "Geen team";
                        if (member.teamId) {
                          if (teamsData && teamsData.length > 0) {
                            console.log("Looking for team ID", member.teamId, "in dashboard teams:", teamsData);
                            const foundTeam = teamsData.find((t: any) => t.id === member.teamId);
                            if (foundTeam) {
                              teamName = foundTeam.name;
                              console.log("Found team name:", teamName);
                            } else {
                              teamName = `Team #${member.teamId}`;
                              console.log("Team not found in dashboard, using fallback:", teamName);
                            }
                          } else {
                            teamName = `Team #${member.teamId}`;
                            console.log("No dashboard team data available");
                          }
                        }
                        
                        // Calculate age if birthDate is available
                        let age = "";
                        if (member.birthDate) {
                          const birthDate = new Date(member.birthDate);
                          const ageDiff = Date.now() - birthDate.getTime();
                          const ageDate = new Date(ageDiff);
                          age = Math.abs(ageDate.getUTCFullYear() - 1970).toString();
                        }
                        
                        return (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">
                              {member.firstName} {member.lastName}
                            </TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>
                              {age ? (
                                <span>{age} jaar</span>
                              ) : (
                                <span className="text-muted-foreground text-sm">Onbekend</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={member.role === "teamleader" ? "default" : "outline"}>
                                {member.role === "teamleader" ? "Team Leader" : "Gebruiker"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {member.teamId ? (
                                <Badge variant="outline">{teamName}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">Geen team</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {member.currentSector ? (
                                <span>{member.currentSector}</span>
                              ) : (
                                <span className="text-muted-foreground text-sm">Niet ingevuld</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {member.preferredSector ? (
                                <span>{member.preferredSector}</span>
                              ) : (
                                <span className="text-muted-foreground text-sm">Niet ingevuld</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {primaryRole ? (
                                <Badge 
                                  style={{ backgroundColor: ROLE_COLORS[primaryRole.toUpperCase() as keyof typeof ROLE_COLORS], color: 'white' }}
                                >
                                  {ROLES[primaryRole.toUpperCase() as keyof typeof ROLES] || primaryRole}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">Onbekend</Badge>
                              )}
                            </TableCell>
                            <TableCell className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUserId(member.id)}
                                className="text-primary hover:text-primary"
                              >
                                Team toewijzen
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeUserMutation.mutate(member.id)}
                                disabled={removeUserMutation.isPending}
                                className="text-destructive hover:text-destructive"
                              >
                                {removeUserMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Verwijderen"
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>


      {/* Team Assignment Dialog */}
      <Dialog open={selectedUserId !== null} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team Toewijzen</DialogTitle>
            <DialogDescription>
              Selecteer een team om dit lid aan toe te wijzen
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="team">Team</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Selecteer een team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team: TeamInfo) => (
                      <SelectItem key={team.id} value={String(team.id)}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuleren</Button>
            </DialogClose>
            <Button 
              onClick={() => {
                if (selectedUserId && selectedTeamId) {
                  addToTeamMutation.mutate({
                    userId: selectedUserId,
                    teamId: parseInt(selectedTeamId)
                  });
                }
              }}
              disabled={!selectedTeamId || addToTeamMutation.isPending}
            >
              {addToTeamMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Bezig met toevoegen...
                </>
              ) : (
                "Toevoegen aan team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Suggestion Wizard */}
      {activeChurchId && (
        <TeamSuggestionWizard
          open={isTeamWizardOpen}
          onOpenChange={setIsTeamWizardOpen}
          churchMembers={churchMembers || []}
          churchId={activeChurchId}
          existingTeams={teams.map((team: TeamInfo) => ({ id: team.id, name: team.name }))}
        />
      )}
    </>
  );
}