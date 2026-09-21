import { InvoiceDoc } from '../types';

export const INITIAL_SEED_DOCUMENTS: InvoiceDoc[] = [
  {
    id: "RE-2026-1042",
    docType: "rechnung",
    docNumber: "RE-2026-1042",
    docDate: "05.03.2026",
    dateIso: "2026-03-05",
    dueDateIso: "2026-03-12",
    paymentTermsDays: 7,
    servicePeriod: "Februar / März 2026",
    clientType: "privat",
    client: {
      name: "Familie Markus Weber",
      street: "Sonnenhang 14",
      zipCity: "75179 Pforzheim",
      phone: "07231 123456",
      email: "weber.pforzheim@gmx.de"
    },
    items: [
      {
        id: "item-1",
        title: "Arbeitsleistung - Heckenschnitt & Rüstzeit",
        description: "2 Facharbeiter × 4.0 Std. × 60.00 € (Formschnitt Thujahecke ca. 35m)",
        quantity: 8,
        unit: "Std",
        price: 60.00,
        total: 480.00
      },
      {
        id: "item-2",
        title: "Arbeitsleistung - Strauchschnitt & Beetsäuberung",
        description: "1 Facharbeiter × 3.0 Std. × 55.00 € (Rückschnitt Ziersträucher)",
        quantity: 3,
        unit: "Std",
        price: 55.00,
        total: 165.00
      },
      {
        id: "item-3",
        title: "Maschinenpauschale - Heckenschere & Freischneider",
        description: "Gerätepauschale inkl. Sonderkraftstoff und Wartung",
        quantity: 1,
        unit: "Psch",
        price: 35.00,
        total: 35.00
      },
      {
        id: "item-4",
        title: "Grünabfallentsorgung & Abtransport",
        description: "Fachgerechte Verladung und Entsorgung des Schnittguts zur Kompostierung",
        quantity: 1,
        unit: "Psch",
        price: 70.00,
        total: 70.00
      },
      {
        id: "item-5",
        title: "Anfahrt & Rüstzeit",
        description: "Pauschale für An- und Abfahrt des Teams Pforzheim",
        quantity: 1,
        unit: "Psch",
        price: 45.00,
        total: 45.00
      }
    ],
    taxRate: 19,
    notesText: "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 7 Tagen ohne Abzug auf unser angegebenes Bankkonto.",
    privateClientRetentionNotice: true,
    netTotal: 795.00,
    taxAmount: 151.05,
    grossTotal: 946.05,
    status: "ausgestellt",
    paymentStatus: "offen",
    createdAt: "2026-03-05T09:00:00.000Z",
    updatedAt: "2026-03-05T09:00:00.000Z"
  },
  {
    id: "RE-2026-1049",
    docType: "rechnung",
    docNumber: "RE-2026-1049",
    docDate: "14.04.2026",
    dateIso: "2026-04-14",
    dueDateIso: "2026-04-21",
    paymentTermsDays: 7,
    servicePeriod: "April 2026",
    clientType: "firma",
    jobAddress: "Vereinsgelände Niefern, Im Enztal 12, 75223 Niefern",
    client: {
      name: "Gartenfreunde Niefern e.V.",
      contactPerson: "Herr K. Walter",
      street: "Hauptstraße 89",
      zipCity: "75223 Niefern-Öschelbronn",
      email: "info@gartenfreunde-niefern.de"
    },
    items: [
      {
        id: "item-21",
        title: "Frühjahrs-Gehölzschnitt & Beetpflege",
        description: "Auslichtungsschnitt an Obstgehölzen und Rosenrückschnitt auf der Vereinsanlage",
        quantity: 10,
        unit: "Std",
        price: 60.00,
        total: 600.00
      },
      {
        id: "item-22",
        title: "Häckselarbeiten & Grüngutabfuhr",
        description: "Zerkleinerung vor Ort und fachgerechte Abfuhr",
        quantity: 1,
        unit: "Psch",
        price: 150.00,
        total: 150.00
      }
    ],
    taxRate: 19,
    notesText: "Zahlbar innerhalb von 7 Tagen rein netto auf das unten genannte Konto.",
    privateClientRetentionNotice: false,
    netTotal: 750.00,
    taxAmount: 142.50,
    grossTotal: 892.50,
    status: "bezahlt",
    paymentStatus: "bezahlt",
    createdAt: "2026-04-14T10:30:00.000Z",
    updatedAt: "2026-04-14T10:30:00.000Z"
  },
  {
    id: "ANG-2026-0318",
    docType: "angebot",
    docNumber: "ANG-2026-0318",
    docDate: "06.03.2026",
    dateIso: "2026-03-06",
    dueDateIso: "2026-03-13",
    paymentTermsDays: 7,
    servicePeriod: "Ausführung: April / Mai 2026",
    clientType: "privat",
    client: {
      name: "Dr. Thomas Schneider",
      street: "Kastanienallee 8",
      zipCity: "75175 Pforzheim",
      email: "dr.schneider@t-online.de"
    },
    items: [
      {
        id: "item-31",
        title: "Baumfällung einer Tanne (ca. 14m Höhe)",
        description: "Fällung mittels Seilklettertechnik in Teilstücken aufgrund enger Bebauung",
        quantity: 1,
        unit: "Psch",
        price: 850.00,
        total: 850.00
      },
      {
        id: "item-32",
        title: "Wurzelfräsen / Wurzelstockentfernung",
        description: "Ausfräsen des Wurzelstocks bis 25cm Tiefe inkl. Bodenausgleich",
        quantity: 1,
        unit: "Stk",
        price: 150.00,
        total: 150.00
      },
      {
        id: "item-33",
        title: "Maschineneinsatz - Holz- & Asthäcksler",
        description: "Zerkleinerung des Astwerks vor Ort und Abtransport des Stammholzes",
        quantity: 1,
        unit: "Psch",
        price: 220.00,
        total: 220.00
      },
      {
        id: "item-34",
        title: "Rollrasen / Rasen-Neuanlage",
        description: "Boden vorbereiten, Planum herstellen, Qualitäts-Rollrasen liefern und verlegen (ca. 60 m²)",
        quantity: 60,
        unit: "m²",
        price: 28.00,
        total: 1680.00
      }
    ],
    taxRate: 19,
    notesText: "Dieses Angebot ist freibleibend und 30 Tage ab Ausstellungsdatum gültig. Bei Zusage erfolgt die Rechnungsausstellung mit 7 Tagen Zahlungsziel.",
    privateClientRetentionNotice: true,
    netTotal: 2900.00,
    taxAmount: 551.00,
    grossTotal: 3451.00,
    status: "offen",
    createdAt: "2026-03-06T14:15:00.000Z",
    updatedAt: "2026-03-06T14:15:00.000Z"
  }
];
