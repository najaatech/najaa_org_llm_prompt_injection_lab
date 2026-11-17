import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { MongoStore } from '../server/stores/mongo_store.js';

test('MongoDB integration: persistence, owner isolation, OTP and reset', async t => {
  const client = new MongoClient(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017', { serverSelectionTimeoutMS: 1000 });
  try { await client.connect(); }
  catch { await client.close(); t.skip('Local test MongoDB unavailable'); return; }
  const db = client.db(`prompt_injection_test_${randomUUID().replaceAll('-', '')}`);
  t.after(async () => { try { await db.dropDatabase(); } finally { await client.close(); } });
  const store = new MongoStore(client, db);
  await store.init();
  const a = await store.createUser('a@example.invalid');
  const b = await store.createUser('b@example.invalid');
  assert.equal((await store.createUser(a.email))._id, a._id);
  const docs = JSON.stringify(await store.listDocs(a._id));
  assert(docs.includes(a.flags.l1));
  assert(!docs.includes(b.flags.l1));
  assert((await store.vaultFind(a._id, 'staff-door-code')).text.includes(a.flags.l3));
  assert.equal(await store.vaultFind(a._id, { $ne: null }), null);
  assert.equal(await store.vaultFind({ $ne: null }, 'staff-door-code'), null);
  a.solved.l1 = true;
  a.progress.push('memory');
  await store.saveUser(a);
  assert((await store.getUser(a._id)).solved.l1);
  await store.resetUser(a._id);
  assert.deepEqual((await store.getUser(a._id)).progress, []);
  assert((await store.getUser(a._id)).solved.l1);
  await store.putOtp(a.email, { hash: 'test-only', salt: 'test', attempts: 0, expiresAt: new Date(Date.now() + 60000) });
  assert.equal(await store.bumpOtp(a.email), 1);
  assert.equal((await store.getOtp(a.email)).attempts, 1);
  await store.deleteOtp(a.email);
  assert.equal(await store.getOtp(a.email), null);
});