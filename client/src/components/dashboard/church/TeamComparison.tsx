import React, { useState } from "react";
import RoleChart from "@/components/RoleChart";
import { ROLE_COLORS, ROLES } from "@shared/constants";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { XCircle, Users } from "lucide-react";
import { Label } from "@/components/ui/label";

type TeamSummary = {
  id: number;
  name: string;
  memberCount: number;
  roleDistribution: Record<string, number>;
  dominantRole?: string;
  dominantRoleScore?: number;
  dominantRoleStrength?: number;
};

interface TeamComparisonProps {
  teams: TeamSummary[];
}

export function TeamComparison({ teams }: TeamComparisonProps) {
  // State to keep track of the selected teams for comparison (max 3)
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [chartType, setChartType] = useState<"radar" | "bar" | "pie">("radar");

  // Get the actual team objects for the selected IDs
  const selectedTeams = teams.filter(team => selectedTeamIds.includes(team.id));

  // Function to add a team to the comparison
  const addTeamToComparison = (teamId: number) => {
    if (selectedTeamIds.length < 3 && !selectedTeamIds.includes(teamId)) {
      setSelectedTeamIds([...selectedTeamIds, teamId]);
    }
  };

  // Function to remove a team from the comparison
  const removeTeamFromComparison = (teamId: number) => {
    setSelectedTeamIds(selectedTeamIds.filter(id => id !== teamId));
  };

  // Calculate a simple "balance score" from the role distribution
  // A perfectly balanced team would have an even distribution of roles (20% each for 5 roles)
  const calculateBalanceScore = (roleDistribution: Record<string, number>): number => {
    const totalScore = Object.values(roleDistribution).reduce((sum, score) => sum + (score as number), 0);
    if (totalScore === 0) return 0;
    
    // Calculate the ideal even distribution (20% per role)
    const idealPercentage = 20;
    
    // Calculate the deviation from ideal for each role
    const deviations = Object.values(roleDistribution).map(score => {
      const percentage = (score as number) / totalScore * 100;
      return Math.abs(percentage - idealPercentage);
    });
    
    // Average deviation (lower is better)
    const avgDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
    
    // Convert to a 0-100 scale where 100 is perfectly balanced
    // Max possible deviation is 80 (one role has 100%, others 0%)
    return Math.round(100 - (avgDeviation * 1.25));
  };

  return (
    <div className="space-y-6 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Team Vergelijking</h2>
        <div className="flex space-x-2">
          <Select value={chartType} onValueChange={(value) => setChartType(value as "radar" | "bar" | "pie")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Grafiektype" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="radar">Radar Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Team Selection Area */}
      <Card>
        <CardHeader>
          <CardTitle>Teams Selecteren</CardTitle>
          <CardDescription>Kies maximaal 3 teams om te vergelijken</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {selectedTeamIds.length < 3 && (
              <div className="flex-1 min-w-[250px]">
                <Label>Voeg team toe</Label>
                <Select onValueChange={(value) => addTeamToComparison(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Team selecteren" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter(team => !selectedTeamIds.includes(team.id))
                      .map(team => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {selectedTeamIds.map(teamId => {
              const team = teams.find(t => t.id === teamId);
              if (!team) return null;
              
              return (
                <div key={teamId} className="flex-1 min-w-[250px] bg-muted/30 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{team.name}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeTeamFromComparison(teamId)}
                    >
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{team.memberCount} leden</span>
                  </div>
                </div>
              );
            })}
            
            {selectedTeamIds.length === 0 && (
              <div className="w-full text-center py-4 text-muted-foreground">
                <p>Selecteer teams om te vergelijken</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Area */}
      {selectedTeams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedTeams.map(team => {
            const balanceScore = calculateBalanceScore(team.roleDistribution);
            const dominantRole = Object.entries(team.roleDistribution)
              .reduce((max, [role, score]) => 
                (score as number) > max.score ? { role, score: score as number } : max, 
                { role: "", score: 0 }
              );
            
            const weakestRole = Object.entries(team.roleDistribution)
              .reduce((min, [role, score]) => 
                (score as number) < min.score || min.score === 0 ? { role, score: score as number } : min, 
                { role: "", score: Number.MAX_VALUE }
              );
            
            // Calculate total score
            const totalScore = Object.values(team.roleDistribution)
              .reduce((sum, score) => sum + (score as number), 0);
            
            // Calculate percentages for dominant and weakest roles
            const dominantPercentage = totalScore > 0 
              ? Math.round((dominantRole.score / totalScore) * 100) 
              : 0;
            
            const weakestPercentage = totalScore > 0 && weakestRole.score !== Number.MAX_VALUE
              ? Math.round((weakestRole.score / totalScore) * 100)
              : 0;

            return (
              <Card key={team.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    {team.name}
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{team.memberCount}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-center">
                    <RoleChart 
                      results={team.roleDistribution} 
                      type={chartType} 
                      height={200} 
                      width={200}
                      showLegend={false}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {/* Balance Score */}
                    <div className="bg-muted/30 p-3 rounded-md text-center">
                      <div className="text-sm text-muted-foreground mb-1">Balans</div>
                      <div className="font-semibold">
                        {balanceScore}%
                      </div>
                    </div>
                    
                    {/* Dominant Role */}
                    <div className="bg-muted/30 p-3 rounded-md text-center">
                      <div className="text-sm text-muted-foreground mb-1">Sterkste</div>
                      <div className="font-semibold flex items-center justify-center">
                        <div 
                          className="h-2 w-2 rounded-full mr-1" 
                          style={{ 
                            backgroundColor: ROLE_COLORS[dominantRole.role as keyof typeof ROLE_COLORS] 
                          }}
                        />
                        {dominantPercentage}%
                      </div>
                      <div className="text-xs">{dominantRole.role}</div>
                    </div>
                    
                    {/* Weakest Role */}
                    <div className="bg-muted/30 p-3 rounded-md text-center">
                      <div className="text-sm text-muted-foreground mb-1">Zwakste</div>
                      <div className="font-semibold flex items-center justify-center">
                        {weakestRole.role && (
                          <>
                            <div 
                              className="h-2 w-2 rounded-full mr-1" 
                              style={{ 
                                backgroundColor: ROLE_COLORS[weakestRole.role as keyof typeof ROLE_COLORS] 
                              }}
                            />
                            {weakestPercentage}%
                          </>
                        )}
                      </div>
                      <div className="text-xs">{weakestRole.role}</div>
                    </div>
                  </div>
                  
                  {/* Role Distribution Table */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Rolverdeling</h4>
                    <div className="grid grid-cols-5 gap-1">
                      {Object.entries(team.roleDistribution).map(([role, score]) => {
                        const percentage = totalScore > 0
                          ? Math.round(((score as number) / totalScore) * 100)
                          : 0;
                        
                        return (
                          <div key={role} className="text-center">
                            <div 
                              className="h-2 mx-auto w-full rounded-full mb-1" 
                              style={{ 
                                backgroundColor: ROLE_COLORS[role as keyof typeof ROLE_COLORS],
                                opacity: 0.3
                              }}
                            >
                              <div 
                                className="h-2 rounded-full" 
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: ROLE_COLORS[role as keyof typeof ROLE_COLORS]
                                }}
                              />
                            </div>
                            <div className="text-xs font-medium">{role.substring(0, 1)}</div>
                            <div className="text-xs">{percentage}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}