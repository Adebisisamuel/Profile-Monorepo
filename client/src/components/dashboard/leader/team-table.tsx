import React, { useState } from "react";
import { User } from "@shared/schema";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ROLES, ROLE_LABELS, ROLE_COLORS } from "@shared/constants";
import { ROLES as UI_ROLES } from "@/lib/constants";

// Define Score type since it's not exported from schema
interface Score {
  [key: string]: number;
}

// Define an extended User type that includes fullName for the component
interface ExtendedUser extends User {
  fullName: string;
}

interface TeamTableProps {
  members: ExtendedUser[];
  results: {
    userId: number;
    scores: Score;
    completed: boolean;
  }[];
}

export function TeamTable({ members, results }: TeamTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Combine member data with results
  const membersWithResults = members.map(member => {
    const result = results.find(r => r.userId === member.id);
    return {
      ...member,
      result: result || null
    };
  });
  
  // Filter members based on search and role filter
  const filteredMembers = membersWithResults.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (roleFilter === "all") return true;
    
    if (!member.result || !member.result.completed) return false;
    
    // Get the dominant role for this member
    const scores = member.result.scores;
    if (!scores) return false;
    
    const dominantRole = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    return dominantRole === roleFilter;
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Helper function to get initials from a name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Helper function to determine role color class
  const getRoleColorClass = (roleId: string) => {
    // Convert abbreviated role ids to full role names if needed
    const roleMapping: Record<string, string> = {
      'a': ROLES.APOSTLE,
      'p': ROLES.PROPHET, 
      'e': ROLES.EVANGELIST,
      'h': ROLES.HERDER,
      'l': ROLES.TEACHER
    };
    
    const fullRoleId = roleMapping[roleId] || roleId;
    
    // Use the UI role colors for display
    const uiRole = UI_ROLES.find(r => 
      r.id === roleId || 
      (roleMapping[r.id] === fullRoleId)
    );
    
    return uiRole ? uiRole.color : "bg-gray-400";
  };
  
  // Helper function to format scores as a distribution bar
  const getScoreDistribution = (scores: Score) => {
    if (!scores) return null;
    
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    return (
      <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden flex">
        {UI_ROLES.map((role) => {
          const roleValue = role.id === 'a' ? ROLES.APOSTLE : 
                           role.id === 'p' ? ROLES.PROPHET : 
                           role.id === 'e' ? ROLES.EVANGELIST : 
                           role.id === 'h' ? ROLES.HERDER : 
                           role.id === 'l' ? ROLES.TEACHER : null;
          
          const percentage = roleValue ? (scores[roleValue as keyof Score] || 0) / total * 100 : 0;
          return (
            <div 
              key={role.id}
              className={`h-full ${role.color}`} 
              style={{ width: `${percentage}%` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="font-semibold text-lg text-navy">Teamleden</h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Zoek op naam..." 
              className="pl-8 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-navy-light" />
          </div>
          
          <Select 
            value={roleFilter} 
            onValueChange={(value) => {
              setRoleFilter(value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Alle rollen" />
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
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-light uppercase tracking-wider">Naam</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-light uppercase tracking-wider">Primaire Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-light uppercase tracking-wider">Secundaire Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-light uppercase tracking-wider">Score Verdeling</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-light uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-navy-light uppercase tracking-wider">Acties</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-navy-light">
                  Geen teamleden gevonden die voldoen aan de filters
                </td>
              </tr>
            ) : (
              paginatedMembers.map(member => {
                // Determine roles and status
                let primaryRole = null;
                let secondaryRole = null;
                let status = "invited";
                let scoreDistribution = null;
                
                if (member.result) {
                  status = member.result.completed ? "completed" : "in_progress";
                  
                  if (member.result.completed && member.result.scores) {
                    const sortedScores = Object.entries(member.result.scores)
                      .map(([role, value]) => ({ role, value }))
                      .sort((a, b) => b.value - a.value);
                      
                    primaryRole = sortedScores[0].role;
                    secondaryRole = sortedScores[1].role;
                    scoreDistribution = getScoreDistribution(member.result.scores);
                  }
                }
                
                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-teal-light flex items-center justify-center text-white">
                          {getInitials(member.fullName)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-navy">{member.fullName}</div>
                          <div className="text-sm text-navy-light">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {primaryRole ? (
                        <Badge variant="secondary" className={`${getRoleColorClass(primaryRole)} text-white`}>
                          {primaryRole === ROLES.APOSTLE ? ROLE_LABELS[ROLES.APOSTLE] :
                           primaryRole === ROLES.PROPHET ? ROLE_LABELS[ROLES.PROPHET] :
                           primaryRole === ROLES.EVANGELIST ? ROLE_LABELS[ROLES.EVANGELIST] :
                           primaryRole === ROLES.HERDER ? ROLE_LABELS[ROLES.HERDER] :
                           primaryRole === ROLES.TEACHER ? ROLE_LABELS[ROLES.TEACHER] :
                           primaryRole.toUpperCase()}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-navy-light">
                          -
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {secondaryRole ? (
                        <Badge variant="secondary" className={`${getRoleColorClass(secondaryRole)} text-white`}>
                          {secondaryRole === ROLES.APOSTLE ? ROLE_LABELS[ROLES.APOSTLE] :
                           secondaryRole === ROLES.PROPHET ? ROLE_LABELS[ROLES.PROPHET] :
                           secondaryRole === ROLES.EVANGELIST ? ROLE_LABELS[ROLES.EVANGELIST] :
                           secondaryRole === ROLES.HERDER ? ROLE_LABELS[ROLES.HERDER] :
                           secondaryRole === ROLES.TEACHER ? ROLE_LABELS[ROLES.TEACHER] :
                           secondaryRole.toUpperCase()}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-navy-light">
                          -
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {scoreDistribution}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {status === "completed" && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Voltooid
                        </Badge>
                      )}
                      {status === "in_progress" && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          In Uitvoering
                        </Badge>
                      )}
                      {status === "invited" && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Uitgenodigd
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" className="text-teal hover:text-teal-dark">
                        {status === "invited" ? "Herinneren" : "Details"}
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-navy-light">
            Weergave {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredMembers.length)} van {filteredMembers.length} leden
          </div>
          
          <div className="flex space-x-2">
            <button 
              className="px-3 py-1 border border-gray-300 rounded-md bg-white text-navy-light hover:bg-gray-50 disabled:opacity-50" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Vorige
            </button>
            
            <button 
              className="px-3 py-1 border border-gray-300 rounded-md bg-white text-navy-light hover:bg-gray-50 disabled:opacity-50" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Volgende
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
