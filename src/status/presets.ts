/**
 * Preset status tags, mood tags, and weather code mappings.
 * Users can customize these via Settings; presets serve as defaults.
 */

// ===== Status Presets =====

export interface IStatusPreset {
  id: string;
  label: { zh: string; en: string };
  emoji: string;
  color: string;
  category: "work" | "study" | "life" | "festival";
  aliases: string[];
  enabled: boolean;
}

export const STATUS_PRESETS: IStatusPreset[] = [
  { id: "leave",      label: { zh: "请假",   en: "Leave"      }, emoji: "🏖️", color: "#F97316", category: "work",     aliases: ["请假", "leave", "休", "🏖️"], enabled: true },
  { id: "outing",     label: { zh: "外出",   en: "Outing"     }, emoji: "🚶", color: "#3B82F6", category: "work",     aliases: ["外出", "outing", "🚶"], enabled: true },
  { id: "class",      label: { zh: "上课",   en: "Class"      }, emoji: "📚", color: "#8B5CF6", category: "study",    aliases: ["上课", "class", "📚"], enabled: true },
  { id: "slack",      label: { zh: "摸鱼",   en: "Slack"      }, emoji: "🐟", color: "#10B981", category: "work",     aliases: ["摸鱼", "slack", "🐟"], enabled: true },
  { id: "sick",       label: { zh: "病假",   en: "Sick"       }, emoji: "🤒", color: "#EF4444", category: "life",     aliases: ["病假", "sick", "🤒", "生病"], enabled: true },
  { id: "travel",     label: { zh: "出差",   en: "Travel"     }, emoji: "✈️", color: "#06B6D4", category: "work",     aliases: ["出差", "travel", "✈️"], enabled: true },
  { id: "remote",     label: { zh: "远程",   en: "Remote"     }, emoji: "🏠", color: "#6366F1", category: "work",     aliases: ["远程", "remote", "居家", "🏠"], enabled: true },
  { id: "holiday",    label: { zh: "节假日", en: "Holiday"    }, emoji: "🎉", color: "#DC2626", category: "festival", aliases: ["节假日", "holiday", "节日", "🎉"], enabled: true },
  { id: "overtime",   label: { zh: "加班",   en: "Overtime"   }, emoji: "🔥", color: "#F59E0B", category: "work",     aliases: ["加班", "overtime", "🔥"], enabled: true },
  { id: "meeting",    label: { zh: "会议",   en: "Meeting"    }, emoji: "📅", color: "#0EA5E9", category: "work",     aliases: ["会议", "开会", "meeting", "📅"], enabled: true },
  { id: "study",      label: { zh: "自习",   en: "Study"      }, emoji: "✏️", color: "#7C3AED", category: "study",    aliases: ["自习", "学习", "study", "✏️"], enabled: true },
  { id: "rest",       label: { zh: "休息",   en: "Rest"       }, emoji: "☕", color: "#14B8A6", category: "life",     aliases: ["休息", "rest", "☕"], enabled: true },
  { id: "exercise",   label: { zh: "运动",   en: "Exercise"   }, emoji: "💪", color: "#22C55E", category: "life",     aliases: ["运动", "exercise", "健身", "💪"], enabled: true },
  { id: "non-workday", label: { zh: "非工作日", en: "Non-workday" }, emoji: "💤", color: "#64748B", category: "festival", aliases: ["非工作日", "non-workday", "nonworkday", "💤"], enabled: true },
];

// ===== Mood Presets =====

export interface IMoodPreset {
  id: string;
  label: { zh: string; en: string };
  emoji: string;
  color: string;
  aliases: string[];
}

export const MOOD_PRESETS: IMoodPreset[] = [
  { id: "great",  label: { zh: "超赞", en: "Great"  }, emoji: "😄", color: "#FBBF24", aliases: ["超赞", "great", "😄", "棒"] },
  { id: "good",   label: { zh: "不错", en: "Good"   }, emoji: "🙂", color: "#86EFAC", aliases: ["不错", "good", "🙂", "好"] },
  { id: "okay",   label: { zh: "一般", en: "Okay"   }, emoji: "😐", color: "#D1D5DB", aliases: ["一般", "okay", "😐", "还行"] },
  { id: "bad",    label: { zh: "不佳", en: "Bad"    }, emoji: "😕", color: "#FCA5A5", aliases: ["不佳", "bad", "😕", "差"] },
  { id: "awful",  label: { zh: "糟糕", en: "Awful"  }, emoji: "😫", color: "#7F1D1D", aliases: ["糟糕", "awful", "😫", "崩溃"] },
];

// ===== WMO Weather Code Mapping =====

export interface IWeatherMapping {
  id: string;
  labelZh: string;
  labelEn: string;
  emoji: string;
  wmoCodes: number[];
}

export const WMO_WEATHER_MAP: IWeatherMapping[] = [
  { id: "sunny",            labelZh: "晴",       labelEn: "Clear sky",          emoji: "☀️", wmoCodes: [0] },
  { id: "mainly_clear",     labelZh: "晴间多云",  labelEn: "Mainly clear",       emoji: "🌤️", wmoCodes: [1] },
  { id: "cloudy",           labelZh: "多云",     labelEn: "Partly cloudy",      emoji: "⛅",  wmoCodes: [2] },
  { id: "overcast",         labelZh: "阴",       labelEn: "Overcast",           emoji: "☁️", wmoCodes: [3] },
  { id: "fog",              labelZh: "雾",       labelEn: "Fog",                emoji: "🌫️", wmoCodes: [45, 48] },
  { id: "drizzle",          labelZh: "毛毛雨",   labelEn: "Drizzle",            emoji: "🌦️", wmoCodes: [51, 53, 55] },
  { id: "freezing_drizzle", labelZh: "冻毛毛雨", labelEn: "Freezing drizzle",   emoji: "🌧️", wmoCodes: [56, 57] },
  { id: "rain",             labelZh: "雨",       labelEn: "Rain",               emoji: "🌧️", wmoCodes: [61, 63, 65] },
  { id: "freezing_rain",    labelZh: "冻雨",     labelEn: "Freezing rain",      emoji: "🌧️", wmoCodes: [66, 67] },
  { id: "snow",             labelZh: "雪",       labelEn: "Snow",               emoji: "🌨️", wmoCodes: [71, 73, 75, 77] },
  { id: "rain_showers",     labelZh: "阵雨",     labelEn: "Rain showers",       emoji: "🌦️", wmoCodes: [80, 81, 82] },
  { id: "snow_showers",     labelZh: "阵雪",     labelEn: "Snow showers",       emoji: "🌨️", wmoCodes: [85, 86] },
  { id: "thunderstorm",     labelZh: "雷暴",     labelEn: "Thunderstorm",       emoji: "⛈️", wmoCodes: [95] },
  { id: "thunderstorm_hail",labelZh: "雷暴冰雹", labelEn: "Thunderstorm + hail",emoji: "⛈️", wmoCodes: [96, 99] },
];

/** Map a WMO code to a weather mapping entry */
export function wmoToWeather(wmoCode: number): IWeatherMapping | null {
  for (const entry of WMO_WEATHER_MAP) {
    if (entry.wmoCodes.includes(wmoCode)) return entry;
  }
  return null;
}
