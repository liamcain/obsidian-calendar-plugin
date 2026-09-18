import { App, PluginSettingTab, Setting } from "obsidian";
import { appHasDailyNotesPluginLoaded } from "obsidian-daily-notes-interface";
import type { ILocaleOverride, IWeekStartOption } from "obsidian-calendar-ui";

import { DEFAULT_WEEK_FORMAT, DEFAULT_WORDS_PER_DOT } from "src/constants";
import type { EventsRecord } from "src/events/types";
import { COMMON_TIMEZONES, DEFAULT_EVENT_COLOR, getSystemTimezone } from "src/events/types";

import type CalendarPlugin from "./main";

export interface ISettings {
  wordsPerDot: number;
  weekStart: IWeekStartOption;
  shouldConfirmBeforeCreate: boolean;
  requireCtrlToCreateNote: boolean;

  // Weekly Note settings
  showWeeklyNote: boolean;
  weeklyNoteFormat: string;
  weeklyNoteTemplate: string;
  weeklyNoteFolder: string;

  localeOverride: ILocaleOverride;

  // Agenda / Events settings
  events: EventsRecord;
  defaultEventColor: string;
  defaultTimezone: string;
  defaultRemindBefore: number;
  enableEventNotifications: boolean;
  // Integrações
  googleSyncEnabled: boolean;
  googleClientId: string;
  googleCalendarId: string;
  googleAccessToken: string;
  emailEnabled: boolean;
  emailWebhookUrl: string;
}

const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const defaultSettings: ISettings = Object.freeze({
  shouldConfirmBeforeCreate: true,
  requireCtrlToCreateNote: true,
  weekStart: "locale" as IWeekStartOption,

  wordsPerDot: DEFAULT_WORDS_PER_DOT,

  showWeeklyNote: false,
  weeklyNoteFormat: "",
  weeklyNoteTemplate: "",
  weeklyNoteFolder: "",

  localeOverride: "system-default",

  events: {},
  defaultEventColor: DEFAULT_EVENT_COLOR,
  defaultTimezone: getSystemTimezone(),
  defaultRemindBefore: 15,
  enableEventNotifications: true,
  googleSyncEnabled: false,
  googleClientId: "",
  googleCalendarId: "primary",
  googleAccessToken: "",
  emailEnabled: false,
  emailWebhookUrl: "",
}) as ISettings;

export function appHasPeriodicNotesPluginLoaded(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodicNotes = (<any>window.app).plugins.getPlugin("periodic-notes");
  return periodicNotes && periodicNotes.settings?.weekly?.enabled;
}

export class CalendarSettingsTab extends PluginSettingTab {
  private plugin: CalendarPlugin;

  constructor(app: App, plugin: CalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();

    if (!appHasDailyNotesPluginLoaded()) {
      this.containerEl.createDiv("settings-banner", (banner) => {
        banner.createEl("h3", {
          text: "⚠️ Daily Notes plugin not enabled",
        });
        banner.createEl("p", {
          cls: "setting-item-description",
          text:
            "The calendar is best used in conjunction with either the Daily Notes plugin or the Periodic Notes plugin (available in the Community Plugins catalog).",
        });
      });
    }

    this.containerEl.createEl("h3", {
      text: "General Settings",
    });
    this.addDotThresholdSetting();
    this.addWeekStartSetting();
    this.addConfirmCreateSetting();
    this.addRequireCtrlToCreateSetting();
    this.addShowWeeklyNoteSetting();

    if (
      this.plugin.options.showWeeklyNote &&
      !appHasPeriodicNotesPluginLoaded()
    ) {
      this.containerEl.createEl("h3", {
        text: "Weekly Note Settings",
      });
      this.containerEl.createEl("p", {
        cls: "setting-item-description",
        text:
          "Note: Weekly Note settings are moving. You are encouraged to install the 'Periodic Notes' plugin to keep the functionality in the future.",
      });
      this.addWeeklyNoteFormatSetting();
      this.addWeeklyNoteTemplateSetting();
      this.addWeeklyNoteFolderSetting();
    }

    this.containerEl.createEl("h3", {
      text: "Agenda / Events",
    });
    this.addDefaultTimezoneSetting();
    this.addDefaultColorSetting();
    this.addDefaultRemindSetting();
    this.addEnableNotificationsSetting();

    this.containerEl.createEl("h3", {
      text: "Integrações (opcional)",
    });
    this.containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "Google Agenda requer OAuth client_id. Email requer webhook (n8n/EmailJS). Export .ics funciona offline.",
    });
    this.addGoogleSyncSetting();
    this.addEmailWebhookSetting();

    this.containerEl.createEl("h3", {
      text: "Advanced Settings",
    });
    this.addLocaleOverrideSetting();
  }

  addDotThresholdSetting(): void {
    new Setting(this.containerEl)
      .setName("Words per dot")
      .setDesc("How many words should be represented by a single dot?")
      .addText((textfield) => {
        textfield.setPlaceholder(String(DEFAULT_WORDS_PER_DOT));
        textfield.inputEl.type = "number";
        textfield.setValue(String(this.plugin.options.wordsPerDot));
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            wordsPerDot: value !== "" ? Number(value) : undefined,
          }));
        });
      });
  }

  addWeekStartSetting(): void {
    const { moment } = window;

    const localizedWeekdays = moment.weekdays();
    const localeWeekStartNum = window._bundledLocaleWeekSpec.dow;
    const localeWeekStart = moment.weekdays()[localeWeekStartNum];

    new Setting(this.containerEl)
      .setName("Start week on:")
      .setDesc(
        "Choose what day of the week to start. Select 'Locale default' to use the default specified by moment.js"
      )
      .addDropdown((dropdown) => {
        dropdown.addOption("locale", `Locale default (${localeWeekStart})`);
        localizedWeekdays.forEach((day, i) => {
          dropdown.addOption(weekdays[i], day);
        });
        dropdown.setValue(this.plugin.options.weekStart);
        dropdown.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            weekStart: value as IWeekStartOption,
          }));
        });
      });
  }

  addConfirmCreateSetting(): void {
    new Setting(this.containerEl)
      .setName("Confirm before creating new note")
      .setDesc("Show a confirmation modal before creating a new note")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.shouldConfirmBeforeCreate);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            shouldConfirmBeforeCreate: value,
          }));
        });
      });
  }

  addRequireCtrlToCreateSetting(): void {
    new Setting(this.containerEl)
      .setName("Exigir Ctrl para criar nota")
      .setDesc("Se ativo, clicar numa data sem Ctrl apenas seleciona o dia (para eventos). Segure Ctrl/Cmd para criar/abrir a daily note. Desative para voltar ao comportamento antigo.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.requireCtrlToCreateNote);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            requireCtrlToCreateNote: value,
          }));
        });
      });
  }

  addShowWeeklyNoteSetting(): void {
    new Setting(this.containerEl)
      .setName("Show week number")
      .setDesc("Enable this to add a column with the week number")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.showWeeklyNote);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ showWeeklyNote: value }));
          this.display(); // show/hide weekly settings
        });
      });
  }

  addWeeklyNoteFormatSetting(): void {
    new Setting(this.containerEl)
      .setName("Weekly note format")
      .setDesc("For more syntax help, refer to format reference")
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.weeklyNoteFormat);
        textfield.setPlaceholder(DEFAULT_WEEK_FORMAT);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ weeklyNoteFormat: value }));
        });
      });
  }

  addWeeklyNoteTemplateSetting(): void {
    new Setting(this.containerEl)
      .setName("Weekly note template")
      .setDesc(
        "Choose the file you want to use as the template for your weekly notes"
      )
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.weeklyNoteTemplate);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ weeklyNoteTemplate: value }));
        });
      });
  }

  addWeeklyNoteFolderSetting(): void {
    new Setting(this.containerEl)
      .setName("Weekly note folder")
      .setDesc("New weekly notes will be placed here")
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.weeklyNoteFolder);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ weeklyNoteFolder: value }));
        });
      });
  }

  addDefaultTimezoneSetting(): void {
    new Setting(this.containerEl)
      .setName("Fuso horário padrão")
      .setDesc("Usado ao criar novos eventos")
      .addDropdown((dropdown) => {
        COMMON_TIMEZONES.forEach((tz) => {
          dropdown.addOption(tz, tz === "system-default" ? `Sistema (${getSystemTimezone()})` : tz);
        });
        // permite valor custom
        if (!COMMON_TIMEZONES.includes(this.plugin.options.defaultTimezone)) {
          dropdown.addOption(this.plugin.options.defaultTimezone, this.plugin.options.defaultTimezone);
        }
        dropdown.setValue(this.plugin.options.defaultTimezone);
        dropdown.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ defaultTimezone: value }));
        });
      });
  }

  addDefaultColorSetting(): void {
    new Setting(this.containerEl)
      .setName("Cor padrão do evento")
      .setDesc("Cor usada nos dots e na lista")
      .addColorPicker((cp) => {
        cp.setValue(this.plugin.options.defaultEventColor);
        cp.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ defaultEventColor: value }));
        });
      });
  }

  addDefaultRemindSetting(): void {
    new Setting(this.containerEl)
      .setName("Lembrete padrão")
      .setDesc("Quanto tempo antes notificar")
      .addDropdown((d) => {
        d.addOption("0", "Na hora");
        d.addOption("5", "5 min antes");
        d.addOption("15", "15 min antes");
        d.addOption("30", "30 min antes");
        d.addOption("60", "1 hora antes");
        d.addOption("1440", "1 dia antes");
        d.setValue(String(this.plugin.options.defaultRemindBefore));
        d.onChange(async (v) => this.plugin.writeOptions(() => ({ defaultRemindBefore: Number(v) })));
      });
  }

  addEnableNotificationsSetting(): void {
    new Setting(this.containerEl)
      .setName("Ativar notificações toast")
      .setDesc("Mostra toast elegante quando o evento está próximo")
      .addToggle((t) => {
        t.setValue(this.plugin.options.enableEventNotifications);
        t.onChange(async (v) => this.plugin.writeOptions(() => ({ enableEventNotifications: v })));
      });
  }

  addGoogleSyncSetting(): void {
    new Setting(this.containerEl)
      .setName("Google Agenda - ativar")
      .setDesc("Quando ativo, sincroniza via Google Calendar API v3. Export .ics funciona offline.")
      .addToggle((t) => {
        t.setValue(this.plugin.options.googleSyncEnabled);
        t.onChange(async (v) => {
          this.plugin.writeOptions(() => ({ googleSyncEnabled: v }));
          this.display();
        });
      });
    if (this.plugin.options.googleSyncEnabled) {
      new Setting(this.containerEl)
        .setName("Google Client ID")
        .setDesc("Crie em console.cloud.google.com > APIs & Services > Credenciais (OAuth 2.0 Client ID - Desktop app)")
        .addText((tf) => {
          tf.setPlaceholder("123...apps.googleusercontent.com");
          tf.setValue(this.plugin.options.googleClientId);
          tf.onChange(async (v) => this.plugin.writeOptions(() => ({ googleClientId: v })));
        });
      new Setting(this.containerEl)
        .setName("Calendar ID")
        .setDesc("Normalmente 'primary' ou email do calendário compartilhado")
        .addText((tf) => {
          tf.setValue(this.plugin.options.googleCalendarId);
          tf.onChange(async (v) => this.plugin.writeOptions(() => ({ googleCalendarId: v })));
        });
      new Setting(this.containerEl)
        .setName("Google Access Token")
        .setDesc("Cole o access_token OAuth2. Clique em Autorizar para obter via Google e cole o token aqui. Use https://developers.google.com/oauthplayground com scope calendar.events")
        .addText((tf) => {
          tf.setPlaceholder("ya29.a0Af...");
          tf.setValue(this.plugin.options.googleAccessToken);
          // obscure?
          (tf.inputEl as HTMLInputElement).type = "password";
          tf.onChange(async (v) => this.plugin.writeOptions(() => ({ googleAccessToken: v })));
        })
        .addButton((btn) => {
          btn.setButtonText("Autorizar no Google");
          btn.onClick(async () => {
            if (!this.plugin.options.googleClientId) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              new (window as unknown as { Notice: new (msg:string)=>unknown }).Notice("Configure o Client ID primeiro");
              return;
            }
            const { buildGoogleAuthUrl } = await import("src/integrations/google");
            const url = buildGoogleAuthUrl(this.plugin.options.googleClientId);
            window.open(url, "_blank");
          });
        })
        .addButton((btn) => {
          btn.setButtonText("Validar token");
          btn.onClick(async () => {
            const { validateGoogleToken } = await import("src/integrations/google");
            const ok = await validateGoogleToken(this.plugin.options.googleAccessToken);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const NoticeClass = (window as unknown as { Notice: new (msg:string)=>unknown }).Notice;
            new NoticeClass(ok ? "Token válido ✓" : "Token inválido ou expirado");
          });
        });
      this.containerEl.createEl("p", {
        cls: "setting-item-description",
        text: "Fluxo recomendado: 1) Crie Client ID Desktop, 2) Clique Autorizar, 3) copie o code exibido, 4) troque por access_token via POST https://oauth2.googleapis.com/token ou use OAuth Playground para gerar token e cole acima. O plugin usa Bearer token para POST /calendar/v3/calendars/{id}/events.",
      });
    }
  }

  addEmailWebhookSetting(): void {
    new Setting(this.containerEl)
      .setName("Email webhook - ativar")
      .setDesc("Envia lembrete via POST para webhook (n8n, Make, EmailJS)")
      .addToggle((t) => {
        t.setValue(this.plugin.options.emailEnabled);
        t.onChange(async (v) => {
          this.plugin.writeOptions(() => ({ emailEnabled: v }));
          this.display();
        });
      });
    if (this.plugin.options.emailEnabled) {
      new Setting(this.containerEl)
        .setName("Webhook URL")
        .setDesc("POST JSON {subject, text, event}")
        .addText((tf) => {
          tf.setPlaceholder("https://n8n.exemplo.com/webhook/...");
          tf.setValue(this.plugin.options.emailWebhookUrl);
          tf.onChange(async (v) => this.plugin.writeOptions(() => ({ emailWebhookUrl: v })));
        });
    }
  }

  addLocaleOverrideSetting(): void {
    const { moment } = window;

    const sysLocale = navigator.language?.toLowerCase();

    new Setting(this.containerEl)
      .setName("Override locale:")
      .setDesc(
        "Set this if you want to use a locale different from the default"
      )
      .addDropdown((dropdown) => {
        dropdown.addOption("system-default", `Same as system (${sysLocale})`);
        moment.locales().forEach((locale) => {
          dropdown.addOption(locale, locale);
        });
        dropdown.setValue(this.plugin.options.localeOverride);
        dropdown.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            localeOverride: value as ILocaleOverride,
          }));
        });
      });
  }
}
