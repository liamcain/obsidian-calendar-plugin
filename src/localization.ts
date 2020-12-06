const langToMomentLocale = {
  en: null,
  zh: "zh-cn",
  "zh-TW": "zh-tw",
  ru: "ru",
  ko: "ko",
  it: "it",
  id: "id",
  ro: "ro",
  "pt-BR": "pt-br",
  cz: "cs",
  de: "de",
  es: "es",
  fr: "fr",
  no: "nn",
  pl: "pl",
  pt: "pt",
  tr: "tr",
  hi: "hi",
  nl: "nl",
  ar: "ar",
  ja: "ja",
};

export async function configureMomentLocale(): Promise<void> {
  const obsidianLang = localStorage.getItem("language");
  const systemLang = navigator.language?.toLowerCase();
  const momentLocale = langToMomentLocale[obsidianLang] || systemLang;

  const currentLocale = window.moment.locale(momentLocale);
  console.info(
    `Calendar initialization: Trying to switch Moment.js global locale to ${momentLocale}, got ${currentLocale}`
  );
}
