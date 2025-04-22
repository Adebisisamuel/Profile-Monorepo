import Layout from "@/components/Layout";

export default function PrivacyPolicyPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary">Privacybeleid</h1>
        
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
          <p className="mb-4">
            Ingangsdatum: 2 April 2025
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">1. Inleiding</h2>
          <p className="mb-4">
            Welkom bij Bedieningen Profiel. We zetten ons in voor het beschermen van uw privacy en het verantwoord omgaan met uw persoonlijke gegevens. Dit privacybeleid legt uit hoe we informatie verzamelen, gebruiken en beschermen wanneer u onze diensten gebruikt.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">2. Welke informatie verzamelen we</h2>
          <p className="mb-4">
            We verzamelen de volgende categorieën persoonlijke gegevens:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Accountgegevens: naam, e-mailadres, gebruikersnaam en wachtwoord</li>
            <li>Profielgegevens: geboortedatum, land, stad, huidige sector, voorkeurssector</li>
            <li>Vragenlijstantwoorden: uw reacties op onze bedieningsprofielquiz</li>
            <li>Teamgegevens: teamnaam, teamleden en teamanalyses</li>
            <li>Kerkgegevens: denominatie, kerknaam en kerklocatie</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">3. Hoe we uw informatie gebruiken</h2>
          <p className="mb-4">
            We gebruiken uw persoonlijke gegevens voor de volgende doeleinden:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Om uw persoonlijke bedieningsprofiel te genereren</li>
            <li>Om teamanalyses en aanbevelingen te bieden</li>
            <li>Om u te laten deelnemen aan teams</li>
            <li>Om uw account te beheren en onze diensten te verlenen</li>
            <li>Om u op de hoogte te houden van relevante updates of wijzigingen</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">4. Hoe we uw informatie delen</h2>
          <p className="mb-4">
            We delen uw persoonlijke gegevens in de volgende situaties:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Met uw teamleiders en teamleden (alleen profielresultaten)</li>
            <li>Met dienstverleners die ons helpen bij het aanbieden van onze diensten</li>
            <li>Als we wettelijk verplicht zijn om informatie te delen</li>
          </ul>
          <p className="mb-4">
            We verkopen uw persoonlijke gegevens nooit aan derden.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">5. Uw rechten</h2>
          <p className="mb-4">
            Onder de AVG/GDPR heeft u de volgende rechten:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Recht op inzage: u kunt uw persoonlijke gegevens opvragen</li>
            <li>Recht op rectificatie: u kunt onjuiste gegevens corrigeren</li>
            <li>Recht op verwijdering: u kunt verzoeken om uw gegevens te verwijderen</li>
            <li>Recht op beperking: u kunt de verwerking van uw gegevens beperken</li>
            <li>Recht op overdraagbaarheid: u kunt uw gegevens in een bruikbaar formaat ontvangen</li>
          </ul>
          <p className="mb-4">
            Om een van deze rechten uit te oefenen, neem contact met ons op via de onderstaande gegevens.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">6. Beveiliging</h2>
          <p className="mb-4">
            We nemen passende technische en organisatorische maatregelen om uw persoonlijke gegevens te beschermen tegen verlies, misbruik en ongeoorloofde toegang.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">7. Wijzigingen in dit beleid</h2>
          <p className="mb-4">
            We kunnen dit privacybeleid van tijd tot tijd bijwerken. We zullen u op de hoogte stellen van belangrijke wijzigingen via e-mail of een opvallende melding op onze website.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">8. Contact</h2>
          <p className="mb-4">
            Als u vragen of zorgen heeft over ons privacybeleid of uw persoonlijke gegevens, neem dan contact met ons op via:
          </p>
          <p className="mb-4">
            E-mail: privacy@bedieningenprofiel.nl<br />
            Post: Bedieningen Profiel, Hoofdstraat 1, 1234 AB Amsterdam
          </p>
        </div>
      </div>
    </Layout>
  );
}