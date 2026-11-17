import test from 'node:test';
import assert from 'node:assert/strict';
import { generate, generationRequest, sanitizeFinal } from '../server/services/ollama_service.js';

const messages=[{role:'system',content:'Official facts only.'},{role:'user',content:'When?'}];
test('Ollama string API and optional observer report final text and native timing/token metadata only',async t=>{
  t.mock.method(globalThis,'fetch',async (url,options)=>{
    assert.equal(url,'http://127.0.0.1:11434/api/chat');
    assert.deepEqual(JSON.parse(options.body),{...generationRequest(),messages});
    return {ok:true,json:async()=>({message:{content:'<think>SECRET</think>10:00',thinking:'PRIVATE'},done_reason:'stop',prompt_eval_count:20,eval_count:4,
      total_duration:9000000,load_duration:1000000,prompt_eval_duration:2000000,eval_duration:6000000})};
  });
  const events=[];
  assert.equal(await generate(messages,undefined,event=>events.push(event)),'10:00');
  assert.deepEqual(events[1].response,{content:'10:00',reasoningOmitted:true,doneReason:'stop',inputTokens:20,outputTokens:4,totalDurationMs:9,loadDurationMs:1,promptEvalDurationMs:2,evalDurationMs:6});
  assert(!JSON.stringify(events).includes('SECRET'));assert(!JSON.stringify(events).includes('PRIVATE'));
  assert.equal(await generate(messages),'10:00','existing scripts still receive a string');
});
test('reasoning tags, orphan prefixes, unclosed reasoning are omitted',()=>{
  for(const [text,expected] of [['<think>secret</think>final','final'],['secret</think>final','final'],['<thinking>secret</thinking>final','final'],['<think>secret',''],['final<think>secret','final']]) {
    assert.deepEqual(sanitizeFinal(text),{content:expected,reasoningOmitted:true});
  }
});
test('missing native measurements stay null, not invented',async t=>{
  t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>({message:{content:'final'}})}));
  const events=[];await generate(messages,undefined,event=>events.push(event));
  assert.deepEqual(events[1].response,{content:'final',reasoningOmitted:false,doneReason:null,inputTokens:null,outputTokens:null,totalDurationMs:null,loadDurationMs:null,promptEvalDurationMs:null,evalDurationMs:null});
});
test('unavailable, network, invalid provider JSON, empty, reasoning-only and capped outputs fail without fallback',async t=>{
  for(const response of [
    {ok:false,status:404},
    {ok:true,json:async()=>{throw new Error('PRIVATE provider body');}},
    {ok:true,json:async()=>({message:{content:''}})},
    {ok:true,json:async()=>({message:{content:'<think>SECRET',thinking:'PRIVATE'}})},
    {ok:true,json:async()=>({message:{content:'partial final'},done_reason:'length'})}
  ]) {
    const mock=t.mock.method(globalThis,'fetch',async()=>response);
    const events=[];
    await assert.rejects(generate(messages,undefined,event=>events.push(event)),err=>err.status===503&&!/PRIVATE|SECRET/.test(err.message)&&/No fallback/.test(err.message));
    assert(!/PRIVATE|SECRET/.test(JSON.stringify(events)));mock.mock.restore();
  }
  t.mock.method(globalThis,'fetch',async()=>{throw new TypeError('connection refused');});
  await assert.rejects(generate(messages),err=>err.status===503&&/No fallback/.test(err.message));
});
test('caller cancellation propagates its reason',async t=>{
  const controller=new AbortController();const reason=new Error('cancelled');controller.abort(reason);
  t.mock.method(globalThis,'fetch',async()=>{throw reason;});
  await assert.rejects(generate(messages,controller.signal),err=>err===reason);
});