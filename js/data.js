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

// ==========================================================================
// ARCHIVIERTE ANGEBOTE (STAMMDATEN-SEED FÜR ANGEBOTS-ÜBERSICHT)
// ==========================================================================
const SEED_QUOTES_ARCHIVE = [
    {
        id: "ANG-2026-0318",
        docType: "angebot",
        docNumber: "ANG-2026-0318",
        docDate: "06.03.2026",
        dateIso: "2026-03-06",
        year: 2026,
        quarter: "Q1",
        monthKey: "2026-03",
        monthLabel: "März 2026",
        servicePeriod: "Ausführung: April / Mai 2026",
        taxRate: 19,
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
        notesText: "Dieses Angebot ist freibleibend und 30 Tage ab Ausstellungsdatum gültig. Bei Zusage bitten wir um kurze Bestätigung.",
        netTotal: 2900.00,
        taxAmount: 551.00,
        grossTotal: 3451.00,
        totalNet: 2900.00,
        totalTax: 551.00,
        totalGross: 3451.00,
        status: "offen"
    },
    {
        id: "ANG-2026-0315",
        docType: "angebot",
        docNumber: "ANG-2026-0315",
        docDate: "03.03.2026",
        dateIso: "2026-03-03",
        year: 2026,
        quarter: "Q1",
        monthKey: "2026-03",
        monthLabel: "März 2026",
        servicePeriod: "Ausführung: Kalenderwoche 16/17 2026",
        taxRate: 19,
        client: {
            name: "Familie Markus Weber",
            street: "Sonnenhang 14",
            zipCity: "75179 Pforzheim"
        },
        items: [
            {
                title: "Doppelstabmattenzaun 8/6/8 verzinkt & anthrazit",
                description: "Lieferung und fachgerechte Montage von ca. 24 lfdm Zaunanlage H=140cm inkl. Pfosten einbetonieren",
                quantity: 24,
                unit: "m",
                price: 110.00,
                total: 2640.00
            },
            {
                title: "Gartentor 1-flügelig 100x140cm",
                description: "Inkl. Profilzylinderschloss, Drückergarnitur und Torpfosten",
                quantity: 1,
                unit: "Stk",
                price: 480.00,
                total: 480.00
            },
            {
                title: "Tiefborde / Betonkanten setzen",
                description: "Aushub, Betonfundament und Setzen von Randsteinen 100x25x8cm",
                quantity: 14,
                unit: "m",
                price: 45.00,
                total: 630.00
            },
            {
                title: "Baustelleneinrichtung & Entsorgung Bodenaushub",
                description: "Gerätebereitstellung, Anfahrt und fachgerechte Erddeponie",
                quantity: 1,
                unit: "Psch",
                price: 250.00,
                total: 250.00
            }
        ],
        notesText: "Angebot gültig für 4 Wochen. Zahlungskonditionen: 30% bei Auftragsbeginn, 70% nach Fertigstellung.",
        netTotal: 4000.00,
        taxAmount: 760.00,
        grossTotal: 4760.00,
        totalNet: 4000.00,
        totalTax: 760.00,
        totalGross: 4760.00,
        status: "offen"
    },
    {
        id: "ANG-2026-0308",
        docType: "angebot",
        docNumber: "ANG-2026-0308",
        docDate: "25.02.2026",
        dateIso: "2026-02-25",
        year: 2026,
        quarter: "Q1",
        monthKey: "2026-02",
        monthLabel: "Februar 2026",
        servicePeriod: "Ausführung: März / April 2026",
        taxRate: 19,
        client: {
            name: "Hausverwaltung Residenz Pforzheim",
            street: "Bleichstraße 42",
            zipCity: "75173 Pforzheim"
        },
        items: [
            {
                title: "Frühjahrs-Heckenschnitt & Rabattenpflege",
                description: "Kompletter Rückschnitt aller Hainbuchen- und Ligusterhecken auf dem Gesamtareal",
                quantity: 16,
                unit: "Std",
                price: 58.00,
                total: 928.00
            },
            {
                title: "Häckseln & Schnittgutentsorgung",
                description: "Häckseln vor Ort und Abfuhr von ca. 8 m³ Grüngut",
                quantity: 1,
                unit: "Psch",
                price: 280.00,
                total: 280.00
            },
            {
                title: "Rindenmulch Feinabsiebung liefern & verteilen",
                description: "Unkrautunterdrückung auf Beeten und Strauchflächen ca. 4 m³",
                quantity: 4,
                unit: "m³",
                price: 65.00,
                total: 260.00
            }
        ],
        notesText: "Pauschalangebot für die Wohnanlage Residenz. Festpreisgarantie bei Zusage innerhalb von 14 Tagen.",
        netTotal: 1468.00,
        taxAmount: 278.92,
        grossTotal: 1746.92,
        totalNet: 1468.00,
        totalTax: 278.92,
        totalGross: 1746.92,
        status: "in_abstimmung"
    },
    {
        id: "ANG-2026-0220",
        docType: "angebot",
        docNumber: "ANG-2026-0220",
        docDate: "12.02.2026",
        dateIso: "2026-02-12",
        year: 2026,
        quarter: "Q1",
        monthKey: "2026-02",
        monthLabel: "Februar 2026",
        servicePeriod: "Ausführung: März 2026",
        taxRate: 19,
        client: {
            name: "Architekturbüro K. Hoffmann",
            street: "Westliche Karl-Friedrich-Str. 88",
            zipCity: "75172 Pforzheim"
        },
        items: [
            {
                title: "Terrassensanierung Natursteinplatten Travertin",
                description: "Alten Belag aufnehmen, Schottertragschicht ausgleichen und verdichten, Travertinplatten 60x40 im Splittbett verlegen (ca. 45 m²)",
                quantity: 45,
                unit: "m²",
                price: 135.00,
                total: 6075.00
            },
            {
                title: "Edelstahl-Entwässerungsrinne einbauen",
                description: "Fassadenrinne mit Maschenrost inkl. Anschluss an Fallrohr",
                quantity: 9,
                unit: "m",
                price: 95.00,
                total: 855.00
            }
        ],
        notesText: "Projekt Stadtvilla Pforzheim. Gültig bis 15.03.2026. Umgewandelt in Rechnung RE-2026-1049.",
        netTotal: 6930.00,
        taxAmount: 1316.70,
        grossTotal: 8246.70,
        totalNet: 6930.00,
        totalTax: 1316.70,
        totalGross: 8246.70,
        status: "angenommen",
        convertedInvoiceNumber: "RE-2026-1049",
        convertedDate: "05.03.2026"
    }
];

// ==========================================================================
// ARCHIVIERTE RECHNUNGEN (STAMMDATEN-SEED FÜR RECHNUNGS-ÜBERSICHT)
// Nur abgeschlossene & ausgestellte Rechnungen (mit Quartals-, Monats- und Jahresbezug)
// ==========================================================================
const SEED_INVOICES_ARCHIVE = [
    {
        id: "RE-2026-1042",
        docType: "rechnung",
        docNumber: "RE-2026-1042",
        docDate: "05.03.2026",
        dateIso: "2026-03-05",
        year: 2026,
        quarter: "Q1",
        monthKey: "2026-03",
        monthLabel: "März 2026",
        servicePeriod: "Februar / März 2026",
        taxRate: 19,
        client: {
            name: "Familie Markus Weber",
            street: "Sonnenhang 14",
            zipCity: "75179 Pforzheim"
        },
        items: [
            {
                title: "Arbeitsleistung - Heckenschnitt & Rüstzeit",
                description: "2 Facharbeiter × 4.0 Std. × 60.00 € (Formschnitt Thujahecke ca. 35m)",
                quantity: 8,
                unit: "Std",
                price: 60.00,
                total: 480.00
            },
            {
                title: "Arbeitsleistung - Strauchschnitt & Beetsäuberung",
                description: "1 Facharbeiter × 3.0 Std. × 55.00 € (Rückschnitt Ziersträucher)",
                quantity: 3,
                unit: "Std",
                price: 55.00,
                total: 165.00
            },
            {
                title: "Maschinenpauschale - Heckenschere & Freischneider",
                description: "Gerätepauschale inkl. Sonderkraftstoff",
                quantity: 1,
                unit: "Psch",
                price: 35.00,
                total: 35.00
            },
            {
                title: "Grünabfallentsorgung & Abtransport",
                description: "Fachgerechte Verladung und Entsorgung des Schnittguts",
                quantity: 1,
                unit: "Psch",
                price: 70.00,
                total: 70.00
            },
            {
                title: "Anfahrt & Rüstzeit",
                description: "Pauschale für An- und Abfahrt Pforzheim",
                quantity: 1,
                unit: "Psch",
                price: 45.00,
                total: 45.00
            }
        ],
        notesText: "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen auf das unten genannte Konto.",
        netTotal: 795.00,
        taxAmount: 151.05,
        grossTotal: 946.05,
        totalNet: 795.00,
        totalTax: 151.05,
        totalGross: 946.05,
        status: "bezahlt"
    },
    {
        id: "RE-2026-1038",
        docType: "rechnung",
        docNumber: "RE-2026-1038",
        docDate: "20.02.2026",
        dateIso: "2026-02-20",
        year: 2026,
        quarter: "Q1",
        monthKey: "2026-02",
        monthLabel: "Februar 2026",
        servicePeriod: "Februar 2026",
        taxRate: 19,
        client: {
            name: "Dr. med. Thomas Schneider",
            street: "Kastanienallee 8",
            zipCity: "75175 Pforzheim"
        },
        items: [
            {
                title: "Baumfällung Fichte (ca. 16m) mit SKT",
                description: "Gefahrfällung mit Seilklettertechnik in Teilstücken",
                quantity: 1,
                unit: "Psch",
                price: 920.00,
                total: 920.00
            },
            {
                title: "Häckselarbeiten & Abfuhr Stammholz",
                description: "Maschinelle Zerkleinerung vor Ort und Abfuhr",
                quantity: 1,
                unit: "Psch",
                price: 240.00,
                total: 240.00
            },
            {
                title: "Wurzelstockfräsen",
                description: "Fräsen bis 30cm Tiefe und Verfüllung mit Mutterboden",
                quantity: 1,
                unit: "Stk",
                price: 160.00,
                total: 160.00
            }
        ],
        notesText: "Zahlbar rein netto innerhalb von 14 Tagen. Vielen Dank für Ihren Auftrag.",
        netTotal: 1320.00,
        taxAmount: 250.80,
        grossTotal: 1570.80,
        totalNet: 1320.00,
        totalTax: 250.80,
        totalGross: 1570.80,
        status: "bezahlt"
    },
    {
        id: "RE-2026-1025",
        docType: "rechnung",
        docNumber: "RE-2026-1025",
        docDate: "28.01.2026",
        dateIso: "2026-01-28",
        year: 2026,
        quarter: "Q1",
        monthKey: "2026-01",
        monthLabel: "Januar 2026",
        servicePeriod: "Januar 2026",
        taxRate: 19,
        client: {
            name: "Hausverwaltung Keltern GbR",
            street: "Hauptstraße 42",
            zipCity: "75210 Keltern"
        },
        items: [
            {
                title: "Winterdienst & Gehwegfreihaltung Objekt Dietlingen",
                description: "Räum- und Streudienst gemäß Ortssatzung im Monat Januar (4 Einsätze)",
                quantity: 4,
                unit: "Einsatz",
                price: 110.00,
                total: 440.00
            },
            {
                title: "Streugut / abstumpfendes Splittmaterial",
                description: "Lieferung und Ausbringung Streusplitt",
                quantity: 2,
                unit: "Sack",
                price: 18.50,
                total: 37.00
            }
        ],
        notesText: "Monatsabrechnung Winterdienst. Zahlbar bis zum 15.02.2026.",
        netTotal: 477.00,
        taxAmount: 90.63,
        grossTotal: 567.63,
        totalNet: 477.00,
        totalTax: 90.63,
        totalGross: 567.63,
        status: "bezahlt"
    },
    {
        id: "RE-2026-1055",
        docType: "rechnung",
        docNumber: "RE-2026-1055",
        docDate: "15.05.2026",
        dateIso: "2026-05-15",
        year: 2026,
        quarter: "Q2",
        monthKey: "2026-05",
        monthLabel: "Mai 2026",
        servicePeriod: "Mai 2026",
        taxRate: 19,
        client: {
            name: "Familie Markus Weber",
            street: "Sonnenhang 14",
            zipCity: "75179 Pforzheim"
        },
        items: [
            {
                title: "Rollrasen Neuanlage & Planum",
                description: "Bodenvorbereitung, Starterdüngung, 65 m² Qualitäts-Rollrasen verlegen",
                quantity: 65,
                unit: "m²",
                price: 26.00,
                total: 1690.00
            },
            {
                title: "Anfahrt & Maschineneinsatz Rasenwalze",
                description: "Transport und Anwalzen",
                quantity: 1,
                unit: "Psch",
                price: 160.00,
                total: 160.00
            }
        ],
        notesText: "Zahlbar rein netto innerhalb von 14 Tagen. Vielen Dank für Ihren Auftrag.",
        netTotal: 1850.00,
        taxAmount: 351.50,
        grossTotal: 2201.50,
        totalNet: 1850.00,
        totalTax: 351.50,
        totalGross: 2201.50,
        status: "bezahlt"
    },
    {
        id: "RE-2026-1049",
        docType: "rechnung",
        docNumber: "RE-2026-1049",
        docDate: "14.04.2026",
        dateIso: "2026-04-14",
        year: 2026,
        quarter: "Q2",
        monthKey: "2026-04",
        monthLabel: "April 2026",
        servicePeriod: "April 2026",
        taxRate: 19,
        client: {
            name: "Gartenfreunde Niefern e.V.",
            street: "Hauptstraße 89",
            zipCity: "75223 Niefern-Öschelbronn"
        },
        items: [
            {
                title: "Frühjahrs-Gehölzschnitt & Beetpflege",
                description: "Auslichtungsschnitt an Obstgehölzen und Rosenrückschnitt",
                quantity: 10,
                unit: "Std",
                price: 60.00,
                total: 600.00
            },
            {
                title: "Häckselarbeiten & Grüngutabfuhr",
                description: "Zerkleinerung vor Ort und fachgerechte Abfuhr",
                quantity: 1,
                unit: "Psch",
                price: 150.00,
                total: 150.00
            }
        ],
        notesText: "Zahlbar innerhalb von 14 Tagen rein netto.",
        netTotal: 750.00,
        taxAmount: 142.50,
        grossTotal: 892.50,
        totalNet: 750.00,
        totalTax: 142.50,
        totalGross: 892.50,
        status: "bezahlt"
    },
    {
        id: "RE-2026-1068",
        docType: "rechnung",
        docNumber: "RE-2026-1068",
        docDate: "12.07.2026",
        dateIso: "2026-07-12",
        year: 2026,
        quarter: "Q3",
        monthKey: "2026-07",
        monthLabel: "Juli 2026",
        servicePeriod: "Juli 2026",
        taxRate: 19,
        client: {
            name: "Weingut & Restaurant Dietlingen",
            street: "Weinbergstraße 12",
            zipCity: "75210 Keltern-Dietlingen"
        },
        items: [
            {
                title: "Terrassenbepflanzung & Pflanzkübel-Pflege",
                description: "Sommerbepflanzung mediterrane Großkübel inkl. Langzeitdünger",
                quantity: 1,
                unit: "Psch",
                price: 850.00,
                total: 850.00
            },
            {
                title: "Tropfbewässerungs-Wartung & Düngung",
                description: "Prüfung Tropfschläuche und Filterreinigung",
                quantity: 1,
                unit: "Psch",
                price: 350.00,
                total: 350.00
            }
        ],
        notesText: "Zahlbar innerhalb von 14 Tagen rein netto.",
        netTotal: 1200.00,
        taxAmount: 228.00,
        grossTotal: 1428.00,
        totalNet: 1200.00,
        totalTax: 228.00,
        totalGross: 1428.00,
        status: "bezahlt"
    },
    {
        id: "RE-2025-0988",
        docType: "rechnung",
        docNumber: "RE-2025-0988",
        docDate: "12.12.2025",
        dateIso: "2025-12-12",
        year: 2025,
        quarter: "Q4",
        monthKey: "2025-12",
        monthLabel: "Dezember 2025",
        servicePeriod: "November / Dezember 2025",
        taxRate: 19,
        client: {
            name: "Sabine & Bernd Hoffmann",
            street: "Birkenweg 5",
            zipCity: "75217 Birkenfeld"
        },
        items: [
            {
                title: "Gartenwinterfestmachung & Staudenrückschnitt",
                description: "Rückschnitt Staudenbeete, Rosen anhäufeln, Laub absaugen",
                quantity: 6,
                unit: "Std",
                price: 58.00,
                total: 348.00
            },
            {
                title: "Frostschutzmaßnahmen Kübelpflanzen",
                description: "Einpacken mit Winterschutzvlies und Einlagern",
                quantity: 1,
                unit: "Psch",
                price: 85.00,
                total: 85.00
            },
            {
                title: "Grünabfallentsorgung",
                description: "Abfuhr Laub und holzige Reste",
                quantity: 1,
                unit: "Psch",
                price: 55.00,
                total: 55.00
            }
        ],
        notesText: "Zahlbar innerhalb von 14 Tagen ohne Abzug.",
        netTotal: 488.00,
        taxAmount: 92.72,
        grossTotal: 580.72,
        totalNet: 488.00,
        totalTax: 92.72,
        totalGross: 580.72,
        status: "bezahlt"
    },
    {
        id: "RE-2025-0941",
        docType: "rechnung",
        docNumber: "RE-2025-0941",
        docDate: "18.11.2025",
        dateIso: "2025-11-18",
        year: 2025,
        quarter: "Q4",
        monthKey: "2025-11",
        monthLabel: "November 2025",
        servicePeriod: "Oktober / November 2025",
        taxRate: 19,
        client: {
            name: "Weingut & Restaurant Dietlingen",
            street: "Weinbergstraße 12",
            zipCity: "75210 Keltern-Dietlingen"
        },
        items: [
            {
                title: "Pflasterarbeiten Gastterrasse Naturstein",
                description: "Aufnahme Altbelag, Schottertragschicht verdichten, Neupflasterung 45m²",
                quantity: 45,
                unit: "m²",
                price: 68.00,
                total: 3060.00
            },
            {
                title: "Granit-Blockstufen setzen",
                description: "Lieferung und Versetzen von 4 Blockstufen in Betonbettung",
                quantity: 4,
                unit: "Stk",
                price: 145.00,
                total: 580.00
            },
            {
                title: "Baustellenentsorgung & Rüttelplatten-Einsatz",
                description: "Aushubentsorgung und Maschinenpauschale",
                quantity: 1,
                unit: "Psch",
                price: 280.00,
                total: 280.00
            }
        ],
        notesText: "Schlussrechnung gemäß Aufmaß und Bauabnahme. Zahlbar innerhalb von 14 Tagen.",
        netTotal: 3920.00,
        taxAmount: 744.80,
        grossTotal: 4664.80,
        totalNet: 3920.00,
        totalTax: 744.80,
        totalGross: 4664.80,
        status: "bezahlt"
    },
    {
        id: "RE-2025-0870",
        docType: "rechnung",
        docNumber: "RE-2025-0870",
        docDate: "15.09.2025",
        dateIso: "2025-09-15",
        year: 2025,
        quarter: "Q3",
        monthKey: "2025-09",
        monthLabel: "September 2025",
        servicePeriod: "September 2025",
        taxRate: 19,
        client: {
            name: "Michael Kusterer",
            street: "Eichenweg 7",
            zipCity: "75334 Straubenhardt"
        },
        items: [
            {
                title: "Rasen-Neuanlage mit Premium-Rollrasen",
                description: "Planum herstellen, Starterdünger einarbeiten, Rollrasen verlegen (80m²)",
                quantity: 80,
                unit: "m²",
                price: 27.50,
                total: 2200.00
            },
            {
                title: "Bodenfräsen & Altgras abtragen",
                description: "Maschinelle Bodenvorbereitung mit Umkehrfräse",
                quantity: 1,
                unit: "Psch",
                price: 320.00,
                total: 320.00
            }
        ],
        notesText: "Betrag fällig innerhalb von 14 Tagen rein netto.",
        netTotal: 2520.00,
        taxAmount: 478.80,
        grossTotal: 2998.80,
        totalNet: 2520.00,
        totalTax: 478.80,
        totalGross: 2998.80,
        status: "bezahlt"
    },
    {
        id: "RE-2025-0760",
        docType: "rechnung",
        docNumber: "RE-2025-0760",
        docDate: "22.05.2025",
        dateIso: "2025-05-22",
        year: 2025,
        quarter: "Q2",
        monthKey: "2025-05",
        monthLabel: "Mai 2025",
        servicePeriod: "Mai 2025",
        taxRate: 19,
        client: {
            name: "Gartenfreunde Niefern e.V.",
            street: "Hauptstraße 89",
            zipCity: "75223 Niefern-Öschelbronn"
        },
        items: [
            {
                title: "Frühjahrsbepflanzung & Gehölzschnitt Vereinsanlage",
                description: "Rückschnitt Hecken und Ziersträucher, Lieferung und Einpflanzen von 120 Stauden",
                quantity: 1,
                unit: "Psch",
                price: 1850.00,
                total: 1850.00
            },
            {
                title: "Rindenmulch Anlieferung & Verteilung",
                description: "12 m³ Qualitätsrindenmulch anliefern und 8cm stark einbringen",
                quantity: 12,
                unit: "m³",
                price: 52.00,
                total: 624.00
            }
        ],
        notesText: "Zahlbar rein netto innerhalb von 14 Tagen. Vielen Dank für das Vertrauen.",
        netTotal: 2474.00,
        taxAmount: 470.06,
        grossTotal: 2944.06,
        totalNet: 2474.00,
        totalTax: 470.06,
        totalGross: 2944.06,
        status: "bezahlt"
    }
];

// ==========================================================================
// DARLEHEN & KREDIT-MITTELVERWENDUNG (INITIALER SEED-SPEICHER)
// BGA: 8.000 € • Betriebsmittel: 27.000 € • Auf-/Übernahme: 37.500 € (Gesamt: 72.500 €)
// ==========================================================================
const DEFAULT_LOAN_DATA = {
    budgets: {
        bga: 8000.00,
        betriebsmittel: 27000.00,
        uebernahme: 37500.00
    },
    entries: [
        {
            id: "loan-ent-1",
            date: "12.01.2026",
            pot: "uebernahme",
            amount: 35000.00,
            purpose: "Geschäftsübernahme Kaufpreis Rate 1 (Kundenstamm, Firmenwert & Betriebsinventar)",
            receiptNo: "VERTRAG-2026-01",
            notes: "Notarieller Übernahmevertrag Palnau Gartenbau"
        },
        {
            id: "loan-ent-2",
            date: "19.01.2026",
            pot: "uebernahme",
            amount: 2500.00,
            purpose: "Notarielle Beurkundung & Handelsregistereintragung Geschäftsübernahme",
            receiptNo: "NOT-2026-881",
            notes: "Notariat Pforzheim"
        },
        {
            id: "loan-ent-3",
            date: "04.02.2026",
            pot: "bga",
            amount: 2850.00,
            purpose: "Stihl Profi-Akku-Geräte (2x Heckenschere HLA 86, 1x Freischneider FSA 135, Schnellladegerät)",
            receiptNo: "RG-STIHL-9921",
            notes: "Motorgeräte-Fachhandel Pforzheim"
        },
        {
            id: "loan-ent-4",
            date: "16.02.2026",
            pot: "bga",
            amount: 1950.00,
            purpose: "Ammann Rüttelplatte APF 15/40 für Wegebau & Pflasterarbeiten",
            receiptNo: "BAU-2026-104",
            notes: "Baumaschinen Wagner"
        },
        {
            id: "loan-ent-5",
            date: "25.02.2026",
            pot: "betriebsmittel",
            amount: 4600.00,
            purpose: "Einkauf Baustoffe & Schüttgüter (Mutterboden, Splitt, Bordsteine, Beton)",
            receiptNo: "BSU-2026-4412",
            notes: "Baustoff-Union Pforzheim"
        },
        {
            id: "loan-ent-6",
            date: "02.03.2026",
            pot: "betriebsmittel",
            amount: 1850.00,
            purpose: "Diesel-Kraftstoff Fuhrpark & Sonderkraftstoff Aspen 2T für Motorgeräte",
            receiptNo: "TANK-2026-03",
            notes: "Betriebsstoffe Betriebshof"
        }
    ]
};

// ==========================================================================
// E-RECHNUNG (XRECHNUNG 3.0 / ZUGFERD 2.2 EN 16931 RECHTSKONFORME XML SYNTAX)
// Standard: UN/CEFACT CII (CrossIndustryInvoice) - Rechtskonform für B2B & B2G in Deutschland
// ==========================================================================

function escapeXml(unsafe) {
    if (unsafe === undefined || unsafe === null) return "";
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function parseGermanDateToYmd(dateStr) {
    if (!dateStr) return new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        return `${y}${m}${d}`;
    }
    return dateStr.replace(/[^0-9]/g, '').slice(0, 8);
}

function mapUnitToUneceCode(unit) {
    const u = (unit || "").toLowerCase().trim();
    if (u === "std" || u === "stunde" || u === "h") return "HUR";
    if (u === "m²" || u === "qm") return "MTK";
    if (u === "m" || u === "lfdm") return "MTR";
    if (u === "m³" || u === "cbm") return "MTQ";
    if (u === "stk" || u === "stück" || u === "einsatz") return "H87";
    if (u === "psch" || u === "pauschal") return "C62";
    if (u === "kg") return "KGM";
    if (u === "t" || u === "tonne") return "TNE";
    return "C62"; // Default Piece / One
}

/**
 * Erzeugt vollständiges, valides XRechnung 3.0 XML (CII / EN 16931)
 * @param {Object} invoice - Das Rechnungsobjekt
 * @returns {string} XML String
 */
function generateXRechnungXML(invoice) {
    const dateYmd = parseGermanDateToYmd(invoice.docDate);
    const issueDateFormatted = invoice.docDate || new Date().toLocaleDateString('de-DE');
    
    // Parse client zip and city
    let clientZip = "75175";
    let clientCity = "Pforzheim";
    if (invoice.client && invoice.client.zipCity) {
        const match = invoice.client.zipCity.match(/^(\d{5})\s+(.*)$/);
        if (match) {
            clientZip = match[1];
            clientCity = match[2];
        } else {
            clientCity = invoice.client.zipCity;
        }
    }

    const netTotal = parseFloat(invoice.netTotal || 0).toFixed(2);
    const taxAmount = parseFloat(invoice.taxAmount || 0).toFixed(2);
    const grossTotal = parseFloat(invoice.grossTotal || 0).toFixed(2);
    const taxRate = parseFloat(invoice.taxRate || 19).toFixed(2);

    // Build Line Items XML
    const itemsXml = (invoice.items || []).map((item, idx) => {
        const lineId = idx + 1;
        const lineQty = parseFloat(item.quantity || 1).toFixed(2);
        const linePrice = parseFloat(item.price || 0).toFixed(2);
        const lineTotal = parseFloat(item.total || (item.quantity * item.price)).toFixed(2);
        const unitCode = mapUnitToUneceCode(item.unit);

        return `
        <ram:IncludedSupplyChainTradeLineItem>
            <ram:AssociatedDocumentLineDocument>
                <ram:LineID>${lineId}</ram:LineID>
            </ram:AssociatedDocumentLineDocument>
            <ram:SpecifiedTradeProduct>
                <ram:Name>${escapeXml(item.title)}</ram:Name>
                <ram:Description>${escapeXml(item.description || item.title)}</ram:Description>
            </ram:SpecifiedTradeProduct>
            <ram:SpecifiedLineTradeAgreement>
                <ram:NetPriceProductTradePrice>
                    <ram:ChargeAmount>${linePrice}</ram:ChargeAmount>
                </ram:NetPriceProductTradePrice>
            </ram:SpecifiedLineTradeAgreement>
            <ram:SpecifiedLineTradeDelivery>
                <ram:BilledQuantity unitCode="${unitCode}">${lineQty}</ram:BilledQuantity>
            </ram:SpecifiedLineTradeDelivery>
            <ram:SpecifiedLineTradeSettlement>
                <ram:ApplicableTradeTax>
                    <ram:TypeCode>VAT</ram:TypeCode>
                    <ram:CategoryCode>S</ram:CategoryCode>
                    <ram:RateApplicablePercent>${taxRate}</ram:RateApplicablePercent>
                </ram:ApplicableTradeTax>
                <ram:SpecifiedTradeSettlementLineMonetarySummation>
                    <ram:LineTotalAmount>${lineTotal}</ram:LineTotalAmount>
                </ram:SpecifiedTradeSettlementLineMonetarySummation>
            </ram:SpecifiedLineTradeSettlement>
        </ram:IncludedSupplyChainTradeLineItem>`;
    }).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice 
    xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:ccts="urn:un:unece:uncefact:documentation:standard:CoreComponentsTechnicalSpecification:2"
    xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
    xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100">
    <rsm:ExchangedDocumentContext>
        <ram:GuidelineSpecifiedDocumentContextParameter>
            <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</ram:ID>
        </ram:GuidelineSpecifiedDocumentContextParameter>
    </rsm:ExchangedDocumentContext>
    <rsm:ExchangedDocument>
        <ram:ID>${escapeXml(invoice.docNumber)}</ram:ID>
        <ram:TypeCode>380</ram:TypeCode>
        <ram:IssueDateTime>
            <udt:DateTimeString format="102">${dateYmd}</udt:DateTimeString>
        </ram:IssueDateTime>
        <ram:IncludedNote>
            <ram:Content>${escapeXml(invoice.notesText || "Zahlbar innerhalb von 14 Tagen.")}</ram:Content>
            <ram:SubjectCode>ADU</ram:SubjectCode>
        </ram:IncludedNote>
    </rsm:ExchangedDocument>
    <rsm:SupplyChainTradeTransaction>
        ${itemsXml}
        <ram:ApplicableHeaderTradeAgreement>
            <ram:BuyerReference>KUNDE-${dateYmd}</ram:BuyerReference>
            <ram:SellerTradeParty>
                <ram:Name>${escapeXml(FIXED_COMPANY_DATA.name)}</ram:Name>
                <ram:SpecifiedLegalOrganization>
                    <ram:TradingBusinessName>${escapeXml(FIXED_COMPANY_DATA.name)}</ram:TradingBusinessName>
                </ram:SpecifiedLegalOrganization>
                <ram:DefinedTradeContact>
                    <ram:PersonName>${escapeXml(FIXED_COMPANY_DATA.owner.replace('Geschäftsführer: ', ''))}</ram:PersonName>
                    <ram:TelephoneUniversalCommunication>
                        <ram:CompleteNumber>${escapeXml(FIXED_COMPANY_DATA.phone.replace('Tel: ', ''))}</ram:CompleteNumber>
                    </ram:TelephoneUniversalCommunication>
                    <ram:EmailURIUniversalCommunication>
                        <ram:URIID>${escapeXml(FIXED_COMPANY_DATA.email)}</ram:URIID>
                    </ram:EmailURIUniversalCommunication>
                </ram:DefinedTradeContact>
                <ram:PostalTradeAddress>
                    <ram:PostcodeCode>75210</ram:PostcodeCode>
                    <ram:LineOne>Reihelberg 3</ram:LineOne>
                    <ram:CityName>Keltern-Dietlingen</ram:CityName>
                    <ram:CountryID>DE</ram:CountryID>
                </ram:PostalTradeAddress>
                <ram:SpecifiedTaxRegistration>
                    <ram:ID schemeID="FC">${escapeXml(FIXED_COMPANY_DATA.taxNumber)}</ram:ID>
                </ram:SpecifiedTaxRegistration>
            </ram:SellerTradeParty>
            <ram:BuyerTradeParty>
                <ram:Name>${escapeXml((invoice.client && invoice.client.name) || "Kunde")}</ram:Name>
                <ram:PostalTradeAddress>
                    <ram:PostcodeCode>${escapeXml(clientZip)}</ram:PostcodeCode>
                    <ram:LineOne>${escapeXml((invoice.client && invoice.client.street) || "")}</ram:LineOne>
                    <ram:CityName>${escapeXml(clientCity)}</ram:CityName>
                    <ram:CountryID>DE</ram:CountryID>
                </ram:PostalTradeAddress>
            </ram:BuyerTradeParty>
        </ram:ApplicableHeaderTradeAgreement>
        <ram:ApplicableHeaderTradeDelivery>
            <ram:ActualDeliverySupplyChainEvent>
                <ram:OccurrenceDateTime>
                    <udt:DateTimeString format="102">${dateYmd}</udt:DateTimeString>
                </ram:OccurrenceDateTime>
            </ram:ActualDeliverySupplyChainEvent>
        </ram:ApplicableHeaderTradeDelivery>
        <ram:ApplicableHeaderTradeSettlement>
            <ram:PaymentReference>${escapeXml(invoice.docNumber)}</ram:PaymentReference>
            <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
            <ram:SpecifiedTradeSettlementPaymentMeans>
                <ram:TypeCode>58</ram:TypeCode>
                <ram:Information>SEPA Überweisung</ram:Information>
                <ram:PayeePartyCreditorFinancialAccount>
                    <ram:IBANID>${escapeXml(FIXED_COMPANY_DATA.iban.replace(/\s+/g, ''))}</ram:IBANID>
                </ram:PayeePartyCreditorFinancialAccount>
                <ram:PayeeSpecifiedCreditorFinancialInstitution>
                    <ram:BICID>${escapeXml(FIXED_COMPANY_DATA.bic)}</ram:BICID>
                    <ram:Name>${escapeXml(FIXED_COMPANY_DATA.bankName)}</ram:Name>
                </ram:PayeeSpecifiedCreditorFinancialInstitution>
            </ram:SpecifiedTradeSettlementPaymentMeans>
            <ram:ApplicableTradeTax>
                <ram:CalculatedAmount>${taxAmount}</ram:CalculatedAmount>
                <ram:TypeCode>VAT</ram:TypeCode>
                <ram:BasisAmount>${netTotal}</ram:BasisAmount>
                <ram:CategoryCode>S</ram:CategoryCode>
                <ram:RateApplicablePercent>${taxRate}</ram:RateApplicablePercent>
            </ram:ApplicableTradeTax>
            <ram:SpecifiedTradePaymentTerms>
                <ram:Description>${escapeXml(invoice.notesText || "Zahlbar innerhalb von 14 Tagen rein netto.")}</ram:Description>
            </ram:SpecifiedTradePaymentTerms>
            <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
                <ram:LineTotalAmount>${netTotal}</ram:LineTotalAmount>
                <ram:TaxBasisTotalAmount>${netTotal}</ram:TaxBasisTotalAmount>
                <ram:TaxTotalAmount currencyID="EUR">${taxAmount}</ram:TaxTotalAmount>
                <ram:GrandTotalAmount>${grossTotal}</ram:GrandTotalAmount>
                <ram:DuePayableAmount>${grossTotal}</ram:DuePayableAmount>
            </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        </ram:ApplicableHeaderTradeSettlement>
    </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

