import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient, getQueryFn, useCustomQueryOptions } from "@/lib/queryClient";
import { exportTeamData } from "@/lib/exportHelper";
import { FeedbackService } from "@/services/feedback-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clipboard, 
  ClipboardCheck, 
  Plus, 
  Users, 
  Globe, 
  ExternalLink,
  PieChart,
  BarChart,
  Loader2,
  FileDown,
  Download
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ROLES, SUBSCRIPTION_PLANS } from "@shared/constants";
import { Team } from "@shared/schema";
import { RoleResults } from "@shared/types";
import RoleChart from "@/components/RoleChart";
import TeamMembersTable from "@/components/TeamMembersTable";
import TeamGapAnalysis from "@/components/TeamGapAnalysis";
import { ProfileDistributionChart } from "@/components/dashboard/leader/ProfileDistributionChart";

// Zod schema for creating a team
const createTeamSchema = z.object({
  name: z.string().min(2, "Team name moet minimaal 2 tekens bevatten"),
});

// National average data
const nationalAverageData: RoleResults = {
  [ROLES.APOSTLE]: 120,
  [ROLES.PROPHET]: 125,
  [ROLES.EVANGELIST]: 130,
  [ROLES.HERDER]: 140,
  [ROLES.TEACHER]: 135,
};

// Default empty scores
const emptyScores: RoleResults = {
  [ROLES.APOSTLE]: 0,
  [ROLES.PROPHET]: 0,
  [ROLES.EVANGELIST]: 0,
  [ROLES.HERDER]: 0,
  [ROLES.TEACHER]: 0,
};

// Member profile interface
interface MemberProfile {
  id: number;
  name: string;
  email: string;
  profile: {
    apostle: number;
    prophet: number;
    evangelist: number;
    herder: number;
    teacher: number;
  } | null;
}

export default function TeamUnifiedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("teams");
  const [teamId, setTeamId] = useState<number | null>(null);
  const [copiedInviteCode, setCopiedInviteCode] = useState<number | null>(null);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'charts' | 'list'>('charts');

  // Form for creating a new team
  const form = useForm<z.infer<typeof createTeamSchema>>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
    },
  });

  // Create teams query options with optimized caching
  const teamsQueryKey = [`/api/users/${user?.id}/teams`] as const;
  const teamsQueryOptions = useCustomQueryOptions<Team[]>(teamsQueryKey);
  
  // Fetch teams created by the user with optimized caching
  const { 
    data: teams = [], 
    isLoading: isLoadingTeams 
  } = useQuery<Team[]>({
    ...teamsQueryOptions,
    enabled: !!user?.id,
  });

  // Set default team ID on initial load
  useEffect(() => {
    if (teams.length && teamId === null) {
      setTeamId(teams[0].id);
      setActiveTab("dashboard");
    }
  }, [teams, teamId]);

  // Create query options with our custom cache configuration for team members
  const teamMembersQueryKey = ["/api/teams", teamId, "members"] as const;
  const teamMembersOptions = useCustomQueryOptions<MemberProfile[]>(teamMembersQueryKey);
  
  // Fetch team members for selected team with optimized caching
  const { 
    data: teamMembers = [], 
    isLoading: isLoadingMembers,
    refetch: refetchTeamMembers,
    error: teamMembersError
  } = useQuery<MemberProfile[]>({
    ...teamMembersOptions,
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!teamId,
    refetchOnWindowFocus: true, // Refetch when the window regains focus
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Calculate aggregate role scores for the team
  const teamRoleScores = useMemo(() => {
    if (!teamMembers?.length) return emptyScores;

    return teamMembers.reduce((acc: RoleResults, member) => {
      if (!member.profile) return acc;
      
      return {
        [ROLES.APOSTLE]: acc[ROLES.APOSTLE] + member.profile.apostle,
        [ROLES.PROPHET]: acc[ROLES.PROPHET] + member.profile.prophet,
        [ROLES.EVANGELIST]: acc[ROLES.EVANGELIST] + member.profile.evangelist,
        [ROLES.HERDER]: acc[ROLES.HERDER] + member.profile.herder,
        [ROLES.TEACHER]: acc[ROLES.TEACHER] + member.profile.teacher,
      };
    }, {...emptyScores});
  }, [teamMembers]);

  // Find current team
  const currentTeam = useMemo(() => {
    return teams.find((team) => team.id === teamId);
  }, [teams, teamId]);

  // Mutation for creating a team
  const createTeamMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTeamSchema>) => {
      const res = await apiRequest("POST", "/api/teams", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/teams`] });
      FeedbackService.teamCreated(data.name);
      form.reset();
      setIsCreateTeamOpen(false);
      // Set the new team as active and switch to dashboard tab
      setTeamId(data.id);
      setActiveTab("dashboard");
    },
    onError: (error: Error) => {
      FeedbackService.error(error.message || "Failed to create team");
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof createTeamSchema>) => {
    createTeamMutation.mutate(data);
  };

  // Function to copy invite link to clipboard
  const copyInviteLink = (teamId: number, inviteCode: string) => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/join/${inviteCode}`;
    
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedInviteCode(teamId);
      FeedbackService.teamInviteCopied();
      
      // Reset the copied state after 3 seconds
      setTimeout(() => {
        setCopiedInviteCode(null);
      }, 3000);
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Inloggen Vereist</CardTitle>
            <CardDescription>Je moet ingelogd zijn om teams te beheren.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Ga naar Inloggen
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Teams</h1>
          <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={16} />
                Team Aanmaken
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuw Team Aanmaken</DialogTitle>
                <DialogDescription>
                  Maak een team aan en nodig leden uit om de vragenlijst in te vullen
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teamnaam</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Voer teamnaam in" />
                        </FormControl>
                        <FormDescription>
                          Dit wordt getoond aan teamleden wanneer ze zich aansluiten.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createTeamMutation.isPending}
                      className="w-full"
                    >
                      {createTeamMutation.isPending ? "Aanmaken..." : "Team Aanmaken"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Use overflow-x-auto to ensure tabs are scrollable on mobile */}
        <div className="overflow-x-auto pb-2 -mb-2">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="teams" className="flex-1 min-w-[100px]">Mijn Teams</TabsTrigger>
            {teamId && <TabsTrigger value="dashboard" className="flex-1 min-w-[100px]">Dashboard</TabsTrigger>}
          </TabsList>
        </div>
        
        <TabsContent value="teams">
          <Card className="bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Jouw Teams</CardTitle>
              <CardDescription>Beheer en bekijk de profielen van je teamleden</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingTeams ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : teams && teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teams.map((team) => (
                    <Card key={team.id} className="overflow-hidden">
                      <CardHeader className="bg-primary/5 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Users size={16} className="text-primary" />
                          {team.name}
                        </CardTitle>
                        <CardDescription>
                          {team.plan === 'free' ? 'Gratis' : team.plan === 'pro' ? 'Pro' : 'Pro+'} Abonnement
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Uitnodigingslink Delen</Label>
                            <div className="mt-1 flex">
                              <Input
                                value={`${window.location.origin}/join/${team.inviteCode}`}
                                readOnly
                                className="rounded-r-none text-sm"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-l-none border-l-0"
                                onClick={() => copyInviteLink(team.id, team.inviteCode)}
                              >
                                {copiedInviteCode === team.id ? (
                                  <ClipboardCheck size={14} className="text-green-600" />
                                ) : (
                                  <Clipboard size={14} />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Deel deze link met teamleden om hen uit te nodigen
                            </p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between border-t bg-muted/10 px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTeamId(team.id);
                            setActiveTab("dashboard");
                          }}
                          className="gap-1 text-xs"
                        >
                          <BarChart size={12} />
                          Dashboard Bekijken
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            window.open(`/join/${team.inviteCode}`, "_blank");
                          }}
                          className="gap-1 text-xs"
                        >
                          <ExternalLink size={12} />
                          Link Testen
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-muted/5 rounded-lg">
                  <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-1">Nog Geen Teams</h3>
                  <p className="text-center text-muted-foreground mb-4 max-w-md">
                    Maak je eerste team aan om leden uit te nodigen en hun beoordelingen te verzamelen.
                  </p>
                  <Button onClick={() => setIsCreateTeamOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Maak Je Eerste Team Aan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dashboard">
          {(isLoadingTeams || (teamId && isLoadingMembers)) ? (
            <div className="flex justify-center items-center min-h-[50vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !currentTeam ? (
            <Card>
              <CardHeader>
                <CardTitle>Geen team geselecteerd</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Selecteer een team of maak een nieuw team aan om het dashboard te bekijken.</p>
                <Button 
                  onClick={() => setActiveTab("teams")} 
                  className="mt-4"
                  variant="outline"
                >
                  Terug naar Teams
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Team Dashboard</h2>
                  <p className="text-sm sm:text-base text-gray-500">Visuele analyse van je teamsamenstelling</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                  {/* Team Selector */}
                  <div className="relative w-full sm:w-64">
                    <select 
                      className="w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                      value={teamId || ''}
                      onChange={(e) => setTeamId(Number(e.target.value))}
                      disabled={!teams.length}
                    >
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Export Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (currentTeam) {
                        exportTeamData(currentTeam.id, currentTeam.name)
                          .then(success => {
                            if (success) {
                              FeedbackService.success("Team data geëxporteerd", "");
                            } else {
                              FeedbackService.error("Fout bij exporteren van team data", "");
                            }
                          });
                      }
                    }}
                    disabled={!currentTeam}
                    className="h-10 gap-2"
                  >
                    <FileDown size={16} />
                    Exporteer
                  </Button>
                  
                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-100 rounded-md p-1">
                    <button
                      onClick={() => setViewMode('charts')}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                        viewMode === 'charts'
                          ? 'bg-white shadow-sm text-primary'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Grafieken
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white shadow-sm text-primary'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Ledenlijst
                    </button>
                  </div>
                </div>
              </div>
              
              {currentTeam && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 sm:p-4 md:p-6 rounded-xl shadow-sm">
                  <h2 className="text-lg sm:text-xl font-semibold">{currentTeam.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="bg-white text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full text-primary-dark">
                      {currentTeam.plan.charAt(0).toUpperCase() + currentTeam.plan.slice(1)} Plan
                    </span>
                    <span className="text-xs sm:text-sm text-gray-600">
                      {teamMembers.length || 0} {teamMembers.length === 1 ? 'lid' : 'leden'}
                    </span>
                    
                    {/* Add sharing section */}
                    <div className="mt-3 w-full flex items-center gap-2">
                      <span className="text-xs text-gray-600">Uitnodigingslink:</span>
                      <div className="flex-1 flex">
                        <Input
                          value={`${window.location.origin}/join/${currentTeam.inviteCode}`}
                          readOnly
                          className="rounded-r-none h-8 text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-l-none border-l-0 h-8"
                          onClick={() => copyInviteLink(currentTeam.id, currentTeam.inviteCode)}
                        >
                          {copiedInviteCode === currentTeam.id ? (
                            <ClipboardCheck size={14} className="text-green-600" />
                          ) : (
                            <Clipboard size={14} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {viewMode === 'charts' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Card 1: Radar Chart */}
                    <Card className="bg-white shadow-sm overflow-hidden col-span-1 md:col-span-1 lg:col-span-1">
                      <CardHeader className="pb-0">
                        <CardTitle className="text-lg">Team Profiel</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex justify-center">
                          <RoleChart results={teamRoleScores} type="radar" isTeam height={240} />
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Card 2: Pie Chart */}
                    <Card className="bg-white shadow-sm overflow-hidden col-span-1 md:col-span-1 lg:col-span-1">
                      <CardHeader className="pb-0">
                        <CardTitle className="text-lg">Bedieningen Verdeling</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex justify-center">
                          <RoleChart results={teamRoleScores} type="pie" isTeam height={240} />
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Card 3: Role Distribution */}
                    <Card className="bg-white shadow-sm overflow-hidden col-span-1 md:col-span-2 lg:col-span-1">
                      <CardHeader className="pb-0">
                        <CardTitle className="text-lg">Sterke & Zwakke Punten</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          {Object.entries(teamRoleScores).map(([role, score]) => {
                            const maxScore = teamMembers.length * 70;
                            const percentage = maxScore > 0 ? (score as number / maxScore) * 100 : 0;
                            
                            return (
                              <div key={role} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">{role}</span>
                                  <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary" 
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Adjusted chart layout for better visibility */}
                    <div className="col-span-full">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Card 4: Bar Chart Comparison */}
                        <Card className="bg-white shadow-sm overflow-hidden">
                          <CardHeader className="pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <CardTitle className="text-lg">Vergelijking met Landelijk Gemiddelde</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 overflow-x-auto">
                            <div className="min-w-[300px] md:min-w-[400px] h-[350px]">
                              <RoleChart 
                                results={teamRoleScores} 
                                type="bar" 
                                isTeam 
                                comparisonData={nationalAverageData}
                                height={350}
                                showLegend={true}
                              />
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Primary/Secondary Profile Distribution Chart */}
                        <Card className="bg-white shadow-sm overflow-hidden">
                          <CardHeader className="pb-0">
                            <CardTitle className="text-lg">Primaire en Secundaire Rolprofiel Verdeling</CardTitle>
                            <CardDescription>Aantal teamleden met elk roltype als primair of secundair profiel</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="h-[350px]">
                              <ProfileDistributionChart 
                                members={teamMembers}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                  
                  {/* Team Gap Analysis Section */}
                  <TeamGapAnalysis 
                    teamMembers={teamMembers} 
                    teamRoleScores={teamRoleScores} 
                  />
                </div>
              ) : (
                <Card className="bg-white shadow-sm overflow-hidden">
                  <CardHeader className="pb-0">
                    <CardTitle>Teamleden Overzicht</CardTitle>
                    <CardDescription>
                      Bekijk welke leden jouw team versterken en hun beoordelingen
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <TeamMembersTable 
                      members={teamMembers} 
                      isLoading={isLoadingMembers}
                      error={null}
                      onInviteClick={() => {
                        if (currentTeam) {
                          copyInviteLink(currentTeam.id, currentTeam.inviteCode);
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}