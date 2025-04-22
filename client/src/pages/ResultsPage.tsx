import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RoleChart from "@/components/RoleChart";
import { useAuth } from "@/hooks/use-auth";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@shared/constants";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Loader2, Share2, Download } from "lucide-react";
import { FeedbackService } from "@/services/feedback-service";

export default function ResultsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load user's profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "profile"],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/users/${user.id}/profile`);
      if (!res.ok) {
        throw new Error("Failed to load profile");
      }
      return await res.json();
    },
    enabled: !!user,
  });

  // Share results mutation (in a real app, this would invite a team leader)
  const shareMutation = useMutation({
    mutationFn: async () => {
      // Mock implementation - in a real app this would share with a team leader
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    },
    onSuccess: () => {
      FeedbackService.success("Resultaten gedeeld", "Je resultaten zijn gedeeld met de teamleider.");
    },
    onError: () => {
      FeedbackService.error("Delen mislukt", "Er is een fout opgetreden bij het delen van je resultaten.");
    },
  });

  // Download results as CSV
  const handleDownload = async () => {
    if (!user) return;
    
    try {
      FeedbackService.info("Download gestart", "Je download wordt voorbereid...");
      
      // Create a download link 
      const downloadLink = document.createElement('a');
      downloadLink.href = `/api/users/${user.id}/export`;
      downloadLink.download = `bedieningen-profiel-${user.id}-${Date.now()}.csv`;
      
      // Add to DOM, click and remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error("Download error:", error);
      FeedbackService.error("Download fout", "Er is een fout opgetreden bij het downloaden van je resultaten.");
    }
  };

  // Redirect if not logged in
  if (!user) {
    navigate("/auth?redirect=/results");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Geen profiel gevonden</h2>
          <p className="mb-6">Je hebt nog geen vragenlijst ingevuld.</p>
          <Button onClick={() => navigate("/questionnaire")}>
            Begin vragenlijst
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate the primary and secondary roles
  const roleScores = [
    { role: ROLES.APOSTLE, score: profile.apostle, name: ROLE_LABELS[ROLES.APOSTLE] },
    { role: ROLES.PROPHET, score: profile.prophet, name: ROLE_LABELS[ROLES.PROPHET] },
    { role: ROLES.EVANGELIST, score: profile.evangelist, name: ROLE_LABELS[ROLES.EVANGELIST] },
    { role: ROLES.HERDER, score: profile.herder, name: ROLE_LABELS[ROLES.HERDER] },
    { role: ROLES.TEACHER, score: profile.teacher, name: ROLE_LABELS[ROLES.TEACHER] },
  ].sort((a, b) => b.score - a.score);

  const primaryRole = roleScores[0];
  const secondaryRole = roleScores[1];

  // Format the results for the chart
  const chartData = {
    [ROLES.APOSTLE]: profile.apostle,
    [ROLES.PROPHET]: profile.prophet,
    [ROLES.EVANGELIST]: profile.evangelist,
    [ROLES.HERDER]: profile.herder,
    [ROLES.TEACHER]: profile.teacher,
  };

  return (
    <Card className="bg-white rounded-xl shadow-md overflow-hidden">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Je Bedieningen Profiel Resultaten</h2>
        <p className="text-gray-600 mb-8">Hieronder zie je de verdeling van jouw scores over de vijf bedieningen.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-4">Score Overzicht</h3>
            {/* Added extra margin at the bottom */}
            <div className="mb-10">
              <RoleChart 
                results={chartData} 
                type="bar" 
                height={320}
                showLegend={true}
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-4">Jouw Primaire Bediening</h3>
            <div className="bg-white border-2 border-primary rounded-lg p-6 mb-4 shadow-md relative">
              <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-bold">
                Primair
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">{primaryRole.name}</h4>
              <p className="text-gray-700">{String(ROLE_DESCRIPTIONS[primaryRole.role].description)}</p>
            </div>
            
            <h3 className="text-xl font-medium text-gray-900 mb-4">Jouw Secundaire Bediening</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm relative">
              <div className="absolute top-0 right-0 bg-gray-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-bold">
                Secundair
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">{secondaryRole.name}</h4>
              <p className="text-gray-700">{String(ROLE_DESCRIPTIONS[secondaryRole.role].description)}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-8">
          <h3 className="text-xl font-medium text-gray-900 mb-4">Volledige Score Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {roleScores.map((role) => (
              <div 
                key={role.role} 
                className={`${
                  role === primaryRole 
                    ? "bg-white border-2 border-primary shadow-md" 
                    : role === secondaryRole 
                      ? "bg-white border border-gray-300 shadow-sm" 
                      : "bg-gray-50"
                } rounded-lg p-4 text-center relative`}
              >
                {role === primaryRole && (
                  <div className="absolute top-0 right-0 bg-primary text-white px-2 py-1 rounded-bl-lg rounded-tr-lg text-xs font-bold">
                    #1
                  </div>
                )}
                {role === secondaryRole && (
                  <div className="absolute top-0 right-0 bg-gray-500 text-white px-2 py-1 rounded-bl-lg rounded-tr-lg text-xs font-bold">
                    #2
                  </div>
                )}
                <h4 className="font-bold text-gray-900">{role.name}</h4>
                <p className="text-2xl font-bold text-primary-dark">{role.score}</p>
                <p className="text-sm text-gray-500">van 70 punten</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={handleDownload} 
            className="mr-4"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Resultaten (CSV)
          </Button>
          <Button 
            onClick={() => shareMutation.mutate()} 
            variant="outline"
            disabled={shareMutation.isPending}
          >
            {shareMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="mr-2 h-4 w-4" />
            )}
            Deel met Teamleider
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
