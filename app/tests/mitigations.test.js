import test from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { mitigations } from '../content/mitigations.js';
import { catalog } from '../content/catalog.js';

test('every level and bonus mission carries distinct, compilable mitigation guidance', () => {
  const owners = [...catalog.levels, ...catalog.missions];
  assert.deepEqual(Object.keys(mitigations).sort(), owners.map(item => item.id).sort());
  for (const item of owners) {
    const mitigation = item.mitigation;
    assert.equal(mitigation, mitigations[item.id]);
    assert.equal(mitigation.language, 'JavaScript');
    assert(mitigation.principle && mitigation.limits && mitigation.labTip);
    assert(mitigation.steps.length >= 3);
    assert(mitigation.steps.every(step => typeof step === 'string' && step.length > 10));
    // Compile trusted teaching strings only; integration hooks are never executed.
    assert.doesNotThrow(() => new Script('(async function(){' + mitigation.code.replace(/^import .*;.*$/gm, '') + '\n})'), item.id);
  }
  assert.equal(new Set(Object.values(mitigations).map(m => m.principle)).size, owners.length);
});

test('catalog exposes no secrets or flags', () => {
  const text = JSON.stringify(catalog);
  assert.doesNotMatch(text, /FLAG\{[a-z0-9-]{6,}\}/i);
  assert.equal(catalog.levels.length, 3);
  assert.equal(catalog.missions.length, 1);
});
