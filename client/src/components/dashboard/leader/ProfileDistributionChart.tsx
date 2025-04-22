import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ROLES, ROLE_COLORS, ROLE_LABELS } from '@shared/constants';
import { calculatePrimaryRole, RoleScores } from '@/utils/roleCalculations';

type TeamMember = {
  id: number;
  name?: string;
  email?: string;
  profile?: {
    apostle: number;
    prophet: number;
    evangelist: number;
    herder: number;
    teacher: number;
  } | null;
};

interface ProfileDistributionChartProps {
  members: TeamMember[];
  title?: string;
  description?: string;
}

export function ProfileDistributionChart({ 
  members, 
  title = "", 
  description = "" 
}: ProfileDistributionChartProps) {
  
  // Calculate primary and secondary profile distributions using the shared utility
  const profileDistribution = useMemo(() => {
    // Initialize the result structure
    const result = Object.values(ROLES).map(role => ({
      name: role,
      label: ROLE_LABELS[role],
      primary: 0,
      secondary: 0,
      primaryColor: ROLE_COLORS[role], // Solid color for primary
      secondaryColor: ROLE_COLORS[role].replace('0.7', '0.4'), // Lighter version for secondary
    }));
    
    // Filter members with a profile
    const membersWithProfiles = members.filter(member => member.profile !== null && member.profile !== undefined);
    
    // Use the shared utility function to determine primary/secondary roles
    membersWithProfiles.forEach(member => {
      if (!member.profile) return;
      
      const scores: RoleScores = {
        apostle: member.profile.apostle,
        prophet: member.profile.prophet,
        evangelist: member.profile.evangelist,
        herder: member.profile.herder,
        teacher: member.profile.teacher
      };
      
      // Calculate profile using our shared utility
      const profile = calculatePrimaryRole(scores);
      
      // Skip if no primary role was determined
      if (!profile.primaryRole) return;
      
      // Find primary role item and increment count
      const primaryItem = result.find(item => item.name === profile.primaryRole);
      if (primaryItem) primaryItem.primary += 1;
      
      // Check if there's a tie (very close scores)
      const isTie = profile.dominanceRatio < 0.1; // If the primary role has <10% more points than secondary
      
      // Handle secondary role
      if (profile.secondaryRole && !isTie) {
        const secondaryItem = result.find(item => item.name === profile.secondaryRole);
        if (secondaryItem) secondaryItem.secondary += 1;
      }
    });
    
    return result;
  }, [members]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={profileDistribution}
              margin={{ top: 20, right: 50, left: 20, bottom: 5 }}
              barGap={0}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip 
                formatter={(value, name) => [`${value} leden`, name === 'primary' ? 'Primair' : 'Secundair']}
                labelFormatter={(label) => `${label}`}
              />
              <Legend 
                payload={[
                  { value: 'Primair', type: 'rect', color: 'rgba(54, 162, 235, 0.7)' },
                  { value: 'Secundair', type: 'rect', color: 'rgba(54, 162, 235, 0.4)' }
                ]}
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{ paddingLeft: 10 }}
              />
              <Bar 
                dataKey="primary" 
                stackId="a" 
                name="Primair"
                radius={[4, 4, 0, 0]}
                fill="rgba(75, 192, 192, 0.7)"
              >
                {profileDistribution.map((entry, index) => (
                  <Cell key={`cell-primary-${index}`} fill={entry.primaryColor} />
                ))}
              </Bar>
              <Bar 
                dataKey="secondary" 
                stackId="a" 
                name="Secundair"
                radius={[4, 4, 0, 0]}
                fill="rgba(75, 192, 192, 0.4)"
              >
                {profileDistribution.map((entry, index) => (
                  <Cell key={`cell-secondary-${index}`} fill={entry.secondaryColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}