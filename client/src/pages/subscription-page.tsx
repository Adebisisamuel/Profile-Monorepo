import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import { useQuery } from "@tanstack/react-query";
import { SUBSCRIPTION_PLANS } from "@shared/constants";

export default function SubscriptionPage() {
  const { user, isLoading } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>(SUBSCRIPTION_PLANS.FREE);

  // If user is a team leader, fetch their teams to find the subscription plan
  const { data: teams, isLoading: isTeamsLoading } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      if (!user || user.role !== 'teamleader') return [];
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
    enabled: !!user && user.role === 'teamleader'
  });

  // Define TeamType interface
  interface TeamType {
    id: number;
    name: string;
    plan: string;
  }

  // Determine current plan from teams data
  useEffect(() => {
    if (teams && teams.length > 0) {
      // Find the highest subscription level among all teams
      const teamsWithPlan = teams as TeamType[];
      if (teamsWithPlan.some((team: TeamType) => team.plan === SUBSCRIPTION_PLANS.PROPLUS)) {
        setCurrentPlan(SUBSCRIPTION_PLANS.PROPLUS);
      } else if (teamsWithPlan.some((team: TeamType) => team.plan === SUBSCRIPTION_PLANS.PRO)) {
        setCurrentPlan(SUBSCRIPTION_PLANS.PRO);
      } else {
        setCurrentPlan(SUBSCRIPTION_PLANS.FREE);
      }
    }
  }, [teams]);

  if (isLoading || isTeamsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <h2 className="font-semibold text-xl mb-4">Niet ingelogd</h2>
        <p className="mb-6">
          Je moet ingelogd zijn om je abonnement te bekijken en beheren.
        </p>
        <a 
          href="/auth" 
          className="inline-block bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Inloggen
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Jouw Abonnement</CardTitle>
          <CardDescription>
            Bekijk en beheer je huidige abonnement of upgrade naar een beter plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-primary/5 rounded-md">
            <h3 className="text-lg font-medium mb-2">Huidig Abonnement: {currentPlan === 'free' ? 'Gratis' : currentPlan === 'pro' ? 'Pro' : 'Pro+'}</h3>
            {currentPlan === 'free' && (
              <p className="text-muted-foreground">Je gebruikt momenteel het gratis abonnement. Dit geeft je toegang tot basis functionaliteiten met beperkte teams en gebruikers.</p>
            )}
            {currentPlan === 'pro' && (
              <p className="text-muted-foreground">Je gebruikt momenteel het Pro abonnement. Dit geeft je toegang tot uitgebreide functionaliteiten met meer teams en gebruikers.</p>
            )}
            {currentPlan === 'proplus' && (
              <p className="text-muted-foreground">Je gebruikt momenteel het Pro+ abonnement. Dit geeft je volledige toegang tot alle functionaliteiten zonder praktische beperkingen.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-6">Beschikbare Abonnementen</h2>
      
      <SubscriptionPlans 
        onSelectPlan={(plan) => {
          // In a real implementation, this would redirect to checkout or payment page
          alert(`Je hebt het ${plan} abonnement geselecteerd. In de volledige implementatie zou dit naar betaling gaan.`);
        }} 
      />
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Abonnementsvoordelen</CardTitle>
          <CardDescription>
            Vergelijk de voordelen van verschillende abonnementen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Gratis Abonnement</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tot 40 gebruikers</li>
                <li>Maximaal 1 team</li>
                <li>Toegang tot basis vragenlijst</li>
                <li>Persoonlijke resultaten en aanbevelingen</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Pro Abonnement</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tot 200 gebruikers</li>
                <li>Maximaal 20 teams</li>
                <li>Volledige toegang tot alle vragenlijsten</li>
                <li>Uitgebreide team-analyse en aanbevelingen</li>
                <li>Vergelijking met landelijke gemiddelden</li>
                <li>Team gap analyse</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Pro+ Abonnement</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tot 5000 gebruikers</li>
                <li>Maximaal 500 teams</li>
                <li>Volledige toegang tot alle functionaliteiten</li>
                <li>Kerkdashboard met aggregeerde data over teams</li>
                <li>Denominatie-specifieke vergelijkingen</li>
                <li>Prioriteit ondersteuning</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}