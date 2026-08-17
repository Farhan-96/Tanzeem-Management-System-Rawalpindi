export type CatalogBook = {
  id: string;
  title: string;
  isbn?: string;
  price?: number;
};

export type ParsedInvoiceItem = {
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  quantity: number;
  unitCost: number;
  confidence: 'high' | 'medium';
};

export type ParsedInvoice = {
  textPreview: string;
  arrivalDate?: string;
  paymentStatus?: 'Paid' | 'Unpaid' | 'Partial';
  invoiceNo?: string;
  items: ParsedInvoiceItem[];
  note?: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toIsoDate(raw: string) {
  const iso = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const slash = raw.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (!slash) return undefined;
  const day = slash[1].padStart(2, '0');
  const month = slash[2].padStart(2, '0');
  let year = slash[3];
  if (year.length === 2) year = `20${year}`;
  const asMonthFirst = Number(slash[1]) > 12;
  if (asMonthFirst) return `${year}-${month}-${day}`;
  if (Number(slash[1]) <= 12 && Number(slash[2]) > 12) {
    return `${year}-${day}-${month}`;
  }
  return `${year}-${month}-${day}`;
}

function nearbyNumber(source: string, index: number, kind: 'qty' | 'money') {
  const windowText = source.slice(Math.max(0, index), Math.min(source.length, index + 140));
  if (kind === 'money') {
    const money = windowText.match(/rs\.?\s*([\d,]+(?:\.\d+)?)/i) || windowText.match(/([\d,]+(?:\.\d+)?)\s*(?:rs|rupees)/i);
    if (money) return Math.round(Number(money[1].replace(/,/g, '')));
  }
  const nums = [...windowText.matchAll(/\b(\d{1,5})\b/g)].map((m) => Number(m[1]));
  if (kind === 'qty') {
    const qty = nums.find((n) => n >= 1 && n <= 5000 && n !== 2024 && n !== 2025 && n !== 2026);
    return qty || 1;
  }
  const price = nums.find((n) => n >= 10);
  return price || 0;
}

export function parseInvoiceText(text: string, books: CatalogBook[]): ParsedInvoice {
  const compact = text.replace(/\u00a0/g, ' ');
  const normalized = normalize(compact);

  const dateMatch =
    compact.match(/\b(\d{4}-\d{2}-\d{2})\b/) ||
    compact.match(/\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/);
  const invoiceMatch =
    compact.match(/invoice\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i) ||
    compact.match(/\b(INV[-/]?\d[\w\-]*)\b/i);

  let paymentStatus: 'Paid' | 'Unpaid' | 'Partial' | undefined;
  if (/\bunpaid\b|\bpending\b|\bdue\b|باقی|غیر ادا/i.test(compact)) {
    paymentStatus = 'Unpaid';
  } else if (/\bpartial\b|جزوی/i.test(compact)) {
    paymentStatus = 'Partial';
  } else if (/\bpaid\b|ادا شدہ|payment received|amount received/i.test(compact)) {
    paymentStatus = 'Paid';
  }

  const ranked = [...books].sort((a, b) => (b.title?.length || 0) - (a.title?.length || 0));
  const used = new Set<string>();
  const items: ParsedInvoiceItem[] = [];

  for (const book of ranked) {
    const title = (book.title || '').trim();
    if (title.length < 4) continue;
    const nt = normalize(title);
    if (nt.length < 4) continue;

    const isbn = (book.isbn || '').trim();
    let hitIndex = -1;
    let confidence: 'high' | 'medium' = 'medium';

    const titleIndex = normalized.indexOf(nt);
    if (titleIndex >= 0) {
      hitIndex = compact.toLowerCase().indexOf(title.toLowerCase());
      if (hitIndex < 0) hitIndex = titleIndex;
      confidence = 'high';
    } else if (isbn && isbn.length >= 3 && compact.toLowerCase().includes(isbn.toLowerCase())) {
      hitIndex = compact.toLowerCase().indexOf(isbn.toLowerCase());
      confidence = 'medium';
    }

    if (hitIndex < 0 || used.has(book.id)) continue;
    used.add(book.id);

    const quantity = nearbyNumber(compact, Math.max(0, hitIndex), 'qty') || 1;
    const extractedCost = nearbyNumber(compact, Math.max(0, hitIndex), 'money');
    const unitCost = extractedCost > 0 ? extractedCost : Number(book.price) || 0;

    items.push({
      bookId: book.id,
      bookTitle: title,
      bookIsbn: isbn,
      quantity,
      unitCost,
      confidence,
    });
  }

  return {
    textPreview: compact.replace(/\s+/g, ' ').trim().slice(0, 500),
    arrivalDate: dateMatch ? toIsoDate(dateMatch[1] || dateMatch[0]) : undefined,
    paymentStatus,
    invoiceNo: invoiceMatch?.[1],
    items,
    note:
      items.length === 0
        ? 'Invoice stored. No catalog titles were auto-matched — fill the form, or check that book names in the PDF match the catalog.'
        : `Matched ${items.length} catalog title${items.length === 1 ? '' : 's'} from the invoice.`,
  };
}
