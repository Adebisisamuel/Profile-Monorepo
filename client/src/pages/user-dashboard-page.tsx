import React from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ProfileResults } from "@/components/dashboard/user/profile-results";
import { ProfileSidebar } from "@/components/dashboard/user/profile-sidebar";
import { ProfileExplanation } from "@/components/dashboard/user/profile-explanation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function UserDashboardPage() {
  const { user } = useAuth();
  
  const { data: results, isLoading } = useQuery({
    queryKey: ["/api/user/results"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0]);
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
  });
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (!results || !results.scores) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <h2 className="font-semibold text-xl text-navy mb-4">Geen resultaten gevonden</h2>
          <p className="text-navy-light mb-6">
            Je hebt nog geen vragenlijst ingevuld of je resultaten zijn nog niet beschikbaar.
          </p>
          <a 
            href="/questionnaire" 
            className="inline-block bg-teal text-white px-4 py-2 rounded-lg hover:bg-teal-dark transition-colors"
          >
            Start de vragenlijst
          </a>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout 
      title="Jouw Bedieningenprofiel" 
      subtitle="Op basis van je antwoorden hebben we je vijfvoudige bediening in kaart gebracht. Hieronder zie je jouw unieke profiel."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <ProfileResults scores={results.scores} />
        <ProfileSidebar scores={results.scores} />
      </div>
      
      <ProfileExplanation scores={results.scores} />
    </DashboardLayout>
  );
}
