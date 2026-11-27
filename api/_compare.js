// The owner's model comparison (admin.html, "Сравнение моделей"): POST with the owner's access token grades every made-up
// answer in _samples.js with the free model (GRADING_MODEL_FREE, Haiku by default) and the paid one (GRADING_MODEL, Sonnet
// by default), in parallel, and returns both results per answer. About 20 calls (~$0.25); the tokens go into ai_spend
// like any grading. Only for a confirmed e-mail in ADMIN_EMAILS; same origin only; never cached.
import { accounts, caller, sameOrigin } from "./_supa.js";
import { isOwner } from "./admin.js";
import { gradeSpeaking, gradeWriting, MODELS } from "./check.js";
import { SAMPLES, SAMPLES_SP } from "./_samples.js";


export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!sameOrigin(req)) return res.status(403).json({ error: "forbidden" });
  if (!accounts) return res.status(503).json({ error: "not_configured" });
  const u = await caller(req).catch(() => null);
  if (!u) return res.status(401).json({ error: "login" });
  if (!isOwner(u)) return res.status(403).json({ error: "forbidden" });
  // {part: "sp"}: the Spreken answers (transcripts) instead of the Schrijven texts
  const sp = req.body?.part === "sp", set = sp ? SAMPLES_SP : SAMPLES, grade = sp ? gradeSpeaking : gradeWriting;
  // {list: true}: only the tasks and texts, for a qualified NT2 reviewer to score blind (no model is called)
  if (req.body?.list) return res.status(200).json({ part: sp ? "sp" : "wr", samples: set.map(({ id, task, text }) => ({ id, task, text })) });
  const controls = req.body?.controls === true;
  const selected = controls ? set.filter(s => Object.hasOwn(CONTROLS, s.id)) : set;
  const one = (sample, model) => grade(sample, model).catch((e) => ({ error: String(e?.message || "failed").slice(0, 120) }));
  const rows = await Promise.all(selected.map(async (s) => {
    const [free, paid] = await Promise.all([one(s, MODELS.free), one(s, MODELS.paid)]);
    const control = CONTROLS[s.id];
    return { id: s.id, task: s.task, text: s.text,
      ...(control ? { control: { label: control.label, content: control.content, free: checkControl(control, free), paid: checkControl(control, paid) } } : {}),
      expected: s.expected || null, free, paid };
  }));
  const both = rows.filter((r) => !r.free.error && !r.paid.error);
  const summary = {
    keyChecks: Object.fromEntries(["free", "paid"].map(tier => {
      const [missing, complete, variant] = ["sleutel-ontbreekt", "sleutel-compleet", "sleutel-alternatief"]
        .map(id => rows.find(row => row.id === id)?.[tier]?.scores);
      if (![missing, complete, variant].every(score => Number.isInteger(score?.inhoud))) return [tier, null];
      return [tier, {
        // relative, not a guessed number: the missing key costs inhoud, the two complete versions score the same
        content: missing.inhoud < complete.inhoud && variant.inhoud === complete.inhoud,
        language: ["woorden", "grammatica", "spelling", "samenhang"].every(key =>
          Number.isInteger(complete[key]) && missing[key] === complete[key] && variant[key] === complete[key]),
      }];
    })),
    part: sp ? "sp" : "wr",
    controls,
    max: sp ? 8 : 10,
    teacher: Object.fromEntries(["free", "paid"].map(tier => [tier, againstTeacher(rows, tier, sp)])),
    models: MODELS,
    compared: both.length,
    samePassed: both.filter((r) => r.free.passed === r.paid.passed).length,
    meanDiff: both.length ? Math.round(both.reduce((a, r) => a + Math.abs(r.free.total - r.paid.total), 0) / both.length * 10) / 10 : null,
    maxDiff: both.length ? Math.max(...both.map((r) => Math.abs(r.free.total - r.paid.total))) : null,
  };
  return res.status(200).json({ summary, rows });
}

// These assertions check only what is clear from the task and the answer.
const CONTROLS = {
  "sleutel-ontbreekt": { label: "Место ключа пропущено", content: 2 },
  "sleutel-compleet": { label: "Оба пункта письма выполнены", content: 3 },
  "sleutel-alternatief": { label: "Оба пункта выполнены другими словами", content: 3 },
  "sp-werk-kort": { label: "Короткий ответ полностью отвечает на вопрос", content: 3 },
  "sp-werk-geen-reden": { label: "Назван транспорт, причина пропущена", content: 2 },
  "sp-werk-goed": { label: "Назван транспорт и объяснена причина", content: 3 },
  "sp-weekend-fout-onderwerp": { label: "Ответ не связан с вопросом", content: 0, passed: false },
  "sp-drie-fotos-twee": { label: "Описаны только две из трёх фотографий", content: 2 },
};
function checkControl(control, result) {
  if (result.error || !Number.isInteger(result.scores?.inhoud)) return null;
  return result.scores.inhoud === control.content &&
    (control.passed === undefined || result.passed === control.passed);
}

// Model against the scores of a qualified NT2 reviewer (SAMPLES[].expected, scored blind): how often the total is within
// one point, the same voldoende/onvoldoende, and per criterion the share with exactly the same points. null until scored.
// Spreken has no spelling (8 points, voldoende at inhoud 2 and 6), Schrijven 10 points with voldoende at inhoud 2 and 7.
const KEYS = ["inhoud", "woorden", "grammatica", "spelling", "samenhang"];
export function againstTeacher(rows, tier, sp = false) {
  const keys = sp ? KEYS.filter((k) => k !== "spelling") : KEYS;
  const total = (sc) => keys.reduce((a, k) => a + (sc[k] || 0), 0);
  const passes = (sc) => sc.inhoud >= 2 && total(sc) >= (sp ? 6 : 7);
  const both = rows.filter((r) => r.expected && !r[tier].error && r[tier].scores);
  if (!both.length) return null;
  const pct = (n) => Math.round((n / both.length) * 100);
  return {
    n: both.length,
    within1: pct(both.filter((r) => Math.abs(total(r[tier].scores) - total(r.expected)) <= 1).length),
    samePass: pct(both.filter((r) => passes(r[tier].scores) === passes(r.expected)).length),
    criteria: Object.fromEntries(keys.map((k) => [k, pct(both.filter((r) => r[tier].scores[k] === r.expected[k]).length)])),
  };
}
