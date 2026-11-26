// Made-up Schrijven A2 answers for the owner's model comparison (api/compare.js): from good to weak, with the kinds of
// errors learners make (word order, verb forms, de/het, spelling, a missing point, the wrong tone). Not DUO's material.
export const SAMPLES = [
  { id: "buurvrouw", task: "Je gaat een week op vakantie. Schrijf een briefje aan je buurvrouw. Vraag of zij je planten water wil geven en schrijf waar de sleutel ligt.",
    text: "Beste Anja,\nVolgende week ga ik op vakantie naar Spanje. Wil jij mijn planten water geven? De planten staan in de keuken en in de woonkamer. De sleutel ligt onder de mat bij de achterdeur. Zaterdag kom ik terug.\nHeel erg bedankt!\nGroeten,\nSamira" },
  ...[
    ["sleutel-ontbreekt", "Kun je mijn planten water geven?"],
    ["sleutel-compleet", "Kun je mijn planten water geven? De sleutel ligt in je brievenbus."],
    ["sleutel-alternatief", "Wil je mijn planten water geven? Je vindt de sleutel in je brievenbus."],
  ].map(([id, request]) => ({
    id, task: "Je gaat op vakantie. Vraag je buurvrouw om je planten water te geven en zeg waar de sleutel ligt.",
    text: `Hoi buurvrouw, ik ga op vakantie. ${request} Bedankt! Groetjes, Noor`,
  })),
  { id: "ziek", task: "Je bent ziek en kunt morgen niet naar je werk. Schrijf een e-mail aan je leidinggevende, meneer De Vries. Schrijf wat je hebt, hoe lang je denkt thuis te blijven en vraag wat er met je afspraken moet gebeuren.",
    text: "Beste meneer De Vries,\nIk ben ziek. Ik heb koorts en hoofdpijn. Ik denk ik blijf twee dagen thuis. Morgen ik heb een afspraak met een klant om tien uur. Kan een collega die afspraak doen?\nMet vriendelijke groet,\nAhmed" },
  { id: "verjaardag", task: "Je vriendin Lotte heeft je uitgenodigd voor haar verjaardag op zaterdag. Je kunt niet komen. Schrijf haar een berichtje. Feliciteer haar, schrijf waarom je niet kunt komen en stel voor om een andere keer af te spreken.",
    text: "Hoi Lotte,\nGefeliciteerd met je verjaardag! Helaas ik kan niet komen op zaterdag, want mijn moeder komt uit Turkije en ik moet haar ophalen van Schiphol. Zullen we volgende week samen koffie drinken?\nLiefs,\nElif" },
  { id: "school", task: "Je zoon Daan is morgen ziek. Schrijf een e-mail aan de juf, mevrouw Bakker. Schrijf dat Daan niet naar school komt, wat hij heeft en vraag of hij huiswerk kan krijgen.",
    text: "Hallo mevrouw Bakker,\nDaan komt morgen niet naar school. Hij is ziek, hij heeft buikpijn en hij moet overgeven. Kan hij de huiswerk krijgen? Dan hij kan thuis werken.\nGroetjes,\nmoeder van Daan" },
  { id: "huisbaas", task: "De verwarming in je huis is kapot. Schrijf een e-mail aan de huisbaas, meneer Jansen. Schrijf wat er kapot is, sinds wanneer, en vraag wanneer iemand het kan maken.",
    text: "Beste meneer Jansen,\nDe verwarming is kapot sinds maandag. Het is heel koud in de huis. Mijn kinderen zijn verkouden. Wanneer kan iemand komen om de verwarming te maken? Ik ben elke dag thuis na drie uur.\nMet vriendelijke groet,\nPiotr Nowak" },
  { id: "cursus", task: "Je wilt je aanmelden voor een cursus koken in het buurthuis. Schrijf een e-mail. Vraag wanneer de cursus begint, hoeveel hij kost en of je je eigen messen moet meenemen.",
    text: "Hallo,\nIk wil graag mee doen met de cursus koken. Wanneer begint de cursus? En hoeveel kost het? Moet ik mijn eigen mesen mee nemen?\nGroet,\nFatima" },
  { id: "tandarts", task: "Je hebt morgen een afspraak bij de tandarts, maar je kunt niet komen. Schrijf een e-mail aan de tandartspraktijk. Schrijf waarom je niet kunt komen en vraag om een nieuwe afspraak.",
    text: "beste tandarts\nik kan morgen niet komen want ik moet werken. ik wil een nieuwe afspraak volgende week. ik kan maandag en dinsdag\ngroet\nraj" },
  { id: "fiets", task: "Je hebt een fiets gekocht in een winkel, maar de rem werkt niet goed. Schrijf een e-mail aan de winkel. Schrijf wanneer je de fiets hebt gekocht, wat er kapot is en wat je wilt.",
    text: "Goededag,\nIk heb een fiets gekoopt vorige week. De rem werk niet goed. Ik ben bang op de weg. Ik wil een andere fiets of mijn geld terug.\nGroet,\nYusuf" },
  { id: "buren", task: "Je nieuwe buren maken elke avond laat veel lawaai. Schrijf een briefje aan de buren. Stel jezelf voor, schrijf wat het probleem is en vraag of ze na tien uur stiller kunnen zijn.",
    text: "Hoi buren,\nik ben jullie buurman. Jullie maken altijd lawaai. Ik kan niet slapen. Dat is niet goed." },
  { id: "werk", task: "Je wilt solliciteren als schoonmaker bij een hotel. Schrijf een korte e-mail. Schrijf wie je bent, welke ervaring je hebt en wanneer je kunt werken.",
    text: "Ik heb gisteren naar de markt gegaan en ik heb appels en brood gekocht. Het weer was mooi. Daarna ik ben naar huis gegaan." },
];
