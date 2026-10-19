export const DESKTOP_NATIVE_LOCALES = [
  "en",
  "zh",
  "zht",
  "ko",
  "de",
  "es",
  "fr",
  "da",
  "ja",
  "pl",
  "ru",
  "uk",
  "bs",
  "ar",
  "he",
  "no",
  "br",
  "th",
  "tr",
  "hi",
  "nl",
  "id",
  "vi",
  "it",
  "ur",
  "pa",
  "az",
  "fi",
  "sv",
  "am",
  "bg",
  "bn",
  "ca",
  "cs",
  "dv",
  "dz",
  "el",
  "et",
  "fa",
  "fo",
  "hr",
  "hu",
  "hy",
  "is",
  "ka",
  "km",
  "lo",
  "lt",
  "lv",
  "mk",
  "mn",
  "ms",
  "my",
  "ne",
  "ro",
  "si",
  "sk",
  "sl",
  "sq",
  "sr",
  "tg",
  "tk",
  "uz",
] as const

export type DesktopNativeLocale = (typeof DESKTOP_NATIVE_LOCALES)[number]

export const DESKTOP_NATIVE_LABELS: Record<DesktopNativeLocale, string> = {
  en: "English",
  zh: "\u7b80\u4f53\u4e2d\u6587",
  zht: "\u7e41\u9ad4\u4e2d\u6587",
  ko: "\ud55c\uad6d\uc5b4",
  de: "Deutsch",
  es: "Espa\u00f1ol",
  fr: "Fran\u00e7ais",
  da: "Dansk",
  ja: "\u65e5\u672c\u8a9e",
  pl: "Polski",
  ru: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439",
  uk: "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430",
  bs: "Bosanski",
  ar: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
  he: "\u05e2\u05d1\u05e8\u05d9\u05ea",
  no: "Norsk",
  br: "Portugu\u00eas (Brasil)",
  th: "\u0e44\u0e17\u0e22",
  tr: "T\u00fcrk\u00e7e",
  hi: "\u0939\u093f\u0928\u094d\u0926\u0940",
  nl: "Nederlands",
  id: "Bahasa Indonesia",
  vi: "Ti\u1ebfng Vi\u1ec7t",
  it: "Italiano",
  ur: "\u0627\u0631\u062f\u0648",
  pa: "\u067e\u0646\u062c\u0627\u0628\u06cc",
  az: "Az\u0259rbaycanca",
  fi: "Suomi",
  sv: "Svenska",
  am: "\u12a0\u121b\u122d\u129b",
  bg: "\u0411\u044a\u043b\u0433\u0430\u0440\u0441\u043a\u0438",
  bn: "\u09ac\u09be\u0982\u09b2\u09be",
  ca: "Catal\u00e0",
  cs: "\u010ce\u0161tina",
  dv: "\u078b\u07a8\u0788\u07ac\u0780\u07a8",
  dz: "\u0f62\u0fab\u0f7c\u0f44\u0f0b\u0f41",
  el: "\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac",
  et: "Eesti",
  fa: "\u0641\u0627\u0631\u0633\u06cc",
  fo: "F\u00f8royskt",
  hr: "Hrvatski",
  hu: "Magyar",
  hy: "\u0540\u0561\u0575\u0565\u0580\u0565\u0576",
  is: "\u00cdslenska",
  ka: "\u10e5\u10d0\u10e0\u10d7\u10e3\u10da\u10d8",
  km: "\u1781\u17d2\u1798\u17c2\u179a",
  lo: "\u0ea5\u0eb2\u0ea7",
  lt: "Lietuvi\u0173",
  lv: "Latvie\u0161u",
  mk: "\u041c\u0430\u043a\u0435\u0434\u043e\u043d\u0441\u043a\u0438",
  mn: "\u041c\u043e\u043d\u0433\u043e\u043b",
  ms: "Bahasa Melayu",
  my: "\u1019\u103c\u1014\u103a\u1019\u002c",
  ne: "\u0928\u0947\u092a\u093e\u0932\u0940",
  ro: "Rom\u00e2n\u0103",
  si: "\u0dc3\u0dd2\u0d82\u0dc4\u0dbd",
  sk: "Sloven\u010dina",
  sl: "Sloven\u0161\u010dina",
  sq: "Shqip",
  sr: "\u0421\u0440\u043f\u0441\u043a\u0438",
  tg: "\u0422\u043e\u04b7\u0438\u043a\u04e3",
  tk: "T\u00fcrkmen\u00e7e",
  uz: "O\u02bbzbekcha",
}

export const DESKTOP_NATIVE_LOCALE_TAGS: Record<DesktopNativeLocale, string> = {
  en: "en",
  zh: "zh-Hans",
  zht: "zh-Hant",
  ko: "ko",
  de: "de",
  es: "es",
  fr: "fr",
  da: "da",
  ja: "ja",
  pl: "pl",
  ru: "ru",
  uk: "uk",
  bs: "bs",
  ar: "ar",
  he: "he-IL",
  no: "nb-NO",
  br: "pt-BR",
  th: "th",
  tr: "tr",
  hi: "hi-IN",
  nl: "nl-NL",
  id: "id-ID",
  vi: "vi-VN",
  it: "it-IT",
  ur: "ur-PK",
  pa: "pa-Arab-PK",
  az: "az-Latn-AZ",
  fi: "fi-FI",
  sv: "sv-SE",
  am: "am-ET",
  bg: "bg-BG",
  bn: "bn-BD",
  ca: "ca-AD",
  cs: "cs-CZ",
  dv: "dv-MV",
  dz: "dz-BT",
  el: "el-GR",
  et: "et-EE",
  fa: "fa-IR",
  fo: "fo-FO",
  hr: "hr-HR",
  hu: "hu-HU",
  hy: "hy-AM",
  is: "is-IS",
  ka: "ka-GE",
  km: "km-KH",
  lo: "lo-LA",
  lt: "lt-LT",
  lv: "lv-LV",
  mk: "mk-MK",
  mn: "mn-MN",
  ms: "ms-MY",
  my: "my-MM",
  ne: "ne-NP",
  ro: "ro-RO",
  si: "si-LK",
  sk: "sk-SK",
  sl: "sl-SI",
  sq: "sq-AL",
  sr: "sr-Cyrl-RS",
  tg: "tg-Cyrl-TJ",
  tk: "tk-Latn-TM",
  uz: "uz-Latn-UZ",
}

export function detectDesktopNativeLocale(languages: readonly string[]): DesktopNativeLocale {
  for (const language of languages) {
    const source = locale(language)

    if (!source) continue

    if (["no", "nb", "nn"].includes(source.language)) return "no"

    const match = DESKTOP_NATIVE_LOCALES.find((candidate) => {
      const target = locale(DESKTOP_NATIVE_LOCALE_TAGS[candidate])

      return target?.language === source.language && normalizeScript(target.script) === normalizeScript(source.script)
    })

    if (match) return match
  }

  return "en"
}

export function desktopNativePluralCategories(locale: DesktopNativeLocale) {
  return new Intl.PluralRules(DESKTOP_NATIVE_LOCALE_TAGS[locale]).resolvedOptions().pluralCategories
}

function locale(value: string) {
  try {
    return new Intl.Locale(value).maximize()
  } catch {
    return undefined
  }
}

// Bun's ICU currently reports Punjabi's Arabic script as the invalid "Aran" code.
const normalizeScript = (script?: string) => (script === "Aran" ? "Arab" : script)

export const DESKTOP_NATIVE_ENGLISH = {
  "desktop.menu.app": "TalmeezCode",
  "desktop.menu.file": "File",
  "desktop.menu.edit": "Edit",
  "desktop.menu.view": "View",
  "desktop.menu.go": "Go",
  "desktop.menu.window": "Window",
  "desktop.menu.help": "Help",
  "desktop.menu.installCli": "Install CLI\u2026",
  "desktop.menu.settings": "Settings",
  "desktop.menu.reloadWebview": "Reload Webview",
  "desktop.menu.restart": "Restart",
  "desktop.menu.exportLogs": "Export Logs\u2026",
  "desktop.menu.newSession": "New Session",
  "desktop.menu.openProject": "Open Project\u2026",
  "desktop.menu.newWindow": "New Window",
  "desktop.menu.closeWindow": "Close Window",
  "desktop.menu.undo": "Undo",
  "desktop.menu.redo": "Redo",
  "desktop.menu.cut": "Cut",
  "desktop.menu.copy": "Copy",
  "desktop.menu.paste": "Paste",
  "desktop.menu.delete": "Delete",
  "desktop.menu.selectAll": "Select All",
  "desktop.menu.toggleSidebar": "Toggle Sidebar",
  "desktop.menu.toggleTerminal": "Toggle Terminal",
  "desktop.menu.toggleFileTree": "Toggle File Tree",
  "desktop.menu.reload": "Reload",
  "desktop.menu.toggleDeveloperTools": "Toggle Developer Tools",
  "desktop.menu.actualSize": "Actual Size",
  "desktop.menu.zoomIn": "Zoom In",
  "desktop.menu.zoomOut": "Zoom Out",
  "desktop.menu.toggleFullScreen": "Toggle Full Screen",
  "desktop.menu.back": "Back",
  "desktop.menu.forward": "Forward",
  "desktop.menu.previousSession": "Previous Session",
  "desktop.menu.nextSession": "Next Session",
  "desktop.menu.previousProject": "Previous Project",
  "desktop.menu.nextProject": "Next Project",
  "desktop.menu.minimize": "Minimize",
  "desktop.menu.maximize": "Maximize",
  "desktop.menu.documentation": "TalmeezCode Documentation",
  "desktop.menu.supportForum": "Support Forum",
  "desktop.menu.shareFeedback": "Share Feedback",
  "desktop.menu.reportBug": "Report a Bug",
  "desktop.menu.ariaLabel": "OpenCode menu",

  "desktop.cli.installed.title": "CLI Installed",
  "desktop.cli.installed.message": "CLI installed to {{path}}\n\nRestart your terminal to use the 'opencode' command.",
  "desktop.cli.failed.title": "Installation Failed",
  "desktop.cli.failed.message": "Failed to install CLI: {{error}}",

  "desktop.recovery.action.relaunch": "Relaunch",
  "desktop.recovery.action.exportLogs": "Export Logs",
  "desktop.recovery.action.keepWaiting": "Keep Waiting",
  "desktop.recovery.action.quit": "Quit",
  "desktop.recovery.loadFailed": "TalmeezCode failed to load",
  "desktop.recovery.terminated": "TalmeezCode window terminated unexpectedly",
  "desktop.recovery.unresponsive": "TalmeezCode is not responding",
  "desktop.recovery.unresponsive.detail": "You can relaunch the app, open the logs, or keep waiting.",
  "desktop.recovery.loadFailed.detail": "Window: {{window}}\nURL: {{url}}\nError: {{code}} {{description}}",
  "desktop.recovery.terminated.detail": "Window: {{window}}\nReason: {{reason}}\nCode: {{code}}",
  "desktop.recovery.unknown": "<unknown>",

  "desktop.dialog.chooseFolder": "Choose a folder",
  "desktop.dialog.chooseFile": "Choose a file",
  "desktop.dialog.saveFile": "Save file",
  "desktop.dialog.files": "Files",
  "desktop.server.local": "Local Server",
  "desktop.onboarding.defaultProject": "Default Project",

  "desktop.picker.error.notSelected": "File was not selected by the picker",
  "desktop.picker.error.sizeLimit": "Selected attachments exceed the {{limit}} MB limit",
} as const

export type DesktopNativeKey = keyof typeof DESKTOP_NATIVE_ENGLISH

export type DesktopNativeMessages = Record<DesktopNativeKey, string>

export type DesktopNativeBundle = { locale: DesktopNativeLocale; messages: DesktopNativeMessages }

export const DESKTOP_NATIVE_KEYS = Object.keys(DESKTOP_NATIVE_ENGLISH) as DesktopNativeKey[]

export const DESKTOP_NATIVE_MAX_PAYLOAD_BYTES = 64 * 1024

export function createDesktopNativeBundle(
  locale: DesktopNativeLocale,
  translate: (key: DesktopNativeKey) => string,
): DesktopNativeBundle {
  return {
    locale,
    messages: Object.fromEntries(DESKTOP_NATIVE_KEYS.map((key) => [key, translate(key)])) as DesktopNativeMessages,
  }
}

export function parseDesktopNativeBundle(value: unknown): DesktopNativeBundle | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined

  try {
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > DESKTOP_NATIVE_MAX_PAYLOAD_BYTES) return undefined
  } catch {
    return undefined
  }

  const bundle = value as { locale?: unknown; messages?: unknown }

  if (!DESKTOP_NATIVE_LOCALES.some((locale) => locale === bundle.locale)) return undefined

  if (!bundle.messages || typeof bundle.messages !== "object" || Array.isArray(bundle.messages)) return undefined
  const messages = bundle.messages as Record<string, unknown>
  const keys = Object.keys(messages)

  if (keys.length !== DESKTOP_NATIVE_KEYS.length) return undefined

  if (!DESKTOP_NATIVE_KEYS.every((key) => typeof messages[key] === "string")) return undefined

  if (!keys.every((key) => key in DESKTOP_NATIVE_ENGLISH)) return undefined

  return bundle as DesktopNativeBundle
}

export function formatDesktopNativeMessage(message: string, params?: Record<string, string | number>) {
  if (!params) return message

  return message.replace(/\{\{([^{}]+)\}\}/g, (match, key: string) => {
    const value = params[key]

    return value === undefined ? match : String(value)
  })
}
