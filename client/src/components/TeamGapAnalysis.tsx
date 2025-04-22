import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ROLES, ROLE_LABELS, ROLE_COLORS } from "@shared/constants";
import { RoleResults } from "@shared/types";
import { AlertCircle, Check, AlertTriangle, Users, TrendingUp, TrendingDown } from "lucide-react";
import { getTeamRoleDistribution, calculatePrimaryRole, RoleScores } from "@/utils/roleCalculations";

interface TeamMember {
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

interface TeamGapAnalysisProps {
  teamMembers: TeamMember[];
  teamRoleScores: RoleResults;
}

// Gap status type definition
type GapStatus = 'deficit' | 'balanced' | 'surplus';

export default function TeamGapAnalysis({ teamMembers, teamRoleScores }: TeamGapAnalysisProps) {
  // Calculate thresholds for team balance using the shared utility
  const { roleBalanceAnalysis, teamInsights } = useMemo(() => {
    const completedMembers = teamMembers.filter(m => m.profile !== null).length;
    if (completedMembers === 0) return { roleBalanceAnalysis: [], teamInsights: null };
    
    // Calculate the ideal distribution (perfect balance)
    const idealPercentPerRole = 100 / Object.keys(ROLES).length;
    
    // Get the primary role distribution using our shared utility
    const primaryRoleDistribution = getTeamRoleDistribution(teamMembers);
    
    // Calculate total members with primary roles
    const totalMembers = Object.values(primaryRoleDistribution).reduce((sum, count) => sum + count, 0);
    
    // Calculate the profile type distribution
    const profileTypeCount = {
      balanced: 0,
      moderate: 0,
      specialized: 0,
      unknown: 0
    };
    
    // Count members by profile type
    teamMembers.forEach(member => {
      if (!member.profile) return;
      
      const profile = calculatePrimaryRole(member.profile as RoleScores);
      if (profile.profileType) {
        profileTypeCount[profile.profileType]++;
      }
    });
    
    // Perform gap analysis
    const analysis = Object.entries(primaryRoleDistribution).map(([role, count]) => {
      // Calculate percentages based on member counts, not score totals
      const actualPercentage = totalMembers > 0 ? (count / totalMembers) * 100 : 0;
      const percentOfIdeal = actualPercentage / idealPercentPerRole;
      
      // Establish thresholds for identifying gaps or surpluses
      let status: GapStatus = 'balanced';
      if (percentOfIdeal < 0.7) status = 'deficit';
      else if (percentOfIdeal > 1.3) status = 'surplus';
      
      // Generate a custom recommendation for each role
      let recommendation = '';
      const roleLabel = ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role;
      
      if (status === 'deficit') {
        recommendation = `Het team heeft behoefte aan meer ${roleLabel} energie.`;
      } else if (status === 'surplus') {
        recommendation = `Deze bediening is dominant aanwezig. Overweeg om de ${roleLabel} energie strategisch in te zetten.`;
      } else {
        recommendation = `Er is een goede balans van ${roleLabel} energie in het team.`;
      }
      
      return {
        role,
        roleLabel,
        count,
        percentage: actualPercentage,
        percentOfIdeal,
        status,
        recommendation,
        color: ROLE_COLORS[role as keyof typeof ROLE_COLORS] || '#6B7280'
      };
    }).sort((a, b) => a.percentOfIdeal - b.percentOfIdeal); // Sort to show deficits first
    
    // Generate team insights
    const insights = {
      totalMembersWithProfiles: completedMembers,
      dominantRole: analysis.find(a => a.status === 'surplus')?.role || null,
      weakestRole: analysis.find(a => a.status === 'deficit')?.role || null,
      profileTypeDistribution: profileTypeCount,
      balanceScore: Math.round(analysis.reduce((sum, item) => {
        // The closer to 1 (ideal), the better the balance score
        return sum + (1 - Math.abs(1 - item.percentOfIdeal) / 2);
      }, 0) / analysis.length * 100)
    };
    
    return { 
      roleBalanceAnalysis: analysis,
      teamInsights: insights
    };
  }, [teamMembers]);
  
  // No data check
  const hasNoData = teamMembers.filter(m => m.profile !== null).length === 0;
  
  return (
    <Card className="bg-white shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">Team Bedieningen Balans</CardTitle>
        <CardDescription>
          Analyse van sterke en zwakke bedieningen in je team
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasNoData ? (
          <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Onvoldoende gegevens</AlertTitle>
            <AlertDescription>
              Er zijn nog geen teamleden die de vragenlijst hebben ingevuld. Nodig je teamleden uit om de vragenlijst in te vullen om de balans in je team te analyseren.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Team Insights Summary */}
            {teamInsights && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                    <div>
                      <h4 className="font-medium text-blue-900">Team Samenstelling</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {teamInsights.totalMembersWithProfiles} leden met profiel
                      </p>
                      <div className="mt-2 text-xs text-blue-600">
                        <div>{teamInsights.profileTypeDistribution.specialized} gespecialiseerd</div>
                        <div>{teamInsights.profileTypeDistribution.moderate} gematigd</div>
                        <div>{teamInsights.profileTypeDistribution.balanced} evenwichtig</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <TrendingUp className="h-5 w-5 text-emerald-600 mt-0.5 mr-2" />
                    <div>
                      <h4 className="font-medium text-emerald-900">Sterkste Bediening</h4>
                      {teamInsights.dominantRole ? (
                        <p className="text-sm text-emerald-700 mt-1">
                          {ROLE_LABELS[teamInsights.dominantRole as keyof typeof ROLE_LABELS] || teamInsights.dominantRole}
                        </p>
                      ) : (
                        <p className="text-sm text-emerald-700 mt-1">
                          Goede balans tussen alle bedieningen
                        </p>
                      )}
                      <div className="mt-2 text-xs text-emerald-600">
                        Balance score: {teamInsights.balanceScore}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-rose-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <TrendingDown className="h-5 w-5 text-rose-600 mt-0.5 mr-2" />
                    <div>
                      <h4 className="font-medium text-rose-900">Zwakste Bediening</h4>
                      {teamInsights.weakestRole ? (
                        <p className="text-sm text-rose-700 mt-1">
                          {ROLE_LABELS[teamInsights.weakestRole as keyof typeof ROLE_LABELS] || teamInsights.weakestRole}
                        </p>
                      ) : (
                        <p className="text-sm text-rose-700 mt-1">
                          Geen significante zwakke punten
                        </p>
                      )}
                      <div className="mt-2 text-xs text-rose-600">
                        Aandachtspunt voor werving
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-4">Ondervertegenwoordigde Bedieningen</h3>
                {roleBalanceAnalysis.filter(a => a.status === 'deficit').length === 0 ? (
                  <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                    <Check className="h-4 w-4 text-green-500" />
                    <AlertTitle>Goed in balans!</AlertTitle>
                    <AlertDescription>
                      Alle bedieningen zijn goed vertegenwoordigd in je team.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {roleBalanceAnalysis
                      .filter(a => a.status === 'deficit')
                      .map(analysis => (
                        <div key={analysis.role} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <span 
                                className="inline-block px-2 py-1 rounded-md text-xs font-medium text-white"
                                style={{ backgroundColor: analysis.color || '#6B7280' }}
                              >
                                {analysis.roleLabel}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">
                                {Math.round(analysis.percentage)}% (ideaal: {Math.round(100 / Object.keys(ROLES).length)}%)
                              </span>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded bg-rose-100 text-rose-800">
                              {analysis.count} {analysis.count === 1 ? 'lid' : 'leden'}
                            </span>
                          </div>
                          <Progress 
                            value={analysis.percentOfIdeal * 100} 
                            max={100}
                            className="h-2"
                            style={{ backgroundColor: `${analysis.color}30`, color: analysis.color }}
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            {analysis.recommendation}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-4">Oververtegenwoordigde Bedieningen</h3>
                {roleBalanceAnalysis.filter(a => a.status === 'surplus').length === 0 ? (
                  <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                    <Check className="h-4 w-4 text-green-500" />
                    <AlertTitle>Goed in balans!</AlertTitle>
                    <AlertDescription>
                      Geen enkele bediening is overheersend in je team.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {roleBalanceAnalysis
                      .filter(a => a.status === 'surplus')
                      .map(analysis => (
                        <div key={analysis.role} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <span 
                                className="inline-block px-2 py-1 rounded-md text-xs font-medium text-white"
                                style={{ backgroundColor: analysis.color || '#6B7280' }}
                              >
                                {analysis.roleLabel}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">
                                {Math.round(analysis.percentage)}% (ideaal: {Math.round(100 / Object.keys(ROLES).length)}%)
                              </span>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
                              {analysis.count} {analysis.count === 1 ? 'lid' : 'leden'}
                            </span>
                          </div>
                          <Progress 
                            value={100} 
                            max={100}
                            className="h-2" 
                            style={{ backgroundColor: `${analysis.color}30`, color: analysis.color }}
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            {analysis.recommendation}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            
            <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200 mt-4">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertTitle>Volgende stappen</AlertTitle>
              <AlertDescription>
                <p>Om de balans in je team te verbeteren:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Maak gebruik van de sterke bedieningen in je team bij het plannen van activiteiten</li>
                  <li>Overweeg nieuwe leden aan te trekken met de ondervertegenwoordigde bedieningen</li>
                  <li>Help bestaande leden hun secundaire bedieningen te ontwikkelen in zwakke gebieden</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}