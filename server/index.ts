import 'dotenv/config';
import express from 'express';
import { MongoClient, Db } from 'mongodb';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://farhan3fareed_db_user:HqV9sxt4GrBrfmC5@cluster0.remzgm1.mongodb.net/tanzeem?retryWrites=true&w=majority';
const DB_NAME = 'tanzeem';

type UserRole = 'Admin' | 'Secretary' | 'Finance Admin';

interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  department: string;
  avatar: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

interface WithId {
  id: string;
  [key: string]: unknown;
}

let db: Db;

const COLLECTIONS = {
  users: 'users',
  books: 'books',
  borrowRecords: 'borrowRecords',
  saleRecords: 'saleRecords',
  officeAssets: 'officeAssets',
  activityLogs: 'activityLogs',
} as const;

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { passwordHash, passwordSalt: salt };
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const { passwordHash } = hashPassword(password, salt);
  const a = Buffer.from(passwordHash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function publicUser(user: AuthUser) {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
    department: user.department,
    avatar: user.avatar,
  };
}

function stripMongo<T extends Record<string, unknown>>(doc: T) {
  const { _id, ...rest } = doc as T & { _id?: unknown };
  return rest as Omit<T, '_id'>;
}

async function listCollection(name: string) {
  const docs = await db.collection(name).find({}).toArray();
  return docs.map((d) => stripMongo(d as Record<string, unknown>));
}

async function upsertById(collection: string, doc: WithId) {
  if (!doc?.id) throw new Error('Document id is required');
  const { _id: _ignored, ...clean } = doc as WithId & { _id?: unknown };
  await db.collection(collection).updateOne({ id: clean.id }, { $set: clean }, { upsert: true });
  return clean;
}

async function deleteById(collection: string, id: string) {
  const result = await db.collection(collection).deleteOne({ id });
  return result.deletedCount > 0;
}

function registerCrud(
  app: express.Express,
  route: string,
  collection: string,
  options: { sort?: Record<string, 1 | -1> } = {}
) {
  app.get(`/api/${route}`, async (_req, res) => {
    try {
      let cursor = db.collection(collection).find({});
      if (options.sort) cursor = cursor.sort(options.sort);
      const docs = await cursor.toArray();
      res.json(docs.map((d) => stripMongo(d as Record<string, unknown>)));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to list ${route}` });
    }
  });

  app.post(`/api/${route}`, async (req, res) => {
    try {
      const saved = await upsertById(collection, req.body as WithId);
      res.status(201).json(saved);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to save ${route}` });
    }
  });

  app.put(`/api/${route}/:id`, async (req, res) => {
    try {
      const saved = await upsertById(collection, { ...req.body, id: req.params.id } as WithId);
      res.json(saved);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to update ${route}` });
    }
  });

  app.delete(`/api/${route}/:id`, async (req, res) => {
    try {
      const ok = await deleteById(collection, req.params.id);
      if (!ok) return res.status(404).json({ message: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to delete ${route}` });
    }
  });
}

async function start() {
  const client = new MongoClient(URI);
  await client.connect();
  db = client.db(DB_NAME);

  await db.collection(COLLECTIONS.users).createIndex({ email: 1 }, { unique: true });
  await db.collection(COLLECTIONS.books).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.borrowRecords).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.saleRecords).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.officeAssets).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.activityLogs).createIndex({ id: 1 }, { unique: true });

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, database: DB_NAME });
  });

  /** Bulk load for app bootstrap */
  app.get('/api/data', async (_req, res) => {
    try {
      const [books, borrowRecords, saleRecords, officeAssets, activityLogs] = await Promise.all([
        listCollection(COLLECTIONS.books),
        listCollection(COLLECTIONS.borrowRecords),
        listCollection(COLLECTIONS.saleRecords),
        listCollection(COLLECTIONS.officeAssets),
        listCollection(COLLECTIONS.activityLogs),
      ]);

      // Newest activity first
      activityLogs.sort((a, b) => String(b.id).localeCompare(String(a.id)));

      res.json({ books, borrowRecords, saleRecords, assets: officeAssets, logs: activityLogs });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to load data' });
    }
  });

  /** Clear inventory collections (keeps users) */
  app.post('/api/data/reset', async (_req, res) => {
    try {
      await Promise.all([
        db.collection(COLLECTIONS.books).deleteMany({}),
        db.collection(COLLECTIONS.borrowRecords).deleteMany({}),
        db.collection(COLLECTIONS.saleRecords).deleteMany({}),
        db.collection(COLLECTIONS.officeAssets).deleteMany({}),
        db.collection(COLLECTIONS.activityLogs).deleteMany({}),
      ]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to reset data' });
    }
  });

  /** Auth */
  app.get('/api/auth/status', async (_req, res) => {
    try {
      const usersCol = db.collection<AuthUser>(COLLECTIONS.users);
      const totalUsers = await usersCol.countDocuments({
        passwordHash: { $exists: true, $ne: '' },
      });
      res.json({ hasUsers: totalUsers > 0, userCount: totalUsers });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to check auth status' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, role, department } = req.body as {
        name?: string;
        email?: string;
        password?: string;
        role?: UserRole;
        department?: string;
      };

      if (!name?.trim() || !email?.trim() || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      }

      const usersCol = db.collection<AuthUser>(COLLECTIONS.users);
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await usersCol.findOne({ email: normalizedEmail });
      if (existing?.passwordHash) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }

      const passwordUsers = await usersCol.countDocuments({
        passwordHash: { $exists: true, $ne: '' },
      });
      const assignedRole: UserRole = passwordUsers === 0 ? 'Admin' : role || 'Secretary';
      const { passwordHash, passwordSalt } = hashPassword(password);

      const newUser: AuthUser = {
        id: `usr-${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        role: assignedRole,
        department: department?.trim() || 'Central Administration',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        passwordHash,
        passwordSalt,
        createdAt: new Date().toISOString(),
      };

      if (existing) {
        await usersCol.updateOne(
          { email: normalizedEmail },
          {
            $set: {
              name: newUser.name,
              role: newUser.role,
              department: newUser.department,
              avatar: newUser.avatar,
              passwordHash,
              passwordSalt,
              createdAt: newUser.createdAt,
            },
          }
        );
        const updated = await usersCol.findOne({ email: normalizedEmail });
        return res.status(201).json({ user: publicUser(updated as AuthUser) });
      }

      await usersCol.insertOne(newUser);
      res.status(201).json({ user: publicUser(newUser) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Registration failed.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email?.trim() || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const usersCol = db.collection<AuthUser>(COLLECTIONS.users);
      const user = await usersCol.findOne({ email: email.trim().toLowerCase() });
      if (!user?.passwordHash || !user.passwordSalt) {
        return res.status(401).json({ message: 'Invalid email or password. Please register first.' });
      }
      if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      res.json({ user: publicUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Login failed.' });
    }
  });

  registerCrud(app, 'books', COLLECTIONS.books);
  registerCrud(app, 'borrow-records', COLLECTIONS.borrowRecords);
  registerCrud(app, 'sale-records', COLLECTIONS.saleRecords);
  registerCrud(app, 'office-assets', COLLECTIONS.officeAssets);
  registerCrud(app, 'activity-logs', COLLECTIONS.activityLogs, { sort: { id: -1 } });

  // Batch upsert helpers used by compound client operations
  app.post('/api/books/batch', async (req, res) => {
    try {
      const items = Array.isArray(req.body) ? (req.body as WithId[]) : [];
      await Promise.all(items.map((item) => upsertById(COLLECTIONS.books, item)));
      res.json({ success: true, count: items.length });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to batch save books' });
    }
  });

  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next();
    });
  });

  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT} (db: ${DB_NAME})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
