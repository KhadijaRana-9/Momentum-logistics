import { collection } from './db.js';
import { COLLECTIONS } from './models.js';

interface CounterDoc {
  _id: string;
  seq: number;
}

/**
 * Atomically increments a named counter and returns a zero-padded reference,
 * e.g. nextRef('lead', 'LEAD') -> "LEAD-000042".
 */
export async function nextRef(counter: string, prefix: string, pad = 6): Promise<string> {
  const counters = await collection<CounterDoc>(COLLECTIONS.counters);
  const res = await counters.findOneAndUpdate(
    { _id: counter },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  const seq = res?.seq ?? 1;
  return `${prefix}-${String(seq).padStart(pad, '0')}`;
}
