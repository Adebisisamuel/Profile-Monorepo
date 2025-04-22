import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import { useNavigate } from "react-router-dom";
// Import the SWOTAnalysis component directly
import SWOTAnalysis from "../components/SWOTAnalysis";

export default function RecommendationsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  
  if (isLoading) {
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
          Je moet ingelogd zijn om je persoonlijke aanbevelingen te bekijken.
        </p>
        <Button
          onClick={() => navigate("/auth")}
          className="inline-block bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Inloggen
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Jouw Persoonlijke Profiel & SWOT Analyse</CardTitle>
          <CardDescription>
            Op basis van je bedieningenprofiel hebben we een persoonlijke SWOT analyse 
            samengesteld om je te helpen groeien in jouw rol.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* For testing purposes, we're using a direct SWOT analysis for Apostle */}
          <div className="space-y-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span>Jouw persoonlijk profiel</span>
                  <span className="text-sm font-normal bg-muted px-2 py-1 rounded">
                    Apostel
                  </span>
                </CardTitle>
                <CardDescription>
                  Je belangrijkste rol is Apostel met Prophet als tweede rol. 
                  Je hebt een Evenwichtig profiel.
                </CardDescription>
              </CardHeader>
            </Card>
          
            <SWOTAnalysis primaryRole="APOSTLE" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Wat te doen met deze aanbevelingen?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Deze aanbevelingen zijn bedoeld om je te helpen je sterke punten verder te ontwikkelen en 
            bewust te worden van gebieden waarin je kunt groeien. Gebruik ze als startpunt voor reflectie en groei.
          </p>
          <p>
            Je kunt deze aanbevelingen bespreken met je teamleider of mentor om een persoonlijk ontwikkelingsplan 
            te maken dat aansluit bij jouw unieke gaven en de behoeften van je team of gemeente.
          </p>
          <p>
            Onthoud dat het Five-Fold Ministry model een hulpmiddel is, niet een definitief oordeel over je identiteit. 
            God werkt op unieke manieren door ieder persoon heen, en deze profielen helpen slechts om dat beter te begrijpen.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Volgende Stappen</CardTitle>
          <CardDescription>
            Je hebt nu je persoonlijke aanbevelingen. Wat wil je als volgende stap doen?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Als je een team wilt opzetten en anderen wilt uitnodigen om de vragenlijst in te vullen,
            kun je teams beheren en teaminzichten bekijken. Als teamleider krijg je toegang tot nuttige dashboards
            en analyses om je team te begrijpen.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => navigate("/teams")}
            className="w-full sm:w-auto"
          >
            Ga naar Je Teams
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowSubscriptions(!showSubscriptions)}
            className="w-full sm:w-auto"
          >
            {showSubscriptions ? "Verberg Abonnementen" : "Bekijk Abonnementen"}
          </Button>
        </CardFooter>
      </Card>
      
      {showSubscriptions && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Upgrade je abonnement</h2>
          <SubscriptionPlans 
            onSelectPlan={(plan) => {
              // Handle subscription plan selection
              console.log(`Selected plan: ${plan}`);
              // In a real implementation, this would redirect to checkout or show a payment modal
              alert(`Je hebt het ${plan} abonnement geselecteerd. In de volledige implementatie zou dit naar betaling gaan.`);
            }} 
          />
        </div>
      )}
    </div>
  );
}