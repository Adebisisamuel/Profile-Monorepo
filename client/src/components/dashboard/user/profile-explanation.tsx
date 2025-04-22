import React from "react";
import { Score } from "@shared/schema";
import { ROLE_DESCRIPTIONS } from "@/lib/constants";

interface ProfileExplanationProps {
  scores: Score;
}

export function ProfileExplanation({ scores }: ProfileExplanationProps) {
  // Find the top two scores
  const scoreArray = Object.entries(scores).map(([role, value]) => ({ role, value }));
  const sortedScores = scoreArray.sort((a, b) => b.value - a.value);
  
  const primary = sortedScores[0];
  const secondary = sortedScores[1];
  
  const primaryDesc = ROLE_DESCRIPTIONS[primary.role as keyof typeof ROLE_DESCRIPTIONS];
  const secondaryDesc = ROLE_DESCRIPTIONS[secondary.role as keyof typeof ROLE_DESCRIPTIONS];

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
      <h2 className="font-semibold text-xl text-navy mb-4">Over jouw profiel</h2>
      
      <div className="mb-6">
        <h3 className="font-medium text-lg text-navy mb-2">{primaryDesc.title} (Primair)</h3>
        <p className="text-navy-light">{primaryDesc.longDescription}</p>
      </div>
      
      <div>
        <h3 className="font-medium text-lg text-navy mb-2">{secondaryDesc.title} (Secundair)</h3>
        <p className="text-navy-light">{secondaryDesc.longDescription}</p>
      </div>
    </div>
  );
}
