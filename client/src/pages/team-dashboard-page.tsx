import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { TeamStats } from "@/components/dashboard/leader/team-stats";
import { TeamCharts } from "@/components/dashboard/leader/team-charts";
import { TeamTable } from "@/components/dashboard/leader/team-table";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema for creating a team
const createTeamSchema = z.object({
  name: z.string().min(1, "Team naam is verplicht"),
  description: z.string().optional(),
  subscriptionTier: z.enum(["free", "pro", "pro_plus"]).default("free"),
});

type CreateTeamFormValues = z.infer<typeof createTeamSchema>;

export default function TeamDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  
  // Get user's teams
  const { data: userTeams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ["/api/user/teams"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0]);
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });
  
  // Create team form
  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      subscriptionTier: "free",
    },
  });
  
  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: CreateTeamFormValues) => {
      const res = await apiRequest("POST", "/api/teams", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Team aangemaakt",
        description: "Het team is succesvol aangemaakt.",
      });
      setIsCreateTeamOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/user/teams"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CreateTeamFormValues) => {
    createTeamMutation.mutate(data);
  };
  
  // Get team data if user is a team leader
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  
  // Effect to set the initial selected team
  React.useEffect(() => {
    if (userTeams && userTeams.leadTeams && userTeams.leadTeams.length > 0) {
      setSelectedTeamId(userTeams.leadTeams[0].id);
    }
  }, [userTeams]);
  
  // Fetch team data
  const { data: teamData, isLoading: isLoadingTeamData } = useQuery({
    queryKey: ["/api/teams", selectedTeamId, "results"],
    queryFn: async ({ queryKey }) => {
      if (!selectedTeamId) return null;
      const res = await fetch(`/api/teams/${selectedTeamId}/results`);
      if (!res.ok) throw new Error("Failed to fetch team results");
      return res.json();
    },
    enabled: !!selectedTeamId,
  });
  
  if (isLoadingTeams) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
        </div>
      </DashboardLayout>
    );
  }
  
  // Check if user is not a team leader or has no teams
  if (!user?.isTeamLeader || !userTeams?.leadTeams || userTeams.leadTeams.length === 0) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <h2 className="font-semibold text-xl text-navy mb-4">Geen teams gevonden</h2>
          <p className="text-navy-light mb-6">
            Je bent geen teamleider of je hebt nog geen teams aangemaakt.
          </p>
          <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal text-white hover:bg-teal-dark">
                <UserPlus className="h-4 w-4 mr-2" />
                Team aanmaken
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuw team aanmaken</DialogTitle>
                <DialogDescription>
                  Vul de details in om een nieuw team aan te maken.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team naam</FormLabel>
                        <FormControl>
                          <Input placeholder="Voer een teamnaam in" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beschrijving (optioneel)</FormLabel>
                        <FormControl>
                          <Input placeholder="Korte beschrijving van het team" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      className="bg-teal text-white hover:bg-teal-dark"
                      disabled={createTeamMutation.isPending}
                    >
                      {createTeamMutation.isPending ? "Bezig met aanmaken..." : "Team aanmaken"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    );
  }
  
  // Loading team data
  if (isLoadingTeamData) {
    return (
      <DashboardLayout title="Team Dashboard" subtitle="Overzicht van de bedieningen binnen je team">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
        </div>
      </DashboardLayout>
    );
  }
  
  const selectedTeam = userTeams.leadTeams.find(team => team.id === selectedTeamId);
  
  return (
    <DashboardLayout title="Team Dashboard" subtitle="Overzicht van de bedieningen binnen je team">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          {userTeams.leadTeams.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-navy-light mb-1">
                Selecteer team:
              </label>
              <select 
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal w-full md:w-auto"
                value={selectedTeamId || ""}
                onChange={(e) => setSelectedTeamId(Number(e.target.value))}
              >
                {userTeams.leadTeams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <Button variant="outline" className="bg-white text-navy-light">
            <Download className="h-4 w-4 mr-1" />
            Exporteren
          </Button>
          <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal text-white hover:bg-teal-dark">
                <UserPlus className="h-4 w-4 mr-1" />
                Lid Toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Teamlid toevoegen</DialogTitle>
                <DialogDescription>
                  Gebruik de volgende team code om teamleden uit te nodigen:
                </DialogDescription>
              </DialogHeader>
              
              <div className="p-4 bg-gray-50 rounded-md text-center">
                <p className="font-bold text-xl text-navy">{selectedTeam?.teamCode}</p>
                <p className="text-sm text-navy-light mt-2">
                  Deel deze code met nieuwe teamleden om ze uit te nodigen voor dit team.
                </p>
              </div>
              
              <DialogFooter>
                <Button 
                  className="bg-teal text-white hover:bg-teal-dark"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedTeam?.teamCode || "");
                    toast({
                      title: "Code gekopieerd",
                      description: "De team code is gekopieerd naar je klembord.",
                    });
                  }}
                >
                  Kopieer Code
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {teamData && (
        <>
          <TeamStats 
            members={teamData.members} 
            results={teamData.results} 
          />
          
          <TeamCharts 
            teamResults={teamData.results.map(result => ({
              userId: result.userId, 
              scores: result.scores
            }))} 
          />
          
          <TeamTable 
            members={teamData.members} 
            results={teamData.results} 
          />
        </>
      )}
    </DashboardLayout>
  );
}
