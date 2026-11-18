// i18n-strings.mjs — string tables for the /fr/ /it/ /id/ landing pages (tools/build-i18n.mjs).
// Pure data, no side effects: tools/build-names.mjs imports I18N_LANGS from here for the sitemap.
//
// Policy (2026-11-18): one hand-written landing page per language — NOT translated name pages.
// D-56: locale name pages (LOCALE_NAME_STRINGS at the end) are not translations of /names/ —
// they carry the local reading (Lorenzo → ロレンツォ) and are built from tools/locales/*.json.
// Each string was written natively, not word-for-word. Values are trusted HTML (<b>, <i>, <a>).
// Function values receive the example data computed by build-i18n.mjs:
//   { name, kata, hira, romaji, kanji, mean }   (mean = English meanings, already escaped)

export const I18N_LANGS = ["fr", "it", "id"];

// Labels for the language switcher (shown in every language's own name).
export const LANG_LABELS = { en: "English", fr: "Français", it: "Italiano", id: "Bahasa Indonesia" };

export const STRINGS = {
  fr: {
    htmlLang: "fr",
    ogLocale: "fr_FR",
    title: "Votre prénom en japonais : katakana et kanji | Kanji My Name",
    description:
      "Comment s'écrit votre prénom en japonais ? En katakana, comme les prénoms étrangers. Voyez aussi le hiragana et créez gratuitement vos kanji (ateji).",
    ogTitle: "Votre prénom en japonais : katakana, hiragana et kanji",
    h1: "Votre prénom en japonais",
    lead:
      "Au Japon, un prénom comme le vôtre s'écrit généralement en <b>katakana</b>. Il existe aussi une voie plus artistique : choisir des <b>kanji</b> pour leur son et pour leur sens. Voici les trois écritures, expliquées simplement ; essayez ensuite avec votre propre prénom.",
    formLabel: "Votre prénom (en lettres latines)",
    placeholder: "ex. : Chloé",
    button: "Voir mon prénom en japonais",
    formNote:
      "Le bouton ouvre notre générateur. Il est <b>en anglais</b> et <b>gratuit</b>, et votre prénom ne quitte pas votre navigateur. Une offre Premium payante existe, mais elle est facultative.",
    example: "chloe:Chloé",
    scriptsH2: (d) => `Trois façons d'écrire ${d.name} en japonais`,
    kataWhy:
      "C'est l'écriture qu'on utilise normalement au Japon pour les prénoms et les mots venus de l'étranger. Au quotidien, c'est ainsi que votre prénom serait écrit.",
    hiraWhy:
      "Le hiragana sert aux mots japonais et à la grammaire : on ne l'emploie pas, en principe, pour un prénom étranger. Certaines personnes l'aiment pourtant pour son tracé doux et arrondi.",
    kanjiWhy: (d) =>
      `Ce sont des <i>ateji</i> (当て字) : des kanji choisis à la fois pour leur prononciation et pour leur sens (ici <span lang="en">« ${d.mean} »</span>, en anglais). C'est une création artistique, pas une orthographe officielle : il n'existe pas de « vrai » kanji pour un prénom étranger.`,
    kanjiWhyLocal: (d) =>
      `Ce sont des <i>ateji</i> (当て字) : des kanji choisis à la fois pour leur prononciation et pour leur sens (ici « ${d.mean} »). C'est une création artistique, pas une orthographe officielle : il n'existe pas de « vrai » kanji pour un prénom étranger.`,
    sayH2: "Un détail : la prononciation",
    say:
      "Le katakana note un son, pas une orthographe. Or notre générateur lit les prénoms à l'anglaise : Thomas y devient トーマス (tōmasu), alors qu'un Thomas français s'écrit plutôt トマ (toma). Si votre prénom se prononce autrement en français, tapez-le comme il se prononce : « Toma » donne トマ, et « Batist » donne バティスト pour Baptiste.",
    faqH2: "Questions fréquentes",
    faq: [
      ["Comment écrit-on un prénom français en japonais ?",
       "En katakana, l'écriture que le japonais utilise pour les mots et les noms étrangers. On transcrit le prénom d'après sa prononciation : Emma devient エマ, Juliette ジュリエット. On ne le traduit pas, c'est le son qui compte."],
      ["Existe-t-il un kanji officiel pour mon prénom ?",
       "Non. Un prénom étranger n'a pas de kanji attitré. Les versions en kanji sont des ateji, choisis pour leur son et pour leur sens. Il en existe beaucoup pour un même prénom, et c'est à vous de choisir."],
      ["Pourquoi ne pas écrire mon prénom en hiragana ?",
       "C'est possible, mais ce n'est pas l'usage : le hiragana sert surtout aux mots japonais. Un Japonais le lira sans difficulté, mais le trouvera inhabituel. Certains l'apprécient justement pour son côté doux."],
      ["Puis-je utiliser ces kanji pour un tatouage ?",
       "Un tatouage est définitif. Considérez le résultat comme une simple piste, et faites vérifier le katakana comme les kanji par une personne de langue maternelle japonaise avant de vous décider."],
      // 2026-11-19: /fr/ is now the generator itself, in French (tools/build-app-i18n.mjs).
      ["Le générateur est-il en français ?",
       "Oui : sur cette page, tout est en français, y compris le sens de chaque kanji. Tapez votre prénom, choisissez le sens de chaque kanji, puis téléchargez gratuitement l'image en PNG. L'offre Premium payante (haute définition, styles et polices supplémentaires) est facultative."],
    ],
    trust: "Créé au Japon par Hitomi Kuga, Japonaise et enseignante de japonais.",
    about: "À propos (en anglais)",
    toolLink: "Ouvrir le générateur (en anglais)",
    langNav: "Langue",
    breadcrumbName: "Votre prénom en japonais",
  },

  it: {
    htmlLang: "it",
    ogLocale: "it_IT",
    title: "Il tuo nome in giapponese: katakana e kanji | Kanji My Name",
    description:
      "Come si scrive il tuo nome in giapponese? In katakana, come i nomi stranieri. Scopri anche l'hiragana e crea gratis la tua versione in kanji (ateji).",
    ogTitle: "Il tuo nome in giapponese: katakana, hiragana e kanji",
    h1: "Il tuo nome in giapponese",
    lead:
      "In Giappone un nome come il tuo si scrive di solito in <b>katakana</b>. Esiste però anche una strada più artistica: scegliere dei <b>kanji</b> per il loro suono e il loro significato. Qui trovi le tre scritture spiegate in breve e puoi provare subito con il tuo nome.",
    formLabel: "Il tuo nome (in lettere latine)",
    placeholder: "es. Giulia",
    button: "Scopri il tuo nome in giapponese",
    formNote:
      "Ti porteremo al nostro generatore. È <b>in inglese</b> e <b>gratuito</b>; il tuo nome resta nel tuo browser. Esiste anche un pacchetto Premium a pagamento, del tutto facoltativo.",
    example: "giulia:Giulia",
    scriptsH2: (d) => `Tre modi di scrivere ${d.name} in giapponese`,
    kataWhy:
      "È la scrittura che in Giappone si usa normalmente per i nomi e le parole di origine straniera. Nella vita di tutti i giorni, il tuo nome si scriverebbe così.",
    hiraWhy:
      "L'hiragana serve per le parole giapponesi e per la grammatica, quindi di norma non si usa per i nomi stranieri. C'è però chi lo sceglie per il suo tratto morbido e tondeggiante.",
    kanjiWhy: (d) =>
      `Si tratta di <i>ateji</i> (当て字): kanji scelti sia per il suono sia per il significato (qui <span lang="en">«${d.mean}»</span>, in inglese). È una forma d'arte, non una grafia ufficiale: per un nome straniero non esiste un kanji «giusto».`,
    kanjiWhyLocal: (d) =>
      `Si tratta di <i>ateji</i> (当て字): kanji scelti sia per il suono sia per il significato (qui «${d.mean}»). È una forma d'arte, non una grafia ufficiale: per un nome straniero non esiste un kanji «giusto».`,
    sayH2: "Attenzione alla pronuncia",
    say:
      "Il katakana trascrive un suono, non una grafia. Il nostro generatore però legge i nomi secondo le regole dell'inglese, e alcune lettere italiane possono ingannarlo: Lucia, per esempio, verrebbe letta ルシア invece di ルチア (ruchia). In questi casi scrivi il nome come si pronuncia: «Luchia» dà ルチア, e «Francheska» dà フランチェスカ per Francesca.",
    faqH2: "Domande frequenti",
    faq: [
      ["Come si scrive un nome italiano in giapponese?",
       "In katakana, la scrittura che il giapponese usa per le parole e i nomi stranieri. Il nome si trascrive in base alla pronuncia: Sofia diventa ソフィア, Luca ルカ. Non si traduce: conta il suono."],
      ["Esiste un kanji ufficiale per il mio nome?",
       "No. Un nome straniero non ha un kanji ufficiale. Le versioni in kanji sono ateji, scelti per suono e significato: per lo stesso nome le possibilità sono tante, e la scelta è tua."],
      ["Perché non scriverlo in hiragana?",
       "Si può, ma non è l'uso comune: l'hiragana serve soprattutto per le parole giapponesi. Un giapponese lo leggerebbe senza problemi, ma lo troverebbe insolito. C'è chi lo apprezza proprio per il suo aspetto morbido."],
      ["Posso usare questi kanji per un tatuaggio?",
       "Un tatuaggio è per sempre. Considera il risultato come una bozza e, prima di decidere, fai controllare sia il katakana sia i kanji da una persona madrelingua giapponese."],
      ["Il generatore è in italiano?",
       "No, è in inglese, ma è semplice da usare: scrivi il nome, scegli il significato di ogni kanji e scarica gratis l'immagine in PNG. Il pacchetto Premium a pagamento (alta risoluzione, stili e caratteri in più) è facoltativo."],
    ],
    trust: "Creato in Giappone da Hitomi Kuga, madrelingua giapponese e insegnante di giapponese.",
    about: "Chi siamo (in inglese)",
    toolLink: "Apri il generatore (in inglese)",
    langNav: "Lingua",
    breadcrumbName: "Il tuo nome in giapponese",
  },

  id: {
    htmlLang: "id",
    ogLocale: "id_ID",
    title: "Nama Kamu dalam Bahasa Jepang: Katakana & Kanji | Kanji My Name",
    description:
      "Bagaimana cara menulis nama kamu dalam bahasa Jepang? Nama asing ditulis dengan katakana. Lihat juga versi hiragana, lalu buat versi kanji (ateji) gratis.",
    ogTitle: "Nama kamu dalam bahasa Jepang: katakana, hiragana & kanji",
    h1: "Nama kamu dalam bahasa Jepang",
    lead:
      "Di Jepang, nama asing biasanya ditulis dengan <b>katakana</b>. Tapi ada juga cara yang lebih artistik: memilih <b>kanji</b> berdasarkan bunyi dan maknanya. Di halaman ini kamu bisa mengenal ketiga jenis huruf itu, lalu langsung mencobanya dengan namamu sendiri.",
    formLabel: "Nama kamu (huruf Latin)",
    placeholder: "contoh: Putri",
    button: "Lihat namaku dalam bahasa Jepang",
    formNote:
      "Kamu akan diarahkan ke generator kami. Generatornya <b>berbahasa Inggris</b> dan <b>gratis</b>. Namamu tidak dikirim ke mana pun karena semuanya diproses di browser. Ada juga paket Premium berbayar, tapi sifatnya opsional.",
    // Putri is in tools/locales/id-names.json → the example uses its local reading (プトゥリ) and links to /id/nama/putri.
    example: "putri:Putri",
    scriptsH2: (d) => `Tiga cara menulis ${d.name} dalam bahasa Jepang`,
    kataWhy:
      "Ini huruf yang biasa dipakai di Jepang untuk nama dan kata dari luar negeri. Dalam kehidupan sehari-hari, namamu akan ditulis seperti ini.",
    hiraWhy:
      "Hiragana dipakai untuk kata-kata asli Jepang dan tata bahasa, jadi biasanya tidak dipakai untuk nama asing. Meski begitu, ada yang menyukainya karena bentuknya yang bulat dan lembut.",
    kanjiWhy: (d) =>
      `Ini disebut <i>ateji</i> (当て字): kanji yang dipilih karena bunyi sekaligus maknanya (di sini <span lang="en">“${d.mean}”</span>, dalam bahasa Inggris). Ateji adalah kreasi artistik, bukan ejaan resmi. Nama asing tidak punya kanji yang “benar”.`,
    kanjiWhyLocal: (d) =>
      `Ini disebut <i>ateji</i> (当て字): kanji yang dipilih karena bunyi sekaligus maknanya (di sini “${d.mean}”). Ateji adalah kreasi artistik, bukan ejaan resmi. Nama asing tidak punya kanji yang “benar”.`,
    sayH2: "Soal pelafalan",
    say:
      "Katakana menuliskan bunyi, bukan ejaan. Ejaan bahasa Indonesia umumnya sesuai dengan bunyinya, jadi banyak nama bisa langsung diketik apa adanya: Putri menjadi プトゥリ, Budi menjadi ブディ. Tapi generator kami membaca nama dengan aturan bahasa Inggris, sehingga huruf c bisa terbaca seperti “s”: Cinta menjadi シンタ, bukan チンタ. Kalau begitu, ketik sesuai bunyinya: “Chinta” menghasilkan チンタ.",
    faqH2: "Pertanyaan yang sering diajukan",
    faq: [
      ["Bagaimana cara menulis nama Indonesia dalam bahasa Jepang?",
       "Dengan katakana, huruf yang dipakai bahasa Jepang untuk kata dan nama asing. Nama ditulis sesuai bunyinya: Putri menjadi プトゥリ, Maya menjadi マヤ. Nama tidak diterjemahkan; yang ditulis adalah bunyinya."],
      ["Apakah ada kanji resmi untuk namaku?",
       "Tidak. Nama asing tidak punya kanji resmi. Versi kanji adalah ateji, yang dipilih berdasarkan bunyi dan makna. Untuk satu nama ada banyak kemungkinan, dan kamu sendiri yang memilih."],
      ["Kenapa nama asing tidak ditulis dengan hiragana?",
       "Boleh saja, tapi itu tidak lazim: hiragana terutama dipakai untuk kata-kata asli Jepang. Orang Jepang tetap bisa membacanya, hanya saja terasa tidak biasa. Ada juga yang justru menyukainya karena kesannya lembut."],
      ["Apakah kanji ini bisa dipakai untuk tato?",
       "Tato itu permanen. Anggap hasilnya sebagai rancangan awal, dan sebelum memutuskan, minta penutur asli bahasa Jepang untuk memeriksa katakana dan kanjinya."],
      ["Apakah generatornya tersedia dalam bahasa Indonesia?",
       "Tidak, generatornya berbahasa Inggris, tapi mudah dipakai: ketik nama, pilih makna setiap kanji, lalu unduh gambar PNG secara gratis. Paket Premium berbayar (resolusi tinggi, gaya dan font tambahan) bersifat opsional."],
    ],
    trust: "Dibuat di Jepang oleh Hitomi Kuga, orang Jepang asli yang juga guru bahasa Jepang.",
    about: "Tentang kami (bahasa Inggris)",
    toolLink: "Buka generator (bahasa Inggris)",
    langNav: "Bahasa",
    breadcrumbName: "Nama kamu dalam bahasa Jepang",
  },
};

// ---------------------------------------------------------------------------------------------
// Locale NAME pages (D-56): /fr/prenoms/<slug>, /it/nomi/<slug>, /id/nama/<slug> + list pages.
// Built by tools/build-locale-names.mjs from tools/locales/<lc>-names.json.
// Values are trusted HTML. Functions receive (already HTML-escaped where it matters):
//   d = { D: display name, K: katakana, R: romaji, H: hiragana, kanji, mean: local meanings
//         (one per kanji) joined with " / ", combos: number of kanji spellings, n: number of
//         sounds (1 → singular wording), toks: sounds joined with " · ",
//         alts: other katakana spellings joined with ", " ("" if none),
//         pron: false when the name has a kanaNote (the katakana is NOT the local pronunciation),
//         kanaNote: that note ("" if none) }
// Facts to keep (same as the landing pages): katakana = the usual way to write foreign names;
// hiragana is not normally used for foreign names; kanji = ateji, art, not an official spelling;
// no tattoo promises — always "have a native speaker check it".
// Landing-page grid keys (gridH2Local, gridNoteLocal, allNamesLink, sayLocal) are used by
// tools/build-i18n.mjs once tools/locales/<lc>-names.json exists.
// ---------------------------------------------------------------------------------------------
export const LOCALE_NAME_STRINGS = {
  fr: {
    title: (d) => `${d.D} en japonais : katakana et kanji | Kanji My Name`,
    description: (d) =>
      `${d.D} s'écrit ${d.K} (${d.R})${d.altDesc ? ` ou ${d.alts}` : ""} en katakana${d.pron ? ", d'après la prononciation française" : ""}. Avec son hiragana et des kanji (ateji) à créer gratuitement.`,
    ogTitle: (d) => `${d.D} en japonais : ${d.K} · ${d.kanji}`,
    h1: (d) => `${d.D} en japonais`,
    sub: (d) =>
      `En japonais, ${d.D} s'écrit <b>${d.K}</b> en katakana${d.pron ? ", d'après sa prononciation française" : ""}. Voici aussi sa forme en hiragana et une proposition en kanji, à personnaliser.`,
    scriptsH2: (d) => `Trois façons d'écrire ${d.D} en japonais`,
    kataWhy: (d) =>
      `C'est l'écriture qu'on utilise normalement au Japon pour les prénoms étrangers : au quotidien, c'est ainsi qu'on écrirait ${d.D}.`,
    hiraWhy:
      "Le hiragana sert aux mots japonais et à la grammaire : on ne l'emploie pas, en principe, pour un prénom étranger. Certaines personnes l'aiment pourtant pour son tracé doux et arrondi.",
    kanjiWhy: (d) =>
      `Ce sont des <i>ateji</i> (当て字) : des kanji choisis pour leur son et pour leur sens (« ${d.mean} »). C'est une création artistique, pas une orthographe officielle.`,
    altLine: (alts) => `Aussi écrit : ${alts}`,
    artNote: (art) =>
      `Pour les kanji, la lecture est simplifiée en « ${art} » : le japonais n'a pas exactement tous ces sons, et les ateji s'en tiennent aux lectures les plus proches.`,
    copy: "Copier",
    copied: "Copié",
    copyAria: (d, script) => `Copier ${d.D} en ${script}`,
    cardAria: (d) => `${d.D} en kanji : ${d.kanji}`,
    breakdownH2: (d) => `Comment ${d.D} devient des kanji`,
    breakdownIntro: (d) =>
      d.n === 1
        ? `En japonais, ${d.D} tient en un seul son : <b>${d.toks}</b>. Un kanji suffit donc : <b>${d.kanji}</b>, l'un des ${d.combos} kanji possibles.`
        : `En japonais, ${d.D} se découpe en ${d.n} sons : <b>${d.toks}</b>. À chaque son correspond un kanji, ce qui donne <b>${d.kanji}</b>, l'une des ${d.combos} combinaisons possibles.`,
    th: ["Son", "Kanji", "Sens"],
    approxNote:
      "≈ : le japonais n'a pas exactement ce son ; on prend alors le kanji dont la lecture est la plus proche, comme le veut la tradition des ateji.",
    fallbackNote:
      "Certaines significations ne sont pas encore traduites : elles sont indiquées en anglais.",
    choicesH2: (d) => `Tous les kanji possibles pour ${d.D}`,
    choicesIntro:
      "Pour chaque son, plusieurs kanji se prononcent de la même façon (ou presque), mais chacun a son propre sens. Choisissez ceux qui vous plaisent dans le générateur.",
    sylLine: (t, n) => `« ${t} » — ${n} kanji au choix`,
    selLabel: "Dans cette version",
    selAria: "Sélectionné",
    cta: (d) => `Créer ${d.D} en kanji — gratuit`,
    ctaNote: "Générateur en anglais · téléchargement immédiat · votre prénom reste dans votre navigateur",
    faqH2: (d) => `Questions sur ${d.D} en japonais`,
    faq: (d) => [
      [`Comment écrit-on ${d.D} en japonais ?`,
       `En katakana : ${d.K} (${d.R}).${d.alts ? ` On le trouve aussi écrit ${d.alts}.` : ""} C'est l'écriture que le japonais utilise pour les prénoms et les mots étrangers${d.pron ? ", et elle suit la prononciation française du prénom" : ""}.${d.kanaNote ? ` ${d.kanaNote}` : ""} En hiragana, on écrirait ${d.H}, mais ce n'est pas l'usage pour un prénom étranger.`],
      [`Que signifie ${d.D} en japonais ?`,
       `En soi, ${d.D} n'a pas de sens en japonais : le katakana ne note que le son. Le sens n'apparaît que si l'on choisit des kanji. Dans la version proposée ici, ${d.kanji} signifie « ${d.mean} », et vous pouvez remplacer ${d.n === 1 ? "ce kanji" : "chaque kanji"} pour changer de sens.`],
      [`${d.kanji} est-il l'orthographe officielle de ${d.D} ?`,
       `Non. Il n'existe pas de kanji officiel pour un prénom étranger. ${d.kanji} est un ateji, une proposition artistique parmi ${d.combos} ${d.n === 1 ? "kanji possibles" : "combinaisons possibles"}. Au Japon, dans la vie courante, ${d.D} s'écrit en katakana.`],
      [`Puis-je me faire tatouer ${d.kanji} ?`,
       `Un tatouage est définitif. Considérez ces kanji comme une simple piste, et faites vérifier le katakana (${d.K}) et les kanji par une personne de langue maternelle japonaise avant de vous décider.`],
    ],
    relatedH2: "D'autres prénoms en japonais",
    allLink: "Tous les prénoms →",
    nameCrumb: (d) => `${d.D} en japonais`,
    // list page /fr/prenoms/
    listTitle: "Prénoms français en japonais (katakana, kanji) | Kanji My Name",
    listDescription: (n) =>
      `${n} prénoms courants en France écrits en japonais : katakana d'après la prononciation française, hiragana et kanji (ateji) avec leur signification.`,
    listH1: "Prénoms français en japonais",
    listLead: (n) =>
      `${n} prénoms courants en France, écrits en katakana d'après leur prononciation française, avec une proposition en kanji. Cliquez sur un prénom pour voir toutes ses écritures.`,
    groups: { f: "Prénoms féminins", m: "Prénoms masculins", u: "Prénoms mixtes" },
    // landing page /fr/
    gridH2Local: "Des prénoms courants en France, écrits en japonais",
    gridNoteLocal:
      "Pour chaque prénom : le katakana d'après la prononciation française, puis une proposition en kanji. Cliquez sur un prénom pour ouvrir sa page.",
    allNamesLink: "Tous les prénoms →",
    sayLocal:
      "Si vous tapez ci-dessus un prénom de notre liste, le générateur reprend directement sa prononciation française.",
  },

  it: {
    title: (d) => `${d.D} in giapponese: katakana e kanji | Kanji My Name`,
    description: (d) =>
      `${d.D} in giapponese: ${d.K} (${d.R})${d.altDesc ? ` o ${d.alts}` : ""} in katakana${d.pron ? ", secondo la pronuncia italiana" : ""}. Scopri anche l'hiragana e crea gratis la versione in kanji (ateji).`,
    ogTitle: (d) => `${d.D} in giapponese: ${d.K} · ${d.kanji}`,
    h1: (d) => `${d.D} in giapponese`,
    sub: (d) =>
      `In giapponese ${d.D} si scrive <b>${d.K}</b> in katakana${d.pron ? ", secondo la pronuncia italiana" : ""}. Qui trovi anche la forma in hiragana e una proposta in kanji da personalizzare.`,
    scriptsH2: (d) => `Tre modi di scrivere ${d.D} in giapponese`,
    kataWhy: (d) =>
      `È la scrittura che in Giappone si usa normalmente per i nomi stranieri: nella vita di tutti i giorni ${d.D} si scriverebbe così.`,
    hiraWhy:
      "L'hiragana serve per le parole giapponesi e per la grammatica, quindi di norma non si usa per i nomi stranieri. C'è però chi lo sceglie per il suo tratto morbido e tondeggiante.",
    kanjiWhy: (d) =>
      `Sono <i>ateji</i> (当て字): kanji scelti sia per il suono sia per il significato («${d.mean}»). È una scelta artistica, non una grafia ufficiale.`,
    altLine: (alts) => `Si scrive anche: ${alts}`,
    artNote: (art) =>
      `Per i kanji la lettura è semplificata in «${art}»: il giapponese non ha esattamente tutti questi suoni, e gli ateji usano le letture più vicine.`,
    copy: "Copia",
    copied: "Copiato",
    copyAria: (d, script) => `Copia ${d.D} in ${script}`,
    cardAria: (d) => `${d.D} in kanji: ${d.kanji}`,
    breakdownH2: (d) => `Come ${d.D} diventa kanji`,
    breakdownIntro: (d) =>
      d.n === 1
        ? `In giapponese ${d.D} è un solo suono: <b>${d.toks}</b>. Basta quindi un kanji: <b>${d.kanji}</b>, uno dei ${d.combos} kanji possibili.`
        : `In giapponese ${d.D} si divide in ${d.n} suoni: <b>${d.toks}</b>. A ogni suono corrisponde un kanji, e il risultato è <b>${d.kanji}</b>, una delle ${d.combos} combinazioni possibili.`,
    th: ["Suono", "Kanji", "Significato"],
    approxNote:
      "≈: il giapponese non ha esattamente questo suono, quindi si usa il kanji con la lettura più vicina, come vuole la tradizione degli ateji.",
    fallbackNote: "Alcuni significati non sono ancora tradotti e sono indicati in inglese.",
    choicesH2: (d) => `Tutti i kanji possibili per ${d.D}`,
    choicesIntro:
      "Per ogni suono ci sono più kanji con la stessa pronuncia (o quasi), ma ognuno ha un significato diverso. Scegli quelli che preferisci nel generatore.",
    sylLine: (t, n) => `«${t}» — ${n} kanji tra cui scegliere`,
    selLabel: "In questa versione",
    selAria: "Selezionato",
    cta: (d) => `Crea gratis ${d.D} in kanji`,
    ctaNote: "Generatore in inglese · download immediato · il tuo nome resta nel tuo browser",
    faqH2: (d) => `Domande su ${d.D} in giapponese`,
    faq: (d) => [
      [`Come si scrive ${d.D} in giapponese?`,
       `In katakana: ${d.K} (${d.R}).${d.alts ? ` Si trova scritto anche ${d.alts}.` : ""} È la scrittura che il giapponese usa per i nomi e le parole straniere${d.pron ? ", e segue la pronuncia italiana del nome" : ""}.${d.kanaNote ? ` ${d.kanaNote}` : ""} In hiragana sarebbe ${d.H}, ma per un nome straniero di norma non si usa.`],
      [`Che cosa significa ${d.D} in giapponese?`,
       `Di per sé ${d.D} non ha un significato in giapponese: il katakana trascrive solo il suono. Il significato arriva solo se si scelgono dei kanji. Nella versione proposta qui, ${d.kanji} significa «${d.mean}», e puoi sostituire ${d.n === 1 ? "questo kanji" : "ogni kanji"} per cambiare il significato.`],
      [`${d.kanji} è la grafia ufficiale di ${d.D}?`,
       `No. Per un nome straniero non esiste un kanji ufficiale. ${d.kanji} è un ateji, una proposta artistica tra ${d.combos} ${d.n === 1 ? "kanji possibili" : "combinazioni possibili"}. Nella vita di tutti i giorni, in Giappone ${d.D} si scrive in katakana.`],
      [`Posso tatuarmi ${d.kanji}?`,
       `Un tatuaggio è per sempre. Considera questi kanji come una bozza e, prima di decidere, fai controllare sia il katakana (${d.K}) sia i kanji da una persona madrelingua giapponese.`],
    ],
    relatedH2: "Altri nomi in giapponese",
    allLink: "Tutti i nomi →",
    nameCrumb: (d) => `${d.D} in giapponese`,
    listTitle: "Nomi italiani in giapponese: katakana e kanji | Kanji My Name",
    listDescription: (n) =>
      `${n} nomi diffusi in Italia scritti in giapponese: katakana secondo la pronuncia italiana, hiragana e kanji (ateji) con il loro significato.`,
    listH1: "Nomi italiani in giapponese",
    listLead: (n) =>
      `${n} nomi diffusi in Italia, scritti in katakana secondo la pronuncia italiana e con una proposta in kanji. Clicca su un nome per vedere tutte le sue scritture.`,
    groups: { f: "Nomi femminili", m: "Nomi maschili", u: "Nomi unisex" },
    gridH2Local: "Nomi diffusi in Italia, scritti in giapponese",
    gridNoteLocal:
      "Per ogni nome: il katakana secondo la pronuncia italiana e una proposta in kanji. Clicca su un nome per aprire la sua pagina.",
    allNamesLink: "Tutti i nomi →",
    sayLocal:
      "Se invece scrivi qui sopra un nome del nostro elenco, il generatore ne usa già la pronuncia italiana.",
  },

  id: {
    title: (d) => `${d.D} dalam Bahasa Jepang: Katakana & Kanji | Kanji My Name`,
    description: (d) =>
      `${d.D} dalam bahasa Jepang: ${d.K} (${d.R})${d.altDesc ? ` atau ${d.alts}` : ""} dengan katakana${d.pron ? ", sesuai pelafalan Indonesia" : ""}. Lihat juga hiragana dan buat versi kanji (ateji) gratis.`,
    ogTitle: (d) => `${d.D} dalam bahasa Jepang: ${d.K} · ${d.kanji}`,
    h1: (d) => `${d.D} dalam bahasa Jepang`,
    sub: (d) =>
      `Dalam bahasa Jepang, ${d.D} ditulis <b>${d.K}</b> dengan katakana${d.pron ? ", sesuai cara orang Indonesia melafalkannya" : ""}. Di sini ada juga versi hiragana dan satu usulan kanji yang bisa kamu ubah sendiri.`,
    scriptsH2: (d) => `Tiga cara menulis ${d.D} dalam bahasa Jepang`,
    kataWhy: (d) =>
      `Ini huruf yang biasa dipakai di Jepang untuk nama asing. Dalam kehidupan sehari-hari, ${d.D} akan ditulis seperti ini.`,
    hiraWhy:
      "Hiragana dipakai untuk kata-kata asli Jepang dan tata bahasa, jadi biasanya tidak dipakai untuk nama asing. Meski begitu, ada yang menyukainya karena bentuknya yang bulat dan lembut.",
    kanjiWhy: (d) =>
      `Ini disebut <i>ateji</i> (当て字): kanji yang dipilih karena bunyi sekaligus maknanya (“${d.mean}”). Ateji adalah kreasi artistik, bukan ejaan resmi.`,
    altLine: (alts) => `Juga ditulis: ${alts}`,
    artNote: (art) =>
      `Untuk kanji, bacaannya disederhanakan menjadi “${art}”: bahasa Jepang tidak punya semua bunyi ini secara persis, jadi ateji memakai bacaan yang paling mendekati.`,
    copy: "Salin",
    copied: "Tersalin",
    copyAria: (d, script) => `Salin ${d.D} dalam ${script}`,
    cardAria: (d) => `${d.D} dalam kanji: ${d.kanji}`,
    breakdownH2: (d) => `Bagaimana ${d.D} menjadi kanji`,
    breakdownIntro: (d) =>
      d.n === 1
        ? `Dalam bahasa Jepang, ${d.D} hanya terdiri atas satu bunyi: <b>${d.toks}</b>. Jadi cukup satu kanji: <b>${d.kanji}</b>, salah satu dari ${d.combos} pilihan kanji.`
        : `Dalam bahasa Jepang, ${d.D} terdiri atas ${d.n} bunyi: <b>${d.toks}</b>. Setiap bunyi dipasangkan dengan satu kanji, sehingga hasilnya <b>${d.kanji}</b>, salah satu dari ${d.combos} kombinasi yang mungkin.`,
    th: ["Bunyi", "Kanji", "Makna"],
    approxNote:
      "≈: bahasa Jepang tidak punya bunyi yang persis sama, jadi dipakai kanji dengan bacaan yang paling mirip, sesuai tradisi ateji.",
    fallbackNote: "Beberapa makna belum diterjemahkan, jadi masih ditulis dalam bahasa Inggris.",
    choicesH2: (d) => `Semua pilihan kanji untuk ${d.D}`,
    choicesIntro:
      "Untuk setiap bunyi ada beberapa kanji dengan bacaan yang sama (atau mirip), tapi maknanya berbeda-beda. Pilih yang kamu suka di generator.",
    sylLine: (t, n) => `“${t}” — ${n} pilihan kanji`,
    selLabel: "Dipakai di versi ini",
    selAria: "Terpilih",
    cta: (d) => `Buat versi kanji ${d.D} — gratis`,
    ctaNote: "Generator berbahasa Inggris · langsung unduh · namamu tidak dikirim ke mana pun",
    faqH2: (d) => `Pertanyaan tentang ${d.D} dalam bahasa Jepang`,
    faq: (d) => [
      [`Bagaimana cara menulis ${d.D} dalam bahasa Jepang?`,
       `Dengan katakana: ${d.K} (${d.R}).${d.alts ? ` Kadang juga ditulis ${d.alts}.` : ""} Katakana adalah huruf yang dipakai bahasa Jepang untuk nama dan kata asing${d.pron ? ", dan penulisannya mengikuti pelafalan Indonesia" : ""}.${d.kanaNote ? ` ${d.kanaNote}` : ""} Dalam hiragana, ${d.D} menjadi ${d.H}, tapi hiragana biasanya tidak dipakai untuk nama asing.`],
      [`Apa arti ${d.D} dalam bahasa Jepang?`,
       `${d.D} sendiri tidak punya arti dalam bahasa Jepang: katakana hanya menuliskan bunyinya. Makna baru muncul kalau kamu memilih kanji. Dalam versi di halaman ini, ${d.kanji} berarti “${d.mean}”, dan ${d.n === 1 ? "kanji ini" : "setiap kanji"} bisa kamu ganti untuk mengubah maknanya.`],
      [`Apakah ${d.kanji} ejaan resmi untuk ${d.D}?`,
       `Bukan. Nama asing tidak punya kanji resmi. ${d.kanji} adalah ateji, satu usulan artistik dari ${d.combos} ${d.n === 1 ? "pilihan kanji" : "kombinasi yang mungkin"}. Dalam kehidupan sehari-hari di Jepang, ${d.D} ditulis dengan katakana.`],
      [`Apakah ${d.kanji} bisa dipakai untuk tato?`,
       `Tato itu permanen. Anggap kanji ini sebagai rancangan awal, dan sebelum memutuskan, minta penutur asli bahasa Jepang untuk memeriksa katakana (${d.K}) dan kanjinya.`],
    ],
    relatedH2: "Nama lain dalam bahasa Jepang",
    allLink: "Semua nama →",
    nameCrumb: (d) => `${d.D} dalam bahasa Jepang`,
    listTitle: "Nama Indonesia dalam Bahasa Jepang | Kanji My Name",
    listDescription: (n) =>
      `${n} nama yang populer di Indonesia dalam bahasa Jepang: katakana sesuai pelafalan Indonesia, hiragana, dan kanji (ateji) beserta maknanya.`,
    listH1: "Nama Indonesia dalam bahasa Jepang",
    listLead: (n) =>
      `${n} nama yang populer di Indonesia, ditulis dengan katakana sesuai pelafalannya, lengkap dengan satu usulan kanji. Klik nama untuk melihat semua cara menulisnya.`,
    groups: { f: "Nama perempuan", m: "Nama laki-laki", u: "Nama uniseks" },
    gridH2Local: "Nama yang populer di Indonesia dalam bahasa Jepang",
    gridNoteLocal:
      "Setiap nama ditampilkan dengan katakana sesuai pelafalan Indonesia dan satu usulan kanji. Klik nama untuk membuka halamannya.",
    allNamesLink: "Semua nama →",
    sayLocal:
      "Untuk nama yang ada di daftar kami, generator langsung memakai pelafalan Indonesia.",
  },
};
