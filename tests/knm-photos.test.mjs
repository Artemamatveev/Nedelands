import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

test('every KNM question has a separate local JPEG', () => {
  const bank = readFileSync(new URL('../data/knm.js', import.meta.url), 'utf8');
  const questions = runInNewContext(bank + '\nKNM');
  const used = new Map();
  for (const [, question, , , , , photo] of questions) {
    assert.match(photo ?? '', /^[a-z0-9-]+$/, question);
    const bytes = readFileSync(new URL('../foto/' + photo + '.jpg', import.meta.url));
    assert.equal(bytes.readUInt16BE(0), 0xffd8, question);
    const hash = createHash('sha256').update(bytes).digest('hex');
    assert.ok(!used.has(hash), question + ' shares its photo with ' + used.get(hash));
    used.set(hash, question);
  }
});
