/**
 * Upserts the 2026 Excel book list into MongoDB without wiping users or other data.
 * Run from backend/: npx tsx scripts/importBookList.ts
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const URI = process.env.MONGODB_URI || '';
const DB_NAME = 'tanzeem';

type BookDoc = {
  id: string;
  title: string;
  author: string;
  publisher: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  isbn: string;
  category: string;
  shelfLocation: string;
  language: string;
  addedDate: string;
  description?: string;
};

function normalizeIsbn(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function importBooks() {
  if (!URI) {
    console.error('MONGODB_URI is not set. Add it to backend/.env');
    process.exitCode = 1;
    return;
  }

  const dataPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../frontend/src/data/bookList2026.json'
  );
  const incoming = JSON.parse(readFileSync(dataPath, 'utf8')) as BookDoc[];

  const client = new MongoClient(URI);

  try {
    await client.connect();
    const col = client.db(DB_NAME).collection<BookDoc>('books');
    const existing = await col.find({}).toArray();
    const byId = new Map<string, BookDoc>(existing.map((book) => [book.id, book]));
    const byIsbn = new Map<string, BookDoc>(
      existing
        .filter((book) => book.isbn)
        .map((book) => [normalizeIsbn(book.isbn), book])
    );

    let created = 0;
    let updated = 0;

    for (const row of incoming) {
      const matched = byId.get(row.id) || byIsbn.get(normalizeIsbn(row.isbn));

      if (matched) {
        const issued = Math.max(0, (matched.totalQuantity || 0) - (matched.availableQuantity || 0));
        const totalQuantity = Math.max(row.totalQuantity, issued);
        const next: BookDoc = {
          ...matched,
          title: row.title,
          author: row.author || matched.author,
          publisher: row.publisher || matched.publisher,
          price: row.price,
          isbn: row.isbn || matched.isbn,
          category: row.category || matched.category,
          shelfLocation: row.shelfLocation || matched.shelfLocation,
          language: row.language || matched.language,
          description: row.description || matched.description,
          totalQuantity,
          availableQuantity: totalQuantity - issued,
        };
        await col.updateOne({ id: matched.id }, { $set: next }, { upsert: true });
        byId.set(matched.id, next);
        byIsbn.set(normalizeIsbn(next.isbn), next);
        updated += 1;
      } else {
        await col.updateOne({ id: row.id }, { $set: row }, { upsert: true });
        byId.set(row.id, row);
        byIsbn.set(normalizeIsbn(row.isbn), row);
        created += 1;
      }
    }

    console.log(`Imported book list 2026: ${created} created, ${updated} updated, ${incoming.length} total rows.`);
  } catch (err) {
    console.error('Import failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

importBooks();
