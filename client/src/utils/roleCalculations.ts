import { ROLES, ROLE_LABELS } from "@shared/constants";

export interface RoleScores {
  apostle: number;
  prophet: number;
  evangelist: number;
  herder: number;
  teacher: number;
  [key: string]: number;
}

export interface RoleProfile {
  primaryRole: string | null;
  secondaryRole: string | null;
  dominanceRatio: number;
  profileType: 'balanced' | 'moderate' | 'specialized' | 'unknown';
}

/**
 * Calculates the primary role based on role scores
 * @param roleScores Object containing role scores
 * @returns An object with primaryRole, secondaryRole, dominanceRatio, and profileType
 */
export function calculatePrimaryRole(roleScores: RoleScores): RoleProfile {
  // Validate input to ensure we have valid role scores
  if (!roleScores) {
    console.error('[calculatePrimaryRole] Invalid roleScores provided:', roleScores);
    return {
      primaryRole: null,
      secondaryRole: null,
      dominanceRatio: 0,
      profileType: 'unknown'
    };
  }
  
  // Ensure all expected roles are present
  const validatedScores = {
    [ROLES.APOSTLE]: roleScores[ROLES.APOSTLE] || 0,
    [ROLES.PROPHET]: roleScores[ROLES.PROPHET] || 0,
    [ROLES.EVANGELIST]: roleScores[ROLES.EVANGELIST] || 0,
    [ROLES.HERDER]: roleScores[ROLES.HERDER] || 0,
    [ROLES.TEACHER]: roleScores[ROLES.TEACHER] || 0
  };
  
  // Get roles sorted from highest to lowest score
  const sortedRoles = Object.entries(validatedScores)
    .sort((a, b) => b[1] - a[1])
    .map(([role]) => role);
  
  // If all scores are 0, return null for primary role
  const totalScore = Object.values(validatedScores).reduce((sum, score) => sum + score, 0);
  if (totalScore === 0) {
    console.warn('[calculatePrimaryRole] All role scores are 0');
    return {
      primaryRole: null,
      secondaryRole: null,
      dominanceRatio: 0,
      profileType: 'unknown'
    };
  }
  
  // Get the primary and secondary roles
  const primaryRole = sortedRoles[0];
  const secondaryRole = sortedRoles[1];
  
  // Calculate the dominance ratio (how dominant is the primary role)
  const primaryScore = validatedScores[primaryRole as keyof typeof validatedScores];
  const dominanceRatio = primaryScore / totalScore;
  
  // Determine if the profile is balanced, moderate, or specialized
  let profileType: 'balanced' | 'moderate' | 'specialized' | 'unknown' = "moderate";
  
  if (dominanceRatio < 0.35) {
    // Less than 35% of points in primary role = balanced
    profileType = "balanced";
  } else if (dominanceRatio > 0.5) {
    // More than 50% of points in primary role = specialized
    profileType = "specialized";
  }
  
  return {
    primaryRole,
    secondaryRole,
    dominanceRatio,
    profileType
  };
}

/**
 * Determines the primary role label based on scores
 * @param roleScores Role scores to analyze
 * @returns The primary role label (translated)
 */
export function getPrimaryRoleLabel(roleScores: RoleScores): string {
  const { primaryRole } = calculatePrimaryRole(roleScores);
  
  if (!primaryRole) {
    return 'Onbekend';
  }
  
  return ROLE_LABELS[primaryRole as keyof typeof ROLE_LABELS] || 'Onbekend';
}

/**
 * Get team role distribution with primary roles
 * @param teamMembers Array of team members with their profiles
 * @returns Object with distribution of primary roles in the team
 */
export function getTeamRoleDistribution(teamMembers: Array<{profile: RoleScores | null}>): Record<string, number> {
  const distribution: Record<string, number> = {
    [ROLES.APOSTLE]: 0,
    [ROLES.PROPHET]: 0,
    [ROLES.EVANGELIST]: 0,
    [ROLES.HERDER]: 0,
    [ROLES.TEACHER]: 0
  };
  
  teamMembers.forEach(member => {
    if (!member.profile) return;
    
    const { primaryRole } = calculatePrimaryRole(member.profile);
    if (primaryRole) {
      distribution[primaryRole]++;
    }
  });
  
  return distribution;
}

/**
 * Determines if two role scores have the same primary role
 * @param scores1 First role scores
 * @param scores2 Second role scores
 * @returns Boolean indicating whether primary roles match
 */
export function haveSamePrimaryRole(scores1: RoleScores, scores2: RoleScores): boolean {
  const profile1 = calculatePrimaryRole(scores1);
  const profile2 = calculatePrimaryRole(scores2);
  
  return profile1.primaryRole === profile2.primaryRole;
}