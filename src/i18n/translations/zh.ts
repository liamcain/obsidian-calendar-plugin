import type { TranslationKey } from './en';

export const zh: Record<TranslationKey, string> = {
  // Commands
  'command.openCalendarView': '打开日历视图',
  'command.openWeeklyNote': '打开周记',
  'command.openMonthlyNote': '打开月记',
  'command.revealActiveNote': '显示当前笔记',
  
  // Settings - General
  'settings.general': '通用设置',
  'settings.wordsPerDot': '每点代表字数',
  'settings.wordsPerDot.desc': '一个点代表多少个字？',
  'settings.weekStart': '每周起始日：',
  'settings.weekStart.desc': '选择一周从哪一天开始。选择"区域默认"使用 moment.js 指定的默认值',
  'settings.weekStart.localeDefault': '区域默认 ({day})',
  'settings.confirmCreate': '创建新笔记前确认',
  'settings.confirmCreate.desc': '创建新笔记前显示确认对话框',
  'settings.showWeekNumber': '显示周数',
  'settings.showWeekNumber.desc': '启用此选项以添加周数列',
  
  // Settings - Weekly Notes
  'settings.weekly': '周记设置',
  'settings.weekly.moving': '注意：周记设置即将迁移。建议安装 "Periodic Notes" 插件以保持未来功能。',
  'settings.weekly.format': '周记格式',
  'settings.weekly.format.desc': '更多语法帮助，请参考格式参考',
  'settings.weekly.template': '周记模板',
  'settings.weekly.template.desc': '选择要用作周记模板的文件',
  'settings.weekly.folder': '周记文件夹',
  'settings.weekly.folder.desc': '新的周记将放在此处',
  
  // Settings - Monthly Notes
  'settings.monthly': '月记设置',
  'settings.monthly.show': '显示月记',
  'settings.monthly.show.desc': '启用月记支持（格式：YYYY-MM）',
  'settings.monthly.dotColor': '月记小点颜色',
  'settings.monthly.dotColor.desc': '日历上月记任务小点的颜色（CSS 颜色值，如 #9b59b6、purple）',
  
  // Settings - Canvas Schedules
  'settings.canvasSchedules': 'Canvas 日程设置',
  'settings.canvasSchedules.show': '显示 Canvas 日程',
  'settings.canvasSchedules.show.desc': '从 canvas 文件导入日程（日期从 memos-meta 注释中读取）',
  'settings.canvasSchedules.folder': 'Canvas 日程文件夹',
  'settings.canvasSchedules.folder.desc': '扫描 .canvas 文件的文件夹。留空则扫描整个库',
  'settings.canvasSchedules.dotColor': 'Canvas 日程小点颜色',
  'settings.canvasSchedules.dotColor.desc': '日历上 Canvas 日程小点的颜色（CSS 颜色值，如 #3498db、blue）',
  
  // Settings - Advanced
  'settings.advanced': '高级设置',
  'settings.locale': '覆盖区域设置：',
  'settings.locale.desc': '如果你想使用与默认不同的区域设置，请设置此项',
  'settings.locale.systemDefault': '与系统相同 ({locale})',
  
  // Settings - Banner
  'settings.banner.dailyNotesDisabled': '⚠️ 日记插件未启用',
  'settings.banner.dailyNotesDisabled.desc': '日历最好与日记插件或周期笔记插件（可在社区插件目录中找到）配合使用。',
  
  // Modal - Date Action
  'modal.dateAction.openDailyNote': '打开日记',
  'modal.dateAction.openMonthlyNote': '打开月记',
  'modal.dateAction.createDailyNote': '创建日记',
  'modal.dateAction.createMonthlyNote': '创建月记',
  'modal.dateAction.cancel': '取消',
  
  // Modal - Confirmation
  'modal.confirmation.neverMind': '取消',
  
  // Calendar - Display
  'calendar.title': '日历',
  'calendar.canvasSchedules': 'Canvas 日程',
  
  // Calendar - Errors
  'error.dailyNotesFolder': '[Calendar] 找不到日记文件夹',
  'error.weeklyNotesFolder': '[Calendar] 找不到周记文件夹',
  'error.monthlyNotesFolder': '[Calendar] 找不到月记文件夹',
  'error.readMonthlyNote': '[Calendar] 读取月记失败',
  'error.canvasSchedules': '[Calendar] 读取 Canvas 日程失败',
};
