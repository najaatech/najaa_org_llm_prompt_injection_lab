import { networkInterfaces } from 'node:os';
import { MongoClient } from 'mongodb';
import { createMailgunMailer } from '../app/server/services/mailgun_service.js';
import { readiness,generate,model } from '../app/server/services/ollama_service.js';
try { process.loadEnvFile(); } catch { /* Environment variables may be set externally. */ }
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017', { serverSelectionTimeoutMS: 4000 });
try {
  await client.connect();
  await client.db(process.env.MONGODB_DB || 'prompt_injection_prototype').command({ ping: 1 });
  console.log('MongoDB: available');
} catch {
  console.error('MongoDB: unavailable');
  process.exitCode = 1;
} finally { await client.close(); }
const configured = createMailgunMailer().configured();
console.log(`Mailgun: ${configured ? 'configured (delivery not tested)' : 'not configured'}`);
if (!configured) process.exitCode = 1;
const status=await readiness();
console.log(`Node ${process.version} / ${process.arch}`);
console.log(`Model: ${model}\nOllama available: ${status.available}\nModel installed: ${status.installed}\nDigest: ${status.digest || 'not available'}\nEmbedding model: ${status.embedModel}\nEmbedding model installed: ${status.embedInstalled}`);
if (!status.embedInstalled) { console.log(`Run: ollama pull ${status.embedModel} (needed for retrieval).`); process.exitCode = 1; }
for (const addresses of Object.values(networkInterfaces())) for (const address of addresses || []) if (address.family==='IPv4'&&!address.internal) console.log(`LAN candidate: http://${address.address}:3000 (requires npm run start:lan)`);
if (status.installed) {
  const start=Date.now();
  try {const answer=await generate([{role:'system',content:'Answer briefly.'},{role:'user',content:'Say ready for the prompt injection prototype.'}]);console.log(`Warm-up answer (${Date.now()-start} ms): ${answer}`);}
  catch(error) {console.error(error.message);process.exitCode=1;}
} else {console.log('Start native Ollama and run npm run model:pull; every challenge needs the local model.');process.exitCode=1;}