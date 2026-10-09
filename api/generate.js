// Writes new A2 practice material for Lezen and Luisteren with Claude.
// POST (no body needed) -> {lezen:[{text, questions:[{q, right, wrong}]}], luisteren:[{say, q, right, wrong}]}
// The prompt is built here, so the page can't send its own. Needs ANTHROPIC_API_KEY, like api/check.js.
import Anthropic from "@anthropic-ai/sdk";

const KEY = (process.env.ANTHROPIC_API_KEY || "").trim();
const client = KEY ? new Anthropic({ apiKey: KEY }) : null;

const QUESTION = {
  type: "object",
  properties: { q: { type: "string" }, right: { type: "string" }, wrong: { type: "array", items: { type: "string" } } },
  required: ["q", "right", "wrong"],
  additionalProperties: false,
};
const SCHEMA = {
  type: "object",
  properties: {
    lezen: {
      type: "array",
      items: {
        type: "object",
        properties: { text: { type: "string" }, questions: { type: "array", items: QUESTION } },
        required: ["text", "questions"],
        additionalProperties: false,
      },
    },
    luisteren: {
      type: "array",
      items: {
        type: "object",
        properties: { say: { type: "string" }, ...QUESTION.properties },
        required: ["say", "q", "right", "wrong"],
        additionalProperties: false,
      },
    },
  },
  required: ["lezen", "luisteren"],
  additionalProperties: false,
};

const TOPICS = ["de huisarts", "de gemeente", "school", "werk", "de supermarkt", "het openbaar vervoer", "de woning en de buren",
  "de bibliotheek", "sport", "de tandarts", "de bank", "een cursus", "het weer", "een pakket ophalen", "een feest",
  "de apotheek", "een sollicitatie", "de kinderopvang", "afval en recycling", "de markt", "een verhuizing", "de fietsenmaker"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  // Only accept calls from this site's own pages
  let host = "";
  try { host = new URL(req.headers.origin).host; } catch {}
  if (host !== req.headers.host) return res.status(403).json({ error: "forbidden" });
  if (!client) return res.status(503).json({ error: "not_configured" });

  const topics = [...TOPICS].sort(() => Math.random() - 0.5).slice(0, 5).join(", ");
  const prompt = `Maak nieuw oefenmateriaal voor het Nederlandse inburgeringsexamen, niveau A2 (Lezen en Luisteren). Gebruik eenvoudige, correcte taal op A2-niveau. Onderwerpen: ${topics}.
- lezen: precies 3 items. text = een korte tekst van 50 tot 90 woorden, zoals op het examen: een advertentie, een brief van een instantie, een e-mail, een mededeling of een rooster. questions = 2 of 3 vragen.
- luisteren: precies 4 items. say = een gesproken bericht van 2 tot 4 zinnen (voicemail, omroepbericht, gesprek); schrijf getallen en tijden in woorden. q = één vraag over het bericht.
Elke vraag heeft één goed antwoord (right) en precies twee foute antwoorden (wrong). Het goede antwoord volgt duidelijk uit de tekst; de foute antwoorden klinken logisch maar zijn fout. Houd de antwoorden kort. Gebruik verzonnen namen, adressen en telefoonnummers.`;

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal") return res.status(422).json({ error: "refused" });
    if (response.stop_reason === "max_tokens") return res.status(502).json({ error: "failed" });
    const text = response.content.find((b) => b.type === "text")?.text;
    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return res.status(503).json({ error: "not_configured" });
    if (error instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "rate_limited" });
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error", error.status, error.message);
      return res.status(502).json({ error: "failed", status: error.status, detail: String(error.message).slice(0, 300) });
    }
    console.error(error);
    return res.status(502).json({ error: "failed", kind: error?.name || typeof error });
  }
}
