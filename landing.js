// A friend's code from a shared link (?ref=): kept for the app, which hands it over once there is an account
try{const r=new URLSearchParams(location.search).get("ref");if(r&&/^[A-HJ-NP-Z2-9]{8}$/i.test(r))localStorage.setItem("ww-ref",r.toUpperCase())}catch{}
const languages = ["en", "ar", "tr", "hi", "zh", "es", "ru", "uk"];
// Dutch copy is also in the HTML so the page is readable without scripts.
const copy = {
  "Sluiten": ["Close", "إغلاق", "Kapat", "बंद करें", "关闭", "Cerrar", "Закрыть", "Закрити"],
  "Inburgeringsexamen A2 en Staatsexamen NT2 B1, met 20 beginnerslessen als je bij nul begint": ["Civic integration exam A2 and Staatsexamen NT2 B1, with 20 beginner lessons if you start from zero", "امتحان الاندماج A2 وامتحان الدولة NT2 B1، مع 20 درسًا للمبتدئين إذا بدأت من الصفر", "Uyum sınavı A2 ve Staatsexamen NT2 B1, sıfırdan başlıyorsan 20 başlangıç dersiyle", "इंटीग्रेशन परीक्षा A2 और Staatsexamen NT2 B1, शून्य से शुरू करने वालों के लिए 20 शुरुआती पाठ", "融入考试 A2 和国家考试 NT2 B1，零基础可先学 20 节入门课", "Examen de integración A2 y Staatsexamen NT2 B1, con 20 lecciones para principiantes si empiezas desde cero", "Экзамен на интеграцию A2 и Staatsexamen NT2 B1, с 20 уроками для тех, кто начинает с нуля", "Іспит з інтеграції A2 і Staatsexamen NT2 B1, з 20 уроками для тих, хто починає з нуля"],
  "oefenvragen voor alle onderdelen": ["practice questions for every part", "سؤال تدريبي لكل الأجزاء", "tüm bölümler için alıştırma sorusu", "सभी हिस्सों के लिए अभ्यास सवाल", "道练习题，覆盖所有部分", "preguntas de práctica para todas las partes", "тренировочных вопросов по всем частям", "тренувальних запитань з усіх частин"],
  "proefexamens met timer: lezen, luisteren, schrijven, spreken en KNM, steeds met nieuwe vragen": ["timed mock exams: reading, listening, writing, speaking and KNM, with new questions every time", "امتحانات تجريبية بمؤقت: القراءة والاستماع والكتابة والتحدث والمجتمع الهولندي، بأسئلة جديدة في كل مرة", "süreli deneme sınavı: okuma, dinleme, yazma, konuşma ve KNM, her seferinde yeni sorularla", "टाइमर वाली मॉक परीक्षाएँ: पढ़ना, सुनना, लिखना, बोलना और KNM, हर बार नए सवालों के साथ", "套计时模拟考试：阅读、听力、写作、口语和 KNM，每次都是新题目", "exámenes de prueba con cronómetro: lectura, comprensión auditiva, escritura, expresión oral y KNM, siempre con preguntas nuevas", "пробных экзаменов с таймером: чтение, аудирование, письмо, говорение и KNM, каждый раз с новыми вопросами", "пробних іспитів із таймером: читання, аудіювання, письмо, говоріння і KNM, щоразу з новими запитаннями"],
  "les per dag van 10, 20 of 40 minuten, met extra aandacht voor je fouten": ["lesson a day of 10, 20 or 40 minutes, with extra attention to your mistakes", "درس يوميًا مدته 10 أو 20 أو 40 دقيقة، مع اهتمام إضافي بأخطائك", "günde 10, 20 veya 40 dakikalık bir ders, hatalarına ekstra dikkatle", "रोज़ एक पाठ, 10, 20 या 40 मिनट का, आपकी गलतियों पर खास ध्यान के साथ", "每天一课，10、20 或 40 分钟，重点关注你的错误", "lección al día de 10, 20 o 40 minutos, con atención extra a tus errores", "урок в день на 10, 20 или 40 минут, с особым вниманием к вашим ошибкам", "урок на день на 10, 20 або 40 хвилин, з особливою увагою до ваших помилок"],
  "Probeer het zelf": ["Try it yourself", "جرّبه بنفسك", "Kendin dene", "खुद आज़माएँ", "亲自试试", "Pruébalo tú mismo", "Попробуйте сами", "Спробуйте самі"],
  "Lezen: probeer een vraag": ["Reading: try a question", "القراءة: جرّب سؤالًا", "Okuma: bir soru dene", "पढ़ना: एक सवाल आज़माएँ", "阅读：试一道题", "Lectura: prueba una pregunta", "Чтение: попробуйте вопрос", "Читання: спробуйте запитання"],
  "Luisteren: probeer een vraag": ["Listening: try a question", "الاستماع: جرّب سؤالًا", "Dinleme: bir soru dene", "सुनना: एक सवाल आज़माएँ", "听力：试一道题", "Comprensión auditiva: prueba una pregunta", "Аудирование: попробуйте вопрос", "Аудіювання: спробуйте запитання"],
  "Schrijven: zo wordt je tekst nagekeken": ["Writing: how your text is checked", "الكتابة: هكذا يُصحَّح نصك", "Yazma: metnin nasıl kontrol edilir", "लिखना: आपका टेक्स्ट ऐसे जाँचा जाता है", "写作：你的文章这样批改", "Escritura: así se corrige tu texto", "Письмо: как проверяется ваш текст", "Письмо: як перевіряють ваш текст"],
  "Spreken: zo wordt je antwoord nagekeken": ["Speaking: how your answer is checked", "التحدث: هكذا يُصحَّح جوابك", "Konuşma: cevabın nasıl kontrol edilir", "बोलना: आपका जवाब ऐसे जाँचा जाता है", "口语：你的回答这样批改", "Expresión oral: así se corrige tu respuesta", "Говорение: как проверяется ваш ответ", "Говоріння: як перевіряють вашу відповідь"],
  "KNM: probeer een vraag": ["KNM: try a question", "المجتمع الهولندي: جرّب سؤالًا", "KNM: bir soru dene", "KNM: एक सवाल आज़माएँ", "KNM：试一道题", "KNM: prueba una pregunta", "KNM: попробуйте вопрос", "KNM: спробуйте запитання"],
  "Een echte leesvraag, zoals in de app. Lees de tekst en kies een antwoord.": ["A real reading question, as in the app. Read the text and choose an answer.", "سؤال قراءة حقيقي كما في التطبيق. اقرأ النص واختر إجابة.", "Uygulamadaki gibi gerçek bir okuma sorusu. Metni oku ve bir cevap seç.", "ऐप जैसा एक असली पढ़ने का सवाल। टेक्स्ट पढ़ें और जवाब चुनें।", "一道真实的阅读题，和应用中一样。阅读短文并选择答案。", "Una pregunta de lectura real, como en la app. Lee el texto y elige una respuesta.", "Настоящий вопрос на чтение, как в приложении. Прочитайте текст и выберите ответ.", "Справжнє запитання з читання, як у застосунку. Прочитайте текст і виберіть відповідь."],
  "Een echte luistervraag, zoals in de app. Luister en kies een antwoord.": ["A real listening question, as in the app. Listen and choose an answer.", "سؤال استماع حقيقي كما في التطبيق. استمع واختر إجابة.", "Uygulamadaki gibi gerçek bir dinleme sorusu. Dinle ve bir cevap seç.", "ऐप जैसा एक असली सुनने का सवाल। सुनें और जवाब चुनें।", "一道真实的听力题，和应用中一样。听录音并选择答案。", "Una pregunta de comprensión auditiva real, como en la app. Escucha y elige una respuesta.", "Настоящий вопрос на аудирование, как в приложении. Послушайте и выберите ответ.", "Справжнє запитання з аудіювання, як у застосунку. Послухайте й виберіть відповідь."],
  "Feedback op je gesproken antwoord: punten per onderdeel. Uitspraak en tempo beoordeelt de app nog niet.": ["Feedback on your spoken answer: points per part. The app does not yet assess pronunciation and pace.", "ملاحظات على جوابك المنطوق: نقاط لكل جزء. لا يقيّم التطبيق النطق والسرعة بعد.", "Sözlü cevabına geri bildirim: her bölüm için puan. Uygulama telaffuz ve hızı henüz değerlendirmiyor.", "आपके बोले गए जवाब पर फ़ीडबैक: हर हिस्से के अंक। ऐप अभी उच्चारण और रफ़्तार नहीं जाँचता।", "对你口语回答的反馈：每个部分的分数。应用暂时还不评估发音和语速。", "Comentarios sobre tu respuesta oral: puntos por apartado. La app todavía no evalúa la pronunciación ni el ritmo.", "Разбор вашего устного ответа: баллы по каждому критерию. Произношение и темп приложение пока не оценивает.", "Відгук на вашу усну відповідь: бали за кожен критерій. Вимову й темп застосунок поки не оцінює."],
  "Voorbeeld: het antwoord en de punten zijn verzonnen.": ["Example: the answer and the points are made up.", "مثال: الجواب والنقاط مختلقة.", "Örnek: cevap ve puanlar uydurmadır.", "उदाहरण: जवाब और अंक काल्पनिक हैं।", "示例：回答和分数都是虚构的。", "Ejemplo: la respuesta y los puntos son inventados.", "Пример: ответ и баллы придуманы.", "Приклад: відповідь і бали вигадані."],
  "Praat met Bittie": ["Talk with Bittie", "تحدّث مع بيتي", "Bittie ile konuş", "बिट्टी से बात करें", "和 Bittie 聊天", "Habla con Bittie", "Поговорить с Битти", "Поговоріть із Бітті"],
  "Ontdek Bittertalen": ["Explore Bittertalen", "اكتشف Bittertalen", "Bittertalen’i keşfet", "Bittertalen को जानें", "探索 Bittertalen", "Descubre Bittertalen", "Откройте для себя Bittertalen", "Дізнайтеся більше про Bittertalen"],
  "Geschiedenis, cultuur en geografie": ["History, culture and geography", "التاريخ والثقافة والجغرافيا", "Tarih, kültür ve coğrafya", "इतिहास, संस्कृति और भूगोल", "历史、文化与地理", "Historia, cultura y geografía", "История, культура и география", "Історія, культура й географія"],
  "Maak kennis met de Nederlandse geschiedenis en cultuur via verhalen en schilderijen.": ["Discover Dutch history and culture through stories and paintings.", "تعرّف على تاريخ هولندا وثقافتها من خلال القصص واللوحات.", "Hikâyeler ve tablolar aracılığıyla Hollanda tarihini ve kültürünü tanı.", "कहानियों और चित्रों के ज़रिए नीदरलैंड के इतिहास और संस्कृति को जानें।", "通过故事和绘画了解荷兰的历史与文化。", "Descubre la historia y la cultura de los Países Bajos a través de relatos y pinturas.", "Знакомьтесь с историей и культурой Нидерландов через рассказы и картины.", "Знайомтеся з історією та культурою Нідерландів через оповідання й картини."],
  "Lees in het Nederlands en bekijk de vertaling van woorden die je nog niet kent.": ["Read in Dutch and look up translations of words you do not know yet.", "اقرأ بالهولندية واطّلع على ترجمة الكلمات التي لا تعرفها بعد.", "Flemenkçe oku ve henüz bilmediğin kelimelerin çevirisine bak.", "डच में पढ़ें और अनजान शब्दों का अनुवाद देखें।", "阅读荷兰语书籍，查看不认识的单词的翻译。", "Lee en neerlandés y consulta la traducción de las palabras que todavía no conoces.", "Читайте на нидерландском и смотрите перевод незнакомых слов.", "Читайте нідерландською та переглядайте переклад незнайомих слів."],
  "Praten met AI": ["Talk with AI", "تحدّث مع الذكاء الاصطناعي", "Yapay zekâyla konuş", "एआई से बात करें", "与 AI 对话", "Habla con IA", "Разговор с ИИ", "Розмови зі ШІ"],
  "Oefen hardop Nederlands in een gesprek met AI. Jij spreekt, AI antwoordt.": ["Practise speaking Dutch aloud with AI. You speak, AI replies.", "تدرّب على التحدث بالهولندية مع الذكاء الاصطناعي. أنت تتكلم وهو يرد.", "Yapay zekâyla sesli Flemenkçe pratiği yap. Sen konuş, yapay zekâ yanıt versin.", "एआई के साथ बोलकर डच का अभ्यास करें। आप बोलें, एआई जवाब दे।", "和 AI 一起练习荷兰语口语。你开口，AI 回答。", "Practica neerlandés en voz alta con IA. Tú hablas y la IA responde.", "Практикуйте нидерландский вслух в разговоре с ИИ. Вы говорите, ИИ отвечает.", "Практикуйте нідерландську вголос у розмові зі ШІ. Ви говорите, ШІ відповідає."],
  "Video’s en podcasts": ["Videos and podcasts", "فيديوهات وبودكاست", "Videolar ve podcast’ler", "वीडियो और पॉडकास्ट", "视频与播客", "Vídeos y pódcasts", "Видео и подкасты", "Відео й подкасти"],
  "Kijk Nederlandse video’s en luister naar podcasts om je luistervaardigheid te oefenen.": ["Watch Dutch videos and listen to podcasts to practise your listening skills.", "شاهد مقاطع فيديو بالهولندية واستمع إلى البودكاست لتطوير مهارة الاستماع.", "Dinleme becerini geliştirmek için Flemenkçe videolar izle ve podcast dinle.", "सुनने का अभ्यास करने के लिए डच वीडियो देखें और पॉडकास्ट सुनें।", "观看荷兰语视频和收听播客，练习听力。", "Mira vídeos en neerlandés y escucha pódcasts para practicar la comprensión oral.", "Смотрите видео и слушайте подкасты на нидерландском, чтобы лучше понимать речь на слух.", "Дивіться нідерландські відео та слухайте подкасти, щоб краще розуміти мову на слух."],
  "Voorbereiden op je examen": ["Prepare for your exam", "استعد لامتحانك", "Sınavına hazırlan", "परीक्षा की तैयारी करें", "准备考试", "Prepárate para tu examen", "Подготовка к экзамену", "Підготовка до іспиту"],
  "Vorige kaart": ["Previous card", "البطاقة السابقة", "Önceki kart", "पिछला कार्ड", "上一张卡片", "Tarjeta anterior", "Предыдущая карточка", "Попередня картка"],
  "Volgende kaart": ["Next card", "البطاقة التالية", "Sonraki kart", "अगला कार्ड", "下一张卡片", "Tarjeta siguiente", "Следующая карточка", "Наступна картка"],
  "Geschiedenis": ["History", "التاريخ", "Tarih", "इतिहास", "历史", "Historia", "История", "Історія"],
  "Lees over de hunebedden, de Tweede Wereldoorlog en de wederopbouw. Beantwoord na elk hoofdstuk vragen.": ["Read about the megalithic tombs, the Second World War and post-war reconstruction. Answer questions after each chapter.", "اقرأ عن المقابر الحجرية والحرب العالمية الثانية وإعادة الإعمار. أجب عن أسئلة بعد كل فصل.", "Megalit mezarları, İkinci Dünya Savaşı ve savaş sonrası yeniden yapılanmayı oku. Her bölümün ardından soruları yanıtla.", "महापाषाण कब्रों, दूसरे विश्व युद्ध और उसके बाद के पुनर्निर्माण के बारे में पढ़ें। हर अध्याय के बाद सवालों के जवाब दें।", "阅读巨石墓、第二次世界大战和战后重建的故事，并回答每章后的问题。", "Lee sobre las tumbas megalíticas, la Segunda Guerra Mundial y la reconstrucción. Responde preguntas después de cada capítulo.", "Читайте о мегалитических гробницах, Второй мировой войне и восстановлении страны. После каждой главы отвечайте на вопросы.", "Читайте про дольмени, Другу світову війну та післявоєнну відбудову. Відповідайте на запитання після кожного розділу."],
  "Kunst en cultuur": ["Art and culture", "الفن والثقافة", "Sanat ve kültür", "कला और संस्कृति", "艺术与文化", "Arte y cultura", "Искусство и культура", "Мистецтво й культура"],
  "Bekijk Gezicht op Delft van Vermeer en ontdek het verhaal achter het schilderij.": ["Explore Vermeer’s View of Delft and discover the story behind the painting.", "شاهد لوحة منظر دلفت لفيرمير واكتشف قصتها.", "Vermeer’in Delft Manzarası tablosunu incele ve hikâyesini keşfet.", "वर्मीर की डेल्फ़्ट की झलक देखें और चित्र के पीछे की कहानी जानें।", "欣赏维米尔的《代尔夫特风景》，了解画作背后的故事。", "Mira Vista de Delft de Vermeer y descubre la historia del cuadro.", "Рассмотрите «Вид Делфта» Вермеера и узнайте историю картины.", "Розгляньте «Вид Делфта» Вермеєра та дізнайтеся історію картини."],
  "Geografie en water": ["Geography and water", "الجغرافيا والمياه", "Coğrafya ve su", "भूगोल और जल", "地理与水利", "Geografía y agua", "География и вода", "Географія й вода"],
  "Ontdek waar Drenthe, Zeeland en het IJsselmeer liggen en hoe dijken Nederland beschermen.": ["Discover where Drenthe, Zeeland and Lake IJssel are and how dikes protect the Netherlands.", "اكتشف أين تقع درينته وزيلاند وبحيرة آيسل وكيف تحمي السدود هولندا.", "Drenthe, Zeeland ve IJsselmeer’in nerede olduğunu ve setlerin Hollanda’yı nasıl koruduğunu keşfet.", "जानें कि ड्रेंथे, ज़ीलैंड और आइसेल झील कहाँ हैं और तटबंध नीदरलैंड की रक्षा कैसे करते हैं।", "了解德伦特、泽兰和艾瑟尔湖的位置，以及堤坝如何保护荷兰。", "Descubre dónde están Drenthe, Zelanda y el lago IJssel, y cómo los diques protegen los Países Bajos.", "Узнайте, где находятся Дренте, Зеландия и озеро Эйсселмер и как дамбы защищают Нидерланды.", "Дізнайтеся, де розташовані Дренте, Зеландія та Ейсселмер і як дамби захищають Нідерланди."],
  "Praat over een onderwerp dat je zelf kiest, of oefen een situatie zoals een bezoek aan de dokter, een gesprek op het werk of iets kopen in de winkel.": ["Talk about a topic of your choice or practise a situation such as visiting the doctor, talking at work or buying something in a shop.", "تحدث عن موضوع تختاره أو تدرّب على موقف مثل زيارة الطبيب أو التحدث في العمل أو الشراء من متجر.", "Seçtiğin bir konu hakkında konuş veya doktora gitme, iş yerinde konuşma ya da mağazada alışveriş yapma gibi bir durumu çalış.", "अपनी पसंद के विषय पर बात करें या डॉक्टर के पास जाने, काम पर बातचीत करने या दुकान में खरीदारी करने जैसी स्थिति का अभ्यास करें।", "自由选择话题，或练习看医生、在工作中交流、在商店购物等场景。", "Habla sobre un tema que tú elijas o practica una situación como ir al médico, hablar en el trabajo o comprar en una tienda.", "Поговорите на любую тему или разыграйте конкретную ситуацию: визит к врачу, разговор на работе или покупку в магазине.", "Розмовляйте на обрану тему або практикуйте життєві ситуації, наприклад візит до лікаря, розмову на роботі чи покупку в магазині."],
  "Oefen lezen, luisteren, schrijven en spreken op A2 of B1. Op A2 oefen je ook KNM. Maak een proefexamen met een timer en bekijk daarna wat je nog kunt oefenen.": ["Practise reading, listening, writing and speaking at A2 or B1. At A2, also practise KNM. Take a timed mock exam and see what to practise next.", "تدرّب على القراءة والاستماع والكتابة والتحدث في A2 أو B1. في A2 تدرّب أيضًا على KNM. جرّب امتحانًا تجريبيًا بوقت محدد واعرف ما تحتاج إلى مراجعته.", "A2 veya B1 düzeyinde okuma, dinleme, yazma ve konuşma çalış. A2’de KNM de çalış. Süreli bir deneme sınavına gir ve sonra neleri çalışabileceğini gör.", "A2 या B1 स्तर पर पढ़ने, सुनने, लिखने और बोलने का अभ्यास करें। A2 पर KNM भी करें। समय-सीमा वाली अभ्यास परीक्षा दें और देखें कि आगे क्या अभ्यास करना है।", "练习 A2 或 B1 的阅读、听力、写作和口语。A2 还包括 KNM。完成计时模拟考试，看看接下来还要练习什么。", "Practica lectura, comprensión oral, escritura y expresión oral en A2 o B1. En A2 también puedes practicar KNM. Haz un simulacro cronometrado y revisa qué te queda por practicar.", "Тренируйте чтение, аудирование, письмо и устную речь на A2 или B1. На A2 также есть KNM. Пройдите пробный экзамен с таймером и посмотрите, что ещё стоит потренировать.", "Практикуйте читання, аудіювання, письмо й говоріння на рівні A2 або B1. На A2 також вивчайте KNM. Пройдіть пробний іспит із таймером та дізнайтеся, над чим ще попрацювати."],
  "Probeer een KNM-vraag": ["Try a KNM question", "جرّب سؤالًا عن المجتمع الهولندي", "Bir KNM sorusu dene", "KNM का एक सवाल आज़माएँ", "试答一道 KNM 题", "Prueba una pregunta de KNM", "Попробуйте ответить на вопрос KNM", "Спробуйте відповісти на запитання KNM"],
  "Jaarpas": ["Year pass", "تصريح السنة", "Yıllık kart", "सालाना पास", "年度通行证", "Pase anual", "Годовой пропуск", "Річна перепустка"],
  "Een jaar Plus voor één betaling.": ["A year of Plus for one payment.", "سنة من Plus مقابل دفعة واحدة.", "Tek ödemeyle bir yıl Plus.", "एक भुगतान में एक साल का Plus।", "一次付款享一年 Plus。", "Un año de Plus con un solo pago.", "Год Plus за один платёж.", "Рік Plus за один платіж."],
  "Wordt niet automatisch verlengd.": ["Does not renew automatically.", "لا يتجدد تلقائيًا.", "Otomatik olarak yenilenmez.", "अपने-आप नवीनीकृत नहीं होता।", "不会自动续订。", "No se renueva automáticamente.", "Не продлевается автоматически.", "Не продовжується автоматично."],
  "Kies de Jaarpas": ["Choose the year pass", "اختر تصريح السنة", "Yıllık kartı seç", "सालाना पास चुनें", "选择年度通行证", "Elegir el pase anual", "Выбрать годовой пропуск", "Вибрати річну перепустку"],
  "Oefen gratis voor je inburgeringsexamen": ["Practise for your civic integration exam for free", "تدرّب مجانًا لامتحان الاندماج", "Uyum sınavına ücretsiz çalış", "अपनी इंटीग्रेशन परीक्षा की मुफ़्त तैयारी करें", "免费备考你的融入考试", "Prepara gratis tu examen de integración", "Готовьтесь к экзамену inburgering бесплатно", "Готуйтеся до іспиту inburgering безкоштовно"],
  "Oefen gratis voor je inburgeringsexamen A2 en het Staatsexamen NT2 B1. AI kijkt je schrijven en spreken na met de criteria van DUO, en met geschiedenis, verhalen en oefengesprekken leer je het land kennen.": ["Practise for free for the A2 civic integration exam and the Staatsexamen NT2 B1. AI checks your writing and speaking against DUO's criteria, and with history, stories and practice conversations you get to know the country.", "تدرّب مجانًا لامتحان الاندماج A2 وامتحان Staatsexamen NT2 B1. يصحّح الذكاء الاصطناعي كتابتك وكلامك وفق معايير DUO، ومع التاريخ والقصص ومحادثات التدريب تتعرّف على البلد.", "A2 uyum sınavına ve Staatsexamen NT2 B1'e ücretsiz çalış. Yapay zekâ yazma ve konuşmanı DUO'nun ölçütleriyle kontrol eder; tarih, hikâyeler ve pratik sohbetlerle ülkeyi tanırsın.", "A2 इंटीग्रेशन परीक्षा और Staatsexamen NT2 B1 की मुफ़्त तैयारी करें। AI आपके लेखन और बोलने को DUO के मानदंडों से जाँचता है, और इतिहास, कहानियों और अभ्यास बातचीत से आप देश को जानते हैं।", "免费备考 A2 融入考试和 Staatsexamen NT2 B1。AI 按 DUO 的标准批改你的写作和口语；通过历史、故事和练习对话，你也能了解这个国家。", "Prepara gratis el examen de integración A2 y el Staatsexamen NT2 B1. La IA corrige tu escritura y tu expresión oral con los criterios de DUO, y con historia, relatos y conversaciones de práctica conoces el país.", "Готовьтесь бесплатно к интеграционному экзамену A2 и Staatsexamen NT2 B1. ИИ проверяет письмо и устную речь по критериям DUO, а история, рассказы и тренировочные разговоры помогают узнать страну.", "Готуйтеся безкоштовно до інтеграційного іспиту A2 і Staatsexamen NT2 B1. ШІ перевіряє письмо та усне мовлення за критеріями DUO, а історія, оповідання й тренувальні розмови допомагають пізнати країну."],
  "A2 en Staatsexamen NT2 B1, op weg naar je Nederlandse paspoort. AI kijkt je schrijven en spreken na met de criteria van DUO, en je leert het land kennen.": ["A2 and the Staatsexamen NT2 B1, on your way to a Dutch passport. AI checks your writing and speaking against DUO's criteria, and you get to know the country.", "A2 وامتحان Staatsexamen NT2 B1، في طريقك إلى جواز السفر الهولندي. يصحّح الذكاء الاصطناعي كتابتك وكلامك وفق معايير DUO، وتتعرّف على البلد.", "A2 ve Staatsexamen NT2 B1, Hollanda pasaportu yolunda. Yapay zekâ yazma ve konuşmanı DUO'nun ölçütleriyle kontrol eder, sen de ülkeyi tanırsın.", "A2 और Staatsexamen NT2 B1, डच पासपोर्ट की राह पर। AI आपके लेखन और बोलने को DUO के मानदंडों से जाँचता है, और आप देश को जानते हैं।", "A2 和 Staatsexamen NT2 B1，迈向荷兰护照。AI 按 DUO 的标准批改你的写作和口语，你也能更了解这个国家。", "A2 y el Staatsexamen NT2 B1, camino de tu pasaporte neerlandés. La IA corrige tu escritura y tu expresión oral con los criterios de DUO, y conoces el país.", "A2 и Staatsexamen NT2 B1 — на пути к нидерландскому паспорту. ИИ проверяет письмо и устную речь по критериям DUO, а вы узнаёте страну.", "A2 і Staatsexamen NT2 B1 — на шляху до нідерландського паспорта. ШІ перевіряє письмо та усне мовлення за критеріями DUO, а ви пізнаєте країну."],
  "Begin gratis": ["Start for free", "ابدأ مجانًا", "Ücretsiz başla", "मुफ़्त शुरू करें", "免费开始", "Empieza gratis", "Начать бесплатно", "Почати безкоштовно"],
  "Installeer de app": ["Install the app", "ثبّت التطبيق", "Uygulamayı yükle", "ऐप इंस्टॉल करें", "安装应用", "Instala la aplicación", "Установить приложение", "Установити застосунок"],
  "Gratis en zonder account te proberen, ook met AI-nakijken.": ["Free to try without an account, AI checking included.", "جرّبه مجانًا وبدون حساب، مع التصحيح بالذكاء الاصطناعي أيضًا.", "Hesapsız ve ücretsiz dene, yapay zekâ kontrolü dahil.", "बिना खाते के मुफ़्त आज़माएँ, AI जाँच के साथ।", "无需账户即可免费试用，包括 AI 批改。", "Pruébalo gratis y sin cuenta, también con corrección por IA.", "Попробуйте бесплатно и без аккаунта, в том числе проверку ИИ.", "Спробуйте безкоштовно й без акаунта, зокрема перевірку ШІ."],
  "Word thuis in Nederland": ["Feel at home in the Netherlands", "اشعر بأنك في بيتك في هولندا", "Hollanda'da kendini evinde hisset", "नीदरलैंड में घर जैसा महसूस करें", "在荷兰安家落户", "Siéntete en casa en los Países Bajos", "Почувствуйте себя дома в Нидерландах", "Відчуйте себе вдома в Нідерландах"],
  "Oefen voor je inburgering of het Staatsexamen NT2, leer het land kennen en durf Nederlands te spreken.": ["Practise for your civic integration exam or the NT2 state exam, get to know the country and dare to speak Dutch.", "تدرّب لامتحان الاندماج أو امتحان الدولة NT2، وتعرّف على البلد، وتشجّع على التحدث بالهولندية.", "Uyum sınavına veya NT2 devlet sınavına çalış, ülkeyi tanı ve Flemenkçe konuşmaya cesaret et.", "इंटीग्रेशन परीक्षा या NT2 राज्य परीक्षा की तैयारी करें, देश को जानें और डच बोलने की हिम्मत करें।", "备考公民融入考试或 NT2 国家考试，了解这个国家，敢于开口说荷兰语。", "Prepárate para el examen de integración o el examen estatal NT2, conoce el país y atrévete a hablar neerlandés.", "Готовьтесь к интеграционному экзамену или государственному экзамену NT2, узнавайте страну и не бойтесь говорить по-нидерландски.", "Готуйтеся до інтеграційного іспиту або державного іспиту NT2, пізнавайте країну й не бійтеся говорити нідерландською."],
  "Oefen voor je examen": ["Practise for your exam", "تدرّب لامتحانك", "Sınavına çalış", "अपनी परीक्षा की तैयारी करें", "为考试做准备", "Prepara tu examen", "Готовьтесь к экзамену", "Готуйтеся до іспиту"],
  "Leer het land kennen en durf te spreken": ["Get to know the country and dare to speak", "تعرّف على البلد وتشجّع على الكلام", "Ülkeyi tanı ve konuşmaya cesaret et", "देश को जानें और बोलने की हिम्मत करें", "了解这个国家，敢于开口", "Conoce el país y atrévete a hablar", "Узнайте страну и заговорите", "Пізнайте країну й заговоріть"],
  "Praat met Saskia en anderen": ["Talk with Saskia and others", "تحدّث مع ساسكيا وآخرين", "Saskia ve diğerleriyle konuş", "सास्किया और दूसरों से बात करें", "和萨斯基娅等人聊天", "Habla con Saskia y otros", "Поговорите с Саскией и другими", "Поговоріть із Саскією та іншими"],
  "Saskia en de andere personages zijn AI. Praat met Saskia in het museumcafé, met Rembrandt of Van Gogh, of oefen bij de dokter, op je werk of in de winkel. Ze verbeteren je zinnen.": ["Saskia and the other characters are AI. Chat with Saskia in the museum café, with Rembrandt or Van Gogh, or practise at the doctor’s, at work or in a shop. They correct your sentences.", "ساسكيا والشخصيات الأخرى شخصيات بالذكاء الاصطناعي. تحدّث مع ساسكيا في مقهى المتحف، أو مع رامبرانت أو فان غوخ، أو تدرّب عند الطبيب وفي العمل وفي المتجر. وهي تصحّح جملك.", "Saskia ve diğer karakterler yapay zekâdır. Müze kafesinde Saskia ile, Rembrandt ya da Van Gogh ile sohbet et veya doktorda, işte ya da mağazada geçen konuşmaları çalış. Cümlelerini düzeltirler.", "सास्किया और बाकी पात्र AI हैं। म्यूज़ियम कैफ़े में सास्किया से, रेम्ब्रांट या वान गॉग से बात करें, या डॉक्टर के यहाँ, काम पर या दुकान की बातचीत का अभ्यास करें। वे आपके वाक्य सुधारते हैं।", "萨斯基娅和其他角色都是 AI。在博物馆咖啡馆和萨斯基娅聊天，和伦勃朗或梵高对话，或练习看医生、工作和购物时的对话。他们会纠正你的句子。", "Saskia y los demás personajes son IA. Charla con Saskia en el café del museo, con Rembrandt o Van Gogh, o practica en el médico, en el trabajo o en una tienda. Corrigen tus frases.", "Саския и другие персонажи — это ИИ. Болтайте с Саскией в музейном кафе, с Рембрандтом или Ван Гогом, или тренируйтесь у врача, на работе и в магазине. Они исправляют ваши фразы.", "Саскія та інші персонажі — це ШІ. Спілкуйтеся із Саскією в кафе музею, з Рембрандтом або Ван Гогом, чи тренуйтеся в лікаря, на роботі й у магазині. Вони виправляють ваші фрази."],
  "Helpt Bittertalen ook bij naturalisatie?": ["Does Bittertalen help with naturalisation too?", "هل يساعد Bittertalen في التجنّس أيضًا؟", "Bittertalen vatandaşlığa geçişte de yardımcı olur mu?", "क्या Bittertalen नागरिकता (naturalisatie) में भी मदद करता है?", "Bittertalen 对入籍也有帮助吗？", "¿Bittertalen también ayuda con la naturalización?", "Помогает ли Bittertalen с натурализацией?", "Чи допомагає Bittertalen з натуралізацією?"],
  "Voor naturalisatie heb je meestal een inburgeringsdiploma nodig, op minimaal A2-niveau. Bittertalen helpt je oefenen voor de examens en leert je over Nederland. De IND beslist over je aanvraag: kijk op ind.nl wat voor jou geldt.": ["For naturalisation you usually need a civic integration diploma, at level A2 or higher. Bittertalen helps you practise for the exams and teaches you about the Netherlands. The IND decides on your application: check ind.nl for what applies to you.", "للتجنّس تحتاج عادةً إلى شهادة الاندماج بمستوى A2 على الأقل. يساعدك Bittertalen على التدرّب للامتحانات ويعرّفك بهولندا. دائرة الهجرة والتجنيس (IND) هي التي تقرر في طلبك: راجع ind.nl لمعرفة ما ينطبق عليك.", "Vatandaşlık için genellikle en az A2 seviyesinde bir uyum diploması gerekir. Bittertalen sınavlara çalışmana yardım eder ve sana Hollanda'yı tanıtır. Başvurun hakkında IND karar verir: senin için neyin geçerli olduğunu ind.nl'de kontrol et.", "नागरिकता के लिए आमतौर पर कम से कम A2 स्तर का इंटीग्रेशन डिप्लोमा चाहिए। Bittertalen परीक्षाओं की तैयारी में मदद करता है और आपको नीदरलैंड के बारे में सिखाता है। आपके आवेदन पर फ़ैसला IND करता है: आप पर क्या लागू होता है, यह ind.nl पर देखें।", "入籍通常需要至少 A2 级的融入考试证书。Bittertalen 帮你备考，并让你了解荷兰。你的申请由 IND 决定：请在 ind.nl 查看适用于你的规定。", "Para la naturalización normalmente necesitas un diploma de integración de nivel A2 o superior. Bittertalen te ayuda a preparar los exámenes y te enseña sobre los Países Bajos. La IND decide sobre tu solicitud: consulta en ind.nl lo que se aplica a ti.", "Для натурализации обычно нужен диплом об интеграции уровня не ниже A2. Bittertalen помогает готовиться к экзаменам и знакомит с Нидерландами. Решение по заявлению принимает IND: проверьте на ind.nl, что действует в вашем случае.", "Для натуралізації зазвичай потрібен диплом про інтеграцію рівня не нижче A2. Bittertalen допомагає готуватися до іспитів і знайомить із Нідерландами. Рішення щодо заяви ухвалює IND: перевірте на ind.nl, що діє у вашому випадку."],
  "Download de app": ["Download the app", "نزّل التطبيق", "Uygulamayı indir", "ऐप डाउनलोड करें", "下载应用", "Descargar la aplicación", "Скачать приложение", "Завантажити застосунок"],
  "Zet Bittertalen gratis op je beginscherm. Geen account nodig.": ["Add Bittertalen to your home screen for free. No account needed.", "أضف Bittertalen إلى شاشتك الرئيسية مجانًا. لا تحتاج إلى حساب.", "Bittertalen’ı ücretsiz olarak ana ekranına ekle. Hesap gerekmez.", "Bittertalen को अपनी होम स्क्रीन पर मुफ़्त जोड़ें। खाते की ज़रूरत नहीं।", "免费将 Bittertalen 添加到主屏幕，无需账号。", "Añade Bittertalen gratis a tu pantalla de inicio. No necesitas una cuenta.", "Бесплатно добавьте Bittertalen на главный экран. Аккаунт не нужен.", "Безкоштовно додайте Bittertalen на головний екран. Акаунт не потрібен."],
  "Open deze website in Safari. Tik op Deel en daarna op Zet op beginscherm.": ["Open this website in Safari. Tap Share, then Add to Home Screen.", "افتح هذا الموقع في Safari. اضغط على مشاركة، ثم إضافة إلى الشاشة الرئيسية.", "Bu siteyi Safari’de aç. Paylaş’a, ardından Ana Ekrana Ekle’ye dokun.", "इस वेबसाइट को Safari में खोलें। शेयर पर टैप करें, फिर होम स्क्रीन पर जोड़ें चुनें।", "在 Safari 中打开此网站。轻点“分享”，然后选择“添加到主屏幕”。", "Abre este sitio en Safari. Toca Compartir y después Añadir a pantalla de inicio.", "Откройте этот сайт в Safari. Нажмите «Поделиться», затем «На экран Домой».", "Відкрийте цей сайт у Safari. Натисніть «Поділитися», потім «На початковий екран»."],
  "Open deze website in Chrome. Tik op het menu ⋮ en kies App installeren of Toevoegen aan startscherm.": ["Open this website in Chrome. Tap the ⋮ menu and choose Install app or Add to home screen.", "افتح هذا الموقع في Chrome. اضغط على القائمة ⋮ واختر تثبيت التطبيق أو الإضافة إلى الشاشة الرئيسية.", "Bu siteyi Chrome’da aç. ⋮ menüsüne dokun ve Uygulamayı yükle veya Ana ekrana ekle’yi seç.", "इस वेबसाइट को Chrome में खोलें। ⋮ मेनू में ऐप इंस्टॉल करें या होम स्क्रीन पर जोड़ें चुनें।", "在 Chrome 中打开此网站。轻点 ⋮ 菜单，选择“安装应用”或“添加到主屏幕”。", "Abre este sitio en Chrome. Toca el menú ⋮ y elige Instalar aplicación o Añadir a pantalla de inicio.", "Откройте этот сайт в Chrome. В меню ⋮ выберите «Установить приложение» или «Добавить на главный экран».", "Відкрийте цей сайт у Chrome. У меню ⋮ виберіть «Установити застосунок» або «Додати на головний екран»."],
  "Computer": ["Computer", "الكمبيوتر", "Bilgisayar", "कंप्यूटर", "电脑", "Ordenador", "Компьютер", "Комп'ютер"],
  "Open deze website in Chrome of Edge. Klik op het installatiepictogram in de adresbalk of kies Deze pagina als app installeren in het browsermenu.": ["Open this website in Chrome or Edge. Click the install icon in the address bar or choose Install this page as an app in the browser menu.", "افتح هذا الموقع في Chrome أو Edge. انقر على رمز التثبيت في شريط العنوان أو اختر تثبيت هذه الصفحة كتطبيق من قائمة المتصفح.", "Bu siteyi Chrome veya Edge’de aç. Adres çubuğundaki yükleme simgesine tıkla veya tarayıcı menüsünden Bu sayfayı uygulama olarak yükle’yi seç.", "इस वेबसाइट को Chrome या Edge में खोलें। पता बार में इंस्टॉल आइकन पर क्लिक करें या ब्राउज़र मेनू में इस पेज को ऐप के रूप में इंस्टॉल करें चुनें।", "在 Chrome 或 Edge 中打开此网站。点击地址栏中的安装图标，或在浏览器菜单中选择“将此页面安装为应用”。", "Abre este sitio en Chrome o Edge. Haz clic en el icono de instalación de la barra de direcciones o elige Instalar esta página como una aplicación en el menú del navegador.", "Откройте этот сайт в Chrome или Edge. Нажмите значок установки в адресной строке или выберите «Установить эту страницу как приложение» в меню браузера.", "Відкрийте цей сайт у Chrome або Edge. Натисніть значок установлення в адресному рядку або виберіть «Установити цю сторінку як застосунок» у меню браузера."],
  "Handig als je examendatum vaststaat.": ["Useful when you know your exam date.", "مناسب إذا كان موعد امتحانك محددًا.", "Sınav tarihin belliyse kullanışlı.", "अगर परीक्षा की तारीख तय है तो सुविधाजनक।", "适合已确定考试日期的考生。", "Práctico si ya sabes la fecha del examen.", "Подходит, если дата экзамена уже известна.", "Зручно, якщо дата іспиту вже відома."],
  "Voordeliger vanaf negen maanden Plus.": ["Cheaper than nine or more monthly Plus payments.", "أوفر من تسعة أقساط شهرية أو أكثر من Plus.", "Dokuz ay ve üzeri Plus ödemesinden daha uygun.", "Plus के नौ या अधिक मासिक भुगतानों से सस्ता।", "比按月支付九个月及以上的 Plus 更便宜。", "Más económico que nueve o más mensualidades de Plus.", "Дешевле девяти и более месячных платежей Plus.", "Вигідніше за дев’ять або більше місяців підписки Plus."],
  "AI-feedback op Schrijven en Spreken A2, ook bij proefexamens.": ["AI feedback for A2 writing and speaking, including mock exams.", "ملاحظات بالذكاء الاصطناعي على الكتابة والتحدث A2، بما في ذلك الامتحانات التجريبية.", "Deneme sınavları dahil A2 yazma ve konuşma için yapay zekâ geri bildirimi.", "अभ्यास परीक्षाओं सहित A2 लेखन और बोलने पर AI फ़ीडबैक।", "AI 批改 A2 写作和口语，包括模拟考试。", "Comentarios de IA para escritura y expresión oral A2, incluidos los simulacros.", "ИИ проверяет письмо и устную речь A2, в том числе на пробных экзаменах.", "Відгуки ШІ щодо письма й говоріння на рівні A2, зокрема на пробних іспитах."],
  "Handig voor één of twee maanden voorbereiding.": ["Useful for one or two months of preparation.", "مناسب للتحضير لمدة شهر أو شهرين.", "Bir veya iki aylık hazırlık için uygun.", "एक या दो महीने की तैयारी के लिए सुविधाजनक।", "适合一到两个月的备考。", "Práctico para uno o dos meses de preparación.", "Подходит для одного-двух месяцев подготовки.", "Зручно, якщо маєте один або два місяці на підготовку."],
  "AI-feedback op Schrijven en Spreken B1 én A2 met één tegoed.": ["AI feedback for writing and speaking at B1 and A2, with one shared allowance.", "ملاحظات بالذكاء الاصطناعي على الكتابة والتحدث في B1 وA2 برصيد مشترك.", "B1 ve A2 yazma ve konuşma için ortak hakla yapay zekâ geri bildirimi.", "एक साझा कोटे से B1 और A2 लेखन और बोलने पर AI फ़ीडबैक।", "AI 批改 B1 和 A2 写作及口语，共用额度。", "Comentarios de IA para escritura y expresión oral B1 y A2 con un saldo compartido.", "ИИ проверяет письмо и устную речь на B1 и A2. Лимит общий.", "Відгуки ШІ щодо письма й говоріння на рівнях B1 та A2 зі спільним лімітом."],
  "Eén tegoed voor de hele periode. B1 is inclusief A2.": ["One allowance for the whole period. B1 includes A2.", "رصيد واحد للفترة كلها. تشمل B1 مستوى A2.", "Tüm dönem için tek hak. B1, A2'yi de içerir.", "पूरी अवधि के लिए एक कोटा। B1 में A2 भी शामिल है।", "整个有效期共用一个额度。B1 包含 A2。", "Un saldo para todo el periodo. B1 incluye A2.", "Один лимит на весь срок. В B1 входит A2.", "Спільний ліміт на весь період. B1 включає A2."],
  "Een jaar AI-feedback voor één betaling. B1 is inclusief A2.": ["A year of AI feedback with one payment. B1 includes A2.", "عام من ملاحظات الذكاء الاصطناعي بدفعة واحدة. تشمل B1 مستوى A2.", "Tek ödemeyle bir yıl yapay zekâ geri bildirimi. B1, A2'yi de içerir.", "एक भुगतान में एक साल का AI फ़ीडबैक। B1 में A2 भी शामिल है।", "一次付款可获得一年 AI 批改。B1 包含 A2。", "Un año de comentarios de IA con un solo pago. B1 incluye A2.", "Год AI-проверок за одну оплату. В B1 входит A2.", "Рік відгуків ШІ за один платіж. B1 включає A2."],
  "Handig als je bijna het hele jaar wilt oefenen.": ["Useful if you want to practise for most of the year.", "مناسب إذا أردت التدرّب معظم العام.", "Yılın büyük bölümünde çalışacaksan uygun.", "अगर आप लगभग पूरे साल अभ्यास करना चाहते हैं तो सुविधाजनक।", "适合一年中大部分时间都要练习的人。", "Práctico si quieres practicar durante casi todo el año.", "Подходит, если планируете заниматься большую часть года.", "Зручно, якщо плануєте займатися майже весь рік."],
  "Losse opdracht: meestal 1 beurt. Proefexamen Schrijven: 2 op A2 of 4 op B1. Proefexamen Spreken: 6.": ["Single task: usually 1 check. Writing mock exam: 2 for A2 or 4 for B1. Speaking mock exam: 6.", "المهمة الواحدة: عادةً تصحيح واحد. امتحان الكتابة التجريبي: 2‏ لـ A2 أو 4 لـ B1. امتحان التحدث التجريبي: 6.", "Tek görev: genelde 1 hak. Yazma deneme sınavı: A2 için 2, B1 için 4. Konuşma deneme sınavı: 6.", "एक अभ्यास: आम तौर पर 1 जाँच। लेखन अभ्यास परीक्षा: A2 के लिए 2 या B1 के लिए 4। बोलने की अभ्यास परीक्षा: 6।", "单项练习通常用 1 次。写作模拟考试：A2 用 2 次，B1 用 4 次。口语模拟考试：6 次。", "Tarea suelta: normalmente 1 revisión. Simulacro de escritura: 2 para A2 o 4 para B1. Simulacro oral: 6.", "Одно задание — обычно 1 проверка. Пробник письма — 2 на A2 или 4 на B1. Пробник устной речи — 6.", "Окреме завдання: зазвичай 1 перевірка. Пробний іспит із письма: 2 для A2 або 4 для B1. Пробний усний іспит: 6."],
  "Bereid je voor op Inburgering A2 of Staatsexamen NT2 B1. Krijg punten per criterium voor Schrijven en Spreken en oefen verder met je eigen fouten.": ["Prepare for Inburgering A2 or Staatsexamen NT2 B1. Get scores by criterion for writing and speaking and practise with your own mistakes.", "استعد لامتحان Inburgering A2 أو Staatsexamen NT2 B1. احصل على نقاط حسب المعيار للكتابة والتحدث، وتدرّب على أخطائك.", "Inburgering A2 veya Staatsexamen NT2 B1 sınavına hazırlan. Yazma ve konuşmada her ölçüt için puan al, kendi hatalarınla pratik yap.", "Inburgering A2 या Staatsexamen NT2 B1 की तैयारी करें। लेखन और बोलने के हर मानदंड पर अंक पाएँ और अपनी ग़लतियों पर अभ्यास करें।", "准备 Inburgering A2 或 Staatsexamen NT2 B1 考试。查看写作和口语各项评分，并针对自己的错误练习。", "Prepárate para Inburgering A2 o Staatsexamen NT2 B1. Recibe una puntuación por criterio en escritura y expresión oral, y practica con tus propios errores.", "Подготовьтесь к Inburgering A2 или Staatsexamen NT2 B1. Получайте баллы по каждому критерию за письмо и устную речь и тренируйтесь на своих ошибках.", "Готуйтеся до Inburgering A2 або Staatsexamen NT2 B1. Отримуйте бали за кожним критерієм письма й говоріння та працюйте над власними помилками."],

  "Gebruiksvoorwaarden": ["Terms of use", "شروط الاستخدام", "Kullanım koşulları", "उपयोग की शर्तें", "使用条款", "Condiciones de uso", "Условия использования", "Умови використання"],
  "Bittertalen is een onafhankelijke oefenapp en is niet verbonden aan DUO.": ["Bittertalen is an independent practice app and is not affiliated with DUO.", "Bittertalen تطبيق مستقل للتدرّب ولا يرتبط بـ DUO.", "Bittertalen bağımsız bir alıştırma uygulamasıdır ve DUO ile bağlantılı değildir.", "Bittertalen एक स्वतंत्र अभ्यास ऐप है और DUO से संबद्ध नहीं है।", "Bittertalen 是独立的练习应用，与 DUO 没有隶属或合作关系。", "Bittertalen es una aplicación de práctica independiente y no está afiliada a DUO.", "Bittertalen — независимое приложение для подготовки, не связанное с DUO.", "Bittertalen — незалежний застосунок для підготовки, не пов'язаний із DUO."],
  "Oefenresultaten bieden geen garantie op het behalen van een officieel examen.": ["Practice results do not guarantee passing an official exam.", "نتائج التدريب لا تضمن النجاح في الامتحان الرسمي.", "Alıştırma sonuçları resmî sınavı geçmeyi garanti etmez.", "अभ्यास के नतीजे आधिकारिक परीक्षा पास करने की गारंटी नहीं देते।", "练习成绩不保证能通过正式考试。", "Los resultados de práctica no garantizan aprobar un examen oficial.", "Результаты тренировок не гарантируют сдачу официального экзамена.", "Результати тренувань не гарантують складання офіційного іспиту."],
  "KVK en btw-id zijn tijdelijke placeholders en moeten nog worden ingevuld.": ["KVK and VAT ID numbers are temporary placeholders and still need to be completed.", "أرقام KVK وضريبة القيمة المضافة مؤقتة ويجب استكمالها.", "KVK ve KDV numaraları geçici yer tutuculardır; henüz doldurulmamıştır.", "KVK और VAT नंबर अस्थायी प्लेसहोल्डर हैं; इन्हें अभी भरना बाकी है।", "KVK 和增值税号码为临时占位内容，尚待填写。", "Los números KVK e IVA son datos provisionales pendientes de completar.", "Номера KVK и BTW-id — временные заполнители; их ещё предстоит указать.", "Номери KVK і BTW-id — тимчасові заповнювачі; їх ще потрібно вказати."],

  "Begin met oefenen": ["Start practising", "ابدأ التدرّب", "Çalışmaya başla", "अभ्यास शुरू करें", "开始练习", "Empezar a practicar", "Начать заниматься", "Почати займатися"],
  "Boeken lezen met vertaling": ["Read books with translation", "قراءة الكتب مع الترجمة", "Çeviri desteğiyle kitap oku", "अनुवाद की मदद से किताबें पढ़ें", "借助翻译读书", "Lee libros con ayuda de la traducción", "Книги с переводом", "Книжки з перекладом"],
  "Leren van je fouten": ["Learn from your mistakes", "تعلّم من أخطائك", "Hatalarından öğren", "अपनी गलतियों से सीखें", "从错误中学习", "Aprende de tus errores", "Работа над ошибками", "Робота над помилками"],
  "Herhaal vragen die je eerder fout had en oefen extra met wat nog lastig is.": ["Revisit questions you previously got wrong and practise what you still find difficult.", "راجع الأسئلة التي أخطأت فيها سابقًا وتدرّب أكثر على ما لا يزال صعبًا.", "Daha önce yanlış cevapladığın soruları tekrarla ve zorlandığın konulara daha çok çalış.", "जिन सवालों में पहले गलती हुई थी उन्हें दोहराएँ और मुश्किल विषयों का और अभ्यास करें।", "重做之前答错的题目，重点练习仍然觉得困难的内容。", "Repite las preguntas que antes respondiste mal y refuerza lo que todavía te cuesta.", "Повторяйте задания, в которых раньше ошибались, и уделяйте больше внимания сложным темам.", "Повторюйте завдання, у яких раніше помилялися, і приділяйте більше уваги складним темам."],

  "Animatie": ["Animation", "الحركة", "Animasyon", "ऐनिमेशन", "动画", "Animación", "Анимация", "Анімація"],
  "Bekijk de app": ["Explore the app", "تعرّف على التطبيق", "Uygulamayı keşfet", "ऐप देखें", "看看应用", "Explora la aplicación", "Посмотрите приложение", "Перегляньте застосунок"],
  "Mijn dag": ["My day", "يومي", "Günüm", "मेरा दिन", "我的一天", "Mi día", "Мой день", "Мій день"],
  "Oefenen": ["Practise", "تدرّب", "Alıştırma", "अभ्यास", "练习", "Practicar", "Упражнения", "Вправи"],
  "Examen": ["Exam", "الامتحان", "Sınav", "परीक्षा", "考试", "Examen", "Экзамен", "Іспит"],
  "Oefeningen in Bittertalen": ["Exercises in Bittertalen", "تمارين في Bittertalen", "Bittertalen alıştırmaları", "Bittertalen में अभ्यास", "Bittertalen 练习", "Ejercicios en Bittertalen", "Упражнения в Bittertalen", "Вправи в Bittertalen"],
  "Proefexamens in Bittertalen": ["Mock exams in Bittertalen", "امتحانات تجريبية في Bittertalen", "Bittertalen deneme sınavları", "Bittertalen में अभ्यास परीक्षाएँ", "Bittertalen 模拟考试", "Simulacros de examen en Bittertalen", "Пробные экзамены в Bittertalen", "Пробні іспити в Bittertalen"],

  "Niveaus": ["Levels", "المستويات", "Seviyeler", "स्तर", "级别", "Niveles", "Уровни", "Рівні"],
  "Zo werkt het": ["How it works", "كيف يعمل", "Nasıl çalışır?", "यह कैसे काम करता है", "使用方法", "Cómo funciona", "Как это работает", "Як це працює"],
  "Prijzen": ["Pricing", "الأسعار", "Fiyatlar", "कीमतें", "价格", "Precios", "Цены", "Ціни"],
  "Inloggen": ["Sign in", "تسجيل الدخول", "Giriş yap", "लॉग इन", "登录", "Iniciar sesión", "Войти", "Увійти"],
  "Hoi, ik ben Bittie!": ["Hi, I’m Bittie!", "مرحبًا، أنا بيتي!", "Merhaba, ben Bittie!", "नमस्ते, मैं बिट्टी हूँ!", "你好，我是 Bittie！", "¡Hola, soy Bittie!", "Привет, я Битти!", "Привіт, я Бітті!"],
  "Waar oefen je voor?": ["What are you preparing for?", "لأي امتحان تستعد؟", "Hangi sınava hazırlanıyorsun?", "आप किस परीक्षा की तैयारी कर रहे हैं?", "你在准备哪项考试？", "¿Para qué examen te preparas?", "К какому экзамену вы готовитесь?", "До якого іспиту ви готуєтеся?"],
  "Inburgeringsexamen": ["Civic integration exam", "امتحان الاندماج", "Uyum sınavı", "नागरिक एकीकरण परीक्षा", "公民融入考试", "Examen de integración", "Интеграционный экзамен", "Інтеграційний іспит"],
  "Oefen met Nederlands uit het dagelijks leven: lezen, luisteren, schrijven en spreken. Oefen ook Kennis van de Nederlandse Maatschappij (KNM).": ["Practise everyday Dutch: reading, listening, writing and speaking. You can also practise Knowledge of Dutch Society (KNM).", "تدرّب على الهولندية في الحياة اليومية: القراءة والاستماع والكتابة والتحدث. وتدرّب أيضًا على معرفة المجتمع الهولندي (KNM).", "Günlük Flemenkçe okuma, dinleme, yazma ve konuşma alıştırmaları yap. Hollanda toplumu bilgisi (KNM) için de çalışabilirsin.", "रोज़मर्रा की डच पढ़ने, सुनने, लिखने और बोलने का अभ्यास करें। डच समाज का ज्ञान (KNM) भी सीखें।", "练习日常荷兰语的听、说、读、写。你也可以学习荷兰社会知识（KNM）。", "Practica el neerlandés de la vida diaria: lectura, comprensión oral, escritura y expresión oral. Repasa también tus conocimientos sobre la sociedad neerlandesa (KNM).", "Практикуйте нидерландский для повседневной жизни: чтение, аудирование, письмо и устную речь. Готовьтесь и к разделу о нидерландском обществе (KNM).", "Практикуйте нідерландську для повсякденного життя: читання, аудіювання, письмо й усне мовлення. Готуйтеся й до розділу про нідерландське суспільство (KNM)."],
  "Oefen op A2": ["Practise A2", "تدرّب على A2", "A2 çalış", "A2 का अभ्यास करें", "练习 A2", "Practicar A2", "Практика A2", "Практика A2"],
  "Staatsexamen NT2 · Programma I": ["NT2 state exam · Programme I", "امتحان الدولة NT2 · البرنامج الأول", "NT2 devlet sınavı · Program I", "NT2 राज्य परीक्षा · कार्यक्रम I", "NT2 国家考试 · 第一项目", "Examen estatal NT2 · Programa I", "Государственный экзамен NT2 · Программа I", "Державний іспит NT2 · Програма I"],
  "Bereid je voor op lezen, luisteren, schrijven en spreken op B1, met langere teksten en opdrachten over werk, studie en het dagelijks leven.": ["Prepare for B1 reading, listening, writing and speaking with longer texts and tasks about work, study and everyday life.", "استعد للقراءة والاستماع والكتابة والتحدث في مستوى B1 مع نصوص أطول ومهام عن العمل والدراسة والحياة اليومية.", "İş, eğitim ve günlük yaşamla ilgili daha uzun metinler ve görevlerle B1 okuma, dinleme, yazma ve konuşma sınavlarına hazırlan.", "काम, पढ़ाई और रोज़मर्रा के जीवन से जुड़े लंबे लेखों और अभ्यासों के साथ B1 स्तर पर पढ़ने, सुनने, लिखने और बोलने की तैयारी करें।", "用工作、学习和日常生活中的较长文章和任务，练习 B1 级别的听、说、读、写。", "Practica la lectura, la comprensión oral, la escritura y la expresión oral de nivel B1 con textos más largos y tareas sobre trabajo, estudios y vida cotidiana.", "Тренируйте чтение, аудирование, письмо и устную речь на уровне B1. Здесь тексты длиннее, а задания посвящены работе, учёбе и повседневной жизни.", "Тренуйте читання, аудіювання, письмо й усне мовлення на рівні B1. Тут тексти довші, а завдання присвячені роботі, навчанню й повсякденному життю."],
  "Oefen op B1": ["Practise B1", "تدرّب على B1", "B1 çalış", "B1 का अभ्यास करें", "练习 B1", "Practicar B1", "Практика B1", "Практика B1"],
  "Je kunt je niveau later veranderen in je profiel.": ["You can change your level later in your profile.", "يمكنك تغيير مستواك لاحقًا في ملفك الشخصي.", "Seviyeni daha sonra profilinden değiştirebilirsin.", "आप बाद में अपनी प्रोफ़ाइल में स्तर बदल सकते हैं।", "之后可以在个人资料中更改级别。", "Puedes cambiar de nivel más adelante en Perfil.", "Уровень можно изменить позже в профиле.", "Рівень можна змінити пізніше в профілі."],
  "Drie manieren om te oefenen": ["Three ways to practise", "ثلاث طرق للتدرّب", "Çalışmanın üç yolu", "अभ्यास के तीन तरीके", "三种练习方式", "Tres formas de practicar", "Три способа заниматься", "Три способи займатися"],
  "Een les per dag": ["A lesson a day", "درس كل يوم", "Her gün bir ders", "रोज़ एक पाठ", "每天一课", "Una lección al día", "Один урок в день", "Один урок на день"],
  "Kies 10, 20 of 40 minuten. Bittertalen stelt je les samen en geeft extra aandacht aan wat je lastig vindt.": ["Choose 10, 20 or 40 minutes. Bittertalen builds your lesson around the areas you find hardest.", "اختر 10 أو 20 أو 40 دقيقة. يعدّ Bittertalen درسًا يركّز على ما تجده صعبًا.", "10, 20 veya 40 dakika seç. Bittertalen dersini zorlandığın konulara göre hazırlar.", "10, 20 या 40 मिनट चुनें। Bittertalen उन विषयों पर ज़्यादा ध्यान देता है जो आपको मुश्किल लगते हैं।", "选择 10、20 或 40 分钟。Bittertalen 会安排课程，让你多练习觉得困难的内容。", "Elige 10, 20 o 40 minutos. Bittertalen prepara una lección y dedica más tiempo a lo que te cuesta.", "Выберите 10, 20 или 40 минут. Bittertalen составит урок и уделит больше внимания тому, что даётся сложнее.", "Виберіть 10, 20 або 40 хвилин. Bittertalen складе урок і приділить більше уваги тому, що дається важче."],
  "Zelf kiezen": ["Choose what to practise", "اختر ما تتدرّب عليه", "Ne çalışacağını seç", "अपना अभ्यास चुनें", "自己选练习", "Elige qué practicar", "Выберите, что тренировать", "Виберіть, що тренувати"],
  "Oefen één vaardigheid, herhaal woorden, doe grammatica of lees en luister naar verhalen in het Nederlands.": ["Work on one skill, review words, practise grammar or read and listen to Dutch stories.", "تدرّب على مهارة أو راجع الكلمات والقواعد أو اقرأ واستمع إلى قصص بالهولندية.", "Bir beceriye çalış, kelimeleri tekrarla, dil bilgisi alıştırması yap veya Flemenkçe hikâyeler oku ve dinle.", "किसी एक कौशल पर काम करें, शब्द दोहराएँ, व्याकरण का अभ्यास करें या डच कहानियाँ पढ़ें और सुनें।", "练习单项技能、复习单词、练习语法，或阅读和收听荷兰语故事。", "Practica una habilidad, repasa vocabulario, haz ejercicios de gramática o lee y escucha relatos en neerlandés.", "Тренируйте отдельный навык, повторяйте слова и грамматику, читайте и слушайте рассказы на нидерландском.", "Тренуйте окрему навичку, повторюйте слова й граматику, читайте та слухайте оповідання нідерландською."],
  "Een proefexamen maken": ["Take a mock exam", "جرّب امتحانًا تجريبيًا", "Deneme sınavına gir", "अभ्यास परीक्षा दें", "做模拟考试", "Haz un simulacro", "Пройдите пробный экзамен", "Пройдіть пробний іспит"],
  "Oefen een examenonderdeel met een timer en bekijk je resultaten om te zien wat je nog kunt oefenen.": ["Practise an exam section with a timer, then see your results and what to work on next.", "تدرّب على قسم من الامتحان في وقت محدد، ثم راجع نتائجك لتعرف ما تحتاج إلى مراجعته.", "Bir sınav bölümünü süre tutarak çöz. Sonuçlarına bakıp hangi konulara çalışman gerektiğini gör.", "समय सीमा में परीक्षा का एक भाग हल करें और नतीजे देखकर तय करें कि किसका और अभ्यास करना है।", "限时练习一个考试科目，再查看结果，了解还需要练习什么。", "Practica una parte del examen con un temporizador. Después, consulta tus resultados para saber qué reforzar.", "Пройдите раздел экзамена на время и посмотрите результаты, чтобы понять, над чем ещё поработать.", "Пройдіть розділ іспиту на час і перегляньте результати, щоб зрозуміти, над чим ще попрацювати."],
  "Gratis": ["Free", "مجاني", "Ücretsiz", "मुफ़्त", "免费", "Gratis", "Бесплатно", "Безкоштовно"],
  "Alle oefeningen en proefexamens op A2 en B1": ["All A2 and B1 exercises and mock exams", "كل تمارين واختبارات A2 وB1 التجريبية", "Tüm A2 ve B1 alıştırmaları ve deneme sınavları", "A2 और B1 के सभी अभ्यास और अभ्यास परीक्षाएँ", "所有 A2 和 B1 练习及模拟考试", "Todos los ejercicios y simulacros de A2 y B1", "Все упражнения и пробные экзамены A2 и B1", "Усі вправи та пробні іспити A2 і B1"],
  "Oefenen zonder account": ["Practise without an account", "تدرّب دون حساب", "Hesap açmadan çalış", "बिना खाते के अभ्यास करें", "无需账号即可练习", "Práctica sin cuenta", "Практика без аккаунта", "Практика без акаунта"],
  "Met een gratis account: voortgang op al je apparaten": ["With a free account: keep your progress across devices", "بحساب مجاني: احفظ تقدمك على جميع أجهزتك", "Ücretsiz hesapla ilerlemeni tüm cihazlarında kaydet", "मुफ़्त खाते से सभी डिवाइस पर अपनी प्रगति सहेजें", "用免费账号在所有设备上保存进度", "Con una cuenta gratuita, tu progreso se guarda en todos tus dispositivos", "С бесплатным аккаунтом прогресс доступен на всех ваших устройствах", "З безкоштовним акаунтом прогрес доступний на всіх ваших пристроях"],
  "Open Bittertalen": ["Open Bittertalen", "افتح Bittertalen", "Bittertalen’i aç", "Bittertalen खोलें", "打开 Bittertalen", "Abrir Bittertalen", "Открыть Bittertalen", "Відкрити Bittertalen"],
  "Voor beide niveaus, met een account": ["For both levels, with an account", "للمستويين، مع حساب", "Bir hesapla her iki seviye için", "खाते के साथ दोनों स्तरों के लिए", "注册账号后可用于两个级别", "Para ambos niveles, con una cuenta", "Для обоих уровней при наличии аккаунта", "Для обох рівнів за наявності акаунта"],
  "Elke maand opzegbaar": ["Cancel any month", "يمكن الإلغاء كل شهر", "Her ay iptal edilebilir", "हर महीने रद्द कर सकते हैं", "每月都可取消", "Puedes cancelar cada mes", "Можно отменить в любой месяц", "Можна скасувати будь-якого місяця"],
  "Bekijk Plus": ["See Plus", "اطّلع على Plus", "Plus’ı incele", "Plus देखें", "查看 Plus", "Ver Plus", "Посмотреть Plus", "Переглянути Plus"],
  "Klaar voor je eerste oefening?": ["Ready for your first exercise?", "هل أنت مستعد لأول تمرين؟", "İlk alıştırmana hazır mısın?", "पहले अभ्यास के लिए तैयार हैं?", "准备好开始第一道练习了吗？", "¿Todo listo para tu primer ejercicio?", "Готовы к первому заданию?", "Готові до першого завдання?"],
  "Over Bittertalen": ["About Bittertalen", "عن Bittertalen", "Bittertalen hakkında", "Bittertalen के बारे में", "关于 Bittertalen", "Acerca de Bittertalen", "О Bittertalen", "Про Bittertalen"],
  "Privacyverklaring": ["Privacy policy", "سياسة الخصوصية", "Gizlilik bildirimi", "गोपनीयता नीति", "隐私声明", "Política de privacidad", "Политика конфиденциальности", "Політика конфіденційності"],
  "Begin gratis": ["Start for free", "ابدأ مجانًا", "Ücretsiz başla", "मुफ़्त में शुरू करें", "免费开始", "Empieza gratis", "Начать бесплатно", "Почати безкоштовно"],
  "oefenvragen": ["practice questions", "سؤال تدريبي", "alıştırma sorusu", "अभ्यास प्रश्न", "道练习题", "preguntas de práctica", "тренировочных вопросов", "тренувальних питань"],
  "KNM-vragen over de 8 thema's": ["KNM questions on the 8 themes", "سؤال KNM عن المواضيع الثمانية", "8 konuda KNM sorusu", "8 विषयों पर KNM प्रश्न", "道 KNM 题，覆盖 8 个主题", "preguntas de KNM sobre los 8 temas", "вопросов KNM по 8 темам", "питань KNM за 8 темами"],
  "proefexamens per niveau, met een timer": ["timed mock exams per level", "امتحانات تجريبية لكل مستوى، مع مؤقت", "seviye başına süreli deneme sınavı", "हर स्तर पर समय सीमा वाली अभ्यास परीक्षाएँ", "每个级别的限时模拟考试", "simulacros cronometrados por nivel", "пробных экзаменов на время для каждого уровня", "пробних іспитів на час для кожного рівня"],
  "gesprekken om hardop te oefenen": ["conversations to practise out loud", "محادثة للتدرّب بصوت عالٍ", "sesli pratik için konuşma", "ज़ोर से अभ्यास के लिए बातचीत", "段可大声练习的对话", "conversaciones para practicar en voz alta", "диалогов для тренировки вслух", "діалогів для тренування вголос"],
  "Zo ziet het eruit": ["What it looks like", "هكذا يبدو التطبيق", "Uygulama böyle görünüyor", "ऐप ऐसा दिखता है", "应用界面", "Así se ve", "Как это выглядит", "Як це виглядає"],
  "Elke dag een les met korte rondes.": ["A daily lesson in short rounds.", "درس يومي من جولات قصيرة.", "Her gün kısa turlardan oluşan bir ders.", "हर दिन छोटे-छोटे दौर वाला एक पाठ।", "每天一课，分成几轮短练习。", "Una lección diaria en rondas cortas.", "Урок каждый день из коротких раундов.", "Урок щодня з коротких раундів."],
  "Feedback op je tekst: punten per onderdeel en je fouten in je eigen tekst.": ["Feedback on your writing: points per criterion and your mistakes marked in your own text.", "تصحيح لنصك: نقاط لكل معيار وأخطاؤك مُعلَّمة في نصك.", "Yazına geri bildirim: her ölçüt için puan ve hataların kendi metninde işaretli.", "आपके लेखन पर फ़ीडबैक: हर मानदंड के अंक और आपकी गलतियाँ आपके ही पाठ में चिह्नित।", "写作反馈：按评分项给分，并在你的原文中标出错误。", "Comentarios sobre tu texto: puntos por criterio y tus errores marcados en tu propio texto.", "Разбор текста: баллы по каждому критерию и ошибки, отмеченные прямо в вашем тексте.", "Розбір тексту: бали за кожним критерієм і помилки, позначені прямо у вашому тексті."],
  "Proefexamens met een timer, en je score per onderdeel.": ["Timed mock exams, and your score per exam section.", "امتحانات تجريبية بمؤقت، ونتيجتك في كل قسم.", "Süreli deneme sınavları ve her bölümdeki puanın.", "समय सीमा वाली अभ्यास परीक्षाएँ और हर भाग में आपका स्कोर।", "限时模拟考试，以及你在每个部分的分数。", "Simulacros cronometrados y tu puntuación por sección.", "Пробные экзамены на время и ваш результат по каждому разделу.", "Пробні іспити на час і ваш результат за кожним розділом."],
  "Voorbeeld: de tekst en de punten zijn verzonnen.": ["Example: the text and the points are made up.", "مثال: النص والنقاط من تأليفنا.", "Örnek: metin ve puanlar uydurmadır.", "उदाहरण: पाठ और अंक काल्पनिक हैं।", "示例：文本和分数均为虚构。", "Ejemplo: el texto y los puntos son inventados.", "Пример: текст и баллы придуманы.", "Приклад: текст і бали вигадані."],
  "Wat kost het?": ["What does it cost?", "كم التكلفة؟", "Ücreti ne kadar?", "इसकी कीमत क्या है?", "费用是多少？", "¿Cuánto cuesta?", "Сколько это стоит?", "Скільки це коштує?"],
  "Veelgestelde vragen": ["Frequently asked questions", "أسئلة شائعة", "Sık sorulan sorular", "अक्सर पूछे जाने वाले सवाल", "常见问题", "Preguntas frecuentes", "Частые вопросы", "Часті запитання"],
  "Is Bittertalen van DUO?": ["Is Bittertalen made by DUO?", "هل Bittertalen تابع لـ DUO؟", "Bittertalen DUO’ya mı ait?", "क्या Bittertalen DUO का है?", "Bittertalen 是 DUO 的吗？", "¿Bittertalen es de DUO?", "Bittertalen — это DUO?", "Bittertalen — це DUO?"],
  "Nee. Bittertalen is een onafhankelijke oefenapp. De echte examens en de officiële oefenexamens vind je bij DUO en op inburgeren.nl.": ["No. Bittertalen is an independent practice app. You will find the real exams and the official practice exams at DUO and on inburgeren.nl.", "لا. Bittertalen تطبيق تدريب مستقل. تجد الامتحانات الحقيقية والامتحانات التجريبية الرسمية لدى DUO وعلى inburgeren.nl.", "Hayır. Bittertalen bağımsız bir alıştırma uygulamasıdır. Gerçek sınavları ve resmî deneme sınavlarını DUO’da ve inburgeren.nl’de bulursun.", "नहीं। Bittertalen एक स्वतंत्र अभ्यास ऐप है। असली परीक्षाएँ और आधिकारिक अभ्यास परीक्षाएँ DUO और inburgeren.nl पर मिलती हैं।", "不是。Bittertalen 是一个独立的练习应用。真正的考试和官方模拟考试请见 DUO 和 inburgeren.nl。", "No. Bittertalen es una app de práctica independiente. Los exámenes reales y los exámenes de práctica oficiales están en DUO y en inburgeren.nl.", "Нет. Bittertalen — независимое приложение для тренировки. Настоящие экзамены и официальные пробные экзамены — у DUO и на inburgeren.nl.", "Ні. Bittertalen — незалежний застосунок для тренування. Справжні іспити й офіційні пробні іспити — у DUO та на inburgeren.nl."],
  "Welk examen moet ik doen: A2 of B1?": ["Which exam do I need: A2 or B1?", "أي امتحان عليّ أن أقدّم: A2 أم B1؟", "Hangi sınava girmeliyim: A2 mi, B1 mi?", "मुझे कौन-सी परीक्षा देनी है: A2 या B1?", "我该考哪个：A2 还是 B1？", "¿Qué examen tengo que hacer: A2 o B1?", "Какой экзамен мне сдавать: A2 или B1?", "Який іспит мені складати: A2 чи B1?"],
  "Dat hangt af van je situatie, bijvoorbeeld welke inburgeringswet voor jou geldt. Kijk op inburgeren.nl of vraag het aan je gemeente. In Bittertalen kies je je niveau zelf, en je kunt het later veranderen.": ["That depends on your situation, for example which civic integration law applies to you. Check inburgeren.nl or ask your municipality. In Bittertalen you choose your level yourself, and you can change it later.", "يعتمد ذلك على وضعك، مثلًا أي قانون اندماج ينطبق عليك. راجع inburgeren.nl أو اسأل البلدية. في Bittertalen تختار مستواك بنفسك ويمكنك تغييره لاحقًا.", "Bu senin durumuna bağlı, örneğin sana hangi uyum yasasının uygulandığına. inburgeren.nl’ye bak ya da belediyene sor. Bittertalen’de seviyeni kendin seçersin ve sonra değiştirebilirsin.", "यह आपकी स्थिति पर निर्भर करता है, जैसे आप पर कौन-सा एकीकरण कानून लागू होता है। inburgeren.nl देखें या अपनी नगरपालिका से पूछें। Bittertalen में आप अपना स्तर खुद चुनते हैं और बाद में बदल सकते हैं।", "这取决于你的情况，例如适用于你的是哪一部融入法。请查看 inburgeren.nl 或询问你的市政府。在 Bittertalen 中你可以自己选择级别，之后也可以更改。", "Depende de tu situación, por ejemplo de qué ley de integración se te aplica. Consulta inburgeren.nl o pregunta en tu ayuntamiento. En Bittertalen eliges tu nivel y puedes cambiarlo más tarde.", "Это зависит от вашей ситуации, например от того, какой закон об интеграции к вам относится. Посмотрите на inburgeren.nl или спросите в муниципалитете. В Bittertalen вы сами выбираете уровень и можете потом его сменить.", "Це залежить від вашої ситуації, наприклад від того, який закон про інтеграцію стосується вас. Подивіться на inburgeren.nl або запитайте в муніципалітеті. У Bittertalen ви самі вибираєте рівень і можете потім його змінити."],
  "Wat is KNM?": ["What is KNM?", "ما هو KNM؟", "KNM nedir?", "KNM क्या है?", "什么是 KNM？", "¿Qué es KNM?", "Что такое KNM?", "Що таке KNM?"],
  "Kennis van de Nederlandse Maatschappij: vragen over werk, wonen, gezondheid, instanties, geschiedenis en hoe mensen in Nederland met elkaar omgaan. Je oefent de acht thema's van het examen, samen of één voor één.": ["Knowledge of Dutch Society: questions about work, housing, health, public bodies, history and how people in the Netherlands treat each other. You practise the eight themes of the exam, together or one at a time.", "المعرفة بالمجتمع الهولندي: أسئلة عن العمل والسكن والصحة والهيئات الرسمية والتاريخ وكيف يتعامل الناس بعضهم مع بعض في هولندا. تتدرّب على مواضيع الامتحان الثمانية معًا أو واحدًا تلو الآخر.", "Hollanda Toplumu Bilgisi: iş, konut, sağlık, kurumlar, tarih ve Hollanda’da insanların birbirleriyle nasıl davrandığı hakkında sorular. Sınavın sekiz konusunu birlikte ya da tek tek çalışırsın.", "डच समाज का ज्ञान: काम, आवास, स्वास्थ्य, संस्थाएँ, इतिहास और नीदरलैंड में लोग एक-दूसरे से कैसे पेश आते हैं, इन पर प्रश्न। आप परीक्षा के आठ विषयों का अभ्यास एक साथ या एक-एक करके करते हैं।", "荷兰社会知识：关于工作、住房、健康、政府机构、历史以及荷兰人如何相处的问题。你可以一起练习考试的八个主题，也可以逐个练习。", "Conocimiento de la sociedad neerlandesa: preguntas sobre trabajo, vivienda, salud, organismos públicos, historia y cómo se relaciona la gente en los Países Bajos. Practicas los ocho temas del examen, juntos o uno por uno.", "Знание нидерландского общества: вопросы о работе, жилье, здоровье, учреждениях, истории и о том, как люди в Нидерландах общаются друг с другом. Вы тренируете восемь тем экзамена — все вместе или по одной.", "Знання нідерландського суспільства: питання про роботу, житло, здоров'я, установи, історію та про те, як люди в Нідерландах спілкуються одне з одним. Ви тренуєте вісім тем іспиту — усі разом або по одній."],
  "Heb ik een account nodig?": ["Do I need an account?", "هل أحتاج إلى حساب؟", "Hesaba ihtiyacım var mı?", "क्या मुझे खाते की ज़रूरत है?", "我需要账号吗？", "¿Necesito una cuenta?", "Нужен ли мне аккаунт?", "Чи потрібен мені акаунт?"],
  "Nee, je kunt meteen beginnen. Met een gratis account bewaar je je voortgang op al je apparaten en laat je je teksten en gesproken antwoorden vaker nakijken.": ["No, you can start right away. With a free account you keep your progress on all your devices and get your writing and spoken answers checked more often.", "لا، يمكنك البدء فورًا. بحساب مجاني تحفظ تقدمك على كل أجهزتك ويُصحَّح ما تكتبه وإجاباتك الشفهية مرات أكثر.", "Hayır, hemen başlayabilirsin. Ücretsiz bir hesapla ilerlemen tüm cihazlarında saklanır ve yazıların ile sözlü yanıtların daha sık kontrol edilir.", "नहीं, आप तुरंत शुरू कर सकते हैं। मुफ़्त खाते से आपकी प्रगति आपके सभी डिवाइस पर रहती है और आपके लिखित व बोले गए जवाब ज़्यादा बार जाँचे जाते हैं।", "不需要，你可以马上开始。有了免费账号，你的进度会保存在所有设备上，写作和口语回答也能更常获得批改。", "No, puedes empezar enseguida. Con una cuenta gratuita guardas tu progreso en todos tus dispositivos y te revisan más a menudo tus textos y respuestas orales.", "Нет, можно начать сразу. С бесплатным аккаунтом прогресс сохраняется на всех ваших устройствах, а тексты и устные ответы можно проверять чаще.", "Ні, можна почати одразу. З безкоштовним акаунтом прогрес зберігається на всіх ваших пристроях, а тексти й усні відповіді можна перевіряти частіше."],
  "Werkt het zonder internet?": ["Does it work offline?", "هل يعمل دون إنترنت؟", "İnternetsiz çalışır mı?", "क्या यह इंटरनेट के बिना चलता है?", "没有网络能用吗？", "¿Funciona sin internet?", "Работает ли без интернета?", "Чи працює без інтернету?"],
  "Ja, de meeste oefeningen werken ook offline, bijvoorbeeld in de trein. Voor het nakijken door Bittertalen heb je internet nodig, en op sommige telefoons ook voor het herkennen van spraak.": ["Yes, most exercises also work offline, for example on the train. Checking by Bittertalen needs an internet connection, and on some phones so does speech recognition.", "نعم، تعمل معظم التمارين دون إنترنت أيضًا، مثلًا في القطار. يحتاج التصحيح بواسطة Bittertalen إلى الإنترنت، وكذلك التعرّف على الكلام في بعض الهواتف.", "Evet, çoğu alıştırma internetsiz de çalışır, örneğin trende. Bittertalen’un kontrolü için internet gerekir; bazı telefonlarda konuşma tanıma için de.", "हाँ, ज़्यादातर अभ्यास ऑफ़लाइन भी चलते हैं, जैसे ट्रेन में। Bittertalen से जाँच के लिए इंटरनेट चाहिए, और कुछ फ़ोन पर बोली पहचानने के लिए भी।", "可以，大多数练习离线也能用，比如在火车上。Bittertalen 批改需要联网，有些手机上的语音识别也需要联网。", "Sí, la mayoría de los ejercicios también funcionan sin conexión, por ejemplo en el tren. La revisión de Bittertalen necesita internet, y en algunos teléfonos también el reconocimiento de voz.", "Да, большинство упражнений работает и офлайн, например в поезде. Для проверки Bittertalen нужен интернет, а на некоторых телефонах — и для распознавания речи.", "Так, більшість вправ працює й офлайн, наприклад у потязі. Для перевірки Bittertalen потрібен інтернет, а на деяких телефонах — і для розпізнавання мовлення."],
  "Kan ik Bittertalen op mijn telefoon zetten?": ["Can I put Bittertalen on my phone?", "هل يمكنني وضع Bittertalen على هاتفي؟", "Bittertalen’i telefonuma ekleyebilir miyim?", "क्या मैं Bittertalen को अपने फ़ोन पर रख सकता हूँ?", "可以把 Bittertalen 放到手机上吗？", "¿Puedo poner Bittertalen en mi teléfono?", "Можно ли установить Bittertalen на телефон?", "Чи можна встановити Bittertalen на телефон?"],
  "Ja. Open Bittertalen in je browser en zet het op je beginscherm (op een iPhone in Safari: Deel, dan Zet op beginscherm). Dan opent het als een app.": ["Yes. Open Bittertalen in your browser and add it to your home screen (on an iPhone in Safari: Share, then Add to Home Screen). It then opens like an app.", "نعم. افتح Bittertalen في المتصفح وأضفه إلى الشاشة الرئيسية (في iPhone عبر Safari: مشاركة، ثم إضافة إلى الشاشة الرئيسية). عندها يفتح مثل تطبيق.", "Evet. Bittertalen’i tarayıcında aç ve ana ekranına ekle (iPhone’da Safari’de: Paylaş, sonra Ana Ekrana Ekle). Sonra bir uygulama gibi açılır.", "हाँ। Bittertalen को अपने ब्राउज़र में खोलें और होम स्क्रीन पर जोड़ें (iPhone पर Safari में: शेयर, फिर होम स्क्रीन में जोड़ें)। फिर यह ऐप की तरह खुलता है।", "可以。在浏览器中打开 Bittertalen，并添加到主屏幕（iPhone 的 Safari 中：分享，然后“添加到主屏幕”）。之后它会像应用一样打开。", "Sí. Abre Bittertalen en tu navegador y añádelo a la pantalla de inicio (en un iPhone con Safari: Compartir y luego Añadir a pantalla de inicio). Así se abre como una app.", "Да. Откройте Bittertalen в браузере и добавьте на экран «Домой» (на iPhone в Safari: «Поделиться», затем «На экран „Домой“»). Тогда он откроется как приложение.", "Так. Відкрийте Bittertalen у браузері й додайте на початковий екран (на iPhone у Safari: «Поділитися», потім «На початковий екран»). Тоді він відкриватиметься як застосунок."],
  "Betekent een goede score dat ik slaag?": ["Does a good score mean I will pass?", "هل تعني النتيجة الجيدة أنني سأنجح؟", "İyi bir puan sınavı geçeceğim anlamına mı gelir?", "क्या अच्छे स्कोर का मतलब है कि मैं पास हो जाऊँगा?", "分数高就代表能通过吗？", "¿Una buena puntuación significa que aprobaré?", "Хороший результат означает, что я сдам?", "Хороший результат означає, що я складу?"],
  "Nee. Je score laat zien hoeveel antwoorden goed waren bij het oefenen. Het echte examen kan anders zijn. Doe daarom ook de officiële oefenexamens van DUO.": ["No. Your score shows how many answers were right in practice. The real exam can be different, so also take DUO’s official practice exams.", "لا. تُظهر نتيجتك عدد الإجابات الصحيحة أثناء التدرّب. قد يكون الامتحان الحقيقي مختلفًا، لذلك قدّم أيضًا الامتحانات التجريبية الرسمية من DUO.", "Hayır. Puanın, alıştırmada kaç cevabın doğru olduğunu gösterir. Gerçek sınav farklı olabilir; bu yüzden DUO’nun resmî deneme sınavlarını da yap.", "नहीं। आपका स्कोर बताता है कि अभ्यास में कितने जवाब सही थे। असली परीक्षा अलग हो सकती है, इसलिए DUO की आधिकारिक अभ्यास परीक्षाएँ भी दें।", "不是。分数只表示练习中答对了多少。真正的考试可能不同，所以也请做 DUO 的官方模拟考试。", "No. Tu puntuación muestra cuántas respuestas fueron correctas al practicar. El examen real puede ser distinto, así que haz también los exámenes de práctica oficiales de DUO.", "Нет. Результат показывает, сколько ответов было верных на тренировке. Настоящий экзамен может отличаться, поэтому пройдите и официальные пробные экзамены DUO.", "Ні. Результат показує, скільки відповідей було правильних на тренуванні. Справжній іспит може відрізнятися, тому пройдіть і офіційні пробні іспити DUO."],
  "Je les van vandaag in Bittertalen, met de stappen van vandaag": ["Today’s lesson in Bittertalen, with today’s steps", "درس اليوم في Bittertalen مع خطوات اليوم", "Bittertalen’de bugünkü ders ve bugünün adımları", "Bittertalen में आज का पाठ, आज के चरणों के साथ", "Bittertalen 中的今日课程和今天的步骤", "La lección de hoy en Bittertalen, con los pasos de hoy", "Урок дня в Bittertalen с шагами на сегодня", "Урок дня в Bittertalen із кроками на сьогодні"],
  "Feedback op een geschreven tekst: punten per onderdeel en de fouten in de tekst": ["Feedback on a written text: points per criterion and the mistakes in the text", "تصحيح نص مكتوب: نقاط لكل معيار والأخطاء في النص", "Yazılı bir metne geri bildirim: ölçüt başına puan ve metindeki hatalar", "लिखे गए पाठ पर फ़ीडबैक: हर मानदंड के अंक और पाठ में गलतियाँ", "书面文本的反馈：各评分项的分数和文中的错误", "Comentarios sobre un texto escrito: puntos por criterio y los errores en el texto", "Разбор письменного текста: баллы по критериям и ошибки в тексте", "Розбір письмового тексту: бали за критеріями й помилки в тексті"],
  "Proefexamens per onderdeel met de laatste score": ["Mock exams per section with the latest score", "امتحانات تجريبية لكل قسم مع آخر نتيجة", "Bölüm başına deneme sınavları ve son puan", "हर भाग की अभ्यास परीक्षाएँ और आख़िरी स्कोर", "各部分的模拟考试及最近一次分数", "Simulacros por sección con la última puntuación", "Пробные экзамены по разделам с последним результатом", "Пробні іспити за розділами з останнім результатом"],
  "Hoi! Ik ben Bittie.": ["Hi! I’m Bittie.", "مرحبًا! أنا بيتي.", "Merhaba! Ben Bittie.", "नमस्ते! मैं बिट्टी हूँ।", "你好！我是 Bittie。", "¡Hola! Soy Bittie.", "Привет! Я Битти.", "Привіт! Я Бітті."],
  "Zullen we samen Nederlands oefenen?": ["Shall we practise Dutch together?", "هل نتدرّب على الهولندية معًا؟", "Birlikte Flemenkçe çalışalım mı?", "क्या हम साथ में डच का अभ्यास करें?", "我们一起练习荷兰语吧？", "¿Practicamos neerlandés juntos?", "Давайте вместе потренируем нидерландский?", "Потренуймо нідерландську разом?"],
  "Vraag 1": ["Question 1", "السؤال 1", "Soru 1", "प्रश्न 1", "第 1 题", "Pregunta 1", "Вопрос 1", "Питання 1"],
  "Vraag 2": ["Question 2", "السؤال 2", "Soru 2", "प्रश्न 2", "第 2 题", "Pregunta 2", "Вопрос 2", "Питання 2"],
  "Vraag 3": ["Question 3", "السؤال 3", "Soru 3", "प्रश्न 3", "第 3 题", "Pregunta 3", "Вопрос 3", "Питання 3"],
  "Vraag 4": ["Question 4", "السؤال 4", "Soru 4", "प्रश्न 4", "第 4 题", "Pregunta 4", "Вопрос 4", "Питання 4"],
  "Tik op een woord en je ziet wat het betekent in het Engels. Lees onze verhalen of je eigen e-book.": ["Tap a word to see what it means in English. Read our stories or your own e-book.", "اضغط على كلمة لترى معناها بالإنجليزية. اقرأ قصصنا أو كتابك الإلكتروني.", "Bir kelimeye dokun, İngilizce anlamını gör. Hikâyelerimizi ya da kendi e-kitabını oku.", "किसी शब्द पर टैप करें और उसका अंग्रेज़ी अर्थ देखें। हमारी कहानियाँ या अपनी ई-बुक पढ़ें।", "点一下单词，就能看到它的英文意思。可以读我们的故事，也可以读你自己的电子书。", "Toca una palabra y verás qué significa en inglés. Lee nuestros relatos o tu propio libro electrónico.", "Нажмите на слово и увидите его значение на английском. Читайте наши рассказы или свою электронную книгу.", "Натисніть на слово й побачите його значення англійською. Читайте наші оповідання або свою електронну книжку."],
  "Naar de boeken": ["Go to the books", "إلى الكتب", "Kitaplara git", "किताबें देखें", "去看书", "Ir a los libros", "К книгам", "До книжок"],
  "Geschiedenis en kunst": ["History and art", "التاريخ والفن", "Tarih ve sanat", "इतिहास और कला", "历史与艺术", "Historia y arte", "История и искусство", "Історія та мистецтво"],
  "Van de hunebedden tot nu, in korte hoofdstukken. En elke dag een schilderij met het verhaal erachter.": ["From the prehistoric hunebeds to today, in short chapters. And every day a painting with the story behind it.", "من مدافن الهونبيد في عصور ما قبل التاريخ حتى اليوم، في فصول قصيرة. وكل يوم لوحة وقصتها.", "Tarih öncesi hunebed mezarlarından bugüne, kısa bölümlerle. Ve her gün bir tablo ve arkasındaki hikâye.", "प्रागैतिहासिक हुनेबेड समाधियों से आज तक, छोटे अध्यायों में। और हर दिन एक चित्र और उसकी कहानी।", "从史前巨石墓到今天，分成短小的章节。每天还有一幅画和画背后的故事。", "De los dólmenes prehistóricos hasta hoy, en capítulos cortos. Y cada día un cuadro con su historia.", "От древних дольменов до наших дней, короткими главами. И каждый день картина с её историей.", "Від давніх дольменів до наших днів, короткими розділами. І щодня картина з її історією."],
  "Naar de geschiedenis": ["Go to the history", "إلى التاريخ", "Tarihe git", "इतिहास देखें", "去看历史", "Ir a la historia", "К истории", "До історії"],
  "Video’s, podcasts en nieuws": ["Videos, podcasts and news", "فيديوهات وبودكاست وأخبار", "Videolar, podcast’ler ve haberler", "वीडियो, पॉडकास्ट और समाचार", "视频、播客与新闻", "Vídeos, pódcasts y noticias", "Видео, подкасты и новости", "Відео, подкасти й новини"],
  "Kijk video’s met Nederlandse ondertitels, volg het nieuws (NOS, Jeugdjournaal) en luister naar podcasts. Van makkelijk tot moeilijk.": ["Watch videos with Dutch subtitles, follow the news (NOS, Jeugdjournaal) and listen to podcasts. From easy to difficult.", "شاهد فيديوهات بترجمة هولندية مكتوبة، وتابع الأخبار (NOS وJeugdjournaal) واستمع إلى البودكاست. من السهل إلى الصعب.", "Flemenkçe altyazılı videolar izle, haberleri takip et (NOS, Jeugdjournaal) ve podcast dinle. Kolaydan zora.", "डच सबटाइटल वाले वीडियो देखें, समाचार (NOS, Jeugdjournaal) देखें और पॉडकास्ट सुनें। आसान से कठिन तक।", "观看带荷兰语字幕的视频，看新闻（NOS、Jeugdjournaal），听播客。由易到难。", "Mira vídeos con subtítulos en neerlandés, sigue las noticias (NOS, Jeugdjournaal) y escucha pódcasts. De fácil a difícil.", "Смотрите видео с нидерландскими субтитрами, следите за новостями (NOS, Jeugdjournaal) и слушайте подкасты. От простого к сложному.", "Дивіться відео з нідерландськими субтитрами, стежте за новинами (NOS, Jeugdjournaal) і слухайте подкасти. Від простого до складного."],
  "Kijk en luister": ["Watch and listen", "شاهد واستمع", "İzle ve dinle", "देखें और सुनें", "去看去听", "Mira y escucha", "Смотреть и слушать", "Дивитися й слухати"],
  "Begin een gesprek": ["Start a conversation", "ابدأ محادثة", "Konuşmaya başla", "बातचीत शुरू करें", "开始对话", "Empezar una conversación", "Начать разговор", "Почати розмову"],
  "Vraag 5": ["Question 5", "السؤال 5", "Soru 5", "प्रश्न 5", "第 5 题", "Pregunta 5", "Вопрос 5", "Питання 5"],
  "Probeer het zelf": ["Try it yourself", "جرّب بنفسك", "Kendin dene", "खुद आज़माएँ", "自己试试", "Pruébalo tú", "Попробуйте сами", "Спробуйте самі"],
  "Een echte KNM-vraag, zoals in de app. Kies een antwoord.": ["A real KNM question, as in the app. Choose an answer.", "سؤال KNM حقيقي كما في التطبيق. اختر إجابة.", "Uygulamadaki gibi gerçek bir KNM sorusu. Bir cevap seç.", "ऐप जैसा एक असली KNM प्रश्न। एक उत्तर चुनें।", "一道真实的 KNM 题，和应用里一样。选一个答案。", "Una pregunta real de KNM, como en la app. Elige una respuesta.", "Настоящий вопрос KNM, как в приложении. Выберите ответ.", "Справжнє питання KNM, як у застосунку. Виберіть відповідь."],
  "Zo wordt je tekst nagekeken": ["How your writing is checked", "هكذا يصحّح Bittertalen نصك", "Bittertalen metnini böyle kontrol eder", "Bittertalen आपके लेखन को ऐसे जाँचता है", "Bittertalen 这样批改你的文章", "Así revisa Bittertalen tu texto", "Так Bittertalen проверяет ваш текст", "Так Bittertalen перевіряє ваш текст"],
  "Contact": ["Contact", "التواصل", "İletişim", "संपर्क", "联系我们", "Contacto", "Контакты", "Контакти"],
  "Uitgebreide feedback van een sterker AI-model, ook op je proefexamens.": ["Detailed feedback from a stronger AI model, also on your practice exams.", "ملاحظات مفصّلة من نموذج ذكاء اصطناعي أقوى، وأيضًا على امتحاناتك التجريبية.", "Daha güçlü bir yapay zekâ modelinden ayrıntılı geri bildirim, deneme sınavlarında da.", "ज़्यादा सशक्त AI मॉडल से विस्तृत फ़ीडबैक, अभ्यास परीक्षाओं पर भी।", "由更强的 AI 模型给出详细反馈，模拟考试也一样。", "Comentarios detallados de un modelo de IA más potente, también en tus exámenes de práctica.", "Подробный разбор от более сильной модели ИИ, в том числе пробных экзаменов.", "Детальний розбір від потужнішої моделі ШІ, зокрема пробних іспитів."],
  "Ook Schrijven en Spreken B1, met A2 erbij.": ["Also Writing and Speaking B1, with A2 included.", "يشمل أيضًا الكتابة والتحدث لمستوى B1، مع A2.", "B1 Yazma ve Konuşma da dahil, A2 ile birlikte.", "B1 लेखन और बोलना भी, A2 के साथ।", "还包括 B1 写作和口语，并含 A2。", "También Escritura y Expresión oral B1, con A2 incluido.", "Также письмо и устная речь B1, A2 включён.", "Також письмо й усне мовлення B1, A2 включено."],
  "Tot 200 nakijkbeurten per maand voor je teksten en gesproken antwoorden": ["Up to 200 checks a month for your writing and spoken answers", "حتى 200 تصحيح شهريًا لنصوصك وإجاباتك الشفهية", "Yazıların ve sözlü yanıtların için ayda 200'e kadar kontrol", "आपके लेखन और बोले गए जवाबों के लिए महीने में 200 तक जाँचें", "每月最多 200 次批改，用于你的写作和口语回答", "Hasta 200 revisiones al mes para tus textos y respuestas orales", "До 200 проверок в месяц для ваших текстов и устных ответов", "До 200 перевірок на місяць для ваших текстів і усних відповідей"],
  "per maand": ["per month", "شهريًا", "aylık", "प्रति माह", "每月", "al mes", "в месяц", "на місяць"],
  "17 weken geldig vanaf je betaling": ["Valid for 17 weeks from payment", "صالح لمدة 17 أسبوعًا من الدفع", "Ödemeden itibaren 17 hafta geçerli", "भुगतान से 17 हफ़्ते तक मान्य", "自付款起 17 周内有效", "Válido 17 semanas desde el pago", "Действует 17 недель с момента оплаты", "Діє 17 тижнів від моменту оплати"],
  "Niet tevreden? Binnen 14 dagen na je eerste betaling krijg je je geld terug.": ["Not satisfied? Get your money back within 14 days of your first payment.", "غير راضٍ؟ استرد مالك خلال 14 يومًا من أول دفعة.", "Memnun değil misin? İlk ödemenden sonraki 14 gün içinde paranı geri al.", "संतुष्ट नहीं? पहले भुगतान के 14 दिनों के भीतर पैसे वापस पाएँ।", "不满意？首次付款后 14 天内可退款。", "¿No estás satisfecho? Te devolvemos el dinero en los 14 días siguientes a tu primer pago.", "Не понравилось? Вернём деньги в течение 14 дней после первой оплаты.", "Не сподобалося? Повернемо гроші протягом 14 днів після першої оплати."],
  "Kies Plus A2": ["Choose Plus A2", "اختر Plus A2", "Plus A2 seç", "Plus A2 चुनें", "选择 Plus A2", "Elegir Plus A2", "Выбрать Plus A2", "Вибрати Plus A2"],
  "Examenpas": ["Exam pass", "تصريح الامتحان", "Sınav kartı", "परीक्षा पास", "考试通行证", "Pase de examen", "Экзаменационный пропуск", "Екзаменаційна перепустка"],
  "Eén keer betalen, geen abonnement.": ["Pay once, no subscription.", "ادفع مرة واحدة، دون اشتراك.", "Bir kez öde, abonelik yok.", "एक बार भुगतान करें, कोई सदस्यता नहीं।", "一次付款，无需订阅。", "Pagas una vez, sin suscripción.", "Одна оплата, без подписки.", "Одна оплата, без підписки."],
  "A2 of B1, met dezelfde nakijkbeurten als Plus.": ["A2 or B1, with the same checks as Plus.", "A2 أو B1، مع التصحيحات نفسها كما في Plus.", "A2 veya B1, Plus ile aynı kontrollerle.", "A2 या B1, Plus जैसी ही जाँचों के साथ।", "A2 或 B1，批改次数与 Plus 相同。", "A2 o B1, con las mismas revisiones que Plus.", "A2 или B1, с теми же проверками, что и в Plus.", "A2 або B1, з тими самими перевірками, що й у Plus."],
  "Kies de Examenpas": ["Choose the exam pass", "اختر تصريح الامتحان", "Sınav kartını seç", "परीक्षा पास चुनें", "选择考试通行证", "Elegir el pase de examen", "Выбрать пропуск", "Вибрати перепустку"],
  "Zo kijkt Bittertalen na →": ["How Bittertalen checks your work →", "كيف يصحّح Bittertalen ←", "Bittertalen nasıl kontrol eder →", "Bittertalen कैसे जाँचता है →", "Bittertalen 如何批改 →", "Cómo revisa Bittertalen →", "Как Bittertalen проверяет ответы →", "Як Bittertalen перевіряє відповіді →"],
  "Kies Plus B1": ["Choose Plus B1", "اختر Plus B1", "Plus B1 seç", "Plus B1 चुनें", "选择 Plus B1", "Elegir Plus B1", "Выбрать Plus B1", "Вибрати Plus B1"],
  "Oefen met Schrijven A2": ["Practise A2 writing", "تدرّب على الكتابة A2", "A2 yazma çalış", "A2 लेखन का अभ्यास करें", "练习 A2 写作", "Practica la escritura A2", "Потренировать письмо A2", "Попрактикуйтеся у письмі A2"],
};

const pricing = {
  nl: ["per maand", n => `Met een gratis account: ${n} gratis nakijkbeurten (eenmalig)`, n => `Tot ${n} nakijkbeurten per maand voor je teksten en gesproken antwoorden`],
  en: ["per month", n => `With a free account: ${n} free checks (one time)`, n => `Up to ${n} checks a month for your writing and spoken answers`],
  ar: ["شهريًا", n => `بحساب مجاني: ${n} تصحيحات مجانية`, n => `حتى ${n} تصحيح شهريًا لنصوصك وإجاباتك الشفهية`],
  tr: ["aylık", n => `Ücretsiz hesapla ${n} ücretsiz kontrol`, n => `Yazıların ve sözlü yanıtların için ayda ${n}'e kadar kontrol`],
  hi: ["प्रति माह", n => `मुफ़्त खाते से ${n} मुफ़्त जाँचें`, n => `आपके लेखन और बोले गए जवाबों के लिए महीने में ${n} तक जाँचें`],
  zh: ["每月", n => `免费账号：${n} 次免费批改`, n => `每月最多 ${n} 次批改，用于你的写作和口语回答`],
  es: ["al mes", n => `Revisiones gratis con una cuenta gratuita: ${n}`, n => `Hasta ${n} revisiones al mes para tus textos y respuestas orales`],
  ru: ["в месяц", n => `Бесплатных проверок с бесплатным аккаунтом: ${n}`, n => `До ${n} проверок в месяц для ваших текстов и устных ответов`],
  uk: ["на місяць", n => `Безкоштовних перевірок із безкоштовним акаунтом: ${n}`, n => `До ${n} перевірок на місяць для ваших текстів і усних відповідей`],
};
// The Examenpas card: how long one payment lasts
const dailyCopy = {
  nl:n=>`tot ${n} per dag`, en:n=>`up to ${n} a day`, ar:n=>`حتى ${n} يوميًا`, tr:n=>`günde en fazla ${n}`,
  hi:n=>`रोज़ अधिकतम ${n}`, zh:n=>`每天最多 ${n} 次`, es:n=>`hasta ${n} al día`, ru:n=>`до ${n} в день`, uk:n=>`до ${n} на день`
};
const totalCopy = {
  nl:n=>`${n} nakijkbeurten voor de hele periode`, en:n=>`${n} checks for the whole period`, ar:n=>`${n} تصحيح للفترة كلها`,
  tr:n=>`Tüm dönem için ${n} kontrol`, hi:n=>`पूरी अवधि के लिए ${n} जाँचें`, zh:n=>`整个有效期共 ${n} 次批改`,
  es:n=>`${n} revisiones para todo el periodo`, ru:n=>`${n} проверок на весь срок`, uk:n=>`${n} перевірок на весь період`
};
const passWeeks = {
  nl: n => `${n} weken geldig vanaf je betaling`, en: n => `Valid for ${n} weeks from payment`,
  ar: n => `صالح لمدة ${n} أسابيع من الدفع`, tr: n => `Ödemeden itibaren ${n} hafta geçerli`,
  hi: n => `भुगतान से ${n} हफ़्ते तक मान्य`, zh: n => `自付款起 ${n} 周内有效`,
  es: n => `Válido ${n} semanas desde el pago`, ru: n => `Действует ${n} недель с момента оплаты`,
  uk: n => `Діє ${n} тижнів від моменту оплати`,
};
const select = document.querySelector("#language");
const trialCopy = {
  nl: n => `${n} eenmalige proefbeurten zonder account in deze browser`,
  en: n => `${n} one-time trial checks without an account in this browser`,
  ar: n => `${n} تصحيحات تجريبية لمرة واحدة بدون حساب في هذا المتصفح`,
  tr: n => `Bu tarayıcıda hesap açmadan bir defaya mahsus ${n} deneme kontrolü`,
  hi: n => `इस ब्राउज़र में बिना खाते के एक बार मिलने वाली ${n} परीक्षण जाँचें`,
  zh: n => `无需账号，在此浏览器一次性体验 ${n} 次批改`,
  es: n => `${n} revisiones de prueba por única vez sin cuenta en este navegador`,
  ru: n => `${n} пробные проверки однократно без аккаунта в этом браузере`,
  uk: n => `${n} пробні перевірки одноразово без акаунта в цьому браузері`,
};
// Under the writing example (Vraag 5): the check itself can be tried for free, with the real numbers from /api/config
const tryCopy = {
  nl: (n, w) => `Probeer het zelf: ${n} teksten of antwoorden gratis nagekeken, zonder account. Daarna nog ${w} gratis met een gratis account.`,
  en: (n, w) => `Try it yourself: ${n} texts or answers checked for free, no account needed. Then ${w} more free with a free account.`,
  ar: (n, w) => `جرّب بنفسك: تصحيح ${n} نصوص أو إجابات مجانًا دون حساب. ثم ${w} أخرى مجانًا بحساب مجاني.`,
  tr: (n, w) => `Kendin dene: hesap açmadan ${n} metin veya yanıt ücretsiz kontrol edilir. Sonra ücretsiz hesapla ${w} ücretsiz kontrol daha.`,
  hi: (n, w) => `ख़ुद आज़माएँ: बिना खाते के ${n} लेख या जवाब मुफ़्त जाँचे जाते हैं। फिर मुफ़्त खाते से ${w} और मुफ़्त जाँचें।`,
  zh: (n, w) => `亲自试试：无需账号，免费批改 ${n} 篇文字或回答。之后用免费账号再免费批改 ${w} 次。`,
  es: (n, w) => `Pruébalo: ${n} textos o respuestas revisados gratis, sin cuenta. Después, ${w} más gratis con una cuenta gratuita.`,
  ru: (n, w) => `Попробуйте сами: ${n} текста или ответа проверяются бесплатно, без аккаунта. Потом ещё ${w} бесплатно с бесплатным аккаунтом.`,
  uk: (n, w) => `Спробуйте самі: ${n} тексти або відповіді перевіряються безкоштовно, без акаунта. Потім ще ${w} безкоштовно з безкоштовним акаунтом.`,
};
// a translated page keeps the Dutch original in data-t="…"
const nodes = [...document.querySelectorAll("[data-t]")].map(node => [node, node.dataset.t || node.textContent]);
const alts = [...document.querySelectorAll("[data-alt]")].map(node => [node, node.dataset.alt]);
const $ = id => document.getElementById(id);
let config; // undefined while loading, null when the request failed
// /en, /ru, … (tools/build-lang.mjs) are the homepage already translated, for search engines: their language wins
// and is kept for the app; "/" still shows the language chosen before.
const page = document.documentElement.dataset.page;
let lang = "nl";
if (page && Object.hasOwn(pricing, page)) {
  lang = page;
  try { localStorage.setItem("ww-ui", lang); } catch {}
} else {
  try { lang = localStorage.getItem("ww-ui") || "nl"; } catch {}
}
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
  // The cards are in the HTML with the current prices (so search engines and a slow connection see them); they are hidden
// only when the server says Plus is off, never just because /api/config failed
  const active = config ? Boolean(plus?.price && plus?.limit) : true;
  $("free-checks").hidden = !config?.limit;
  if (config?.limit) $("free-checks").textContent = free(config.limit);
  $("trial-checks").hidden = !config?.free;
  if (config?.free) $("trial-checks").textContent = trialCopy[lang](config.free);
  $("try-free").hidden = !(config?.free && config?.limit);
  if (config?.free && config?.limit) $("try-free").textContent = tryCopy[lang](config.free, config.limit);
  const allowance = plus?.month && plus?.limit ? `${checks(plus.month)} · ${dailyCopy[lang](plus.limit)}` : "";
  const pass = config?.pass;
  $("pass-total").hidden = !pass?.total;
  if (pass?.total && plus?.limit) $("pass-total").textContent = `${totalCopy[lang](pass.total)} · ${dailyCopy[lang](plus.limit)}`;
  const yearTotal = config?.year?.total;
  $("year-checks").hidden = !yearTotal;
  if (yearTotal && plus?.limit) $("year-checks").textContent = `${totalCopy[lang](yearTotal)} · ${dailyCopy[lang](plus.limit)}`;
  $("pass-card").hidden = config ? !(active && pass?.plans?.A2 && pass?.plans?.B1) : false;
  if (pass?.plans?.A2 && pass?.plans?.B1) {
    const eur = p => `€ ${lang === "en" ? String(p).replace(",", ".") : p}`;
    const row = level => { const b = document.createElement("bdi"), sm = document.createElement("small"); b.textContent = eur(pass.plans[level].price); sm.textContent = level; return [b, " ", sm]; };
    $("pass-price").replaceChildren(...row("A2"), document.createElement("br"), ...row("B1"));
    $("pass-weeks").textContent = passWeeks[lang](Math.round((pass.days || 119) / 7));
  }
  // the Jaarpas, the same way (a year of Plus, one payment)
  const year = config?.year;
  $("year-card").hidden = config ? !(active && year?.plans?.A2 && year?.plans?.B1) : false;
  if (year?.plans?.A2 && year?.plans?.B1) {
    const eur = p => `€ ${lang === "en" ? String(p).replace(",", ".") : p}`;
    const row = level => { const b = document.createElement("bdi"), sm = document.createElement("small"); b.textContent = eur(year.plans[level].price); sm.textContent = level; return [b, " ", sm]; };
    $("year-price").replaceChildren(...row("A2"), document.createElement("br"), ...row("B1"));
  }
  for (const [level, card, price, check] of [["A2", "plus-card", "plus-price", "plus-checks"], ["B1", "plus-b1-card", "plus-b1-price", "plus-b1-checks"]]) {
    const offer = plus?.plans?.[level] || (level === "A2" ? plus : null);
    if (!config) continue; // keep the prices from the HTML
    $(card).hidden = !active || !offer?.price;
    if (!active || !offer?.price) continue;
    const amount = document.createElement("bdi");
    amount.textContent = `€ ${lang === "en" ? String(offer.price).replace(",", ".") : offer.price}`;
    const period = document.createElement("small");
    period.textContent = month;
    $(price).replaceChildren(amount, " ", period);
    if (allowance) $(check).textContent = allowance;
  }
}
select.addEventListener("change", () => {
  lang = select.value;
  try { lang === "nl" ? localStorage.removeItem("ww-ui") : localStorage.setItem("ww-ui", lang); } catch {}
  // every language has its own address (/, /en, /ru, …), so a shared or found link opens in that language
  const to = lang === "nl" ? "/" : "/" + lang;
  if (location.pathname !== to) { location.assign(to + location.search + location.hash); return; }
  render();
});
render();

// On "/" with no language chosen yet, a phone set to Arabic, Turkish, … gets one line in its own language that leads to
// that page. English is left out on purpose: many Dutch phones are set to English. Never switches by itself (search
// engines and Dutch readers keep the Dutch page); "×" remembers Dutch.
{
  const HINT = { ar: ["اقرأ هذه الصفحة بالعربية", "عربي"], tr: ["Bu sayfayı Türkçe oku", "Türkçe"], hi: ["यह पेज हिंदी में पढ़ें", "हिंदी"], zh: ["用中文阅读本页", "中文"], es: ["Lee esta página en español", "Español"], ru: ["Читать эту страницу по-русски", "Русский"] , uk: ["Читати цю сторінку українською", "Українська"] };
  let chosen = null;
  try { chosen = localStorage.getItem("ww-ui") || localStorage.getItem("ww-ui-nl"); } catch {}
  const want = !page && !chosen && [...(navigator.languages || [navigator.language || ""])].map(l => String(l).slice(0, 2).toLowerCase()).find(l => l === "nl" || Object.hasOwn(HINT, l));
  if (want && want !== "nl") {
    const bar = document.createElement("div"), a = document.createElement("a"), x = document.createElement("button");
    bar.className = "lang-hint"; bar.lang = want === "zh" ? "zh-Hans" : want; bar.dir = want === "ar" ? "rtl" : "ltr";
    a.href = "/" + want + location.search; a.textContent = HINT[want][0];
    x.type = "button"; x.textContent = "×"; x.setAttribute("aria-label", "Nederlands");
    x.onclick = () => { try { localStorage.setItem("ww-ui-nl", "1"); } catch {} bar.remove(); };
    bar.append(a, x);
    document.body.prepend(bar);
  }
}

fetch("/api/config?v=once1").then(r => {
  if (!r.ok) throw new Error("Config unavailable");
  return r.json();
}).then(value => { config = value; }, () => { config = null; }).then(render).then(homeDay);

// Anonymous usage counts (api/event.js), as in the app: only "one more today" per event and menu language, no id, cookie,
// account or IP address; only when the server offers it, never with Global Privacy Control or Do Not Track
const trackOn = () => !!(config && config.events) && !navigator.globalPrivacyControl && navigator.doNotTrack !== "1";
function track(ev) {
  try { if (window.plausible) plausible(ev, { props: { lang: localStorage.getItem("ww-ui") || "nl", app: "web" } }); } catch {}
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

// The example questions in the exam card (Lezen, Luisteren, KNM): real questions, marked like in the app (the box turns
// green or red); data-why on the quiz holds the explanation. The questions and their feedback stay Dutch, as all exercises do.
document.querySelectorAll(".quiz").forEach(quiz => {
  const fb = quiz.querySelector(".qfb"), more = quiz.parentElement.querySelector(".qmore");
  const right = quiz.querySelector('[data-ok="1"]');
  quiz.querySelectorAll(".choice").forEach(b => b.addEventListener("click", () => {
    if (quiz.classList.contains("done")) return;
    quiz.classList.add("done");
    track("quiz");
    const ok = b === right, esc = t => t.replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"})[c]);
    b.classList.add(ok ? "ok" : "no");
    right.classList.add("ok");
    quiz.querySelectorAll(".choice").forEach(x => x.disabled = true);
    const why = esc(quiz.dataset.why || ""), goed = esc(right.querySelector(".tx").textContent.trim());
    fb.innerHTML = ok ? `<b class="good">Goed zo!</b> ${why}` : `<b class="bad">Niet goed.</b> Goed is: <b>${goed.charAt(0).toLowerCase() + goed.slice(1)}</b>. ${why}`;
    fb.hidden = false; if (more) more.hidden = false;
  }));
});

// Keep a user gesture for the browser's native installation prompt. Other browsers use the visible instructions.
{
  const button = $("download-app");
  let installPrompt = null;
  const installed = () => navigator.standalone || matchMedia("(display-mode: standalone)").matches ||
    /[?&]native=1(?:&|$)/.test(location.search) || window.Capacitor?.isNativePlatform?.();
  const update = () => {
    button.hidden = !!installed();
  };
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    button.hidden = true;
  });
  const dialog = $("install-app");
  const instructions = () => { if (dialog?.showModal && !dialog.open) dialog.showModal(); };
  button.addEventListener("click", async event => {
    event.preventDefault();
    if (!installPrompt) { instructions(); return; }
    const prompt = installPrompt;
    installPrompt = null;
    try { await prompt.prompt(); await prompt.userChoice; }
    catch { instructions(); }
  });
  matchMedia("(display-mode: standalone)").addEventListener("change", update);
  update();
  if ("serviceWorker" in navigator && !window.Capacitor?.isNativePlatform?.()) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

function initProducts(section) {
  const stage = section.querySelector(".product-stage");
  const cards = [...stage.children];
  const controls = section.querySelector(".product-controls");
  const next = controls.querySelector("[data-product-step=\"1\"]");
  const title = i => cards[i].querySelector("h3").textContent.trim();
  const status = section.querySelector("[role=status]");
  const details = section.querySelector(".product-details");
  const panels = [...details.children];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let expanded = -1;
  let expansion;
  for (const [i, panel] of panels.entries()) {
    panel.hidden = true;
    cards[i].querySelector("h3 a").setAttribute("aria-expanded", "false");
    cards[i].querySelector("h3 a").setAttribute("aria-controls", panel.id);
  }

  function reveal(index, animate = true) {
    if (expanded === index) return;
    const from = details.getBoundingClientRect().height;
    expansion?.cancel();
    if (panels[expanded]?.contains(document.activeElement)) next.focus({preventScroll:true});
    expanded = index;
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
      cards[i].querySelector("h3 a").setAttribute("aria-expanded", String(i === index));
    });
    if (animate && !reduced.matches && details.animate) {
      expansion = details.animate(
        [{height:from + "px", overflow:"clip"}, {height:details.scrollHeight + "px", overflow:"clip"}],
        {duration:330, easing:"cubic-bezier(.25,.7,.25,1)"}
      );
    }
  }
  let active = 0;
  let gesture;
  let swiped = false;

  function show(index, announce = true) {
    const center = (index + cards.length) % cards.length;
    if (center !== active && cards[active].contains(document.activeElement)) {
      next.focus({preventScroll:true});
    }
    active = center;
    cards.forEach((card, i) => {
      const distance = (i - active + cards.length) % cards.length;
      card.dataset.position = distance === cards.length - 1 ? "left" : (["center", "right"][distance] || "away");
      card.querySelector(".product-copy").inert = i !== active;
      card.setAttribute("aria-hidden", String(i !== active));
    });
    reveal(active, announce);
    if (announce) status.textContent = title(active);
  }

  controls.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    show(active + Number(button.dataset.productStep));
  });
  section.addEventListener("keydown", event => {
    if (details.contains(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    show(active + (event.key === "ArrowLeft" ? -1 : 1));
  });
  stage.addEventListener("dragstart", event => event.preventDefault());
  stage.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    swiped = false;
    gesture = {id:event.pointerId, x:event.clientX, y:event.clientY};
  });
  stage.addEventListener("pointerup", event => {
    if (gesture?.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = null;
    swiped = Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) * 1.25;
    if (swiped) show(active + (dx < 0 ? 1 : -1));
  });
  stage.addEventListener("pointercancel", () => { gesture = null; });
  stage.addEventListener("click", event => {
    if (swiped && event.detail) {
      event.preventDefault();
      swiped = false;
      return;
    }

    const card = event.target.closest(".product-card");
    if (!card || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const wasActive = cards[active] === card;
    show(cards.indexOf(card));
    if (wasActive) {
      location.hash = panels[active].id;
    }
  });

  controls.hidden = false;
  show(0, false);
  section.classList.add("products-ready");

  const word = section.querySelector("[data-book-word]");
  const definition = $("book-word");
  definition.hidden = true;
  word.setAttribute("aria-expanded", "false");
  word.disabled = false;
  word.addEventListener("click", () => {
    definition.hidden = !definition.hidden;
    word.setAttribute("aria-expanded", String(!definition.hidden));
  });

  function revealAnchor(hash) {
    if (!hash) return;
    const target = $(hash.slice(1));
    const index = panels.findIndex(panel => target && panel.contains(target));
    if (index < 0) return;
    show(index, false);
    const topic = target.closest(".product-exam-topic");
    if (topic) topic.open = true;
    return target;
  }
  function openHash() {
    const target = revealAnchor(location.hash);
    if (target) requestAnimationFrame(() => target.scrollIntoView({block:"start"}));
  }
  openHash();
  window.addEventListener("hashchange", openHash);
}
const productSection = $("ontdek");
if (productSection) initProducts(productSection);
