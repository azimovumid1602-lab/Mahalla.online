import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "uz" | "ru";

const dict = {
  home: ["Bosh sahifa", "Главная"],
  announcements: ["E'lonlar", "Объявления"],
  problems: ["Muammolar", "Проблемы"],
  polls: ["So'rovnomalar", "Опросы"],
  profile: ["Profil", "Профиль"],
  admin: ["Boshqaruv", "Управление"],
  login: ["Kirish", "Войти"],
  logout: ["Chiqish", "Выйти"],
  heroTitle: ["Mahalla muammolari endi bir joyda", "Проблемы махалли теперь в одном месте"],
  heroSub: [
    "Yig'ilishga bormasdan e'lonlarni o'qing, muammo yuboring va ovoz bering.",
    "Читайте объявления, сообщайте о проблемах и голосуйте — без лишних собраний.",
  ],
  sendProblem: ["Muammo yuborish", "Сообщить о проблеме"],
  seeAnnouncements: ["E'lonlarni ko'rish", "Смотреть объявления"],
  solved: ["Hal qilingan muammolar", "Решённых проблем"],
  members: ["Faol a'zolar", "Активных жителей"],
  newAnn: ["Yangi e'lonlar", "Новых объявлений"],
  howItWorks: ["Qanday ishlaydi?", "Как это работает?"],
  step1: ["Ro'yxatdan o'ting", "Зарегистрируйтесь"],
  step1d: ["Telefon yoki email orqali bir daqiqada.", "За минуту по email."],
  step2: ["Muammoni yozing", "Опишите проблему"],
  step2d: ["Rasm va manzil bilan yuboring.", "Отправьте с фото и адресом."],
  step3: ["Natijani kuzating", "Следите за результатом"],
  step3d: ["Holat o'zgarishini bosqichma-bosqich ko'ring.", "Смотрите каждый этап решения."],
  remind: ["Eslatib qo'y", "Напомнить"],
  pinned: ["Muhim", "Важно"],
  search: ["Qidirish...", "Поиск..."],
  all: ["Hammasi", "Все"],
  meToo: ["Men ham duch keldim", "У меня тоже"],
  comments: ["Izohlar", "Комментарии"],
  writeComment: ["Izoh yozing...", "Напишите комментарий..."],
  send: ["Yuborish", "Отправить"],
  vote: ["Ovoz berish", "Голосовать"],
  voted: ["Siz ovoz berdingiz", "Вы проголосовали"],
  votes: ["ovoz", "голосов"],
  loginToAct: ["Buning uchun tizimga kiring", "Войдите, чтобы продолжить"],
  myProblems: ["Mening muammolarim", "Мои проблемы"],
  myVotes: ["Mening ovozlarim", "Мои голоса"],
  editInfo: ["Ma'lumotlarni tahrirlash", "Редактировать данные"],
  save: ["Saqlash", "Сохранить"],
  empty: ["Hozircha hech narsa yo'q", "Пока ничего нет"],
} as const;

export type TKey = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string }>({
  lang: "uz",
  setLang: () => {},
  t: (k) => dict[k][0],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");
  useEffect(() => {
    const s = localStorage.getItem("lang");
    if (s === "ru" || s === "uz") setLangState(s);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
    document.documentElement.lang = l;
  };
  const t = (k: TKey) => dict[k][lang === "uz" ? 0 : 1];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
