import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Download } from "lucide-react";
import { ROLES, ROLE_COLORS } from "@shared/constants";
import RoleChart from "@/components/RoleChart";
import { RoleResults } from "@shared/types";
import TeamMembersTable from "@/components/TeamMembersTable";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { TeamComparison } from "@/components/dashboard/church/TeamComparison";
import { TeamGapAnalysis } from "@/components/dashboard/church/TeamGapAnalysis";
import { Link } from "react-router-dom";

// Define the TeamMember interface to match what's in TeamMembersTable.tsx
// Define the TeamMember interface to match what's in TeamMembersTable.tsx
interface TeamMember {
  id: number;
  name: string;
  email: string;
  currentSector?: string;
  preferredSector?: string;
  teamId?: number;
  profile: {
    apostle: number;
    prophet: number;
    evangelist: number;
    herder: number;
    teacher: number;
  } | null;
}

interface ChurchSummary {
  id: number;
  name: string;
  logoUrl: string | null;
  totalTeams: number;
  totalMembers: number;
  denomination: string;
  location: string;
}

interface TeamSummary {
  id: number;
  name: string;
  memberCount: number;
  roleDistribution: RoleResults;
}

export default function ChurchDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [scoreView, setScoreView] = useState<"total" | "average">("total");
  const [distributionView, setDistributionView] = useState<"counts" | "percentages">("counts");
  const [selectedTeamId, setSelectedTeamId] = useState<number | "all">("all");
  const [forceRefresh, setForceRefresh] = useState<boolean>(false);
  const [manualDashboardData, setManualDashboardData] = useState<any>(null);
  
  // Handle tab change with error protection for mobile browser issues
  const handleTabChange = (value: string) => {
    try {
      console.log("Changing tab to:", value);
      // Prevent re-renders for the same tab
      if (value === activeTab) return;
      
      // Set tab state
      setActiveTab(value);
      
      // On mobile, ensure content is visible by scrolling to the top of the tab content
      // This helps prevent white screens on mobile devices
      setTimeout(() => {
        const tabContent = document.querySelector(`[data-value="${value}"]`);
        if (tabContent) {
          console.log("Scrolling to tab content:", value);
          tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Force a repaint on mobile
        document.body.style.opacity = '0.99';
        setTimeout(() => {
          document.body.style.opacity = '1';
        }, 20);
      }, 50);
    } catch (error) {
      console.error("Error changing tab:", error);
    }
  };

  // Get user's church first - try both methods
  const { data: userChurches, isLoading: isLoadingUserChurches } = useQuery<{ id: number; name: string; }[]>({
    queryKey: ["/api/users", user?.id, "churches"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
  
  // Fallback: Get My Church direct query
  const { data: myChurch, isLoading: isLoadingMyChurch } = useQuery({
    queryKey: ["/api/churches/my"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && user.role === "teamleader",
  });
  
  // Use either source for the church ID, but prioritize church ID 2 for user info@hohpurmerend.nl
  let churchId: number | undefined = undefined;
  
  // Special case for user ID 20 (info@hohpurmerend.nl) - always use church ID 2
  if (user?.id === 20) {
    churchId = 2;
    console.log("Using church ID 2 for user ID 20 (info@hohpurmerend.nl)");
  }
  // Otherwise fall back to the user's churches list
  else if (userChurches && userChurches.length > 0) {
    // First try to find church with ID 2 in the list
    const church2 = userChurches.find(c => c.id === 2);
    if (church2) {
      churchId = church2.id;
      console.log("Found church ID 2 in user's churches list");
    } else {
      // Otherwise use the first church
      churchId = userChurches[0].id;
      console.log("Using first church from user's churches list:", churchId);
    }
  }
  
  // If we don't have a church ID from the first method but do have myChurch, use that
  if (!churchId && myChurch && typeof myChurch === 'object' && 'id' in myChurch) {
    churchId = myChurch.id as number;
    console.log("Using myChurch fallback with ID:", churchId);
  }
  
  // Temporary fallback - hardcode church ID for user a@gmail.com
  if (!churchId && user?.id === 2) {
    churchId = 1;
    console.log("FALLBACK: Using hardcoded church ID 1 for user a@gmail.com");
  }
  
  interface DashboardResponse {
    church: ChurchSummary;
    teams: TeamSummary[];
    aggregatedScores: RoleResults;
    totalScores: RoleResults;
    averageScores: RoleResults;
  }
  
  // We explicitly use church ID 2 for user with ID 20
  // This replaces the previous testChurchId that was hardcoded to 1
  
  // Fetch church dashboard data (includes church summary, teams and aggregate scores)
  const { data: dashboardData, isLoading: isLoadingDashboard, error: dashboardError } = useQuery<DashboardResponse>({
    queryKey: ["/api/churches", churchId, "dashboard"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!churchId, // Only query when we have a church ID
  });
  
  // Debug logging
  console.log("Dashboard query with churchId:", churchId);
  console.log("Dashboard data:", dashboardData);
  console.log("Dashboard error:", dashboardError);
  
  // Use the useEffect hook to perform manual fetch when component mounts
  useEffect(() => {
    if (user && churchId && (!dashboardData || !dashboardData.church)) {
      console.log("Attempting direct fetch for dashboard data...");
      fetch(`/api/churches/${churchId}/dashboard`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        console.log("Manual fetch status:", response.status);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Manual fetch result:", data);
        // Force React to update the UI
        setManualDashboardData(data);
        setForceRefresh(prev => !prev);
      })
      .catch(error => {
        console.error("Manual fetch error:", error);
      });
    }
  }, [user, dashboardData, churchId]);
  
  // Extract data from the dashboard response - use manual data if we have it
  const effectiveData = manualDashboardData || dashboardData;
  const church = effectiveData?.church;
  const teams = effectiveData?.teams || [];
  
  // Choose which scores to display based on the toggle
  const totalScores = effectiveData?.totalScores || effectiveData?.aggregatedScores;
  const averageScores = effectiveData?.averageScores;
  
  // Debug logging for scores
  console.log("Total scores:", totalScores);
  console.log("Average scores:", averageScores);
  
  // Use either total or average scores based on the selected view
  const aggregateRoleScores = scoreView === "average" ? averageScores : totalScores;
  
  // Debug logging for final scores used in charts
  console.log("Final aggregate scores for charts:", aggregateRoleScores);
  
  // Get the selected team's role distribution if a specific team is selected
  const selectedTeamScores = selectedTeamId === "all" 
    ? aggregateRoleScores 
    : teams.find((team: TeamSummary) => team.id === selectedTeamId)?.roleDistribution;
    
  // Calculate the church-wide dominant role based on aggregateRoleScores
  const churchDominantRole = Object.entries(aggregateRoleScores || {}).reduce(
    (dominant, [role, score]) => {
      if ((score as number) > dominant.score) {
        return { role, score: score as number };
      }
      return dominant;
    },
    { role: "", score: 0 }
  );
  
  // Check the actual church data
  console.log("Church details:", church);
  console.log("Teams:", teams);
  console.log("Aggregated scores:", aggregateRoleScores);

  // Fetch church members
  const { data: members, isLoading: isLoadingMembers, error: membersError } = useQuery<TeamMember[]>({
    queryKey: ["/api/churches", churchId, "members"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!churchId, // Only query when we have a church ID
  });
  
  // Debug logging for Members tab
  useEffect(() => {
    console.log("Members data:", members);
    console.log("Members loading:", isLoadingMembers);
    console.log("Members error:", membersError);
    console.log("Active tab:", activeTab);
  }, [members, isLoadingMembers, membersError, activeTab]);

  const isLoading = isLoadingUserChurches || isLoadingDashboard || isLoadingMembers;

  // Calculate dominant role for each team
  const teamsWithDominantRoles = teams ? teams.map((team: TeamSummary) => {
    // Find the dominant role in the team
    const roles = Object.entries(team.roleDistribution);
    const dominantRole = roles.reduce<{role: string; score: number}>((max, [role, score]) => 
      (score as number) > max.score ? { role, score: score as number } : max, 
      { role: "", score: 0 }
    );
    
    // Calculate the strength percentage (dominant role score as % of total)
    const totalScore = roles.reduce<number>((sum: number, [_, score]) => sum + (score as number), 0);
    const strengthPercentage = totalScore > 0 ? Math.round((dominantRole.score / totalScore) * 100) : 0;
    
    return {
      ...team,
      dominantRole: dominantRole.role,
      dominantRoleScore: dominantRole.score,
      dominantRoleStrength: strengthPercentage
    };
  }) : [];

  // Sort teams by dominant role strength (descending)
  const [sortField, setSortField] = useState<"name" | "dominantRole" | "dominantRoleStrength">("dominantRoleStrength");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  const sortedTeams = [...teamsWithDominantRoles].sort((a, b) => {
    if (sortField === "name") {
      return sortDirection === "asc" 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    }
    
    if (sortField === "dominantRole") {
      return sortDirection === "asc" 
        ? a.dominantRole.localeCompare(b.dominantRole) 
        : b.dominantRole.localeCompare(a.dominantRole);
    }
    
    // Default sort by strength
    return sortDirection === "asc" 
      ? a.dominantRoleStrength - b.dominantRoleStrength 
      : b.dominantRoleStrength - a.dominantRoleStrength;
  });
  
  // Filter sorted teams
  const filteredTeams = sortedTeams.filter((team) => {
    if (activeFilter === "all") return true;
    return team.dominantRole.toLowerCase() === activeFilter;
  });

  const downloadStatistics = () => {
    // Generate CSV data
    const csvData = [
      ['Church Name', church?.name || ''],
      ['Total Teams', church?.totalTeams?.toString() || '0'],
      ['Total Members', church?.totalMembers?.toString() || '0'],
      ['Denomination', church?.denomination || ''],
      ['Location', church?.location || ''],
      [''],
      ['Role Distribution'],
      ['Role', 'Score'],
      ...Object.entries(aggregateRoleScores || {}).map(([role, score]) => [role, (score as number).toString()]),
      [''],
      ['Teams'],
      ['Name', 'Members', 'Apostle', 'Prophet', 'Evangelist', 'Herder', 'Teacher'],
      ...(teams || []).map((team: TeamSummary) => [
        team.name,
        team.memberCount.toString(),
        (team.roleDistribution[ROLES.APOSTLE] as number).toString(),
        (team.roleDistribution[ROLES.PROPHET] as number).toString(),
        (team.roleDistribution[ROLES.EVANGELIST] as number).toString(),
        (team.roleDistribution[ROLES.HERDER] as number).toString(),
        (team.roleDistribution[ROLES.TEACHER] as number).toString()
      ])
    ];

    // Convert to CSV string
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${church?.name || 'church'}-statistics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user || user.role !== "teamleader") {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Niet toegankelijk</CardTitle>
            <CardDescription>
              Je hebt geen toegang tot deze pagina. Alleen teamleiders hebben toegang tot kerkdashboards.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Kerkdashboard">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          {church?.logoUrl && (
            <div className="mr-4">
              <img 
                src={church.logoUrl} 
                alt={church.name || "Kerk logo"}
                className="h-12 w-12 object-contain rounded bg-white shadow-sm p-1" 
              />
            </div>
          )}
          {!church?.logoUrl && (
            <div className="mr-4">
              <Link 
                to="/church-profile" 
                className="flex items-center justify-center h-12 w-12 rounded bg-muted border border-dashed text-muted-foreground hover:bg-muted/80 transition-colors"
                title="Klik om kerklogo toe te voegen"
              >
                <Users className="h-6 w-6" />
              </Link>
            </div>
          )}
        </div>
        <Button onClick={downloadStatistics}>
          <Download className="h-4 w-4 mr-2" />
          Download Statistieken
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Kerk Naam</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  {church?.logoUrl && (
                    <img 
                      src={church.logoUrl} 
                      alt="Kerklogo" 
                      className="h-8 w-8 mr-3 object-contain rounded" 
                    />
                  )}
                  {church?.name}
                </CardTitle>
              </CardHeader>
              {church?.logoUrl && (
                <CardContent className="pb-2 pt-0">
                  <Link to="/church-profile" className="text-xs text-primary hover:underline">
                    Kerkprofiel bewerken
                  </Link>
                </CardContent>
              )}
              {!church?.logoUrl && (
                <CardContent className="pb-2 pt-0">
                  <Link to="/church-profile" className="text-xs text-primary hover:underline">
                    Kerklogo toevoegen via Kerkprofiel
                  </Link>
                </CardContent>
              )}
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Totaal Teams</CardDescription>
                <CardTitle className="text-2xl">{church?.totalTeams || 0}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Totaal Leden</CardDescription>
                <CardTitle className="text-2xl">{church?.totalMembers || 0}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Denominatie</CardDescription>
                <CardTitle className="text-2xl">{church?.denomination || "Onbekend"}</CardTitle>
              </CardHeader>
            </Card>
            
            {/* Church-wide dominant role card */}
            <Card className="bg-gradient-to-br from-background to-muted">
              <CardHeader className="pb-2">
                <CardDescription>Dominante Rol</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  {churchDominantRole.role && (
                    <>
                      <div 
                        className="h-5 w-5 rounded-full mr-2" 
                        style={{ 
                          backgroundColor: ROLE_COLORS[churchDominantRole.role as keyof typeof ROLE_COLORS] 
                        }}
                      />
                      {churchDominantRole.role}
                    </>
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            {/* Use overflow-x-auto to ensure tabs are scrollable on mobile */}
            <div className="overflow-x-auto pb-2 -mb-2">
              <TabsList className="w-full flex-wrap md:flex-nowrap">
                <TabsTrigger value="overview" className="flex-1 min-w-[80px]">Overzicht</TabsTrigger>
                <TabsTrigger value="teams" className="flex-1 min-w-[80px]">Teams</TabsTrigger>
                <TabsTrigger value="comparison" className="flex-1 min-w-[80px]">Vergelijking</TabsTrigger>
                <TabsTrigger value="members" className="flex-1 min-w-[80px]">Leden</TabsTrigger>
                <TabsTrigger value="analysis" className="flex-1 min-w-[80px]">Analyse</TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" data-value="overview" className="space-y-6 mobile-tab-content">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Rolprofiel van Kerk</CardTitle>
                    <CardDescription>Rolscores van alle leden</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="score-toggle" className={scoreView === "total" ? "font-medium" : "text-muted-foreground"}>
                      Totaal
                    </Label>
                    <div 
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-primary"
                      onClick={() => setScoreView(prev => prev === "total" ? "average" : "total")}
                    >
                      <span 
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          scoreView === "average" ? "translate-x-5" : "translate-x-0"
                        }`} 
                      />
                    </div>
                    <Label htmlFor="score-toggle" className={scoreView === "average" ? "font-medium" : "text-muted-foreground"}>
                      Gemiddelde
                    </Label>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      {aggregateRoleScores && (
                        <RoleChart 
                          results={aggregateRoleScores} 
                          type="radar" 
                          height={300} 
                          width={300}
                        />
                      )}
                    </div>
                    <div>
                      {aggregateRoleScores && (
                        <RoleChart 
                          results={aggregateRoleScores} 
                          type="bar" 
                          height={300} 
                          width={300}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Teams per Dominante Rol</CardTitle>
                    <CardDescription>Verdeling van teams op basis van de dominante rol</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {/* Debug logs for team distribution chart */}
                      {teams && teams.length > 0 ? (() => {
                        // Log team distribution data safely within an IIFE
                        console.log("Teams distribution chart data:", {
                          teams,
                          hasTeams: teams && teams.length > 0,
                          teamRoles: teams.map((team: TeamSummary) => {
                            const roles = Object.entries(team.roleDistribution || {});
                            const dominantRole = roles.reduce(
                              (max, [r, score]) => (score as number) > max.score 
                                ? { role: r, score: score as number } 
                                : max, 
                              { role: "", score: 0 }
                            );
                            return {
                              teamId: team.id, 
                              teamName: team.name,
                              dominantRole: dominantRole.role
                            };
                          })
                        });
                        return null; // Return null to avoid React issues with void
                      })() : null}
                      {teams && teams.length > 0 ? (
                        <div className="grid grid-cols-5 gap-2 h-full">
                          {Object.values(ROLES).map(role => {
                            const teamsWithDominantRole = teams.filter((team: TeamSummary) => {
                              const roles = Object.entries(team.roleDistribution);
                              const dominantRole = roles.reduce<{role: string; score: number}>((max, [r, score]) => 
                                (score as number) > max.score ? { role: r, score: score as number } : max, 
                                { role: "", score: 0 }
                              );
                              return dominantRole.role === role;
                            });
                            
                            const percentage = Math.round((teamsWithDominantRole.length / teams.length) * 100);
                            
                            return (
                              <div key={role} className="flex flex-col items-center">
                                <div className="flex-1 w-full flex flex-col justify-end">
                                  <div 
                                    className="w-full" 
                                    style={{ 
                                      height: `${percentage}%`, 
                                      backgroundColor: ROLE_COLORS[role],
                                      minHeight: '20px',
                                      borderRadius: '6px 6px 0 0'
                                    }}
                                  />
                                </div>
                                <div className="mt-2 text-center">
                                  <div className="font-medium">{role}</div>
                                  <div className="text-sm text-muted-foreground">{teamsWithDominantRole.length}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">Geen teamgegevens beschikbaar</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Rolbezetting in Kerk</CardTitle>
                      <CardDescription>Verdeling van leden per rol</CardDescription>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="distribution-toggle" className={distributionView === "counts" ? "font-medium" : "text-muted-foreground"}>
                          Aantallen
                        </Label>
                        <div 
                          className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-primary"
                          onClick={() => setDistributionView(prev => prev === "counts" ? "percentages" : "counts")}
                        >
                          <span 
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              distributionView === "percentages" ? "translate-x-5" : "translate-x-0"
                            }`} 
                          />
                        </div>
                        <Label htmlFor="distribution-toggle" className={distributionView === "percentages" ? "font-medium" : "text-muted-foreground"}>
                          Percentages
                        </Label>
                      </div>
                      
                      <Select value={selectedTeamId === "all" ? "all" : selectedTeamId.toString()} onValueChange={(value) => setSelectedTeamId(value === "all" ? "all" : parseInt(value))}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Team Selecteren" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Teams</SelectItem>
                          {teams.map((team: TeamSummary) => (
                            <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedTeamScores && (
                      <div className="flex flex-col">
                        <div className="h-[300px] relative">
                          <RoleChart 
                            results={selectedTeamScores} 
                            type="pie" 
                            height={300} 
                            width={300} 
                            showLegend={false}
                          />
                          
                          {/* Show team name overlay when specific team selected */}
                          {selectedTeamId !== "all" && (
                            <div className="absolute top-0 left-0 bg-background/80 px-3 py-1 rounded-md text-sm font-medium">
                              {teams.find((team: TeamSummary) => team.id === selectedTeamId)?.name}
                            </div>
                          )}
                        </div>
                        
                        {/* Legend with percentages */}
                        <div className="grid grid-cols-5 gap-4 mt-4">
                          {Object.entries(selectedTeamScores).map(([role, score]) => {
                            const totalValue = Object.values(selectedTeamScores).reduce((sum: number, val) => sum + (val as number), 0);
                            const percentage = totalValue > 0 ? Math.round(((score as number) / totalValue) * 100) : 0;
                            
                            return (
                              <div key={role} className="flex flex-col items-center text-center">
                                <div className="flex items-center mb-1">
                                  <div 
                                    className="h-3 w-3 rounded-full mr-2" 
                                    style={{ backgroundColor: ROLE_COLORS[role as keyof typeof ROLE_COLORS] }}
                                  />
                                  <span className="font-medium">{role}</span>
                                </div>
                                <span className="text-sm">
                                  {distributionView === "percentages" 
                                    ? `${percentage}%` 
                                    : score as React.ReactNode
                                  }
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Teams Tab */}
            <TabsContent value="teams" data-value="teams" className="space-y-6 mobile-tab-content">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Card className="md:w-1/4">
                  <CardHeader>
                    <CardTitle>Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Roltype</Label>
                      <Select value={activeFilter} onValueChange={setActiveFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter op rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle rollen</SelectItem>
                          {Object.values(ROLES).map(role => (
                            <SelectItem key={role} value={role.toLowerCase()}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Periode</Label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter op periode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle tijd</SelectItem>
                          <SelectItem value="week">Laatste week</SelectItem>
                          <SelectItem value="month">Laatste maand</SelectItem>
                          <SelectItem value="quarter">Laatste kwartaal</SelectItem>
                          <SelectItem value="year">Laatste jaar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle>Teams ({filteredTeams.length})</CardTitle>
                    <CardDescription>Teams binnen jouw kerk, gerangschikt op dominante rol sterkte</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredTeams.length > 0 ? (
                      <div className="space-y-6">
                        {/* Sortable table headers */}
                        <div className="grid grid-cols-4 gap-4 border-b pb-2 mb-4">
                          <button 
                            className="flex items-center font-medium text-left" 
                            onClick={() => {
                              if (sortField === "name") {
                                setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setSortField("name");
                                setSortDirection("asc");
                              }
                            }}
                          >
                            Team Naam
                            {sortField === "name" && (
                              <span className="ml-1">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                          <button 
                            className="flex items-center font-medium text-left" 
                            onClick={() => {
                              if (sortField === "dominantRole") {
                                setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setSortField("dominantRole");
                                setSortDirection("asc");
                              }
                            }}
                          >
                            Dominante Rol
                            {sortField === "dominantRole" && (
                              <span className="ml-1">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                          <button 
                            className="flex items-center font-medium text-left" 
                            onClick={() => {
                              if (sortField === "dominantRoleStrength") {
                                setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setSortField("dominantRoleStrength");
                                setSortDirection("desc");
                              }
                            }}
                          >
                            Sterkte
                            {sortField === "dominantRoleStrength" && (
                              <span className="ml-1">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                          <div className="flex items-center font-medium">Leden</div>
                        </div>
                      
                        {/* Team list */}
                        {filteredTeams.map((team) => (
                          <div key={team.id} className="border rounded-lg p-4">
                            <div className="grid grid-cols-4 gap-4 mb-4">
                              <div>
                                <h3 className="font-semibold">{team.name}</h3>
                              </div>
                              <div className="flex items-center">
                                <div 
                                  className="h-3 w-3 rounded-full mr-2" 
                                  style={{ backgroundColor: ROLE_COLORS[team.dominantRole as keyof typeof ROLE_COLORS] }}
                                />
                                <span>{team.dominantRole}</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-full bg-secondary rounded-full h-2.5 mr-2">
                                  <div 
                                    className="h-2.5 rounded-full" 
                                    style={{ 
                                      width: `${team.dominantRoleStrength}%`,
                                      backgroundColor: ROLE_COLORS[team.dominantRole as keyof typeof ROLE_COLORS]
                                    }}
                                  />
                                </div>
                                <span className="text-sm whitespace-nowrap">{team.dominantRoleStrength}%</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <Users className="h-4 w-4 mr-1" />
                                <span>{team.memberCount} leden</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <RoleChart 
                                  results={team.roleDistribution} 
                                  type="radar" 
                                  height={200} 
                                  width={200}
                                />
                              </div>
                              <div className="flex flex-col justify-center">
                                <h4 className="font-medium mb-2">Top rollen</h4>
                                <div className="space-y-2">
                                  {Object.entries(team.roleDistribution)
                                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                                    .slice(0, 3)
                                    .map(([role, score], idx) => {
                                      const totalScore = Object.values(team.roleDistribution).reduce((sum: number, val) => sum + (val as number), 0);
                                      const percentage = totalScore > 0 ? Math.round(((score as number) / totalScore) * 100) : 0;
                                      
                                      return (
                                        <div key={role} className="flex items-center justify-between">
                                          <div className="flex items-center">
                                            <div 
                                              className="h-3 w-3 rounded-full mr-2" 
                                              style={{ backgroundColor: ROLE_COLORS[role as keyof typeof ROLE_COLORS] }}
                                            />
                                            <span className="font-medium">{role}</span>
                                            <span className="ml-2 text-xs text-muted-foreground">
                                              {idx === 0 ? '(Primair)' : idx === 1 ? '(Secundair)' : '(Tertiair)'}
                                            </span>
                                          </div>
                                          <div className="text-sm">{percentage}%</div>
                                        </div>
                                      );
                                    })
                                  }
                                </div>
                                
                                <h4 className="font-medium mt-4 mb-2">Zwakste rol</h4>
                                <div className="flex items-center justify-between">
                                  {Object.entries(team.roleDistribution)
                                    .sort((a, b) => (a[1] as number) - (b[1] as number))
                                    .slice(0, 1)
                                    .map(([role, score]) => {
                                      const totalScore = Object.values(team.roleDistribution).reduce((sum: number, val) => sum + (val as number), 0);
                                      const percentage = totalScore > 0 ? Math.round(((score as number) / totalScore) * 100) : 0;
                                      
                                      return (
                                        <div key={role} className="flex items-center justify-between w-full">
                                          <div className="flex items-center">
                                            <div 
                                              className="h-3 w-3 rounded-full mr-2" 
                                              style={{ backgroundColor: ROLE_COLORS[role as keyof typeof ROLE_COLORS] }}
                                            />
                                            <span className="font-medium">{role}</span>
                                          </div>
                                          <div className="text-sm">{percentage}%</div>
                                        </div>
                                      );
                                    })
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Geen teams gevonden met de geselecteerde filters</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Comparison Tab */}
            <TabsContent value="comparison" data-value="comparison" className="mobile-tab-content">
              {teamsWithDominantRoles.length > 0 ? (
                <TeamComparison teams={teamsWithDominantRoles} />
              ) : (
                <Card>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Geen teams beschikbaar voor vergelijking</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" data-value="members" className="mobile-tab-content">
              <Card>
                <CardHeader>
                  <CardTitle>Kerkleden</CardTitle>
                  <CardDescription>Alle leden binnen de verschillende teams van de kerk</CardDescription>
                </CardHeader>
                <CardContent>
                  {members && members.length > 0 ? (
                    <TeamMembersTable members={members} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Geen leden gevonden</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" data-value="analysis" className="mobile-tab-content">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rollenanalyse</CardTitle>
                    <CardDescription>Analyse van de verdeling van rollen binnen de kerk</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {members && members.length > 0 && aggregateRoleScores ? (
                      <TeamGapAnalysis 
                        teamMembers={members} 
                        teamRoleScores={aggregateRoleScores}
                        teams={teamsWithDominantRoles}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Onvoldoende gegevens voor analyse</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardLayout>
  );
}