import Layout from "@/components/Layout";

export default function TermsAndConditionsPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary">Algemene Voorwaarden</h1>
        
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
          <p className="mb-4">
            Ingangsdatum: 2 April 2025
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">1. Inleiding</h2>
          <p className="mb-4">
            Welkom bij Bedieningen Profiel. Deze Algemene Voorwaarden zijn van toepassing op uw gebruik van onze website en diensten. Door het gebruik van onze diensten gaat u akkoord met deze voorwaarden. Lees ze zorgvuldig door.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">2. Definities</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>"Bedieningen Profiel", "wij", "ons" of "onze" verwijst naar de eigenaren en beheerders van de Bedieningen Profiel dienst.</li>
            <li>"Dienst" verwijst naar de Bedieningen Profiel website, tools en gerelateerde diensten.</li>
            <li>"Gebruiker", "u" of "uw" verwijst naar individuen die toegang hebben tot of gebruik maken van onze Dienst.</li>
            <li>"Account" verwijst naar de registratie en toegang die u nodig heeft om specifieke functies van onze Dienst te gebruiken.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">3. Accountregistratie</h2>
          <p className="mb-4">
            Om volledige toegang te krijgen tot onze Dienst, moet u een account aanmaken. U bent verantwoordelijk voor het geheimhouden van uw accountgegevens en voor alle activiteiten die plaatsvinden onder uw account. U moet ons onmiddellijk op de hoogte stellen van ongeautoriseerd gebruik van uw account.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">4. Abonnementen en Betalingen</h2>
          <p className="mb-4">
            Bedieningen Profiel biedt verschillende abonnementsplannen aan:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Gratis Plan: Tot 40 gebruikers en 1 team, zonder kosten.</li>
            <li>Pro Plan: €10/maand voor tot 200 gebruikers en 20 teams.</li>
            <li>Pro+ Plan: €25/maand voor tot 5000 gebruikers en 500 teams.</li>
          </ul>
          <p className="mb-4">
            Betalingen voor betaalde abonnementen worden maandelijks in rekening gebracht en worden automatisch verlengd tenzij u uw abonnement opzegt.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">5. Gebruiksvoorwaarden</h2>
          <p className="mb-4">
            U stemt ermee in onze Dienst niet te gebruiken voor:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Activiteiten die illegaal zijn of in strijd zijn met lokale, nationale of internationale wetgeving.</li>
            <li>Het verzenden van ongevraagde reclame of spam.</li>
            <li>Het verzamelen of oogsten van gegevens zonder toestemming.</li>
            <li>Het uploaden van schadelijke inhoud of malware.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">6. Intellectueel Eigendom</h2>
          <p className="mb-4">
            De dienst en alle inhoud, functies en functionaliteit zijn eigendom van Bedieningen Profiel en zijn beschermd door internationale auteursrechten, handelsmerken en andere intellectuele eigendomsrechten. U mag onze content niet kopiëren, wijzigen, distribueren of verkopen zonder onze uitdrukkelijke schriftelijke toestemming.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">7. Beperking van Aansprakelijkheid</h2>
          <p className="mb-4">
            Bedieningen Profiel en zijn beheerders, directeuren, werknemers en vertegenwoordigers zijn niet aansprakelijk voor indirecte, incidentele, speciale, gevolgschade of strafbare schade, inclusief maar niet beperkt tot, verlies van inkomsten, winst, data of gebruik, voor of als gevolg van uw gebruik van de Dienst.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">8. Wijzigingen in de Dienst en Voorwaarden</h2>
          <p className="mb-4">
            We behouden ons het recht voor om onze Dienst en deze Algemene Voorwaarden op elk moment te wijzigen of bij te werken. We zullen u op de hoogte stellen van belangrijke wijzigingen via e-mail of een opvallende melding op onze website.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">9. Toepasselijk Recht</h2>
          <p className="mb-4">
            Deze Algemene Voorwaarden worden beheerst door en geïnterpreteerd in overeenstemming met de Nederlandse wetgeving, zonder rekening te houden met conflicterende wettelijke bepalingen.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-6">10. Contact</h2>
          <p className="mb-4">
            Als u vragen heeft over deze Algemene Voorwaarden, neem dan contact met ons op via:
          </p>
          <p className="mb-4">
            E-mail: info@bedieningenprofiel.nl<br />
            Post: Bedieningen Profiel, Hoofdstraat 1, 1234 AB Amsterdam
          </p>
        </div>
      </div>
    </Layout>
  );
}