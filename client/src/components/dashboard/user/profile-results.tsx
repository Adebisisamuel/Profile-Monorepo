import React from "react";
import { ProfileChart } from "@/components/dashboard/user/profile-chart";
import { Score } from "@shared/schema";
import { ROLE_DESCRIPTIONS, ROLES } from "@/lib/constants";

interface ProfileResultsProps {
  scores: Score;
}

export function ProfileResults({ scores }: ProfileResultsProps) {
  // Find the top two scores
  const sortedScores = [...ROLES]
    .map(role => ({
      role: role.id as keyof Score,
      value: scores[role.id as keyof Score],
      label: role.label,
      color: role.color
    }))
    .sort((a, b) => b.value - a.value);
  
  const primary = sortedScores[0];
  const secondary = sortedScores[1];
  
  const primaryPercentage = Math.round((primary.value / 70) * 100);
  const secondaryPercentage = Math.round((secondary.value / 70) * 100);
  
  const primaryDesc = ROLE_DESCRIPTIONS[primary.role as keyof typeof ROLE_DESCRIPTIONS];
  const secondaryDesc = ROLE_DESCRIPTIONS[secondary.role as keyof typeof ROLE_DESCRIPTIONS];

  return (
    <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6">
      <h2 className="font-semibold text-xl text-navy mb-6">Jouw Resultaten</h2>
      
      <ProfileChart scores={scores} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-teal rounded-lg p-4 shadow-md">
          <h3 className="font-medium text-lg text-navy mb-2">Primaire bediening</h3>
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-full ${primary.color} flex items-center justify-center text-white font-bold text-xl`}>
              {primary.role.toUpperCase()}
            </div>
            <div className="ml-4">
              <p className="font-semibold text-navy">{primaryDesc.title}</p>
              <p className="text-sm text-teal font-medium">{primaryPercentage}% match</p>
            </div>
          </div>
          <p className="mt-3 text-navy-light">{primaryDesc.shortDescription}</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-lg text-navy mb-2">Secundaire bediening</h3>
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-full ${secondary.color} flex items-center justify-center text-white font-bold text-xl`}>
              {secondary.role.toUpperCase()}
            </div>
            <div className="ml-4">
              <p className="font-medium text-navy">{secondaryDesc.title}</p>
              <p className="text-sm text-navy-light">{secondaryPercentage}% match</p>
            </div>
          </div>
          <p className="mt-3 text-navy-light">{secondaryDesc.shortDescription}</p>
        </div>
      </div>
    </div>
  );
}
