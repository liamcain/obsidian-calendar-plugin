export const en = {
  // Commands
  'command.openCalendarView': 'Open view',
  'command.openWeeklyNote': 'Open Weekly Note',
  'command.openMonthlyNote': 'Open Monthly Note',
  'command.revealActiveNote': 'Reveal active note',
  
  // Settings - General
  'settings.general': 'General Settings',
  'settings.wordsPerDot': 'Words per dot',
  'settings.wordsPerDot.desc': 'How many words should be represented by a single dot?',
  'settings.weekStart': 'Start week on:',
  'settings.weekStart.desc': 'Choose what day of the week to start. Select \'Locale default\' to use the default specified by moment.js',
  'settings.weekStart.localeDefault': 'Locale default ({day})',
  'settings.confirmCreate': 'Confirm before creating new note',
  'settings.confirmCreate.desc': 'Show a confirmation modal before creating a new note',
  'settings.showWeekNumber': 'Show week number',
  'settings.showWeekNumber.desc': 'Enable this to add a column with the week number',
  
  // Settings - Weekly Notes
  'settings.weekly': 'Weekly Note Settings',
  'settings.weekly.moving': 'Note: Weekly Note settings are moving. You are encouraged to install the \'Periodic Notes\' plugin to keep the functionality in the future.',
  'settings.weekly.format': 'Weekly note format',
  'settings.weekly.format.desc': 'For more syntax help, refer to format reference',
  'settings.weekly.template': 'Weekly note template',
  'settings.weekly.template.desc': 'Choose the file you want to use as the template for your weekly notes',
  'settings.weekly.folder': 'Weekly note folder',
  'settings.weekly.folder.desc': 'New weekly notes will be placed here',
  
  // Settings - Monthly Notes
  'settings.monthly': 'Monthly Note Settings',
  'settings.monthly.show': 'Show monthly notes',
  'settings.monthly.show.desc': 'Enable monthly note support (format: YYYY-MM)',
  'settings.monthly.dotColor': 'Monthly dot color',
  'settings.monthly.dotColor.desc': 'Color for monthly task dots on the calendar (CSS color, e.g. #9b59b6, purple)',

  // Settings - Canvas Schedules
  'settings.canvasSchedules': 'Canvas Schedule Settings',
  'settings.canvasSchedules.show': 'Show canvas schedules',
  'settings.canvasSchedules.show.desc': 'Import schedules from canvas files (dates are read from memos-meta comments)',
  'settings.canvasSchedules.folder': 'Canvas schedules folder',
  'settings.canvasSchedules.folder.desc': 'Folder to scan for .canvas files. Leave empty to scan the whole vault',
  'settings.canvasSchedules.dotColor': 'Canvas schedule dot color',
  'settings.canvasSchedules.dotColor.desc': 'Color for canvas schedule dots on the calendar (CSS color, e.g. #3498db, blue)',
  
  // Settings - Advanced
  'settings.advanced': 'Advanced Settings',
  'settings.locale': 'Override locale:',
  'settings.locale.desc': 'Set this if you want to use a locale different from the default',
  'settings.locale.systemDefault': 'Same as system ({locale})',
  
  // Settings - Banner
  'settings.banner.dailyNotesDisabled': '⚠️ Daily Notes plugin not enabled',
  'settings.banner.dailyNotesDisabled.desc': 'The calendar is best used in conjunction with either the Daily Notes plugin or the Periodic Notes plugin (available in the Community Plugins catalog).',
  
  // Modal - Date Action
  'modal.dateAction.openDailyNote': 'Open daily note',
  'modal.dateAction.openMonthlyNote': 'Open monthly note',
  'modal.dateAction.createDailyNote': 'Create daily note',
  'modal.dateAction.createMonthlyNote': 'Create monthly note',
  'modal.dateAction.cancel': 'Cancel',
  
  // Modal - Confirmation
  'modal.confirmation.neverMind': 'Never mind',
  
  // Calendar - Display
  'calendar.title': 'Calendar',
  'calendar.canvasSchedules': 'Canvas Schedules',
  
  // Calendar - Errors
  'error.dailyNotesFolder': '[Calendar] Failed to find daily notes folder',
  'error.weeklyNotesFolder': '[Calendar] Failed to find weekly notes folder',
  'error.monthlyNotesFolder': '[Calendar] Failed to find monthly notes folder',
  'error.readMonthlyNote': '[Calendar] Failed to read monthly note',
  'error.canvasSchedules': '[Calendar] Failed to read canvas schedules',
};

export type TranslationKey = keyof typeof en;
