import React, { useMemo } from "react";
import { ROLE_COLORS, ROLES } from "@shared/constants";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertCircle, AlertTriangle, Check, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type TeamMember = {
  id: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  roleScores?: Record<string, number>;
};

interface TeamWithGap {
  id: number;
  name: string;
  gaps: {
    role: string;
    percentage: number;
    status: 'severe' | 'moderate' | 'balanced';
  }[];
  weakestRole: string;
  balanceScore: number;
}

interface TeamGapAnalysisProps {
  teamMembers: TeamMember[];
  teamRoleScores: Record<string, number>;
  teams?: any[]; // For church-level analysis with multiple teams
}

export function TeamGapAnalysis({ teamMembers, teamRoleScores, teams = [] }: TeamGapAnalysisProps) {
  const membersWithRoleScores = teamMembers.filter(member => member.roleScores);
  
  // Calculate ideal distribution (percentage) for each role
  const idealDistribution = Object.values(ROLES).reduce<Record<string, number>>((acc, role) => {
    acc[role] = 100 / Object.values(ROLES).length; // Equal distribution (20% each for 5 roles)
    return acc;
  }, {});
  
  // Calculate current distribution (percentage)
  const totalScore = Object.values(teamRoleScores).reduce((sum, score) => sum + (score as number), 0);
  const currentDistribution = Object.entries(teamRoleScores).reduce<Record<string, number>>((acc, [role, score]) => {
    acc[role] = totalScore > 0 ? ((score as number) / totalScore) * 100 : 0;
    return acc;
  }, {});
  
  // Calculate gaps
  const gaps = Object.entries(idealDistribution).reduce<Record<string, number>>((acc, [role, idealPercentage]) => {
    const currentPercentage = currentDistribution[role] || 0;
    acc[role] = idealPercentage - currentPercentage;
    return acc;
  }, {});
  
  // Prepare data for the chart
  const chartData = Object.entries(gaps).map(([role, gap]) => ({
    role,
    gap: Math.round(gap),
    color: ROLE_COLORS[role as keyof typeof ROLE_COLORS]
  }));
  
  // Identify roles with significant gaps (more than 5% below ideal)
  const significantGaps = Object.entries(gaps).filter(([_, gap]) => gap > 5);
  
  // Calculate balance score (higher is better balance)
  const balanceScore = useMemo(() => {
    if (totalScore === 0) return 0;
    
    // Calculate variance from ideal
    const idealPercentage = 100 / Object.keys(ROLES).length;
    const varianceSum = Object.values(currentDistribution).reduce(
      (sum, percentage) => sum + Math.pow(percentage - idealPercentage, 2), 
      0
    );
    
    // Convert to a 0-100 score where 100 is perfect balance
    // The formula is (1 - normalized_variance) * 100
    // We cap the variance at 1000 to avoid negative scores
    const maxVariance = 1000;
    const normalizedVariance = Math.min(varianceSum / maxVariance, 1);
    return Math.round((1 - normalizedVariance) * 100);
  }, [currentDistribution, totalScore]);
  
  // Calculate team-level gap analysis for church dashboard
  const teamGapAnalysis = useMemo(() => {
    if (!teams || teams.length === 0) return [];
    
    return teams.map(team => {
      const roleDistribution = team.roleDistribution || {};
      const teamTotalScore = Object.values(roleDistribution).reduce((sum: number, score) => sum + (score as number), 0);
      
      // Calculate percentages
      const teamPercentages = Object.entries(roleDistribution).reduce((acc, [role, score]) => {
        acc[role] = teamTotalScore > 0 ? ((score as number) / teamTotalScore) * 100 : 0;
        return acc;
      }, {} as Record<string, number>);
      
      // Calculate gaps
      const teamGaps = Object.entries(idealDistribution).map(([role, idealPercentage]) => {
        const currentPercentage = teamPercentages[role] || 0;
        const gap = idealPercentage - currentPercentage;
        
        // Determine status based on gap size
        let status: 'severe' | 'moderate' | 'balanced' = 'balanced';
        if (gap > 10) status = 'severe';
        else if (gap > 5) status = 'moderate';
        
        return {
          role,
          percentage: Math.round(gap),
          status
        };
      });
      
      // Find the weakest role
      const weakestRoleGap = [...teamGaps].sort((a, b) => b.percentage - a.percentage)[0];
      
      // Calculate team balance score
      const idealPercentage = 100 / Object.keys(ROLES).length;
      const varianceSum = Object.values(teamPercentages).reduce(
        (sum: number, percentage) => sum + Math.pow(percentage - idealPercentage, 2), 
        0
      );
      
      const maxVariance = 1000;
      const normalizedVariance = Math.min(varianceSum / maxVariance, 1);
      const teamBalanceScore = Math.round((1 - normalizedVariance) * 100);
      
      return {
        id: team.id,
        name: team.name,
        gaps: teamGaps,
        weakestRole: weakestRoleGap?.role || '',
        balanceScore: teamBalanceScore
      } as TeamWithGap;
    }).sort((a, b) => a.balanceScore - b.balanceScore); // Sort by balance score (worst first)
  }, [teams, idealDistribution]);
  
  const roleRecommendations = {
    [ROLES.APOSTLE]: "Apostelen leggen fundamenten en starten nieuwe initiatieven. Overweeg om nieuwe projecten te starten of teams in nieuwe richtingen te leiden.",
    [ROLES.PROPHET]: "Profeten geven visie en corrigeren waar nodig. Zoek naar mensen die kunnen helpen met heldere visievorming en het bewaken van kernwaarden.",
    [ROLES.EVANGELIST]: "Evangelisten delen het goede nieuws en betrekken nieuwe mensen. Focus op groei en het bereiken van mensen buiten je huidige kringen.",
    [ROLES.HERDER]: "Herders zorgen voor mensen en bouwen gemeenschap. Versterk pastorale zorg en onderlinge verbinding in je teams.",
    [ROLES.TEACHER]: "Leraars brengen diepte en helpen mensen groeien in kennis. Investeer in onderwijs en toerusting van je teamleden."
  };
  
  // Determine if we're viewing church-level or team-level data
  const isChurchView = teams && teams.length > 0;
  
  // Active tab state for church level view
  const [activeTab, setActiveTab] = React.useState<string>("overview");
  
  return (
    <div className="space-y-6">
      {isChurchView ? (
        // Church-level gap analysis
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2 -mb-2">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="overview" className="flex-1 min-w-[100px]">Overzicht</TabsTrigger>
              <TabsTrigger value="teams" className="flex-1 min-w-[100px]">Teams Analyse</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Balans Score</CardDescription>
                    <CardTitle className="text-2xl">{balanceScore}/100</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress 
                      value={balanceScore} 
                      max={100}
                      className="h-2"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      {balanceScore >= 80 ? 'Uitstekende balans' : 
                       balanceScore >= 60 ? 'Goede balans' : 
                       balanceScore >= 40 ? 'Redelijke balans' : 'Verbetering nodig'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Teams met Hiaten</CardDescription>
                    <CardTitle className="text-2xl">
                      {teamGapAnalysis.filter(t => t.gaps.some(g => g.status === 'severe')).length}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {teamGapAnalysis.filter(t => t.gaps.some(g => g.status === 'severe')).length > 0 ? (
                        <Badge variant="destructive">Aandacht nodig</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                          Geen ernstige hiaten
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Meest Ontbrekende Rol</CardDescription>
                    <CardTitle className="text-2xl flex items-center">
                      {significantGaps.length > 0 ? (
                        <>
                          <div 
                            className="h-4 w-4 rounded-full mr-2" 
                            style={{ 
                              backgroundColor: ROLE_COLORS[significantGaps[0][0] as keyof typeof ROLE_COLORS] 
                            }}
                          />
                          {significantGaps[0][0]}
                        </>
                      ) : "Geen significante hiaten"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {significantGaps.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {Math.abs(Math.round(significantGaps[0][1]))}% onder ideaal
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Gap Analysis Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Kerkbrede Rollenanalyse</CardTitle>
                  <CardDescription>Verschil tussen huidige en ideale verdeling van rollen</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="role" />
                        <YAxis label={{ value: 'Verschil met ideale verdeling (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip
                          formatter={(value) => [`${value}%`, 'Verschil']}
                          labelFormatter={(label) => `Rol: ${label}`}
                        />
                        <Legend />
                        <Bar 
                          dataKey="gap" 
                          name="Verschil met ideaal" 
                          radius={[4, 4, 0, 0]}
                        >
                          {chartData.map((entry, index) => (
                            <rect 
                              key={`cell-${index}`} 
                              fill={entry.gap > 0 ? entry.color : '#888888'} 
                              opacity={Math.abs(entry.gap) / 20 + 0.5}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Gap Analysis Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Aanbevelingen voor de Kerk</CardTitle>
                  <CardDescription>Suggesties om de balans te verbeteren</CardDescription>
                </CardHeader>
                <CardContent>
                  {significantGaps.length > 0 ? (
                    <div className="space-y-4">
                      {significantGaps.map(([role, gap]) => (
                        <Alert key={role} variant="default" className={gap > 10 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}>
                          <AlertCircle className={`h-4 w-4 ${gap > 10 ? "text-red-500" : "text-amber-500"}`} />
                          <AlertTitle className="flex items-center">
                            <div 
                              className="h-3 w-3 rounded-full mr-2" 
                              style={{ backgroundColor: ROLE_COLORS[role as keyof typeof ROLE_COLORS] }}
                            />
                            {role} rol versterken
                          </AlertTitle>
                          <AlertDescription>
                            <p>
                              Je kerk heeft een tekort aan de {role} rol. Het huidige tekort is ongeveer {Math.round(gap)}% onder de ideale verdeling.
                            </p>
                            <p className="mt-2">
                              {roleRecommendations[role as keyof typeof roleRecommendations]}
                            </p>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <Alert variant="default" className="bg-green-50 border-green-200">
                      <Check className="h-4 w-4 text-green-500" />
                      <AlertTitle>Goede balans</AlertTitle>
                      <AlertDescription>
                        Je kerk heeft een goede balans van rollen. Alle rollen zijn binnen 5% van de ideale verdeling.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="teams">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Teams Balans Analyse</CardTitle>
                  <CardDescription>Overzicht van hiaten in rollen per team</CardDescription>
                </CardHeader>
                <CardContent>
                  {teamGapAnalysis.length > 0 ? (
                    <div className="space-y-6">
                      {teamGapAnalysis.map(team => {
                        // Get severe and moderate gaps
                        const severeGaps = team.gaps.filter(g => g.status === 'severe');
                        const moderateGaps = team.gaps.filter(g => g.status === 'moderate');
                        
                        return (
                          <div key={team.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="font-semibold text-lg">{team.name}</h3>
                              <Badge 
                                variant={
                                  team.balanceScore >= 70 ? "outline" : 
                                  team.balanceScore >= 50 ? "secondary" : 
                                  "destructive"
                                }
                                className={team.balanceScore >= 70 ? "bg-green-50 text-green-800 border-green-200" : ""}
                              >
                                Balans score: {team.balanceScore}
                              </Badge>
                            </div>
                            
                            {severeGaps.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm flex items-center">
                                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                                  Ernstige hiaten
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {severeGaps.map(gap => (
                                    <div 
                                      key={gap.role} 
                                      className="flex items-center p-2 border border-red-200 rounded bg-red-50"
                                    >
                                      <div 
                                        className="h-3 w-3 rounded-full mr-2" 
                                        style={{ 
                                          backgroundColor: ROLE_COLORS[gap.role as keyof typeof ROLE_COLORS] 
                                        }}
                                      />
                                      <span className="font-medium text-sm">{gap.role}</span>
                                      <span className="text-red-700 text-sm ml-auto">-{gap.percentage}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {moderateGaps.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm flex items-center">
                                  <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                                  Matige hiaten
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {moderateGaps.map(gap => (
                                    <div 
                                      key={gap.role} 
                                      className="flex items-center p-2 border border-amber-200 rounded bg-amber-50"
                                    >
                                      <div 
                                        className="h-3 w-3 rounded-full mr-2" 
                                        style={{ 
                                          backgroundColor: ROLE_COLORS[gap.role as keyof typeof ROLE_COLORS] 
                                        }}
                                      />
                                      <span className="font-medium text-sm">{gap.role}</span>
                                      <span className="text-amber-700 text-sm ml-auto">-{gap.percentage}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {severeGaps.length === 0 && moderateGaps.length === 0 && (
                              <div className="flex items-center text-green-700 bg-green-50 p-3 rounded">
                                <Check className="h-4 w-4 mr-2 text-green-500" />
                                <span>Dit team heeft een goede rollenbalans</span>
                              </div>
                            )}
                            
                            <div className="flex justify-end">
                              <Alert variant="default" className="bg-blue-50 border-blue-100 p-3 my-2 w-full">
                                <ArrowRight className="h-4 w-4 text-blue-500" />
                                <AlertDescription className="text-sm">
                                  Aanbevolen actie: {
                                    severeGaps.length > 0 
                                      ? `Versterk ${severeGaps[0].role} rol in dit team` 
                                      : moderateGaps.length > 0 
                                        ? `Overweeg ${moderateGaps[0].role} rol te versterken` 
                                        : "Behoud de huidige balans"
                                  }
                                </AlertDescription>
                              </Alert>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">Geen teams beschikbaar voor analyse</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // Team-level gap analysis (original view)
        <>
          <h2 className="text-2xl font-bold">Rollen Analyse</h2>
          
          {/* Gap Analysis Chart */}
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis label={{ value: 'Verschil met ideale verdeling (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Verschil']}
                  labelFormatter={(label) => `Rol: ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="gap" 
                  name="Verschil met ideaal" 
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <rect 
                      key={`cell-${index}`} 
                      fill={entry.gap > 0 ? entry.color : '#888888'} 
                      opacity={Math.abs(entry.gap) / 20 + 0.5} // Adjust opacity based on gap size
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Gap Analysis Recommendations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Aanbevelingen</h3>
            
            {significantGaps.length > 0 ? (
              <div className="space-y-4">
                {significantGaps.map(([role, gap]) => (
                  <Alert key={role} variant="default" className={gap > 10 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}>
                    <AlertCircle className={`h-4 w-4 ${gap > 10 ? "text-red-500" : "text-amber-500"}`} />
                    <AlertTitle className="flex items-center">
                      <div 
                        className="h-3 w-3 rounded-full mr-2" 
                        style={{ backgroundColor: ROLE_COLORS[role as keyof typeof ROLE_COLORS] }}
                      />
                      {role} rol versterken
                    </AlertTitle>
                    <AlertDescription>
                      Je team heeft een tekort aan de {role} rol. Overweeg om teamleden met deze rol toe te voegen
                      om een betere balans te creëren. Het huidige tekort is ongeveer {Math.round(gap)}% onder de ideale verdeling.
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Je team heeft een goede balans van rollen. Alle rollen zijn binnen 5% van de ideale verdeling.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}