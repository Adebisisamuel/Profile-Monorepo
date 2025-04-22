import React from "react";
import { User, Score } from "@shared/schema";
import { TrendingUp, CheckCircle2 } from "lucide-react";
import { ROLES } from "@/lib/constants";

interface TeamStatsProps {
  members: User[];
  results: {
    userId: number;
    scores: Score;
    completed: boolean;
  }[];
}

export function TeamStats({ members, results }: TeamStatsProps) {
  const totalMembers = members.length;
  const completedProfiles = results.filter(result => result.completed).length;
  const completionPercentage = totalMembers > 0 
    ? Math.round((completedProfiles / totalMembers) * 100) 
    : 0;
  
  // Calculate how many new members joined this month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newMembersThisMonth = members.filter(member => {
    const joinedDate = new Date(member.createdAt);
    return joinedDate >= firstDayOfMonth;
  }).length;
  
  // Find dominant and least common roles
  const dominantRole = getDominantRole(results);
  const leastCommonRole = getLeastCommonRole(results);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-navy-light text-sm mb-1">Totaal Teamleden</p>
        <h3 className="font-bold text-2xl text-navy">{totalMembers}</h3>
        {newMembersThisMonth > 0 && (
          <div className="text-teal text-sm mt-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>{newMembersThisMonth} nieuwe deze maand</span>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-navy-light text-sm mb-1">Voltooide Profielen</p>
        <h3 className="font-bold text-2xl text-navy">{completedProfiles}</h3>
        <div className="text-teal text-sm mt-2">{completionPercentage}% voltooid</div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-navy-light text-sm mb-1">Dominante Bediening</p>
        <h3 className="font-bold text-2xl text-navy">{dominantRole.label}</h3>
        <div className="text-navy-light text-sm mt-2">{dominantRole.percentage}% van het team</div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-navy-light text-sm mb-1">Minst Voorkomend</p>
        <h3 className="font-bold text-2xl text-navy">{leastCommonRole.label}</h3>
        <div className="text-navy-light text-sm mt-2">{leastCommonRole.percentage}% van het team</div>
      </div>
    </div>
  );
}

function getDominantRole(results: { userId: number; scores: Score; completed: boolean }[]) {
  // Default values in case there are no results
  const defaultRole = { id: "h", label: "Herder", percentage: 0 };
  
  if (!results.length) return { ...ROLES.find(r => r.id === defaultRole.id) || defaultRole, percentage: 0 };
  
  // Only consider completed profiles
  const completedResults = results.filter(result => result.completed && result.scores);
  if (!completedResults.length) return { ...ROLES.find(r => r.id === defaultRole.id) || defaultRole, percentage: 0 };
  
  // For each user, find their dominant role
  const dominantRoles: Record<string, number> = { a: 0, p: 0, e: 0, h: 0, l: 0 };
  
  completedResults.forEach(result => {
    const userScores = Object.entries(result.scores).map(([role, value]) => ({ role, value }));
    const sorted = userScores.sort((a, b) => b.value - a.value);
    const topRole = sorted[0].role;
    dominantRoles[topRole] = (dominantRoles[topRole] || 0) + 1;
  });
  
  // Find the most common dominant role
  const topRole = Object.entries(dominantRoles)
    .sort((a, b) => b[1] - a[1])[0];
  
  const roleId = topRole[0];
  const count = topRole[1];
  const percentage = Math.round((count / completedResults.length) * 100);
  
  const roleInfo = ROLES.find(r => r.id === roleId);
  
  return {
    id: roleId,
    label: roleInfo ? roleInfo.label : roleId.toUpperCase(),
    percentage
  };
}

function getLeastCommonRole(results: { userId: number; scores: Score; completed: boolean }[]) {
  // Default values in case there are no results
  const defaultRole = { id: "a", label: "Apostel", percentage: 0 };
  
  if (!results.length) return { ...ROLES.find(r => r.id === defaultRole.id) || defaultRole, percentage: 0 };
  
  // Only consider completed profiles
  const completedResults = results.filter(result => result.completed && result.scores);
  if (!completedResults.length) return { ...ROLES.find(r => r.id === defaultRole.id) || defaultRole, percentage: 0 };
  
  // For each user, find their dominant role
  const dominantRoles: Record<string, number> = { a: 0, p: 0, e: 0, h: 0, l: 0 };
  
  completedResults.forEach(result => {
    const userScores = Object.entries(result.scores).map(([role, value]) => ({ role, value }));
    const sorted = userScores.sort((a, b) => b.value - a.value);
    const topRole = sorted[0].role;
    dominantRoles[topRole] = (dominantRoles[topRole] || 0) + 1;
  });
  
  // Ensure all roles have at least a zero count
  ROLES.forEach(role => {
    if (dominantRoles[role.id] === undefined) {
      dominantRoles[role.id] = 0;
    }
  });
  
  // Find the least common dominant role
  const leastCommonRole = Object.entries(dominantRoles)
    .sort((a, b) => a[1] - b[1])[0];
  
  const roleId = leastCommonRole[0];
  const count = leastCommonRole[1];
  const percentage = completedResults.length > 0 
    ? Math.round((count / completedResults.length) * 100)
    : 0;
  
  const roleInfo = ROLES.find(r => r.id === roleId);
  
  return {
    id: roleId,
    label: roleInfo ? roleInfo.label : roleId.toUpperCase(),
    percentage
  };
}
