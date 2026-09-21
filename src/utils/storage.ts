import { CompanyData, InvoiceDoc, InvoiceItem, DocType, ClientType } from '../types';
import { DEFAULT_COMPANY_DATA } from '../data/companyData';
import { INITIAL_SEED_DOCUMENTS } from '../data/seedData';

const STORAGE_KEY_DOCS = 'palnau_invoices_v2';
const STORAGE_KEY_COMPANY = 'palnau_company_data_v2';

export const LEGAL_RETENTION_TEXT = "Der Gesetzgeber verpflichtet, wenn der Auftraggeber eine Privatperson ist, diesen laut § 14 Abs. 4 Nr. 9 i. V. m. § 14b Abs. 1 UStG darauf hinzuweisen, Rechnungen mindestens 2 Jahre aufzubewahren.";

export function getCompanyData(): CompanyData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPANY);
    if (raw) {
      return { ...DEFAULT_COMPANY_DATA, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Error reading company data from storage", e);
  }
  return DEFAULT_COMPANY_DATA;
}

export function saveCompanyData(data: CompanyData): void {
  localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(data));
}

export function getAllDocuments(): InvoiceDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading documents from storage", e);
  }
  // Initialize with seed documents
  saveAllDocuments(INITIAL_SEED_DOCUMENTS);
  return INITIAL_SEED_DOCUMENTS;
}

export function saveAllDocuments(docs: InvoiceDoc[]): void {
  localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(docs));
}

export function saveSingleDocument(doc: InvoiceDoc): void {
  const docs = getAllDocuments();
  const index = docs.findIndex(d => d.id === doc.id);
  if (index >= 0) {
    docs[index] = { ...doc, updatedAt: new Date().toISOString() };
  } else {
    docs.unshift({ ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveAllDocuments(docs);
}

export function deleteDocument(id: string): void {
  const docs = getAllDocuments().filter(d => d.id !== id);
  saveAllDocuments(docs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDateGerman(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('.')) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function addDaysIso(isoDate: string, days: number): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  } catch {
    return isoDate;
  }
}

export function calculateTotals(items: InvoiceItem[], taxRate: number = 19) {
  const netTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const taxAmount = Number(((netTotal * taxRate) / 100).toFixed(2));
  const grossTotal = Number((netTotal + taxAmount).toFixed(2));
  return {
    netTotal: Number(netTotal.toFixed(2)),
    taxAmount,
    grossTotal
  };
}

export function generateNextDocNumber(type: DocType, existingDocs: InvoiceDoc[]): string {
  const year = new Date().getFullYear();
  const prefix = type === 'rechnung' ? `RE-${year}-` : `ANG-${year}-`;
  const matching = existingDocs.filter(d => d.docNumber && d.docNumber.startsWith(prefix));
  
  let maxNum = type === 'rechnung' ? 1049 : 320;
  matching.forEach(d => {
    const numPart = parseInt(d.docNumber.replace(prefix, ''), 10);
    if (!isNaN(numPart) && numPart > maxNum) {
      maxNum = numPart;
    }
  });
  
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

export function createNewDocument(type: DocType = 'rechnung', existingDocs: InvoiceDoc[] = []): InvoiceDoc {
  const today = new Date();
  const dateIso = today.toISOString().split('T')[0];
  const dueDateIso = addDaysIso(dateIso, 7); // Exactly 7 days as requested!
  const docDate = today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const docNumber = generateNextDocNumber(type, existingDocs);
  const monthName = today.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  const initialItems: InvoiceItem[] = [
    {
      id: "item-" + Date.now() + "-1",
      title: "Arbeitsleistung - Gartenpflege & Heckenschnitt",
      description: "Fachgerechter Rück- und Formschnitt inkl. Rüstzeit und Schnittgutsammlung",
      quantity: 6,
      unit: "Std",
      price: 60.00,
      total: 360.00
    },
    {
      id: "item-" + Date.now() + "-2",
      title: "Grünabfallentsorgung & Abtransport",
      description: "Fachgerechte Verladung, Transport und Entsorgung des Schnittgutes zur Kompostieranlage",
      quantity: 1,
      unit: "Psch",
      price: 70.00,
      total: 70.00
    },
    {
      id: "item-" + Date.now() + "-3",
      title: "Anfahrt & Rüstzeit",
      description: "Pauschale für An- und Abfahrt sowie Fahrzeug- und Geräterüstung",
      quantity: 1,
      unit: "Psch",
      price: 45.00,
      total: 45.00
    }
  ];

  const totals = calculateTotals(initialItems, 19);

  return {
    id: `${type.toUpperCase()}-${Date.now()}`,
    docType: type,
    docNumber,
    docDate,
    dateIso,
    dueDateIso,
    paymentTermsDays: 7, // Default 7 days
    servicePeriod: monthName,
    clientType: 'privat' as ClientType,
    jobAddress: '',
    client: {
      name: "Max Mustermann",
      street: "Hauptstraße 15",
      zipCity: "75210 Keltern",
      email: "",
      phone: ""
    },
    items: initialItems,
    taxRate: 19,
    notesText: "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 7 Tagen auf das unten angegebene Bankkonto.",
    privateClientRetentionNotice: true,
    netTotal: totals.netTotal,
    taxAmount: totals.taxAmount,
    grossTotal: totals.grossTotal,
    status: 'entwurf',
    paymentStatus: 'offen',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
