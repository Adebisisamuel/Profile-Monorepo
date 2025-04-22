import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import RoleChart from "@/components/RoleChart";
import TeamMembersTable from "@/components/TeamMembersTable";
import TeamGapAnalysis from "@/components/TeamGapAnalysis";
import { ProfileDistributionChart } from "@/components/dashboard/leader/ProfileDistributionChart";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ROLES } from "@shared/constants";
import { RoleResults } from "@shared/types";
import { Team } from "@shared/schema";

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

// Dashboard component
const TeamDashboardPage = () => {
  // Auth and routing hooks
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [teamId, setTeamId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'charts' | 'list'>('charts');

  // Redirect if not logged in or not a teamleader
  useEffect(() => {
    if (!user) {
      navigate("/auth?redirect=/dashboard");
    } else if (user.role !== "teamleader") {
      navigate("/");
    }
  }, [user, navigate]);

  // Get user's teams
  const { 
    data: teams = [], 
    isLoading: isLoadingTeams 
  } = useQuery<Team[]>({
    queryKey: ["/api/users", user?.id, "teams"],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/users/${user.id}/teams`);
      if (!res.ok) throw new Error("Failed to load teams");
      return await res.json();
    },
    enabled: !!user && user.role === "teamleader",
  });

  // Set default team ID on initial load
  useEffect(() => {
    if (teams.length && teamId === null) {
      setTeamId(teams[0].id);
    }
  }, [teams, teamId]);

  // Get team members
  const { 
    data: teamMembers = [], 
    isLoading: isLoadingMembers 
  } = useQuery<MemberProfile[]>({
    queryKey: ["/api/teams", teamId, "members"],
    queryFn: async () => {
      if (!teamId) return [];
      const res = await fetch(`/api/teams/${teamId}/members`);
      if (!res.ok) throw new Error("Failed to load team members");
      return await res.json();
    },
    enabled: !!teamId,
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

  // Loading state
  if (isLoadingTeams || (teamId && isLoadingMembers)) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No teams state
  if (!teams.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Geen teams gevonden</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Je hebt nog geen teams aangemaakt. Ga naar Teams om een nieuw team aan te maken.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Render dashboard
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Team Dashboard</h1>
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
            
            {/* Card 4: Bar Chart Comparison */}
            <Card className="bg-white shadow-sm overflow-hidden col-span-1 md:col-span-2 lg:col-span-2">
              <CardHeader className="pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <CardTitle className="text-lg">Vergelijking met Landelijk Gemiddelde</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 overflow-x-auto">
                <div className="min-w-[300px] w-full h-[300px]">
                  <RoleChart 
                    results={teamRoleScores} 
                    type="bar" 
                    isTeam 
                    comparisonData={nationalAverageData}
                    height={300}
                    width={undefined}
                    showLegend={true}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Card 5: Primary/Secondary Profile Distribution */}
            <Card className="bg-white shadow-sm overflow-hidden col-span-1 md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Primaire en Secundaire Rolprofiel Verdeling</CardTitle>
                <CardDescription>Aantal teamleden met elk roltype als primair of secundair profiel</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[300px]">
                  <ProfileDistributionChart 
                    members={teamMembers}
                  />
                </div>
              </CardContent>
            </Card>
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
          </CardHeader>
          <CardContent className="p-6">
            {teamMembers.length ? (
              <TeamMembersTable members={teamMembers} />
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-md">
                <p className="text-gray-500">Geen teamleden gevonden</p>
                <p className="text-sm text-gray-400 mt-1">Deel de uitnodigingslink om teamleden toe te voegen</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamDashboardPage;
