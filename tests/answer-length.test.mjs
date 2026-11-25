// The right answer must not give itself away by being the longest option (tools/answer-length.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, report, clearly, LIMIT } from '../tools/answer-length.mjs';

test('No set has the right answer as the longest option much more often than chance', () => {
  for (const [set, s] of Object.entries(report())) assert.ok(s.share <= LIMIT, `${set}: ${(100 * s.share).toFixed(0)}%`);
});
test('Lezen A2 questions never have a right answer that is clearly the longest', () => {
  const bad = questions().filter((x) => x.set === 'Lezen A2' && clearly(x));
  assert.deepEqual(bad.map((x) => x.key), []);
});
test('KNMS here is where the KNM situations start in the app', async () => {
  const { KNMS } = await import('../tools/answer-length.mjs');
  const fs = await import('node:fs');
  assert.match(fs.readFileSync(new URL('../oefenen.html', import.meta.url), 'utf8'), new RegExp(`const KNMS=${KNMS},`));
});
