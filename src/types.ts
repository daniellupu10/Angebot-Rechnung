export type DocType = 'rechnung' | 'angebot';

export type ClientType = 'privat' | 'firma';

export type PaymentStatus = 'offen' | 'bezahlt' | 'ueberfaellig';

export interface CompanyData {
  name: string;
  owner: string;
  street: string;
  zipCity: string;
  phone: string;
  email: string;
  website: string;
  taxNumber: string;
  bankName: string;
  iban: string;
  bic: string;
}

export interface Client {
  name: string;
  contactPerson?: string;
  street: string;
  zipCity: string;
  email?: string;
  phone?: string;
  vatId?: string;
}

export interface InvoiceItem {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

export interface InvoiceDoc {
  id: string;
  docType: DocType;
  docNumber: string;
  docDate: string; // "DD.MM.YYYY" or ISO
  dateIso: string; // "YYYY-MM-DD"
  dueDateIso: string; // "YYYY-MM-DD" (strictly 7 days default)
  paymentTermsDays: number; // 7 days
  servicePeriod: string; // "März 2026"
  clientType: ClientType; // 'privat' | 'firma'
  jobAddress?: string; // Ausführungsort / Adresse wo die Arbeiten stattfanden
  client: Client;
  items: InvoiceItem[];
  taxRate: number; // typically 19
  notesText: string;
  privateClientRetentionNotice: boolean; // § 14 Abs. 4 Nr. 9 UStG 2-Jahre Aufbewahrung
  netTotal: number;
  taxAmount: number;
  grossTotal: number;
  status: 'entwurf' | 'offen' | 'ausgestellt' | 'bezahlt' | 'angenommen';
  paymentStatus?: PaymentStatus;
  convertedFromQuoteId?: string;
  convertedToInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogService {
  id: string;
  name: string;
  category: string;
  defaultHourly: number;
  priceRange?: [number, number];
  defaultUnit: string;
  icon: string;
  descriptionTemplate: string;
  tags?: string[];
  recommendedAddons?: string[];
}

export interface AddonService {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  icon: string;
  badgeText: string;
}
