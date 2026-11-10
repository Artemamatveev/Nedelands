// Conversations, history chapters, built-in books, the paintings and the photo descriptions.
// Loaded by oefenen.html before the app's own script; edit here, then run `node tools/stamp.mjs`.
// Schilderij van de dag: public-domain works, images in /art (from Wikimedia Commons).
// y = vertical focus (%) for the header crop.
const ART=[
 {f:"melkmeisje",y:24,a:"Johannes Vermeer",t:"Het melkmeisje",d:"ca. 1660",m:"Rijksmuseum, Amsterdam",
  nl:"Een dienstmeid schenkt melk in een kom. Op tafel ligt brood.",
  w:"de kan=jug|het brood=bread|de mand=basket|het raam=window",
  v:"Johannes Vermeer woonde zijn hele leven in Delft. Hij werkte heel langzaam: we kennen maar ongeveer 34 schilderijen van hem.\nOp dit schilderij werkt een dienstmeid in de keuken. Ze schenkt heel voorzichtig melk in een kom. Vermeer schilderde het licht van het raam op de muur, op het brood en op haar kleren.\nHet Rijksmuseum kocht het schilderij in 1908. Nu is het een van de bekendste schilderijen van Nederland."},
 {f:"oranje",y:36,a:"Adriaen Thomasz. Key",t:"Willem van Oranje",d:"ca. 1579",m:"Rijksmuseum, Amsterdam",
  nl:"Willem van Oranje heet de Vader des Vaderlands. Het Wilhelmus, het volkslied, gaat over hem.",
  w:"de baard=beard|de snor=moustache|de kraag=collar|de muts=cap",
  v:"Willem van Oranje leefde van 1533 tot 1584. Hij was de leider van de opstand tegen de Spaanse koning Filips II. Daarom heet hij de Vader des Vaderlands.\nIn 1584 werd hij in Delft vermoord. Hij ligt begraven in de Nieuwe Kerk in Delft.\nHet Wilhelmus, het Nederlandse volkslied, gaat over hem. De koninklijke familie heet nog steeds Oranje-Nassau. Daarom dragen veel Nederlanders oranje op Koningsdag."},
 {f:"avercamp",y:55,a:"Hendrick Avercamp",t:"Winterlandschap met schaatsers",d:"ca. 1608",m:"Rijksmuseum, Amsterdam",
  nl:"In de winter schaatsen jong en oud op het ijs. Schaatsen is in Nederland nog steeds populair.",
  w:"het ijs=ice|de schaats=skate|de kerk=church|de boom=tree",
  v:"Hendrick Avercamp woonde in Kampen. Hij kon niet praten en waarschijnlijk ook niet horen. Daarom noemden de mensen hem ‘de Stomme van Kampen’.\nHij schilderde vaak de winter. In zijn tijd waren de winters heel koud: de rivieren en de grachten waren vaak bevroren.\nOp dit schilderij zie je arme en rijke mensen samen op het ijs. Ze schaatsen, spelen en praten. Kijk goed: er gebeuren heel veel kleine dingen."},
 {f:"vangogh",y:40,a:"Vincent van Gogh",t:"Zelfportret",d:"1887",m:"Rijksmuseum, Amsterdam",
  nl:"Vincent van Gogh kwam uit Brabant. Hij maakte meer dan 800 schilderijen.",
  w:"de hoed=hat|de baard=beard|de jas=jacket|het gezicht=face",
  v:"Vincent van Gogh werd in 1853 geboren in Zundert, in Brabant. In 1886 ging hij naar Parijs, naar zijn broer Theo.\nIn Parijs zag hij het werk van andere moderne schilders. Hij ging lichter schilderen, met veel kleur en korte streepjes.\nHij had weinig geld voor een model. Daarom schilderde hij vaak zichzelf: in Parijs maakte hij meer dan twintig zelfportretten. Dit is er een uit 1887."},
 {f:"delft",y:60,a:"Johannes Vermeer",t:"Gezicht op Delft",d:"ca. 1660–1661",m:"Mauritshuis, Den Haag",
  nl:"Dit is de stad Delft. Delft is bekend om het blauwe aardewerk: Delfts blauw.",
  w:"de stad=city|het water=water|de wolk=cloud|de boot=boat",
  v:"Dit is de stad van Johannes Vermeer: Delft. Hij schilderde de stad vanaf de andere kant van het water.\nJe ziet de oude stadspoorten, boten en een paar mensen aan de kant. De wolken zijn donker, maar de zon schijnt op de daken.\nRechts van het midden zie je de lichte toren van de Nieuwe Kerk. In die kerk ligt Willem van Oranje begraven."},
 {f:"leyster",y:28,a:"Judith Leyster",t:"Zelfportret",d:"ca. 1630",m:"National Gallery of Art, Washington",
  nl:"Judith Leyster was een schilder uit Haarlem. In 1633 werd ze lid van het schildersgilde.",
  w:"het penseel=paintbrush|de viool=violin|de kraag=collar|de stoel=chair",
  v:"Judith Leyster werd in 1609 in Haarlem geboren. In die tijd waren er maar weinig vrouwen die schilder waren.\nIn 1633 werd ze lid van het schildersgilde van Haarlem. Dat was heel bijzonder. Ze had een eigen atelier en ook leerlingen.\nOp dit zelfportret zit ze voor haar schilderij en kijkt ze ons vrolijk aan. Ze schildert een man met een viool. Lang dachten mensen dat haar schilderijen van Frans Hals waren."},
 {f:"steen",y:50,a:"Jan Steen",t:"Het vrolijke huisgezin",d:"1668",m:"Rijksmuseum, Amsterdam",
  nl:"Iedereen zingt, drinkt en maakt muziek. Een rommelig huis noem je ‘een huishouden van Jan Steen’.",
  w:"de familie=family|de tafel=table|de hond=dog|het raam=window",
  v:"Jan Steen kwam uit Leiden. Later had hij daar een herberg, een soort café.\nHij schilderde vaak gezinnen waar het druk en rommelig is. Op dit schilderij zingen de vader, de moeder en de oma heel hard. De kinderen doen alles na: een jongen en een meisje roken zelfs een pijp.\nOp de schoorsteen hangt een papier met een oude zin: zoals de ouden zongen, zo piepen de jongen. Dat betekent: kinderen doen wat hun ouders doen. Een rommelig huis heet nog steeds ‘een huishouden van Jan Steen’."},
 {f:"erasmus",y:30,a:"Hans Holbein de Jonge",t:"Erasmus",d:"1523",m:"Louvre, Parijs",
  nl:"Erasmus kwam uit Rotterdam. De Erasmusbrug en de Erasmus Universiteit zijn naar hem genoemd.",
  w:"het boek=book|de pen=pen|de muts=cap|de ring=ring",
  v:"Erasmus werd rond 1466 in Rotterdam geboren. Hij was een van de beroemdste denkers van Europa. Hij schreef veel boeken, in het Latijn, en reisde door heel Europa.\nHans Holbein was een Duitse schilder. Hij schilderde Erasmus terwijl hij schrijft. Erasmus stuurde zulke portretten naar zijn vrienden.\nNu dragen een brug en een universiteit in Rotterdam zijn naam. Ook het Erasmus-programma heet naar hem: daarmee studeren jonge Europeanen een tijd in een ander land."},
 {f:"nachtwacht",y:60,a:"Rembrandt van Rijn",t:"De Nachtwacht",d:"1642",m:"Rijksmuseum, Amsterdam",
  nl:"De schutters van Amsterdam gaan op pad. Het schilderij is bijna vier meter hoog.",
  w:"de hoed=hat|de trommel=drum|het meisje=girl|het geweer=gun",
  v:"Rembrandt schilderde dit grote schilderij in 1642 voor de schutters van Amsterdam. Schutters waren burgers die de stad moesten beschermen.\nOp andere groepsportretten staan mensen netjes naast elkaar. Hier niet: de mannen gaan op pad, er is beweging en licht.\nLater werd het schilderij donker door een oude laag vernis. Toen dachten mensen dat het nacht was. Zo kreeg het de naam De Nachtwacht. Maar Rembrandt schilderde de dag."},
 {f:"mondriaan",y:35,a:"Piet Mondriaan",t:"Compositie met rood, geel, blauw en zwart",d:"1921",m:"Kunstmuseum Den Haag",
  nl:"Mondriaan kwam uit Amersfoort. Hij werd beroemd met rechte lijnen en rood, geel en blauw.",
  w:"rood=red|geel=yellow|blauw=blue|de lijn=line",
  v:"Piet Mondriaan werd in 1872 in Amersfoort geboren. Eerst schilderde hij landschappen, bomen en molens.\nLangzaam werden zijn schilderijen steeds eenvoudiger. Op het eind gebruikte hij alleen rechte zwarte lijnen en de kleuren rood, geel en blauw, met wit en grijs.\nHij woonde lang in Parijs en later in New York. Zijn stijl zie je nu overal: op kleding, op posters en op gebouwen."},
 {f:"brief",y:10,a:"Johannes Vermeer",t:"Brieflezende vrouw in het blauw",d:"ca. 1663",m:"Rijksmuseum, Amsterdam",
  nl:"Een vrouw leest een brief. Van wie is de brief? Dat weten we niet.",
  w:"de brief=letter|de kaart=map|de stoel=chair|de muur=wall",
  v:"Ook dit schilderij is van Johannes Vermeer. Een vrouw in een blauwe jas leest een brief. Ze is helemaal stil.\nAan de muur hangt een kaart van Holland. Van wie is de brief? Misschien van iemand die ver weg is. Vermeer vertelt het niet: dat mag je zelf bedenken.\nHet blauw is ultramarijn. Die verf was heel duur: hij werd gemaakt van een blauwe steen uit Afghanistan."},
 {f:"spinoza",y:32,a:"Onbekende schilder",t:"Baruch de Spinoza",d:"ca. 1665",m:"Herzog August Bibliothek, Wolfenbüttel",
  nl:"Spinoza was een filosoof uit Amsterdam. Hij schreef over God, de natuur en vrijheid.",
  w:"het haar=hair|de kraag=collar|het gezicht=face|de ogen=eyes",
  v:"Baruch de Spinoza werd in 1632 in Amsterdam geboren. Zijn familie was Joods en kwam uit Portugal.\nHij dacht heel vrij over God, de natuur en de mens. Daarom moest hij in 1656 de Joodse gemeenschap van Amsterdam verlaten.\nHij verdiende geld met het slijpen van glazen lenzen, voor brillen en microscopen. Hij woonde in Rijnsburg, Voorburg en Den Haag. In 1677 stierf hij in Den Haag."},
 {f:"molen",y:45,a:"Jacob van Ruisdael",t:"De molen bij Wijk bij Duurstede",d:"ca. 1670",m:"Rijksmuseum, Amsterdam",
  nl:"Molens horen bij Nederland. Er staan nog meer dan duizend molens.",
  w:"de molen=windmill|het water=water|de wolk=cloud|de boot=boat",
  v:"Jacob van Ruisdael kwam uit Haarlem. Hij schilderde vooral landschappen: de lucht, het water, bomen en molens.\nDeze molen staat bij Wijk bij Duurstede, een stadje aan de rivier de Lek. De molen is groot en donker tegen de grijze lucht.\nMolens maalden graan en pompten water uit de polders. Zonder molens kon je in een groot deel van Nederland niet wonen."},
 {f:"rembrandt",y:30,a:"Rembrandt van Rijn",t:"Zelfportret als de apostel Paulus",d:"1661",m:"Rijksmuseum, Amsterdam",
  nl:"Dit is Rembrandt zelf. Hij woonde in Amsterdam. Zijn huis is nu een museum.",
  w:"de tulband=turban|het boek=book|het gezicht=face|de mantel=cloak",
  v:"Rembrandt van Rijn werd in 1606 in Leiden geboren. Later woonde en werkte hij in Amsterdam.\nHij schilderde zichzelf heel vaak: er zijn ongeveer veertig geschilderde zelfportretten van hem. Op dit schilderij is hij oud. Hij is verkleed als de apostel Paulus, uit de Bijbel.\nRembrandt gaf te veel geld uit. In 1656 kon hij zijn schulden niet meer betalen. Zijn huis in Amsterdam is nu een museum: het Rembrandthuis."},
 {f:"aardappeleters",y:40,a:"Vincent van Gogh",t:"De aardappeleters",d:"1885",m:"Van Gogh Museum, Amsterdam",
  nl:"Een arme familie eet aardappelen. Ze hebben de hele dag op het land gewerkt.",
  w:"de familie=family|de lamp=lamp|de aardappel=potato|de tafel=table",
  v:"Vincent van Gogh schilderde dit in 1885 in Nuenen, in Brabant. Hij wilde laten zien hoe arme boeren leven.\nDe familie eet aardappels die ze zelf op het land hebben gehaald. Daarom zijn de handen en de gezichten grof en zijn de kleuren donker.\nVan Gogh vond het zelf een van zijn beste schilderijen. Maar toen hij leefde, verkocht hij bijna niets."},
 {f:"parel",y:45,a:"Johannes Vermeer",t:"Meisje met de parel",d:"ca. 1665",m:"Mauritshuis, Den Haag",
  nl:"Niemand weet wie dit meisje is. Ze draagt een blauwe tulband en een grote parel.",
  w:"de parel=pearl|de tulband=turban|de kraag=collar|de mond=mouth",
  v:"Ook dit schilderij is van Johannes Vermeer. Het is geen portret van een echte persoon, maar een ‘tronie’: een schilderij van een gezicht met bijzondere kleren.\nHet meisje draagt een blauwe tulband en een grote parel. Misschien is het geen echte parel, maar een namaakparel van glas of tin. Niemand weet het zeker.\nHet schilderij hangt in het Mauritshuis in Den Haag. Mensen noemen het soms de Mona Lisa van het Noorden."}
];
// A Lezen text as a document. The first line is the title of a notice or advert;
// "label: value" lines become a table; an e-mail gets its header (Van, Aan, Onderwerp) on top
// Spreken pictures (photos in /foto, sources in foto/CREDITS.md): two side by side to choose from,
// or three in order, numbered. FOTO describes each photo for screen readers.
const FOTO={deltawerken:"de bouw van de stormvloedkering in de Oosterschelde",afsluitdijk:"auto's op de Afsluitdijk, met het monument",binnenhof:"het Binnenhof in Den Haag, met de Tweede Kamer",annefrank:"huizen aan de Prinsengracht in Amsterdam, met het huis van Anne Frank",stemmen:"mensen stemmen in een stembureau",prinsjesdag:"de Gouden Koets op Prinsjesdag, met veel mensen langs de weg",voc:"een schilderij van schepen van de VOC voor de kust",watersnood:"mensen brengen hun koeien in veiligheid na de watersnood van 1953",slavernij:"het Nationaal Monument Slavernijverleden in Amsterdam",gastarbeiders:"gastarbeiders lezen een Nederlandse krant",indonesie:"koningin Juliana tekent de soevereiniteitsoverdracht aan Indonesië",bevrijding:"mensen vieren de bevrijding in Amsterdam in 1945",thorbecke:"een portret van Johan Rudolf Thorbecke",aletta:"een portret van Aletta Jacobs",fiets:"een fiets",auto:"een auto",stad:"huizen aan een gracht in de stad",dorp:"een dorp met water en bruggetjes",
  supermarkt:"boodschappen doen in de supermarkt",koken:"een man en een vrouw koken",eten:"een gezin eet samen",restaurant:"twee mensen eten in een restaurant",
  wekker:"een wekker",douche:"een douche",trein:"mensen stappen in de trein",zomer:"een park in de zomer",winter:"een fiets in de sneeuw",
  ziek:"iemand ligt ziek in bed",bellen:"een man belt",dokter:"een dokter praat met een patiënt",kok:"een kok in een keuken",
  tv:"een gezin kijkt televisie",boek:"een vrouw leest een boek",zwemmen:"mensen zwemmen in een zwembad",voetbal:"een voetbalwedstrijd",
  bus:"een bus",strand:"het strand",bergen:"de bergen",winkel:"een kledingwinkel",laptop:"iemand werkt op een laptop",hond:"een hond",kat:"een kat",
  hoofdpijn:"een man met hoofdpijn",pil:"iemand neemt een pil met water",bed:"iemand ligt in bed",pinnen:"betalen met een bankpas",
  fietsen:"een vrouw op de fiets",fietstocht:"een vrouw fietst",lekkeband:"een lekke band plakken",fietsenmaker:"een fietsenmaker repareert een fiets",
  ambulance:"een ambulance",apotheek:"medicijnen in de kast van een apotheek",kantoor:"een vergaderzaal op kantoor",kinderopvang:"kinderen eten samen op een kinderdagverblijf, lang geleden",afval:"containers voor afval in de straat",baby:"een baby op een weegschaal, lang geleden",bakker:"brood bij de bakker",flat:"een flat",gemeentehuis:"een gemeentehuis",koningsdag:"Koningsdag: veel mensen op de vrijmarkt",markt:"een markt met groente en fruit",politie:"een politieauto",sollicitatie:"twee mannen praten aan een bureau",tandarts:"een tandarts helpt een patiënt",verhuizen:"een verhuiswagen in Amsterdam, lang geleden",verjaardag:"een verjaardagstaart met kaarsjes",
  fabriek:"veel mensen werken in een grote fabriek",paardwater:"een paard drinkt water",paardborstel:"een vrouw verzorgt haar paardje",paardlopen:"een vrouw loopt met een paard",ladekast:"een ladekast",fauteuil:"een fauteuil",tafel:"een tafel",studenten:"studenten lezen en schrijven samen aan een tafel",raam:"een kapot raam",sleutel:"een sleutel die in twee stukken is gebroken",cadeau:"een cadeau",konijn:"een konijn",siroop:"een lepel met hoestsiroop",kleed:"een vierkant vloerkleed",kleedrond:"een rond vloerkleed",stel:"een blij stel: de vrouw zit op de rug van de man en ze lachen"};
// Boekenkast: short A2 stories built in, plus the reader's own books.
// Own books live in IndexedDB ("books" = list, "book:<id>" = text); S only keeps positions (S.bk) and saved words (S.words).
// Book text: paragraphs separated by \n, chapters by \f, "# " marks a heading.
const BOOKS=[
{id:"lena",t:"Een nieuw begin",a:"Verhaal op A2-niveau",c:[
["De verhuizing",`Lena is tweeëndertig jaar. Ze komt uit een grote stad ver weg, maar nu woont ze in Utrecht. Haar man Pavel werkt bij een bedrijf in de stad. Ze hebben een klein appartement op de derde verdieping, vlak bij het station. Er is geen lift, dus Lena loopt elke dag veel trappen.
De eerste week is moeilijk. Het regent bijna elke dag en Lena kent niemand. In de supermarkt begrijpt ze de mensen niet goed. Ze praten zo snel! Maar Lena wil Nederlands leren. Ze koopt een schrift en een woordenboek. Elke avond schrijft ze tien nieuwe woorden op.
'Na een jaar ken ik drieduizend woorden,' zegt ze tegen Pavel.
Pavel lacht. 'Dan spreek jij beter Nederlands dan ik.'`],
["Naar de gemeente",`Op maandag heeft Lena een afspraak bij de gemeente. Ze moet zich inschrijven, want ze woont nu in Utrecht. Ze neemt haar paspoort en het huurcontract mee.
Bij de balie zit een vriendelijke vrouw. 'Goedemorgen. Mag ik uw paspoort zien?' vraagt ze.
Lena geeft haar paspoort. De vrouw typt iets op de computer. Na tien minuten is alles klaar.
'U krijgt een burgerservicenummer,' zegt de vrouw. 'Dat is uw BSN. U heeft het nodig bij de huisarts, bij de bank en op uw werk.'
'Dank u wel,' zegt Lena. Buiten op straat glimlacht ze. Ze heeft het hele gesprek in het Nederlands gedaan!`],
["Een fiets",`In Nederland heeft bijna iedereen een fiets. Lena wil ook een fiets. Een nieuwe fiets is duur, dus ze zoekt op internet naar een tweedehands fiets. Ze vindt een blauwe fiets voor negentig euro.
Op zaterdag gaat ze met Pavel naar de verkoper. De fiets is oud, maar hij rijdt goed. 'Koop ook twee goede sloten,' zegt de verkoper. 'In de stad worden veel fietsen gestolen.'
Op zondag fietst Lena voor het eerst door Utrecht. Het is druk. Overal zijn fietsers, en ze rijden snel. Lena steekt haar hand uit als ze linksaf gaat, net als de anderen. Bij het rode licht stopt ze. Na een uur is ze moe, maar blij. Nu voelt ze zich een echte Utrechtse.`],
["De buurvrouw",`Op een avond gaat de bel. Het is de buurvrouw, mevrouw De Vries. Ze is ongeveer zeventig jaar en ze woont al veertig jaar in dit gebouw.
'Welkom in de straat!' zegt ze. 'Ik heb een appeltaart voor jullie gebakken.'
Lena is verrast. 'Wat lief! Komt u binnen? Wilt u koffie of thee?'
'Graag koffie,' zegt mevrouw De Vries.
Ze praten een uur. Mevrouw De Vries vertelt over de buurt: waar de markt is, welke bakker het lekkerste brood heeft en op welke dag het oud papier wordt opgehaald. Lena vertelt over haar cursus Nederlands.
'U spreekt al goed Nederlands,' zegt de buurvrouw.
'Nog niet zo goed,' zegt Lena. 'Maar elke dag een beetje beter.'`]]},
{id:"museum",t:"Een dag in het Rijksmuseum",a:"Verhaal op A2-niveau",c:[
["Een cadeau",`Ahmed is jarig. Van zijn vrouw Fatima krijgt hij een Museumkaart. 'Met deze kaart kun je een jaar lang gratis naar honderden musea in Nederland,' zegt ze.
Ahmed is blij. Hij wil eerst naar het Rijksmuseum in Amsterdam. Daar hangen de beroemdste schilderijen van Nederland.
Op zaterdag nemen ze de trein naar Amsterdam Centraal. Daarna gaan ze met de tram naar het museum. Het Rijksmuseum is een groot gebouw van rode baksteen uit 1885. Ahmed en Fatima hebben online een tijd gereserveerd, dus ze kunnen meteen naar binnen.`],
["De Nachtwacht",`In de grootste zaal hangt De Nachtwacht van Rembrandt. Er staan veel mensen voor het schilderij. Het is enorm: bijna vier meter hoog en meer dan vier meter breed.
Rembrandt maakte het schilderij in 1642. Je ziet een groep mannen met wapens. Ze zijn schutters: ze moesten de stad beschermen. In het midden lopen de kapitein, in het zwart, en zijn luitenant, in het geel.
'Waarom heet het De Nachtwacht?' vraagt Fatima. 'Het is toch geen nacht?'
Ahmed leest het bordje naast het schilderij. 'Je hebt gelijk. Het schilderij werd door oude vernis heel donker. Daarom dachten mensen later dat het nacht was.'`],
["Het melkmeisje",`Daarna zoeken ze een klein schilderij: Het melkmeisje van Johannes Vermeer. Het is veel kleiner dan Ahmed dacht, niet groter dan een krant.
Een jonge vrouw giet melk uit een kan. Ze draagt een gele jas en een blauwe schort. Door het raam valt licht op de tafel met brood.
'Kijk naar het licht,' zegt Fatima zachtjes. 'Het lijkt echt.'
Vermeer woonde in Delft. Hij schilderde langzaam en niet veel. Er zijn maar ongeveer vijfendertig schilderijen van hem bekend.
In het café van het museum drinken ze thee. 'Volgende maand gaan we naar het Mauritshuis in Den Haag,' zegt Ahmed. 'Daar hangt het Meisje met de parel, ook van Vermeer.'`]]},
{id:"koningsdag",t:"Koningsdag",a:"Verhaal op A2-niveau",c:[
["Alles is oranje",`Op 27 april is het Koningsdag. Dan is koning Willem-Alexander jarig. Hij is geboren op 27 april 1967. Valt 27 april op een zondag? Dan is Koningsdag een dag eerder, op zaterdag.
Op Koningsdag is bijna heel Nederland oranje. Mensen dragen oranje kleren, oranje hoeden en soms een oranje pruik. Overal hangen vlaggen. Waarom oranje? De koninklijke familie heet Van Oranje-Nassau.
Tom is tien jaar en zijn zus Sara is zeven. Ze zijn al vroeg wakker. Vandaag gaan ze met hun moeder naar de vrijmarkt.`],
["De vrijmarkt",`Op Koningsdag mag iedereen op straat spullen verkopen. Dat heet de vrijmarkt. Tom en Sara leggen een groot kleed op de stoep. Daarop leggen ze oude boeken, speelgoed en een puzzel.
'Hoeveel kost deze auto?' vraagt een jongen.
'Eén euro,' zegt Tom.
'Mag het voor vijftig cent?'
Tom denkt even na. 'Oké, vijftig cent.'
Sara zingt een liedje en speelt op haar blokfluit. Voor haar staat een hoedje. Sommige mensen gooien er een paar munten in. Hun moeder drinkt koffie en praat met de buren.`],
["Spelletjes",`Na de lunch zijn er spelletjes in het park. Het leukste spel is koekhappen. Aan een touw hangen stukken ontbijtkoek. Je mag je handen niet gebruiken. Je moet de koek met je mond pakken.
Sara wint! Ze heeft overal kruimels op haar gezicht.
Op televisie zien ze de koning en de koningin. Ze bezoeken elk jaar een andere stad of een ander dorp. Mensen zwaaien met vlaggen en roepen: 'Lang leve de koning!'
's Avonds tellen Tom en Sara hun geld. Ze hebben drieëntwintig euro verdiend. 'Van dat geld kopen we morgen een ijsje,' zegt Tom. 'Voor iedereen.'`]]},
{id:"sinterklaas",t:"Sinterklaas",a:"Verhaal op A2-niveau",c:[
["De intocht",`Elk jaar in november komt Sinterklaas naar Nederland. Volgens het verhaal komt hij uit Spanje, met een stoomboot. Hij is een oude man met een lange witte baard. Hij draagt een rode mantel en een hoge rode muts: een mijter. Hij rijdt op een wit paard.
Zijn helpers heten Pieten. Ze geven de kinderen pepernoten en ze maken grapjes.
Mila is zes jaar. Met haar vader staat ze aan de haven. Er staan heel veel kinderen. Ze zingen liedjes. Dan komt de boot! Sinterklaas zwaait naar de kinderen. Mila zwaait terug. Haar ogen zijn heel groot.`],
["Schoen zetten",`Een paar keer in de weken voor Sinterklaas mag Mila haar schoen zetten. 's Avonds zet ze haar schoen bij de deur. Ze doet er een tekening voor Sinterklaas in, en een wortel voor het paard.
Dan zingt ze een liedje en gaat ze naar bed.
De volgende ochtend rent Mila naar de deur. De wortel is weg! In haar schoen zit een chocoladeletter: een grote M van chocola. Er liggen ook kruidnoten naast.
'Papa, het paard heeft de wortel opgegeten!' roept ze.
Haar vader lacht. 'Dan had het paard zeker veel honger.'`],
["Pakjesavond",`Op 5 december is het pakjesavond. De hele familie komt bij elkaar. Opa en oma zijn er ook.
Om zeven uur wordt er hard op de deur geklopt. Als Mila de deur opendoet, staat er een grote zak met cadeautjes. Sinterklaas zelf is al weg.
De volwassenen geven elkaar een surprise: een cadeau in een grappige verpakking, met een gedicht. Oom Kees krijgt een grote papieren fiets. In het gedicht staat dat hij altijd te laat komt. Iedereen lacht, oom Kees ook.
Op 6 december is Sinterklaas jarig. Daarna gaat hij terug naar Spanje. 'Tot volgend jaar, Sinterklaas!' zegt Mila.`]]},
{id:"zorg",t:"Nachtdienst",a:"Verhaal op B1-niveau",c:[
["De eerste nacht",`Toen Amira twee jaar geleden in Nederland kwam, had ze een diploma als verpleegkundige uit Aleppo. Ze dacht dat ze meteen in een ziekenhuis zou kunnen werken. Dat bleek niet zo te zijn. Eerst moest ze Nederlands leren, daarna moest haar diploma worden beoordeeld, en uiteindelijk moest ze nog een jaar extra opleiding volgen. ‘Het voelde alsof ik helemaal opnieuw begon,’ vertelde ze later aan haar zus.
Maar nu was het zover. Op een dinsdagavond om kwart over tien fietste ze door de regen naar het ziekenhuis in Utrecht, voor haar eerste nachtdienst op de afdeling longziekten. Ze was zenuwachtig. Niet omdat ze het werk niet kende, maar omdat ze bang was dat ze haar collega's niet goed zou begrijpen. Nederlanders praten snel, zeker als ze haast hebben, en in een ziekenhuis heeft iedereen haast.
Bij de balie stond een lange vrouw met grijs haar. ‘Jij bent Amira? Ik ben Joke. We werken vannacht samen.’ Joke gaf haar een kop thee en een lijst met de namen van de patiënten. ‘Achttien bedden, twee verpleegkundigen. Als het rustig is, valt het mee. Als het druk is, merk je pas om zes uur 's ochtends dat je nog niet hebt gegeten.’
Amira lachte, een beetje te hard. Joke keek haar aan. ‘Spannend?’ Amira knikte. ‘Weet je wat ik op mijn eerste dag deed?’ zei Joke. ‘Ik heb een patiënt de verkeerde pillen willen geven. Gelukkig zag mijn collega het. Daarom controleren we hier alles met z'n tweeën. Je hoeft het niet alleen te doen.’
Die zin bleef de hele nacht in Amira's hoofd: je hoeft het niet alleen te doen.`],
["Meneer De Wit",`Rond drie uur 's nachts ging het belletje in kamer 7. Daar lag meneer De Wit, een man van zevenentachtig met een longontsteking. Amira liep naar binnen. Hij zat rechtop in bed en keek angstig om zich heen.
‘Waar ben ik?’ vroeg hij. ‘Waar is Riek?’
Amira wist uit het dossier dat Riek zijn vrouw was, en dat ze twee jaar geleden was overleden. Ze ging naast zijn bed zitten. ‘U bent in het ziekenhuis, meneer De Wit. U bent ziek, maar het gaat al wat beter. Het is midden in de nacht.’
Hij keek naar haar. ‘U praat anders. Waar komt u vandaan?’
‘Uit Syrië,’ zei ze.
‘Syrië,’ herhaalde hij langzaam. ‘Daar is het warm, hè? Riek wilde altijd naar warme landen. Maar ik had nooit tijd. Ik werkte altijd.’ Hij werd rustiger. Hij vertelde over zijn werk als timmerman, over het huis dat hij zelf had gebouwd, over Riek die elke zondag appeltaart bakte.
Amira luisterde. Ze begreep niet elk woord, want hij sprak een dialect dat ze niet kende. Maar ze begreep genoeg. Na twintig minuten viel hij in slaap, met zijn hand nog op de hare.
Toen ze terugkwam bij de balie, keek Joke op van de computer. ‘Dat duurde lang. Alles goed?’
‘Hij was in de war,’ zei Amira. ‘Hij zocht zijn vrouw.’
Joke knikte. ‘Dat gebeurt vaak 's nachts bij oudere mensen. Medicijnen helpen dan soms, maar praten helpt meestal beter. Je deed het goed.’ Ze schreef iets in het dossier. ‘Dat moeten we wel aan de dokter doorgeven. Zulke verwardheid kan ook betekenen dat de ontsteking erger wordt.’ Amira knikte. Dat had ze in Aleppo ook geleerd. Sommige dingen zijn in elk land hetzelfde.`],
["De ochtend",`Om zes uur werd het langzaam licht. De dagdienst kwam binnen, met verse koffie en natte jassen. Amira gaf de overdracht: per patiënt vertelde ze hoe de nacht was geweest, welke medicijnen waren gegeven en waar de dagdienst op moest letten. Ze had het van tevoren op een papiertje geschreven, in het Nederlands, met een paar woorden in het Arabisch ertussen, voor als ze het even niet meer wist. Ze had het papiertje niet nodig.
Bij kamer 7 zei ze: ‘Meneer De Wit was vannacht een tijdje verward. De dokter weet het. Hij praat graag over zijn vrouw, Riek. Als je dat weet, wordt hij snel rustig.’
Een jonge collega schreef het op. ‘Handig,’ zei hij. ‘Dat staat nergens in het dossier.’
Om half acht fietste Amira naar huis. Het regende niet meer. De stad werd wakker: kinderen op weg naar school, mensen met haast op weg naar het station. Zij ging nu slapen, terwijl de rest begon. Dat zou ze nog moeten leren.
Thuis stuurde ze een bericht naar haar zus: ‘Eerste nacht klaar. Moe, maar blij.’ Haar zus stuurde meteen terug: ‘Trots op je! Hoe waren je collega's?’
Amira dacht even na. Toen typte ze: ‘Ze controleren alles met z'n tweeën. Je hoeft het niet alleen te doen.’
Ze legde haar telefoon weg, trok de gordijnen dicht en viel binnen een minuut in slaap.`]]},
{id:"molen",t:"De molenaar van Kinderdijk",a:"Verhaal op B1-niveau",c:[
["Een werkstuk",`Sem was dertien en hij had een probleem: hij moest een werkstuk maken over ‘iets uit de Nederlandse geschiedenis’, en hij had geen idee. Zijn klasgenoten kozen de Tweede Wereldoorlog of de VOC. Sem vond dat saai. Iedereen deed dat.
‘Waarom vraag je het niet aan opa Bram?’ zei zijn moeder. ‘Die weet alles van vroeger.’
Opa Bram woonde in een klein huis aan de rivier de Lek, vlak bij Kinderdijk. Toen Sem hem belde, was hij meteen enthousiast. ‘Kom zaterdag maar langs. Dan laat ik je iets zien dat ze in de klas vast niet kennen.’
Op zaterdag fietsten ze samen over de dijk. Aan de ene kant stroomde de rivier, breed en grijs. Aan de andere kant lag een polder met smalle sloten, en daarin stonden negentien molens in twee lange rijen. Er liepen toeristen met camera's, en er klonk Japans, Duits en Spaans.
‘Weet je waarom die molens hier staan?’ vroeg opa.
‘Voor het meel?’ zei Sem.
Opa lachte. ‘Dat denkt iedereen. Nee, dit zijn watermolens. Ze maalden geen graan, ze pompten water. Dit land ligt lager dan de rivier. Als het regent, loopt het water de polder in, en dat water moet eruit. Anders zouden de boeren hier met hun voeten in het water staan. Eeuwenlang hebben deze molens het water uit de polder gemalen, dag en nacht als het moest. Daarom staan ze sinds 1997 op de Werelderfgoedlijst van UNESCO.’
Sem keek naar de molens. Hij had ze vaak gezien, op ansichtkaarten en op televisie. Maar hij had nooit gedacht dat ze ergens voor dienden.`],
["De molenaar",`Bij een van de molens stond een man in een blauwe overall. Opa Bram zwaaide. ‘Dat is Kees. Hij is molenaar. Hij woont in de molen.’
‘Woont hij in de molen?’ vroeg Sem verbaasd.
Kees liet hen binnen. Beneden was een kleine woonkamer met een kachel en een tafeltje. Langs een steile trap ging je naar boven, waar houten raderen en een lange as stonden. Alles rook naar hout en olie.
‘Vroeger woonde de molenaar hier met zijn hele gezin,’ vertelde Kees. ‘Soms met acht kinderen, in deze twee kamers. De molenaar moest altijd in de buurt zijn. Als de wind draaide, moest hij de kap van de molen meedraaien, anders werkte de molen niet goed. En bij storm moest hij de wieken stilzetten, anders kon de molen kapotgaan.’
‘Maar nu draaien ze toch niet meer echt?’ vroeg Sem.
‘Meestal niet,’ zei Kees. ‘Het water wordt nu weggepompt door gemalen met elektrische pompen. Maar de molens kunnen het nog steeds. Als de elektriciteit uitvalt, zijn wij er nog.’ Hij grijnsde. ‘En we houden het vak levend. Molenaar is een echt beroep, met een opleiding en een examen. Er zijn in Nederland meer dan duizend molens, en die hebben allemaal iemand nodig die ze verzorgt.’
Sem schreef alles op in zijn telefoon. Toen vroeg hij: ‘Was het niet eng, vroeger, zo dicht bij het water?’
Kees en opa Bram keken elkaar aan. ‘Vraag dat maar aan je opa,’ zei Kees.`],
["Februari 1953",`Op de terugweg zaten ze op een bankje op de dijk. Opa Bram keek lang naar de rivier.
‘Ik was zeven,’ zei hij toen. ‘Het was de nacht van 31 januari op 1 februari 1953. Er was een zware storm, en het water van de zee kwam heel hoog. In Zeeland en in het zuiden van Zuid-Holland braken de dijken door. Ruim achttienhonderd mensen zijn die nacht verdronken.’
Sem zei niets.
‘Wij woonden hier, aan de Lek. Hier ging het net goed. Maar ik weet nog dat mijn vader de hele nacht met andere mannen op de dijk stond, met zandzakken. En ik weet nog dat mijn moeder ons wakker maakte en zei dat we onze jassen moesten aantrekken, voor het geval dat. We hebben uren op de zolder gezeten. Ik was zo bang.’
‘En daarna?’ vroeg Sem zacht.
‘Daarna heeft Nederland besloten dat zoiets nooit meer mocht gebeuren. Ze hebben de Deltawerken gebouwd: grote dammen en keringen tegen de zee. Dat heeft tientallen jaren geduurd. Ik heb mijn hele leven gezien hoe dit land met het water leeft. Je kunt het niet verslaan, weet je. Je moet ermee leren leven.’
Thuis begon Sem meteen te schrijven. Zijn werkstuk ging niet over molens, en ook niet over de Deltawerken. Het ging over allebei, en over een jongen van zeven op een zolder, die bang was voor het water. Hij noemde het: ‘Leven met water’.
Twee weken later kreeg hij een 9. Onder het cijfer had zijn docent geschreven: ‘Waar heb je dit allemaal vandaan?’
Sem schreef terug: ‘Van mijn opa.’`]]}
];
// Geschiedenis van Nederland: short A2 chapters from the hunebedden to now (original texts; facts checked, they double as KNM material).
// g = heading of the period that starts here, y = years, s = one line for the list, p = picture (foto/ or art/), py = vertical focus in %,
// pc = caption, f = more pictures in the text [file, caption, after paragraph n], x = text (one paragraph per line),
// q = questions [question, right, wrong, wrong, note].
// Question keys are gs|<id>.<n>: append chapters and questions, don't reorder or rename them.
const GS=[
{id:"hunebed",g:"Lang geleden",y:"ca. 3400–3100 v.Chr.",t:"De hunebedden",s:"De oudste bouwwerken van Nederland",p:"foto/hunebed.jpg",py:60,pc:"Het grootste hunebed van Nederland, in Borger (Drenthe)",f:[["foto/reuzen.jpg","Reuzen bij een hunebed: een prent van rond 1660. Zo dachten mensen toen over de hunebedden.",4]],
x:`Hunebedden zijn de oudste bouwwerken van Nederland. Ze zijn ongeveer vijfduizend jaar oud. Een hunebed is gemaakt van grote stenen. Er staan stenen in een rij, en daarop liggen nog grotere stenen.
De stenen komen uit Scandinavië. In de ijstijd nam het ijs ze mee naar het noorden van Nederland. Later vonden de mensen de stenen op het land.
De bouwers van de hunebedden waren boeren. Ze hielden koeien en schapen en ze verbouwden graan. Een hunebed was een graf. De boeren begroeven er hun doden, samen met potten en andere spullen.
In Nederland zijn nog 54 hunebedden. Er liggen er 52 in Drenthe en twee in Groningen. Het grootste hunebed ligt in Borger. Daar is ook een museum: het Hunebedcentrum.
Vroeger dachten mensen dat reuzen de hunebedden hadden gebouwd. Hoe kregen de boeren die zware stenen op hun plaats? Dat weten we nog steeds niet precies.`,
q:[["Waar liggen de meeste hunebedden?","in Drenthe","in Zeeland","in Limburg","52 van de 54 hunebedden liggen in Drenthe. Twee liggen in Groningen."],
["Wat was een hunebed?","een graf","een huis","een kerk","De boeren begroeven er hun doden, met potten en andere spullen."],
["Hoe kwamen de grote stenen naar Nederland?","met het ijs, in de ijstijd","met schepen uit Noorwegen","met de Romeinen","In de ijstijd nam het ijs de stenen mee uit Scandinavië."]]},
{id:"romeinen",y:"12 v.Chr. – ca. 400",t:"De Romeinen",s:"De Rijn als grens van een groot rijk",p:"foto/civilis.jpg",py:40,pc:"De Bataven zweren samen tegen de Romeinen, in het jaar 69. Geschilderd door Rembrandt (1661–1662)",
x:`Ongeveer tweeduizend jaar geleden kwamen de Romeinen naar Nederland. Ze kwamen uit Italië en hadden een heel groot rijk. De rivier de Rijn werd de noordgrens van dat rijk. Die grens heet de limes.
Langs de Rijn bouwden de Romeinen forten, wegen en bruggen. Soldaten hielden er de wacht. Bij de forten ontstonden dorpen en steden. Utrecht en Nijmegen zijn zo begonnen. Nijmegen noemt zichzelf de oudste stad van Nederland.
Ten zuiden van de Rijn woonden de Bataven. Veel Bataven werden soldaat in het Romeinse leger. Ten noorden van de Rijn woonden de Friezen. Zij hoorden meestal niet bij het Romeinse rijk.
De Romeinen brachten nieuwe dingen mee: munten, wijn, badhuizen en het schrift. Rond het jaar 400 vertrokken de laatste soldaten.
Sinds 2021 staat de limes op de Werelderfgoedlijst van UNESCO. In Nederland vind je nog veel Romeinse sporen, bijvoorbeeld in het Rijksmuseum van Oudheden in Leiden.`,
q:[["Welke rivier was de grens van het Romeinse rijk?","de Rijn","de Maas","de Amstel","De grens langs de Rijn heet de limes."],
["Welke stad noemt zichzelf de oudste stad van Nederland?","Nijmegen","Amsterdam","Rotterdam","Nijmegen begon bij een Romeins fort."],
["Wie woonden ten zuiden van de Rijn?","de Bataven","de Friezen","de Spanjaarden","Veel Bataven werden soldaat in het Romeinse leger."]]},
{id:"steden",y:"ca. 1000–1500",t:"Dijken, dammen en steden",s:"Hoe Amsterdam en Rotterdam begonnen",p:"foto/amsterdam1538.jpg",py:50,pc:"Amsterdam in 1538, geschilderd door Cornelis Anthonisz",f:[["foto/elisabethsvloed.jpg","Dordrecht en de Sint-Elisabethsvloed van 1421, geschilderd rond 1490. In die nacht verdronken veel dorpen.",0]],
x:`In de middeleeuwen was een groot deel van Nederland nat. Er waren veel overstromingen. Daarom gingen de mensen dijken bouwen. Ze pompten ook water weg, later met windmolens. Zo maakten ze nieuw land: een polder.
Het water was gevaarlijk voor iedereen. Daarom werkten de mensen samen. Ze begonnen waterschappen. Een waterschap zorgt voor de dijken en voor schoon water. De waterschappen bestaan nog steeds. Ze horen bij de oudste democratische organisaties van Nederland.
Op veel plaatsen bouwden de mensen een dam in een rivier. Rond 1270 kwam er een dam in de Amstel. Zo ontstond Amsterdam. Bij een dam in de Rotte ontstond Rotterdam.
De steden werden steeds groter en rijker door handel. Schepen brachten graan, hout, vis en wijn. Steden als Deventer, Kampen en Zwolle hoorden bij de Hanze: een groep handelssteden rond de Noordzee en de Oostzee.`,
q:[["Hoe is de naam Amsterdam ontstaan?","door een dam in de Amstel","door een kasteel aan zee","door een Romeins fort","Rond 1270 bouwden de mensen een dam in de Amstel. Rotterdam ontstond bij een dam in de Rotte."],
["Wat doet een waterschap?","het zorgt voor de dijken en het water","het bouwt nieuwe huizen in de polder","het verkoopt vis op de markt in de stad","De waterschappen bestaan nog steeds. Je kunt er ook voor stemmen."],
["Wat is een polder?","nieuw land, waar het water is weggepompt","een grote rivier met dijken aan twee kanten","een hoge berg van zand langs de zee","Rond een polder ligt een dijk. Vroeger pompten windmolens het water weg."]]},
{id:"opstand",g:"De Republiek",y:"1568–1648",t:"Willem van Oranje en de Opstand",s:"De Tachtigjarige Oorlog tegen Spanje",p:"art/oranje.jpg",py:28,pc:"Willem van Oranje, geschilderd door Adriaen Thomasz. Key (ca. 1579)",f:[["foto/beeldenstorm.jpg","De Beeldenstorm in Antwerpen, 20 augustus 1566. Prent van Frans Hogenberg",1],["foto/munster.jpg","De Vrede van Münster, 1648. Geschilderd door Gerard ter Borch",4]],
x:`In de zestiende eeuw was koning Filips II van Spanje de baas over de Nederlanden. Veel mensen waren niet tevreden. Ze moesten veel belasting betalen. Protestanten mochten hun geloof niet vrij hebben: ze werden vervolgd.
In 1566 vernielden protestanten beelden en schilderijen in de katholieke kerken. Dat heet de Beeldenstorm. Filips stuurde een groot leger.
Willem van Oranje werd de leider van de opstand. In 1568 begon de oorlog tegen Spanje. Die oorlog duurde tachtig jaar: de Tachtigjarige Oorlog. In 1581 zeiden de noordelijke provincies: Filips is niet meer onze koning.
In 1584 werd Willem van Oranje in Delft doodgeschoten. Hij heet nog steeds de Vader des Vaderlands. Het volkslied, het Wilhelmus, gaat over hem.
De noordelijke provincies gingen samen verder als een nieuw land: de Republiek der Zeven Verenigde Nederlanden. In 1648 sloten ze vrede met Spanje, in Münster. Toen was de Republiek officieel een vrij land.`,
q:[["Wie was de leider van de opstand tegen Spanje?","Willem van Oranje","koning Filips II","Rembrandt","Willem van Oranje heet de Vader des Vaderlands."],
["Wat was de Beeldenstorm?","protestanten vernielden beelden in katholieke kerken","een grote storm die veel beelden kapotmaakte","een oorlog met Engeland om de handel op zee","De Beeldenstorm was in 1566."],
["Waar gaat het Wilhelmus over?","over Willem van Oranje","over koning Filips","over de zee en de dijken","Het Wilhelmus is het volkslied van Nederland."]]},
{id:"goudeneeuw",y:"1600–1700",t:"De Gouden Eeuw",s:"Handel, kunst en de VOC",p:"foto/voc.jpg",py:50,pc:"Schepen op weg naar Azië, geschilderd door Hendrick Vroom",f:[["foto/herengracht.jpg","De Herengracht in Amsterdam, geschilderd door Gerrit Berckheyde (1671–1672)",2],["foto/leeuwenhoek.jpg","Antoni van Leeuwenhoek uit Delft, geschilderd door Jan Verkolje (rond 1680–1686)",3]],
x:`In de zeventiende eeuw was de Republiek een van de rijkste landen van de wereld. Die tijd heet de Gouden Eeuw.
Het land werd rijk door handel. In 1602 begon de VOC: de Verenigde Oostindische Compagnie. Schepen van de VOC voeren naar Azië. Ze kwamen terug met peper, nootmuskaat, thee en zijde. Iedereen kon een aandeel van de VOC kopen. Daarom noemen we de VOC soms het eerste grote bedrijf met aandeelhouders.
Amsterdam werd een wereldstad. Rijke kooplieden bouwden mooie huizen aan nieuwe grachten. De grachtengordel staat nu op de Werelderfgoedlijst.
Er waren ook veel kunstenaars en wetenschappers. Rembrandt schilderde De Nachtwacht en Vermeer Het melkmeisje. Antoni van Leeuwenhoek zag als eerste bacteriën door zijn microscoop.
Maar de Gouden Eeuw had ook een donkere kant. De VOC gebruikte veel geweld in Azië. En Nederlandse handelaren verdienden geld met slavernij.`,
q:[["Wat was de VOC?","een handelsbedrijf dat naar Azië voer","een leger dat tegen Spanje vocht","een school voor schilders in Delft","De VOC begon in 1602."],
["Waarmee kwamen de schepen van de VOC terug uit Azië?","met peper, thee en zijde","met graan, hout en bier","met kolen, ijzer en steen","Specerijen zoals peper en nootmuskaat waren heel duur in Europa."],
["Wie schilderde De Nachtwacht?","Rembrandt","Vermeer","Van Gogh","Vermeer schilderde Het melkmeisje. Van Gogh leefde in de negentiende eeuw."]]},
{id:"slavernij",y:"1621–1863",t:"Slavernij",s:"Een pijnlijk verleden, en Keti Koti",p:"foto/slavernij.jpg",py:55,pc:"Het Nationaal Monument Slavernijverleden in het Oosterpark in Amsterdam, gemaakt door Erwin de Vries (2002)",f:[["foto/plantage.jpg","Een plantage in Suriname, geschilderd door Dirk Valkenburg (rond 1707)",2]],
x:`In 1621 begon de West-Indische Compagnie, de WIC. De WIC handelde met Afrika en Amerika. Een groot deel van die handel was slavenhandel.
Nederlandse schepen brachten meer dan een half miljoen Afrikanen naar Amerika. Ze werden tot slaaf gemaakt: ze hadden geen rechten en ze werden verkocht als spullen. Veel mensen stierven al op het schip.
In Suriname en op de eilanden in de Caraïben moesten de tot slaaf gemaakte mensen hard werken op plantages. Daar kweekten ze suiker, koffie en katoen voor Europa. De eigenaren werden er rijk van. Ook in Azië had de VOC slaven.
Pas op 1 juli 1863 schafte Nederland de slavernij af. Maar in Suriname moesten veel mensen nog tien jaar verplicht doorwerken op de plantages.
Op 1 juli vieren veel mensen Keti Koti. Dat is Sranantongo, een taal uit Suriname. Het betekent: de ketenen zijn gebroken. In 2023 bood koning Willem-Alexander excuses aan voor het slavernijverleden.`,
q:[["Wat vieren veel mensen op 1 juli?","Keti Koti, het einde van de slavernij","de bevrijding van Nederland in 1945","de verjaardag van de koning, Koningsdag","Op 1 juli 1863 schafte Nederland de slavernij af."],
["Wat moesten de tot slaaf gemaakte mensen in Suriname doen?","hard werken op plantages","in een fabriek in Nederland werken","soldaat worden","Op de plantages kweekten ze suiker, koffie en katoen."],
["Wat deed koning Willem-Alexander in 2023?","hij bood excuses aan voor de slavernij","hij opende een nieuwe haven in Suriname","hij werd koning van Nederland","Willem-Alexander is koning sinds 2013."]]},
{id:"koninkrijk",g:"Het koninkrijk",y:"1795–1848",t:"Een koning en een grondwet",s:"Napoleon, koning Willem I en Thorbecke",p:"foto/thorbecke.jpg",py:36,pc:"Johan Rudolf Thorbecke, de schrijver van de grondwet van 1848",f:[["foto/lodewijk.jpg","Lodewijk Napoleon, koning van Holland van 1806 tot 1810",0],["foto/scheveningen.jpg","30 november 1813: de prins van Oranje komt aan in Scheveningen. In 1815 wordt hij koning Willem I.",2]],
x:`In 1795 kwamen de Fransen naar de Republiek. Later maakte de Franse keizer Napoleon zijn broer Lodewijk koning van Holland. In 1810 werd Nederland zelfs een deel van Frankrijk.
De Fransen veranderden veel. Iedereen moest bijvoorbeeld een achternaam hebben en die bij de gemeente laten opschrijven. Veel families kozen toen een achternaam, bijvoorbeeld naar hun beroep, zoals Bakker of Visser.
In 1813 gingen de Fransen weg. De zoon van de laatste stadhouder kwam terug naar Nederland. In 1815 werd hij koning Willem I. Sindsdien is Nederland een koninkrijk. Eerst hoorde België er ook bij, maar in 1830 kwam België in opstand. Het werd een apart land.
In 1848 kreeg Nederland een nieuwe grondwet. Johan Rudolf Thorbecke schreef die. Sindsdien zijn de ministers verantwoordelijk en niet de koning. Het volk kiest de Tweede Kamer. Maar in 1848 mochten alleen rijke mannen stemmen.`,
q:[["Wie schreef de grondwet van 1848?","Thorbecke","Napoleon","Willem van Oranje","Sinds 1848 zijn de ministers verantwoordelijk, niet de koning."],
["Sinds wanneer is Nederland een koninkrijk?","sinds 1815","sinds 1648","sinds 1945","Willem I was de eerste koning."],
["Wat moest iedereen in de Franse tijd hebben?","een achternaam","een eigen huis","een paspoort","Veel families kozen toen een achternaam, bijvoorbeeld naar hun beroep."]]},
{id:"industrie",y:"1839–1901",t:"Treinen, fabrieken en de leerplicht",s:"Armoede en de eerste sociale wetten",p:"art/aardappeleters.jpg",py:45,pc:"De aardappeleters, geschilderd door Vincent van Gogh (1885)",f:[["foto/spoorweg.jpg","Feest bij de opening van de eerste spoorlijn, van Amsterdam naar Haarlem (1839)",0]],
x:`In 1839 reed de eerste trein van Nederland, van Amsterdam naar Haarlem. Daarna kwamen er steeds meer spoorlijnen, kanalen en fabrieken.
Veel mensen werkten in een fabriek. Het werk was zwaar en de dagen waren lang, soms meer dan twaalf uur. Ook kinderen werkten mee. Het loon was laag. Veel families waren arm. Ze aten vaak alleen aardappelen en brood. Vincent van Gogh schilderde zo'n arm gezin: De aardappeleters.
Langzaam kwamen er wetten om mensen te beschermen. In 1874 kwam het Kinderwetje van Samuel van Houten. Kinderen jonger dan twaalf jaar mochten niet meer in een fabriek werken.
In 1901 kwam de leerplicht. Alle kinderen van zes tot twaalf jaar moesten naar school. Nu is de leerplicht in Nederland van vijf tot zestien jaar. Daarna moeten jongeren tot hun achttiende nog een diploma halen.`,
q:[["Wat regelde het Kinderwetje van 1874?","kinderen onder de twaalf mochten niet in een fabriek werken","alle kinderen onder de twaalf kregen gratis eten","kinderen onder de twaalf moesten elke zondag naar de kerk","Het wetje was van Samuel van Houten."],
["Wat is de leerplicht?","kinderen moeten naar school","ouders moeten werken","leraren moeten een diploma hebben","De leerplicht begon in 1901. Nu geldt hij van vijf tot zestien jaar."],
["Waar reed de eerste trein van Nederland?","van Amsterdam naar Haarlem","van Utrecht naar Arnhem","van Rotterdam naar Den Haag","Dat was in 1839."]]},
{id:"kiesrecht",y:"1871–1932",t:"Stemrecht voor iedereen",s:"Aletta Jacobs, kiesrecht en de Afsluitdijk",p:"foto/aletta.jpg",py:30,pc:"Aletta Jacobs, rond 1900",f:[["foto/afsluitdijk.jpg","Auto's op de Afsluitdijk, met het monument",3]],
x:`Aletta Jacobs kwam uit Groningen. In 1871 werd zij de eerste vrouw die in Nederland aan een universiteit mocht studeren. Later werd ze de eerste vrouwelijke arts van Nederland. Ze vond dat vrouwen dezelfde rechten moesten hebben als mannen. Ze wilde ook dat vrouwen mochten stemmen.
Rond 1900 mocht nog lang niet iedereen stemmen. In 1917 kregen alle mannen kiesrecht. Twee jaar later, in 1919, kregen ook alle vrouwen kiesrecht. Nu mag iedere Nederlander van achttien jaar of ouder stemmen.
In de Eerste Wereldoorlog, van 1914 tot 1918, bleef Nederland neutraal. Het land deed niet mee aan de oorlog.
In 1932 was de Afsluitdijk klaar. Die lange dijk sloot de Zuiderzee af van de zee. Zo werd de Zuiderzee een meer: het IJsselmeer. Later werd een deel van het meer land. Zo ontstond de provincie Flevoland.`,
q:[["Wie was Aletta Jacobs?","de eerste vrouwelijke arts van Nederland","een bekende schilder uit Delft","de eerste koningin van Nederland","Ze streed ook voor kiesrecht voor vrouwen."],
["Sinds wanneer mogen vrouwen in Nederland stemmen?","sinds 1919","sinds 1848","sinds 1945","Alle mannen kregen kiesrecht in 1917, alle vrouwen in 1919."],
["Wat werd de Zuiderzee door de Afsluitdijk?","een meer: het IJsselmeer","een haven: de haven van Rotterdam","een rivier: de Rijn bij Arnhem","De Afsluitdijk was klaar in 1932."]]},
{id:"oorlog",g:"Oorlog en wederopbouw",y:"1940–1945",t:"De Tweede Wereldoorlog",s:"Bezetting, vervolging en bevrijding",p:"foto/bevrijding.jpg",py:65,pc:"Feest in Amsterdam-Zuid na de bevrijding, mei 1945",f:[["foto/rotterdam1940.jpg","Het centrum van Rotterdam na het bombardement van 14 mei 1940",0],["foto/annefrank.jpg","Het huis van Anne Frank aan de Prinsengracht in Amsterdam",1],["foto/hongerwinter.jpg","De Hongerwinter: mensen halen hout tussen de tramrails weg, om te stoken",3]],
x:`Op 10 mei 1940 viel Duitsland Nederland aan. Koningin Wilhelmina en de regering gingen naar Londen. Op 14 mei bombardeerden Duitse vliegtuigen het centrum van Rotterdam. Een dag later gaf het Nederlandse leger zich over.
Vijf jaar lang was Nederland bezet. De Duitsers vervolgden de Joden. Joden moesten een gele ster dragen en ze werden weggevoerd naar kampen. Ongeveer 102.000 Joden uit Nederland werden vermoord. Ook Roma en Sinti werden vermoord. Anne Frank zat ruim twee jaar ondergedoken in Amsterdam. Ze schreef er haar beroemde dagboek.
Sommige mensen hielpen Joden onderduiken of gingen in het verzet. Veel anderen deden niets, en sommigen werkten samen met de Duitsers.
In de winter van 1944 op 1945 was er in het westen bijna geen eten. Die winter heet de Hongerwinter. Ongeveer 20.000 mensen stierven.
Een deel van het zuiden was in 1944 al bevrijd. Op 5 mei 1945 was heel Nederland vrij. Op 4 mei herdenken we de doden en op 5 mei vieren we de bevrijding.`,
q:[["Welke stad werd op 14 mei 1940 gebombardeerd?","Rotterdam","Amsterdam","Utrecht","Het centrum van Rotterdam werd bijna helemaal verwoest."],
["Waar ging koningin Wilhelmina in de oorlog naartoe?","naar Londen","naar Berlijn","naar Parijs","Via Radio Oranje sprak ze vanuit Londen tegen de Nederlanders."],
["Wat moesten Joden in de oorlog dragen?","een gele ster","een oranje hoed","een uniform","Ongeveer 102.000 Joden uit Nederland werden vermoord."]]},
{id:"indonesie",y:"1945–1949",t:"Indonesië wordt vrij",s:"Het einde van een kolonie",p:"foto/indonesie.jpg",py:45,pc:"Koningin Juliana tekent de papieren: Indonesië is vrij (27 december 1949)",f:[["foto/proklamasi.jpg","17 augustus 1945: Soekarno leest de onafhankelijkheid voor. Rechts staat Hatta.",1]],
x:`Al sinds de zeventiende eeuw had Nederland macht in Indonesië. Het land werd een kolonie: Nederlands-Indië. Nederland verdiende er veel geld aan, bijvoorbeeld met koffie, suiker, tabak en olie. De Indonesiërs zelf hadden weinig rechten.
In de Tweede Wereldoorlog bezette Japan het land. Op 17 augustus 1945, twee dagen na het einde van de oorlog met Japan, riepen Soekarno en Hatta de onafhankelijkheid uit.
Nederland wilde de kolonie niet kwijt. Het stuurde meer dan honderdduizend soldaten. Er kwam een oorlog die vier jaar duurde. Ook het Nederlandse leger gebruikte daarbij veel geweld. Er stierven heel veel Indonesiërs en ongeveer vijfduizend Nederlandse soldaten.
Op 27 december 1949 werd Indonesië officieel vrij. Koningin Juliana tekende de papieren in het paleis op de Dam in Amsterdam.
Na de oorlog kwamen veel mensen uit Indonesië naar Nederland, onder wie Indische Nederlanders en Molukkers. Veel van hun kinderen en kleinkinderen wonen nu in Nederland.`,
q:[["Hoe heette Indonesië toen het een kolonie was?","Nederlands-Indië","Suriname","Nieuw-Nederland","Indonesië is sinds 1949 een vrij land."],
["Wanneer werd Indonesië officieel vrij?","op 27 december 1949","op 5 mei 1945, na de oorlog","op 1 juli 1863","Koningin Juliana tekende de papieren in Amsterdam."],
["Wie riepen in 1945 de onafhankelijkheid van Indonesië uit?","Soekarno en Hatta","Juliana en Drees","Thorbecke en Willem I","Dat was op 17 augustus 1945."]]},
{id:"watersnood",y:"1953–1997",t:"De Watersnood en de Deltawerken",s:"Een grote ramp, en nooit meer",p:"foto/watersnood.jpg",py:50,pc:"Na de watersnood brengen mensen hun koeien in veiligheid (1953)",f:[["foto/deltawerken.jpg","De bouw van de Oosterscheldekering",3]],
x:`In de nacht van 31 januari op 1 februari 1953 was er een zware storm. Het was ook springtij: het water in de zee stond extra hoog. Op veel plaatsen in Zeeland, Zuid-Holland en Noord-Brabant braken de dijken.
Het water kwam midden in de nacht. Veel mensen sliepen. Ze vluchtten naar de zolder of het dak. In totaal stierven 1836 mensen. Ook tienduizenden dieren verdronken en veel huizen werden vernield. Dit heet de Watersnoodramp.
Daarna zei de regering: dit mag nooit meer gebeuren. Er kwam een groot plan: het Deltaplan. Nederland bouwde dammen, dijken en grote stormvloedkeringen. Dat zijn de Deltawerken.
De Oosterscheldekering in Zeeland is het bekendste deel. Normaal staat hij open, zodat het zoute water en de natuur blijven. Bij storm gaan de grote schuiven dicht. In 1997 was het laatste deel klaar: de Maeslantkering bij Rotterdam.
Door klimaatverandering wordt de zee steeds hoger. Daarom blijft Nederland werken aan het water.`,
q:[["Wat gebeurde er op 1 februari 1953?","de dijken braken en er kwam een grote overstroming","Nederland werd bevrijd van de Duitse bezetting","de Afsluitdijk was klaar en de Zuiderzee was dicht","Bij de Watersnoodramp stierven 1836 mensen."],
["Wat zijn de Deltawerken?","dammen, dijken en stormvloedkeringen tegen de zee","grote fabrieken in de haven van Rotterdam","nieuwe steden en dorpen voor de mensen in Zeeland","Het laatste deel was klaar in 1997."],
["Wat doet de Oosterscheldekering bij storm?","hij gaat dicht","hij gaat open","hij pompt water naar de zee","Normaal staat hij open, voor het zoute water en de natuur."]]},
{id:"migratie",y:"1945–1975",t:"Wederopbouw en nieuwe Nederlanders",s:"Werk, de AOW en gastarbeiders",p:"foto/gastarbeiders.jpg",py:45,pc:"Italiaanse gastarbeiders in Twente lezen de krant",f:[["foto/emigranten.jpg","Emigranten vertrekken met het vliegtuig naar Canada (1950)",0],["foto/drees.jpg","Willem Drees in 1946. Van 1948 tot 1958 was hij minister-president.",1]],
x:`Na de oorlog moest Nederland opnieuw beginnen. Er waren te weinig huizen en er was weinig werk. Daarom vertrokken veel Nederlanders naar Canada, Australië of de Verenigde Staten.
Langzaam werd het beter. Er kwamen nieuwe huizen, wegen en fabrieken. Minister-president Willem Drees regelde in 1957 de AOW: geld van de overheid voor alle ouderen. Zo begon de verzorgingsstaat.
In de jaren zestig ging het economisch heel goed. Fabrieken hadden juist te weinig werknemers. Daarom haalden bedrijven gastarbeiders naar Nederland: eerst uit Italië en Spanje, later vooral uit Turkije en Marokko. Ze deden vaak zwaar werk. Iedereen dacht dat ze na een paar jaar teruggingen. Maar veel gastarbeiders bleven, en hun familie kwam ook.
In 1975 werd Suriname onafhankelijk. In die tijd kwamen veel Surinamers naar Nederland. Zo werd Nederland een land met mensen uit veel verschillende culturen.`,
q:[["Wie regelde in 1957 de AOW?","minister-president Drees","de arts Aletta Jacobs","koningin Wilhelmina","De AOW is geld van de overheid voor ouderen."],
["Waarom kwamen er gastarbeiders naar Nederland?","de fabrieken hadden te weinig werknemers","ze kwamen studeren aan een universiteit","ze vluchtten voor een oorlog in hun land","Ze kwamen eerst uit Italië en Spanje, later vooral uit Turkije en Marokko."],
["Waar gingen veel Nederlanders na de oorlog naartoe?","naar Canada en Australië","naar Spanje en Italië","naar Turkije en Marokko","Er waren te weinig huizen en te weinig werk."]]},
{id:"nu",g:"Nederland nu",y:"1957–nu",t:"Nederland in Europa",s:"De EU, de euro en de koning",p:"foto/koningsdag.jpg",py:50,pc:"Koningsdag in Delft (2017): veel mensen op de vrijmarkt",f:[["foto/beatrix.jpg","30 april 1980: Beatrix wordt koningin, in de Nieuwe Kerk in Amsterdam",2],["foto/stemmen.jpg","Verkiezingen: mensen stemmen in een stembureau",3]],
x:`In 1957 begon Nederland met vijf andere landen de Europese Economische Gemeenschap, de EEG. Dat was het begin van de Europese Unie. In 1992 tekenden de Europese landen het Verdrag van Maastricht. Sinds 2002 betalen we met de euro. Daarvoor had Nederland de gulden.
Nederland veranderde ook op andere manieren. Veel mensen gingen minder naar de kerk en meer vrouwen gingen buitenshuis werken. In 2001 was Nederland het eerste land ter wereld waar twee mannen of twee vrouwen met elkaar mochten trouwen.
Nederland is nog steeds een koninkrijk. Van 1890 tot 2013 had het land drie koninginnen: Wilhelmina, Juliana en Beatrix. In 2013 werd Willem-Alexander koning. Zijn verjaardag, 27 april, is nu Koningsdag.
Nederland is een democratie. Iedereen mag zeggen wat hij denkt. En in artikel 1 van de grondwet staat: iedereen in Nederland wordt in gelijke gevallen gelijk behandeld.`,
q:[["Waarmee betaalde Nederland vóór de euro?","met de gulden","met de mark","met de frank","De euro kwam in 2002."],
["Wat mocht in 2001 in Nederland, als eerste land ter wereld?","twee mannen of twee vrouwen mochten trouwen","vrouwen mochten voor het eerst stemmen","je mocht in winkels met de euro betalen","Nederland was het eerste land met het homohuwelijk."],
["Wie is sinds 2013 koning van Nederland?","Willem-Alexander","Willem van Oranje","Willem I","Zijn verjaardag, 27 april, is Koningsdag."]]}
];
// Gesprekken: everyday conversations, free and offline (no Claude). The other person (w) says a line (a), read aloud;
// the learner answers out loud (speech recognition writes it down) or types. An answer fits when it has a word from
// every group in k: "a|b c" = a, or b and c; a word of 1–2 letters must match exactly, 3 letters the start of a word,
// longer ones any part of a word (volkoren → volkorenbrood). k empty: any answer (a name, an address).
// x: skip this line when the previous answer already said it. r: what the other person says when it did not fit.
// m: an example answer (the hint, and the summary). o: the learner's task. e: the last line. g starts a group.
// b1: a B1 conversation (longer answers: explaining, giving reasons, negotiating); at B1 their group is listed first.
// S.gp keeps, per conversation, how often it was finished (n), the best number of answers without help (b) and when (at).
const GP=[
{id:"arts",g:"Aan de telefoon",t:"De huisarts bellen",s:"Je bent ziek: maak een afspraak.",w:"Assistente",p:"ziek",
 o:"Je hebt al drie dagen keelpijn en koorts. Bel de huisarts en maak een afspraak. Je kunt alleen 's ochtends.",
 d:[{a:"Huisartsenpraktijk De Linde, goedemorgen. U spreekt met Anouk.",k:["afspra|langskomen|huisarts|dokter"],m:"Goedemorgen, met [je naam]. Ik wil graag een afspraak maken bij de huisarts.",r:"Waarmee kan ik u helpen?"},
  {a:"Wat is uw naam en uw geboortedatum?",k:[],m:"Mijn naam is [je naam]. Ik ben geboren op 12 maart 1990.",r:"Sorry, dat heb ik niet goed gehoord. Hoe heet u, en wanneer bent u geboren?"},
  {a:"Dank u wel. Wat zijn uw klachten?",k:["keel|koorts|pijn|ziek|hoest|griep"],m:"Ik heb al drie dagen keelpijn en koorts.",r:"Wat is het probleem? Waar heeft u last van?"},
  {a:"Wat vervelend. Kunt u vanmiddag om drie uur komen?",k:["nee|niet|helaas|geen","ochtend|morgens"],m:"Nee, dat kan ik helaas niet. Ik kan alleen 's ochtends.",r:"Kunt u vanmiddag om drie uur? Of wanneer kunt u wel?"},
  {a:"Even kijken… Morgenochtend om half tien is er nog plek. Past dat?",k:["ja|prima|goed|past|graag"],m:"Ja, dat past goed. Morgen om half tien.",r:"Kunt u morgen om half tien?"},
  {a:"Dan zie ik u morgen om half tien. Neem uw zorgpas mee. Heeft u nog een vraag?",k:["nee|ja|dank|bedankt|vraag|duidelijk|hoe|waar|wat"],m:"Nee, dank u wel. Tot morgen!",r:"Heeft u nog een vraag, of is alles duidelijk?"}],
 e:"Graag gedaan. Beterschap, en tot morgen!"},
{id:"werk",t:"Je ziek melden op je werk",s:"Bel je leidinggevende: je bent ziek.",w:"Peter",p:"bellen",
 o:"Je werkt bij Bakkerij Smit. Vandaag ben je ziek: je hebt griep. Bel je leidinggevende Peter. Morgen ga je naar de dokter.",
 d:[{a:"Bakkerij Smit, met Peter.",k:["ziek|griep|koorts|lekker"],m:"Hallo Peter, met [je naam]. Ik bel omdat ik ziek ben.",r:"Hallo? Wat is er aan de hand?"},
  {a:"O, wat vervelend. Wat heb je?",x:1,k:["griep|koorts|hoofdpijn|buikpijn|verkouden|keel|misselijk"],m:"Ik heb griep. Ik heb koorts en hoofdpijn.",r:"Wat heb je precies? Heb je koorts?"},
  {a:"Ben je al naar de dokter geweest?",k:["morgen|nee|nog niet"],m:"Nee, nog niet. Morgen ga ik naar de dokter.",r:"Ga je naar de dokter?"},
  {a:"Hoe lang denk je dat je ziek bent?",k:["dag|week|weet|lang"],m:"Ik weet het nog niet. Misschien twee of drie dagen.",r:"Weet je hoe lang het duurt? Een paar dagen?"},
  {a:"Oké. Wil je me morgen na de dokter bellen? Dan weet ik hoe het gaat.",k:["ja|goed|prima|oke|oké|doe|bel"],m:"Ja, dat is goed. Ik bel je morgen.",r:"Bel je me morgen even?"}],
 e:"Goed. Beterschap, en rust lekker uit!"},
{id:"huis",t:"De verwarming is kapot",s:"Bel de verhuurder en maak een afspraak met de monteur.",w:"Sandra",
 o:"Je huurt een huis van Woonstichting De Kern. Sinds gisteren doet de verwarming het niet. Bel en meld het. Morgen werk je tot één uur; vanaf twee uur ben je thuis.",
 d:[{a:"Woonstichting De Kern, goedemiddag. U spreekt met Sandra.",k:["verwarming|kachel"],m:"Goedemiddag, met [je naam]. De verwarming in mijn huis is kapot.",r:"Waarover belt u?"},
  {a:"Wat vervelend. Wat is uw adres?",k:[],m:"Mijn adres is Lindelaan 14 in Zwolle.",r:"Op welk adres woont u? De straat, het huisnummer en de plaats graag."},
  {a:"Dank u. Sinds wanneer werkt de verwarming niet?",k:["gisteren|sinds"],m:"Sinds gisteren. Het is heel koud in huis.",r:"Wanneer is het probleem begonnen?"},
  {a:"Morgen kan er een monteur komen, tussen acht en twaalf uur. Bent u dan thuis?",k:["nee|niet|helaas|werk","middag|twee|14|na"],m:"Nee, dan moet ik werken. Kan het ook 's middags? Vanaf twee uur ben ik thuis.",r:"Bent u morgenochtend thuis? Zo niet: wanneer wel?"},
  {a:"Dat kan. De monteur komt morgen tussen twee en vijf uur. Is dat goed?",k:["ja|goed|prima|kan|graag|oke|oké"],m:"Ja, dat is goed. Dank u wel.",r:"Is morgen tussen twee en vijf uur goed voor u?"},
  {a:"Mogen we u bellen als de monteur onderweg is? Wat is uw telefoonnummer?",k:[],m:"Ja, dat is goed. Mijn nummer is 06 12345678.",r:"Wat is uw telefoonnummer?"}],
 e:"Ik heb alles genoteerd. De monteur komt morgenmiddag. Fijne dag nog!"},
{id:"school",t:"Je kind ziek melden op school",s:"Je zoon heeft koorts: bel de school.",w:"School",
 o:"Je zoon Sem zit in groep 4. Vandaag heeft hij koorts: hij blijft thuis. Bel de school. Je weet nog niet of hij morgen weer komt.",
 d:[{a:"Basisschool De Regenboog, goedemorgen.",k:["ziek|koorts|thuis|komt niet|kan niet"],m:"Goedemorgen, met [je naam]. Mijn zoon Sem is ziek. Hij blijft vandaag thuis.",r:"Goedemorgen. Waarmee kan ik u helpen?"},
  {a:"Wat vervelend. Hoe heet uw zoon?",x:1,k:["sem|sam|zem"],m:"Hij heet Sem.",r:"Wat is de naam van uw zoon?"},
  {a:"En in welke groep zit hij?",x:1,k:["vier|4"],m:"Hij zit in groep 4.",r:"In welke groep zit Sem?"},
  {a:"Dank u. Wat heeft hij?",x:1,k:["koorts|griep|pijn|verkouden|misselijk|overgeven"],m:"Hij heeft koorts.",r:"Heeft hij koorts? Of iets anders?"},
  {a:"Beterschap voor Sem. Komt hij morgen weer naar school?",k:["weet|misschien|bel|hoop"],m:"Dat weet ik nog niet. Ik bel morgenochtend weer.",r:"Weet u al of Sem morgen komt?"},
  {a:"Goed. Wilt u dan morgen voor half negen bellen?",k:["ja|goed|prima|doe|oke|oké|natuurlijk"],m:"Ja, dat doe ik. Dank u wel.",r:"Belt u morgen voor half negen?"}],
 e:"Dank u wel voor het bellen. Dag!"},
{id:"gem",t:"De gemeente bellen",s:"Maak een afspraak voor een nieuwe ID-kaart.",w:"Gemeente",
 o:"Je ID-kaart is bijna verlopen. Bel de gemeente en maak een afspraak voor een nieuwe. Je kunt volgende week op dinsdag of woensdag. Vraag wat je mee moet nemen.",
 d:[{a:"Gemeente Zwolle, goedemorgen. Waarmee kan ik u helpen?",k:["id|idkaart|identiteit|paspoort"],m:"Goedemorgen. Ik wil een afspraak maken voor een nieuwe ID-kaart.",r:"Waarvoor belt u?"},
  {a:"Wanneer kunt u langskomen?",x:1,k:["dinsdag|woensdag"],m:"Volgende week, op dinsdag of woensdag.",r:"Welke dag kunt u komen?"},
  {a:"Dinsdag om tien over elf is er nog plek. Is dat goed?",k:["ja|goed|prima|kan|graag"],m:"Ja, dat is goed.",r:"Kunt u dinsdag om tien over elf?"},
  {a:"Mag ik uw naam en geboortedatum?",k:[],m:"Mijn naam is [je naam]. Ik ben geboren op 12 maart 1990.",r:"Hoe heet u, en wanneer bent u geboren?"},
  {a:"Dank u. Uw afspraak is dinsdag om 11.10 uur, in het stadskantoor.",k:["mee|nodig"],m:"Dank u. Wat moet ik meenemen?",r:"Heeft u nog een vraag?"},
  {a:"Neem uw oude ID-kaart en een pasfoto mee. Betalen kan met de pinpas.",k:["dank|bedankt|duidelijk|goed|oke|oké|foto"],m:"Mijn oude ID-kaart en een pasfoto. Dank u wel!",r:"Is alles duidelijk?"}],
 e:"Graag gedaan. Tot dinsdag!"},
{id:"alarm",t:"112 bellen",s:"Er is een ongeluk gebeurd: bel een ambulance.",w:"Meldkamer",
 o:"Op straat is een fietser gevallen. Hij bloedt aan zijn hoofd en hij praat niet. Je staat op de Stationsweg in Zwolle, bij de bakker. Bel 112.",
 d:[{a:"112, welke hulpdienst heeft u nodig: politie, brandweer of ambulance?",k:["ambulance|ziekenauto"],m:"Een ambulance. Er is een ongeluk gebeurd.",r:"Wie heeft u nodig: de politie, de brandweer of een ambulance?"},
  {a:"Ik verbind u door. … Ambulance. Waar is het ongeluk?",k:["stationsweg|station"],m:"Op de Stationsweg in Zwolle, bij de bakker.",r:"Waar bent u? In welke straat, en in welke plaats?"},
  {a:"Wat is er gebeurd?",k:["gevallen|fietser|bloed|val"],m:"Een fietser is gevallen. Hij bloedt aan zijn hoofd.",r:"Vertelt u het maar: wat is er gebeurd?"},
  {a:"Is hij wakker? Praat hij met u?",k:["nee|niet"],m:"Nee, hij praat niet.",r:"Kan hij praten? Ja of nee?"},
  {a:"De ambulance komt eraan. Blijf bij hem en beweeg hem niet. Wat is uw telefoonnummer?",k:[],m:"Mijn nummer is 06 12345678.",r:"Op welk nummer kunnen we u bellen?"}],
 e:"Dank u. De ambulance is er over een paar minuten. Bel opnieuw 112 als het slechter gaat."},
{id:"cursus",t:"Je aanmelden voor een taalcursus",s:"Bel de taalschool en vraag wat de cursus kost.",w:"Taalschool",p:"laptop",
 o:"Je wilt Nederlands leren op niveau A2. Je werkt overdag, dus je kunt alleen 's avonds. Bel de taalschool. Vraag ook wat de cursus kost.",
 d:[{a:"Taalschool Spreektaal, goedemiddag.",k:["cursus|les|leren|aanmeld|inschrijv"],m:"Goedemiddag. Ik wil me aanmelden voor een cursus Nederlands.",r:"Waarmee kan ik u helpen?"},
  {a:"Op welk niveau wilt u de cursus doen?",x:1,k:["a2|a twee"],m:"Op niveau A2.",r:"Wilt u A1, A2 of B1 doen?"},
  {a:"Wilt u overdag of 's avonds les?",x:1,k:["avond"],m:"'s Avonds, want overdag werk ik.",r:"Kunt u overdag, of liever 's avonds?"},
  {a:"Er is een groep op dinsdag- en donderdagavond, van zeven tot negen uur. Past dat?",k:["ja|goed|prima|past|kan"],m:"Ja, dat past goed.",r:"Kunt u op dinsdag en donderdag, van zeven tot negen?"},
  {a:"Mooi. Heeft u nog een vraag?",k:["kost|prijs|betalen|geld"],m:"Ja. Wat kost de cursus?",r:"Wilt u nog iets weten?"},
  {a:"De cursus kost 450 euro voor twintig lessen.",k:["450|vierhonderd|twintig|20|dank|duidelijk|goed|aanmeld|oke|oké"],m:"450 euro voor twintig lessen. Dank u, dan meld ik me aan.",r:"Is dat duidelijk?"}],
 e:"Prima. Ik stuur u een e-mail met het aanmeldformulier. Tot ziens!"},
{id:"sollicitatie",g:"Werk, school en de dokter",t:"Een sollicitatiegesprek",s:"Je solliciteert bij een supermarkt.",w:"Mark",p:"supermarkt",
 o:"Je solliciteert als vakkenvuller bij supermarkt De Buurtwinkel. In je eigen land heb je twee jaar in een winkel gewerkt. Je kunt 24 uur per week werken, ook op zaterdag. Je kunt over twee weken beginnen.",
 d:[{a:"Goedemiddag, welkom. Ik ben Mark, de manager. Gaat u zitten. Vertelt u eens iets over uzelf.",k:[],m:"Goedemiddag. Ik heet [je naam] en ik kom uit [je land]. Ik woon nu twee jaar in Nederland.",r:"Wie bent u? Vertelt u iets over uzelf."},
  {a:"Heeft u al eerder in een winkel gewerkt?",k:["ja|jaar|gewerkt|winkel"],m:"Ja, in mijn land heb ik twee jaar in een winkel gewerkt.",r:"Heeft u werkervaring? Waar heeft u gewerkt?"},
  {a:"Hoeveel uur per week wilt u werken?",k:["24|vierentwintig"],m:"Ik wil 24 uur per week werken.",r:"Hoeveel uur per week kunt u werken?"},
  {a:"Kunt u ook op zaterdag werken?",x:1,k:["ja|kan|zaterdag"],m:"Ja, dat kan.",r:"En op zaterdag, kunt u dan ook?"},
  {a:"Waarom wilt u bij ons werken?",k:[],m:"Ik werk graag met mensen, en zo leer ik ook beter Nederlands.",r:"Waarom wilt u deze baan?"},
  {a:"Wanneer kunt u beginnen?",k:["week|weken|maand|meteen|direct|morgen|maandag"],m:"Over twee weken.",r:"Vanaf wanneer kunt u werken?"}],
 e:"Dank u wel voor het gesprek. U hoort deze week van ons."},
{id:"vrij",t:"Een vrije dag vragen",s:"Vraag je leidinggevende om een vrije dag.",w:"Peter",
 o:"Je werkt bij Bakkerij Smit. Volgende week vrijdag doe je je inburgeringsexamen. Vraag je leidinggevende Peter of je die dag vrij kunt krijgen. Op zaterdag kun je wel werken.",
 d:[{a:"Hoi, wat kan ik voor je doen?",k:["vrij|vakantie"],m:"Hoi Peter. Mag ik volgende week vrijdag een dag vrij?",r:"Wil je iets vragen?"},
  {a:"Volgende week vrijdag? Waarom?",x:1,k:["examen|inburgering|toets"],m:"Dan doe ik mijn inburgeringsexamen.",r:"Waarom wil je die dag vrij?"},
  {a:"O, dat is belangrijk. Maar op vrijdag is het druk. Wie werkt er dan voor jou?",k:["zaterdag|ruilen|collega|weet"],m:"Ik kan op zaterdag werken. Misschien kan ik ruilen met een collega.",r:"Kun je misschien op een andere dag werken?"},
  {a:"Goed idee. Dan werk jij zaterdag, en Fatima werkt vrijdag. Is dat goed?",k:["ja|goed|prima|oke|oké|top|dank"],m:"Ja, prima. Dank je wel!",r:"Is dat goed voor jou?"}],
 e:"Graag gedaan. Succes met je examen!"},
{id:"juf",t:"Een gesprek met de juf",s:"Praat met de juf over je dochter.",w:"Juf Marieke",p:"boek",
 o:"Je dochter Lina zit in groep 3. Je hebt een gesprek met haar juf. Je wilt weten hoe het gaat met lezen. Thuis lezen jullie elke avond een boekje. Vraag wat je nog meer kunt doen.",
 d:[{a:"Goedemiddag, fijn dat u er bent. Gaat u zitten. Heeft u vragen over Lina?",k:["lezen|leest"],m:"Ja. Hoe gaat het met lezen?",r:"Wat wilt u weten over Lina?"},
  {a:"Lina doet goed haar best. Rekenen gaat heel goed, maar lezen vindt ze nog moeilijk. Leest u thuis met haar?",k:["ja|elke|avond|boek"],m:"Ja, we lezen elke avond een boekje.",r:"Leest u thuis samen met Lina?"},
  {a:"Wat goed! Dat helpt echt.",k:["wat|kan|meer|doen|tip|hoe"],m:"Wat kan ik nog meer doen?",r:"Wilt u nog iets vragen?"},
  {a:"U kunt met Lina naar de bibliotheek gaan. Daar kiest ze zelf boeken, en voor kinderen is het gratis.",k:["bibliotheek|idee|doen|ja|dank"],m:"Goed idee, dat doen we. Dank u wel.",r:"Gaat u weleens naar de bibliotheek?"}],
 e:"Graag gedaan. Over drie maanden praten we weer. Tot ziens!"},
{id:"spreekkamer",t:"Bij de huisarts",s:"Vertel de dokter wat je klachten zijn.",w:"Huisarts",p:"dokter",
 o:"Je hebt al een week hoofdpijn, vooral 's avonds. Je slaapt slecht. Je hebt paracetamol genomen, maar dat helpt niet goed. Vertel het de dokter, en herhaal daarna het advies.",
 d:[{a:"Goedemorgen, gaat u zitten. Wat kan ik voor u doen?",k:["hoofdpijn|hoofd"],m:"Goedemorgen, dokter. Ik heb al een week hoofdpijn.",r:"Waar heeft u last van?"},
  {a:"Sinds wanneer heeft u hoofdpijn?",x:1,k:["week|sinds|dagen"],m:"Sinds een week.",r:"Hoe lang heeft u al hoofdpijn?"},
  {a:"Heeft u de hele dag hoofdpijn?",k:["avond|nee|niet"],m:"Nee, vooral 's avonds.",r:"Wanneer heeft u de meeste pijn: 's ochtends of 's avonds?"},
  {a:"Slaapt u goed?",k:["slecht|niet|nee"],m:"Nee, ik slaap slecht.",r:"Hoe slaapt u 's nachts?"},
  {a:"Heeft u al medicijnen genomen?",x:1,k:["paracetamol"],m:"Ja, paracetamol. Maar dat helpt niet goed.",r:"Heeft u iets tegen de pijn genomen? Paracetamol misschien?"},
  {a:"Ik denk dat u te veel stress heeft. Kijk 's avonds niet naar uw telefoon, en wandel elke dag een half uur. Is het over twee weken niet beter, kom dan terug.",k:["telefoon|wandel|lopen|twee weken"],m:"Dus 's avonds geen telefoon, en elke dag wandelen. En als het niet beter is, kom ik over twee weken terug.",r:"Kunt u even herhalen wat u gaat doen?"}],
 e:"Precies. Beterschap!"},
{id:"bakker",g:"In de stad",t:"Bij de bakker",s:"Koop brood en croissants.",w:"Bakker",p:"pinnen",
 o:"Je wilt een volkorenbrood, gesneden, en vier croissants. Je betaalt met je pinpas. De bon hoef je niet.",
 d:[{a:"Goedemiddag! Wie is er aan de beurt?",k:["ik|mij|beurt"],m:"Ik ben aan de beurt.",r:"Bent u aan de beurt?"},
  {a:"Zegt u het maar. Wat mag het zijn?",x:1,k:["volkoren"],m:"Ik wil graag een volkorenbrood.",r:"Welk brood wilt u? Wit, bruin of volkoren?"},
  {a:"Een volkorenbrood. Heel of gesneden?",x:1,k:["gesneden|snij"],m:"Gesneden, graag.",r:"Wilt u het brood gesneden?"},
  {a:"Alstublieft. Anders nog iets?",x:1,k:["croissant"],m:"Ja, ook graag vier croissants.",r:"Wilt u nog iets anders?"},
  {a:"Hoeveel croissants wilt u?",x:1,k:["vier|4"],m:"Vier, graag.",r:"Hoeveel croissants?"},
  {a:"Dat is dan samen € 8,40. Hoe wilt u betalen?",k:["pin|kaart|bankpas|betaalpas"],m:"Ik betaal met mijn pinpas.",r:"Betaalt u contant of met de pinpas?"},
  {a:"Houdt u de pas maar tegen het apparaat. Gelukt! Wilt u de bon?",k:["nee|hoeft|niet"],m:"Nee, dank u wel.",r:"Wilt u de bon, ja of nee?"}],
 e:"Alstublieft, uw brood en uw croissants. Fijne dag nog!"},
{id:"apotheek",t:"Bij de apotheek",s:"Haal je medicijnen op en vraag hoe je ze neemt.",w:"Assistent",p:"pil",
 o:"De huisarts heeft medicijnen voorgeschreven. Haal ze op bij de apotheek en vraag hoe je ze moet gebruiken. Herhaal het antwoord, zo weet je zeker dat je het goed begrijpt. Je wilt ook een doosje paracetamol.",
 d:[{a:"Goedemorgen, waarmee kan ik u helpen?",k:["medicij|recept|ophalen|huisarts|dokter"],m:"Goedemorgen. Ik kom mijn medicijnen ophalen.",r:"Wat kan ik voor u doen?"},
  {a:"Wat is uw geboortedatum?",k:[],m:"Ik ben geboren op 12 maart 1990.",r:"Wanneer bent u geboren? De dag, de maand en het jaar graag."},
  {a:"Dank u. Uw medicijnen liggen klaar. Weet u hoe u ze moet gebruiken?",k:["nee|hoe|vaak|wanneer|uitleg|niet"],m:"Nee. Hoe vaak moet ik ze innemen?",r:"Weet u hoe vaak u ze moet nemen?"},
  {a:"U neemt drie keer per dag één tablet, bij het eten. Drink er geen alcohol bij.",k:["drie|3","eten|maaltijd"],m:"Drie keer per dag, bij het eten. Duidelijk, dank u.",r:"Kunt u even herhalen hoe vaak u een tablet neemt, en wanneer?"},
  {a:"Precies. Kan ik verder nog iets voor u doen?",k:["paracetamol"],m:"Ja, ik wil ook graag een doosje paracetamol.",r:"Wilt u nog iets anders? Iets tegen pijn misschien?"},
  {a:"Een doosje met twintig tabletten kost € 2,50. Is dat goed?",k:["ja|goed|prima|graag"],m:"Ja, prima.",r:"Wilt u de paracetamol voor € 2,50?"}],
 e:"Alstublieft: uw medicijnen en de paracetamol. Beterschap!"},
{id:"cafe",t:"In een café",s:"Bestel iets te drinken en te eten, en reken af.",w:"Ober",p:"restaurant",
 o:"Je zit in een café. Je wilt koffie met melk en een tosti ham-kaas. Daarna reken je af: je geeft een briefje van tien euro en de rest is een fooi.",
 d:[{a:"Hallo! Weet u al wat u wilt drinken?",k:["koffie"],m:"Ja, ik wil graag een koffie.",r:"Wilt u koffie, thee of iets anders?"},
  {a:"Met melk of zwart?",x:1,k:["melk"],m:"Met melk, graag.",r:"Wilt u melk in uw koffie?"},
  {a:"Wilt u er ook iets bij eten?",x:1,k:["tosti"],m:"Ja, graag een tosti.",r:"We hebben soep, broodjes en tosti's. Wat wilt u?"},
  {a:"Ham-kaas of alleen kaas?",x:1,k:["ham"],m:"Ham-kaas, graag.",r:"Wilt u er ham op?"},
  {a:"Alstublieft: uw koffie en een tosti ham-kaas. Eet smakelijk!",k:["dank|bedankt|lekker"],m:"Dank u wel!",r:"Eet smakelijk!"},
  {a:"Smaakte het?",k:["lekker|goed|ja","afreken|betalen|rekening"],m:"Ja, heel lekker. Mag ik afrekenen?",r:"Fijn! Wilt u nog iets, of wilt u betalen?"},
  {a:"Natuurlijk. Dat is dan € 8,50.",k:["tien|10","rest|goed zo|klopt|houden|fooi"],m:"Alstublieft, tien euro. Laat de rest maar zitten.",r:"Hoeveel geeft u? En wilt u geld terug?"}],
 e:"Dank u wel, dat is heel aardig! Fijne dag nog."},
{id:"station",t:"Een treinkaartje kopen",s:"Koop een kaartje en vraag van welk spoor de trein gaat.",w:"Medewerker",p:"trein",
 o:"Je staat bij de servicebalie op het station. Je wilt vandaag naar Utrecht, tweede klas, en vanavond weer terug (retour). Je betaalt met je pinpas. Vraag ook van welk spoor de trein vertrekt, en herhaal het antwoord.",
 d:[{a:"Goedemiddag, zegt u het maar.",k:["kaart|retour|reis|utrecht"],m:"Goedemiddag. Ik wil graag een kaartje naar Utrecht.",r:"Waarmee kan ik u helpen?"},
  {a:"Waar wilt u naartoe?",x:1,k:["utrecht"],m:"Naar Utrecht.",r:"Naar welk station wilt u?"},
  {a:"Enkele reis of retour?",x:1,k:["retour|terug"],m:"Retour, graag. Ik kom vanavond terug.",r:"Komt u vandaag ook weer terug?"},
  {a:"Eerste of tweede klas?",x:1,k:["tweede|2"],m:"Tweede klas.",r:"In welke klas wilt u reizen?"},
  {a:"Een retour Utrecht, tweede klas. Dat is € 19,80. Pinnen of contant?",k:["pin|kaart|bankpas|betaalpas"],m:"Ik pin.",r:"Hoe wilt u betalen?"},
  {a:"Alstublieft, uw kaartje. Goede reis!",k:["spoor|perron"],m:"Dank u wel. Van welk spoor vertrekt de trein naar Utrecht?",r:"Heeft u nog een vraag?"},
  {a:"De trein naar Utrecht vertrekt om 14.12 uur van spoor 5.",k:["vijf|5"],m:"Spoor 5, om 14.12 uur. Dank u wel!",r:"Sorry, ik begrijp u niet. Ik zeg het nog een keer: de trein vertrekt om 14.12 uur van spoor 5."}],
 e:"Precies. Goede reis!"},
{id:"ruilen",t:"Iets ruilen in de winkel",s:"Je trui is te klein: ruil hem of vraag je geld terug.",w:"Verkoper",p:"winkel",
 o:"Je hebt vorige week een trui gekocht, maar hij is te klein. Je hebt de bon nog. Je wilt hem ruilen voor maat L. Kan dat niet, dan wil je je geld terug.",
 d:[{a:"Goedemiddag, kan ik u helpen?",k:["ruil|terug|klein|trui"],m:"Goedemiddag. Ik wil deze trui ruilen. Hij is te klein.",r:"Wat kan ik voor u doen?"},
  {a:"Wat is het probleem?",x:1,k:["klein|groot|maat|past"],m:"Hij is te klein.",r:"Wat is er met de trui?"},
  {a:"Heeft u de bon nog?",k:["ja|hier|bon|alstublieft"],m:"Ja, hier is de bon.",r:"Heeft u de kassabon?"},
  {a:"Dank u. Welke maat wilt u?",x:1,k:["l|el|large|groter"],m:"Maat L, graag.",r:"Welke maat heeft u nodig?"},
  {a:"O, wat jammer: maat L hebben we niet meer. Wilt u een andere trui, of uw geld terug?",k:["geld|terug"],m:"Dan wil ik graag mijn geld terug.",r:"Wilt u een andere trui, of uw geld terug?"},
  {a:"Dat kan. Het geld gaat terug naar uw bankrekening. Is dat goed?",k:["ja|goed|prima|oke|oké|dank"],m:"Ja, prima. Dank u wel.",r:"Is dat goed voor u?"}],
 e:"Alstublieft, het is geregeld. Fijne dag nog!"},
{id:"fiets",t:"Bij de fietsenmaker",s:"Je band is lek: vraag wat het kost en wanneer de fiets klaar is.",w:"Fietsenmaker",p:"fietsenmaker",
 o:"Je achterband is lek. Morgenochtend om acht uur heb je de fiets nodig voor je werk. Vraag wat de reparatie kost en wanneer de fiets klaar is.",
 d:[{a:"Hoi! Wat kan ik voor je doen?",k:["band|lek|kapot|repar|maken"],m:"Hallo. Mijn fiets heeft een lekke band.",r:"Wat is er met je fiets?"},
  {a:"Voor of achter?",x:1,k:["achter"],m:"Achter.",r:"Is het de voorband of de achterband?"},
  {a:"Oké, dat kan ik maken.",k:["kost|prijs|duur|euro"],m:"Wat kost dat?",r:"Wil je nog iets weten?"},
  {a:"Met een nieuwe binnenband is het vijftien euro.",k:["wanneer|klaar|hoe laat|vandaag|morgen"],m:"Goed. Wanneer is de fiets klaar?",r:"Is dat goed? Wil je nog iets weten?"},
  {a:"Morgen aan het eind van de middag, om vijf uur.",k:["ochtend|eerder|vroeger|vandaag|werk|nodig|laat"],m:"Dat is te laat. Ik heb de fiets morgenochtend nodig voor mijn werk. Kan het eerder?",r:"Is dat goed voor je?"},
  {a:"Hm… Dan maak ik hem vandaag nog. Kom maar om zes uur terug.",k:["ja|goed|prima|top|dank|oke|oké|zes|6"],m:"Top, dan kom ik om zes uur terug. Dank je wel!",r:"Kun je om zes uur komen?"}],
 e:"Tot straks!"},
{id:"markt",t:"Op de markt",s:"Koop groente en fruit, en vraag een prijs.",w:"Marktkoopman",
 o:"Je staat op de markt bij de kraam met groente en fruit. Je wilt een kilo appels en een halve kilo tomaten. Vraag wat de aardbeien kosten. Je betaalt contant.",
 d:[{a:"Goedemorgen! Wat mag het zijn?",k:["appel"],m:"Goedemorgen. Ik wil graag een kilo appels.",r:"Wat wilt u hebben?"},
  {a:"Hoeveel appels?",x:1,k:["kilo"],m:"Een kilo, graag.",r:"Hoeveel wilt u? Een kilo, twee kilo?"},
  {a:"Een kilo appels. Wat nog meer?",x:1,k:["toma"],m:"Een halve kilo tomaten, alstublieft.",r:"Wilt u ook groente?"},
  {a:"Alsjeblieft. Verder nog iets?",k:["aardbei"],m:"Wat kosten de aardbeien?",r:"Verder nog iets? Het fruit is vandaag heel vers."},
  {a:"Drie euro per bakje, twee bakjes voor vijf euro.",k:[],m:"Dan neem ik twee bakjes.",r:"Wilt u aardbeien?"},
  {a:"Dat is dan samen negen euro vijftig. Pinnen of contant?",k:["contant|cash|briefje"],m:"Contant. Alstublieft, tien euro.",r:"Hoe wilt u betalen?"}],
 e:"Vijftig cent terug. Dank je wel, en tot volgende week!"},
{id:"bieb",t:"Lid worden van de bibliotheek",s:"Maak een pas voor jou en je zoon.",w:"Medewerker",
 o:"Je wilt lid worden van de bibliotheek. Je wilt boeken lenen voor jezelf en voor je zoon (8 jaar). Je hebt je paspoort bij je. Vraag wat het kost en hoe lang je een boek mag houden.",
 d:[{a:"Goedemiddag, kan ik u helpen?",k:["lid|abonnement|pas|inschrijv"],m:"Goedemiddag. Ik wil graag lid worden van de bibliotheek.",r:"Wat kan ik voor u doen?"},
  {a:"Leuk! Is het voor u alleen?",k:["zoon|kind"],m:"Nee, ook voor mijn zoon. Hij is acht jaar.",r:"Wilt u alleen een pas voor uzelf, of ook voor iemand anders?"},
  {a:"Voor kinderen tot achttien jaar is het gratis. Heeft u een ID-kaart of paspoort bij u?",k:["ja|hier|paspoort|alstublieft"],m:"Ja, hier is mijn paspoort.",r:"Mag ik uw paspoort of ID-kaart zien?"},
  {a:"Dank u. Ik maak de passen voor u klaar. Heeft u nog vragen?",k:["kost|prijs|betalen|lang|houden|weken"],m:"Ja. Wat kost het voor mij?",r:"Wilt u nog iets weten?"},
  {a:"Voor volwassenen is het 55 euro per jaar.",k:["lang|houden|weken|terug"],m:"En hoe lang mag ik een boek houden?",r:"Heeft u nog een vraag?"},
  {a:"Drie weken. Daarna kunt u het boek online verlengen.",k:["drie|3|weken|dank|duidelijk|goed|oke|oké"],m:"Drie weken. Duidelijk, dank u wel!",r:"Is dat duidelijk?"}],
 e:"Graag gedaan. Hier zijn uw passen. Veel leesplezier!"},
{id:"weg",t:"De weg vragen",s:"Vraag de weg naar het station en herhaal de route.",w:"Voorbijganger",p:"fietsen",
 o:"Je bent in een stad die je niet kent en je zoekt het station. Vraag de weg aan iemand op straat. Herhaal de route, zo weet je zeker dat je het goed begrijpt.",
 d:[{a:"Ja? Kan ik u helpen?",k:["station"],m:"Pardon, weet u waar het station is?",r:"Wat zoekt u?"},
  {a:"Het station? Dat is niet ver. Ga hier rechtdoor tot het stoplicht. Daar gaat u naar links.",k:["rechtdoor","links"],m:"Rechtdoor tot het stoplicht, en dan naar links.",r:"Ik zeg het nog een keer: rechtdoor tot het stoplicht, en daar naar links."},
  {a:"Ja. Dan ziet u een grote kerk. Na de kerk neemt u de tweede straat rechts.",k:["tweede|2","rechts"],m:"Na de kerk de tweede straat rechts.",r:"Ik herhaal het: na de kerk, de tweede straat rechts."},
  {a:"Precies. Daar ziet u het station al.",k:["dank|bedankt|ver|lopen"],m:"Dank u wel! Is het ver lopen?",r:"Is het duidelijk?"}],
 e:"Nee hoor, een minuut of tien. Succes!"},
{id:"buren",g:"In de buurt",t:"Je nieuwe buurvrouw",s:"Stel je voor en nodig haar uit voor koffie.",w:"Els",p:"stad",
 o:"Je bent net verhuisd. Op straat zie je je buurvrouw. Vertel wie je bent en waar je vandaan komt. Nodig haar uit voor koffie, zaterdagmiddag om drie uur.",
 d:[{a:"Hallo! Woont u sinds kort hier, op nummer 12?",k:["ja|klopt|woon"],m:"Ja, ik woon hier sinds vorige week.",r:"Bent u de nieuwe buurvrouw of buurman?"},
  {a:"Welkom in de straat! Ik ben Els, van nummer 10. Hoe heet u?",k:[],m:"Ik heet [je naam]. Leuk u te ontmoeten.",r:"Sorry, hoe heet u?"},
  {a:"Leuk u te ontmoeten. Waar komt u vandaan?",k:[],m:"Ik kom uit [je land].",r:"Uit welk land komt u?"},
  {a:"En wat doet u? Werkt u, of gaat u naar school?",k:[],m:"Ik leer Nederlands. Later wil ik in een ziekenhuis werken.",r:"Heeft u werk? Of studeert u?"},
  {a:"Wat goed! Als u iets nodig hebt, kunt u altijd bij mij aanbellen.",k:["koffie|thee","zaterdag"],m:"Dank u wel! Wilt u zaterdag een kopje koffie bij mij komen drinken?",r:"Wilde u nog iets vragen?"},
  {a:"Wat gezellig! Graag. Hoe laat?",x:1,k:["drie|3|15"],m:"Om drie uur. Is dat goed?",r:"Hoe laat zal ik komen?"}],
 e:"Drie uur is prima. Tot zaterdag!"},
{id:"lawaai",t:"Te veel lawaai",s:"Vraag je buurman vriendelijk om zachter te doen.",w:"Buurman Kees",
 o:"Je buurman draait elke avond harde muziek, tot één uur 's nachts. Jij moet om zes uur op voor je werk. Praat vriendelijk met hem en vraag of de muziek na tien uur zachter kan.",
 d:[{a:"Hé, hallo! Alles goed?",k:["muziek|lawaai|hard|slapen|geluid"],m:"Hallo Kees. Mag ik iets vragen? Uw muziek is 's avonds heel hard.",r:"Is er iets?"},
  {a:"O ja? Dat wist ik niet. Hoe laat dan?",x:1,k:["laat|nacht|elke|een uur|1 uur"],m:"Elke avond, tot één uur 's nachts.",r:"Wanneer hoort u de muziek?"},
  {a:"Dat is inderdaad laat. Sorry!",k:["zes|6|vroeg|werk|slapen|slaap"],m:"Ik moet om zes uur op voor mijn werk. Dan kan ik niet slapen.",r:"Is dat een probleem voor u?"},
  {a:"Dat begrijp ik. Wat wilt u dat ik doe?",k:["zacht|tien|10|uit|stil"],m:"Kan de muziek na tien uur wat zachter?",r:"Wat zou u graag willen?"},
  {a:"Natuurlijk, dat is geen probleem. Na tien uur zet ik de muziek zachter.",k:["dank|bedankt|fijn|aardig|top|super"],m:"Dank u wel, dat is heel aardig!",r:"Is dat goed zo?"}],
 e:"Graag gedaan. En is het weer te hard, belt u dan gewoon aan!"},
{id:"b1sollicitatie",g:"B1: werk, wonen en zaken regelen",b1:1,t:"Sollicitatiegesprek klantenservice",s:"Vertel over je ervaring en laat zien wat je kunt.",w:"Annemiek",p:"sollicitatie",
 o:"Je solliciteert als medewerker klantenservice bij een energiebedrijf. Je hebt drie jaar in een telefoonwinkel gewerkt. Je spreekt Nederlands, Engels en Arabisch. Je kunt over twee weken beginnen.",
 d:[{a:"Welkom, fijn dat u er bent. Vertelt u eerst eens iets over uzelf.",k:["werk|ervaring|winkel|jaar|woon|kom"],m:"Ik ben [je naam]. Ik woon nu vijf jaar in Nederland, en ik heb drie jaar in een telefoonwinkel gewerkt.",r:"Kunt u iets vertellen over uw werk of uw achtergrond?"},
  {a:"Waarom wilt u bij ons werken?",k:["omdat|want|graag|leuk|interessant|klant|help"],m:"Ik wil graag bij u werken, omdat ik het leuk vind om klanten te helpen. En duurzame energie vind ik belangrijk.",r:"Wat trekt u aan in deze baan?"},
  {a:"Kunt u een voorbeeld geven van een lastige klant, en wat u toen deed?",k:["klant|boos|probleem","rustig|luister|oploss|uitgeleg|geholpen|excuses|sorry"],m:"Een keer was een klant boos, omdat zijn telefoon kapot was. Ik bleef rustig, ik luisterde goed en ik heb samen met hem een oplossing gezocht.",r:"Wat deed u precies toen die klant boos was?"},
  {a:"Welke talen spreekt u?",k:["nederlands|engels|arabisch|taal|talen"],m:"Ik spreek Nederlands, Engels en Arabisch.",r:"Spreekt u nog andere talen dan Nederlands?"},
  {a:"Wat vindt u zelf uw zwakke punt?",k:["soms|te|moeilijk|leer|probeer|zwak|ongeduldig|perfect"],m:"Soms ben ik te ongeduldig, maar ik probeer daaraan te werken door eerst goed te luisteren.",r:"Wat zou u bij uzelf nog willen verbeteren?"},
  {a:"Wanneer zou u kunnen beginnen?",k:["week|weken|maand|direct|meteen|maandag"],m:"Ik kan over twee weken beginnen.",r:"Per wanneer bent u beschikbaar?"}],
 e:"Dank u wel voor het gesprek. U hoort binnen een week van ons."},
{id:"b1schimmel",b1:1,t:"Klagen bij de woningcorporatie",s:"Er zit schimmel in je badkamer en er gebeurt niets.",w:"Mark",p:"bellen",
 o:"In je badkamer zit al drie maanden schimmel. Je hebt in januari al gebeld, maar er is niets gebeurd. Je zoon heeft astma. Bel de woningcorporatie: je wilt dat er deze week iemand komt.",
 d:[{a:"Woonstichting Thuis, u spreekt met Mark. Waarmee kan ik u helpen?",k:["schimmel|badkamer|klacht|probleem|vocht"],m:"Goedemiddag, met [je naam]. Ik bel over schimmel in mijn badkamer.",r:"Waar gaat uw vraag over?"},
  {a:"Wat vervelend. Hoe lang heeft u dat al?",k:["maand|maanden|december|januari|week|weken|lang"],m:"Al drie maanden. En ik heb in januari al gebeld, maar er is niets gebeurd.",r:"Sinds wanneer heeft u last van de schimmel?"},
  {a:"Heeft u daar al eerder over gebeld?",x:1,k:["januari|gebeld|ja|eerder"],m:"Ja, ik heb in januari gebeld, maar er is nooit iemand gekomen.",r:"Heeft u ons hier al eerder over gebeld?"},
  {a:"Dat spijt me. Ik kan een monteur sturen, maar de eerste plek is pas over drie weken.",k:["eerder|sneller|snel|deze week|lang|astma|gezond"],m:"Dat is te lang. Mijn zoon heeft astma en hij hoest veel. Kan er deze week niet iemand komen?",r:"Is dat goed voor u, over drie weken?"},
  {a:"Ik begrijp het. Ik geef het als spoed door. Er kan donderdagochtend iemand komen. Bent u dan thuis?",k:["ja|prima|goed|thuis|kan"],m:"Ja, donderdagochtend ben ik thuis. Dank u wel.",r:"Bent u donderdagochtend thuis?"},
  {a:"Mooi. U krijgt nog een bevestiging per e-mail. Kan ik verder nog iets voor u doen?",k:["nee|ja|dank|bedankt|vraag|duidelijk|wat|hoe"],m:"Nee, dank u wel voor uw hulp.",r:"Heeft u verder nog een vraag?"}],
 e:"Graag gedaan. Tot donderdag, en sterkte met uw zoon."},
{id:"b1school",b1:1,t:"Gesprek met de juf",s:"Je zoon verveelt zich op school.",w:"Juf Marieke",p:"boek",
 o:"Je zoon Ilias zit in groep 6. De juf vindt dat hij in de klas veel praat en zijn werk niet afmaakt. Thuis vertelt hij dat hij zich verveelt, omdat het werk te makkelijk is. Bespreek dit met de juf.",
 d:[{a:"Fijn dat u kon komen. Hoe gaat het volgens u met Ilias?",k:["goed|gaat|thuis|verveel|makkelijk|school"],m:"Thuis gaat het goed, maar hij zegt dat hij zich op school verveelt.",r:"Hoe vindt Ilias het zelf op school, denkt u?"},
  {a:"Dat is interessant. In de klas praat hij veel, en hij maakt zijn werk vaak niet af.",k:["makkelijk|verveel|moeilijk|uitdag|denk|misschien"],m:"Misschien komt dat doordat het werk te makkelijk voor hem is. Hij zegt dat hij zich verveelt.",r:"Hoe zou dat komen, denkt u?"},
  {a:"Dat kan. Bij rekenen is hij inderdaad snel. Wat zou u willen?",k:["extra|moeilijk|uitdag|meer|ander|plusklas|test"],m:"Kan hij misschien extra werk krijgen, of moeilijker werk, bijvoorbeeld bij rekenen?",r:"Wat zou volgens u kunnen helpen?"},
  {a:"Dat is een goed idee. Maar dan moet hij zijn gewone werk ook afmaken. Wilt u daar thuis met hem over praten?",k:["ja|natuurlijk|zeker|praat|zal|goed"],m:"Ja, natuurlijk. Ik praat er vanavond met hem over.",r:"Wilt u thuis met hem praten over zijn werk in de klas?"},
  {a:"Zullen we over zes weken nog een keer kijken hoe het gaat?",k:["ja|goed|prima|afspraak|lijkt"],m:"Ja, dat lijkt me goed. Dan maken we een nieuwe afspraak.",r:"Zullen we over zes weken opnieuw praten?"}],
 e:"Afgesproken. Bedankt voor het gesprek."},
{id:"b1salaris",b1:1,t:"Over je salaris praten",s:"Je doet meer werk: vraag om meer salaris.",w:"Erik",p:"kantoor",
 o:"Je werkt twee jaar als magazijnmedewerker. Sinds een half jaar doe je ook de planning, maar je salaris is niet omhooggegaan. Je wilt 150 euro per maand meer. Praat met je teamleider Erik.",
 d:[{a:"Je wilde me spreken. Waar gaat het over?",k:["salaris|loon|verhoging|geld|betaal"],m:"Ja, ik wil graag over mijn salaris praten.",r:"Waarover wilde je met me praten?"},
  {a:"Oké. Waarom vind je dat je meer zou moeten verdienen?",k:["planning|taak|taken|verantwoordelijk|meer werk|jaar|ervaring"],m:"Ik werk hier nu twee jaar, en sinds een half jaar doe ik ook de planning. Dat is meer verantwoordelijkheid.",r:"Wat is er veranderd in je werk?"},
  {a:"Dat klopt, en je doet het goed. Aan welk bedrag had je gedacht?",k:["150|honderdvijftig|euro|honderd"],m:"Ik had gedacht aan honderdvijftig euro per maand meer.",r:"Hoeveel meer zou je willen verdienen?"},
  {a:"Dat is veel. Ik kan je honderd euro geven, en volgend jaar kijken we opnieuw.",k:["ja|akkoord|goed|prima|nee|liever|maar|afspra|opleiding|cursus"],m:"Dat is minder dan ik hoopte, maar ik ga akkoord als we volgend jaar opnieuw kijken.",r:"Wat vind je van dat voorstel?"},
  {a:"Prima. Ik zet het op papier. Heb je verder nog iets?",k:["nee|ja|dank|bedankt|vraag|wanneer|hoe"],m:"Nee, dank je wel. Fijn dat het gelukt is.",r:"Is er verder nog iets?"}],
 e:"Graag gedaan. Ik stuur je het voorstel vandaag nog."},
{id:"b1buurman",b1:1,t:"Een probleem met de bovenbuurman",s:"Zoek samen een oplossing voor het lawaai.",w:"Henk",p:"flat",
 o:"Je bovenbuurman Henk laat 's avonds laat de wasmachine draaien. Jij hoort het in je slaapkamer en je kunt niet slapen. Praat met hem en zoek samen een oplossing.",
 d:[{a:"Hé, buurvrouw. Wat kan ik voor je doen?",k:["wasmachine|lawaai|geluid|slapen|avond|nacht"],m:"Hallo Henk. Ik wil iets vragen over je wasmachine. Die draait vaak 's avonds laat.",r:"Is er iets?"},
  {a:"O, hoor je dat? Dat wist ik niet.",k:["slaapkamer|slapen|wakker|hard|hoor|boven"],m:"Ja, mijn slaapkamer ligt onder jouw badkamer. Ik hoor het heel hard, en dan kan ik niet slapen.",r:"Hoor je dat echt zo goed?"},
  {a:"Sorry, dat is vervelend. Maar ik werk tot negen uur, dus pas daarna kan ik wassen.",k:["weekend|ochtend|voor|tien|uur|zaterdag|zondag|misschien|kun"],m:"Misschien kun je in het weekend wassen, of de wasmachine aanzetten voordat je naar je werk gaat?",r:"Heb je een idee wanneer je anders kunt wassen?"},
  {a:"Hm, mijn wasmachine heeft een uitstelknop. Dan is hij om zeven uur 's ochtends klaar. Is dat beter?",k:["ja|beter|prima|goed|perfect|fijn"],m:"Ja, dat is veel beter. Dan ben ik al wakker.",r:"Zou dat voor jou werken?"},
  {a:"Goed, dan doe ik dat. Fijn dat je het gewoon even kwam zeggen.",k:["dank|bedankt|fijn|graag|natuurlijk|aardig"],m:"Bedankt, Henk. Fijn dat je het begrijpt.",r:"Is het zo goed?"}],
 e:"Geen probleem. Slaap lekker vannacht!"},
{id:"b1verzekering",b1:1,t:"De verzekering bellen",s:"Je hebt een aanrijding gehad: meld de schade.",w:"Sanne",p:"auto",
 o:"Je hebt gisteren een aanrijding gehad. Je stond stil op een parkeerplaats, en een andere auto reed achteruit tegen jouw auto. Niemand is gewond. Jullie hebben samen een schadeformulier ingevuld. Bel je verzekering.",
 d:[{a:"Autoverzekeraar Veilig Onderweg, u spreekt met Sanne. Waarmee kan ik u helpen?",k:["aanrijding|ongeluk|schade|botsing|auto"],m:"Goedemiddag, met [je naam]. Ik heb gisteren een aanrijding gehad met mijn auto.",r:"Waar belt u over?"},
  {a:"Vervelend. Is er iemand gewond geraakt?",k:["nee|niemand|gelukkig|niet"],m:"Nee, gelukkig is niemand gewond.",r:"Is er iemand gewond?"},
  {a:"Gelukkig. Kunt u vertellen wat er is gebeurd?",k:["achteruit|reed|tegen|parke|stond"],m:"Ik stond stil op een parkeerplaats, en een andere auto reed achteruit tegen mijn auto.",r:"Hoe is het ongeluk gebeurd?"},
  {a:"Heeft u samen met de andere bestuurder een schadeformulier ingevuld?",k:["ja|formulier|ingevuld|getekend"],m:"Ja, we hebben samen het schadeformulier ingevuld en allebei getekend.",r:"Heeft u het schadeformulier ingevuld?"},
  {a:"Mooi. Wilt u dat formulier en een paar foto's van de schade via onze app opsturen?",k:["ja|goed|prima|doe|stuur|app"],m:"Ja, dat doe ik vandaag nog. Mag ik de auto al laten repareren?",r:"Kunt u het formulier en de foto's opsturen?"},
  {a:"Wacht daar even mee, tot een expert de schade heeft bekeken. Die belt u deze week. Heeft u nog een vraag?",k:["nee|ja|dank|bedankt|vraag|vervang|huur|auto"],m:"Nee, het is duidelijk. Dank u wel.",r:"Heeft u verder nog een vraag?"}],
 e:"Graag gedaan. U hoort snel van ons."},
{id:"ona1",ona:1,g:"ONA-eindgesprek",t:"Je beroep",s:"Welk beroep, en wat weet je ervan?",w:"Mevrouw Bakker",
 o:"Je doet het eindgesprek van ONA bij DUO. In je portfolio heb je het beroep kok gekozen. In je eigen land werkte je vijf jaar als kok in een restaurant. Vertel over je beroep.",
 d:[{a:"Goedemorgen, ik ben mevrouw Bakker van DUO. Ik heb uw portfolio gelezen. Welk beroep heeft u gekozen?",k:["kok|koken|keuken"],m:"Goedemorgen. Ik heb het beroep kok gekozen.",r:"Welk beroep wilt u gaan doen?"},
  {a:"Waarom wilt u kok worden?",k:[],m:"Ik kook heel graag, en ik heb in mijn land al vijf jaar in een restaurant gewerkt.",r:"Waarom kiest u voor dit beroep?"},
  {a:"Wat doet een kok op een gewone werkdag?",k:["kook|koken|snij|bereid|maak|schoon|bestel|gerecht|eten|keuken"],m:"Een kok maakt het eten klaar, snijdt groente en vlees, en houdt de keuken schoon. Hij bestelt ook de producten.",r:"Wat doet u allemaal als kok?"},
  {a:"Welke opleiding hebben koks in Nederland meestal?",k:["mbo|opleiding|school|cursus|diploma|leren"],m:"Meestal een mbo-opleiding tot kok. Je kunt ook werken en leren tegelijk.",r:"Welke school of opleiding is er voor koks?"},
  {a:"En wat zijn de werktijden van een kok?",k:["avond|weekend|laat|zaterdag|zondag|feestdag|onregelmatig|dienst"],m:"Een kok werkt vaak 's avonds en in het weekend. Dat vind ik niet erg.",r:"Wanneer werkt een kok meestal?"},
  {a:"U koos eerst drie beroepen. Waarom heeft u kok gekozen, en niet een van de andere twee?",k:[],m:"Omdat ik al ervaring heb als kok. Dat beroep past het beste bij mij.",r:"Waarom past dit beroep het beste bij u?"}],
 e:"Duidelijk, dank u wel. Dan gaan we het nu hebben over uw eigenschappen."},
{id:"ona2",ona:1,t:"Je eigenschappen",s:"Wat kun je goed, en wat nog niet?",w:"Mevrouw Bakker",
 o:"Je doet het eindgesprek van ONA bij DUO. In je portfolio heb je het beroep kok gekozen. In je eigen land werkte je vijf jaar als kok in een restaurant. Vertel wat je goed kunt.",
 d:[{a:"Welke eigenschappen heeft u? Noem er eens twee.",k:[],m:"Ik ben precies, en ik kan goed samenwerken.",r:"Hoe bent u? Noem twee eigenschappen."},
  {a:"Kunt u een voorbeeld geven? Wanneer werkte u goed samen?",k:[],m:"In het restaurant werkten we met vijf mensen in de keuken. Als het druk was, hielp ik altijd mijn collega's.",r:"Vertel eens over een keer dat u goed samenwerkte."},
  {a:"Wat kunt u nog niet zo goed?",k:[],m:"Mijn Nederlands is nog niet zo goed. Daarom volg ik een cursus.",r:"Wat wilt u nog beter leren?"},
  {a:"Welke competenties heeft een kok nodig?",k:["samenwerk|snel|druk|hygi|schoon|precies|nauwkeurig|creatief|stress|plan"],m:"Een kok moet snel en schoon werken, goed samenwerken en rustig blijven als het druk is.",r:"Wat moet een goede kok kunnen?"},
  {a:"En welke van die competenties heeft u al?",k:[],m:"Ik werk snel en schoon. Dat heb ik in mijn land geleerd.",r:"Wat kunt u daarvan al?"}],
 e:"Goed. Dan wil ik nu iets vragen over uw kansen op werk."},
{id:"ona3",ona:1,t:"Je kansen en je netwerk",s:"Is er werk, en wie kan je helpen?",w:"Mevrouw Bakker",
 o:"Je doet het eindgesprek van ONA bij DUO. In je portfolio heb je het beroep kok gekozen. In je eigen land werkte je vijf jaar als kok in een restaurant. Vertel over je kansen op werk en over de mensen die je kent.",
 d:[{a:"Zijn er in Nederland veel vacatures voor koks?",k:["ja|veel|vacature|genoeg|tekort|nodig"],m:"Ja, er zijn veel vacatures voor koks, vooral in de grote steden.",r:"Is er veel werk voor koks?"},
  {a:"Waar heeft u dat gezien?",k:["werk.nl|internet|site|website|indeed|krant|uwv|linkedin|uitzendbureau|app|online"],m:"Op werk.nl en op andere vacaturesites.",r:"Waar zoekt u naar vacatures?"},
  {a:"Uw diploma komt uit het buitenland. Wat kunt u daarmee doen?",k:["waarder|idw|erken|vertal|vergelijk"],m:"Ik kan mijn diploma laten waarderen bij IDW. Dan weet een werkgever wat het waard is.",r:"Hoe kan een werkgever zien wat uw diploma waard is?"},
  {a:"Wie kent u in Nederland die u kan helpen met werk?",k:[],m:"Mijn buurman werkt in een hotel. En ik ken mensen van mijn taalcursus.",r:"Kent u mensen die u kunnen helpen?"},
  {a:"Hoe kunt u uw netwerk groter maken?",k:["vrijwillig|linkedin|vragen|vertellen|praten|bijeenkomst|club|vereniging|stage|mensen|leren kennen"],m:"Ik kan vrijwilligerswerk doen, bijvoorbeeld in een buurthuis, en een profiel maken op LinkedIn.",r:"Hoe kunt u meer mensen leren kennen?"}],
 e:"Mooi. Nog één onderwerp: werk vinden, en werken in Nederland."},
{id:"ona4",ona:1,t:"Werk vinden en werken in Nederland",s:"Solliciteren, je ziek melden, de werkcultuur.",w:"Mevrouw Bakker",
 o:"Je doet het eindgesprek van ONA bij DUO. In je portfolio heb je het beroep kok gekozen. In je eigen land werkte je vijf jaar als kok in een restaurant. Vertel hoe je werk gaat zoeken, en hoe werken in Nederland gaat.",
 d:[{a:"Hoe gaat u werk zoeken?",k:["vacature|solliciteer|solliciteren|uitzendbureau|werk.nl|zoek|brief|cv|bel|netwerk|internet|vraag"],m:"Ik zoek vacatures op internet, ik schrijf me in bij een uitzendbureau, en ik vraag het aan mensen die ik ken.",r:"Hoe gaat u een baan zoeken?"},
  {a:"Wat stuurt u mee als u solliciteert?",k:["cv|brief|motivatie"],m:"Mijn cv en een sollicitatiebrief.",r:"Wat stuurt u naar een werkgever?"},
  {a:"U bent ziek en u kunt niet werken. Wat doet u?",k:["bel|meld|leidinggevende|baas|chef|werkgever|manager|ziek"],m:"Dan bel ik mijn leidinggevende, voordat mijn werk begint.",r:"Wat doet u als u ziek bent?"},
  {a:"Is werken in Nederland anders dan in uw land?",k:[],m:"Ja. In Nederland zeggen mensen direct wat ze denken, en je moet altijd op tijd komen.",r:"Wat is anders aan werken in Nederland?"},
  {a:"Uw chef geeft u een opdracht, maar u begrijpt het niet. Wat doet u?",k:["vraag|vragen|nog een keer|uitleg|zeg|uitleggen"],m:"Dan vraag ik het. In Nederland is het normaal om vragen te stellen.",r:"Wat doet u als u iets niet begrijpt?"},
  {a:"Wat wilt u over vijf jaar bereiken?",k:[],m:"Over vijf jaar wil ik als kok werken in een goed restaurant, en misschien chef-kok worden.",r:"Waar wilt u over vijf jaar zijn?"}],
 e:"Dank u wel. Dat was het eindgesprek. De uitslag krijgt u later van DUO."}
];
