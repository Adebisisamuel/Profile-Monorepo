import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_COLORS, ROLE_DESCRIPTIONS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import SWOTAnalysis from "./SWOTAnalysis";

type Recommendation = {
  primaryRole: string;
  secondaryRole: string;
  profileType: "balanced" | "specialized" | "moderate";
};

export default function PersonalizedRecommendations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const errorShown = useRef(false);
  
  const { data: recommendations, isLoading, error } = useQuery<Recommendation>({
    queryKey: [`/api/users/${user?.id}/recommendations`],
    enabled: !!user?.id,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });
  
  // Handle error with useEffect to avoid React state updates during render
  useEffect(() => {
    if (error && !errorShown.current) {
      errorShown.current = true;
      toast({
        title: "Fout bij het laden van profiel",
        description: "Er is een probleem opgetreden bij het ophalen van je persoonlijk profiel. Probeer het later opnieuw.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>SWOT Analyse</CardTitle>
          <CardDescription>Kon profielgegevens niet laden</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Er is een probleem opgetreden bij het ophalen van je persoonlijk profiel. Probeer het later opnieuw.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!recommendations) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>SWOT Analyse</CardTitle>
          <CardDescription>Maak eerst de vragenlijst af om je analyse te ontvangen</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Je hebt nog geen profiel aangemaakt. Vul de vragenlijst in om je persoonlijke profiel en SWOT analyse te ontvangen.</p>
        </CardContent>
      </Card>
    );
  }
  
  const profileTypeLabels = {
    balanced: "Evenwichtig profiel",
    specialized: "Gespecialiseerd profiel",
    moderate: "Gematigd profiel",
  };
  
  const primaryRoleColor = ROLE_COLORS[recommendations.primaryRole as keyof typeof ROLE_COLORS] || "rgba(100, 100, 100, 0.7)";
  const secondaryRoleColor = ROLE_COLORS[recommendations.secondaryRole as keyof typeof ROLE_COLORS] || "rgba(150, 150, 150, 0.5)";
  
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span>Jouw persoonlijk profiel</span>
            <div className="flex gap-2 text-sm">
              <div 
                className="rounded px-3 py-1 text-white font-medium flex items-center" 
                style={{ 
                  background: `linear-gradient(135deg, ${primaryRoleColor} 0%, ${primaryRoleColor}ee 100%)`,
                  boxShadow: `0 2px 4px ${primaryRoleColor}88`
                }}
              >
                <span>Primair: {recommendations.primaryRole}</span>
              </div>
              {recommendations.secondaryRole && (
                <div 
                  className="rounded px-3 py-1 text-white font-medium flex items-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${secondaryRoleColor} 0%, ${secondaryRoleColor}99 100%)`,
                    boxShadow: `0 1px 2px ${secondaryRoleColor}44`
                  }}
                >
                  <span>Secundair: {recommendations.secondaryRole}</span>
                </div>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Je belangrijkste rol is {recommendations.primaryRole && ROLE_DESCRIPTIONS[recommendations.primaryRole as keyof typeof ROLE_DESCRIPTIONS]?.title || recommendations.primaryRole} 
            {recommendations.secondaryRole && ` met ${recommendations.secondaryRole && ROLE_DESCRIPTIONS[recommendations.secondaryRole as keyof typeof ROLE_DESCRIPTIONS]?.title || recommendations.secondaryRole} als tweede rol`}. 
            Je hebt een {profileTypeLabels[recommendations.profileType] || recommendations.profileType}.
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Add the SWOT Analysis component */}
      <SWOTAnalysis primaryRole={recommendations.primaryRole} />
    </div>
  );
}