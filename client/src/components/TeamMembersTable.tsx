import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ROLES, ROLE_COLORS, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@shared/constants";
import { UsersRound, UserPlus2, SlidersHorizontal, AlertCircle, FileDown, ArrowUpDown, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { exportUserProfile } from "@/lib/exportHelper";
import { FeedbackService } from "@/services/feedback-service";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

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

interface TeamMembersTableProps {
  members: TeamMember[];
  isLoading?: boolean;
  error?: Error | null;
  onInviteClick?: () => void;
}

export default function TeamMembersTable({ 
  members, 
  isLoading = false, 
  error = null,
  onInviteClick 
}: TeamMembersTableProps) {
  // State for filters and sorting
  const [filterNameOrEmail, setFilterNameOrEmail] = useState("");
  const [filterByRole, setFilterByRole] = useState<string | null>(null);
  const [filterByScoreThreshold, setFilterByScoreThreshold] = useState(0);
  const [sortBy, setSortBy] = useState<'name' | 'primaryRoleScore' | 'role'>('role');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showComplementary, setShowComplementary] = useState(false);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  
  // Function to determine the member's primary role
  const getMemberPrimaryRole = (member: TeamMember) => {
    if (!member.profile) return { role: null, score: 0 };
    
    const roles = [
      { role: ROLES.APOSTLE, score: member.profile.apostle },
      { role: ROLES.PROPHET, score: member.profile.prophet },
      { role: ROLES.EVANGELIST, score: member.profile.evangelist },
      { role: ROLES.HERDER, score: member.profile.herder },
      { role: ROLES.TEACHER, score: member.profile.teacher },
    ];
    
    // Sort roles by score (highest first)
    roles.sort((a, b) => b.score - a.score);
    
    return roles[0];
  };
  
  // Function to determine complementary profile score
  const getComplementaryScore = (member1: TeamMember, member2: TeamMember) => {
    if (!member1.profile || !member2.profile) return 0;
    
    // Calculate the average difference across all roles
    let totalDiff = 0;
    let count = 0;
    
    // For each role, a larger difference is better for complementary profiles
    if (member1.profile.apostle !== undefined && member2.profile.apostle !== undefined) {
      totalDiff += Math.abs(member1.profile.apostle - member2.profile.apostle);
      count++;
    }
    
    if (member1.profile.prophet !== undefined && member2.profile.prophet !== undefined) {
      totalDiff += Math.abs(member1.profile.prophet - member2.profile.prophet);
      count++;
    }
    
    if (member1.profile.evangelist !== undefined && member2.profile.evangelist !== undefined) {
      totalDiff += Math.abs(member1.profile.evangelist - member2.profile.evangelist);
      count++;
    }
    
    if (member1.profile.herder !== undefined && member2.profile.herder !== undefined) {
      totalDiff += Math.abs(member1.profile.herder - member2.profile.herder);
      count++;
    }
    
    if (member1.profile.teacher !== undefined && member2.profile.teacher !== undefined) {
      totalDiff += Math.abs(member1.profile.teacher - member2.profile.teacher);
      count++;
    }
    
    return count > 0 ? totalDiff / count : 0;
  };
  
  // Function to get the badge color based on role
  const getRoleBadgeClass = (role: string | null) => {
    if (!role) return "bg-gray-100 text-gray-600 border-gray-200";
    
    switch(role) {
      case ROLES.APOSTLE:
        return "bg-blue-50 text-blue-600 border-blue-200";
      case ROLES.PROPHET:
        return "bg-purple-50 text-purple-600 border-purple-200";
      case ROLES.EVANGELIST:
        return "bg-red-50 text-red-600 border-red-200";
      case ROLES.HERDER:
        return "bg-green-50 text-green-600 border-green-200";
      case ROLES.TEACHER:
        return "bg-amber-50 text-amber-600 border-amber-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };
  
  // Function to get the localized role label
  const getRoleLabel = (role: string | null) => {
    if (!role) return "-";
    
    // Safely access the ROLE_LABELS with proper typing
    switch(role) {
      case ROLES.APOSTLE:
        return ROLE_LABELS.apostle;
      case ROLES.PROPHET:
        return ROLE_LABELS.prophet;
      case ROLES.EVANGELIST:
        return ROLE_LABELS.evangelist;
      case ROLES.HERDER:
        return ROLE_LABELS.herder;
      case ROLES.TEACHER:
        return ROLE_LABELS.teacher;
      default:
        return role;
    }
  };
  
  // Add primary role, secondary role, and other properties to each member
  const membersWithRoles = useMemo(() => {
    return members.map(member => {
      // Get primary role
      const primaryRole = getMemberPrimaryRole(member);
      
      // Get all roles sorted by score
      let sortedRoles: { role: string; score: number }[] = [];
      if (member.profile) {
        sortedRoles = [
          { role: ROLES.APOSTLE, score: member.profile.apostle },
          { role: ROLES.PROPHET, score: member.profile.prophet },
          { role: ROLES.EVANGELIST, score: member.profile.evangelist },
          { role: ROLES.HERDER, score: member.profile.herder },
          { role: ROLES.TEACHER, score: member.profile.teacher },
        ].sort((a, b) => b.score - a.score);
      }
      
      // Secondary role is second highest
      const secondaryRole = sortedRoles.length > 1 ? sortedRoles[1] : null;
      
      // Tertiary role is third highest
      const tertiaryRole = sortedRoles.length > 2 ? sortedRoles[2] : null;
      
      return {
        ...member,
        primaryRole: primaryRole.role,
        primaryRoleScore: primaryRole.score,
        secondaryRole: secondaryRole?.role || null,
        secondaryRoleScore: secondaryRole?.score || 0,
        tertiaryRole: tertiaryRole?.role || null,
        tertiaryRoleScore: tertiaryRole?.score || 0,
        allRolesSorted: sortedRoles
      };
    });
  }, [members]);
  
  // Apply filters and sorting to members
  const filteredSortedMembers = useMemo(() => {
    // Start with members who have completed the questionnaire if we're showing complementary profiles
    let filtered = [...membersWithRoles];
    
    // Only filter members who have completed the questionnaire
    if (filterByRole || filterByScoreThreshold > 0) {
      filtered = filtered.filter(member => member.profile !== null);
    }
    
    // Filter by name or email
    if (filterNameOrEmail) {
      const search = filterNameOrEmail.toLowerCase();
      filtered = filtered.filter(member => 
        (member.name?.toLowerCase().includes(search) || false) || 
        member.email.toLowerCase().includes(search)
      );
    }
    
    // Filter by specific role
    if (filterByRole) {
      filtered = filtered.filter(member => {
        if (!member.profile) return false;
        
        const roleScore = member.profile[filterByRole as keyof typeof member.profile] as number;
        return roleScore >= filterByScoreThreshold / 100;
      });
    }
    
    // Sort members
    return filtered.sort((a, b) => {
      // First sort by whether they have completed the questionnaire
      if (a.profile && !b.profile) return -1;
      if (!a.profile && b.profile) return 1;
      
      // If showing complementary profiles, sort by complementary score
      if (showComplementary && selectedMember !== null) {
        const selectedMemberObj = membersWithRoles.find(m => m.id === selectedMember);
        if (selectedMemberObj) {
          const scoreA = getComplementaryScore(selectedMemberObj, a);
          const scoreB = getComplementaryScore(selectedMemberObj, b);
          
          // Higher complementary score first
          const result = scoreB - scoreA;
          return result !== 0 ? result : 0;
        }
      }
      
      // Otherwise, sort by the selected sort field
      if (sortBy === 'name') {
        const nameA = a.name || a.email;
        const nameB = b.name || b.email;
        return sortDirection === 'asc' 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      } 
      else if (sortBy === 'primaryRoleScore') {
        const scoreA = a.primaryRoleScore || 0;
        const scoreB = b.primaryRoleScore || 0;
        return sortDirection === 'asc' 
          ? scoreA - scoreB 
          : scoreB - scoreA;
      }
      else { // sortBy === 'role'
        if (!a.primaryRole && !b.primaryRole) return 0;
        if (a.primaryRole && !b.primaryRole) return -1;
        if (!a.primaryRole && b.primaryRole) return 1;
        
        if (a.primaryRole === b.primaryRole) {
          // If same primary role, sort by score
          return sortDirection === 'asc'
            ? (a.primaryRoleScore || 0) - (b.primaryRoleScore || 0)
            : (b.primaryRoleScore || 0) - (a.primaryRoleScore || 0);
        }
        
        return sortDirection === 'asc'
          ? a.primaryRole!.localeCompare(b.primaryRole!)
          : b.primaryRole!.localeCompare(a.primaryRole!);
      }
    });
  }, [
    membersWithRoles, 
    filterNameOrEmail, 
    filterByRole, 
    filterByScoreThreshold, 
    sortBy, 
    sortDirection,
    showComplementary,
    selectedMember
  ]);
  
  // Calculate counts for the summary
  const completedCount = membersWithRoles.filter(m => m.profile).length;
  const pendingCount = membersWithRoles.length - completedCount;
  
  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="flex flex-col items-center justify-center h-48 bg-gray-50">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-3"></div>
          <p className="text-muted-foreground">Teamleden laden...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="rounded-md border">
        <div className="flex flex-col items-center justify-center h-48 bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
          <p className="text-red-600 font-medium">Er ging iets mis bij het laden van teamleden</p>
          <p className="text-red-500 text-sm mt-1">Probeer het later opnieuw</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Summary row */}
      {membersWithRoles.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-md border px-3 py-1.5">
              <span className="text-sm font-medium">Totaal: {membersWithRoles.length}</span>
            </div>
            {completedCount > 0 && (
              <div className="bg-green-50 rounded-md border border-green-200 px-3 py-1.5">
                <span className="text-sm font-medium text-green-600">Voltooid: {completedCount}</span>
              </div>
            )}
            {pendingCount > 0 && (
              <div className="bg-amber-50 rounded-md border border-amber-200 px-3 py-1.5">
                <span className="text-sm font-medium text-amber-600">In afwachting: {pendingCount}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                  Filteren & Sorteren
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Zoek op naam of email</h4>
                    <Input
                      placeholder="Zoeken..."
                      value={filterNameOrEmail}
                      onChange={(e) => setFilterNameOrEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Filter op rol</h4>
                    <Select
                      value={filterByRole || ""}
                      onValueChange={(value) => setFilterByRole(value || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle rollen</SelectItem>
                        <SelectItem value={ROLES.APOSTLE}>{ROLE_LABELS[ROLES.APOSTLE]}</SelectItem>
                        <SelectItem value={ROLES.PROPHET}>{ROLE_LABELS[ROLES.PROPHET]}</SelectItem>
                        <SelectItem value={ROLES.EVANGELIST}>{ROLE_LABELS[ROLES.EVANGELIST]}</SelectItem>
                        <SelectItem value={ROLES.HERDER}>{ROLE_LABELS[ROLES.HERDER]}</SelectItem>
                        <SelectItem value={ROLES.TEACHER}>{ROLE_LABELS[ROLES.TEACHER]}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {filterByRole && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Minimale score</h4>
                        <span className="text-sm font-medium">{filterByScoreThreshold}%</span>
                      </div>
                      <Slider
                        value={[filterByScoreThreshold]}
                        onValueChange={(values) => setFilterByScoreThreshold(values[0])}
                        max={100}
                        step={5}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Sorteren op</h4>
                    <Select
                      value={sortBy}
                      onValueChange={(value) => setSortBy(value as 'name' | 'primaryRoleScore' | 'role')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sorteer op" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Naam</SelectItem>
                        <SelectItem value="role">Rol</SelectItem>
                        <SelectItem value="primaryRoleScore">Rolsterkte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Sorteerrichting</h4>
                    <Select
                      value={sortDirection}
                      onValueChange={(value) => setSortDirection(value as 'asc' | 'desc')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Richting" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Oplopend</SelectItem>
                        <SelectItem value="desc">Aflopend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {membersWithRoles.filter(m => m.profile).length > 1 && (
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox 
                        id="complementary" 
                        checked={showComplementary}
                        onCheckedChange={(checked) => {
                          setShowComplementary(!!checked);
                          if (!checked) setSelectedMember(null);
                        }}
                      />
                      <label
                        htmlFor="complementary"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Toon complementaire profielen
                      </label>
                    </div>
                  )}
                  
                  {showComplementary && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Selecteer referentielid</h4>
                      <Select
                        value={selectedMember?.toString() || ""}
                        onValueChange={(value) => setSelectedMember(value ? parseInt(value) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een lid" />
                        </SelectTrigger>
                        <SelectContent>
                          {membersWithRoles
                            .filter(m => m.profile)
                            .map(member => (
                              <SelectItem key={member.id} value={member.id.toString()}>
                                {member.name || member.email}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            {onInviteClick && (
              <Button variant="outline" size="sm" onClick={onInviteClick}>
                <UserPlus2 className="mr-1.5 h-4 w-4" />
                Leden uitnodigen
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Add a hint for mobile users */}
      <div className="md:hidden text-sm text-muted-foreground mb-2 flex items-center">
        <span>Scroll horizontaal om alle gegevens te zien</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
      </div>
      
      {/* Wrap table in a scrollable container */}
      <div className="rounded-md border overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px] whitespace-nowrap">Naam</TableHead>
              <TableHead className="whitespace-nowrap">Email</TableHead>
              <TableHead className="text-center whitespace-nowrap">Primaire Bediening</TableHead>
              <TableHead className="text-center whitespace-nowrap">Secundaire Bediening</TableHead>
              <TableHead className="whitespace-nowrap">Huidige sector</TableHead>
              <TableHead className="whitespace-nowrap">Voorkeur sector</TableHead>
              <TableHead className="text-right whitespace-nowrap">Status</TableHead>
              <TableHead className="text-right w-[80px] whitespace-nowrap">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membersWithRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48">
                  <div className="flex flex-col items-center justify-center h-full">
                    <UsersRound className="h-12 w-12 text-muted-foreground mb-3 opacity-40" />
                    <p className="text-muted-foreground font-medium text-lg">Nog geen teamleden gevonden</p>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">Deel de uitnodigingslink om leden toe te voegen aan je team</p>
                    
                    {onInviteClick && (
                      <Button variant="outline" size="lg" onClick={onInviteClick}>
                        <UserPlus2 className="mr-2 h-5 w-5" />
                        Leden uitnodigen
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSortedMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48">
                  <div className="flex flex-col items-center justify-center h-full">
                    <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-40" />
                    <p className="text-muted-foreground font-medium text-lg">Geen leden gevonden met deze filters</p>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">Pas je filterinstellingen aan om leden te vinden</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSortedMembers.map((member) => {
                // Get reference member for complementary highlighting
                const refMember = showComplementary && selectedMember !== null 
                  ? membersWithRoles.find(m => m.id === selectedMember) 
                  : null;
                
                // Calculate complementary score if applicable
                const complementaryScore = refMember && member.id !== refMember.id && member.profile && refMember.profile
                  ? getComplementaryScore(refMember, member)
                  : 0;
                
                // Determine if this is highly complementary (>0.4 difference is significant)
                const isHighlyComplementary = complementaryScore > 0.4;
                
                // Get secondary role
                let secondaryRole = null;
                if (member.profile) {
                  const roles = [
                    { role: ROLES.APOSTLE, score: member.profile.apostle },
                    { role: ROLES.PROPHET, score: member.profile.prophet },
                    { role: ROLES.EVANGELIST, score: member.profile.evangelist },
                    { role: ROLES.HERDER, score: member.profile.herder },
                    { role: ROLES.TEACHER, score: member.profile.teacher },
                  ];
                  
                  // Sort roles by score (highest first)
                  roles.sort((a, b) => b.score - a.score);
                  
                  // Get the second highest role
                  secondaryRole = roles[1];
                }
                
                // Determine row highlight classes
                const rowClasses = [];
                if (showComplementary) {
                  if (selectedMember === member.id) {
                    rowClasses.push("bg-blue-50");
                  } else if (isHighlyComplementary) {
                    rowClasses.push("bg-green-50");
                  }
                }

                return (
                  <TableRow 
                    key={member.id}
                    className={`${rowClasses.join(" ")} ${member.profile && showComplementary ? "cursor-pointer hover:bg-slate-50" : ""}`}
                    onClick={() => {
                      if (member.profile && showComplementary) {
                        setSelectedMember(selectedMember === member.id ? null : member.id);
                      }
                    }}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {selectedMember === member.id && showComplementary && (
                          <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-800">
                            Referentie
                          </Badge>
                        )}
                        {isHighlyComplementary && (
                          <Badge variant="outline" className="bg-green-100 border-green-300 text-green-800">
                            Complementair
                          </Badge>
                        )}
                        {member.name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell className="text-center">
                      {member.primaryRole ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className={getRoleBadgeClass(member.primaryRole)}>
                                {getRoleLabel(member.primaryRole)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Score: {Math.round(member.primaryRoleScore * 100)}%</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {secondaryRole && secondaryRole.role ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className={getRoleBadgeClass(secondaryRole.role)}>
                                {getRoleLabel(secondaryRole.role)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Score: {Math.round(secondaryRole.score * 100)}%</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.currentSector || <span className="text-muted-foreground text-sm">-</span>}
                    </TableCell>
                    <TableCell>
                      {member.preferredSector || <span className="text-muted-foreground text-sm">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.profile ? (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                          Voltooid
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                          In afwachting
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {showComplementary && member.profile && selectedMember !== member.id && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMember(member.id);
                                  }}
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Selecteer als referentie</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {member.profile && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportUserProfile(member.id)
                                      .then(success => {
                                        if (success) {
                                          FeedbackService.success("Profiel geëxporteerd", "");
                                        } else {
                                          FeedbackService.error("Fout bij exporteren", "");
                                        }
                                      });
                                  }}
                                >
                                  <FileDown className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Profiel exporteren</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}