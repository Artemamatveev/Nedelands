// Gesprekken: a spoken conversation with Claude, like a video call. Served as /api/talk (a rewrite to
// /api/check?kind=talk, because the Hobby plan allows 12 functions). The learner speaks (the phone writes it down) or
// types; Claude answers as the character, and Google's Chirp 3 HD voice says it (GOOGLE_TTS_KEY; without it the page
// uses the phone's own voice).
// POST {go:"start", topic, level} -> {token, reply, audio, left, limit, period}: takes one check (like one writing task)
// POST {go:"say", token, history:[{me, t}]} -> {reply, fix:{wrong, right, why}|null, done, audio}
// POST {go:"end", token, history} -> {verdict, good:[…], tips:[{wrong, right, why}]}
// A conversation is paid once, at its start; the signed token lets the next turns through for TTL. The prompt is built
// here from TOPICS, so the page can't send its own instructions. Nothing of the conversation is stored.
import Anthropic from "@anthropic-ai/sdk";
import { timingSafeEqual } from "node:crypto";
import { SCENES } from "./_scenes.js";
import { accounts, caller, useChecks, LIMIT, PLUS, plusOn, plusFor, coversLevel, FREE, visitor, useFree, useTotal, addSpend, bonusFor, talkSign } from "./_supa.js";

const KEY = (process.env.ANTHROPIC_API_KEY || "").trim();
const client = KEY ? new Anthropic({ apiKey: KEY }) : null;
// Free conversations on the cheap model, Plus on the better one; both changeable in Vercel without code
const MODEL_FREE = (process.env.TALK_MODEL_FREE || process.env.GRADING_MODEL_FREE || "claude-haiku-5-5").trim();
const MODEL_PLUS = (process.env.TALK_MODEL || "claude-sonnet-5-5").trim();
const TTS_KEY = (process.env.GOOGLE_TTS_KEY || "").trim();
const VOICE = { F: "Vindemiatrix", M: "Charon" }; // the same voices as the app's recordings (audio/build.mjs)
const TTL = 40 * 60e3; // a conversation's token is valid 40 minutes
export const TURNS = 14; // the learner's turns at most; the character says goodbye before that
const WRAP = { A2: 8, B1: 10 }; // from this turn on the character rounds the conversation off

// The situations (SCENES, made from the scripts in GP by tools/build-scenes.mjs) each have their own person, a task and a
// model conversation. tests/talk.test.mjs checks that the page's ids, people and tasks match these.
// "Praat met iemand": the page picks one of these people at random. Each has a persona, a few openers (the server picks
// one) and talks about their own life; people from the past live in their own time and are curious about the learner's.
// Historical facts in a persona are checked; the model is told to stay vague rather than invent more.
// The page lists the same ids and names in PEOPLE (oefenen.html), with the avatar.
const PEOPLE = {
  saskia: { who: "Saskia", g: "F", open: ["Hoi! Leuk dat je belt. Hoe gaat het met je?", "Hé, hallo! Wat heb jij vandaag gedaan?", "Hoi! Ik ben net thuis van mijn werk. Hoe was jouw dag?"],
    persona: "Saskia (32), the learner's Dutch friend. She lives in Utrecht with her cat Pip, works as a nurse (verpleegkundige) in a hospital, cycles everywhere, loves cooking and the market on Saturday. Warm, curious, a bit funny. Chats about everyday life: the day, food, the weekend, work, the learner's country." },
  jansen: { who: "Mevrouw Jansen", g: "F", open: ["Goedemorgen! Mooi weer vandaag, hè? Woont u hier al lang?", "Hallo buur! Ik ben net mijn tuin aan het doen. Hoe gaat het met u?"],
    persona: "Mevrouw Ria Jansen (72), the friendly, slightly nosy neighbour. Widow, lives in the street for forty years, has a garden with roses, two grandchildren, walks with her dog Bello. Talks about the weather, the neighbourhood, the bins (groene bak on Monday), her grandchildren, and wants to know everything about the learner. Uses u, old-fashioned and kind." },
  slager: { who: "Slager Henk", g: "M", formal: 1, open: ["Goedemiddag! Zegt u het maar, wat mag het zijn?", "Hé, goedemorgen! Wat kan ik voor u snijden vandaag?"],
    persona: "Henk (55), the butcher in his own small butcher's shop (slagerij) for thirty years. Sells gehakt (€ 9,95 per kilo), kipfilet, rookworst, slavinken, speklappen and kippenpoten. Jokes, asks how much ('Hoeveel gram?'), and always asks 'Mag het ietsje meer zijn?' and 'Anders nog iets?'. Gives a recipe tip if asked. Payment by pin." },
  collega: { who: "Collega Mo", g: "M", open: ["Hé, goedemorgen! Ook koffie? Hoe was je weekend?", "Hoi! Eindelijk pauze. Druk vandaag, hè?"],
    persona: "Mo (29), the learner's colleague at a logistics company near Rotterdam, chatting at the coffee machine. Born in Rotterdam, Moroccan-Dutch, loves football (Feyenoord) and his little daughter. Talks about the weekend, work, the boss, plans, food, and helps with tips about working in the Netherlands (vakantiegeld in May, sick leave rules: call your boss before 9)." },
  fleur: { who: "Fleur", g: "F", open: ["Hoi! Sorry, ik ben een beetje laat. Mijn fiets is weer gestolen!", "Hé! Ik zit net in de trein naar Leiden. Wat ga jij vandaag doen?"],
    persona: "Fleur (21), a student of medicine in Leiden who cycles everywhere, works in a café on Saturday, lives with four housemates, and has had three bikes stolen. Talks about studying, her student house, cycling, parties, the weather, travel, and is curious about the learner's life." },
  haring: { who: "Haringboer Dirk", g: "M", formal: 1, open: ["Goedemorgen! Een lekkere haring vandaag? Hij is vers!", "Hallo! Zin in een broodje haring of een portie kibbeling?"],
    persona: "Dirk (48), who sells fish from his herring stall (haringkar) on the market in Scheveningen. Proud of Hollandse Nieuwe, the new herring of early summer. A herring with onions (uitjes) costs € 3,50, a broodje haring € 4,50, kibbeling € 6. Explains how to eat a herring (hold it by the tail, head back), talks about the sea, the market, the weather." },
  kaas: { who: "Kaasdrager Piet", g: "M", formal: 1, open: ["Goedemorgen! Welkom op de kaasmarkt in Alkmaar. Bent u hier voor het eerst?", "Hallo! Ziet u al die kazen? Wilt u er iets over weten?"],
    persona: "Piet (60), a kaasdrager at the traditional cheese market in Alkmaar, in white clothes and a straw hat with ribbons in the colour of his guild. The cheese market is on Friday morning from spring to September; the kaasdragers carry the cheeses on a wooden berrie. Talks about cheese (Gouda and Edam, jong, belegen, oud), the tradition, tourists, and asks what cheese the learner likes." },
  schaatser: { who: "Klaas", g: "M", open: ["Hé, hallo! Er ligt eindelijk ijs! Kun jij schaatsen?", "Hoi! Brr, wat koud, hè? Lekker schaatsweer!"],
    persona: "Klaas (40) from Friesland, crazy about ice skating on natural ice. Dreams of the Elfstedentocht, the skating tour of 200 kilometres past eleven Frisian cities, which needs very thick ice and was last held in 1997. Talks about winter, skating, erwtensoep and koek-en-zopie on the ice, Friesland, and asks about winter in the learner's country." },
  koningsdag: { who: "Bram", g: "M", open: ["Hé! Fijne Koningsdag! Kijk, alles is oranje!", "Hallo! Ga jij ook naar de vrijmarkt vandaag?"],
    persona: "Bram (35), dressed all in orange, celebrating Koningsdag (27 April, the King's birthday) in Amsterdam. Tells about the vrijmarkt where everyone sells old things on the street, music, boats on the canals, oranjebitter, tompoucen with orange icing, and asks about national holidays in the learner's country." },
  sint: { who: "Sinterklaas", g: "M", open: ["Goedenavond! Wat fijn om je te zien. Heb je je schoen al gezet?", "Dag! Mijn Pieten en ik hebben het heel druk. Ben je dit jaar lief geweest?"],
    persona: "Sinterklaas, the kind old saint with a long white beard, red mitre and staff, who comes every November from Spain by steamboat with his helpers (Pieten) and rides his white horse over the roofs. Children put their shoe by the fireplace and sing; on 5 December (pakjesavond) there are presents, poems and surprises, pepernoten, kruidnoten and a chocolate letter. Talks warmly, a little solemnly, asks if the learner has been good and if they know a Sinterklaas song. Never discusses the appearance of the Pieten; if asked, the Pieten have soot on their cheeks from the chimneys." },
  vangogh: { who: "Vincent van Gogh", g: "M", formal: 1, open: ["Goedendag! Ik ben Vincent. Ik ben net terug van het veld met mijn schildersezel. Houdt u van schilderen?", "Ah, bezoek! Kijk, de zonnebloemen zijn bijna klaar. Wat vindt u ervan?"],
    persona: "Vincent van Gogh in the summer of 1888 in Arles, in the south of France, a Dutch painter (born 1853 in Zundert, Brabant). He lives in the Yellow House, paints sunflowers, fields of wheat and the night sky, loves strong colours (yellow, blue) and the sun of the south. His brother Theo, an art dealer in Paris, sends him money and they write many letters; he hardly sells paintings and is often poor, and he hopes the painter Gauguin will come to live with him. Speaks with passion about colour and nature, a little intense. Lives in 1888: knows nothing later, and is amazed and curious about modern things the learner mentions." },
  rembrandt: { who: "Rembrandt", g: "M", formal: 1, open: ["Goedendag! Komt u binnen, maar pas op voor de verf. Ik werk aan een heel groot schilderij.", "Ah, welkom in mijn atelier in Amsterdam. Wilt u zien waar ik aan werk?"],
    persona: "Rembrandt van Rijn early in 1642 in Amsterdam, a famous painter (born 1606 in Leiden), in his big house in the Jodenbreestraat. He is finishing a huge painting of the city guard (schutterij) of captain Frans Banninck Cocq, later called De Nachtwacht. He loves light and dark in his paintings, paints many portraits of rich people and of himself, collects art and strange objects, and spends too much money. His wife Saskia and their baby son Titus live with him. Lives in 1642: knows nothing later, and is amazed and curious about modern things the learner mentions." },
  vermeer: { who: "Johannes Vermeer", g: "M", formal: 1, open: ["Goedendag. Ik ben Johannes Vermeer, schilder in Delft. Wilt u zien hoe het licht door mijn raam valt?", "Ah, bezoek. Stil maar, de kinderen slapen. Komt u verder."],
    persona: "Johannes Vermeer around 1665 in Delft, a quiet painter (born 1632 in Delft). He paints slowly, only a few paintings a year, often of a quiet room with light from a window, a woman reading a letter or pouring milk; he also painted a view of his city, Gezicht op Delft. He uses very expensive blue paint made from a stone, lapis lazuli. He lives with his wife Catharina, his mother-in-law and many children, and also sells art. Calm, careful, speaks about light and colour. Lives around 1665: knows nothing later, and is amazed and curious about modern things the learner mentions." },
  visser: { who: "Jan uit Volendam", g: "M", open: ["Hoi! Ik ben Jan. Ik kom net van de boot. We hebben veel haring gevangen!", "Goedemorgen! Kijk, mijn vader en ik gaan straks weer de zee op."],
    persona: "Jan (16), a fisherman's son in Volendam in 1910, in traditional clothes (klederdracht: wide trousers, a cap, a red scarf). He fishes with his father on the Zuiderzee, then still an open sea, for herring, anchovy and eel (paling). Talks about the boat, the weather and storms, his family, church on Sunday, the harbour, the costumes, and the tourists and painters who come to look at Volendam. Lives in 1910: knows nothing later, and is amazed and curious about modern things the learner mentions." },
};
export const TOPICS = { ...PEOPLE, ...SCENES };
const LEVELS = new Set(["A2", "B1"]);

const REPLY = {
  type: "object",
  properties: {
    reply: { type: "string" },
    fix: { type: "object", properties: { wrong: { type: "string" }, right: { type: "string" }, why: { type: "string" } }, required: ["wrong", "right", "why"], additionalProperties: false },
    done: { type: "boolean" },
  },
  required: ["reply", "fix", "done"],
  additionalProperties: false,
};
const REVIEW = {
  type: "object",
  properties: {
    verdict: { type: "string" },
    good: { type: "array", items: { type: "string" } },
    tips: { type: "array", items: { type: "object", properties: { wrong: { type: "string" }, right: { type: "string" }, why: { type: "string" } }, required: ["wrong", "right", "why"], additionalProperties: false } },
  },
  required: ["verdict", "good", "tips"],
  additionalProperties: false,
};

const STYLE = {
  A2: "Level A2: short sentences (at most about 12 words), everyday words, mostly the present tense, usually one or two short sentences per turn; a brief natural response is enough.",
  B1: "Level B1: normal everyday Dutch, at most four sentences per turn, some longer sentences and the past tense are fine.",
};
function system(T, level, n) {
  const who = T.model
    ? `You are "${T.who}" in this everyday situation in the Netherlands: ${T.title}. The learner's task (they can see it): ${T.task}
Below is a model version of this conversation. Keep to its facts (prices, times, rules, names, what is possible) and settle the same points, roughly in this order, but react freely and naturally to what the learner really says: their answers will differ from the model.
${T.model.map(([a, m]) => `${T.who}: ${a}\nCURSIST: ${m}`).join("\n")}
${T.who}: ${T.end}`
    : `You are ${T.persona}
Have a free, friendly conversation in your role: talk about your own life and interests, ask about the learner's, and move to new subjects when one is finished. If you live in the past, stay in your own time; about history, say only what you are sure of and stay vague rather than invent.`;
  return `You speak with an adult who is learning Dutch for the Dutch integration exam (inburgeringsexamen), in a spoken practice conversation in the Bittertalen app. The learner talks and their phone writes it down, so expect missing punctuation, words the speech recognition got wrong, and short answers. Sometimes they type.
${who}
Rules for your reply:
- Speak only Dutch, also when the learner uses another language: then say kindly, in very simple Dutch, that you practise Dutch together, and give a short example of what they could say.
- ${STYLE[level]}
- Speak naturally, like on the phone or face to face: no lists, no emoji, no markdown, no stage directions. Use ${T.formal ? "u (formal)" : "je and jij (informal)"}.
- Respond to the meaning of the learner's last words and answer their question before moving on. Remember details already shared; never ask for information they just gave you.
- Make this a conversation, not an interview: share a relevant detail or reaction of your own. Do not praise every answer or repeat the learner's words. Ask at most one question, only when it follows naturally; not every reply needs a question. Let the learner lead or change the subject within your role.
- Accept short answers and imperfect Dutch when the meaning is clear. If you truly don't understand, ask one brief, specific clarification in simpler words; never invent what the learner said.
- Stay in your role. If the learner asks about something unrelated to practising this conversation, or something inappropriate, steer back kindly.
- Never correct the learner inside your reply. Put the single most important mistake in the learner's last message in "fix": "wrong" is their words exactly as written, "right" the corrected words, "why" one short sentence in very simple Dutch (A2). Ignore capitals, punctuation and words that look misheard by speech recognition. Leave all three empty when there is no real mistake.
- The learner has spoken ${n} time${n === 1 ? "" : "s"}. ${n >= TURNS - 1 ? "This is the last turn: end the conversation now with a friendly goodbye and set done to true." : T.model ? "When everything in the learner's task is settled, end with a short closing line like the last line of the model and set done to true." : n >= WRAP[level] ? "Start rounding the conversation off; when it has come to a natural end, say goodbye and set done to true." : "Set done to true only when the conversation has come to a natural end and you said goodbye."}`;
}
const REVIEW_SYSTEM = (level) => `You are a kind, honest Dutch teacher (NT2). Below is a practice conversation in Dutch between a learner at level ${level} (inburgeringsexamen) and a character in the Bittertalen app. The learner's lines were written down by their phone's speech recognition, so ignore capitals, punctuation and words that look misheard.
Give, in very simple Dutch (A2):
- verdict: two short sentences: how the learner did and the one thing to practise next. Encouraging but honest.
- good: at most three short things the learner did well (for example "Je stelde zelf een vraag.").
- tips: at most four of the most useful corrections of the learner's own words: "wrong" exactly as they said it, "right" corrected, "why" one short sentence. Only real mistakes; an empty list when there are none.`;

const str = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
// The conversation so far, as the page keeps it; capped so one ticket can't send a book
function lines(h) {
  return (Array.isArray(h) ? h : []).slice(-2 * TURNS - 2).map((x) => ({ me: !!x?.me, t: str(x?.t, 500) })).filter((x) => x.t);
}
const transcript = (L, T) => L.map((x) => `${x.me ? "CURSIST" : T.who.toUpperCase()}: ${x.me ? `<<<${x.t}>>>` : x.t}`).join("\n");

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function ticket(o) { const p = b64(o); return p + "." + talkSign(p) }
function unticket(tok) {
  const m = /^([A-Za-z0-9_-]{10,600})\.([A-Za-z0-9_-]{43})$/.exec(String(tok || ""));
  if (!m) return null;
  const a = Buffer.from(m[2]), b = Buffer.from(talkSign(m[1]));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try { const o = JSON.parse(Buffer.from(m[1], "base64url").toString("utf8")); return o && o.x > Date.now() && TOPICS[o.t] && LEVELS.has(o.l) ? o : null } catch { return null }
}

// Google's voice for a reply: base64 MP3, or null (no key, slow, or an error: the page then uses the phone's voice)
async function speech(text, g) {
  if (!TTS_KEY || !text) return null;
  try {
    const r = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST", signal: AbortSignal.timeout(2500),
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": TTS_KEY },
      body: JSON.stringify({ input: { text: text.slice(0, 900) }, voice: { languageCode: "nl-NL", name: "nl-NL-Chirp3-HD-" + VOICE[g] }, audioConfig: { audioEncoding: "MP3", sampleRateHertz: 24000 } }),
    });
    if (!r.ok) { console.error("tts", r.status); return null }
    const j = await r.json();
    return typeof j?.audioContent === "string" ? j.audioContent : null;
  } catch (e) { console.error("tts", e?.name || "error"); return null }
}

async function ask(model, sys, content, schema) {
  const params = {
    model, max_tokens: schema === REPLY ? 700 : 1600, system: sys,
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    messages: [{ role: "user", content }],
  };
  // Haiku has no server-side fallback; the larger models fall back on a refusal
  if (!/haiku/.test(model)) Object.assign(params, { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" });
  const response = await client.beta.messages.create(params);
  console.info(JSON.stringify({ event: "talk_usage", model: response.model, usage: response.usage }));
  const spent = addSpend(response.model, response.usage).catch(() => {});
  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") throw Object.assign(new Error(response.stop_reason), { code: response.stop_reason });
  return { result: JSON.parse(response.content.find((b) => b.type === "text")?.text || "{}"), spent };
}

// Who is asking: "u:<id>" for an account, "v:<hash>" for a guest's trial cookie
async function subject(req, res) {
  const user = await caller(req).catch(() => null);
  return user ? { s: "u:" + user.id, uid: user.id } : { s: "v:" + visitor(req, res), who: true };
}

export async function talk(req, res) {
  if (!client || !accounts) return res.status(503).json({ error: "not_configured" });
  if (Number(req.headers["content-length"]) > 60000) return res.status(413).json({ error: "too_large" });
  const go = req.body?.go;

  if (go === "start") {
    const T = TOPICS[req.body?.topic], level = LEVELS.has(req.body?.level) ? req.body.level : "A2";
    if (!T) return res.status(400).json({ error: "topic" });
    const user = await caller(req).catch(() => null), at = new Date().toISOString();
    let s, left, lim = LIMIT, period = "once", plus = false, who = "", free;
    if (!user) {
      who = FREE ? visitor(req, res) : "";
      if (!who) return res.status(401).json({ error: "login" });
      free = await useFree(who, 1, at).catch(() => null);
      if (free == null) return res.status(401).json({ error: "login" });
      if (free === -2) return res.status(429).json({ error: "busy" });
      if (free < 0) return res.status(401).json({ error: "login", free: 0 });
      s = "v:" + who;
    } else {
      plus = plusOn && coversLevel(await plusFor(user.id).catch(() => null), level);
      if (plus) { lim = PLUS; period = "day" } else lim = LIMIT + (await bonusFor(user.id).catch(() => 0));
      left = await useChecks(user.id, 1, lim, period, at).catch(() => null);
      if (left == null) return res.status(502).json({ error: "failed" });
      if (left < 0) return res.status(429).json({ error: "limit", limit: lim, period, checkedAt: at, plus });
      s = "u:" + user.id;
    }
    const mine = () => (user ? useChecks(user.id, -1, lim, period, at) : useFree(who, -1, at)).catch(() => {});
    const total = plus ? 0 : await useTotal(1).catch(() => null);
    if (!Number.isSafeInteger(total)) { await mine(); return res.status(503).json({ error: "quota_unavailable" }) }
    if (total < 0) { await mine(); return res.status(429).json({ error: "busy" }) }
    const open = Array.isArray(T.open) ? T.open[Math.floor(Math.random() * T.open.length)] : T.open;
    const token = ticket({ s, t: req.body.topic, l: level, p: plus ? 1 : 0, x: Date.now() + TTL });
    return res.status(200).json({
      token, reply: open, audio: await speech(open, T.g),
      left: who ? free : left, limit: who ? FREE : lim, period: who ? "once" : period, checkedAt: at, ...(who ? { free } : {}),
    });
  }

  if (go !== "say" && go !== "end") return res.status(400).json({ error: "go" });
  const o = unticket(req.body?.token);
  if (!o) return res.status(401).json({ error: "expired" });
  const me = await subject(req, res);
  if (me.s !== o.s) return res.status(401).json({ error: "expired" });
  const T = TOPICS[o.t], L = lines(req.body?.history), n = L.filter((x) => x.me).length;
  if (!n || (go === "say" && (!L[L.length - 1].me || n > TURNS))) return res.status(400).json({ error: "history" });
  const model = o.p ? MODEL_PLUS : MODEL_FREE;
  try {
    if (go === "end") {
      const { result: r, spent } = await ask(model, REVIEW_SYSTEM(o.l), `HET GESPREK (${T.who} en de cursist):\n${transcript(L, T)}`, REVIEW);
      await spent;
      return res.status(200).json({
        verdict: str(r.verdict, 400), good: (Array.isArray(r.good) ? r.good : []).slice(0, 3).map((x) => str(x, 160)).filter(Boolean),
        tips: (Array.isArray(r.tips) ? r.tips : []).slice(0, 4).map((x) => ({ wrong: str(x?.wrong, 160), right: str(x?.right, 160), why: str(x?.why, 240) })).filter((x) => x.wrong && x.right && x.wrong !== x.right),
      });
    }
    const { result: r, spent } = await ask(model, system(T, o.l, n), `HET GESPREK TOT NU:\n${transcript(L, T)}\n\nAntwoord nu als ${T.who} op de laatste zin van de cursist.`, REPLY);
    const reply = str(r.reply, 700) || "Sorry, kunt u dat nog een keer zeggen?";
    const f = r.fix || {}, fix = f.wrong && f.right && str(f.wrong, 160) !== str(f.right, 160) ? { wrong: str(f.wrong, 160), right: str(f.right, 160), why: str(f.why, 240) } : null;
    // Synthesise while usage is saved: accounting must not delay the start of the voice request.
    const [audio] = await Promise.all([speech(reply, T.g), spent]);
    return res.status(200).json({ reply, fix, done: !!r.done || n >= TURNS, audio });
  } catch (error) {
    if (error?.code === "refusal") return res.status(422).json({ error: "refused" });
    if (error instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "rate_limited" });
    if (error instanceof Anthropic.AuthenticationError) return res.status(503).json({ error: "not_configured" });
    console.error("talk", error?.name || typeof error, error?.status || "");
    return res.status(502).json({ error: "failed" });
  }
}
