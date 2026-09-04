import { MongoClient, type Db, type Collection, type Document } from 'mongodb';
import { env } from './env.js';
import { COLLECTIONS, INDEXES } from './models.js';

/**
 * Serverless-safe MongoDB connection.
 * The client is cached on the global object so warm Lambda invocations reuse a
 * single pooled connection instead of opening a new one per request.
 */

interface Cached {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
  indexesEnsured: boolean;
}

const globalForMongo = globalThis as unknown as { __momentumMongo?: Cached };

const cached: Cached =
  globalForMongo.__momentumMongo ?? (globalForMongo.__momentumMongo = { client: null, promise: null, indexesEnsured: false });

async function connect(): Promise<MongoClient> {
  if (cached.client) return cached.client;
  if (!cached.promise) {
    cached.promise = MongoClient.connect(env.mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      retryWrites: true,
      serverSelectionTimeoutMS: 8000,
    });
  }
  cached.client = await cached.promise;
  return cached.client;
}

export async function getDb(): Promise<Db> {
  const client = await connect();
  const db = client.db(env.mongoDbName);
  if (!cached.indexesEnsured) {
    cached.indexesEnsured = true;
    // Fire-and-forget: index creation is idempotent and must not block requests.
    void ensureIndexes(db).catch((err) => {
      cached.indexesEnsured = false;
      console.error('[db] ensureIndexes failed', err);
    });
  }
  return db;
}

export async function collection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

/** Idempotently creates every index declared in models.ts. */
export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all(
    Object.entries(INDEXES).map(async ([name, specs]) => {
      const col = db.collection(name);
      for (const spec of specs) {
        await col.createIndex(spec.key, spec.options ?? {}).catch((err) => {
          // An index that already exists with different options throws; log and move on.
          console.warn(`[db] index ${name} ${JSON.stringify(spec.key)} skipped: ${err.message}`);
        });
      }
    }),
  );
}

export { COLLECTIONS };
