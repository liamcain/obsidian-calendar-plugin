# Obsidian Calendar+ 个性化日历状态优化方案

> **文档版本**: v1.1  
> **日期**: 2026-07-24  
> **作者**: 产品经理 Agent  
> **状态**: 设计稿 (Draft)  
> **适用项目**: [obsidian-calendar-plugin](https://github.com/holdyounger/obsidian-calendar-plugin) (fork of liamcain/obsidian-calendar-plugin)

---

## 目录

1. [竞品/参考项目分析](#1-竞品参考项目分析)
2. [国际化 Tag 体系设计](#2-国际化-tag-体系设计)
3. [个性化日历配置](#3-个性化日历配置)
4. [frontmatter 规范设计](#4-frontmatter-规范设计)
5. [Settings UI 设计](#5-settings-ui-设计)
6. [CSS 样式方案](#6-css-样式方案)
7. [数据流设计](#7-数据流设计)
8. [向后兼容](#8-向后兼容)

---

## 1. 竞品/参考项目分析

### 1.1 liamcain/obsidian-calendar-plugin (基座项目)

- **仓库**: https://github.com/liamcain/obsidian-calendar-plugin
- **状态标记机制**:
  - 基于字数的 dot 系统（words per dot），纯视觉量化写作量
  - 空心 dot 表示有未完成任务
  - 无状态标签概念，只有「有笔记/无笔记」二元状态
- **可借鉴之处**:
  - CSS 变量驱动的主题系统（`--color-background-day`, `--color-dot` 等）
  - `ICalendarSource` 接口设计：`getDailyMetadata()` 返回 `{ classes, dots, dataAttributes }`
  - 通过 dataAttributes 而非直接操作 DOM 实现样式注入 — 这是本优化的核心扩展点
  - 已有的 `customTagsSource` 已读取 frontmatter tags 并写入 `data-tags` / `data-emoji-tag`

### 1.2 obsidian-community/obsidian-full-calendar

- **仓库**: https://github.com/obsidian-community/obsidian-full-calendar
- **状态标记机制**:
  - 每个事件是一个独立 note，通过 frontmatter 存储 `title`, `startDate`, `endDate`, `type` 等字段
  - 支持从 daily note 的 frontmatter 中提取事件列表
  - 支持只读 ICS / CalDAV 远程日历
- **可借鉴之处**:
  - frontmatter 作为事件数据源的成熟模式
  - `type` 字段映射不同事件样式的思路
  - 多来源聚合（本地 note + 远程 ICS）的架构

### 1.3 TheInGoF/pixel-year

- **仓库**: https://github.com/TheInGoF/pixel-year
- **状态标记机制**:
  - "Year in Pixels" 网格：列=月份，行=日期，每格填色代表当日状态
  - 用户自定义颜色方案映射不同心情/活动
  - 支持公共假日 + 学校假期 overlay（130+ 国家，27 种 UI 语言）
  - 双国家叠加显示（斜分割线）
- **可借鉴之处**:
  - **颜色到状态映射**的用户自定义模式
  - 27 种 UI 语言的 i18n 实践
  - 独立 language / country / region 三维度选择，启发「语言无关 tag 体系」
  - 自定义日期范围输入（用户粘贴自己的假日数据）

### 1.4 Lihu0/year-in-pixels

- **仓库**: https://github.com/Lihu0/year-in-pixels
- **状态标记机制**:
  - 每日一个 pixel，颜色对应该日心情/活动
  - 完全可自定义的颜色方案
  - 多年支持
  - localStorage 自动保存 + navigator.storage.persist
  - 导出 PNG / JSON，导入 JSON
- **可借鉴之处**:
  - 颜色方案的用户自由度（不预设固定 mood，让用户定义自己的调色板）
  - JSON 导入/导出 — 启发状态配置也应支持导入导出
  - 极简交互：一天一点击选颜色，降低使用门槛

### 1.5 Daylio (移动应用参考)

- **类型**: 商业移动应用（非开源）
- **状态标记机制**:
  - 预设 mood 等级（5 档：rad 到 awful），每档对应颜色
  - 每日可添加活动标签（从用户自定义列表中选择）
  - 周报/月报/年报统计图表
  - 每个 mood 等级有对应 emoji
- **可借鉴之处**:
  - **mood 等级 + 颜色 + emoji** 三元组设计
  - 活动标签的自定义列表模式（用户定义标签库）
  - 统计视图（月度心情分布、年度趋势）

### 竞品总结对比

| 项目 | 状态来源 | 标记方式 | i18n | 自定义程度 |
|------|----------|----------|------|-----------|
| obsidian-calendar-plugin | 字数/任务 | dots | 否 | 低（仅 CSS） |
| obsidian-full-calendar | frontmatter 事件 | 事件块 | 否 | 中 |
| pixel-year | 手动/假日API | 像素填色 | 是, 27语言 | 高 |
| year-in-pixels | 手动 | 像素填色 | 否 | 高 |
| Daylio | 手动选择 | 颜色+emoji | 是 | 中 |
| **Calendar+ (本方案)** | **frontmatter tags** | **背景色+emoji+tooltip** | **是, 中英双语** | **高** |

---

## 2. 国际化 Tag 体系设计

### 2.1 设计目标

- 用户可用中文、英文或 emoji 任一形式书写 tag，系统自动识别为同一状态
- 预置常见状态（开箱即用），同时支持完全自定义
- tag 到视觉样式（颜色 + 图标）的映射可配置
- 不依赖特定语言，方便多语言用户切换

### 2.2 预置状态标签 (Preset Status Tags)

系统内置一组常见生活状态，每个状态有中英文别名和默认 emoji/颜色：

| ID | 中文 | 英文 | Emoji | 默认颜色 | 类别 |
|----|------|------|-------|---------|------|
| `leave` | 请假 | leave | 🏖️ | `#F97316` (橙) | 工作 |
| `outing` | 外出 | outing | 🚶 | `#3B82F6` (蓝) | 工作 |
| `class` | 上课 | class | 📚 | `#8B5CF6` (紫) | 学习 |
| `slack` | 摸鱼 | slack | 🐟 | `#10B981` (绿) | 工作 |
| `sick` | 病假 | sick | 🤒 | `#EF4444` (红) | 生活 |
| `travel` | 出差 | travel | ✈️ | `#06B6D4` (青) | 工作 |
| `remote` | 远程 | remote | 🏠 | `#6366F1` (靛) | 工作 |
| `holiday` | 节假日 | holiday | 🎉 | `#DC2626` (深红) | 节日 |
| `non-workday` | 非工作日 | non-workday | 💤 | `#64748B` (灰) | 节日 |
| `overtime` | 加班 | overtime | 🔥 | `#F59E0B` (琥珀) | 工作 |
| `meeting` | 会议 | meeting | 📅 | `#0EA5E9` (天蓝) | 工作 |
| `study` | 自习 | study | ✏️ | `#7C3AED` (深紫) | 学习 |
| `rest` | 休息 | rest | ☕ | `#14B8A6` (蓝绿) | 生活 |
| `exercise` | 运动 | exercise | 💪 | `#22C55E` (亮绿) | 生活 |
| `mood-great` | 超赞 | great | 😄 | `#FBBF24` (金黄) | 心情 |
| `mood-good` | 不错 | good | 🙂 | `#86EFAC` (浅绿) | 心情 |
| `mood-okay` | 一般 | okay | 😐 | `#D1D5DB` (浅灰) | 心情 |
| `mood-bad` | 不好 | bad | 😕 | `#FCA5A5` (浅红) | 心情 |
| `mood-awful` | 糟糕 | awful | 😢 | `#7F1D1D` (暗红) | 心情 |

### 2.3 Tag 别名机制 (Alias System)

每个状态有一个**规范化 ID**（如 `leave`），用户书写时以下任何形式都会被识别为同一状态：

```
别名解析规则:
  "请假" -> leave
  "leave" -> leave
  "🏖️" -> leave
  "休" -> leave  (用户自定义别名)
```

**别名解析流程**:

```
用户 frontmatter tag
    |
    v
[1] 精确匹配 preset aliases (中/英/emoji)
    |  未命中
    v
[2] 精确匹配 user-defined aliases
    |  未命中
    v
[3] 模糊匹配（编辑距离 <= 2）
    |  未命中
    v
[4] 作为未知 tag 处理（显示原始文本，默认样式）
```

**配置数据结构** (`data.json` 中的 `statusConfig`):

```json
{
  "statusConfig": {
    "version": 1,
    "presets": {
      "leave": {
        "label": { "zh": "请假", "en": "Leave" },
        "emoji": "🏖️",
        "color": "#F97316",
        "category": "work",
        "enabled": true
      },
      "outing": {
        "label": { "zh": "外出", "en": "Outing" },
        "emoji": "🚶",
        "color": "#3B82F6",
        "category": "work",
        "enabled": true
      }
    },
    "custom": {
      "gaming": {
        "label": { "zh": "打游戏", "en": "Gaming" },
        "emoji": "🎮",
        "color": "#A855F7",
        "category": "life"
      }
    },
    "aliases": {
      "请假": "leave",
      "leave": "leave",
      "休": "leave",
      "外出": "outing",
      "outing": "outing",
      "打游戏": "gaming",
      "gaming": "gaming"
    }
  }
}
```

### 2.4 用户自定义流程

```
用户在 Settings 中:
  1. 「+ 添加状态」-> 输入中/英文名称、选 emoji、选颜色
  2. 自动生成 canonical ID (slugify 英文名)
  3. 自动注册别名（中文名、英文名、emoji 均为别名）
  4. 用户可手动追加别名（如 "休" -> leave）
  5. 可导入/导出 JSON 配置（方便多 vault 同步）
```

---

## 3. 个性化日历配置

### 3.1 心情标签 (Mood Tracking)

**数据来源**: daily note frontmatter 的 `mood` 字段

```yaml
---
date: 2026-07-24
mood: great   # 或 "超赞" 或 "😄" — 别名同样有效
---
```

**日历展示**:
- 在日历格子右下角显示 mood emoji（小字号，不干扰主内容）
- 背景色叠加 mood 对应颜色的 10% 透明度
- hover 时 tooltip 显示「心情：超赞 😄」

**多心情支持**:

```yaml
mood:
  - great
  - tired
```

多个 mood emoji 并排显示，背景色取第一个 mood 的颜色。

### 3.2 天气状况 (Weather — API 自动获取)

**设计理念**: 天气数据不应依赖用户手动填写，而应通过公开 API 自动获取并写入 daily note frontmatter，实现「无感记录」。

#### 3.2.1 数据来源：Open-Meteo API

选用 [Open-Meteo](https://open-meteo.com/) 作为天气数据源：

- **免费开源**，无需 API Key，无注册门槛
- **全球覆盖**，支持经纬度查询
- **历史数据 API**（Archive API）可用于补全过去的天气
- **响应快速**，平均 < 200ms
- **WMO Weather Code** 标准天气编码

**API 端点**:

```
# 当天天气（实时）
https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code,relative_humidity_2m&timezone=Asia/Shanghai

# 历史天气（补全）
https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=Asia/Shanghai
```

**WMO Weather Code 映射表**:

| WMO Code | 天气描述 | 中文 | Emoji | canonical ID |
|----------|---------|------|-------|-------------|
| 0 | Clear sky | 晴 | ☀️ | `sunny` |
| 1 | Mainly clear | 晴间多云 | 🌤️ | `mainly_clear` |
| 2 | Partly cloudy | 多云 | ⛅ | `cloudy` |
| 3 | Overcast | 阴 | ☁️ | `overcast` |
| 45, 48 | Fog | 雾 | 🌫️ | `fog` |
| 51, 53, 55 | Drizzle | 毛毛雨 | 🌦️ | `drizzle` |
| 56, 57 | Freezing drizzle | 冻毛毛雨 | 🌧️ | `freezing_drizzle` |
| 61, 63, 65 | Rain | 雨 | 🌧️ | `rain` |
| 66, 67 | Freezing rain | 冻雨 | 🌧️ | `freezing_rain` |
| 71, 73, 75 | Snow fall | 雪 | 🌨️ | `snow` |
| 77 | Snow grains | 米雪 | 🌨️ | `snow_grains` |
| 80, 81, 82 | Rain showers | 阵雨 | 🌦️ | `rain_showers` |
| 85, 86 | Snow showers | 阵雪 | 🌨️ | `snow_showers` |
| 95 | Thunderstorm | 雷暴 | ⛈️ | `thunderstorm` |
| 96, 99 | Thunderstorm with hail | 雷暴伴冰雹 | ⛈️ | `thunderstorm_hail` |

#### 3.2.2 城市定位策略

```
插件启动 / 用户开启天气功能
  |
  v
[1] 尝试 IP 定位（免费 GeoIP 服务）
    |-- 请求: https://ipapi.co/json/ 或 http://ip-api.com/json/
    |-- 获取: latitude, longitude, city_name
    |-- 成功 -> 保存坐标 + 城市名到 settings
    |-- 失败 ↓
  v
[2] 用户手动输入城市
    |-- Settings 中显示输入框: "请输入你的城市名称"
    |-- 用户输入后通过 Open-Meteo Geocoding API 查询坐标
    |-- 请求: https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=zh
    |-- 保存坐标 + 城市名到 settings
  v
[3] 坐标确定后，后续天气查询直接使用保存的坐标
```

**定位优先级**: 用户手动输入 > IP 定位结果

**Settings 中的城市配置**:
```
城市: 北京 (39.9042, 116.4074)  [修改]
```

用户可随时点击「修改」重新输入城市名称，坐标将自动更新。

#### 3.2.3 自动写入模式

当天气功能开启时，插件会在**创建或打开当天 daily note** 时自动将天气数据写入 frontmatter：

```yaml
---
date: 2026-07-24
tags:
  - 日报
weather: sunny          # 自动写入（WMO code 映射的 canonical ID）
weather_name: 多云       # 自动写入（中文名称）
temperature: 25.9       # 自动写入（实时温度 °C）
weather_wmo: 2          # 自动写入（原始 WMO code，用于精确识别）
---
```

**写入时机**:
1. **创建新 daily note** → 创建后立即写入当天天气
2. **打开已有 daily note**（无天气字段时）→ 追加写入
3. **已有天气字段** → 不覆盖（尊重用户可能的手动修改）
4. **定时刷新**（可选）→ 每隔 N 小时更新当天天气（仅更新 temperature，不覆盖 weather 类型）

**写入逻辑伪代码**:
```typescript
async function autoWriteWeather(file: TFile, date: Moment) {
  const cache = app.metadataCache.getFileCache(file);
  const fm = cache?.frontmatter || {};

  // 已有天气字段则跳过（不覆盖用户修改）
  if (fm.weather) return;

  const weather = await fetchWeatherFromAPI(date);
  await app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter.weather = weather.id;        // "sunny"
    frontmatter.weather_name = weather.name;  // "晴"
    frontmatter.temperature = weather.temp;   // 25.9
    frontmatter.weather_wmo = weather.wmo;    // 0
  });
}
```

#### 3.2.4 日历展示

- 日历格子**左上角**显示天气 emoji（小字号 9px，不干扰主内容）
- **不影响背景色**（天气是信息标注，不是状态标记）
- hover tooltip: 「天气：多云 ⛅ 25.9°C」
- 天气数据来源于已写入的 frontmatter 字段（而非每次渲染都调 API）

#### 3.2.5 缓存策略

- **按日期+坐标缓存**天气数据，key = `{lat},{lon},{YYYY-MM-DD}`
- 缓存存储在插件配置目录 `weather-cache.json`
- 当天天气缓存 TTL = 2 小时（可配置），历史天气永久缓存
- API 请求失败时使用缓存数据（降级策略）

#### 3.2.6 离线降级

- 网络不可用 → 使用缓存数据
- 缓存也不可用 → 日历不显示天气 emoji，tooltip 显示「天气：未知」
- 不影响其他日历功能正常运行

### 3.3 自定义属性 (Custom Attributes)

用户可定义任意自定义个性化属性，格式同 mood/weather：

```yaml
---
sleep_hours: 7.5
steps: 12000
coffee: 3
---
```

这些不会直接渲染在日历格子上，但可通过 tooltip 或 hover panel 展示。用户可通过 Settings 配置哪些自定义属性在 tooltip 中显示。

---

## 4. frontmatter 规范设计

### 4.1 推荐的完整 frontmatter 结构

```yaml
---
# === 基础字段 (Obsidian 原生) ===
date: 2026-07-24
tags:
  - 日报
  - 请假

# === Calendar+ 状态字段 (新增) ===
status: leave          # 当日主状态（单值，优先级最高）
mood: great            # 心情（单值或多值）
weather: sunny         # 天气（API 自动写入，也可手动修改）
weather_name: 晴       # 天气中文名（自动写入）
temperature: 32        # 温度 °C（自动写入）
weather_wmo: 0         # WMO code（自动写入，用于精确识别）

# === 扩展字段 ===
sleep_hours: 7.5       # 睡眠时长
steps: 12000           # 步数
note: "今天心情不错"    # 备注（显示在 tooltip）
---
```

### 4.2 字段优先级与冲突处理

当日历需要决定一个格子的「主状态」时，按以下优先级：

```
1. status 字段（显式声明，最高优先级）
2. tags 中的状态 tag（从 tags 数组中匹配已知状态 tag）
3. holiday.json 中的假日/请假/非工作日标记
4. 无状态（普通日）
```

**冲突场景处理**:

| 场景 | 处理方式 |
|------|---------|
| `status: leave` + `tags: [请假]` | 两者指向同一状态，正常显示 |
| `status: leave` + `tags: [outing]` | status 优先，outing 作为次要标签显示在 tooltip |
| `tags: [请假, 外出]` | 第一个匹配的状态 tag 为主状态 |
| `status: leave` + holiday.json 标记为 holiday | status 优先（用户显式声明覆盖自动数据） |

### 4.3 兼容现有 frontmatter 的字段映射

```yaml
# 现有格式 (当前用户已在用)
---
tags:
  - 日报
  - 请假
---

# 等价的新格式 (可选，更规范)
---
tags:
  - 日报
status: leave
---
```

系统同时支持两种写法。`tags` 中的状态 tag 通过别名系统自动解析。

### 4.4 frontmatter Schema (TypeScript)

```typescript
interface IDailyNoteFrontmatter {
  // 基础
  date?: string;                    // YYYY-MM-DD
  tags?: string[] | string;         // Obsidian 原生 tags

  // Calendar+ 状态
  status?: string | string[];       // 状态 tag (单值或多值)
  mood?: string | string[];         // 心情 (单值或多值)

  // 天气（API 自动写入，用户也可手动修改）
  weather?: string;                 // 天气 canonical ID (sunny / cloudy / ...)
  weather_name?: string;            // 天气中文名 (晴 / 多云 / ...)
  temperature?: number;             // 温度 °C
  weather_wmo?: number;             // WMO weather code (原始值)

  // 扩展 (用户自定义)
  [key: string]: any;               // 任意自定义字段
}
```

---

## 5. Settings UI 设计

### 5.1 整体结构

```
Settings -> Calendar Plugin
|-- General Settings (现有)
|-- Day Markers (现有，保留)
|-- [NEW] Status Tags
|   |-- Preset Status Tags
|   |   |-- [列表] 每行: emoji | 中英文标签 | 颜色色块 | 启用/禁用
|   |   |-- 点击展开 -> 编辑别名、颜色、emoji
|   |-- Custom Status Tags
|   |   |-- [列表] 同上
|   |   |-- [+ 添加状态] 按钮
|   |-- Alias Manager
|   |   |-- [表格] 别名 -> 规范ID
|   |-- Import / Export
|       |-- [导入 JSON] [导出 JSON]
|       |-- [恢复默认]
|-- [NEW] Mood Tracking
|   |-- Enable mood tracking [toggle]
|   |-- Mood field name: [text: "mood"]
|   |-- Show mood emoji on calendar [toggle]
|-- [NEW] Weather (API Auto-Fetch)
|   |-- Enable weather auto-fetch [toggle]
|   |-- City: 北京 (39.9042, 116.4074) [修改]
|   |-- Show weather emoji on calendar [toggle]
|   |-- Auto-write to daily note frontmatter [toggle]
|   |-- Refresh interval: [dropdown: 2h / 6h / 12h / 24h]
|-- [NEW] Tooltip Content
|   |-- Show status in tooltip [toggle]
|   |-- Show mood in tooltip [toggle]
|   |-- Show weather in tooltip [toggle]
|   |-- Custom tooltip fields: [text: "sleep_hours, steps"]
|-- Advanced Settings (现有)
```

###
### 5.2 Status Tag 编辑器交互

每个状态 tag 的编辑展开后显示：

```
+-----------------------------------------------+
|  Emoji  请假 / Leave                    [x]  |
|                                               |
|  Emoji:    [select]                           |
|  中文:     [请假        ]                     |
|  English:  [Leave        ]                    |
|  Color:    [#F97316  ]  (颜色选择器)          |
|  Category: [work v]                           |
|  Enabled:  [v]                                |
|                                               |
|  Aliases:                                     |
|  + 请假    -> leave                  [x]     |
|  + leave   -> leave                  [x]     |
|  + 休      -> leave                  [x]     |
|  [+ Add alias]                                |
+-----------------------------------------------+
```

### 5.3 添加自定义状态的流程

1. 用户点击「+ 添加状态」
2. 弹出 Modal：
   - 输入框：中文名称（必填）
   - 输入框：英文名称（必填）
   - Emoji 选择器（点击展开 emoji 面板）
   - 颜色选择器（色板 + 自定义 hex 输入）
   - 分类下拉框（work / study / life / mood / festival）
3. 点击「确认」-> 生成 canonical ID + 注册别名
4. 新状态出现在 Custom Status Tags 列表中

---

## 6. CSS 样式方案

### 6.1 CSS 变量扩展

在现有 CSS 变量体系基础上，新增状态颜色变量：

```css
#calendar-container {
  /* === 现有变量 (保留) === */
  --color-background-day: transparent;
  --color-background-weekend: transparent;
  --color-dot: var(--text-muted);
  --color-text-today: var(--interactive-accent);

  /* === 新增: 状态颜色 === */
  --status-color-leave: #F97316;
  --status-color-outing: #3B82F6;
  --status-color-class: #8B5CF6;
  --status-color-slack: #10B981;
  --status-color-sick: #EF4444;
  --status-color-travel: #06B6D4;
  --status-color-remote: #6366F1;
  --status-color-holiday: #DC2626;
  --status-color-non-workday: #64748B;
  --status-color-overtime: #F59E0B;
  --status-color-meeting: #0EA5E9;
  --status-color-study: #7C3AED;
  --status-color-rest: #14B8A6;
  --status-color-exercise: #22C55E;

  /* === 新增: Mood 颜色 === */
  --mood-color-great: #FBBF24;
  --mood-color-good: #86EFAC;
  --mood-color-okay: #D1D5DB;
  --mood-color-bad: #FCA5A5;
  --mood-color-awful: #7F1D1D;

  /* === 新增: 尺寸 === */
  --status-emoji-size: 10px;
  --mood-emoji-size: 10px;
  --weather-emoji-size: 9px;
  --status-label-font-size: 8px;
}
```

### 6.2 状态背景色方案

通过 `data-status` 属性选择器实现不同状态的背景色：

```css
/* 通用状态背景 -- 使用 data-status 属性 */
#calendar-container .day[data-status] {
  position: relative;
  background-color: color-mix(in srgb, var(--status-color, transparent) 12%, transparent);
}

#calendar-container .day[data-status]:hover {
  background-color: color-mix(in srgb, var(--status-color, transparent) 20%, transparent);
}

/* 特定状态覆盖 (向后兼容现有 class 写法) */
#calendar-container .day.is-holiday {
  --status-color: var(--status-color-holiday);
}
#calendar-container .day.is-leave-day {
  --status-color: var(--status-color-leave);
}
#calendar-container .day.is-nonworkday {
  --status-color: var(--status-color-non-workday);
}
```

### 6.3 Emoji 叠加层

在日历格子内通过伪元素和 span 显示 emoji：

```css
/* 状态 emoji -- 右上角 */
#calendar-container .day[data-status-emoji]::after {
  content: attr(data-status-emoji);
  position: absolute;
  top: 1px;
  right: 2px;
  font-size: var(--status-emoji-size);
  line-height: 1;
  pointer-events: none;
  opacity: 0.85;
}

/* 天气 emoji -- 左上角 */
#calendar-container .day[data-weather-emoji]::before {
  content: attr(data-weather-emoji);
  position: absolute;
  top: 1px;
  left: 2px;
  font-size: var(--weather-emoji-size);
  line-height: 1;
  pointer-events: none;
  opacity: 0.7;
}

/* 心情 emoji -- 右下角 (通过单独 span 元素插入) */
#calendar-container .day .mood-emoji {
  position: absolute;
  bottom: 1px;
  right: 2px;
  font-size: var(--mood-emoji-size);
  line-height: 1;
  pointer-events: none;
  opacity: 0.85;
}
```

### 6.4 状态标签文字 (底部)

```css
/* 状态名称 -- 底部小字 (仅在 hover 时显示) */
#calendar-container .day[data-status-label]::after {
  content: attr(data-status-label);
  position: absolute;
  bottom: 1px;
  right: 2px;
  font-size: var(--status-label-font-size);
  font-style: normal;
  font-weight: 400;
  opacity: 0;
  transition: opacity 0.15s ease;
  line-height: 1;
  pointer-events: none;
}

#calendar-container .day[data-status-label]:hover::after {
  opacity: 0.8;
}
```

### 6.5 完整的日历格子视觉结构

```
+--------------+
| Weather   StatusEmoji  <- 天气emoji (左上) + 状态emoji (右上)
|              |
|     24       |  <- 日期数字 (居中)
|              |
|           MoodEmoji  <- 心情emoji (右下, hover时显示标签)
+--------------+
     ^ 背景色: status 颜色 12% 透明度
```

---

## 7. 数据流设计

### 7.1 整体架构

```
+----------------------------------------------------+
|                   Daily Note File                    |
|  +----------------------------------------------+  |
|  | frontmatter:                                 |  |
|  |   tags: [日报, 请假]                          |  |
|  |   status: leave                               |  |
|  |   mood: great                                 |  |
|  |   weather: sunny                              |  |
|  |   temperature: 32                             |  |
|  +----------------------------------------------+  |
+-------------------+--------------------------------+
                    |
                    v
+----------------------------------------------------+
|              Obsidian MetadataCache                  |
|  (Obsidian 原生, 自动解析 frontmatter)               |
|  -> getFileCache(file)?.frontmatter                  |
+-------------------+--------------------------------+
                    |
                    v
+----------------------------------------------------+
|            StatusResolver (新增核心模块)              |
|                                                      |
|  输入: raw frontmatter object                        |
|  输出: IResolvedDayStatus                            |
|                                                      |
|  流程:                                               |
|  1. 读取 status 字段 -> 别名解析 -> canonical ID     |
|  2. 读取 tags 数组 -> 过滤出已知状态 tag -> 别名解析  |
|  3. 合并 优先级排序 (status > tags > holiday.json)  |
|  4. 读取 mood -> 别名解析 -> mood ID                 |
|  5. 查询天气缓存 (WeatherStore) -> 获取天气数据       |
|  6. 读取自定义字段 (sleep_hours, steps 等)           |
|                                                      |
|  依赖:                                               |
|  - StatusConfigStore (从 plugin data.json 加载)      |
|  - AliasResolver (别名 -> canonical ID)             |
|  - HolidayDataStore (holiday.json 缓存)             |
+-------------------+--------------------------------+
                    |
                    v
+----------------------------------------------------+
|         statusSource (新 ICalendarSource)            |
|                                                      |
|  getDailyMetadata(date) -> IDayMetadata:             |
|  {                                                   |
|    classes: ["is-leave-day"],   // 向后兼容 class   |
|    dots: [...],                  // 保留现有 dot    |
|    dataAttributes: {                                |
|      "data-status": "leave",                        |
|      "data-status-emoji": "emoji",                  |
|      "data-status-label": "请假",                    |
|      "data-status-color": "#F97316",                |
|      "data-mood": "great",                          |
|      "data-mood-emoji": "emoji",                    |
|      "data-weather": "sunny",                       |
|      "data-weather-emoji": "emoji",                 |
|      "data-temperature": "32",                     |
|      "data-tags": "日报",                           |
|      "data-custom": JSON.stringify({sleep: 7.5})    |
|    }                                                 |
|  }                                                   |
+-------------------+--------------------------------+
                    |
                    v
+----------------------------------------------------+
|           Calendar UI (Svelte Component)             |
|  (obsidian-calendar-ui 库渲染)                       |
|                                                      |
|  1. 接收 IDayMetadata                                |
|  2. 将 classes 添加到日历格子 DOM                    |
|  3. 将 dataAttributes 设置到日历格子 DOM             |
|  4. CSS 通过属性选择器渲染样式                        |
|  5. JS 读取 data-status-color 注入 CSS 变量          |
|  6. hover 时构建 tooltip 内容                        |
+----------------------------------------------------+
```

### 7.2 新增模块清单

| 模块 | 文件路径 | 职责 |
|------|---------|------|
| `StatusConfigStore` | `src/status/StatusConfigStore.ts` | 加载/保存 statusConfig 到 data.json |
| `AliasResolver` | `src/status/AliasResolver.ts` | 别名到 canonical ID 解析 |
| `StatusResolver` | `src/status/StatusResolver.ts` | 从 frontmatter 解析出 IResolvedDayStatus |
| `statusSource` | `src/ui/sources/statusSource.ts` | 新的 ICalendarSource |
| `TooltipManager` | `src/ui/tooltip.ts` | 构建 hover tooltip 内容 |
| `WeatherStore` | `src/weather/WeatherStore.ts` | 天气数据缓存 + API 调用 |
| `WeatherAutoWriter` | `src/weather/WeatherAutoWriter.ts` | 自动写入天气到 daily note frontmatter |
| `GeoLocator` | `src/weather/GeoLocator.ts` | IP 定位 + 城市搜索 |
| `presetData` | `src/status/presets.ts` | 内置预置状态和天气数据 |

### 7.3 IResolvedDayStatus 接口

```typescript
interface IResolvedDayStatus {
  // 主状态
  status: {
    id: string;           // canonical ID, e.g. "leave"
    label: string;        // 显示名称, e.g. "请假"
    emoji: string;        // emoji character
    color: string;        // e.g. "#F97316"
    category: string;     // "work" | "study" | "life" | "mood" | "festival"
    source: "frontmatter-status" | "frontmatter-tags" | "holiday-json";
  } | null;

  // 次要状态 (tags 中除主状态外的已知状态 tag)
  secondaryStatuses: Array<{
    id: string;
    label: string;
    emoji: string;
    color: string;
  }>;

  // 心情
  moods: Array<{
    id: string;
    label: string;
    emoji: string;
    color: string;
  }>;

  // 天气
  weather: {
    id: string;          // canonical ID: "sunny" / "cloudy" / ...
    label: string;       // 显示名称: "晴" / "多云" / ...
    emoji: string;       // emoji: "☀️" / "⛅" / ...
    wmoCode: number;     // WMO weather code
    temperature: number; // 温度 °C
  } | null;

  // 自定义字段
  customFields: Record<string, any>;

  // 原始 tags (排除已识别的状态 tag 后的剩余 tags)
  remainingTags: string[];
}
```

### 7.4 数据流时序

```
用户打开日历 / 翻页
  |
  v
Calendar.svelte 触发 sources 更新
  |
  v
statusSource.getDailyMetadata(date)
  |
  v
StatusResolver.resolve(date)
  |-- 获取 daily note file (getDailyNote)
  |-- 读取 frontmatter (metadataCache.getFileCache)
  |-- 解析 status / tags / mood / weather
  |-- 查询 holiday.json (HolidayDataStore)
  v
返回 IDayMetadata (classes + dataAttributes)
  |
  v
Calendar UI 渲染 DOM
  |
  v
CSS 属性选择器应用样式
  |
  v
JS 注入 --status-color CSS 变量
  |
  v
hover -> TooltipManager 构建提示内容
```

### 7.5 性能考量

- **缓存**: StatusResolver 按 date 缓存结果，当 note 修改时失效
- **批量加载**: 日历显示一个月 (~31 天)，并行发起所有 getDailyMetadata 调用
- **增量更新**: Obsidian 的 metadataCache 已是增量更新，无需全量扫描
- **降级**: 如果 StatusConfigStore 未加载完成，fallback 到现有 customTagsSource 行为

---

## 8. 向后兼容

### 8.1 兼容现有 `tags: [日报, 请假]` 格式

**现有用户 frontmatter**:
```yaml
tags:
  - 日报
  - 请假
```

**兼容流程**:
1. `tags` 数组中的每个 tag 都经过 AliasResolver 检查
2. "日报" 不匹配任何状态 -> 保留为普通 tag -> `data-tags="日报"`
3. "请假" 匹配 preset alias -> 解析为 `leave` -> 设置 `data-status="leave"`
4. 日历格子获得 `is-leave-day` class (向后兼容现有 CSS)
5. 同时获得 `data-status` 等新属性 (新 CSS 也生效)

**结果**: 现有 frontmatter 零修改即可获得新的视觉体验。

### 8.2 兼容现有 holiday.json

现有 `holiday.json` 格式完全保留。`leaveDaySource` 逻辑被合并进 `statusSource`：

- holiday.json 中的 `holidays` -> 设置 `data-status="holiday"`
- holiday.json 中的 `leaveDays` -> 设置 `data-status="leave"`
- holiday.json 中的 `nonWorkingDays` -> 设置 `data-status="non-workday"`

优先级：frontmatter 中的显式 `status` 字段 > holiday.json 标记。

### 8.3 兼容现有 CSS styles.css

现有 styles.css 中的 `.is-holiday`, `.is-leave-day`, `.is-nonworkday` class 选择器保留，与新的 `data-status` 属性选择器共存。旧 CSS 继续生效，新 CSS 增强效果。

用户无需修改现有 CSS 即可获得新功能。新 CSS 使用 `color-mix()` 和 CSS 变量实现更灵活的样式。

### 8.4 兼容现有 ICalendarSource 架构

现有的 `customTagsSource` 和 `leaveDaySource` 不删除，而是被 `statusSource` 包装/合并：

```typescript
// statusSource 内部调用现有的 leaveDaySource 作为 fallback
const statusSource: ICalendarSource = {
  getDailyMetadata: async (date) => {
    // 1. 尝试从 frontmatter 解析
    const resolved = await StatusResolver.resolve(date);
    if (resolved.status) {
      return buildMetadata(resolved);
    }
    // 2. Fallback 到 leaveDaySource (holiday.json)
    return leaveDaySource.getDailyMetadata(date);
  }
};
```

### 8.5 迁移路径

| 阶段 | 内容 | 兼容性 |
|------|------|--------|
| Phase 1 | 实现 StatusConfigStore + AliasResolver + statusSource | 100% 兼容现有 frontmatter 和 holiday.json |
| Phase 2 | 实现 Mood Tracking + Weather API Auto-Fetch | 新增天气模块，不影响现有功能 |
| Phase 3 | 实现 Settings UI (Status Tags 编辑器) | 新增设置页面，不影响现有配置 |
| Phase 4 | 实现 TooltipManager + CSS 增强 | 视觉增强，不改 DOM 结构 |
| Phase 5 | 合并 customTagsSource + leaveDaySource 到 statusSource | 内部重构，用户无感知 |

---

## 附录 A: 现有代码结构参考

当前项目 (`/home/montarius/obsidian-calendar-plugin`) 相关文件：

```
src/
|-- main.ts                          # 插件入口
|-- settings.ts                      # 设置界面 (ISettings 接口)
|-- view.ts                          # 日历视图注册
|-- constants.ts                     # 常量
|-- ui/
|   |-- Calendar.svelte              # 日历主组件
|   |-- stores.ts                    # Svelte stores
|   |-- utils.ts                     # 工具函数
|   |-- modal.ts                     # Modal 弹窗
|   |-- fileMenu.ts                  # 右键菜单
|   |-- sources/
|       |-- index.ts                 # Source 导出
|       |-- leaveDay.ts              # 假日/请假数据源 (holiday.json)
|       |-- tags.ts                  # Frontmatter tags 数据源
|       |-- tasks.ts                 # 任务数据源
|       |-- wordCount.ts             # 字数数据源
|       |-- streak.ts                # 连续记录数据源
|-- io/
    |-- ...
```

**关键接口** (来自 obsidian-calendar-ui):
```typescript
interface ICalendarSource {
  getDailyMetadata(date: Moment): Promise<IDayMetadata>;
  getWeeklyMetadata(date: Moment): Promise<IDayMetadata>;
}

interface IDayMetadata {
  classes?: string[];
  dots?: IDot[];
  dataAttributes?: Record<string, string>;
}
```

---

## 附录 B: frontmatter 示例

### 最简格式 (向后兼容)
```yaml
---
tags:
  - 日报
  - 请假
---
```

### 推荐格式 (新规范)
```yaml
---
date: 2026-07-24
tags:
  - 日报
status: leave
mood: great
weather: sunny          # API 自动写入
weather_name: 晴        # API 自动写入
temperature: 32         # API 自动写入
weather_wmo: 0          # API 自动写入
sleep_hours: 7.5
steps: 12000
---
```

### 多状态格式
```yaml
---
date: 2026-07-24
tags:
  - 日报
  - 摸鱼
  - 加班
status: slack
mood:
  - good
  - tired
weather: cloudy         # API 自动写入
weather_name: 多云       # API 自动写入
temperature: 26         # API 自动写入
weather_wmo: 2          # API 自动写入
note: "今天虽然摸鱼了但还是加了个班"
---
```

### 纯英文格式
```yaml
---
date: 2026-07-24
tags:
  - daily
status: leave
mood: great
weather: sunny          # auto-written by API
weather_name: Clear sky # auto-written
temperature: 32         # auto-written
weather_wmo: 0          # auto-written
---
```

---

*文档结束*
