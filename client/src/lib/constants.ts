// Role definitions as array (for mapping)
export const ROLE_ARRAY = [
  { id: "apostle", label: "Apostel", color: "bg-navy" },
  { id: "prophet", label: "Profeet", color: "bg-teal" },
  { id: "evangelist", label: "Evangelist", color: "bg-navy-light" },
  { id: "shepherd", label: "Herder", color: "bg-teal-light" },
  { id: "teacher", label: "Leraar", color: "bg-gray-400" },
];

// Role definitions as object (for lookup)
export const ROLES = {
  APOSTLE: "Apostel",
  PROPHET: "Profeet",
  EVANGELIST: "Evangelist",
  SHEPHERD: "Herder",
  TEACHER: "Leraar"
};

export const ROLE_COLORS = {
  APOSTLE: "#1A2033", // Navy
  PROPHET: "#00DBA7", // Teal
  EVANGELIST: "#2C3654", // Navy Light
  SHEPHERD: "#8EECD8", // Teal Light
  TEACHER: "#9CA3AF", // Gray
  
  // Also keep backwards compatibility with single-letter keys
  a: "#1A2033", // Navy
  p: "#00DBA7", // Teal
  e: "#2C3654", // Navy Light
  h: "#8EECD8", // Teal Light
  l: "#9CA3AF", // Gray
};

// Pricing options
export const PRICING_OPTIONS = [
  {
    title: "Gratis",
    price: "Gratis",
    tier: "free",
    features: [
      "Tot 40 gebruikers",
      "Tot 1 team"
    ],
    isPopular: false,
    buttonText: "Start gratis"
  },
  {
    title: "Pro",
    price: "€10 p/m",
    tier: "pro",
    features: [
      "Tot 200 gebruikers",
      "Tot 20 teams"
    ],
    isPopular: true,
    buttonText: "Kies Pro"
  },
  {
    title: "Pro+",
    price: "€25 p/m",
    tier: "pro_plus",
    features: [
      "Tot 5000 gebruikers",
      "Tot 500 teams"
    ],
    isPopular: false,
    buttonText: "Kies Pro+"
  }
];

// Role descriptions
export const ROLE_DESCRIPTIONS = {
  a: {
    title: "Apostel",
    shortDescription: "Je bent sterk in het bouwen van structuren en het starten van nieuwe initiatieven.",
    longDescription: "Als apostel ben je een pionier en bouwer. Je bent gericht op het creëren van nieuwe structuren en het breken van bestaande patronen. Je hebt een visie voor het grote geheel en werkt strategisch om verandering te realiseren. In een team ben je vaak degene die processen stroomlijnt en baanbrekende ideeën brengt."
  },
  p: {
    title: "Profeet",
    shortDescription: "Je bent sterk in het onderscheiden van waarheid en het aanvoelen wat er in het hart van mensen leeft.",
    longDescription: "Als profeet ben je gericht op het onderscheiden van waarheid en het zien van Gods hart in verschillende situaties. Je hebt een gevoeligheid voor wat er werkelijk speelt, zowel bij individuen als in grotere groepen. Je kunt goed aanvoelen wat anderen nodig hebben en helpt mensen om dichterbij God te komen. In een team ben je vaak degene die waarschuwt voor mogelijke problemen en die ervoor zorgt dat plannen in lijn zijn met Gods bedoeling."
  },
  e: {
    title: "Evangelist",
    shortDescription: "Je bent sterk in het enthousiast delen van het goede nieuws en het betrekken van nieuwe mensen.",
    longDescription: "Als evangelist heb je een natuurlijk vermogen om het goede nieuws te delen. Je bent enthousiast, overtuigend en gericht op resultaten. Je hebt een passie voor mensen die nog niet tot geloof zijn gekomen en weet hen op een toegankelijke manier te benaderen. In een team breng je energie en focus op groei. Je motiveert anderen om buiten hun comfortzone te treden en hun geloof te delen."
  },
  h: {
    title: "Herder",
    shortDescription: "Je hebt een sterk vermogen om voor mensen te zorgen en hen te begeleiden in hun geestelijke groei.",
    longDescription: "Als herder heb je een natuurlijk vermogen om voor mensen te zorgen. Je bent empathisch, geduldig en een goede luisteraar. Je hebt oog voor mensen die buiten de boot vallen en zorgt ervoor dat iedereen zich gezien en gehoord voelt. In een team ben je vaak degene die zorgt voor goede relaties en een veilige sfeer. Je helpt teamleden om samen te werken en biedt emotionele ondersteuning tijdens uitdagende periodes."
  },
  l: {
    title: "Leraar",
    shortDescription: "Je bent sterk in het duidelijk uitleggen van de waarheid en het helpen van anderen om te groeien in kennis.",
    longDescription: "Als leraar heb je de gave om complexe waarheid duidelijk en gestructureerd uit te leggen. Je bent analytisch, grondig en gericht op begrip. Je helpt mensen om diepere inzichten te krijgen in Gods Woord en dit toe te passen in hun leven. In een team zorg je ervoor dat beslissingen gebaseerd zijn op een gezond begrip van de Bijbel en theologische principes. Je stelt vragen die tot nadenken stemmen en brengt duidelijkheid in discussies."
  }
};
