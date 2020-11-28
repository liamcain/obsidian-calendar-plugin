export function configureMomentLocale(): void {
  const lang = localStorage.getItem("language");

  const currentLocale = window.moment.locale(lang);
  console.info(
    `trying to switch moment locale to ${lang}, got ${currentLocale}`
  );
}
