import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Lightbulb, Users, BarChart2, ChevronRight, ArrowRight } from "lucide-react";
import secondaryLogo from "@assets/Secundaire-logo_zwart-en-groen (1).png";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Based on first image */}
      <div className="flex flex-col min-h-screen">
        {/* Navigation */}
        <header className="border-b py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={secondaryLogo} alt="Logo" className="h-10" />
            <span className="font-bold text-xl">BEDIENINGEN PROFIEL</span>
          </div>
          <Link to="/auth">
            <Button variant="outline" className="rounded-full">Inloggen</Button>
          </Link>
        </header>

        {/* Hero Content */}
        <main className="flex-1 bg-[#e3f4e7]">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-12">
              {/* Left side: Text content */}
              <div className="flex-1 space-y-6 max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Inzicht in je gemeenteleden & kerk
                </h1>
                <div className="text-lg md:text-xl text-gray-700 space-y-4">
                  <p>
                    Zie welke rollen mensen in de gemeente innemen binnen de vijfvoudige bediening. 
                    Stel een winnend team samen. Begeleid je leiders en coach op het individu.
                  </p>
                  <p>
                    Verkrijg inzicht in de samenstelling van je kerk in een paar klikken.
                  </p>
                </div>
                <div className="pt-4">
                  <Link to="/auth?signup=true">
                    <Button className="bg-[#52B788] hover:bg-[#429670] text-white rounded-full px-8 py-6 shadow-md transition-all hover:shadow-lg transform hover:-translate-y-1">
                      <span className="text-lg font-medium">Begin je profiel</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right side: Dashboard Preview */}
              <div className="flex-1 max-w-xl">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden transform md:translate-y-4">
                  <div className="p-4 bg-gray-50 border-b">
                    <h3 className="text-center font-semibold text-gray-800">Dashboard</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#52B788] h-32 rounded-lg shadow-sm"></div>
                      <div className="space-y-4">
                        <div className="bg-[#52B788] h-14 rounded-lg shadow-sm"></div>
                        <div className="bg-[#52B788] h-14 rounded-lg shadow-sm"></div>
                      </div>
                      <div className="bg-[#52B788] h-32 rounded-lg shadow-sm"></div>
                      <div className="space-y-4">
                        <div className="bg-[#52B788] h-14 rounded-lg shadow-sm"></div>
                        <div className="bg-[#52B788] h-14 rounded-lg shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* How it works section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Hoe Werkt Het?</h2>
            <p className="mt-4 text-xl text-gray-600">
              Het Vijfvoudig Bedieningen Model helpt kerkteams hun unieke samenstelling te begrijpen
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <Lightbulb className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Vragenlijst</CardTitle>
                <CardDescription>
                  Doorloop onze wetenschappelijk onderbouwde vragenlijst
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Beantwoord een serie vragen die je helpen je gaven en talenten te identificeren binnen het Vijfvoudig Bedieningen model.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Persoonlijk Profiel</CardTitle>
                <CardDescription>
                  Ontvang gedetailleerde resultaten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Ontdek jouw unieke mix van Apostel, Profeet, Evangelist, Herder en Leraar - met gedetailleerde uitleg en aanbevelingen.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Team Formatie</CardTitle>
                <CardDescription>
                  Bouw gebalanceerde teams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Teamleiders kunnen teamprofielen bekijken, hiaten identificeren, en doelgericht werken aan een evenwichtige teamsamenstelling.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Resultaten</CardTitle>
                <CardDescription>
                  Meer effectiviteit en vervulling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Groei in je gaven, vind vervulling in je rol, en help je team om meer impact te maken binnen de kerk en gemeenschap.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* The Fivefold Ministry - Exactly as shown in second image */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#e3f4e7]">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">The Fivefold Ministry</h2>
          
          <div className="grid gap-6 max-w-3xl mx-auto">
            {/* Apostle */}
            <div className="bg-white rounded-lg p-6 border-l-4 border-blue-500 shadow">
              <h3 className="text-blue-500 text-xl font-medium mb-2">Apostle</h3>
              <p className="text-gray-700">
                You are a pioneer and visionary. You see the big picture and are focused on building and expanding God's Kingdom. You like to lay new foundations and enjoy challenge and change.
              </p>
            </div>
            
            {/* Prophet */}
            <div className="bg-white rounded-lg p-6 border-l-4 border-purple-500 shadow">
              <h3 className="text-purple-500 text-xl font-medium mb-2">Prophet</h3>
              <p className="text-gray-700">
                You have a strong ability to hear God's voice and speak His truth. You are often focused on seeing what is wrong and how it can be improved.
              </p>
            </div>
            
            {/* Evangelist */}
            <div className="bg-white rounded-lg p-6 border-l-4 border-red-500 shadow">
              <h3 className="text-red-500 text-xl font-medium mb-2">Evangelist</h3>
              <p className="text-gray-700">
                You have a passion for sharing the good news with others. You are excited about reaching people with the message of salvation and grace.
              </p>
            </div>
            
            {/* Shepherd */}
            <div className="bg-white rounded-lg p-6 border-l-4 border-green-500 shadow">
              <h3 className="text-green-500 text-xl font-medium mb-2">Shepherd</h3>
              <p className="text-gray-700">
                You have a big heart for people and enjoy caring for others. You are focused on the well-being and growth of individuals.
              </p>
            </div>
            
            {/* Teacher */}
            <div className="bg-white rounded-lg p-6 border-l-4 border-yellow-500 shadow">
              <h3 className="text-yellow-500 text-xl font-medium mb-2">Teacher</h3>
              <p className="text-gray-700">
                You have a gift for explaining complex concepts and helping others understand truth. You value clarity, accuracy, and deep understanding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Voordelen</h2>
            <p className="mt-4 text-xl text-gray-600">
              Ontdek waarom steeds meer kerken vertrouwen op Bedieningen Profiel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#52B788]">
              <div className="flex flex-col space-y-4">
                <div className="bg-[#e3f4e7] rounded-full w-12 h-12 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-[#52B788]" />
                </div>
                <h3 className="text-xl font-medium">Betere teamvorming</h3>
                <p className="text-gray-600">
                  Stel evenwichtige teams samen op basis van vijfvoudige bedieningen profielen, vermijd overlap en vul blinde vlekken aan.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#52B788]">
              <div className="flex flex-col space-y-4">
                <div className="bg-[#e3f4e7] rounded-full w-12 h-12 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#52B788]" />
                </div>
                <h3 className="text-xl font-medium">Persoonlijke ontwikkeling</h3>
                <p className="text-gray-600">
                  Help teamleden groeien in begrip van hun unieke gaven en hoe ze die effectief kunnen inzetten voor het Koninkrijk.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#52B788]">
              <div className="flex flex-col space-y-4">
                <div className="bg-[#e3f4e7] rounded-full w-12 h-12 flex items-center justify-center">
                  <BarChart2 className="h-6 w-6 text-[#52B788]" />
                </div>
                <h3 className="text-xl font-medium">Data-gedreven inzichten</h3>
                <p className="text-gray-600">
                  Verkrijg waardevolle statistieken en visualisaties die helpen bij strategische besluitvorming binnen je kerk of organisatie.
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-16 bg-gray-50 rounded-lg p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <div className="flex-shrink-0 bg-[#52B788] w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                JP
              </div>
              <div>
                <p className="text-xl italic text-gray-700 mb-4">
                  "Door Bedieningen Profiel kregen we eindelijk een helder beeld van ons team. We begrijpen nu waarom bepaalde zaken moeizaam gingen, en konden gericht stappen nemen om onze bediening te versterken."
                </p>
                <div>
                  <p className="font-medium">Johan Peters</p>
                  <p className="text-gray-500">Teamleider, Evangelische Gemeente Utrecht</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#e3f4e7]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Abonnementen</h2>
            <p className="mt-4 text-xl text-gray-600">
              Kies het plan dat het beste bij jouw kerk of team past
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4">Gratis</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-bold">€0</span>
                  <span className="text-gray-500 ml-2">/ maand</span>
                </div>
                <p className="text-gray-600 mb-6">Voor kleine teams en individuen</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>Max. 40 gebruikers</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>1 team</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>Basis team analytics</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>Persoonlijke profielen</span>
                  </li>
                </ul>
              </div>
              <div className="px-8 pb-8">
                <Link to="/auth">
                  <Button variant="outline" className="w-full py-6 rounded-md text-[#52B788] border-[#52B788] hover:bg-[#e3f4e7]">
                    <span className="text-base">Aanmelden</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-[#52B788] relative">
              <div className="absolute top-0 inset-x-0">
                <div className="bg-[#52B788] text-white text-center py-1 text-sm font-medium">
                  AANBEVOLEN
                </div>
              </div>
              <div className="p-8 pt-12">
                <h3 className="text-2xl font-bold mb-4">Pro</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-bold">€10</span>
                  <span className="text-gray-500 ml-2">/ maand</span>
                </div>
                <p className="text-gray-600 mb-6">Voor middelgrote teams en kerken</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>Max. 200 gebruikers</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>20 teams</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>Geavanceerde team analytics</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>Data export mogelijkheden</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>Team gap-analyse</span>
                  </li>
                </ul>
              </div>
              <div className="px-8 pb-8">
                <Link to="/auth">
                  <Button className="w-full py-6 rounded-md bg-[#52B788] hover:bg-[#429670]">
                    <span className="text-base">Aanmelden</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pro+ Plan */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4">Pro+</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-bold">€25</span>
                  <span className="text-gray-500 ml-2">/ maand</span>
                </div>
                <p className="text-gray-600 mb-6">Voor grote kerken en organisaties</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>Max. 5000 gebruikers</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>500 teams</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>Alle Pro features</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>Kerk-brede statistieken</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>Prioriteit support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#52B788] mr-3 flex-shrink-0" />
                    <span>Maatwerk rapportages</span>
                  </li>
                </ul>
              </div>
              <div className="px-8 pb-8">
                <Link to="/auth">
                  <Button variant="outline" className="w-full py-6 rounded-md text-[#52B788] border-[#52B788] hover:bg-[#e3f4e7]">
                    <span className="text-base">Aanmelden</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600">Jaarlijkse facturatie beschikbaar met 20% korting. <Link to="/contact" className="text-[#52B788] hover:underline">Neem contact op</Link> voor meer informatie.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Klaar om je team naar het volgende niveau te tillen?
          </h2>
          <p className="text-xl text-primary-foreground mb-8 max-w-3xl mx-auto">
            Ontdek hoe het Vijfvoudig Bedieningen model jouw team kan transformeren.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
              Begin vandaag nog
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-100">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <img
                src={secondaryLogo}
                alt="Bedieningen Profiel Logo"
                className="h-10 w-auto object-contain mb-4"
              />
              <p className="text-gray-600 mb-4">
                Bedieningen Profiel helpt teams en individuen hun gaven te ontdekken en effectiever samen te werken, gebaseerd op het Vijfvoudig Bedieningen model.
              </p>
              <p className="text-gray-500 text-sm">
                © 2025 Bedieningen Profiel. Alle rechten voorbehouden.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy-policy">
                    <span className="text-gray-600 hover:text-primary cursor-pointer">Privacybeleid</span>
                  </Link>
                </li>
                <li>
                  <Link to="/terms-and-conditions">
                    <span className="text-gray-600 hover:text-primary cursor-pointer">Algemene Voorwaarden</span>
                  </Link>
                </li>
                <li>
                  <Link to="/auth">
                    <span className="text-gray-600 hover:text-primary cursor-pointer">Inloggen</span>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-gray-600">info@bedieningenprofiel.nl</li>
                <li className="text-gray-600">+31 (0) 20 123 4567</li>
                <li className="text-gray-600">Amsterdam, Nederland</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}