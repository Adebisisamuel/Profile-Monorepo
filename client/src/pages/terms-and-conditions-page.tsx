import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import secondaryLogo from "@assets/Secundaire-logo_zwart-en-groen (1).png";
import { ArrowLeft } from "lucide-react";

export default function TermsAndConditionsPage() {
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
        
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Algemene Voorwaarden</h1>
        
        <div className="prose max-w-none">
          <p className="text-lg mb-4">Laatste update: 7 april 2025</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptatie van Voorwaarden</h2>
          <p>
            Door toegang te krijgen tot of gebruik te maken van Bedieningen Profiel ("Dienst"), gaat u akkoord met deze Algemene Voorwaarden.
            Als u niet akkoord gaat met deze voorwaarden, gebruik de Dienst dan niet.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Beschrijving van de Dienst</h2>
          <p>
            Bedieningen Profiel biedt een online platform voor persoonlijkheidsprofilering gebaseerd op het Vijfvoudig Bedieningen model.
            De Dienst stelt gebruikers in staat om:
          </p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>Persoonlijkheidstests te maken</li>
            <li>Persoonlijke profielen te bekijken en op te slaan</li>
            <li>Teams te maken en team dashboards te bekijken (voor teamleiders)</li>
            <li>Kerkprofielen aan te maken en statistieken te bekijken</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Gebruikersaccounts</h2>
          <p>
            Om de Dienst te gebruiken, moet u een account aanmaken en accurate, complete en actuele informatie verstrekken.
            U bent verantwoordelijk voor het beveiligen van uw accountgegevens en voor alle activiteiten die plaatsvinden onder uw account.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Abonnementen en Betalingen</h2>
          <p>
            Bedieningen Profiel biedt verschillende abonnementsopties:
          </p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li><strong>Gratis:</strong> Max. 40 gebruikers, 1 team, basis analytics</li>
            <li><strong>Pro:</strong> €10/maand, max. 200 gebruikers, 20 teams, uitgebreide analytics</li>
            <li><strong>Pro+:</strong> €25/maand, max. 5000 gebruikers, 500 teams, premium analytics</li>
          </ul>
          <p>
            Betalingen worden maandelijks of jaarlijks in rekening gebracht, afhankelijk van het gekozen plan.
            Abonnementen worden automatisch verlengd tenzij minimaal 7 dagen voor het einde van de huidige termijn opgezegd.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Intellectueel Eigendom</h2>
          <p>
            Alle inhoud, functies en functionaliteit beschikbaar via de Dienst zijn eigendom van Bedieningen Profiel of haar licentiegevers 
            en worden beschermd door auteursrecht-, handelsmerk-, octrooirecht, bedrijfsgeheim en andere intellectuele eigendoms- of eigendomsrechten.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Gebruikersinhoud</h2>
          <p>
            Door inhoud te uploaden of anderszins beschikbaar te stellen via de Dienst, verleent u Bedieningen Profiel een wereldwijde, 
            niet-exclusieve, royaltyvrije licentie om dergelijke inhoud te gebruiken, te reproduceren, te wijzigen, aan te passen, te publiceren, 
            te vertalen en te distribueren in verband met de exploitatie van de Dienst.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Beperking van Aansprakelijkheid</h2>
          <p>
            In geen geval zal Bedieningen Profiel, haar directeuren, werknemers, partners, agenten, leveranciers of filialen aansprakelijk zijn voor:
          </p>
          <ul className="list-disc pl-6 mt-2 mb-4">
            <li>Indirecte, incidentele, speciale, punitieve, dekkings- of gevolgschade</li>
            <li>Verlies van winst, inkomsten, gegevens, gebruik of andere immateriële verliezen</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Wijzigingen aan de Dienst</h2>
          <p>
            Bedieningen Profiel behoudt zich het recht voor om de Dienst of deze Algemene Voorwaarden te allen tijde te wijzigen of stop te zetten, 
            met of zonder kennisgeving aan u. We zijn niet aansprakelijk jegens u of een derde partij voor dergelijke wijzigingen, 
            prijsveranderingen, opschortingen of stopzettingen.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Toepasselijk Recht</h2>
          <p>
            Deze Algemene Voorwaarden worden beheerst door en geïnterpreteerd in overeenstemming met de wetten van Nederland, 
            zonder rekening te houden met de principes van conflicterende wetgeving.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact</h2>
          <p>
            Als u vragen heeft over deze Algemene Voorwaarden, neem dan contact met ons op via:
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