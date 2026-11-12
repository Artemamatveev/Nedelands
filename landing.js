const languages = ["en", "ar", "tr", "hi", "zh", "es", "ru"];
// Dutch copy is also in the HTML so the page is readable without scripts.
const copy = {
  "Gebruiksvoorwaarden": ["Terms of use", "شروط الاستخدام", "Kullanım koşulları", "उपयोग की शर्तें", "使用条款", "Condiciones de uso", "Условия использования"],
  "Bittertalen is een onafhankelijke oefenapp en is niet verbonden aan DUO.": ["Bittertalen is an independent practice app and is not affiliated with DUO.", "Bittertalen تطبيق مستقل للتدرّب ولا يرتبط بـ DUO.", "Bittertalen bağımsız bir alıştırma uygulamasıdır ve DUO ile bağlantılı değildir.", "Bittertalen एक स्वतंत्र अभ्यास ऐप है और DUO से संबद्ध नहीं है।", "Bittertalen 是独立的练习应用，与 DUO 没有隶属或合作关系。", "Bittertalen es una aplicación de práctica independiente y no está afiliada a DUO.", "Bittertalen — независимое приложение для подготовки, не связанное с DUO."],
  "Oefenresultaten bieden geen garantie op het behalen van een officieel examen.": ["Practice results do not guarantee passing an official exam.", "نتائج التدريب لا تضمن النجاح في الامتحان الرسمي.", "Alıştırma sonuçları resmî sınavı geçmeyi garanti etmez.", "अभ्यास के नतीजे आधिकारिक परीक्षा पास करने की गारंटी नहीं देते।", "练习成绩不保证能通过正式考试。", "Los resultados de práctica no garantizan aprobar un examen oficial.", "Результаты тренировок не гарантируют сдачу официального экзамена."],
  "KVK en btw-id zijn tijdelijke placeholders en moeten nog worden ingevuld.": ["KVK and VAT ID numbers are temporary placeholders and still need to be completed.", "أرقام KVK وضريبة القيمة المضافة مؤقتة ويجب استكمالها.", "KVK ve KDV numaraları geçici yer tutuculardır; henüz doldurulmamıştır.", "KVK और VAT नंबर अस्थायी प्लेसहोल्डर हैं; इन्हें अभी भरना बाकी है।", "KVK 和增值税号码为临时占位内容，尚待填写。", "Los números KVK e IVA son datos provisionales pendientes de completar.", "Номера KVK и BTW-id — временные заполнители; их ещё предстоит указать."],

  "Begin met oefenen": ["Start practising", "ابدأ التدرّب", "Çalışmaya başla", "अभ्यास शुरू करें", "开始练习", "Empezar a practicar", "Начать заниматься"],
  "Zo leer je met Bittertalen": ["How you learn with Bittertalen", "هكذا تتعلّم مع Bittertalen", "Bittertalen ile nasıl öğrenirsin", "Bittertalen के साथ ऐसे सीखें", "用 Bittertalen 学习", "Así aprendes con Bittertalen", "Как заниматься с Bittertalen"],
  "Video’s in het Nederlands": ["Videos in Dutch", "فيديوهات باللغة الهولندية", "Flemenkçe videolar", "डच में वीडियो", "荷兰语视频", "Vídeos en neerlandés", "Видео на нидерландском"],
  "Kijk video’s in het Nederlands en oefen je luistervaardigheid met onderwerpen uit het dagelijks leven.": ["Watch videos in Dutch and practise listening with topics from everyday life.", "شاهد فيديوهات بالهولندية وتدرّب على الاستماع من خلال موضوعات من الحياة اليومية.", "Flemenkçe videolar izle ve günlük hayattan konularla dinleme becerini geliştir.", "डच में वीडियो देखें और रोज़मर्रा के विषयों के साथ सुनने का अभ्यास करें।", "观看荷兰语视频，通过日常生活话题练习听力。", "Mira vídeos en neerlandés y practica la comprensión oral con temas de la vida cotidiana.", "Смотрите видео на нидерландском и тренируйте понимание речи на повседневных темах."],
  "Geschiedenis en cultuur": ["History and culture", "التاريخ والثقافة", "Tarih ve kültür", "इतिहास और संस्कृति", "历史与文化", "Historia y cultura", "История и культура"],
  "Maak kennis met de Nederlandse geschiedenis en cultuur via verhalen en schilderijen.": ["Discover Dutch history and culture through stories and paintings.", "تعرّف على تاريخ هولندا وثقافتها من خلال القصص واللوحات.", "Hikâyeler ve tablolar aracılığıyla Hollanda tarihini ve kültürünü tanı.", "कहानियों और चित्रों के ज़रिए नीदरलैंड के इतिहास और संस्कृति को जानें।", "通过故事和绘画了解荷兰的历史与文化。", "Descubre la historia y la cultura de los Países Bajos a través de relatos y pinturas.", "Знакомьтесь с историей и культурой Нидерландов через рассказы и картины."],
  "Boeken lezen met vertaling": ["Read books with translation", "قراءة الكتب مع الترجمة", "Çeviri desteğiyle kitap oku", "अनुवाद की मदद से किताबें पढ़ें", "借助翻译读书", "Lee libros con ayuda de la traducción", "Книги с переводом"],
  "Lees in het Nederlands en bekijk de vertaling van woorden die je nog niet kent.": ["Read in Dutch and look up translations of words you do not know yet.", "اقرأ بالهولندية واطّلع على ترجمة الكلمات التي لا تعرفها بعد.", "Flemenkçe oku ve henüz bilmediğin kelimelerin çevirisine bak.", "डच में पढ़ें और अनजान शब्दों का अनुवाद देखें।", "阅读荷兰语书籍，查看不认识的单词的翻译。", "Lee en neerlandés y consulta la traducción de las palabras que todavía no conoces.", "Читайте на нидерландском и смотрите перевод незнакомых слов."],
  "Leren van je fouten": ["Learn from your mistakes", "تعلّم من أخطائك", "Hatalarından öğren", "अपनी गलतियों से सीखें", "从错误中学习", "Aprende de tus errores", "Работа над ошибками"],
  "Herhaal vragen die je eerder fout had en oefen extra met wat nog lastig is.": ["Revisit questions you previously got wrong and practise what you still find difficult.", "راجع الأسئلة التي أخطأت فيها سابقًا وتدرّب أكثر على ما لا يزال صعبًا.", "Daha önce yanlış cevapladığın soruları tekrarla ve zorlandığın konulara daha çok çalış.", "जिन सवालों में पहले गलती हुई थी उन्हें दोहराएँ और मुश्किल विषयों का और अभ्यास करें।", "重做之前答错的题目，重点练习仍然觉得困难的内容。", "Repite las preguntas que antes respondiste mal y refuerza lo que todavía te cuesta.", "Повторяйте задания, в которых раньше ошибались, и уделяйте больше внимания сложным темам."],

  "Animatie": ["Animation", "الحركة", "Animasyon", "ऐनिमेशन", "动画", "Animación", "Анимация"],
  "Bekijk de app": ["Explore the app", "تعرّف على التطبيق", "Uygulamayı keşfet", "ऐप देखें", "看看应用", "Explora la aplicación", "Посмотрите приложение"],
  "Mijn dag": ["My day", "يومي", "Günüm", "मेरा दिन", "我的一天", "Mi día", "Мой день"],
  "Oefenen": ["Practise", "تدرّب", "Alıştırma", "अभ्यास", "练习", "Practicar", "Упражнения"],
  "Examen": ["Exam", "الامتحان", "Sınav", "परीक्षा", "考试", "Examen", "Экзамен"],
  "Oefeningen in Bittertalen": ["Exercises in Bittertalen", "تمارين في Bittertalen", "Bittertalen alıştırmaları", "Bittertalen में अभ्यास", "Bittertalen 练习", "Ejercicios en Bittertalen", "Упражнения в Bittertalen"],
  "Proefexamens in Bittertalen": ["Mock exams in Bittertalen", "امتحانات تجريبية في Bittertalen", "Bittertalen deneme sınavları", "Bittertalen में अभ्यास परीक्षाएँ", "Bittertalen 模拟考试", "Simulacros de examen en Bittertalen", "Пробные экзамены в Bittertalen"],

  "Niveaus": ["Levels", "المستويات", "Seviyeler", "स्तर", "级别","Niveles","Уровни"],
  "Zo werkt het": ["How it works", "كيف يعمل", "Nasıl çalışır?", "यह कैसे काम करता है", "使用方法","Cómo funciona","Как это работает"],
  "Prijzen": ["Pricing", "الأسعار", "Fiyatlar", "कीमतें", "价格","Precios","Цены"],
  "Inloggen": ["Sign in", "تسجيل الدخول", "Giriş yap", "लॉग इन", "登录","Iniciar sesión","Войти"],
  "Oefen Nederlands op jouw tempo": ["Practise Dutch at your own pace", "تدرّب على الهولندية بالسرعة التي تناسبك", "Kendi hızında Flemenkçe çalış", "अपनी गति से डच का अभ्यास करें", "按自己的节奏练习荷兰语","Practica neerlandés a tu ritmo","Занимайтесь нидерландским в своём темпе"],
  "Bereid je voor op je inburgeringsexamen of Staatsexamen NT2. Doe een korte les, oefen een onderdeel of maak een proefexamen met een timer.": ["Prepare for the civic integration exam or the NT2 state exam. Take a short lesson, practise one skill or try a timed mock exam.", "استعد لامتحان الاندماج أو امتحان الدولة NT2. خذ درسًا قصيرًا أو تدرّب على مهارة واحدة أو جرّب اختبارًا تجريبيًا محدد الوقت.", "Uyum sınavına veya NT2 devlet sınavına hazırlan. Kısa bir ders yap, bir beceriye çalış ya da süreli deneme sınavına gir.", "नागरिक एकीकरण परीक्षा या NT2 राज्य परीक्षा की तैयारी करें। छोटा पाठ लें, किसी एक कौशल का अभ्यास करें या समय सीमा वाली अभ्यास परीक्षा दें।", "为公民融入考试或 NT2 国家考试做准备。上一节短课、练习一项技能，或做一次限时模拟考试。","Prepárate para el examen de integración o el examen estatal NT2. Haz una lección breve, practica una sección o prueba un simulacro cronometrado.","Готовьтесь к интеграционному экзамену или государственному экзамену NT2. Пройдите короткий урок, потренируйте один раздел или попробуйте пробный экзамен на время."],
  "Hoi, ik ben Bittie!": ["Hi, I’m Bittie!", "مرحبًا، أنا بيتي!", "Merhaba, ben Bittie!", "नमस्ते, मैं बिट्टी हूँ!", "你好，我是 Bittie！","¡Hola, soy Bittie!","Привет, я Битти!"],
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
  "Gratis": ["Free", "مجاني", "Ücretsiz", "मुफ़्त", "免费","Gratis","Бесплатно"],
  "Alle oefeningen en proefexamens op A2 en B1": ["All A2 and B1 exercises and mock exams", "كل تمارين واختبارات A2 وB1 التجريبية", "Tüm A2 ve B1 alıştırmaları ve deneme sınavları", "A2 और B1 के सभी अभ्यास और अभ्यास परीक्षाएँ", "所有 A2 和 B1 练习及模拟考试","Todos los ejercicios y simulacros de A2 y B1","Все упражнения и пробные экзамены A2 и B1"],
  "Oefenen zonder account": ["Practise without an account", "تدرّب دون حساب", "Hesap açmadan çalış", "बिना खाते के अभ्यास करें", "无需账号即可练习","Práctica sin cuenta","Практика без аккаунта"],
  "Met een gratis account: voortgang op al je apparaten": ["With a free account: keep your progress across devices", "بحساب مجاني: احفظ تقدمك على جميع أجهزتك", "Ücretsiz hesapla ilerlemeni tüm cihazlarında kaydet", "मुफ़्त खाते से सभी डिवाइस पर अपनी प्रगति सहेजें", "用免费账号在所有设备上保存进度","Con una cuenta gratuita, tu progreso se guarda en todos tus dispositivos","С бесплатным аккаунтом прогресс доступен на всех ваших устройствах"],
  "Open Bittertalen": ["Open Bittertalen", "افتح Bittertalen", "Bittertalen’i aç", "Bittertalen खोलें", "打开 Bittertalen","Abrir Bittertalen","Открыть Bittertalen"],
  "Laat je teksten en gesproken antwoorden vaker nakijken door Bittertalen": ["Have Bittertalen check your writing and spoken answers more often", "اطلب من Bittertalen تصحيح كتاباتك وإجاباتك الشفهية مرات أكثر", "Yazılarını ve sözlü yanıtlarını Bittertalen’a daha sık kontrol ettir", "Bittertalen से अपने लिखित और बोले गए जवाबों की ज़्यादा बार जाँच करवाएँ", "让 Bittertalen 更频繁地批改你的写作和口语回答","Bittertalen puede revisar tus textos y respuestas orales más veces","Bittertalen сможет проверять больше ваших текстов и устных ответов"],
  "Voor beide niveaus, met een account": ["For both levels, with an account", "للمستويين، مع حساب", "Bir hesapla her iki seviye için", "खाते के साथ दोनों स्तरों के लिए", "注册账号后可用于两个级别","Para ambos niveles, con una cuenta","Для обоих уровней при наличии аккаунта"],
  "Elke maand opzegbaar": ["Cancel any month", "يمكن الإلغاء كل شهر", "Her ay iptal edilebilir", "हर महीने रद्द कर सकते हैं", "每月都可取消","Puedes cancelar cada mes","Можно отменить в любой месяц"],
  "Bekijk Plus": ["See Plus", "اطّلع على Plus", "Plus’ı incele", "Plus देखें", "查看 Plus","Ver Plus","Посмотреть Plus"],
  "Klaar voor je eerste oefening?": ["Ready for your first exercise?", "هل أنت مستعد لأول تمرين؟", "İlk alıştırmana hazır mısın?", "पहले अभ्यास के लिए तैयार हैं?", "准备好开始第一道练习了吗？","¿Todo listo para tu primer ejercicio?","Готовы к первому заданию?"],
  "Over Bittertalen": ["About Bittertalen", "عن Bittertalen", "Bittertalen hakkında", "Bittertalen के बारे में", "关于 Bittertalen","Acerca de Bittertalen","О Bittertalen"],
  "Privacyverklaring": ["Privacy policy", "سياسة الخصوصية", "Gizlilik bildirimi", "गोपनीयता नीति", "隐私声明","Política de privacidad","Политика конфиденциальности"],
  "Begin gratis": ["Start for free", "ابدأ مجانًا", "Ücretsiz başla", "मुफ़्त में शुरू करें", "免费开始", "Empieza gratis", "Начать бесплатно"],
  "oefenvragen": ["practice questions", "سؤال تدريبي", "alıştırma sorusu", "अभ्यास प्रश्न", "道练习题", "preguntas de práctica", "тренировочных вопросов"],
  "KNM-vragen over de 8 thema's": ["KNM questions on the 8 themes", "سؤال KNM عن المواضيع الثمانية", "8 konuda KNM sorusu", "8 विषयों पर KNM प्रश्न", "道 KNM 题，覆盖 8 个主题", "preguntas de KNM sobre los 8 temas", "вопросов KNM по 8 темам"],
  "proefexamens per niveau, met een timer": ["timed mock exams per level", "امتحانات تجريبية لكل مستوى، مع مؤقت", "seviye başına süreli deneme sınavı", "हर स्तर पर समय सीमा वाली अभ्यास परीक्षाएँ", "每个级别的限时模拟考试", "simulacros cronometrados por nivel", "пробных экзаменов на время для каждого уровня"],
  "gesprekken om hardop te oefenen": ["conversations to practise out loud", "محادثة للتدرّب بصوت عالٍ", "sesli pratik için konuşma", "ज़ोर से अभ्यास के लिए बातचीत", "段可大声练习的对话", "conversaciones para practicar en voz alta", "диалогов для тренировки вслух"],
  "Zo ziet het eruit": ["What it looks like", "هكذا يبدو التطبيق", "Uygulama böyle görünüyor", "ऐप ऐसा दिखता है", "应用界面", "Así se ve", "Как это выглядит"],
  "Elke dag een les met korte rondes.": ["A daily lesson in short rounds.", "درس يومي من جولات قصيرة.", "Her gün kısa turlardan oluşan bir ders.", "हर दिन छोटे-छोटे दौर वाला एक पाठ।", "每天一课，分成几轮短练习。", "Una lección diaria en rondas cortas.", "Урок каждый день из коротких раундов."],
  "Feedback op je tekst: punten per onderdeel en je fouten in je eigen tekst.": ["Feedback on your writing: points per criterion and your mistakes marked in your own text.", "تصحيح لنصك: نقاط لكل معيار وأخطاؤك مُعلَّمة في نصك.", "Yazına geri bildirim: her ölçüt için puan ve hataların kendi metninde işaretli.", "आपके लेखन पर फ़ीडबैक: हर मानदंड के अंक और आपकी गलतियाँ आपके ही पाठ में चिह्नित।", "写作反馈：按评分项给分，并在你的原文中标出错误。", "Comentarios sobre tu texto: puntos por criterio y tus errores marcados en tu propio texto.", "Разбор текста: баллы по каждому критерию и ошибки, отмеченные прямо в вашем тексте."],
  "Proefexamens met een timer, en je score per onderdeel.": ["Timed mock exams, and your score per exam section.", "امتحانات تجريبية بمؤقت، ونتيجتك في كل قسم.", "Süreli deneme sınavları ve her bölümdeki puanın.", "समय सीमा वाली अभ्यास परीक्षाएँ और हर भाग में आपका स्कोर।", "限时模拟考试，以及你在每个部分的分数。", "Simulacros cronometrados y tu puntuación por sección.", "Пробные экзамены на время и ваш результат по каждому разделу."],
  "Voorbeeld: de tekst en de punten zijn verzonnen.": ["Example: the text and the points are made up.", "مثال: النص والنقاط من تأليفنا.", "Örnek: metin ve puanlar uydurmadır.", "उदाहरण: पाठ और अंक काल्पनिक हैं।", "示例：文本和分数均为虚构。", "Ejemplo: el texto y los puntos son inventados.", "Пример: текст и баллы придуманы."],
  "Wat kost het?": ["What does it cost?", "كم التكلفة؟", "Ücreti ne kadar?", "इसकी कीमत क्या है?", "费用是多少？", "¿Cuánto cuesta?", "Сколько это стоит?"],
  "Veelgestelde vragen": ["Frequently asked questions", "أسئلة شائعة", "Sık sorulan sorular", "अक्सर पूछे जाने वाले सवाल", "常见问题", "Preguntas frecuentes", "Частые вопросы"],
  "Is Bittertalen van DUO?": ["Is Bittertalen made by DUO?", "هل Bittertalen تابع لـ DUO؟", "Bittertalen DUO’ya mı ait?", "क्या Bittertalen DUO का है?", "Bittertalen 是 DUO 的吗？", "¿Bittertalen es de DUO?", "Bittertalen — это DUO?"],
  "Nee. Bittertalen is een onafhankelijke oefenapp. De echte examens en de officiële oefenexamens vind je bij DUO en op inburgeren.nl.": ["No. Bittertalen is an independent practice app. You will find the real exams and the official practice exams at DUO and on inburgeren.nl.", "لا. Bittertalen تطبيق تدريب مستقل. تجد الامتحانات الحقيقية والامتحانات التجريبية الرسمية لدى DUO وعلى inburgeren.nl.", "Hayır. Bittertalen bağımsız bir alıştırma uygulamasıdır. Gerçek sınavları ve resmî deneme sınavlarını DUO’da ve inburgeren.nl’de bulursun.", "नहीं। Bittertalen एक स्वतंत्र अभ्यास ऐप है। असली परीक्षाएँ और आधिकारिक अभ्यास परीक्षाएँ DUO और inburgeren.nl पर मिलती हैं।", "不是。Bittertalen 是一个独立的练习应用。真正的考试和官方模拟考试请见 DUO 和 inburgeren.nl。", "No. Bittertalen es una app de práctica independiente. Los exámenes reales y los exámenes de práctica oficiales están en DUO y en inburgeren.nl.", "Нет. Bittertalen — независимое приложение для тренировки. Настоящие экзамены и официальные пробные экзамены — у DUO и на inburgeren.nl."],
  "Welk examen moet ik doen: A2 of B1?": ["Which exam do I need: A2 or B1?", "أي امتحان عليّ أن أقدّم: A2 أم B1؟", "Hangi sınava girmeliyim: A2 mi, B1 mi?", "मुझे कौन-सी परीक्षा देनी है: A2 या B1?", "我该考哪个：A2 还是 B1？", "¿Qué examen tengo que hacer: A2 o B1?", "Какой экзамен мне сдавать: A2 или B1?"],
  "Dat hangt af van je situatie, bijvoorbeeld welke inburgeringswet voor jou geldt. Kijk op inburgeren.nl of vraag het aan je gemeente. In Bittertalen kies je je niveau zelf, en je kunt het later veranderen.": ["That depends on your situation, for example which civic integration law applies to you. Check inburgeren.nl or ask your municipality. In Bittertalen you choose your level yourself, and you can change it later.", "يعتمد ذلك على وضعك، مثلًا أي قانون اندماج ينطبق عليك. راجع inburgeren.nl أو اسأل البلدية. في Bittertalen تختار مستواك بنفسك ويمكنك تغييره لاحقًا.", "Bu senin durumuna bağlı, örneğin sana hangi uyum yasasının uygulandığına. inburgeren.nl’ye bak ya da belediyene sor. Bittertalen’de seviyeni kendin seçersin ve sonra değiştirebilirsin.", "यह आपकी स्थिति पर निर्भर करता है, जैसे आप पर कौन-सा एकीकरण कानून लागू होता है। inburgeren.nl देखें या अपनी नगरपालिका से पूछें। Bittertalen में आप अपना स्तर खुद चुनते हैं और बाद में बदल सकते हैं।", "这取决于你的情况，例如适用于你的是哪一部融入法。请查看 inburgeren.nl 或询问你的市政府。在 Bittertalen 中你可以自己选择级别，之后也可以更改。", "Depende de tu situación, por ejemplo de qué ley de integración se te aplica. Consulta inburgeren.nl o pregunta en tu ayuntamiento. En Bittertalen eliges tu nivel y puedes cambiarlo más tarde.", "Это зависит от вашей ситуации, например от того, какой закон об интеграции к вам относится. Посмотрите на inburgeren.nl или спросите в муниципалитете. В Bittertalen вы сами выбираете уровень и можете потом его сменить."],
  "Wat is KNM?": ["What is KNM?", "ما هو KNM؟", "KNM nedir?", "KNM क्या है?", "什么是 KNM？", "¿Qué es KNM?", "Что такое KNM?"],
  "Kennis van de Nederlandse Maatschappij: vragen over werk, wonen, gezondheid, instanties, geschiedenis en hoe mensen in Nederland met elkaar omgaan. Je oefent de acht thema's van het examen, samen of één voor één.": ["Knowledge of Dutch Society: questions about work, housing, health, public bodies, history and how people in the Netherlands treat each other. You practise the eight themes of the exam, together or one at a time.", "المعرفة بالمجتمع الهولندي: أسئلة عن العمل والسكن والصحة والهيئات الرسمية والتاريخ وكيف يتعامل الناس بعضهم مع بعض في هولندا. تتدرّب على مواضيع الامتحان الثمانية معًا أو واحدًا تلو الآخر.", "Hollanda Toplumu Bilgisi: iş, konut, sağlık, kurumlar, tarih ve Hollanda’da insanların birbirleriyle nasıl davrandığı hakkında sorular. Sınavın sekiz konusunu birlikte ya da tek tek çalışırsın.", "डच समाज का ज्ञान: काम, आवास, स्वास्थ्य, संस्थाएँ, इतिहास और नीदरलैंड में लोग एक-दूसरे से कैसे पेश आते हैं, इन पर प्रश्न। आप परीक्षा के आठ विषयों का अभ्यास एक साथ या एक-एक करके करते हैं।", "荷兰社会知识：关于工作、住房、健康、政府机构、历史以及荷兰人如何相处的问题。你可以一起练习考试的八个主题，也可以逐个练习。", "Conocimiento de la sociedad neerlandesa: preguntas sobre trabajo, vivienda, salud, organismos públicos, historia y cómo se relaciona la gente en los Países Bajos. Practicas los ocho temas del examen, juntos o uno por uno.", "Знание нидерландского общества: вопросы о работе, жилье, здоровье, учреждениях, истории и о том, как люди в Нидерландах общаются друг с другом. Вы тренируете восемь тем экзамена — все вместе или по одной."],
  "Heb ik een account nodig?": ["Do I need an account?", "هل أحتاج إلى حساب؟", "Hesaba ihtiyacım var mı?", "क्या मुझे खाते की ज़रूरत है?", "我需要账号吗？", "¿Necesito una cuenta?", "Нужен ли мне аккаунт?"],
  "Nee, je kunt meteen beginnen. Met een gratis account bewaar je je voortgang op al je apparaten en laat je je teksten en gesproken antwoorden vaker nakijken.": ["No, you can start right away. With a free account you keep your progress on all your devices and get your writing and spoken answers checked more often.", "لا، يمكنك البدء فورًا. بحساب مجاني تحفظ تقدمك على كل أجهزتك ويُصحَّح ما تكتبه وإجاباتك الشفهية مرات أكثر.", "Hayır, hemen başlayabilirsin. Ücretsiz bir hesapla ilerlemen tüm cihazlarında saklanır ve yazıların ile sözlü yanıtların daha sık kontrol edilir.", "नहीं, आप तुरंत शुरू कर सकते हैं। मुफ़्त खाते से आपकी प्रगति आपके सभी डिवाइस पर रहती है और आपके लिखित व बोले गए जवाब ज़्यादा बार जाँचे जाते हैं।", "不需要，你可以马上开始。有了免费账号，你的进度会保存在所有设备上，写作和口语回答也能更常获得批改。", "No, puedes empezar enseguida. Con una cuenta gratuita guardas tu progreso en todos tus dispositivos y te revisan más a menudo tus textos y respuestas orales.", "Нет, можно начать сразу. С бесплатным аккаунтом прогресс сохраняется на всех ваших устройствах, а тексты и устные ответы можно проверять чаще."],
  "Werkt het zonder internet?": ["Does it work offline?", "هل يعمل دون إنترنت؟", "İnternetsiz çalışır mı?", "क्या यह इंटरनेट के बिना चलता है?", "没有网络能用吗？", "¿Funciona sin internet?", "Работает ли без интернета?"],
  "Ja, de meeste oefeningen werken ook offline, bijvoorbeeld in de trein. Voor het nakijken door Bittertalen heb je internet nodig, en op sommige telefoons ook voor het herkennen van spraak.": ["Yes, most exercises also work offline, for example on the train. Checking by Bittertalen needs an internet connection, and on some phones so does speech recognition.", "نعم، تعمل معظم التمارين دون إنترنت أيضًا، مثلًا في القطار. يحتاج التصحيح بواسطة Bittertalen إلى الإنترنت، وكذلك التعرّف على الكلام في بعض الهواتف.", "Evet, çoğu alıştırma internetsiz de çalışır, örneğin trende. Bittertalen’un kontrolü için internet gerekir; bazı telefonlarda konuşma tanıma için de.", "हाँ, ज़्यादातर अभ्यास ऑफ़लाइन भी चलते हैं, जैसे ट्रेन में। Bittertalen से जाँच के लिए इंटरनेट चाहिए, और कुछ फ़ोन पर बोली पहचानने के लिए भी।", "可以，大多数练习离线也能用，比如在火车上。Bittertalen 批改需要联网，有些手机上的语音识别也需要联网。", "Sí, la mayoría de los ejercicios también funcionan sin conexión, por ejemplo en el tren. La revisión de Bittertalen necesita internet, y en algunos teléfonos también el reconocimiento de voz.", "Да, большинство упражнений работает и офлайн, например в поезде. Для проверки Bittertalen нужен интернет, а на некоторых телефонах — и для распознавания речи."],
  "Kan ik Bittertalen op mijn telefoon zetten?": ["Can I put Bittertalen on my phone?", "هل يمكنني وضع Bittertalen على هاتفي؟", "Bittertalen’i telefonuma ekleyebilir miyim?", "क्या मैं Bittertalen को अपने फ़ोन पर रख सकता हूँ?", "可以把 Bittertalen 放到手机上吗？", "¿Puedo poner Bittertalen en mi teléfono?", "Можно ли установить Bittertalen на телефон?"],
  "Ja. Open Bittertalen in je browser en zet het op je beginscherm (op een iPhone in Safari: Deel, dan Zet op beginscherm). Dan opent het als een app.": ["Yes. Open Bittertalen in your browser and add it to your home screen (on an iPhone in Safari: Share, then Add to Home Screen). It then opens like an app.", "نعم. افتح Bittertalen في المتصفح وأضفه إلى الشاشة الرئيسية (في iPhone عبر Safari: مشاركة، ثم إضافة إلى الشاشة الرئيسية). عندها يفتح مثل تطبيق.", "Evet. Bittertalen’i tarayıcında aç ve ana ekranına ekle (iPhone’da Safari’de: Paylaş, sonra Ana Ekrana Ekle). Sonra bir uygulama gibi açılır.", "हाँ। Bittertalen को अपने ब्राउज़र में खोलें और होम स्क्रीन पर जोड़ें (iPhone पर Safari में: शेयर, फिर होम स्क्रीन में जोड़ें)। फिर यह ऐप की तरह खुलता है।", "可以。在浏览器中打开 Bittertalen，并添加到主屏幕（iPhone 的 Safari 中：分享，然后“添加到主屏幕”）。之后它会像应用一样打开。", "Sí. Abre Bittertalen en tu navegador y añádelo a la pantalla de inicio (en un iPhone con Safari: Compartir y luego Añadir a pantalla de inicio). Así se abre como una app.", "Да. Откройте Bittertalen в браузере и добавьте на экран «Домой» (на iPhone в Safari: «Поделиться», затем «На экран „Домой“»). Тогда он откроется как приложение."],
  "Betekent een goede score dat ik slaag?": ["Does a good score mean I will pass?", "هل تعني النتيجة الجيدة أنني سأنجح؟", "İyi bir puan sınavı geçeceğim anlamına mı gelir?", "क्या अच्छे स्कोर का मतलब है कि मैं पास हो जाऊँगा?", "分数高就代表能通过吗？", "¿Una buena puntuación significa que aprobaré?", "Хороший результат означает, что я сдам?"],
  "Nee. Je score laat zien hoeveel antwoorden goed waren bij het oefenen. Het echte examen kan anders zijn. Doe daarom ook de officiële oefenexamens van DUO.": ["No. Your score shows how many answers were right in practice. The real exam can be different, so also take DUO’s official practice exams.", "لا. تُظهر نتيجتك عدد الإجابات الصحيحة أثناء التدرّب. قد يكون الامتحان الحقيقي مختلفًا، لذلك قدّم أيضًا الامتحانات التجريبية الرسمية من DUO.", "Hayır. Puanın, alıştırmada kaç cevabın doğru olduğunu gösterir. Gerçek sınav farklı olabilir; bu yüzden DUO’nun resmî deneme sınavlarını da yap.", "नहीं। आपका स्कोर बताता है कि अभ्यास में कितने जवाब सही थे। असली परीक्षा अलग हो सकती है, इसलिए DUO की आधिकारिक अभ्यास परीक्षाएँ भी दें।", "不是。分数只表示练习中答对了多少。真正的考试可能不同，所以也请做 DUO 的官方模拟考试。", "No. Tu puntuación muestra cuántas respuestas fueron correctas al practicar. El examen real puede ser distinto, así que haz también los exámenes de práctica oficiales de DUO.", "Нет. Результат показывает, сколько ответов было верных на тренировке. Настоящий экзамен может отличаться, поэтому пройдите и официальные пробные экзамены DUO."],
  "Je les van vandaag in Bittertalen, met de stappen van vandaag": ["Today’s lesson in Bittertalen, with today’s steps", "درس اليوم في Bittertalen مع خطوات اليوم", "Bittertalen’de bugünkü ders ve bugünün adımları", "Bittertalen में आज का पाठ, आज के चरणों के साथ", "Bittertalen 中的今日课程和今天的步骤", "La lección de hoy en Bittertalen, con los pasos de hoy", "Урок дня в Bittertalen с шагами на сегодня"],
  "Feedback op een geschreven tekst: punten per onderdeel en de fouten in de tekst": ["Feedback on a written text: points per criterion and the mistakes in the text", "تصحيح نص مكتوب: نقاط لكل معيار والأخطاء في النص", "Yazılı bir metne geri bildirim: ölçüt başına puan ve metindeki hatalar", "लिखे गए पाठ पर फ़ीडबैक: हर मानदंड के अंक और पाठ में गलतियाँ", "书面文本的反馈：各评分项的分数和文中的错误", "Comentarios sobre un texto escrito: puntos por criterio y los errores en el texto", "Разбор письменного текста: баллы по критериям и ошибки в тексте"],
  "Proefexamens per onderdeel met de laatste score": ["Mock exams per section with the latest score", "امتحانات تجريبية لكل قسم مع آخر نتيجة", "Bölüm başına deneme sınavları ve son puan", "हर भाग की अभ्यास परीक्षाएँ और आख़िरी स्कोर", "各部分的模拟考试及最近一次分数", "Simulacros por sección con la última puntuación", "Пробные экзамены по разделам с последним результатом"],
  "Hoi! Ik ben Bittie.": ["Hi! I’m Bittie.", "مرحبًا! أنا بيتي.", "Merhaba! Ben Bittie.", "नमस्ते! मैं बिट्टी हूँ।", "你好！我是 Bittie。", "¡Hola! Soy Bittie.", "Привет! Я Битти."],
  "Zullen we samen Nederlands oefenen?": ["Shall we practise Dutch together?", "هل نتدرّب على الهولندية معًا؟", "Birlikte Flemenkçe çalışalım mı?", "क्या हम साथ में डच का अभ्यास करें?", "我们一起练习荷兰语吧？", "¿Practicamos neerlandés juntos?", "Давайте вместе потренируем нидерландский?"],
  "Vraag 1": ["Question 1", "السؤال 1", "Soru 1", "प्रश्न 1", "第 1 题", "Pregunta 1", "Вопрос 1"],
  "Vraag 2": ["Question 2", "السؤال 2", "Soru 2", "प्रश्न 2", "第 2 题", "Pregunta 2", "Вопрос 2"],
  "Vraag 3": ["Question 3", "السؤال 3", "Soru 3", "प्रश्न 3", "第 3 题", "Pregunta 3", "Вопрос 3"],
  "Vraag 4": ["Question 4", "السؤال 4", "Soru 4", "प्रश्न 4", "第 4 题", "Pregunta 4", "Вопрос 4"],
  "Probeer het zelf": ["Try it yourself", "جرّب بنفسك", "Kendin dene", "खुद आज़माएँ", "自己试试", "Pruébalo tú", "Попробуйте сами"],
  "Een echte KNM-vraag, zoals in de app. Kies een antwoord.": ["A real KNM question, as in the app. Choose an answer.", "سؤال KNM حقيقي كما في التطبيق. اختر إجابة.", "Uygulamadaki gibi gerçek bir KNM sorusu. Bir cevap seç.", "ऐप जैसा एक असली KNM प्रश्न। एक उत्तर चुनें।", "一道真实的 KNM 题，和应用里一样。选一个答案。", "Una pregunta real de KNM, como en la app. Elige una respuesta.", "Настоящий вопрос KNM, как в приложении. Выберите ответ."],
  "Zo wordt je tekst nagekeken": ["How your writing is checked", "هكذا يصحّح Bittertalen نصك", "Bittertalen metnini böyle kontrol eder", "Bittertalen आपके लेखन को ऐसे जाँचता है", "Bittertalen 这样批改你的文章", "Así revisa Bittertalen tu texto", "Так Bittertalen проверяет ваш текст"],
  "Contact": ["Contact", "التواصل", "İletişim", "संपर्क", "联系我们","Contacto","Контакты"],
  "Meer nakijkbeurten op A2.": ["More checks at A2.", "تصحيحات إضافية لمستوى A2.", "A2 düzeyinde daha fazla kontrol.", "A2 स्तर पर ज़्यादा जाँचें।", "更多 A2 批改次数。", "Más revisiones de nivel A2.", "Больше проверок на уровне A2."],
  "Meer nakijkbeurten op B1, inclusief A2.": ["More checks at B1, including A2.", "تصحيحات إضافية لمستوى B1، وتشمل A2.", "A2 dahil B1 düzeyinde daha fazla kontrol.", "B1 स्तर पर ज़्यादा जाँचें, A2 भी शामिल।", "更多 B1 批改次数，包含 A2。", "Más revisiones de nivel B1, con A2 incluido.", "Больше проверок на уровне B1, включая A2."],
  "Kies Plus A2": ["Choose Plus A2", "اختر Plus A2", "Plus A2 seç", "Plus A2 चुनें", "选择 Plus A2", "Elegir Plus A2", "Выбрать Plus A2"],
  "Kies Plus B1": ["Choose Plus B1", "اختر Plus B1", "Plus B1 seç", "Plus B1 चुनें", "选择 Plus B1", "Elegir Plus B1", "Выбрать Plus B1"],
};

const pricing = {
  nl: ["per maand", n => `Met een gratis account: ${n} nakijkbeurten per dag`, n => `Bittertalen kijkt je teksten en gesproken antwoorden na: ${n} nakijkbeurten per dag`],
  en: ["per month", n => `With a free account: ${n} checks a day`, n => `Bittertalen reviews your writing and spoken answers: ${n} checks a day`],
  ar: ["شهريًا", n => `بحساب مجاني: ${n} مرات تصحيح يوميًا`, n => `يصحّح Bittertalen كتاباتك وإجاباتك الشفهية: ${n} مرات يوميًا`],
  tr: ["aylık", n => `Ücretsiz hesapla günde ${n} kontrol`, n => `Bittertalen yazılarını ve sözlü yanıtlarını günde ${n} kez kontrol eder`],
  hi: ["प्रति माह", n => `मुफ़्त खाते से रोज़ ${n} बार जाँच`, n => `Bittertalen आपके लिखित और बोले गए जवाबों की रोज़ ${n} बार जाँच करता है`],
  zh: ["每月", n => `免费账号：每天 ${n} 次批改`, n => `Bittertalen 批改你的写作和口语回答：每天 ${n} 次`],
  es: ["al mes", n => `Revisiones diarias con una cuenta gratuita: ${n}`, n => `Bittertalen revisa tus textos y respuestas orales: ${n} revisiones al día`],
  ru: ["в месяц", n => `Проверок в день с бесплатным аккаунтом: ${n}`, n => `Bittertalen проверяет ваши тексты и устные ответы. Проверок в день: ${n}`],
};
const select = document.querySelector("#language");
const nodes = [...document.querySelectorAll("[data-t]")].map(node => [node, node.textContent]);
const alts = [...document.querySelectorAll("[data-alt]")].map(node => [node, node.dataset.alt]);
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
  for (const [node, nl] of alts) node.alt = copy[nl]?.[i] ?? nl;
  const [month, free, checks] = pricing[lang];
  const plus = config?.plus;
  const active = Boolean(plus?.price && plus?.limit);
  $("free-checks").hidden = !config?.limit;
  if (config?.limit) $("free-checks").textContent = free(config.limit);
  for (const [level, card, price, check] of [["A2", "plus-card", "plus-price", "plus-checks"], ["B1", "plus-b1-card", "plus-b1-price", "plus-b1-checks"]]) {
    const offer = plus?.plans?.[level] || (level === "A2" ? plus : null);
    $(card).hidden = !active || !offer?.price;
    if (!active || !offer?.price) continue;
    const amount = document.createElement("bdi");
    amount.textContent = `€ ${lang === "en" ? String(offer.price).replace(",", ".") : offer.price}`;
    const period = document.createElement("small");
    period.textContent = month;
    $(price).replaceChildren(amount, " ", period);
    $(check).textContent = checks(plus.limit);
  }
}
select.addEventListener("change", () => {
  lang = select.value;
  try { lang === "nl" ? localStorage.removeItem("ww-ui") : localStorage.setItem("ww-ui", lang); } catch {}
  render();
});
render();

// Touch and keyboard use the summary; a mouse can reveal the same information on hover.
// Native details keep the headings usable even if this script is unavailable.
{
  const features = [...document.querySelectorAll(".feature-grid details")];
  const hover = matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const states = features.map(card => ({ card, panel: card.querySelector("p"), expanded: card.open, animation: null }));
  const finish = state => {
    state.animation?.cancel();
    state.animation = null;
    state.card.open = state.expanded;
    state.card.classList.remove("is-closing", "is-animating");
    state.panel.style.removeProperty("overflow");
  };
  const reveal = (state, open) => {
    if (state.expanded === open) return;
    state.expanded = open;
    const { card, panel } = state;
    card.classList.add("is-animating");
    const style = getComputedStyle(panel);
    // Start from the current frame when a tap or pointer reverses an unfinished animation.
    const from = card.open ? {
      height: `${panel.getBoundingClientRect().height}px`, opacity: style.opacity,
      transform: style.transform, paddingBottom: style.paddingBottom
    } : { height: "0px", opacity: 0, transform: "translateY(-6px)", paddingBottom: "0px" };
    state.animation?.cancel();
    state.animation = null;
    card.open = true;
    card.classList.toggle("is-closing", !open);
    panel.inert = !open;
    if (reduced.matches || !panel.animate) { finish(state); return; }
    const to = {
      height: open ? `${panel.getBoundingClientRect().height}px` : "0px",
      opacity: open ? 1 : 0, transform: open ? "translateY(0)" : "translateY(-4px)",
      paddingBottom: open ? getComputedStyle(panel).paddingBottom : "0px"
    };
    panel.style.overflow = "hidden";
    const animation = panel.animate([from, to], {
      duration: open ? 360 : 280, easing: "cubic-bezier(.22,1,.36,1)", fill: "both"
    });
    state.animation = animation;
    animation.onfinish = () => { if (state.animation === animation) finish(state); };
  };
  const expand = (card, open) => {
    for (const state of states) reveal(state, state.card === card && open);
  };
  for (const state of states) {
    const { card } = state;
    // The departing card needs to finish closing before its native content is hidden.
    // Without JavaScript, the HTML name still provides a native exclusive accordion.
    card.removeAttribute("name");
    const summary = card.querySelector("summary");
    summary.addEventListener("click", event => {
      event.preventDefault();
      expand(card, !state.expanded);
    });
    card.addEventListener("pointerenter", event => {
      if (event.pointerType === "mouse" && hover.matches) expand(card, true);
    });
    card.addEventListener("pointerleave", event => {
      if (event.pointerType === "mouse" && hover.matches && !summary.matches(":focus-visible")) reveal(state, false);
    });
    card.addEventListener("focusout", event => {
      if (hover.matches && !card.contains(event.relatedTarget) && !card.matches(":hover")) reveal(state, false);
    });
  }
  reduced.addEventListener("change", () => states.forEach(finish));
  window.addEventListener("resize", () => states.forEach(state => { if (state.animation) finish(state); }));
}

fetch("/api/config").then(r => {
  if (!r.ok) throw new Error("Config unavailable");
  return r.json();
}).then(value => { config = value; }, () => { config = null; }).then(render).then(homeDay);

// Anonymous usage counts (api/event.js), as in the app: only "one more today" per event and menu language, no id, cookie,
// account or IP address; only when the server offers it, never with Global Privacy Control or Do Not Track
const trackOn = () => !!(config && config.events) && !navigator.globalPrivacyControl && navigator.doNotTrack !== "1";
function track(ev) {
  if (!trackOn()) return Promise.resolve(false);
  let ui = "nl";
  try { ui = localStorage.getItem("ww-ui") || "nl"; } catch {}
  return fetch("/api/event", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ev, lvl: "", ui }) }).then(r => r.ok, () => false);
}
// the homepage counts once a day per device (ww-day-home keeps only the date), marked only once the server kept it
function homeDay() {
  if (!trackOn()) return;
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());
  try { if (localStorage.getItem("ww-day-home") === d) return; } catch { return; }
  track("home").then(ok => { if (ok) try { localStorage.setItem("ww-day-home", d); } catch {} });
}
// the buttons into the app (not Inloggen and Plus, which are for people who already know it)
document.querySelectorAll('a[href^="/oefenen?open="]').forEach(a => {
  if (!/open=(login|plus)/.test(a.getAttribute("href"))) a.addEventListener("click", () => track("begin"));
});

// Vraag 3: a real KNM question on the homepage, marked like in the app (the box turns green or red); the question and
// its feedback stay Dutch, as all exercises do
(() => {
  const quiz = document.querySelector(".quiz"), fb = $("qfb");
  if (!quiz) return;
  quiz.querySelectorAll(".choice").forEach(b => b.addEventListener("click", () => {
    if (quiz.classList.contains("done")) return;
    quiz.classList.add("done");
    track("quiz");
    const ok = b.dataset.ok === "1";
    b.classList.add(ok ? "ok" : "no");
    quiz.querySelector('[data-ok="1"]').classList.add("ok");
    quiz.querySelectorAll(".choice").forEach(x => x.disabled = true);
    fb.innerHTML = ok ? "<b class=\"good\">Goed zo!</b> Een verhuizing geef je door aan de gemeente."
      : "<b class=\"bad\">Niet goed.</b> Goed is: <b>bij de gemeente</b>. Een verhuizing geef je door aan de gemeente.";
    fb.hidden = false; $("qmore").hidden = false;
  }));
})();
