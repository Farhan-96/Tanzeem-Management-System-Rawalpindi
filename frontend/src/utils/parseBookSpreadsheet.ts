export interface BookImportRow {
  excelId?: string;
  title: string;
  author?: string;
  publisher?: string;
  price: number;
  totalQuantity: number;
  isbn?: string;
  category?: string;
  shelfLocation?: string;
  language?: string;
  description?: string;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function pick(row: Record<string, unknown>, aliases: string[]) {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const match = entries.find(([key]) => normalizeHeader(key) === alias);
    if (match && match[1] != null && String(match[1]).trim() !== '') {
      return String(match[1]).trim();
    }
  }
  return '';
}

function parsePrice(value: string) {
  const cleaned = value.replace(/\u00a0/g, ' ').replace(/,/g, '');
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  return match ? Math.round(Number(match[1])) : 0;
}

function parseQty(value: string) {
  const cleaned = value.replace(/,/g, '').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function detectLanguage(title: string) {
  return /[\u0600-\u06FF]/.test(title) ? 'Urdu' : 'English';
}

function detectCategory(title: string, language: string) {
  const blob = title.toLowerCase();
  if (
    title.includes('یو ایس بی') ||
    title.includes('جھنڈا') ||
    title.includes('نوٹ بک') ||
    blob.includes('usb') ||
    blob.includes('calendar')
  ) {
    return 'Merchandise';
  }
  if (language === 'English') return 'English Books';
  return 'Tanzeem Publications';
}

export function mapSpreadsheetRows(rawRows: Record<string, unknown>[]): BookImportRow[] {
  const seenCodes = new Set<string>();
  const mapped: BookImportRow[] = [];

  rawRows.forEach((row, index) => {
    const title = pick(row, ['item name', 'book title', 'title', 'name', 'book']);
    if (!title) return;

    const excelId = pick(row, ['id', 'item id', 'sr', 'sr no', 's.no']).replace(/\.0$/, '');
    const price = parsePrice(pick(row, ['retail price', 'unit price', 'price', 'rate']));
    const totalQuantity = parseQty(pick(row, ['quantity', 'qty', 'stock', 'copies']));
    let isbn = pick(row, ['code', 'isbn', 'sku', 'item code', 'barcode', 'tracking code']);
    if (!isbn) isbn = excelId ? `X-${excelId}` : `IMP-${index + 1}`;
    const isbnKey = isbn.toUpperCase();
    if (seenCodes.has(isbnKey)) {
      isbn = `${isbn}-${excelId || index + 1}`;
    }
    seenCodes.add(isbnKey);

    const language = detectLanguage(title);
    mapped.push({
      excelId: excelId || undefined,
      title,
      price,
      totalQuantity,
      isbn,
      language,
      category: detectCategory(title, language),
      author: 'Not specified',
      publisher: 'Tanzeem-e-Islami',
      shelfLocation: 'Main Store',
      description: excelId ? `Imported from spreadsheet (Id ${excelId})` : 'Imported from spreadsheet',
    });
  });

  return mapped;
}

function parseCsv(text: string): Record<string, unknown>[] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  const pushCell = () => {
    row.push(current);
    current = '';
  };
  const pushRow = () => {
    if (row.some((cell) => cell.trim() !== '')) rows.push(row);
    row = [];
  };

  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      pushCell();
    } else if (ch === '\n') {
      pushCell();
      pushRow();
    } else if (ch !== '\r') {
      current += ch;
    }
  }
  pushCell();
  pushRow();

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      obj[header || `col${i}`] = cells[i] || '';
    });
    return obj;
  });
}

export async function parseBookSpreadsheetFile(file: File): Promise<BookImportRow[]> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    return mapSpreadsheetRows(parseCsv(await file.text()));
  }

  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });
  return mapSpreadsheetRows(rawRows);
}
