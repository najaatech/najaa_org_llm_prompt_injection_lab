import { ClassroomQueue } from '../app/server/utils/classroom_queue.js';
import { generate,readiness } from '../app/server/services/ollama_service.js';
import { totalmem,cpus } from 'node:os';
const ready=await readiness();
if(!ready.installed) throw new Error('Start Ollama and download the tested model first.');
const queue=new ClassroomQueue();
const start=Date.now();
const results=await Promise.all(Array.from({length:4},(_,i)=>queue.submit(`benchmark-${i}`,async()=>{
  const began=Date.now();
  const output=await generate([{role:'system',content:'You are a campus helper. Answer in at most two short sentences.'},{role:'user',content:'The open day is at 10:00 in the library. Write a friendly visitor invitation with that time and place.'}]);
  return {request:i+1,queueWaitMs:began-start,generationMs:Date.now()-began,endToEndMs:Date.now()-start,output};
})));
console.log(JSON.stringify({measuredAt:new Date().toISOString(),hardware:{cpu:cpus()[0]?.model,ramGB:Math.round(totalmem()/1024**3)},model:ready.model,digest:ready.digest,context:4096,outputTokenCap:192,results,note:'One four-request warm workload, not a p95 benchmark or 16GB certification. No student data or model state was changed.'},null,2));