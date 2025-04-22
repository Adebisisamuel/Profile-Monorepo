import React from "react";
import { Button } from "@/components/ui/button";
import { Score } from "@shared/schema";
import { ROLES } from "@/lib/constants";

interface ProfileSidebarProps {
  scores: Score;
}

export function ProfileSidebar({ scores }: ProfileSidebarProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
      <h2 className="font-semibold text-xl text-navy mb-4">Wat betekent dit?</h2>
      <p className="text-navy-light mb-4">Je profiel toont je sterke punten binnen de vijfvoudige bediening:</p>
      
      <div className="space-y-3 mb-6">
        {ROLES.map((role) => (
          <div key={role.id} className="flex items-center">
            <div className={`w-8 h-8 rounded-full ${role.color} flex items-center justify-center text-white font-bold text-sm`}>
              {role.id.toUpperCase()}
            </div>
            <p className="ml-3 text-navy">{role.label}</p>
          </div>
        ))}
      </div>
      
      <Button
        className="w-full bg-teal text-white hover:bg-teal-dark transition-colors duration-200"
      >
        Download als PDF
      </Button>
      
      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-navy-light text-sm">Je resultaten zijn ook gedeeld met je teamleider voor een compleet teamoverzicht.</p>
      </div>
    </div>
  );
}
