const messages = {
  tr: {
    title: "Dosyalar", description: "Kişisel dosyalarını kalıcı yerel depolamada sakla. Dosya başına en fazla 10 MB.",
    file: "Dosya seç", upload: "Yükle", busy: "İşleniyor…", uploaded: "Dosya yüklendi.",
    uploadFailed: "Dosya yüklenemedi. Tekrar deneyin.", deleteFailed: "Dosya silinemedi. Tekrar deneyin.",
    confirmDelete: "Bu dosya kalıcı olarak silinsin mi?", delete: "Sil", empty: "Henüz dosya yok.",
    required: "Bir dosya seçin.", tooLarge: "Dosya en fazla 10 MB olabilir.",
    invalid: "Desteklenen bir dosya seçin: PDF, metin veya görsel; en fazla 10 MB.",
    mismatch: "Dosya içeriği belirtilen dosya türüyle eşleşmiyor.",
    invalidId: "Geçersiz dosya.", notFound: "Dosya bulunamadı.",
  },
};

export function attachmentMessages(_locale?: string) { return messages.tr; }
