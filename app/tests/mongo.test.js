import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { MongoStore } from '../server/stores/mongo_store.js';
import { conversationDocuments } from '../server/models/conversation_model.js';

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
  let tick = 0;
  const chat = (userId, levelId, model) => conversationDocuments({ userId, levelId, message: 'q', answer: 'r', model, retrieved: [{ title: 'Doc', score: 0.5 }] }, new Date(Date.UTC(2030, 0, 1, 0, 0, tick++)));
  await store.appendConversation(chat(a._id, 'l1', 'm1'));
  await store.appendConversation(chat(a._id, 'l1', 'm2'));
  await store.appendConversation(chat(b._id, 'l1', 'm1'));
  const saved = await store.listConversations(a._id);
  assert.equal(saved.length, 4);
  assert.deepEqual(saved.map((message) => message.role), ['user', 'assistant', 'user', 'assistant']);
  assert.deepEqual(saved[1].retrieved, [{ title: 'Doc', score: 0.5 }]);
  await store.clearConversation(a._id, 'l1', 'm1');
  assert.deepEqual([...new Set((await store.listConversations(a._id)).map((message) => message.model))], ['m2']);
  assert.equal((await store.listConversations(b._id)).length, 2);
  await store.appendConversation(chat(a._id, 'l2', 'm1'));

  // Older chats embedded in the learner document are moved into the collection once.
  await store.users.updateOne({ _id: b._id }, { $set: { conversations: { l3: [
    { role: 'user', text: 'old q', model: 'm1', at: '2020-01-01T00:00:00.000Z' },
    { role: 'assistant', text: 'old a', model: 'm1', at: '2020-01-01T00:00:00.000Z' }
  ] } } });
  await store.migrateEmbeddedConversations();
  await store.migrateEmbeddedConversations();
  assert.equal(await store.conversations.countDocuments({ userId: b._id, levelId: 'l3' }), 2);
  assert(!(await store.getUser(b._id)).conversations);
  await store.resetUser(a._id);
  assert.deepEqual((await store.getUser(a._id)).progress, []);
  assert((await store.getUser(a._id)).solved.l1);
  assert.equal(await store.conversations.countDocuments({ userId: a._id }), 0, 'reset deletes the chat');
  assert.equal((await store.listConversations(b._id)).length, 4, 'another learner keeps the chat');
  assert(!(await store.getUser(a._id)).conversations, 'chats are not stored on the learner');
  await store.putOtp(a.email, { hash: 'test-only', salt: 'test', attempts: 0, expiresAt: new Date(Date.now() + 60000) });
  assert.equal(await store.bumpOtp(a.email), 1);
  assert.equal((await store.getOtp(a.email)).attempts, 1);
  await store.deleteOtp(a.email);
  assert.equal(await store.getOtp(a.email), null);
});