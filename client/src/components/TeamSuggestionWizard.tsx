import { useState, useEffect, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ArrowRight, UserPlus, Users, Settings, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ROLES, ROLE_COLORS } from "@/lib/constants";
import { RadarChart } from "./RadarChart";

// Define the team member interface
interface TeamMember {
  id: number;
  name: string;
  email: string;
  profile?: {
    id: number;
    userId: number;
    apostle: number;
    prophet: number;
    evangelist: number;
    herder: number;
    teacher: number;
    responses?: any[];
    primaryRole?: string;
    secondaryRole?: string;
  };
  roleScores?: {
    apostle: number;
    prophet: number;
    evangelist: number;
    shepherd: number;
    teacher: number;
    primaryRole?: string;
    secondaryRole?: string;
  };
  teamId?: number | null;
  selected?: boolean;
}

// Define the team suggestion parameters
interface TeamSuggestionParams {
  teamName: string;
  teamSize: number;
  balanceFactor: number; // 0 = diverse, 100 = specialized
  priorityRole?: string;
}

// Define the wizard steps
enum WizardStep {
  TeamSetup,
  MemberSelection,
  RoleBalancing,
  SuggestedTeam,
  Confirmation
}

// Define the props for the wizard
interface TeamSuggestionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchMembers: TeamMember[];
  churchId: number;
  existingTeams: Array<{id: number, name: string}>;
}

// Main component
export default function TeamSuggestionWizard({
  open,
  onOpenChange,
  churchMembers,
  churchId,
  existingTeams
}: TeamSuggestionWizardProps) {
  // State
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.TeamSetup);
  const [params, setParams] = useState<TeamSuggestionParams>({
    teamName: "",
    teamSize: 5,
    balanceFactor: 50,
  });
  const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
  const [suggestedTeam, setSuggestedTeam] = useState<TeamMember[]>([]);
  const [aggregatedRoleScores, setAggregatedRoleScores] = useState<{
    apostle: number;
    prophet: number;
    evangelist: number;
    shepherd: number;
    teacher: number;
  }>({
    apostle: 0,
    prophet: 0,
    evangelist: 0,
    shepherd: 0,
    teacher: 0
  });

  // Used to track initial opening vs state transitions
  const isFirstRender = useRef(true);
  const previousOpen = useRef(false);
  const modalHasBeenOpened = useRef(false);
  
  // Handle wizard state initialization and eligible member filtering
  useEffect(() => {
    // Only reset the state when the modal is first opened (not during step transitions)
    if (open && !modalHasBeenOpened.current) {
      console.log("Initializing wizard state - first time opening");
      setCurrentStep(WizardStep.TeamSetup);
      setParams({
        teamName: "",
        teamSize: 5,
        balanceFactor: 50,
      });
      setSelectedMembers([]);
      setSuggestedTeam([]);
      
      // Mark that we've handled the first open
      modalHasBeenOpened.current = true;
      isFirstRender.current = false;
    } else if (!open) {
      // Only reset the flag when modal is fully closed
      modalHasBeenOpened.current = false;
    }
    
    // Update the reference to track modal state changes
    previousOpen.current = open;

    // Process church members whenever the wizard is open
    if (open) {
      console.log("Church members:", churchMembers);
      
      // Filter members with profile data - allow members already in a team
      const eligibleMembers = churchMembers
        .filter(member => {
          // Check if member has a profile with role scores
          const hasProfile = member.profile && 
            (member.profile.apostle > 0 || 
             member.profile.prophet > 0 || 
             member.profile.evangelist > 0 || 
             member.profile.herder > 0 || 
             member.profile.teacher > 0);
             
          // Check if member has roleScores directly
          const hasRoleScores = member.roleScores && 
            (member.roleScores.apostle > 0 || 
             member.roleScores.prophet > 0 || 
             member.roleScores.evangelist > 0 || 
             member.roleScores.shepherd > 0 || 
             member.roleScores.teacher > 0);
          
          console.log(`Member ${member.name} has profile: ${hasProfile ? 'YES' : 'NO'}`, member.profile);
          console.log(`Member ${member.name} has roleScores: ${hasRoleScores ? 'YES' : 'NO'}`, member.roleScores);
          
          // If the member has a profile but not roleScores, create a roleScores object from it for compatibility
          if (hasProfile && member.profile && !member.roleScores) {
            // Create roleScores from profile data
            member.roleScores = {
              apostle: member.profile.apostle,
              prophet: member.profile.prophet,
              evangelist: member.profile.evangelist,
              shepherd: member.profile.herder, // Map herder to shepherd
              teacher: member.profile.teacher,
              primaryRole: member.profile.primaryRole,
              secondaryRole: member.profile.secondaryRole
            };
          }
          
          return hasProfile || hasRoleScores;
        })
        .map(member => ({ ...member, selected: false }));
      
      console.log("Eligible members:", eligibleMembers);
      setAvailableMembers(eligibleMembers);
    }
  }, [open, churchMembers]);

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async () => {
      // First create the team
      const teamRes = await apiRequest("POST", "/api/teams", {
        name: params.teamName,
        churchId
      });
      
      if (!teamRes.ok) {
        const errorText = await teamRes.text();
        throw new Error(`Failed to create team: ${errorText}`);
      }
      
      const team = await teamRes.json();
      
      // Then add each member to the team
      const memberPromises = suggestedTeam.map(member => 
        apiRequest("POST", `/api/teams/${team.id}/add-member`, { 
          userId: member.id 
        })
      );
      
      await Promise.all(memberPromises);
      
      return team;
    },
    onSuccess: () => {
      // Close the dialog and show success message
      onOpenChange(false);
      toast({
        title: "Team aangemaakt",
        description: `Het team "${params.teamName}" is succesvol aangemaakt met ${suggestedTeam.length} leden`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/churches", churchId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/churches", churchId, "dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij aanmaken team",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Calculate if we can proceed to the next step
  const canProceedFromStep = (step: WizardStep): boolean => {
    switch (step) {
      case WizardStep.TeamSetup:
        return params.teamName.trim().length > 0;
      case WizardStep.MemberSelection:
        return selectedMembers.length > 0;
      case WizardStep.RoleBalancing:
        return true; // Can always proceed from role balancing
      case WizardStep.SuggestedTeam:
        return suggestedTeam.length > 0;
      default:
        return false;
    }
  };

  // Handle toggling member selection
  const toggleMemberSelection = (member: TeamMember) => {
    // First, update the availableMembers state to show the selection visually
    setAvailableMembers(prev => 
      prev.map(m => 
        m.id === member.id ? { ...m, selected: !m.selected } : m
      )
    );

    // Then, update the selectedMembers list
    setSelectedMembers(prev => {
      const alreadySelected = prev.some(m => m.id === member.id);
      if (alreadySelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        return [...prev, { ...member, selected: true }];
      }
    });
  };

  // Get step title
  const getStepTitle = (step: WizardStep): string => {
    switch (step) {
      case WizardStep.TeamSetup:
        return "Team instellen";
      case WizardStep.MemberSelection:
        return "Leden selecteren";
      case WizardStep.RoleBalancing:
        return "Teambalans instellen";
      case WizardStep.SuggestedTeam:
        return "Voorgesteld team";
      case WizardStep.Confirmation:
        return "Bevestiging";
      default:
        return "";
    }
  };

  // Get the role vector for a member to use in team algorithms
  const getMemberRoleVector = (member: TeamMember) => {
    if (!member.roleScores && !member.profile) return null;
    
    // Use roleScores if available, otherwise use profile
    if (member.roleScores) {
      return [
        member.roleScores.apostle, 
        member.roleScores.prophet,
        member.roleScores.evangelist,
        member.roleScores.shepherd,
        member.roleScores.teacher
      ];
    } else if (member.profile) {
      return [
        member.profile.apostle,
        member.profile.prophet,
        member.profile.evangelist,
        member.profile.herder, // Note: maps to shepherd
        member.profile.teacher
      ];
    }
    
    return null;
  };

  // Generate a suggested team based on selection and balance parameters
  const generateSuggestedTeam = () => {
    if (selectedMembers.length === 0) return;
    
    // If we don't have more members than team size, use all of them
    if (selectedMembers.length <= params.teamSize) {
      setSuggestedTeam(selectedMembers);
      
      // Calculate aggregated role scores
      const aggregated = selectedMembers.reduce((acc, member) => {
        if (member.roleScores) {
          acc.apostle += member.roleScores.apostle || 0;
          acc.prophet += member.roleScores.prophet || 0;
          acc.evangelist += member.roleScores.evangelist || 0;
          acc.shepherd += member.roleScores.shepherd || 0;
          acc.teacher += member.roleScores.teacher || 0;
        } else if (member.profile) {
          acc.apostle += member.profile.apostle || 0;
          acc.prophet += member.profile.prophet || 0;
          acc.evangelist += member.profile.evangelist || 0;
          acc.shepherd += member.profile.herder || 0; // Map herder to shepherd
          acc.teacher += member.profile.teacher || 0;
        }
        return acc;
      }, {
        apostle: 0,
        prophet: 0,
        evangelist: 0,
        shepherd: 0,
        teacher: 0
      });

      setAggregatedRoleScores(aggregated);
      return;
    }
    
    // More complex algorithm for team balancing
    const balanceFactor = params.balanceFactor / 100; // Convert to 0-1 range
    
    // 1. Include members with the priority role if specified
    let teamMembers: TeamMember[] = [];
    let remainingMembers = [...selectedMembers];
    
    if (params.priorityRole) {
      // Sort by the priority role score (highest first)
      const priorityRoleKey = params.priorityRole.toLowerCase() as keyof typeof aggregatedRoleScores;
      
      // First, add members with high scores in the priority role
      remainingMembers.sort((a, b) => {
        // Get score from roleScores or profile
        let scoreA = 0;
        let scoreB = 0;
        
        if (a.roleScores) {
          scoreA = a.roleScores[priorityRoleKey] || 0;
        } else if (a.profile) {
          // Map shepherd to herder when needed
          scoreA = priorityRoleKey === 'shepherd' 
            ? (a.profile.herder || 0) 
            : (a.profile[priorityRoleKey as keyof typeof a.profile] as number || 0);
        }
        
        if (b.roleScores) {
          scoreB = b.roleScores[priorityRoleKey] || 0;
        } else if (b.profile) {
          // Map shepherd to herder when needed
          scoreB = priorityRoleKey === 'shepherd' 
            ? (b.profile.herder || 0) 
            : (b.profile[priorityRoleKey as keyof typeof b.profile] as number || 0);
        }
        
        return scoreB - scoreA;
      });
      
      // Take top performers in priority role (up to half of team size)
      const priorityCount = Math.ceil(params.teamSize / 2);
      teamMembers = remainingMembers.slice(0, priorityCount);
      remainingMembers = remainingMembers.slice(priorityCount);
    }
    
    // 2. For the rest of the team, use a balance algorithm
    if (teamMembers.length < params.teamSize) {
      // Calculate current team profile
      let teamProfile = teamMembers.reduce((acc, member) => {
        if (member.roleScores) {
          acc.apostle += member.roleScores.apostle || 0;
          acc.prophet += member.roleScores.prophet || 0;
          acc.evangelist += member.roleScores.evangelist || 0;
          acc.shepherd += member.roleScores.shepherd || 0;
          acc.teacher += member.roleScores.teacher || 0;
        } else if (member.profile) {
          acc.apostle += member.profile.apostle || 0;
          acc.prophet += member.profile.prophet || 0;
          acc.evangelist += member.profile.evangelist || 0;
          acc.shepherd += member.profile.herder || 0; // Map herder to shepherd
          acc.teacher += member.profile.teacher || 0;
        }
        return acc;
      }, {
        apostle: 0,
        prophet: 0,
        evangelist: 0,
        shepherd: 0,
        teacher: 0
      });
      
      // For remaining slots
      while (teamMembers.length < params.teamSize && remainingMembers.length > 0) {
        // Depending on balance factor, choose diverse or specialized approach
        if (balanceFactor < 0.5) {
          // DIVERSE APPROACH - Look for members who fill weak areas
          
          // Find the weakest role in current team
          const roleKeys = Object.keys(teamProfile) as Array<keyof typeof teamProfile>;
          const weakestRole = roleKeys.reduce((weakest, role) => 
            teamProfile[role] < teamProfile[weakest] ? role : weakest
          , roleKeys[0]);
          
          // Sort remaining members by their score in the weakest role
          remainingMembers.sort((a, b) => {
            // Get score from roleScores or profile
            let scoreA = 0;
            let scoreB = 0;
            
            if (a.roleScores) {
              scoreA = a.roleScores[weakestRole] || 0;
            } else if (a.profile) {
              // Map shepherd to herder when needed
              scoreA = weakestRole === 'shepherd' 
                ? (a.profile.herder || 0) 
                : (a.profile[weakestRole as keyof typeof a.profile] as number || 0);
            }
            
            if (b.roleScores) {
              scoreB = b.roleScores[weakestRole] || 0;
            } else if (b.profile) {
              // Map shepherd to herder when needed
              scoreB = weakestRole === 'shepherd' 
                ? (b.profile.herder || 0) 
                : (b.profile[weakestRole as keyof typeof b.profile] as number || 0);
            }
            
            return scoreB - scoreA;
          });
        } else {
          // SPECIALIZED APPROACH - Look for members with strong existing roles
          
          // Find the strongest role in current team
          const roleKeys = Object.keys(teamProfile) as Array<keyof typeof teamProfile>;
          const strongestRole = roleKeys.reduce((strongest, role) => 
            teamProfile[role] > teamProfile[strongest] ? role : strongest
          , roleKeys[0]);
          
          // Sort remaining members by their score in the strongest role
          remainingMembers.sort((a, b) => {
            // Get score from roleScores or profile
            let scoreA = 0;
            let scoreB = 0;
            
            if (a.roleScores) {
              scoreA = a.roleScores[strongestRole] || 0;
            } else if (a.profile) {
              // Map shepherd to herder when needed
              scoreA = strongestRole === 'shepherd' 
                ? (a.profile.herder || 0) 
                : (a.profile[strongestRole as keyof typeof a.profile] as number || 0);
            }
            
            if (b.roleScores) {
              scoreB = b.roleScores[strongestRole] || 0;
            } else if (b.profile) {
              // Map shepherd to herder when needed
              scoreB = strongestRole === 'shepherd' 
                ? (b.profile.herder || 0) 
                : (b.profile[strongestRole as keyof typeof b.profile] as number || 0);
            }
            
            return scoreB - scoreA;
          });
        }
        
        // Add the top member to the team
        const nextMember = remainingMembers.shift();
        if (nextMember) {
          teamMembers.push(nextMember);
          
          // Update team profile
          if (nextMember.roleScores) {
            teamProfile.apostle += nextMember.roleScores.apostle || 0;
            teamProfile.prophet += nextMember.roleScores.prophet || 0;
            teamProfile.evangelist += nextMember.roleScores.evangelist || 0;
            teamProfile.shepherd += nextMember.roleScores.shepherd || 0;
            teamProfile.teacher += nextMember.roleScores.teacher || 0;
          } else if (nextMember.profile) {
            teamProfile.apostle += nextMember.profile.apostle || 0;
            teamProfile.prophet += nextMember.profile.prophet || 0;
            teamProfile.evangelist += nextMember.profile.evangelist || 0;
            teamProfile.shepherd += nextMember.profile.herder || 0; // Map herder to shepherd
            teamProfile.teacher += nextMember.profile.teacher || 0;
          }
        }
      }
    }
    
    // Set the suggested team
    setSuggestedTeam(teamMembers);
    
    // Calculate and set aggregated role scores
    const aggregated = teamMembers.reduce((acc, member) => {
      if (member.roleScores) {
        acc.apostle += member.roleScores.apostle || 0;
        acc.prophet += member.roleScores.prophet || 0;
        acc.evangelist += member.roleScores.evangelist || 0;
        acc.shepherd += member.roleScores.shepherd || 0;
        acc.teacher += member.roleScores.teacher || 0;
      } else if (member.profile) {
        acc.apostle += member.profile.apostle || 0;
        acc.prophet += member.profile.prophet || 0;
        acc.evangelist += member.profile.evangelist || 0;
        acc.shepherd += member.profile.herder || 0; // Map herder to shepherd
        acc.teacher += member.profile.teacher || 0;
      }
      return acc;
    }, {
      apostle: 0,
      prophet: 0,
      evangelist: 0,
      shepherd: 0,
      teacher: 0
    });

    setAggregatedRoleScores(aggregated);
  };

  // Handle next step
  const handleNextStep = () => {
    const nextStep = currentStep + 1;
    
    // Persist data between steps and ensure proper state management
    if (currentStep === WizardStep.MemberSelection) {
      // After selecting members, ensure they remain selected when moving to role balancing
      // No state reset needed here, just maintain selected state
      console.log("Moving from member selection to role balancing");
      console.log("Selected members:", selectedMembers.length);
    }
    
    // Handle specific step transitions
    if (currentStep === WizardStep.RoleBalancing) {
      // Generate the suggested team when moving to the team view
      generateSuggestedTeam();
      console.log("Generated suggested team with", suggestedTeam.length, "members");
    }
    
    // If final confirmation, create the team
    if (nextStep === WizardStep.Confirmation) {
      createTeamMutation.mutate();
      console.log("Creating team:", params.teamName);
      return;
    }
    
    // Only update the current step, don't reset other state
    console.log("Moving to step:", nextStep);
    setCurrentStep(nextStep as WizardStep);
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  // Render the current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.TeamSetup:
        return (
          <div 
            className="space-y-4 py-4"
            onClick={(e) => {
              // Prevent bubbling which might trigger form submission
              e.stopPropagation();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="team-name">Teamnaam</Label>
              <Input 
                id="team-name"
                value={params.teamName}
                onChange={(e) => {
                  // Update state
                  setParams({ ...params, teamName: e.target.value });
                  // Prevent form submission
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  // Prevent Enter key from submitting form
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                placeholder="Voer een naam in voor het nieuwe team"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team-size">Teamgrootte: {params.teamSize} {params.teamSize === 1 ? 'persoon' : 'personen'}</Label>
              <Slider 
                id="team-size"
                min={1}
                max={15}
                step={1}
                value={[params.teamSize]}
                onValueChange={(values) => {
                  // Update state
                  setParams({ ...params, teamSize: values[0] });
                }}
                onClick={(e) => {
                  // Prevent bubbling which might trigger form submission
                  e.stopPropagation();
                }}
              />
            </div>
            
            <div className="mt-8 border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium mb-2">Bestaande teams</h4>
              {existingTeams.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {existingTeams.map((team) => (
                    <Badge key={team.id} variant="outline">{team.name}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Geen bestaande teams gevonden.</p>
              )}
            </div>
          </div>
        );
        
      case WizardStep.MemberSelection:
        return (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Selecteer de leden die je wilt overwegen voor dit team. Leden kunnen in meerdere teams zitten, dus selecteer alle geschikte personen voor je nieuwe team.
            </p>
            
            {availableMembers.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <div className="max-h-[350px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-2 text-sm font-medium">Selecteer</th>
                        <th className="text-left p-2 text-sm font-medium">Naam</th>
                        <th className="text-left p-2 text-sm font-medium">Primaire rol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableMembers.map((member) => (
                        <tr 
                          key={member.id} 
                          className="border-t hover:bg-muted/50"
                          onClick={(e) => {
                            // Prevent default to avoid form submission
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <td className="p-2">
                            <Checkbox 
                              checked={selectedMembers.some(m => m.id === member.id)}
                              onCheckedChange={(checked) => {
                                // Prevent default behavior to avoid form submission
                                toggleMemberSelection(member);
                              }}
                              onClick={(e) => {
                                // Prevent event bubbling
                                e.stopPropagation();
                              }}
                            />
                          </td>
                          <td className="p-2">{member.name}</td>
                          <td className="p-2">
                            {member.roleScores?.primaryRole ? (
                              <Badge 
                                className="font-normal" 
                                style={{ 
                                  backgroundColor: ROLE_COLORS[member.roleScores.primaryRole.toUpperCase() as keyof typeof ROLE_COLORS] + '30',
                                  color: ROLE_COLORS[member.roleScores.primaryRole.toUpperCase() as keyof typeof ROLE_COLORS] 
                                }}
                              >
                                {ROLES[member.roleScores.primaryRole.toUpperCase() as keyof typeof ROLES]}
                              </Badge>
                            ) : member.profile ? (
                              <Badge 
                                className="font-normal"
                                style={{
                                  backgroundColor: '#30b86730',
                                  color: '#30b867'
                                }}
                              >
                                Profiel aanwezig
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Onbekend</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="border rounded-md p-4 text-center text-muted-foreground">
                Geen geschikte leden gevonden. Zorg ervoor dat leden een bedieningsprofiel hebben ingevuld.
              </div>
            )}
            
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm">
                {selectedMembers.length} {selectedMembers.length === 1 ? 'lid' : 'leden'} geselecteerd
              </span>
              {params.teamSize < selectedMembers.length && (
                <span className="text-sm text-amber-500">
                  Je hebt meer leden geselecteerd dan de teamgrootte ({params.teamSize}). 
                  De wizard zal een optimale samenstelling voorstellen.
                </span>
              )}
            </div>
          </div>
        );
        
      case WizardStep.RoleBalancing:
        return (
          <div 
            className="space-y-4 py-4"
            onClick={(e) => {
              // Prevent bubbling which might trigger form submission
              e.stopPropagation();
            }}
          >
            <p className="text-sm text-muted-foreground mb-4">
              Stel in hoe het team moet worden samengesteld. Een diverse teamsamenstelling zal leden met aanvullende bedieningen kiezen, terwijl een gespecialiseerd team juist focust op het versterken van bepaalde bedieningen.
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Diverse teamsamenstelling</span>
                <span>Gespecialiseerd team</span>
              </div>
              <Slider 
                min={0}
                max={100}
                step={1}
                value={[params.balanceFactor]}
                onValueChange={(values) => {
                  // Update state
                  setParams({ ...params, balanceFactor: values[0] });
                }}
                onClick={(e) => {
                  // Prevent event bubbling
                  e.stopPropagation();
                }}
              />
              <div className="flex justify-between mt-1">
                <div className="flex-1 h-1 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
                <div className="flex-1 h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
              </div>
            </div>
            
            <div className="space-y-2 mt-6">
              <Label htmlFor="priority-role">Prioriteitsbediening (optioneel)</Label>
              <Select 
                value={params.priorityRole || "none"}
                onValueChange={(value) => setParams({ ...params, priorityRole: value === "none" ? undefined : value })}
              >
                <SelectTrigger id="priority-role">
                  <SelectValue placeholder="Kies een bediening om voorrang te geven" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen prioriteit</SelectItem>
                  <SelectItem value="APOSTLE">{ROLES.APOSTLE}</SelectItem>
                  <SelectItem value="PROPHET">{ROLES.PROPHET}</SelectItem>
                  <SelectItem value="EVANGELIST">{ROLES.EVANGELIST}</SelectItem>
                  <SelectItem value="SHEPHERD">{ROLES.SHEPHERD}</SelectItem>
                  <SelectItem value="TEACHER">{ROLES.TEACHER}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Wanneer je een prioriteitsbediening kiest, zal het voorgestelde team extra leden met deze bediening bevatten.
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Huidige selectie: {selectedMembers.length} leden</h3>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <Badge key={member.id} variant="outline" className="bg-primary/5">
                    {member.name}
                    {member.roleScores?.primaryRole && (
                      <span className="ml-1 inline-block w-2 h-2 rounded-full" style={{ 
                        backgroundColor: ROLE_COLORS[member.roleScores.primaryRole.toUpperCase() as keyof typeof ROLE_COLORS] 
                      }}></span>
                    )}
                    {!member.roleScores && member.profile && (
                      <span className="ml-1 inline-block w-2 h-2 rounded-full" style={{ 
                        backgroundColor: '#30b867' 
                      }}></span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );
        
      case WizardStep.SuggestedTeam:
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Voorgesteld team: {params.teamName}</h3>
              <p className="text-sm text-muted-foreground">
                Op basis van jouw instellingen is dit team samengesteld met {suggestedTeam.length} leden. 
                De totale scores per bediening worden hieronder weergegeven.
              </p>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 text-sm font-medium">Naam</th>
                    <th className="text-left p-2 text-sm font-medium">Primaire rol</th>
                    <th className="text-left p-2 text-sm font-medium">Secundaire rol</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestedTeam.map((member) => (
                    <tr key={member.id} className="border-t hover:bg-muted/50">
                      <td className="p-2">{member.name}</td>
                      <td className="p-2">
                        {member.roleScores?.primaryRole ? (
                          <Badge 
                            className="font-normal" 
                            style={{ 
                              backgroundColor: ROLE_COLORS[member.roleScores.primaryRole.toUpperCase() as keyof typeof ROLE_COLORS] + '30',
                              color: ROLE_COLORS[member.roleScores.primaryRole.toUpperCase() as keyof typeof ROLE_COLORS] 
                            }}
                          >
                            {ROLES[member.roleScores.primaryRole.toUpperCase() as keyof typeof ROLES]}
                          </Badge>
                        ) : member.profile ? (
                          <Badge 
                            className="font-normal"
                            style={{
                              backgroundColor: '#30b86730',
                              color: '#30b867'
                            }}
                          >
                            Profiel aanwezig
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        {member.roleScores?.secondaryRole ? (
                          <Badge 
                            variant="outline"
                            className="font-normal" 
                            style={{ 
                              borderColor: ROLE_COLORS[member.roleScores.secondaryRole.toUpperCase() as keyof typeof ROLE_COLORS],
                              color: ROLE_COLORS[member.roleScores.secondaryRole.toUpperCase() as keyof typeof ROLE_COLORS] 
                            }}
                          >
                            {ROLES[member.roleScores.secondaryRole.toUpperCase() as keyof typeof ROLES]}
                          </Badge>
                        ) : member.profile ? (
                          <Badge 
                            variant="outline"
                            className="font-normal"
                            style={{
                              borderColor: '#30b867',
                              color: '#30b867'
                            }}
                          >
                            Profiel aanwezig
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Teambedieningsprofiel</h4>
                <div className="bg-card rounded-lg p-4 border h-[300px] flex items-center justify-center">
                  <RadarChart data={aggregatedRoleScores} max={Math.max(...Object.values(aggregatedRoleScores)) + 5} showLegend={true} />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Team statistieken</h4>
                <div className="bg-card rounded-lg p-4 border h-[300px] space-y-4">
                  <div className="space-y-4">
                    {Object.entries(ROLES).map(([key, label]) => {
                      const roleKey = key.toLowerCase() as keyof typeof aggregatedRoleScores;
                      const score = aggregatedRoleScores[roleKey] || 0;
                      const percentage = Math.round((score / Object.values(aggregatedRoleScores).reduce((sum, val) => sum + val, 0)) * 100) || 0;
                      
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{label}</span>
                            <span className="text-sm font-medium">{score} ({percentage}%)</span>
                          </div>
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: ROLE_COLORS[key as keyof typeof ROLE_COLORS]
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
                
      default:
        return null;
    }
  };

  // Render wizard step indicator
  const renderStepIndicator = () => {
    const steps = [
      { step: WizardStep.TeamSetup, icon: <Settings className="h-4 w-4" /> },
      { step: WizardStep.MemberSelection, icon: <Users className="h-4 w-4" /> },
      { step: WizardStep.RoleBalancing, icon: <UserPlus className="h-4 w-4" /> },
      { step: WizardStep.SuggestedTeam, icon: <ThumbsUp className="h-4 w-4" /> }
    ];
    
    return (
      <div className="flex items-center justify-center space-x-2 pb-6 border-b mb-4">
        {steps.map(({ step, icon }) => (
          <div 
            key={step}
            className={`flex items-center ${step < steps.length - 1 ? 'flex-1' : ''}`}
          >
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full 
              ${currentStep === step 
                ? 'bg-primary text-primary-foreground' 
                : currentStep > step 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
              }
            `}>
              {currentStep > step ? <CheckCircle2 className="h-4 w-4" /> : icon}
            </div>
            
            {step < steps.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-2
                ${currentStep > step 
                  ? 'bg-primary/70' 
                  : 'bg-muted'
                }
              `}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Handle the dialog's close attempt - we'll prevent it from closing when changing steps
  const handleOpenChange = (newOpen: boolean) => {
    // If attempting to close the dialog, allow it
    if (!newOpen) {
      onOpenChange(false);
    }
    // Otherwise keep it open (we don't want it to re-render between steps)
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getStepTitle(currentStep)}</DialogTitle>
          <DialogDescription>
            Maak een evenwichtig team op basis van bedieningsrollen en persoonlijkheden.
          </DialogDescription>
        </DialogHeader>
        
        {renderStepIndicator()}
        
        {renderStepContent()}
        
        <DialogFooter 
          className="flex flex-col sm:flex-row gap-2"
          onClick={(e) => {
            // Prevent bubbling to ensure no form is submitted
            e.stopPropagation();
          }}
        >
          {currentStep > WizardStep.TeamSetup && (
            <Button 
              type="button"
              variant="outline" 
              onClick={(e) => {
                // Prevent form submission
                e.preventDefault();
                e.stopPropagation();
                handlePreviousStep();
              }}
            >
              Vorige stap
            </Button>
          )}
          <Button 
            type="button"
            onClick={(e) => {
              // Prevent form submission
              e.preventDefault();
              e.stopPropagation();
              handleNextStep();
            }}
            disabled={!canProceedFromStep(currentStep) || createTeamMutation.isPending}
            className="ml-auto"
          >
            {createTeamMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Team aanmaken...
              </>
            ) : currentStep === WizardStep.SuggestedTeam ? (
              "Team aanmaken"
            ) : (
              <>
                Volgende stap
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}