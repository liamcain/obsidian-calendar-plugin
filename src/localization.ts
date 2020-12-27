import type { ISettings } from "./settings";

const langToMomentLocale = {
  en: "en-gb",
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

export async function configureMomentLocale(
  settings: ISettings
): Promise<void> {
  const obsidianLang = localStorage.getItem("language") || "en";
  const systemLang = navigator.language?.toLowerCase();
  const localeOverride = settings.localeOverride;

  let momentLocale = langToMomentLocale[obsidianLang];

  if (localeOverride !== "system-default") {
    momentLocale = localeOverride;
  } else if (systemLang.startsWith(obsidianLang)) {
    momentLocale = systemLang;
  }

  const currentLocale = window.moment.locale(momentLocale);
  console.info(
    `Calendar initialization: Trying to switch Moment.js global locale to ${momentLocale}, got ${currentLocale}`
  );
}
