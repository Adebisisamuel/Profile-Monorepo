# Bedieningen Profiel

Een online enquêtetool voor het profileren van persoonstypes binnen community's, werkgroepen en teams.

## Over de applicatie

Bedieningen Profiel is een webapplicatie waarmee teamleiders inzicht krijgen in de samenstelling van persoonlijkheidstypes binnen hun teams of gemeenschappen. Gebruikers vullen een vragenlijst in om hun persoonlijkheidsprofiel te bepalen (Apostel, Profeet, Evangelist, Herder, of Leraar), waarbij de resultaten naar zowel de respondent als het dashboard van de teamleider worden gestuurd.

![Bedieningen Profiel Screenshot](attached_assets/Secundaire-logo_zwart-en-groen.png)

## Kenmerken

- **Vragenlijst** - Gebruikers beantwoorden vragen om hun persoonlijkheidsprofiel te bepalen
- **Persoonlijke aanbevelingen** - Gebruikers ontvangen gepersonaliseerde aanbevelingen op basis van hun profiel
- **Team dashboards** - Teamleiders kunnen meerdere teams aanmaken en beheren
- **Analytische visualisaties** - Grafische weergaven van teamsamenstelling en vergelijkingen
- **Exportfunctionaliteit** - Mogelijkheid om testresultaten te exporteren als CSV
- **Team Lacunes Analyse** - Identificatie van ontbrekende persoonlijkheidstypes binnen teams

## Snelle start

### Vereisten

- Node.js 18+ 
- PostgreSQL database
- Git

### Installatie

1. Clone de repository:
```bash
git clone [repository-url]
cd bedieningen-profiel
```

2. Installeer dependencies:
```bash
npm install
```

3. Configureer je omgevingsvariabelen door het `.env` bestand aan te passen met je database-instellingen.

4. Set up de database:
```bash
npm run db:push
```

5. Start de applicatie:
```bash
npm run dev
```

6. Open je browser en ga naar `http://localhost:5000`

## Deployment

Voor gedetailleerde instructies over het deployen van de applicatie buiten Replit, zie het [DEPLOYMENT.md](DEPLOYMENT.md) bestand.

### Docker Deployment

Je kunt de applicatie ook deployen met Docker:

```bash
docker-compose up -d
```

## Scripts

- `npm run dev` - Start de ontwikkelingsserver
- `npm run build` - Bouwt de applicatie voor productie
- `npm run start` - Start de gebouwde applicatie
- `npm run db:push` - Past het databaseschema aan op basis van de modellen

De repository bevat ook enkele hulpscripts voor deployment en database-beheer:
- `deploy.sh` - Voorbereiding voor deployment
- `export-database.sh` - Exporteert de huidige database
- `import-database.sh` - Importeert een database backup

## Database configuratie

De huidige database configuratie is opgeslagen in het `current-db-config.txt` bestand. Gebruik deze informatie om je eigen `.env` bestand in te stellen bij deployment.

## Beveiliging

- Houd je `.env` bestand en database-inloggegevens veilig
- Gebruik HTTPS voor productie-deployments
- Configureer regelmatige database-backups

## Licentie

Copyright © 2025 Bedieningen Profiel