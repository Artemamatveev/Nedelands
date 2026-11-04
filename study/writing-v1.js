// Scores are supplied by the existing grading request. This module never calls a model.
const WRITING_CRITERIA = ["inhoud", "woorden", "grammatica", "spelling", "samenhang"];
const WRITING_A2_MAX = {inhoud:3, woorden:2, grammatica:2, spelling:2, samenhang:1};
const WRITING_LABELS = {
  form:"Formulier", message:"Kort bericht", text:"Vrije tekst", formal:"Zakelijke e-mail of brief",
  sentence:"Zinsopdracht", email:"E-mail", other:"Schrijfopdracht"
};
// These are editorial tags for the stable A2 task keys, not guesses based on a learner's answer.
const WRITING_A2_GROUPS = {
  message:[0,1,2,6,14,22,23,24,25,28,29,33,34,36,39],
  formal:[4,5,7,15,26,27,30,32,35,37,38,40,41],
  text:[3,8,9,10,31,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65],
  form:[11,12,13,16,17,18,19,20,21]
};
const WRITING_A2_TYPES = Object.fromEntries(Object.entries(WRITING_A2_GROUPS)
  .flatMap(([type,ids])=>ids.map(id=>["wr|"+id,type])));
function writingTaskType(task) {
  if (task.sec === "wb") return {z:"sentence", f:"form", m:"email"}[task.kind] || "other";
  return WRITING_A2_TYPES[task.k] || (task.fields?.length ? "form" : "other");
}
function writingMax(task) {
  const source = task.mx || WRITING_A2_MAX;
  return Object.fromEntries(WRITING_CRITERIA.map(key=>[key,source[key] || 0]));
}
const writingPoints = scores => Object.values(scores).reduce((sum,n)=>sum+n,0);
function validWritingScores(scores, max) {
  return !!scores && WRITING_CRITERIA.every(key=>!max[key] ||
    Number.isInteger(scores[key]) && scores[key] >= 0 && scores[key] <= max[key]);
}
function writingPriorities(rows) {
  if (rows.some(row=>row.status === "unscored")) return [];
  const candidates = [];
  const empty = rows.filter(row=>row.status === "empty").sort((a,b)=>b.maxPoints-a.maxPoints);
  if (empty.length) candidates.push({
    criterion:"unfinished", lost:empty.reduce((sum,row)=>sum+row.maxPoints,0),
    instruction:"Maak alle opdrachten. Een lege opdracht levert geen punten op.",
    action:{kind:"task",key:empty[0].key}, taskNumber:empty[0].number
  });
  const advice = {
    inhoud:"Beantwoord elk punt van de opdracht. Controleer ook de vragen in het formulier.",
    woorden:"Gebruik woorden die precies zeggen wat je bedoelt. Kijk welke woorden zijn verbeterd.",
    grammatica:"Controleer de woordvolgorde en de werkwoordsvormen in je verbeterde zinnen.",
    spelling:"Lees je tekst nog een keer. Controleer spelling, hoofdletters en leestekens.",
    samenhang:"Verbind je zinnen, bijvoorbeeld met want, omdat, maar en daarna."
  };
  const reasons = {
    inhoud:/inhoud|opdracht|ontbreekt|vraag|vergeten/i,
    woorden:/woordkeuze|woordgebruik|woordenschat|betekenis/i,
    grammatica:/woordvolgorde|inversie|werkwoord|grammatica|vervoeg|lidwoord|enkelvoud|meervoud|plaats twee/i,
    spelling:/spelling|hoofdletter|leesteken|punt|komma/i,
    samenhang:/samenhang|verbind|volgorde van de zinnen/i
  };
  const losses = WRITING_CRITERIA.map(criterion=>{
    // Zero content makes all criteria zero. That is not evidence of a separate grammar/spelling deficit.
    const affected = rows.filter(row=>row.status === "scored" &&
      (criterion === "inhoud" || row.scores.inhoud > 0) && row.max[criterion] > row.scores[criterion]);
    affected.sort((a,b)=>(b.max[criterion]-b.scores[criterion])-(a.max[criterion]-a.scores[criterion]));
    const row = affected[0];
    if (!row) return null;
    const contentGate = criterion === "inhoud" && affected.some(r=>r.scores.inhoud < (r.type === "sentence" ? 1 : 2));
    let action = {kind:"task",key:row.key};
    if (criterion === "grammatica" && row.errors.some(e=>e && /woordvolgorde|inversie|plaats twee|werkwoord.*aan het eind/i.test(String(e.why || ""))))
      action = {kind:"section",section:row.part === "wb" ? "w1" : "wo"};
    const evidence = row.errors.find(error=>error && typeof error.wrong === "string" && typeof error.right === "string" &&
      error.wrong && error.right && error.wrong !== error.right && reasons[criterion].test(String(error.why || "")));
    return {criterion, lost:affected.reduce((sum,r)=>sum+r.max[criterion]-r.scores[criterion],0),
      evidence:evidence?{wrong:evidence.wrong,right:evidence.right,why:String(evidence.why || "")}:null,
      instruction:advice[criterion], action, taskNumber:row.number, contentGate};
  }).filter(Boolean).sort((a,b)=>Number(b.contentGate)-Number(a.contentGate) || b.lost-a.lost);
  candidates.push(...losses);
  const selected = [], actions = new Set();
  for (const item of candidates) {
    const key = JSON.stringify(item.action);
    if (actions.has(key)) continue;
    actions.add(key);selected.push(item);
    if (selected.length === 2) break;
  }
  return selected;
}
function reviewWriting(tasks, answers, grades) {
  const byKey = new Map(answers.map((answer,i)=>[answer.q.k,{answer,result:grades[i]}]));
  const rows = tasks.map((task,i)=>{
    const {answer,result} = byKey.get(task.k) || {};
    const max = writingMax(task), attempted = !!answer && !!(answer.text?.trim() || answer.form?.trim());
    const scored = attempted && validWritingScores(result?.scores,max);
    const scores = Object.fromEntries(WRITING_CRITERIA.map(key=>[key,scored && max[key] ? result.scores[key] : 0]));
    return {key:task.k, number:i+1, part:task.sec, type:writingTaskType(task), max, scores,
      maxPoints:writingPoints(max), earned:writingPoints(scores),
      status:!attempted ? "empty" : scored ? "scored" : "unscored",
      errors:Array.isArray(result?.errors) ? result.errors : []};
  });
  const typeIds = tasks[0]?.sec === "wb" ? ["sentence","form","email"] : ["form","message","text","formal"];
  if (rows.some(row=>row.type === "other")) typeIds.push("other");
  const types = typeIds.map(id=>{
    const group = rows.filter(row=>row.type === id);
    return {id, tasks:group.length, earned:group.reduce((n,row)=>n+row.earned,0),
      max:group.reduce((n,row)=>n+row.maxPoints,0), complete:group.every(row=>row.status !== "unscored")};
  });
  const criteria = WRITING_CRITERIA.map(id=>({id,
    earned:rows.reduce((n,row)=>n+row.scores[id],0), max:rows.reduce((n,row)=>n+row.max[id],0),
    complete:rows.every(row=>!row.max[id] || row.status !== "unscored")
  }));
  const complete = rows.every(row=>row.status !== "unscored");
  const earned = rows.reduce((n,row)=>n+row.earned,0), max = rows.reduce((n,row)=>n+row.maxPoints,0);
  return {rows,types,criteria,complete,earned,max,percent:complete && max ? Math.round(earned/max*100) : null,
    unfinished:rows.filter(row=>row.status === "empty").length, priorities:writingPriorities(rows)};
}
function writingSnapshot(review) {
  if (!review.complete) return null;
  return {v:1, types:review.types.filter(row=>row.max).map(({id,tasks,earned,max})=>({id,tasks,earned,max})),
    criteria:review.criteria.filter(row=>row.max).map(({id,earned,max})=>({id,earned,max})), unfinished:review.unfinished};
}
function writingHistory(results) {
  const validType = row => row && Object.hasOwn(WRITING_LABELS,row.id) &&
    Number.isInteger(row.earned) && Number.isInteger(row.max) && row.max > 0 &&
    row.earned >= 0 && row.earned <= row.max && Number.isInteger(row.tasks) && row.tasks > 0;
  const attempts = results.filter(row=>row?.writing?.v === 1 && Array.isArray(row.writing.types))
    .map(result=>result.writing.types.filter(validType)).filter(types=>types.length).slice(-5);
  const groups = new Map();
  for (const types of attempts) for (const row of new Map(types.map(row=>[row.id,row])).values()) {
    const group = groups.get(row.id) || {id:row.id,earned:0,max:0,tasks:0,attempts:0};
    group.earned+=row.earned;group.max+=row.max;group.tasks+=row.tasks;group.attempts++;
    groups.set(row.id,group);
  }
  return {attempts:attempts.length,types:[...groups.values()]};
}
