import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useNavigate } from "react-router-dom";
import { FeedbackService } from "@/services/feedback-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Clipboard, ClipboardCheck, Plus, Users, Globe, ExternalLink } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SUBSCRIPTION_PLANS } from "@shared/constants";

// Zod schema for creating a team
const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
  plan: z.string().optional(),
});

type Team = {
  id: number;
  name: string;
  createdById: number;
  plan: string;
  inviteCode: string;
}

export default function TeamManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copiedInviteCode, setCopiedInviteCode] = useState<number | null>(null);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);

  // Fetch teams created by the user
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: [`/api/users/${user?.id}/teams`],
    enabled: !!user?.id,
  });

  // Form for creating a new team
  const form = useForm<z.infer<typeof createTeamSchema>>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      plan: "free",
    },
  });

  // Mutation for creating a team
  const createTeamMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTeamSchema>) => {
      const res = await apiRequest("POST", "/api/teams", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/teams`] });
      FeedbackService.teamCreated(data.name);
      form.reset();
      setIsCreateTeamOpen(false);
    },
    onError: (error: Error) => {
      FeedbackService.error(error.message || "Failed to create team");
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof createTeamSchema>) => {
    createTeamMutation.mutate(data);
  };

  // Function to copy invite link to clipboard
  const copyInviteLink = (teamId: number, inviteCode: string) => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/join/${inviteCode}`;
    
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedInviteCode(teamId);
      FeedbackService.teamInviteCopied();
      
      // Reset the copied state after 3 seconds
      setTimeout(() => {
        setCopiedInviteCode(null);
      }, 3000);
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Inloggen Vereist</CardTitle>
            <CardDescription>Je moet ingelogd zijn om teams te beheren.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Ga naar Inloggen
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Team Beheren</h1>
        <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Team Aanmaken
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuw Team Aanmaken</DialogTitle>
              <DialogDescription>
                Maak een team aan en nodig leden uit om de vragenlijst in te vullen
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teamnaam</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Voer teamnaam in" />
                      </FormControl>
                      <FormDescription>
                        Dit wordt getoond aan teamleden wanneer ze zich aansluiten.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abonnement</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kies een abonnement" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">Gratis Abonnement</SelectItem>
                          <SelectItem value="pro">Pro Abonnement</SelectItem>
                          <SelectItem value="proplus">Pro+ Abonnement</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Het abonnement bepaalt het aantal gebruikers en teams.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createTeamMutation.isPending}
                    className="w-full"
                  >
                    {createTeamMutation.isPending ? "Aanmaken..." : "Team Aanmaken"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Jouw Teams</CardTitle>
          <CardDescription>Beheer en bekijk de profielen van je teamleden</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingTeams ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : teams && teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Card key={team.id} className="overflow-hidden">
                  <CardHeader className="bg-primary/5 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users size={16} className="text-primary" />
                      {team.name}
                    </CardTitle>
                    <CardDescription>
                      {team.plan === 'free' ? 'Gratis' : team.plan === 'pro' ? 'Pro' : 'Pro+'} Abonnement
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Uitnodigingslink Delen</Label>
                        <div className="mt-1 flex">
                          <Input
                            value={`${window.location.origin}/join/${team.inviteCode}`}
                            readOnly
                            className="rounded-r-none text-sm"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-l-none border-l-0"
                            onClick={() => copyInviteLink(team.id, team.inviteCode)}
                          >
                            {copiedInviteCode === team.id ? (
                              <ClipboardCheck size={14} className="text-green-600" />
                            ) : (
                              <Clipboard size={14} />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Deel deze link met teamleden om hen uit te nodigen
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t bg-muted/10 px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/teams/${team.id}`)}
                      className="gap-1 text-xs"
                    >
                      <Users size={12} />
                      Team Bekijken
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        window.open(`/join/${team.inviteCode}`, "_blank");
                      }}
                      className="gap-1 text-xs"
                    >
                      <ExternalLink size={12} />
                      Link Testen
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 bg-muted/5 rounded-lg">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-1">Nog Geen Teams</h3>
              <p className="text-center text-muted-foreground mb-4 max-w-md">
                Maak je eerste team aan om leden uit te nodigen en hun beoordelingen te verzamelen.
              </p>
              <Button onClick={() => setIsCreateTeamOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Maak Je Eerste Team Aan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}