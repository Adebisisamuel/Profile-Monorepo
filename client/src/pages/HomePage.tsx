import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/Layout";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ROLES, ROLE_DESCRIPTIONS } from "@shared/constants";
import { ArrowRight, Users, ChartPie, Award, Lightbulb, Target } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStartProfile = () => {
    if (user) {
      navigate("/questionnaire");
    } else {
      navigate("/auth?redirect=/questionnaire");
    }
  };

  const handleSelectPlan = (plan: string) => {
    if (!user) {
      toast({
        title: "Inloggen vereist",
        description: "Log in om een abonnement te kiezen",
      });
      navigate("/auth");
      return;
    }

    toast({
      title: "Abonnement gekozen",
      description: `Je hebt het ${plan} abonnement gekozen`,
    });
    // In a real app, this would trigger a subscription flow
  };

  return (
    <Layout>
      <div className="w-full">
        {/* Hero section */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 bg-gradient-to-br from-primary-50 to-white p-8 rounded-xl">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-primary-dark">Inzicht</span> in je <br />
              <span className="text-gray-900">gemeenteleden & kerk</span>
            </h1>
            <p className="text-lg text-gray-700 mb-6">
              Zie welke rollen mensen in de gemeente innemen binnen de vijfvoudige bediening.
              Stel een winnend team samen. Begeleid je leiders en coach op het individu.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              Verkrijg inzicht in de samenstelling van je kerk in een paar klikken.
            </p>
            <Button 
              onClick={handleStartProfile} 
              className="bg-primary hover:bg-primary-dark text-white shadow-lg"
              size="lg"
            >
              Begin je profiel <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="md:w-1/2">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <img 
                src="data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22400%22%20viewBox%3D%220%200%20800%20400%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22800%22%20height%3D%22400%22%2F%3E%3Cg%20fill%3D%22%23dee2e6%22%3E%3Crect%20x%3D%22320%22%20y%3D%2250%22%20width%3D%22300%22%20height%3D%22150%22%2F%3E%3Crect%20x%3D%22320%22%20y%3D%22220%22%20width%3D%22300%22%20height%3D%22150%22%2F%3E%3Crect%20x%3D%22180%22%20y%3D%2250%22%20width%3D%22120%22%20height%3D%22320%22%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%22%2300c389%22%3E%3Crect%20x%3D%22200%22%20y%3D%2280%22%20width%3D%2280%22%20height%3D%22100%22%2F%3E%3Crect%20x%3D%22200%22%20y%3D%22200%22%20width%3D%2280%22%20height%3D%22120%22%2F%3E%3Crect%20x%3D%22340%22%20y%3D%2280%22%20width%3D%22120%22%20height%3D%22100%22%2F%3E%3Crect%20x%3D%22480%22%20y%3D%2280%22%20width%3D%22120%22%20height%3D%2280%22%2F%3E%3Crect%20x%3D%22340%22%20y%3D%22250%22%20width%3D%2280%22%20height%3D%2290%22%2F%3E%3Crect%20x%3D%22440%22%20y%3D%22250%22%20width%3D%22160%22%20height%3D%2290%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%22310%22%20y%3D%2230%22%20font-family%3D%22Arial%22%20font-size%3D%2218%22%20font-weight%3D%22bold%22%20text-anchor%3D%22middle%22%3EDashboard%3C%2Ftext%3E%3C%2Fsvg%3E" 
                alt="Dashboard preview" 
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* How it works section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Hoe werkt het?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary-100 p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">1. Vul de vragenlijst in</h3>
                <p className="text-gray-600">
                  Beantwoord eenvoudige vragen om je rol binnen de vijfvoudige bediening te bepalen. Het duurt slechts 5-10 minuten.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary-100 p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <ChartPie className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">2. Ontvang je resultaten</h3>
                <p className="text-gray-600">
                  Krijg direct inzicht in je primaire en secundaire bediening met een gedetailleerde uitleg van je persoonlijke profiel.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary-100 p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">3. Deel met je team</h3>
                <p className="text-gray-600">
                  Teamleiders kunnen de resultaten van alle teamleden zien en een compleet beeld krijgen van hun team samenstelling.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Roles explanation section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">De Vijfvoudige Bediening</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 text-blue-600">{ROLE_DESCRIPTIONS[ROLES.APOSTLE].title}</h3>
                <p className="text-gray-600">{ROLE_DESCRIPTIONS[ROLES.APOSTLE].description}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 text-purple-600">{ROLE_DESCRIPTIONS[ROLES.PROPHET].title}</h3>
                <p className="text-gray-600">{ROLE_DESCRIPTIONS[ROLES.PROPHET].description}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 text-red-600">{ROLE_DESCRIPTIONS[ROLES.EVANGELIST].title}</h3>
                <p className="text-gray-600">{ROLE_DESCRIPTIONS[ROLES.EVANGELIST].description}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 text-green-600">{ROLE_DESCRIPTIONS[ROLES.HERDER].title}</h3>
                <p className="text-gray-600">{ROLE_DESCRIPTIONS[ROLES.HERDER].description}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500 md:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 text-amber-600">{ROLE_DESCRIPTIONS[ROLES.TEACHER].title}</h3>
                <p className="text-gray-600">{ROLE_DESCRIPTIONS[ROLES.TEACHER].description}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benefits section */}
        <div className="mb-16 bg-gray-50 p-8 rounded-xl">
          <h2 className="text-3xl font-bold text-center mb-12">Voordelen voor jouw gemeente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <div className="rounded-full bg-green-100 p-2 mr-4">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Ontdek verborgen talenten</h3>
                <p className="text-gray-600">
                  Help gemeenteleden hun unieke gaven en talenten te ontdekken en te ontwikkelen.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="rounded-full bg-blue-100 p-2 mr-4">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Evenwichtige teams</h3>
                <p className="text-gray-600">
                  Creëer teams met een goede balans van alle vijf bedieningen voor maximaal effect.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="rounded-full bg-purple-100 p-2 mr-4">
                <Lightbulb className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Strategische leiderschap</h3>
                <p className="text-gray-600">
                  Neem beslissingen op basis van data over de sterke en zwakke punten in je gemeente.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="rounded-full bg-amber-100 p-2 mr-4">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Effectief mentorschap</h3>
                <p className="text-gray-600">
                  Coach mensen op basis van hun unieke profiel en help ze groeien in hun bediening.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription plans */}
        <h2 className="text-3xl font-bold text-center mb-8">Abonnementen</h2>
        <SubscriptionPlans onSelectPlan={handleSelectPlan} />
        
        {/* Call to action */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Klaar om te beginnen?</h2>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Ontdek jouw rol binnen de vijfvoudige bediening en help je gemeente om effectiever samen te werken.
          </p>
          <Button 
            onClick={handleStartProfile} 
            className="bg-primary hover:bg-primary-dark text-white shadow-lg"
            size="lg"
          >
            Begin je profiel <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
