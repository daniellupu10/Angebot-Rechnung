import { CatalogService, AddonService } from '../types';

export const SERVICES_CATALOG: CatalogService[] = [
  {
    id: "heckenschnitt",
    name: "Heckenschnitt & Formschnitt",
    category: "Pflege",
    defaultHourly: 60,
    priceRange: [45, 75],
    defaultUnit: "Std",
    icon: "✂️",
    descriptionTemplate: "Fachgerechter Rück- und Formschnitt der Heckenanlage inkl. Rüstzeit und Schnittgutsammlung",
    tags: ["hecke", "schnitt", "rückschnitt", "formschnitt", "thuja", "kirschlorbeer"],
    recommendedAddons: ["grunabfall", "maschinen_hecke", "anfahrt"]
  },
  {
    id: "strauchschnitt",
    name: "Strauchschnitt & Auslichtung",
    category: "Pflege",
    defaultHourly: 55,
    priceRange: [45, 75],
    defaultUnit: "Std",
    icon: "🌿",
    descriptionTemplate: "Auslichtungs- und Verjüngungsschnitt an Sträuchern, Rosen und Ziergehölzen",
    tags: ["strauch", "gehölz", "zierstrauch", "auslichten", "zierpflanzen"],
    recommendedAddons: ["grunabfall", "anfahrt"]
  },
  {
    id: "baumschnitt",
    name: "Baumschnitt & Kronenpflege",
    category: "Baumpflege",
    defaultHourly: 85,
    priceRange: [60, 100],
    defaultUnit: "Std",
    icon: "🌳",
    descriptionTemplate: "Kronenpflege, Totholzentfernung und Formschnitt nach ZTV-Baumpflege",
    tags: ["baum", "krone", "totholz", "seilklettertechnik", "lichtraumprofil"],
    recommendedAddons: ["grunabfall", "maschinen_haechsler", "anfahrt"]
  },
  {
    id: "baumfaellen",
    name: "Baumfällung (Spezialfällung / SKT)",
    category: "Baumpflege",
    defaultHourly: 850,
    priceRange: [400, 1500],
    defaultUnit: "Psch",
    icon: "🪓",
    descriptionTemplate: "Fällung mittels Seilklettertechnik / Hebebühne inkl. stückweiser Abseilung und Entastung",
    tags: ["fällung", "baumfällung", "gefahrenfällung", "abseilen"],
    recommendedAddons: ["grunabfall", "wurzelfraesen", "maschinen_haechsler", "anfahrt"]
  },
  {
    id: "wurzelfraesen",
    name: "Wurzelstockfräsen",
    category: "Baumpflege",
    defaultHourly: 150,
    priceRange: [100, 250],
    defaultUnit: "Stk",
    icon: "🪵",
    descriptionTemplate: "Ausfräsen des Wurzelstocks bis ca. 25-30 cm Tiefe inkl. Bodenausgleich",
    tags: ["wurzel", "fräsen", "baumstumpf"],
    recommendedAddons: ["grunabfall", "anfahrt"]
  },
  {
    id: "neuer_rasen",
    name: "Rollrasen / Rasen-Neuanlage",
    category: "Rasen",
    defaultHourly: 28,
    priceRange: [22, 35],
    defaultUnit: "m²",
    icon: "🪴",
    descriptionTemplate: "Altrasen abschälen, Bodenfräsen, Feinplanum erstellen, Starterdünger einarbeiten und Qualitäts-Rollrasen verlegen",
    tags: ["rollrasen", "neuanlage", "einsaat", "planum", "bodenfräse"],
    recommendedAddons: ["material_rasen", "anfahrt", "grunabfall"]
  },
  {
    id: "rasenschnitt",
    name: "Rasenmähen & Rasenpflege",
    category: "Rasen",
    defaultHourly: 45,
    priceRange: [30, 60],
    defaultUnit: "Std",
    icon: "🌱",
    descriptionTemplate: "Regelmäßiger Rasenschnitt inkl. Kanten trimmen und Säuberung der angrenzenden Flächen",
    tags: ["rasen", "mähen", "rasenmähen", "gras", "kanten"],
    recommendedAddons: ["grunabfall", "anfahrt"]
  },
  {
    id: "vertikutieren",
    name: "Vertikutieren & Nachsaat",
    category: "Rasen",
    defaultHourly: 50,
    priceRange: [35, 65],
    defaultUnit: "Std",
    icon: "🌾",
    descriptionTemplate: "Rasenflächen kreuzweise vertikutieren zur Moos- und Rasenfilzentfernung inkl. Qualitäts-Nachsaat",
    tags: ["vertikutieren", "moos", "nachsaat", "rasenfilz", "belüften"],
    recommendedAddons: ["rasenduenger", "grunabfall", "anfahrt"]
  },
  {
    id: "terrassenbau",
    name: "Terrassenbau & Pflasterarbeiten",
    category: "Bau & Gestaltung",
    defaultHourly: 85,
    priceRange: [65, 135],
    defaultUnit: "m²",
    icon: "🧱",
    descriptionTemplate: "Auskofferung, Schottertragschicht verdichten, Randeinfassungen setzen und Naturstein- oder Keramikplatten im Splittbett verlegen",
    tags: ["terrasse", "pflaster", "keramik", "feinsteinzeug", "naturstein", "wpc", "wege"],
    recommendedAddons: ["material_schotter", "maschinen_bagger", "anfahrt"]
  },
  {
    id: "zaunbau",
    name: "Zaunbau & Sichtschutz",
    category: "Bau & Gestaltung",
    defaultHourly: 110,
    priceRange: [80, 160],
    defaultUnit: "m",
    icon: "🪵",
    descriptionTemplate: "Fundamentierung, Pfostensetzung und Montage von Doppelstabmatten- oder Holzzäunen",
    tags: ["zaun", "doppelstabmatte", "sichtschutz", "tor", "zaunbau"],
    recommendedAddons: ["grunabfall", "anfahrt", "material_allgemein"]
  },
  {
    id: "unkrautentfernung",
    name: "Unkraut- & Beetpflege",
    category: "Pflege",
    defaultHourly: 50,
    priceRange: [35, 60],
    defaultUnit: "Std",
    icon: "🧹",
    descriptionTemplate: "Mechanische Wildkrautbeseitigung aus Beeten, Pflasterfugen und Rabatten inkl. Auflockerung",
    tags: ["unkraut", "jäten", "wildkraut", "fugen", "beete"],
    recommendedAddons: ["rindenmulch", "grunabfall", "anfahrt"]
  },
  {
    id: "gartenpflege",
    name: "Garten-Jahrespflege / Dauerpflege",
    category: "Pflege",
    defaultHourly: 55,
    priceRange: [40, 70],
    defaultUnit: "Std",
    icon: "🧤",
    descriptionTemplate: "Ganzheitliche Pflegearbeiten, jahreszeitlicher Rückschnitt, Beetpflege, Düngung und Säuberung",
    tags: ["pflege", "dauerpflege", "beet", "beetpflege", "unterhalt"],
    recommendedAddons: ["grunabfall", "anfahrt"]
  },
  {
    id: "winterdienst",
    name: "Winterdienst (Räumen & Streuen)",
    category: "Spezial",
    defaultHourly: 60,
    priceRange: [40, 90],
    defaultUnit: "Std",
    icon: "❄️",
    descriptionTemplate: "Schneeräumung und Streudienst von Gehwegen, Zufahrten und Parkplätzen gem. Gemeindesatzung",
    tags: ["schnee", "eis", "räumen", "streuen", "winter"],
    recommendedAddons: ["streumittel", "anfahrt"]
  }
];

export const ADDON_SERVICES: Record<string, AddonService> = {
  grunabfall: {
    id: "grunabfall",
    title: "Grünabfallentsorgung & Abtransport",
    description: "Fachgerechte Verladung, Transport und Entsorgung des Schnittgutes zur offiziellen Kompostieranlage",
    quantity: 1,
    unit: "Psch",
    price: 70.00,
    icon: "🚛",
    badgeText: "Grünschnitt-Entsorgung"
  },
  maschinen_hecke: {
    id: "maschinen_hecke",
    title: "Maschinenpauschale - Heckenschere & Freischneider",
    description: "Einsatzpauschale für Profi-Motorgeräte inkl. Sonderkraftstoff und Wartung",
    quantity: 1,
    unit: "Psch",
    price: 35.00,
    icon: "⚙️",
    badgeText: "Maschineneinsatz"
  },
  maschinen_haechsler: {
    id: "maschinen_haechsler",
    title: "Maschineneinsatz - Holz- & Asthäcksler",
    description: "Bereitstellung und Betrieb des mobilen Häckslers zur Holzzerkleinerung vor Ort",
    quantity: 1,
    unit: "Psch",
    price: 85.00,
    icon: "🌲",
    badgeText: "Häcksler-Pauschale"
  },
  maschinen_bagger: {
    id: "maschinen_bagger",
    title: "Maschinenkosten - Minibagger & Rüttelplatte",
    description: "Tagespauschale für Erdbewegungs- und Verdichtungsgeräte inkl. Anlieferung",
    quantity: 1,
    unit: "Psch",
    price: 160.00,
    icon: "🚜",
    badgeText: "Baumaschinen"
  },
  anfahrt: {
    id: "anfahrt",
    title: "Anfahrt & Rüstzeit",
    description: "Pauschale für An- und Abfahrt des Arbeitsteams sowie Rüstung von Fahrzeugen und Geräten",
    quantity: 1,
    unit: "Psch",
    price: 45.00,
    icon: "🚗",
    badgeText: "Anfahrt & Rüstzeit"
  },
  rindenmulch: {
    id: "rindenmulch",
    title: "Material - Qualitäts-Rindenmulch / Pinienrinde",
    description: "Lieferung und fachgerechtes Ausbringen zur Bodenabdeckung und Unkrauthemmung",
    quantity: 1,
    unit: "m³",
    price: 65.00,
    icon: "🌱",
    badgeText: "Rindenmulch"
  },
  rasenduenger: {
    id: "rasenduenger",
    title: "Material - Rasendünger & Premium-Nachsaat",
    description: "Spezial-Langzeitdünger und RSM-zertifiziertes Rasensaatgut",
    quantity: 1,
    unit: "Psch",
    price: 45.00,
    icon: "🌾",
    badgeText: "Rasen-Zusatz"
  },
  material_rasen: {
    id: "material_rasen",
    title: "Material - Premium Rollrasen",
    description: "Lieferung von frischem, unkrautfreiem Gebrauchs- und Spielrollrasen",
    quantity: 50,
    unit: "m²",
    price: 9.50,
    icon: "🌱",
    badgeText: "Rollrasen"
  },
  material_schotter: {
    id: "material_schotter",
    title: "Material - Schotter, Bettungssplitt & Sand",
    description: "Lieferung von mineralischem Unterbaumaterial und Fugensand",
    quantity: 1,
    unit: "t",
    price: 55.00,
    icon: "🧱",
    badgeText: "Baustoffe"
  },
  material_allgemein: {
    id: "material_allgemein",
    title: "Materialkosten nach Aufwand",
    description: "Verbrauchsmaterialien, Befestigungen und Montagezubehör",
    quantity: 1,
    unit: "Psch",
    price: 75.00,
    icon: "📦",
    badgeText: "Material"
  }
};
