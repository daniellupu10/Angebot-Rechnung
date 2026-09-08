/**
 * Stammdaten & Konfiguration für Palnau Gartenbau GmbH
 * Feste Unternehmensdaten:
 * - Anschrift: Reihelberg 3, 75210 Keltern-Dietlingen
 * - Tel: 07231 466641
 * - Email: gartenbauu@gmail.com
 * - IBAN: DE66666500850005992834
 */

const FIXED_COMPANY_DATA = Object.freeze({
    name: "Palnau Gartenbau GmbH",
    owner: "Geschäftsführer: Andrei Priala",
    street: "Reihelberg 3",
    zipCity: "75210 Keltern-Dietlingen",
    phone: "Tel: 07231 466641",
    email: "gartenbauu@gmail.com",
    website: "www.palnau-gartenbau.de",
    taxNumber: "41413-45017",
    vatId: "DE987654321",
    bankName: "Sparkasse Pforzheim Calw",
    iban: "DE66 6665 0085 0005 9928 34",
    bic: "PFORDE66XXX"
});

// Gartenbau-Dienstleistungskatalog mit Kategorien, Richtwerten und Vorlagentexten
const SERVICES_CATALOG = [
    {
        id: "heckenschnitt",
        name: "Heckenschnitt",
        category: "Pflege",
        defaultHourly: 65,
        priceRange: [45, 75],
        medianHourly: 60,
        typicalWorkers: 2,
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
        defaultHourly: 60,
        priceRange: [45, 75],
        medianHourly: 60,
        typicalWorkers: 1,
        defaultUnit: "Std",
        icon: "🌿",
        descriptionTemplate: "Auslichtungs- und Verjüngungsschnitt an Sträuchern und Ziergehölzen",
        tags: ["strauch", "gehölz", "zierstrauch", "auslichten", "zierpflanzen"],
        recommendedAddons: ["grunabfall", "anfahrt"]
    },
    {
        id: "baumschnitt",
        name: "Baumschnitt & Kronenpflege",
        category: "Baumpflege",
        defaultHourly: 85,
        priceRange: [60, 100],
        medianHourly: 75,
        typicalWorkers: 2,
        defaultUnit: "Std",
        icon: "🌳",
        descriptionTemplate: "Kronenpflege, Totholzentfernung und Formschnitt nach ZTV-Baumpflege",
        tags: ["baum", "krone", "totholz", "seilklettertechnik", "lichtraumprofil"],
        recommendedAddons: ["grunabfall", "maschinen_haechsler", "anfahrt"]
    },
    {
        id: "baumfaellen",
        name: "Baumfällung",
        category: "Baumpflege",
        defaultHourly: 95,
        priceRange: [70, 150],
        medianHourly: 85,
        typicalWorkers: 2,
        defaultUnit: "Psch",
        icon: "🪓",
        descriptionTemplate: "Fällung mittels Seilklettertechnik / Hebebühne inkl. stückweiser Abseilung und Entastung",
        tags: ["fällung", "baumfällung", "gefahrenfällung", "abseilen"],
        recommendedAddons: ["grunabfall", "wurzelfraesen", "maschinen_haechsler", "anfahrt"]
    },
    {
        id: "baumpflege",
        name: "Baumpflege allgemein",
        category: "Baumpflege",
        defaultHourly: 80,
        priceRange: [60, 110],
        medianHourly: 75,
        typicalWorkers: 2,
        defaultUnit: "Std",
        icon: "🌲",
        descriptionTemplate: "Vitalitäts- und Entlastungsschnitt, Wundbehandlung und Baumgesundheitsprüfung",
        tags: ["pflege", "vitalität", "sicherung", "gutachten"],
        recommendedAddons: ["grunabfall", "anfahrt"]
    },
    {
        id: "rasenschnitt",
        name: "Rasenmähen & Kanten",
        category: "Rasen",
        defaultHourly: 45,
        priceRange: [30, 60],
        medianHourly: 40,
        typicalWorkers: 1,
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
        priceRange: [30, 60],
        medianHourly: 40,
        typicalWorkers: 1,
        defaultUnit: "Std",
        icon: "🌾",
        descriptionTemplate: "Rasenflächen kreuzweise vertikutieren zur Moos- und Rasenfilzentfernung inkl. Nachsaat",
        tags: ["vertikutieren", "moos", "nachsaat", "rasenfilz", "belüften"],
        recommendedAddons: ["rasenduenger", "grunabfall", "anfahrt"]
    },
    {
        id: "neuer_rasen",
        name: "Rollrasen / Rasen-Neuanlage",
        category: "Rasen",
        defaultHourly: 55,
        priceRange: [40, 80],
        medianHourly: 50,
        typicalWorkers: 2,
        defaultUnit: "m²",
        icon: "🪴",
        descriptionTemplate: "Altrasen abschälen, Bodenfräsen, Feinplanum erstellen, Starterdünger einarbeiten und Qualitäts-Rollrasen verlegen",
        tags: ["rollrasen", "neuanlage", "einsaat", "planum", "bodenfräse"],
        recommendedAddons: ["material_rasen", "anfahrt", "grunabfall"]
    },
    {
        id: "unkrautentfernung",
        name: "Unkraut- & Wildkrautbeseitigung",
        category: "Pflege",
        defaultHourly: 50,
        priceRange: [35, 60],
        medianHourly: 45,
        typicalWorkers: 1,
        defaultUnit: "Std",
        icon: "🧹",
        descriptionTemplate: "Mechanische Wildkrautbeseitigung aus Beeten, Pflasterfugen und Rabatten",
        tags: ["unkraut", "jäten", "wildkraut", "fugen", "beete"],
        recommendedAddons: ["rindenmulch", "grunabfall", "anfahrt"]
    },
    {
        id: "laubentfernung",
        name: "Laubentfernung",
        category: "Pflege",
        defaultHourly: 45,
        priceRange: [30, 60],
        medianHourly: 40,
        typicalWorkers: 1,
        defaultUnit: "Std",
        icon: "🍂",
        descriptionTemplate: "Sammeln und Abtransport von Herbstlaub von Rasen, Wegen und Pflanzbeeten",
        tags: ["laub", "herbst", "bläser", "rechen"],
        recommendedAddons: ["grunabfall", "anfahrt"]
    },
    {
        id: "heckenpflanzung",
        name: "Hecken- & Gehölzpflanzung",
        category: "Pflanzung",
        defaultHourly: 55,
        priceRange: [40, 80],
        medianHourly: 50,
        typicalWorkers: 2,
        defaultUnit: "m",
        icon: "🌱",
        descriptionTemplate: "Pflanzgraben ausheben, Pflanzerde/Bodenverbesserung einbringen, Heckenpflanzen setzen und wässern",
        tags: ["pflanzung", "kirschlorbeer", "thuja", "eibe", "hainbuche", "gehölze"],
        recommendedAddons: ["material_pflanzen", "rindenmulch", "anfahrt"]
    },
    {
        id: "gartengestaltung",
        name: "Gartengestaltung & Umbau",
        category: "Bau & Gestaltung",
        defaultHourly: 80,
        priceRange: [60, 110],
        medianHourly: 75,
        typicalWorkers: 2,
        defaultUnit: "Psch",
        icon: "🏡",
        descriptionTemplate: "Komplette Neu- und Umgestaltung von Gartenanlagen nach vereinbartem Konzept",
        tags: ["gestaltung", "umbau", "neuanlage", "pflanzplan", "mauerbau"],
        recommendedAddons: ["gartenplanung", "material_allgemein", "maschinen_bagger", "anfahrt"]
    },
    {
        id: "gartenplanung",
        name: "Gartenplanung & Beratung",
        category: "Bau & Gestaltung",
        defaultHourly: 85,
        priceRange: [60, 120],
        medianHourly: 75,
        typicalWorkers: 1,
        defaultUnit: "Psch",
        icon: "📐",
        descriptionTemplate: "Entwurfsplanung, Vermessung, Pflanzkonzept und Materialauswahl vor Ort",
        tags: ["planung", "skizze", "beratung", "konzept", "entwurf"],
        recommendedAddons: ["gartengestaltung"]
    },
    {
        id: "gartenpflege",
        name: "Garten-Jahrespflege",
        category: "Pflege",
        defaultHourly: 55,
        priceRange: [35, 70],
        medianHourly: 50,
        typicalWorkers: 1,
        defaultUnit: "Std",
        icon: "🧤",
        descriptionTemplate: "Ganzheitliche Pflegearbeiten, Rückschnitt, Beetpflege, Düngung und Säuberung",
        tags: ["pflege", "dauerpflege", "beet", "beetpflege", "unterhalt"],
        recommendedAddons: ["grunabfall", "anfahrt"]
    },
    {
        id: "terrassenbau",
        name: "Terrassenbau & Pflasterarbeiten",
        category: "Bau & Gestaltung",
        defaultHourly: 85,
        priceRange: [65, 120],
        medianHourly: 75,
        typicalWorkers: 2,
        defaultUnit: "m²",
        icon: "🧱",
        descriptionTemplate: "Auskofferung, Tragschicht/Schotterunterbau, Randeinfassungen und Verlegung von Belägen",
        tags: ["terrasse", "pflaster", "keramik", "feinsteinzeug", "naturstein", "wpc", "wege"],
        recommendedAddons: ["material_schotter", "maschinen_bagger", "anfahrt"]
    },
    {
        id: "teichbau",
        name: "Teichbau & Bewässerung",
        category: "Bau & Gestaltung",
        defaultHourly: 85,
        priceRange: [70, 120],
        medianHourly: 80,
        typicalWorkers: 2,
        defaultUnit: "Psch",
        icon: "💧",
        descriptionTemplate: "Installation von automatischen Bewässerungsanlagen bzw. Erstellung und Sanierung von Teichanlagen",
        tags: ["teich", "bewässerung", "hunter", "rainbird", "pumpe", "filter"],
        recommendedAddons: ["material_allgemein", "anfahrt"]
    },
    {
        id: "zaunbau",
        name: "Zaunbau & Sichtschutz",
        category: "Bau & Gestaltung",
        defaultHourly: 65,
        priceRange: [40, 80],
        medianHourly: 55,
        typicalWorkers: 2,
        defaultUnit: "m",
        icon: "🪵",
        descriptionTemplate: "Fundamentierung, Pfostensetzung und Montage von Doppelstabmatten- oder Holzzäunen",
        tags: ["zaun", "doppelstabmatte", "sichtschutz", "tor", "zaunbau"],
        recommendedAddons: ["grunabfall", "anfahrt", "material_allgemein"]
    },
    {
        id: "efeuschnitt",
        name: "Efeuschnitt & Fassadenpflege",
        category: "Pflege",
        defaultHourly: 55,
        priceRange: [40, 70],
        medianHourly: 50,
        typicalWorkers: 1,
        defaultUnit: "Std",
        icon: "🌿",
        descriptionTemplate: "Rückschnitt und materialschonende Entfernung von Efeubewuchs an Fassaden und Mauern",
        tags: ["efeu", "fassade", "kletterpflanze", "mauer"],
        recommendedAddons: ["grunabfall", "anfahrt"]
    },
    {
        id: "winterdienst",
        name: "Winterdienst (Räumen & Streuen)",
        category: "Spezial",
        defaultHourly: 60,
        priceRange: [40, 90],
        medianHourly: 55,
        typicalWorkers: 1,
        defaultUnit: "Std",
        icon: "❄️",
        descriptionTemplate: "Schneeräumung und Streudienst von Gehwegen, Zufahrten und Parkplätzen",
        tags: ["schnee", "eis", "räumen", "streuen", "winter"],
        recommendedAddons: ["streumittel", "anfahrt"]
    }
];

// Intelligente Zusatzempfehlungen (Maschinen, Material, Entsorgung, Anfahrt)
const ADDON_SERVICES = {
    "grunabfall": {
        title: "Grünabfallentsorgung & Abtransport",
        description: "Fachgerechte Verladung, Transport und Entsorgung des Schnittgutes zur Kompostieranlage",
        quantity: 1,
        unit: "Psch",
        price: 65.00,
        icon: "🚛",
        badgeText: "💡 Grünschnitt-Entsorgung"
    },
    "maschinen_hecke": {
        title: "Maschinenpauschale - Heckenschere & Freischneider",
        description: "Einsatzpauschale für Profi-Motorgeräte inkl. Sonderkraftstoff und Wartung",
        quantity: 1,
        unit: "Psch",
        price: 35.00,
        icon: "⚙️",
        badgeText: "⚙️ Maschineneinsatz"
    },
    "maschinen_haechsler": {
        title: "Maschineneinsatz - Holz- & Asthäcksler",
        description: "Bereitstellung und Betrieb des mobilen Häckslers zur Holzzerkleinerung",
        quantity: 1,
        unit: "Psch",
        price: 85.00,
        icon: "🌲",
        badgeText: "⚙️ Häcksler-Pauschale"
    },
    "maschinen_bagger": {
        title: "Maschinenkosten - Minibagger & Rüttelplatte",
        description: "Tagespauschale für Erdbewegungs- und Verdichtungsgeräte inkl. Anlieferung",
        quantity: 1,
        unit: "Psch",
        price: 160.00,
        icon: "🚜",
        badgeText: "🚜 Baumaschinen"
    },
    "wurzelfraesen": {
        title: "Wurzelfräsen / Wurzelstockentfernung",
        description: "Ausfräsen des Wurzelstocks bis ca. 25 cm Tiefe inkl. Bodenausgleich",
        quantity: 1,
        unit: "Stk",
        price: 130.00,
        icon: "🌳",
        badgeText: "🌳 Wurzelstock"
    },
    "anfahrt": {
        title: "Anfahrt & Rüstzeit",
        description: "Pauschale für An- und Abfahrt des Arbeitsteams sowie Rüstung von Fahrzeugen und Geräten",
        quantity: 1,
        unit: "Psch",
        price: 45.00,
        icon: "🚗",
        badgeText: "🚗 Anfahrt & Rüstzeit"
    },
    "rindenmulch": {
        title: "Material - Qualitäts-Rindenmulch / Pinienrinde",
        description: "Lieferung und fachgerechtes Ausbringen zur Bodenabdeckung und Unkrauthemmung",
        quantity: 1,
        unit: "m³",
        price: 65.00,
        icon: "🌱",
        badgeText: "🌱 Rindenmulch"
    },
    "rasenduenger": {
        title: "Material - Rasendünger & Premium-Nachsaat",
        description: "Spezial-Langzeitdünger und RSM-zertifiziertes Rasensaatgut",
        quantity: 1,
        unit: "Psch",
        price: 45.00,
        icon: "🌾",
        badgeText: "🌾 Rasen-Zusatz"
    },
    "material_rasen": {
        title: "Material - Premium Rollrasen",
        description: "Lieferung von frischem, unkrautfreiem Gebrauchs- und Spielrollrasen",
        quantity: 1,
        unit: "m²",
        price: 9.50,
        icon: "🌱",
        badgeText: "🌱 Rollrasen"
    },
    "material_pflanzen": {
        title: "Material - Pflanzware & Qualitäts-Pflanzerde",
        description: "Lieferung gesunder Baumschulware und nährstoffreicher Pflanzerde",
        quantity: 1,
        unit: "Psch",
        price: 250.00,
        icon: "🌿",
        badgeText: "🌿 Pflanzmaterial"
    },
    "material_schotter": {
        title: "Material - Schotter, Bettungssplitt & Sand",
        description: "Lieferung von mineralischem Unterbaumaterial und Fugensand",
        quantity: 1,
        unit: "t",
        price: 55.00,
        icon: "🧱",
        badgeText: "🧱 Baustoffe"
    },
    "material_allgemein": {
        title: "Materialkosten nach Aufwand",
        description: "Verbrauchsmaterialien, Befestigungen und Montagezubehör",
        quantity: 1,
        unit: "Psch",
        price: 75.00,
        icon: "📦",
        badgeText: "📦 Material"
    },
    "streumittel": {
        title: "Streumittel (Granulat / Tausalz)",
        description: "Verbrauchtes Streugut nach behördlichen Vorgaben",
        quantity: 1,
        unit: "Psch",
        price: 30.00,
        icon: "❄️",
        badgeText: "❄️ Winter-Material"
    }
};

// Beispielvorlagen
const SAMPLE_INVOICE_DATA = {
    docType: "rechnung",
    docNumber: "RE-2026-1042",
    docDate: new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }),
    servicePeriod: "März 2026",
    client: {
        name: "Familie Weber",
        street: "Sonnenhang 14",
        zipCity: "75179 Pforzheim"
    },
    items: [
        {
            title: "Arbeitsleistung - Heckenschnitt",
            description: "2 Facharbeiter × 4.0 Std. × 60.00 € (Formschnitt Thujahecke ca. 35m)",
            quantity: 8,
            unit: "Std",
            price: 60.00,
            total: 480.00
        },
        {
            title: "Arbeitsleistung - Strauchschnitt & Beetsäuberung",
            description: "1 Facharbeiter × 3.0 Std. × 55.00 € (Rückschnitt Ziersträucher und Wildkrautbeseitigung)",
            quantity: 3,
            unit: "Std",
            price: 55.00,
            total: 165.00
        },
        {
            title: "Maschinenpauschale - Heckenschere & Freischneider",
            description: "Gerätepauschale inkl. Sonderkraftstoff und Wartung",
            quantity: 1,
            unit: "Psch",
            price: 35.00,
            total: 35.00
        },
        {
            title: "Grünabfallentsorgung & Abtransport",
            description: "Fachgerechte Verladung, Transport und Entsorgung des Grünschnitts",
            quantity: 1,
            unit: "Psch",
            price: 70.00,
            total: 70.00
        },
        {
            title: "Anfahrt & Rüstzeit",
            description: "Pauschale für An- und Abfahrt des Teams",
            quantity: 1,
            unit: "Psch",
            price: 45.00,
            total: 45.00
        }
    ],
    taxRate: 19,
    notesText: "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen auf das unten genannte Konto."
};

const SAMPLE_QUOTE_DATA = {
    docType: "angebot",
    docNumber: "ANG-2026-0318",
    docDate: new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }),
    servicePeriod: "Ausführung: April / Mai 2026",
    client: {
        name: "Dr. Thomas Schneider",
        street: "Kastanienallee 8",
        zipCity: "75175 Pforzheim"
    },
    items: [
        {
            title: "Baumfällung einer Tanne (ca. 14m Höhe)",
            description: "Fällung mittels Seilklettertechnik in Teilstücken aufgrund enger Bebauung",
            quantity: 1,
            unit: "Psch",
            price: 850.00,
            total: 850.00
        },
        {
            title: "Wurzelfräsen / Wurzelstockentfernung",
            description: "Ausfräsen des Wurzelstocks bis 25cm Tiefe inkl. Bodenausgleich",
            quantity: 1,
            unit: "Stk",
            price: 150.00,
            total: 150.00
        },
        {
            title: "Maschineneinsatz - Holz- & Asthäcksler",
            description: "Zerkleinerung des Astwerks vor Ort und Abtransport des Stammholzes",
            quantity: 1,
            unit: "Psch",
            price: 220.00,
            total: 220.00
        },
        {
            title: "Rollrasen / Rasen-Neuanlage",
            description: "Boden vorbereiten, Planum herstellen, Qualitäts-Rollrasen liefern und verlegen (ca. 60 m²)",
            quantity: 60,
            unit: "m²",
            price: 28.00,
            total: 1680.00
        }
    ],
    taxRate: 19,
    notesText: "Wir freuen uns über Ihr Interesse. Dieses Angebot ist 30 Tage ab Ausstellungsdatum gültig. Bei Auftragserteilung bitten wir um kurze schriftliche Bestätigung."
};
