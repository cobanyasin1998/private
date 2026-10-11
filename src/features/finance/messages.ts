export const financeMessages = {
  tr: {
    locale: "tr-TR", reportTitle: "Aylık bütçe ve rapor", reportScope: "Tüm hesaplar, para birimine göre ayrı toplamlar.", reportMonth: "Rapor ayı", show: "Göster", csv: "Aylık CSV",
    createBudget: "Bu ay için bütçe oluştur", createHint: "Gider kategorilerine ayırdığın tutarı belirle.", currencyLabel: "Bütçe para birimi", closeForm: "Formu kapat", editBudget: "Bütçeyi düzenle", addBudget: "Bütçe ekle",
    planned: "Planlanan", spent: "Harcanan", remaining: "Kalan", spendHint: (currency: string) => `Harcanan toplam, bu ayın ${currency} cinsindeki tüm giderlerini kapsar. Transferler dahil edilmez.`, usage: (category: string) => `${category} bütçe kullanımı`, used: (value: number) => `%${value} kullanıldı`, noAllocations: "Bu bütçeye henüz kategori tutarı eklenmedi.", deleteBudget: "Bütçeyi sil", deleteConfirm: "Bu bütçe silinsin mi?",
    summary: "Ayın özeti", income: "Gelir", expense: "Gider", expenseCategories: "Gider kategorileri", noExpenses: "Bu ay için gider kaydı bulunmuyor.", budgetHistory: (count: number) => `${count} aylık bütçe kayıtlı. Önceki ayları ay seçicisinden görüntüleyebilirsin.`, csvHint: "CSV, seçili ayın aşağıdaki işlem filtreleriyle eşleşen tüm kayıtlarını içerir; listedeki 200 kayıt sınırı dışa aktarımda uygulanmaz.",
    budgetName: "Bütçe adı", currency: "Para birimi", defaultBudgetName: (month: string) => `${month} bütçesi`, allocationHint: (month: string) => `${month} için her kategoriye bir tutar gir. Boş bırakılan kategoriler bütçeye dahil edilmez.`, categoryHint: "Kategori tutarları eklemek için aşağıdaki Kategoriler bölümünden bir gider kategorisi oluştur.", saving: "Kaydediliyor…", saveBudget: "Bütçeyi kaydet", uncategorized: "Kategorisiz",
    sessionExpired: "Oturumunuz sona ermiş. Tekrar giriş yapın.", invalidCategories: "Bütçedeki kategoriler bulunamadı veya gider kategorisi değil.", saveError: "Bütçe kaydedilemedi.", budgetMissing: "Bütçe bulunamadı.", savedActivity: (name: string) => `Bütçe kaydedildi: ${name}`, deletedActivity: "Bütçe silindi", formError: "Formu kontrol edin.",
    csvHeaders: ["Tarih", "Tür", "Hesap", "Kategori", "Tutar", "Para birimi", "Açıklama", "Yinelenen"], transfer: "Transfer", yes: "Evet", no: "Hayır", invalidMonth: "Geçersiz ay.", sessionRequired: "Oturum gerekli.",
  }
};

export function getFinanceMessages(_locale?: string) {
  return financeMessages.tr;
}
