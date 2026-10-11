export type Locale = "tr";

export const messages = {
  tr: { greeting: "Günaydın", dashboard: "Panel", overview: "Hayatının önemli parçaları tek yerde.", today: "Bugün", empty: "Henüz kayıt yok", emptyHint: "İlk kaydını eklediğinde burada görünecek.", add: "Yeni kayıt", recentActivity: "Son aktiviteler", quickActions: "Hızlı işlemler", noActivity: "Henüz aktivite yok", planned: "Planlandı", inProgress: "Devam ediyor", completed: "Tamamlandı", enabled: "Aktif", comingSoon: "Yakında", language: "Dil", theme: "Tema", light: "Açık", dark: "Koyu", system: "Sistem" },
} as const;

export type MessageKey = keyof typeof messages.tr;
export function t(locale: Locale, key: MessageKey) { return messages[locale][key]; }
