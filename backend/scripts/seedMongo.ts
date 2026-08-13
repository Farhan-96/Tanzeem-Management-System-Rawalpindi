/**
 * Seeds the `tanzeem` MongoDB database with all initial app records.
 * Run: npm run seed (from backend/)
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import {
  INITIAL_USERS,
  INITIAL_BOOKS,
  INITIAL_BORROW_RECORDS,
  INITIAL_SALE_RECORDS,
  INITIAL_OFFICE_ASSETS,
  INITIAL_LOGS,
} from '../../frontend/src/data/mockData';

const URI = process.env.MONGODB_URI || '';

const DB_NAME = 'tanzeem';

async function seed() {
  if (!URI) {
    console.error('MONGODB_URI is not set. Add it to backend/.env');
    process.exitCode = 1;
    return;
  }

  const client = new MongoClient(URI);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`Connected. Using database: ${DB_NAME}`);

    const collections = {
      users: INITIAL_USERS,
      books: INITIAL_BOOKS,
      borrowRecords: INITIAL_BORROW_RECORDS,
      saleRecords: INITIAL_SALE_RECORDS,
      officeAssets: INITIAL_OFFICE_ASSETS,
      activityLogs: INITIAL_LOGS,
    } as const;

    for (const [name, docs] of Object.entries(collections)) {
      const col = db.collection(name);
      await col.deleteMany({});
      if (docs.length > 0) {
        const result = await col.insertMany(docs as object[]);
        console.log(`✓ ${name}: inserted ${result.insertedCount} document(s)`);
      } else {
        console.log(`✓ ${name}: empty (cleared)`);
      }
    }

    console.log('\nAll records seeded into database "tanzeem".');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

seed();
