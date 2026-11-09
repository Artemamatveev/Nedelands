const languages = ["en", "ar", "tr", "hi", "zh", "es", "ru"];
// Dutch copy is also in the HTML so the page is readable without scripts.
const copy = {
  "Niveaus": ["Levels", "المستويات", "Seviyeler", "स्तर", "级别","Niveles","Уровни"],
  "Zo werkt het": ["How it works", "كيف يعمل", "Nasıl çalışır?", "यह कैसे काम करता है", "使用方法","Cómo funciona","Как это работает"],
  "Prijzen": ["Pricing", "الأسعار", "Fiyatlar", "कीमतें", "价格","Precios","Цены"],
  "Inloggen": ["Sign in", "تسجيل الدخول", "Giriş yap", "लॉग इन", "登录","Iniciar sesión","Войти"],
  "NEDERLANDS A2 & B1": ["DUTCH A2 & B1", "الهولندية A2 وB1", "A2 VE B1 FLEMENKÇE", "डच A2 और B1", "荷兰语 A2 和 B1","NEERLANDÉS A2 Y B1","НИДЕРЛАНДСКИЙ A2 И B1"],
  "Oefen Nederlands op jouw tempo.": ["Practise Dutch at your own pace.", "تدرّب على الهولندية بالسرعة التي تناسبك.", "Kendi hızında Flemenkçe çalış.", "अपनी गति से डच का अभ्यास करें।", "按自己的节奏练习荷兰语。","Practica neerlandés a tu ritmo.","Занимайтесь нидерландским в своём темпе."],
  "Bereid je voor op je inburgeringsexamen of Staatsexamen NT2. Doe een korte les, oefen een onderdeel of maak een proefexamen met een timer.": ["Prepare for the civic integration exam or the NT2 state exam. Take a short lesson, practise one skill or try a timed mock exam.", "استعد لامتحان الاندماج أو امتحان الدولة NT2. خذ درسًا قصيرًا أو تدرّب على مهارة واحدة أو جرّب اختبارًا تجريبيًا محدد الوقت.", "Uyum sınavına veya NT2 devlet sınavına hazırlan. Kısa bir ders yap, bir beceriye çalış ya da süreli deneme sınavına gir.", "नागरिक एकीकरण परीक्षा या NT2 राज्य परीक्षा की तैयारी करें। छोटा पाठ लें, किसी एक कौशल का अभ्यास करें या समय सीमा वाली अभ्यास परीक्षा दें।", "为公民融入考试或 NT2 国家考试做准备。上一节短课、练习一项技能，或做一次限时模拟考试。","Prepárate para el examen de integración o el examen estatal NT2. Haz una lección breve, practica una sección o prueba un simulacro cronometrado.","Готовьтесь к интеграционному экзамену или государственному экзамену NT2. Пройдите короткий урок, потренируйте один раздел или попробуйте пробный экзамен на время."],
  "Kies je niveau": ["Choose your level", "اختر مستواك", "Seviyeni seç", "अपना स्तर चुनें", "选择级别","Elige tu nivel","Выберите уровень"],
  "Probeer één vraag": ["Try one question", "جرّب سؤالًا واحدًا", "Bir soru dene", "एक सवाल आज़माएँ", "试做一道题","Probar una pregunta","Попробовать одно задание"],
  "Gratis beginnen, ook zonder account.": ["Start for free, with or without an account.", "ابدأ مجانًا حتى دون حساب.", "Hesap açmadan da ücretsiz başla.", "बिना खाते के भी मुफ़्त शुरू करें।", "无需账号即可免费开始。","Empieza gratis, incluso sin cuenta.","Начните бесплатно, даже без аккаунта."],
  "Hoi, ik ben Bitterbal!": ["Hi, I’m Bitterbal!", "مرحبًا، أنا بيتر بال!", "Merhaba, ben Bitterbal!", "नमस्ते, मैं बिटरबाल हूँ!", "你好，我是 Bitterbal！","¡Hola, soy Bitterbal!","Привет, я Биттербал!"],
  "Waar oefen je voor?": ["What are you preparing for?", "لأي امتحان تستعد؟", "Hangi sınava hazırlanıyorsun?", "आप किस परीक्षा की तैयारी कर रहे हैं?", "你在准备哪项考试？","¿Para qué examen te preparas?","К какому экзамену вы готовитесь?"],
  "Inburgeringsexamen": ["Civic integration exam", "امتحان الاندماج", "Uyum sınavı", "नागरिक एकीकरण परीक्षा", "公民融入考试","Examen de integración","Интеграционный экзамен"],
  "Oefen met Nederlands uit het dagelijks leven: lezen, luisteren, schrijven en spreken. Oefen ook Kennis van de Nederlandse Maatschappij (KNM).": ["Practise everyday Dutch: reading, listening, writing and speaking. You can also practise Knowledge of Dutch Society (KNM).", "تدرّب على الهولندية في الحياة اليومية: القراءة والاستماع والكتابة والتحدث. وتدرّب أيضًا على معرفة المجتمع الهولندي (KNM).", "Günlük Flemenkçe okuma, dinleme, yazma ve konuşma alıştırmaları yap. Hollanda toplumu bilgisi (KNM) için de çalışabilirsin.", "रोज़मर्रा की डच पढ़ने, सुनने, लिखने और बोलने का अभ्यास करें। डच समाज का ज्ञान (KNM) भी सीखें।", "练习日常荷兰语的听、说、读、写。你也可以学习荷兰社会知识（KNM）。","Practica el neerlandés de la vida diaria: lectura, comprensión oral, escritura y expresión oral. Repasa también tus conocimientos sobre la sociedad neerlandesa (KNM).","Практикуйте нидерландский для повседневной жизни: чтение, аудирование, письмо и устную речь. Готовьтесь и к разделу о нидерландском обществе (KNM)."],
  "Oefen op A2": ["Practise A2", "تدرّب على A2", "A2 çalış", "A2 का अभ्यास करें", "练习 A2","Practicar A2","Практика A2"],
  "Staatsexamen NT2 · Programma I": ["NT2 state exam · Programme I", "امتحان الدولة NT2 · البرنامج الأول", "NT2 devlet sınavı · Program I", "NT2 राज्य परीक्षा · कार्यक्रम I", "NT2 国家考试 · 第一项目","Examen estatal NT2 · Programa I","Государственный экзамен NT2 · Программа I"],
  "Bereid je voor op lezen, luisteren, schrijven en spreken op B1, met langere teksten en opdrachten over werk, studie en het dagelijks leven.": ["Prepare for B1 reading, listening, writing and speaking with longer texts and tasks about work, study and everyday life.", "استعد للقراءة والاستماع والكتابة والتحدث في مستوى B1 مع نصوص أطول ومهام عن العمل والدراسة والحياة اليومية.", "İş, eğitim ve günlük yaşamla ilgili daha uzun metinler ve görevlerle B1 okuma, dinleme, yazma ve konuşma sınavlarına hazırlan.", "काम, पढ़ाई और रोज़मर्रा के जीवन से जुड़े लंबे लेखों और अभ्यासों के साथ B1 स्तर पर पढ़ने, सुनने, लिखने और बोलने की तैयारी करें।", "用工作、学习和日常生活中的较长文章和任务，练习 B1 级别的听、说、读、写。","Practica la lectura, la comprensión oral, la escritura y la expresión oral de nivel B1 con textos más largos y tareas sobre trabajo, estudios y vida cotidiana.","Тренируйте чтение, аудирование, письмо и устную речь на уровне B1. Здесь тексты длиннее, а задания посвящены работе, учёбе и повседневной жизни."],
  "Oefen op B1": ["Practise B1", "تدرّب على B1", "B1 çalış", "B1 का अभ्यास करें", "练习 B1","Practicar B1","Практика B1"],
  "Je kunt je niveau later veranderen in je profiel.": ["You can change your level later in your profile.", "يمكنك تغيير مستواك لاحقًا في ملفك الشخصي.", "Seviyeni daha sonra profilinden değiştirebilirsin.", "आप बाद में अपनी प्रोफ़ाइल में स्तर बदल सकते हैं।", "之后可以在个人资料中更改级别。","Puedes cambiar de nivel más adelante en Perfil.","Уровень можно изменить позже в профиле."],
  "Drie manieren om te oefenen": ["Three ways to practise", "ثلاث طرق للتدرّب", "Çalışmanın üç yolu", "अभ्यास के तीन तरीके", "三种练习方式","Tres formas de practicar","Три способа заниматься"],
  "Een les per dag": ["A lesson a day", "درس كل يوم", "Her gün bir ders", "रोज़ एक पाठ", "每天一课","Una lección al día","Один урок в день"],
  "Kies 10, 20 of 40 minuten. Bittertalen stelt je les samen en geeft extra aandacht aan wat je lastig vindt.": ["Choose 10, 20 or 40 minutes. Bittertalen builds your lesson around the areas you find hardest.", "اختر 10 أو 20 أو 40 دقيقة. يعدّ Bittertalen درسًا يركّز على ما تجده صعبًا.", "10, 20 veya 40 dakika seç. Bittertalen dersini zorlandığın konulara göre hazırlar.", "10, 20 या 40 मिनट चुनें। Bittertalen उन विषयों पर ज़्यादा ध्यान देता है जो आपको मुश्किल लगते हैं।", "选择 10、20 或 40 分钟。Bittertalen 会安排课程，让你多练习觉得困难的内容。","Elige 10, 20 o 40 minutos. Bittertalen prepara una lección y dedica más tiempo a lo que te cuesta.","Выберите 10, 20 или 40 минут. Bittertalen составит урок и уделит больше внимания тому, что даётся сложнее."],
  "Zelf kiezen": ["Choose what to practise", "اختر ما تتدرّب عليه", "Ne çalışacağını seç", "अपना अभ्यास चुनें", "自己选练习","Elige qué practicar","Выберите, что тренировать"],
  "Oefen één vaardigheid, herhaal woorden, doe grammatica of lees en luister naar verhalen in het Nederlands.": ["Work on one skill, review words, practise grammar or read and listen to Dutch stories.", "تدرّب على مهارة أو راجع الكلمات والقواعد أو اقرأ واستمع إلى قصص بالهولندية.", "Bir beceriye çalış, kelimeleri tekrarla, dil bilgisi alıştırması yap veya Flemenkçe hikâyeler oku ve dinle.", "किसी एक कौशल पर काम करें, शब्द दोहराएँ, व्याकरण का अभ्यास करें या डच कहानियाँ पढ़ें और सुनें।", "练习单项技能、复习单词、练习语法，或阅读和收听荷兰语故事。","Practica una habilidad, repasa vocabulario, haz ejercicios de gramática o lee y escucha relatos en neerlandés.","Тренируйте отдельный навык, повторяйте слова и грамматику, читайте и слушайте рассказы на нидерландском."],
  "Een proefexamen maken": ["Take a mock exam", "جرّب امتحانًا تجريبيًا", "Deneme sınavına gir", "अभ्यास परीक्षा दें", "做模拟考试","Haz un simulacro","Пройдите пробный экзамен"],
  "Oefen een examenonderdeel met een timer en bekijk je resultaten om te zien wat je nog kunt oefenen.": ["Practise an exam section with a timer, then see your results and what to work on next.", "تدرّب على قسم من الامتحان في وقت محدد، ثم راجع نتائجك لتعرف ما تحتاج إلى مراجعته.", "Bir sınav bölümünü süre tutarak çöz. Sonuçlarına bakıp hangi konulara çalışman gerektiğini gör.", "समय सीमा में परीक्षा का एक भाग हल करें और नतीजे देखकर तय करें कि किसका और अभ्यास करना है।", "限时练习一个考试科目，再查看结果，了解还需要练习什么。","Practica una parte del examen con un temporizador. Después, consulta tus resultados para saber qué reforzar.","Пройдите раздел экзамена на время и посмотрите результаты, чтобы понять, над чем ещё поработать."],
  "Gratis oefenen. Vaker feedback met Plus.": ["Practise for free. Get feedback more often with Plus.", "تدرّب مجانًا واحصل على تصحيح أكثر مع Plus.", "Ücretsiz çalış. Plus ile daha sık geri bildirim al.", "मुफ़्त अभ्यास करें। Plus से ज़्यादा बार प्रतिक्रिया पाएँ।", "免费练习。Plus 提供更多反馈次数。","Practica gratis. Recibe más correcciones con Plus.","Занимайтесь бесплатно. С Plus доступно больше проверок."],
  "Gratis": ["Free", "مجاني", "Ücretsiz", "मुफ़्त", "免费","Gratis","Бесплатно"],
  "Alle oefeningen en proefexamens op A2 en B1": ["All A2 and B1 exercises and mock exams", "كل تمارين واختبارات A2 وB1 التجريبية", "Tüm A2 ve B1 alıştırmaları ve deneme sınavları", "A2 और B1 के सभी अभ्यास और अभ्यास परीक्षाएँ", "所有 A2 和 B1 练习及模拟考试","Todos los ejercicios y simulacros de A2 y B1","Все упражнения и пробные экзамены A2 и B1"],
  "Oefenen zonder account": ["Practise without an account", "تدرّب دون حساب", "Hesap açmadan çalış", "बिना खाते के अभ्यास करें", "无需账号即可练习","Práctica sin cuenta","Практика без аккаунта"],
  "Met een gratis account: voortgang op al je apparaten": ["With a free account: keep your progress across devices", "بحساب مجاني: احفظ تقدمك على جميع أجهزتك", "Ücretsiz hesapla ilerlemeni tüm cihazlarında kaydet", "मुफ़्त खाते से सभी डिवाइस पर अपनी प्रगति सहेजें", "用免费账号在所有设备上保存进度","Con una cuenta gratuita, tu progreso se guarda en todos tus dispositivos","С бесплатным аккаунтом прогресс доступен на всех ваших устройствах"],
  "Open Bittertalen": ["Open Bittertalen", "افتح Bittertalen", "Bittertalen’i aç", "Bittertalen खोलें", "打开 Bittertalen","Abrir Bittertalen","Открыть Bittertalen"],
  "Laat je teksten en gesproken antwoorden vaker nakijken door Claude": ["Have Claude check your writing and spoken answers more often", "اطلب من Claude تصحيح كتاباتك وإجاباتك الشفهية مرات أكثر", "Yazılarını ve sözlü yanıtlarını Claude’a daha sık kontrol ettir", "Claude से अपने लिखित और बोले गए जवाबों की ज़्यादा बार जाँच करवाएँ", "让 Claude 更频繁地批改你的写作和口语回答","Claude puede revisar tus textos y respuestas orales más veces","Claude сможет проверять больше ваших текстов и устных ответов"],
  "Voor beide niveaus, met een account": ["For both levels, with an account", "للمستويين، مع حساب", "Bir hesapla her iki seviye için", "खाते के साथ दोनों स्तरों के लिए", "注册账号后可用于两个级别","Para ambos niveles, con una cuenta","Для обоих уровней при наличии аккаунта"],
  "Elke maand opzegbaar": ["Cancel any month", "يمكن الإلغاء كل شهر", "Her ay iptal edilebilir", "हर महीने रद्द कर सकते हैं", "每月都可取消","Puedes cancelar cada mes","Можно отменить в любой месяц"],
  "Bekijk Plus": ["See Plus", "اطّلع على Plus", "Plus’ı incele", "Plus देखें", "查看 Plus","Ver Plus","Посмотреть Plus"],
  "Klaar voor je eerste oefening?": ["Ready for your first exercise?", "هل أنت مستعد لأول تمرين؟", "İlk alıştırmana hazır mısın?", "पहले अभ्यास के लिए तैयार हैं?", "准备好开始第一道练习了吗？","¿Todo listo para tu primer ejercicio?","Готовы к первому заданию?"],
  "Over Bittertalen": ["About Bittertalen", "عن Bittertalen", "Bittertalen hakkında", "Bittertalen के बारे में", "关于 Bittertalen","Acerca de Bittertalen","О Bittertalen"],
  "Privacyverklaring": ["Privacy policy", "سياسة الخصوصية", "Gizlilik bildirimi", "गोपनीयता नीति", "隐私声明","Política de privacidad","Политика конфиденциальности"],
  "Contact": ["Contact", "التواصل", "İletişim", "संपर्क", "联系我们","Contacto","Контакты"]
};

const pricing = {
  nl: ["per maand", n => `Met een gratis account: ${n} nakijkbeurten per dag`, n => `Claude kijkt je teksten en gesproken antwoorden na: ${n} nakijkbeurten per dag`, "Plus is op dit moment niet beschikbaar.", "De actuele prijs kon niet worden geladen. Kijk bij Profiel in de app."],
  en: ["per month", n => `With a free account: ${n} checks a day`, n => `Claude reviews your writing and spoken answers: ${n} checks a day`, "Plus is currently unavailable.", "The current price could not be loaded. Check your profile in the app."],
  ar: ["شهريًا", n => `بحساب مجاني: ${n} مرات تصحيح يوميًا`, n => `يصحّح Claude كتاباتك وإجاباتك الشفهية: ${n} مرات يوميًا`, "Plus غير متاح حاليًا.", "تعذّر تحميل السعر الحالي. راجعه في ملفك الشخصي في التطبيق."],
  tr: ["aylık", n => `Ücretsiz hesapla günde ${n} kontrol`, n => `Claude yazılarını ve sözlü yanıtlarını günde ${n} kez kontrol eder`, "Plus şu anda kullanılamıyor.", "Güncel fiyat yüklenemedi. Uygulamada profilini kontrol et."],
  hi: ["प्रति माह", n => `मुफ़्त खाते से रोज़ ${n} बार जाँच`, n => `Claude आपके लिखित और बोले गए जवाबों की रोज़ ${n} बार जाँच करता है`, "Plus अभी उपलब्ध नहीं है।", "मौजूदा कीमत लोड नहीं हो सकी। ऐप में अपनी प्रोफ़ाइल देखें।"],
  zh: ["每月", n => `免费账号：每天 ${n} 次批改`, n => `Claude 批改你的写作和口语回答：每天 ${n} 次`, "Plus 暂时不可用。", "无法加载当前价格。请在应用的个人资料中查看。"],
  es: ["al mes", n => `Revisiones diarias con una cuenta gratuita: ${n}`, n => `Claude revisa tus textos y respuestas orales: ${n} revisiones al día`, "Plus no está disponible en este momento.", "No se pudo cargar el precio actual. Consúltalo en tu perfil en la aplicación."],
  ru: ["в месяц", n => `Проверок в день с бесплатным аккаунтом: ${n}`, n => `Claude проверяет ваши тексты и устные ответы. Проверок в день: ${n}`, "Сейчас Plus недоступен.", "Не удалось загрузить текущую цену. Посмотрите её в профиле приложения."],
};
const select = document.querySelector("#language");
const nodes = [...document.querySelectorAll("[data-t]")].map(node => [node, node.textContent]);
const $ = id => document.getElementById(id);
let config; // undefined while loading, null when the request failed
let lang = "nl";
try { lang = localStorage.getItem("ww-ui") || "nl"; } catch {}
if (!Object.hasOwn(pricing, lang)) lang = "nl";
function render() {
  const i = languages.indexOf(lang);
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  select.value = lang;
  select.setAttribute("aria-label", {es:"Idioma", ru:"Язык"}[lang] || "Taal / Language");
  $("language-code").textContent = {ar:"عربي", hi:"हिं", zh:"中文"}[lang] || lang.toUpperCase();
  for (const [node, nl] of nodes) node.textContent = copy[nl]?.[i] ?? nl;
  const [month, free, checks, off, failed] = pricing[lang];
  const plus = config?.plus;
  const active = Boolean(plus?.price && plus?.limit);
  $("free-checks").hidden = !config?.limit;
  if (config?.limit) $("free-checks").textContent = free(config.limit);
  $("plus-price").hidden = $("plus-link").hidden = !active;
  $("plus-status").textContent = active || config === undefined ? "" : config === null ? failed : off;
  if (active) {
    const amount = document.createElement("bdi");
    amount.textContent = `€ ${lang === "en" ? String(plus.price).replace(",", ".") : plus.price}`;
    const period = document.createElement("small");
    period.textContent = month;
    $("plus-price").replaceChildren(amount, " ", period);
    $("plus-checks").textContent = checks(plus.limit);
  }
}
select.addEventListener("change", () => {
  lang = select.value;
  try { lang === "nl" ? localStorage.removeItem("ww-ui") : localStorage.setItem("ww-ui", lang); } catch {}
  render();
});
render();
fetch("/api/config").then(r => {
  if (!r.ok) throw new Error("Config unavailable");
  return r.json();
}).then(value => { config = value; }, () => { config = null; }).then(render);
