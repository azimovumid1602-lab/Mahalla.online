export const ANN_CATEGORIES = {
  pensiya: { uz: "Pensiya", ru: "Пенсия" },
  yigilish: { uz: "Yig'ilish", ru: "Собрание" },
  kommunal: { uz: "Kommunal", ru: "Коммунальные" },
  tadbir: { uz: "Tadbir", ru: "Мероприятие" },
  muhim: { uz: "Muhim", ru: "Важное" },
} as const;
export type AnnCategory = keyof typeof ANN_CATEGORIES;

export const PROBLEM_CATEGORIES = {
  yol: { uz: "Yo'l", ru: "Дорога" },
  suv: { uz: "Suv", ru: "Вода" },
  elektr: { uz: "Elektr", ru: "Электричество" },
  gaz: { uz: "Gaz", ru: "Газ" },
  chiqindi: { uz: "Chiqindi", ru: "Мусор" },
  yoritish: { uz: "Yoritish", ru: "Освещение" },
  boshqa: { uz: "Boshqa", ru: "Другое" },
} as const;
export type ProblemCategory = keyof typeof PROBLEM_CATEGORIES;

export const STATUSES = ["yuborildi", "korib_chiqilmoqda", "jarayonda", "hal_qilindi"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_META: Record<Status, { uz: string; ru: string; cls: string; dot: string }> = {
  yuborildi: { uz: "Yuborildi", ru: "Отправлено", cls: "bg-status-sent/15 text-foreground", dot: "bg-status-sent" },
  korib_chiqilmoqda: { uz: "Ko'rib chiqilmoqda", ru: "На рассмотрении", cls: "bg-status-review/25 text-foreground", dot: "bg-status-review" },
  jarayonda: { uz: "Jarayonda", ru: "В работе", cls: "bg-status-progress/15 text-status-progress", dot: "bg-status-progress" },
  hal_qilindi: { uz: "Hal qilindi", ru: "Решено", cls: "bg-status-done/15 text-status-done", dot: "bg-status-done" },
};

const UZ_MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
export function formatDate(iso: string, lang: "uz" | "ru", withTime = true) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (lang === "uz") return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}${withTime ? ", " + time : ""}`;
  return d.toLocaleString("ru-RU", { day: "numeric", month: "long", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) });
}
