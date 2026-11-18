// i18n-strings.mjs — string tables for the /fr/ /it/ /id/ landing pages (tools/build-i18n.mjs).
// Pure data, no side effects: tools/build-names.mjs imports I18N_LANGS from here for the sitemap.
//
// Policy (2026-11-18): one hand-written landing page per language — NOT translated name pages.
// Each string was written natively, not word-for-word. Values are trusted HTML (<b>, <i>, <a>).
// Function values receive the example data computed by build-i18n.mjs:
//   { name, kata, hira, romaji, kanji, mean }   (mean = English meanings, already escaped)
// Name lists: "slug:Display" — slug MUST exist in tools/names.txt (build fails otherwise).
// Only names whose default katakana in the generator matches the local pronunciation are used.

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
    sayH2: "Un détail : la prononciation",
    say:
      "Le katakana note un son, pas une orthographe. Or notre générateur lit les prénoms à l'anglaise : Thomas y devient トーマス (tōmasu), alors qu'un Thomas français s'écrit plutôt トマ (toma). Si votre prénom se prononce autrement en français, tapez-le comme il se prononce : « Toma » donne トマ, et « Lui » donne ルイ pour Louis.",
    gridH2: "Des prénoms courants en France, écrits en japonais",
    gridNote:
      "Pour chaque prénom : le katakana, puis les kanji proposés par défaut. Cliquez sur un prénom pour voir toutes les variantes en kanji (page en anglais). Les significations des kanji sont indiquées en anglais.",
    names: [
      "emma:Emma", "alice:Alice", "chloe:Chloé", "rose:Rose", "mila:Mila", "anna:Anna", "juliette:Juliette",
      "clara:Clara", "julia:Julia", "nina:Nina", "marie:Marie", "celine:Céline", "sophie:Sophie", "victoria:Victoria",
      "leo:Léo", "gabriel:Gabriel", "adam:Adam", "noah:Noah", "tom:Tom", "enzo:Enzo", "axel:Axel",
      "felix:Félix", "leon:Léon", "pierre:Pierre",
    ],
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
      ["Le générateur est-il en français ?",
       "Non, il est en anglais, mais il est très simple à utiliser : tapez votre prénom, choisissez le sens de chaque kanji, puis téléchargez gratuitement l'image en PNG. L'offre Premium payante (haute définition, styles et polices supplémentaires) est facultative."],
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
    sayH2: "Attenzione alla pronuncia",
    say:
      "Il katakana trascrive un suono, non una grafia. Il nostro generatore però legge i nomi secondo le regole dell'inglese, e alcune lettere italiane possono ingannarlo: Chiara, per esempio, verrebbe letta チアラ invece di キアラ (kiara). In questi casi scrivi il nome come si pronuncia: «Kiara» dà キアラ, e «Francheska» dà フランチェスカ per Francesca.",
    gridH2: "Nomi diffusi in Italia, in giapponese",
    gridNote:
      "Per ogni nome: il katakana e i kanji proposti dal generatore. Clicca su un nome per vedere tutte le alternative in kanji (pagina in inglese). I significati dei kanji sono indicati in inglese.",
    names: [
      "sofia:Sofia", "giulia:Giulia", "aurora:Aurora", "alice:Alice", "emma:Emma", "sara:Sara", "anna:Anna",
      "maria:Maria", "valentina:Valentina", "elena:Elena", "arianna:Arianna", "isabella:Isabella", "clara:Clara",
      "emilia:Emilia", "mia:Mia", "nina:Nina",
      "leonardo:Leonardo", "matteo:Matteo", "andrea:Andrea", "antonio:Antonio", "marco:Marco", "luca:Luca",
      "giovanni:Giovanni", "leo:Leo",
    ],
    faqH2: "Domande frequenti",
    faq: [
      ["Come si scrive un nome italiano in giapponese?",
       "In katakana, la scrittura che il giapponese usa per le parole e i nomi stranieri. Il nome si trascrive in base alla pronuncia: Sofia diventa ソフィア, Matteo マテオ. Non si traduce: conta il suono."],
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
    // Putri is not in tools/names.txt (most Indonesian names are not yet) — the example links to the generator instead.
    example: "putri:Putri",
    scriptsH2: (d) => `Tiga cara menulis ${d.name} dalam bahasa Jepang`,
    kataWhy:
      "Ini huruf yang biasa dipakai di Jepang untuk nama dan kata dari luar negeri. Dalam kehidupan sehari-hari, namamu akan ditulis seperti ini.",
    hiraWhy:
      "Hiragana dipakai untuk kata-kata asli Jepang dan tata bahasa, jadi biasanya tidak dipakai untuk nama asing. Meski begitu, ada yang menyukainya karena bentuknya yang bulat dan lembut.",
    kanjiWhy: (d) =>
      `Ini disebut <i>ateji</i> (当て字): kanji yang dipilih karena bunyi sekaligus maknanya (di sini <span lang="en">“${d.mean}”</span>, dalam bahasa Inggris). Ateji adalah kreasi artistik, bukan ejaan resmi. Nama asing tidak punya kanji yang “benar”.`,
    sayH2: "Soal pelafalan",
    say:
      "Katakana menuliskan bunyi, bukan ejaan. Ejaan bahasa Indonesia umumnya sesuai dengan bunyinya, jadi banyak nama bisa langsung diketik apa adanya: Putri menjadi プトリ, Budi menjadi ブディ. Tapi generator kami membaca nama dengan aturan bahasa Inggris, sehingga huruf c bisa terbaca seperti “s”: Citra menjadi シトラ, bukan チトラ. Kalau begitu, ketik sesuai bunyinya: “Chitra” menghasilkan チトラ.",
    gridH2: "Nama yang juga populer di Indonesia",
    gridNote:
      "Nama-nama khas Indonesia belum banyak tersedia di koleksi kami, jadi daftar ini berisi nama internasional yang juga banyak dipakai di Indonesia. Setiap nama ditampilkan dengan katakana dan kanji pilihan awalnya. Klik nama untuk melihat semua pilihan kanji (halaman berbahasa Inggris). Makna kanji ditulis dalam bahasa Inggris.",
    names: [
      "kevin:Kevin", "michael:Michael", "daniel:Daniel", "jason:Jason", "felix:Felix", "gabriel:Gabriel",
      "rafael:Rafael", "joshua:Joshua", "adam:Adam", "leo:Leo", "kai:Kai",
      "jessica:Jessica", "amelia:Amelia", "kiara:Kiara", "clara:Clara", "bella:Bella", "maria:Maria",
      "angel:Angel", "maya:Maya", "nina:Nina", "aurora:Aurora", "alana:Alana", "fatima:Fatima", "luna:Luna", "mia:Mia",
    ],
    faqH2: "Pertanyaan yang sering diajukan",
    faq: [
      ["Bagaimana cara menulis nama Indonesia dalam bahasa Jepang?",
       "Dengan katakana, huruf yang dipakai bahasa Jepang untuk kata dan nama asing. Nama ditulis sesuai bunyinya: Putri menjadi プトリ, Maya menjadi マヤ. Nama tidak diterjemahkan; yang ditulis adalah bunyinya."],
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
