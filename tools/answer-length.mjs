// How often the right answer is the longest of the three options, per kind of question. With options of random length
// that is about a third; much more and a learner can pass by picking the longest answer (CLAUDE.md, Content).
//   node tools/answer-length.mjs          prints the share per set and the worst questions
//   node tools/answer-length.mjs --list   also lists every question where the right answer is clearly the longest
// tests/answer-length.test.mjs keeps every set under LIMIT.
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
export const LIMIT = 0.36; // the share no set may go over (chance is a third); lower it as the sets are cleaned
export const KNMS = 235; // from this index on KNM rows are situations (KNMS in oefenen.html): counted as their own set, so the short questions don't hide them
const MARGIN = 1.25; // "clearly longest": at least a quarter longer than the longest wrong option

export function load() {
  const ctx = vm.createContext({});
  for (const f of ['data/knm.js', 'data/a2.js', 'data/b1.js', 'data/extra.js'])
    vm.runInContext(fs.readFileSync(new URL(f, root), 'utf8') + '\n;globalThis.__=Object.assign(globalThis.__||{},{KNM:typeof KNM!=="undefined"?KNM:undefined,LS:typeof LS!=="undefined"?LS:undefined,LSM:typeof LSM!=="undefined"?LSM:undefined,LZ:typeof LZ!=="undefined"?LZ:undefined,LZ1:typeof LZ1!=="undefined"?LZ1:undefined,LSB:typeof LSB!=="undefined"?LSB:undefined})', ctx, { filename: f });
  return ctx.__;
}
// Every question as {set, key, q, right, wrong:[…]}
export function questions(D = load()) {
  const out = [];
  D.KNM.forEach((r, i) => out.push({ set: i >= KNMS ? 'KNM situaties' : 'KNM', key: `knm|${i}`, q: r[1], right: r[2], wrong: [r[3], r[4]] }));
  D.LS.forEach((r, i) => out.push({ set: 'Luisteren A2', key: `ls|${i}`, q: r[1], right: r[2], wrong: [r[3], r[4]] }));
  for (const [set, A] of [['Luisteren A2 lang', D.LSM], ['Luisteren B1', D.LSB]])
    A.forEach((r, i) => r[2].forEach((x, j) => out.push({ set, key: `${i}.${j}`, q: x[0], right: x[1], wrong: [x[2], x[3]] })));
  for (const [set, A] of [['Lezen A2', D.LZ], ['Lezen B1', D.LZ1]])
    A.forEach((r, i) => r[1].forEach((x, j) => out.push({ set, key: `${i}.${j}`, q: x[0], right: x[1], wrong: x.slice(2) }))); // Lezen: three or four options, as DUO's
  return out.filter((x) => typeof x.right === 'string' && x.wrong.every((w) => typeof w === 'string'));
}
const len = (s) => s.trim().length;
export const longest = (x) => len(x.right) > Math.max(...x.wrong.map(len));
export const clearly = (x) => len(x.right) >= MARGIN * Math.max(...x.wrong.map(len)) && len(x.right) - Math.max(...x.wrong.map(len)) >= 8;
// Absolute words (altijd, nooit, alleen, moet …) are a second give-away: an exam-wise learner drops options with them.
// absWrong / absRight: the share of wrong and right options with one. Far more in wrong ones than in right ones means
// "skip the absolute option" works; tests/answer-length.test.mjs reports it (no limit yet: options are recorded audio).
export const ABS = /\b(altijd|nooit|alleen|nergens|niemand|iedereen|alles|niets|moet|moeten|verplicht|verboden|elke|ieder)\b/i;
export function report(Q = questions()) {
  const sets = {};
  for (const x of Q) {
    const s = (sets[x.set] ||= { n: 0, longest: 0, clearly: 0, absW: 0, absR: 0, wN: 0 });
    s.n++; s.wN += x.wrong.length; if (longest(x)) s.longest++; if (clearly(x)) s.clearly++;
    s.absW += x.wrong.filter((w) => ABS.test(w)).length; if (ABS.test(x.right)) s.absR++;
  }
  for (const s of Object.values(sets)) { s.share = s.longest / s.n; s.absWrong = s.absW / s.wN; s.absRight = s.absR / s.n; }
  return sets;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const Q = questions(), R = report(Q);
  for (const [k, s] of Object.entries(R)) console.log(`${k.padEnd(20)} ${String(s.n).padStart(4)} questions, right answer longest ${(100 * s.share).toFixed(0)}%, clearly longest ${s.clearly}, absolute words: wrong ${(100 * s.absWrong).toFixed(0)}% / right ${(100 * s.absRight).toFixed(0)}%`);
  if (process.argv.includes('--list')) for (const x of Q.filter(clearly)) console.log(`${x.set} ${x.key}: ${x.q}\n  + ${x.right}\n  - ${x.wrong.join('\n  - ')}`);
}
