import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import secondaryLogo from "@assets/Secundaire-logo_zwart-en-groen (1).png";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="border-b py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={secondaryLogo} alt="Logo" className="h-10" />
          <span className="font-bold text-xl">BEDIENINGEN PROFIEL</span>
        </div>
        <Link to="/">
          <Button variant="outline" className="rounded-full">Terug naar Home</Button>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-8 lg:p-10">
        <div className="flex items-center mb-6">
          <ArrowLeft className="mr-2 h-5 w-5" />
          <Link to="/" className="text-primary hover:underline">Terug naar Home</Link>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacybeleid</h1>
        
        <div className="prose max-w-none">
          <p className="text-lg mb-4">Laatste update: 7 april 2025</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Inleiding</h2>
          <p>
            Welkom bij het privacybeleid van Bedieningen Profiel. Wij respecteren uw privacy en zetten ons in om uw persoonlijke gegevens te beschermen.
            Dit beleid informeert u over hoe wij omgaan met uw persoonlijke gegevens wanneer u onze website bezoekt of gebruik maakt van onze diensten.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. De gegevens die we verzamelen</h2>
          <p>We kunnen de volgende soorten persoonlijke gegevens verzamelen, gebruiken, opslaan en overdragen:</p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>Identiteitsgegevens: voornaam, achternaam, geboortedatum</li>
            <li>Contactgegevens: e-mailadres, woonplaats, land</li>
            <li>Profielgegevens: antwoorden op vragen, testresultaten, rolverdeling</li>
            <li>Gebruiksgegevens: hoe u onze website gebruikt, welke pagina's u bezoekt</li>
            <li>Marketingvoorkeuren: uw voorkeuren met betrekking tot marketing</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Hoe we uw gegevens gebruiken</h2>
          <p>We gebruiken uw persoonlijke gegevens om:</p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>Uw account aan te maken en te beheren</li>
            <li>Onze diensten aan u te leveren inclusief gepersonaliseerde resultaten en aanbevelingen</li>
            <li>U te informeren over wijzigingen in onze diensten</li>
            <li>Onze website en diensten te verbeteren</li>
            <li>Statistische analyses uit te voeren voor teamleiders en kerken (geanonimiseerd)</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Hoe lang we uw gegevens bewaren</h2>
          <p>
            We bewaren uw persoonlijke gegevens alleen zolang als nodig is voor de doeleinden waarvoor we ze hebben verzameld, 
            inclusief om te voldoen aan wettelijke, boekhoudkundige of rapportageverplichtingen.
            U kunt ten alle tijden verzoeken om uw gegevens te verwijderen via onze contactpagina.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Uw rechten</h2>
          <p>Onder de AVG/GDPR heeft u verschillende rechten met betrekking tot uw persoonlijke gegevens:</p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>Recht op toegang tot uw persoonlijke gegevens</li>
            <li>Recht op rectificatie van onjuiste gegevens</li>
            <li>Recht op wissen van uw gegevens (het 'recht om vergeten te worden')</li>
            <li>Recht op beperking van verwerking</li>
            <li>Recht op overdraagbaarheid van gegevens</li>
            <li>Recht om bezwaar te maken tegen verwerking</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Wijzigingen in dit beleid</h2>
          <p>
            We kunnen dit privacybeleid van tijd tot tijd bijwerken. Wanneer we wijzigingen aanbrengen, zullen we de bijgewerkte versie 
            op onze website plaatsen en de datum van "laatste update" bovenaan deze pagina aanpassen.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Contact</h2>
          <p>
            Als u vragen heeft over dit privacybeleid of onze privacy praktijken, neem dan contact met ons op via:
            <br />
            E-mail: info@bedieningenprofiel.nl
            <br />
            Telefoon: +31 (0) 20 123 4567
          </p>
        </div>
      </main>

      <footer className="py-6 px-6 border-t mt-10">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>© 2025 Bedieningen Profiel. Alle rechten voorbehouden.</p>
          <div className="mt-2 space-x-4">
            <Link to="/privacy-policy" className="text-primary hover:underline">Privacybeleid</Link>
            <Link to="/terms-and-conditions" className="text-primary hover:underline">Algemene Voorwaarden</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}