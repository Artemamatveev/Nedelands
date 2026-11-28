// The spelling check without AI for Schrijven A2 (api/_spell.js)
import test from 'node:test';
import assert from 'node:assert/strict';
import {unknownWords, spellingPoints, spellingByCount} from '../api/_spell.js';

test('Misspelled words are found; real words, forms, compounds, diminutives and names are not', ()=>{
  const text='Beste Anna,\nIk woon nu in Utrecht. Elke dag fiets ik. Mijn boodschappenlijstje is lang en mijn kinderen hebben auto’s.\nIk heb gisteren een brief geschrijft en mijn buurvrouw heeft mij geholpt. Mischien kom ik morgen, het is tog leuk. Volgende weak ga ik naar de dokter.\nMet vriendelijke groet,\nFatima Yilmaz';
  assert.deepEqual(unknownWords(text),['geschrijft','geholpt','Mischien','tog','weak']);
});

test('Misspellings Wiktionary lists as "forms" of words that do not inflect stay mistakes', ()=>{
  for(const w of ['mischien','tog'])assert.deepEqual(unknownWords('Het is '+w+' goed.'),[w],w);
  for(const w of ['elke','onze','woont','gewoond','huizen','hele'])assert.deepEqual(unknownWords('Het is '+w+' goed.'),[],w);
});

test('Words from the task, e-mail addresses and links are never hints', ()=>{
  assert.deepEqual(unknownWords('Ik kom naar de Taalcafé-avond. Mail: a.b@xyz.nl, www.qwrtx.nl','Kom je naar de taalcafé-avond?'),[]);
});

test('DUO\'s A2 rule: at most 2 mistakes 2 points, 3 to 5 1, 6 or more 0; never more than the model gave', ()=>{
  assert.deepEqual([0,2,3,5,6,9].map(spellingByCount),[2,2,1,1,0,0]);
  const e=n=>Array.from({length:n},()=>({kind:'spelling'})).concat([{kind:'grammatica'}]);
  assert.equal(spellingPoints(e(2),2),2);assert.equal(spellingPoints(e(3),2),1);assert.equal(spellingPoints(e(0),1),1);
  assert.equal(spellingPoints(e(1),2,6),0,'the model\'s own count of all mistakes');
  assert.equal(spellingPoints(e(1),2,-3),2,'a nonsense count is ignored');
});
