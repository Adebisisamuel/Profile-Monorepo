// Five-Fold Ministry categories
export const ROLES = {
  APOSTLE: "apostle",
  PROPHET: "prophet",
  EVANGELIST: "evangelist",
  HERDER: "herder",
  TEACHER: "teacher",
} as const;

export const ROLE_LABELS = {
  [ROLES.APOSTLE]: "Apostel",
  [ROLES.PROPHET]: "Profeet",
  [ROLES.EVANGELIST]: "Evangelist",
  [ROLES.HERDER]: "Herder",
  [ROLES.TEACHER]: "Leraar",
} as const;

export const ROLE_COLORS = {
  [ROLES.APOSTLE]: "#4097db", // Blue
  [ROLES.PROPHET]: "#a8e3c9", // Mint green
  [ROLES.EVANGELIST]: "#ffbdcb", // Light pink
  [ROLES.HERDER]: "#ffd9a8", // Light orange
  [ROLES.TEACHER]: "#b79cef", // Purple
} as const;

export const ROLE_DESCRIPTIONS = {
  [ROLES.APOSTLE]: {
    title: "Apostel",
    description: "Je bent een pionier en visionair. Je ziet het grote plaatje en bent gericht op het bouwen en uitbreiden van Gods Koninkrijk. Je legt graag nieuwe fundamenten en houdt van uitdaging en verandering."
  },
  [ROLES.PROPHET]: {
    title: "Profeet",
    description: "Je hebt een sterk vermogen om Gods stem te horen en zijn waarheid te spreken. Je bent vaak gericht op het zien van wat verkeerd gaat en hoe het verbeterd kan worden."
  },
  [ROLES.EVANGELIST]: {
    title: "Evangelist",
    description: "Je hebt een passie om het goede nieuws te delen met anderen. Je bent enthousiast over het bereiken van mensen met de boodschap van redding en genade."
  },
  [ROLES.HERDER]: {
    title: "Herder",
    description: "Je hebt een groot hart voor mensen en zorgt graag voor anderen. Je bent gericht op relaties, emotionele gezondheid en het creëren van een veilige omgeving."
  },
  [ROLES.TEACHER]: {
    title: "Leraar",
    description: "Je hebt een natuurlijke aanleg voor het begrijpen en uitleggen van complexe concepten. Je geniet ervan om waarheid te ontdekken en te delen met anderen."
  },
} as const;

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE: "free",
  PRO: "pro",
  PROPLUS: "proplus",
} as const;

export const PLAN_LIMITS = {
  [SUBSCRIPTION_PLANS.FREE]: {
    users: 40,
    teams: 1,
    price: 0,
  },
  [SUBSCRIPTION_PLANS.PRO]: {
    users: 200,
    teams: 20,
    price: 10,
  },
  [SUBSCRIPTION_PLANS.PROPLUS]: {
    users: 5000,
    teams: 500,
    price: 25,
  },
} as const;

// All 40 questions of the Five-Fold Ministry questionnaire based on the provided document
export const COUNTRIES = [
  "Nederland",
  "België",
  "Duitsland",
  "Frankrijk",
  "Verenigd Koninkrijk",
  "Luxemburg",
  "Spanje",
  "Italië",
  "Verenigde Staten",
  "Canada",
  "Australië",
  "Nieuw-Zeeland",
  "Zuid-Afrika",
  "Anders",
];

export const CITIES_BY_COUNTRY = {
  "Nederland": [
    "Amsterdam", 
    "Rotterdam", 
    "Den Haag", 
    "Utrecht", 
    "Eindhoven", 
    "Groningen", 
    "Tilburg", 
    "Almere", 
    "Breda", 
    "Nijmegen", 
    "Anders"
  ],
  "België": [
    "Brussel", 
    "Antwerpen", 
    "Gent", 
    "Brugge", 
    "Leuven", 
    "Luik", 
    "Charleroi", 
    "Namen", 
    "Hasselt", 
    "Oostende", 
    "Anders"
  ],
  "Anders": ["Anders"]
};

export const QUESTIONS = [
  {
    id: 1,
    statement1: {
      text: "Het Koninkrijk zal groeien als mensen in hun bestemming lopen.",
      role: ROLES.APOSTLE
    },
    statement2: {
      text: "Het Koninkrijk zal groeien als we begrijpen hoe de hemelse dimensie werkt.",
      role: ROLES.PROPHET
    }
  },
  {
    id: 2,
    statement1: {
      text: "Mensen zeggen dat ze mijn creativiteit bewonderen.",
      role: ROLES.PROPHET
    },
    statement2: {
      text: "Het Koninkrijk zal groeien als nieuwe mensen tot bekering komen.",
      role: ROLES.EVANGELIST
    }
  },
  {
    id: 3,
    statement1: {
      text: "Wanneer ik enthousiast ben over iets, weet ik anderen daarin te betrekken.",
      role: ROLES.EVANGELIST
    },
    statement2: {
      text: "Het Koninkrijk zal groeien als iedereen innerlijke genezing heeft gevonden.",
      role: ROLES.HERDER
    }
  },
  {
    id: 4,
    statement1: {
      text: "Ik luister zorgvuldig naar mensen en neem hun woorden goed in me op.",
      role: ROLES.HERDER
    },
    statement2: {
      text: "Het Koninkrijk zal groeien als mensen onderwezen worden uit de bijbel.",
      role: ROLES.TEACHER
    }
  },
  {
    id: 5,
    statement1: {
      text: "Mensen vinden dat ik moeilijke onderwerpen en ideeën goed kan uitleggen.",
      role: ROLES.TEACHER
    },
    statement2: {
      text: "Mensen noemen mij vaak proactief en ondernemend.",
      role: ROLES.APOSTLE
    }
  },
  {
    id: 6,
    statement1: {
      text: "Ik neem graag het voortouw in het uitproberen van nieuwe dingen om anderen te inspireren.",
      role: ROLES.APOSTLE
    },
    statement2: {
      text: "Mensen van diverse achtergronden voelen zich op hun gemak bij mij en omdat ik niet afschrik van hun waarderen of hun cultuur.",
      role: ROLES.EVANGELIST
    }
  },
  {
    id: 7,
    statement1: {
      text: "Ik heb soms intuïtief kennis over dingen die anderen lijken te missen.",
      role: ROLES.PROPHET
    },
    statement2: {
      text: "Ik hecht meer waarde aan het creëren van iets van betekenis dan aan het constant verdedigen van mijn eigen positie.",
      role: ROLES.HERDER
    }
  },
  {
    id: 8,
    statement1: {
      text: "Ik geniet ervan om mijn persoonlijke verhaal met anderen te delen.",
      role: ROLES.EVANGELIST
    },
    statement2: {
      text: "Het delen van kennis met anderen vind ik erg leuk.",
      role: ROLES.TEACHER
    }
  },
  {
    id: 9,
    statement1: {
      text: "Ik vind het fijn om een omgeving te scheppen waarin mensen zich veilig voelen en zich kunnen ontplooien.",
      role: ROLES.HERDER
    },
    statement2: {
      text: "Ik ben altijd beschikbaar om met frisse ideeën te komen.",
      role: ROLES.APOSTLE
    }
  },
  {
    id: 10,
    statement1: {
      text: "Wanneer mensen iets niet snappen, leg ik het graag op verschillende manieren uit.",
      role: ROLES.TEACHER
    },
    statement2: {
      text: "Soms word ik moedeloos door het gebrek aan inzicht of geloof bij anderen.",
      role: ROLES.PROPHET
    }
  },
  {
    id: 11,
    statement1: {
      text: "Ik kan gemakkelijk doelen bepalen, strategieën uitwerken en een visie creëren om projecten te voltooien.",
      role: ROLES.APOSTLE
    },
    statement2: {
      text: "Ik kan me frustreren aan… mensen die hun hart gesloten houden.",
      role: ROLES.HERDER
    }
  },
  {
    id: 12,
    statement1: {
      text: "Ik heb een scherp vermogen om de ware betekenis van dingen te begrijpen.",
      role: ROLES.PROPHET
    },
    statement2: {
      text: "Ik kan me frustreren aan… mensen die snel tevreden zijn met weinig inzicht van de Bijbel.",
      role: ROLES.TEACHER
    }
  },
  {
    id: 13,
    statement1: {
      text: "Ik vertel graag anderen over mijn geloofsovertuigingen.",
      role: ROLES.EVANGELIST
    },
    statement2: {
      text: "Ik kan me frustreren aan… mensen die niet in beweging komen.",
      role: ROLES.APOSTLE
    }
  },
  {
    id: 14,
    statement1: {
      text: "Wanneer ik eerlijk ben tegen mensen, zelfs als dat lastig is, merk ik vaak een positieve verandering in hun denken en handelen.",
      role: ROLES.HERDER
    },
    statement2: {
      text: "Ik kan me frustreren aan… mensen die niet onder indruk zijn van God.",
      role: ROLES.PROPHET
    }
  },
  {
    id: 15,
    statement1: {
      text: "Ik krijg vaak te horen dat ik mensen nuttig heb geholpen bij het leren van waardevolle zaken.",
      role: ROLES.TEACHER
    },
    statement2: {
      text: "Ik kan me frustreren aan… mensen die niet tot bekering komen.",
      role: ROLES.EVANGELIST
    }
  },
  {
    id: 16,
    statement1: {
      text: "Veranderingen vind ik fijn, ook wanneer het anderen uit hun comfortzone haalt.",
      role: ROLES.APOSTLE
    },
    statement2: {
      text: "Mijn ideale werkweek… bestaat uit een mengeling van routine, voorspelbare momenten en een planning.",
      role: ROLES.TEACHER
    }
  },
  {
    id: 17,
    statement1: {
      text: "Ik voel me soms gedwongen de waarheid te spreken, zelfs als dit ongemakkelijk is voor anderen.",
      role: ROLES.PROPHET
    },
    statement2: {
      text: "Mijn ideale werkweek… bevat afwisseling en avontuur. Dat houd scherp.",
      role: ROLES.APOSTLE
    }
  },
  {
    id: 18,
    statement1: {
      text: "Ik probeer actief vriendschappen op te bouwen met mensen die anders zijn dan ik.",
      role: ROLES.EVANGELIST
    },
    statement2: {
      text: "Mijn ideale werkweek… mag ik uitgedaagd worden, maar ik hou ook van tijd om indrukken te verwerken.",
      role: ROLES.PROPHET
    }
  },
  {
    id: 19,
    statement1: {
      text: "Meestal kan ik me gebeurtenissen of namen nog goed herinneren, of weet ik op zijn minst waar ik iemand heb ontmoet.",
      role: ROLES.HERDER
    },
    statement2: {
      text: "Mijn ideale werkweek… sta ik open voor spontane zaken die op me afkomen.",
      role: ROLES.EVANGELIST
    }
  },
  {
    id: 20,
    statement1: {
      text: "Ik werk liever met concrete feiten dan met theorieën.",
      role: ROLES.TEACHER
    },
    statement2: {
      text: "Mijn ideale werkweek moet niet volgepland zijn, zodat ik genoeg tijd voor mensen heb.",
      role: ROLES.HERDER
    }
  },
  {
    id: 21,
    statement1: {
      text: "Ik geniet van uitdagende taken die inspanning en persoonlijke groei vereisen.",
      role: ROLES.APOSTLE
    },
    statement2: {
      text: "Mijn geestelijke ervaringen komen vaak tot uiting in beelden of metaforen.",
      role: ROLES.PROPHET
    }
  },
  {
    id: 22,
    statement1: {
      text: "Ik geniet ervan om te reflecteren en dieper na te denken over geestelijke zaken.",
      role: ROLES.PROPHET
    },
    statement2: {
      text: "Ik voel me comfortabel bij diverse groepen mensen zonder de behoefte om mezelf aan te passen.",
      role: ROLES.EVANGELIST
    }
  },
  {
    id: 23,
    statement1: {
      text: "Ik kan mensen goed overtuigen van waar ik zelf in geloof.",
      role: ROLES.EVANGELIST
    },
    statement2: {
      text: "Als ik zie dat iemand hulp nodig heeft, bied ik snel mijn steun, vaak nog voordat erom gevraagd wordt.",
      role: ROLES.HERDER
    }
  },
  {
    id: 24,
    statement1: {
      text: "Wat anderen doormaken raakt me diep, zelfs als ik het zelf niet heb meegemaakt.",
      role: ROLES.HERDER
    },
    statement2: {
      text: "Ik leer anderen graag hoe ze dingen kunnen doen die ik goed beheers.",
      role: ROLES.TEACHER
    }
  },
  {
    id: 25,
    statement1: {
      text: "Het geeft me voldoening om mijn inzichten met anderen te delen.",
      role: ROLES.TEACHER
    },
    statement2: {
      text: "Ik droom er al lang van om een organisatie vanaf het begin op te zetten en mijn visie erin te verwerken.",
      role: ROLES.APOSTLE
    }
  },
  {
    id: 26,
    statement1: {
      text: "Ik werk graag samen met… mensen die een geestelijk perspectief hebben.",
      role: ROLES.APOSTLE
    },
    statement2: {
      text: "Ik ben bereid risico's te nemen wanneer iets voor mij echt belangrijk is.",
      role: ROLES.EVANGELIST
    }
  },
  {
    id: 27,
    statement1: {
      text: "Ik werk graag samen met… mensen die visie hebben en mensen hierin meenemen.",
      role: ROLES.PROPHET
    },
    statement2: {
      text: "Het geeft me voldoening om een plek te creëren waar mensen zich thuis voelen, deel van de groep uitmaken en weten dat er voor hen gezorgd wordt.",
      role: ROLES.HERDER
    }
  },
  {
    id: 28,
    statement1: {
      text: "Ik werk graag samen met… mensen die nieuwe bekeerlingen opvangen en bij elkaar houden.",
      role: ROLES.EVANGELIST
    },
    statement2: {
      text: "Het afronden van een taak met oog voor detail geeft me veel voldoening.",
      role: ROLES.TEACHER
    }
  },
  {
    id: 29,
    statement1: {
      text: "Ik werk graag samen met… mensen die waarheid onderwijzen.",
      role: ROLES.HERDER
    },
    statement2: {
      text: "Ik help graag teams en leiders om beter te functioneren en denk regelmatig na over hun efficiëntie.",
      role: ROLES.APOSTLE
    }
  },
  {
    id: 30,
    statement1: {
      text: "Ik werk graag samen met… mensen die nieuwe mensen in de kerk brengen.",
      role: ROLES.TEACHER
    },
    statement2: {
      text: "Sommige dromen die ik heb gehad, waren veel betekenisvoller dan gewone dromen.",
      role: ROLES.PROPHET
    }
  },
  {
    id: 31,
    statement1: {
      text: "Mensen vinden vaak dat mijn woorden hen motiveert en ik moedig hen aan om nieuwe paden te bewandelen.",
      role: ROLES.APOSTLE
    },
    statement2: {
      text: "Wanneer ik iemand voor het eerste ontmoet… zie ik de problemen en moeilijkheden waar die persoon mee worstelt.",
      role: ROLES.HERDER
    }
  },
  {
    id: 32,
    statement1: {
      text: "Er zijn momenten waarop ik mijn gedachten deel en mensen vertellen me later dat dit hen heeft geholpen.",
      role: ROLES.PROPHET
    },
    statement2: {
      text: "Wanneer ik iemand voor het eerste ontmoet… wil ik graag helpen met het beantwoorden van geloofsvragen.",
      role: ROLES.TEACHER
    }
  },
  {
    id: 33,
    statement1: {
      text: "Het gebeurt regelmatig dat ik mijn enthousiasme deel met mensen die ik tegenkom.",
      role: ROLES.EVANGELIST
    },
    statement2: {
      text: "Wanneer ik iemand voor het eerste ontmoet… wordt ik getriggert door de potentie die nog is opgesloten.",
      role: ROLES.APOSTLE
    }
  },
  {
    id: 34,
    statement1: {
      text: "Mensen kunnen op me rekenen voor langdurige zorg en steun, ook als anderen die hebben opgegeven.",
      role: ROLES.HERDER
    },
    statement2: {
      text: "Wanneer ik iemand voor het eerste ontmoet… ervaar ik inspiratie wat God wil duidelijk maken voor deze persoon.",
      role: ROLES.PROPHET
    }
  },
  {
    id: 35,
    statement1: {
      text: "Ik haal veel plezier uit het zorgvuldig afmaken van een taak tot in de kleinste details.",
      role: ROLES.TEACHER
    },
    statement2: {
      text: "Wanneer ik iemand voor het eerste ontmoet… ziet ik een strijder die mee gaat helpen de oogst binnen te halen.",
      role: ROLES.EVANGELIST
    }
  },
  {
    id: 36,
    statement1: {
      text: "Ik ben een persoon met visie. Ik hou van de grote lijnen en kan deze goed overbrengen. Daardoor kom ik vaak in een leidinggevende positie terecht.",
      role: ROLES.APOSTLE
    },
    statement2: {
      text: "Mensen vragen mij vaak om hulp wanneer ze iets beter willen begrijpen.",
      role: ROLES.TEACHER
    }
  },
  {
    id: 37,
    statement1: {
      text: "Ik heb vaak een helder gevoel van wat ik moet zeggen wanneer iemand in een bepaalde situatie zit.",
      role: ROLES.PROPHET
    },
    statement2: {
      text: "Het grotere geheel valt mij vaak eerder op dan de specifieke details wanneer ik iets lees.",
      role: ROLES.APOSTLE
    }
  },
  {
    id: 38,
    statement1: {
      text: "In mijn enthousiasme wil ik mijn standpunt soms te graag op anderen overbrengen.",
      role: ROLES.EVANGELIST
    },
    statement2: {
      text: "Ik onthul af en toe dingen die later meer betekenis krijgen dan op het moment zelf duidelijk was.",
      role: ROLES.PROPHET
    }
  },
  {
    id: 39,
    statement1: {
      text: "Ik merk dat mensen regelmatig op me afstappen voor steun, een praatje of om hulp te vragen.",
      role: ROLES.HERDER
    },
    statement2: {
      text: "Wanneer een onderwerp van belang is voor mij, ga ik discussies erover niet uit de weg.",
      role: ROLES.EVANGELIST
    }
  },
  {
    id: 40,
    statement1: {
      text: "Terwijl iemand praat, maak ik notities en luister ik zorgvuldig naar de details.",
      role: ROLES.TEACHER
    },
    statement2: {
      text: "Ik ben bedachtzaam en neem de tijd om na te denken voordat ik spreek.",
      role: ROLES.HERDER
    }
  }
];
