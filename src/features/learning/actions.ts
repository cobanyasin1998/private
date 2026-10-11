"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordActivity } from "@/lib/activity/events";
import { getSessionOwner } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  englishEntryDeleteSchema, englishEntryInputSchema, englishEntryUpdateSchema, englishSkillProgressInputSchema,
  learningAreaDeleteSchema, learningAreaInputSchema, learningAreaUpdateSchema,
  learningItemCompletionSchema, learningItemDeleteSchema, learningItemInputSchema, learningItemUpdateSchema,
  learningTodoCompletionSchema, learningTodoDeleteSchema, learningTodoInputSchema, learningTodoUpdateSchema,
  learningProgressSchema, learningStudySessionDeleteSchema, learningStudySessionInputSchema,
  travelPlaceDeleteSchema, travelPlaceInputSchema, travelPlaceStatusSchema, travelPlaceUpdateSchema,
  learningGoalCompletionSchema, learningGoalDeleteSchema, learningGoalInputSchema, learningGoalUpdateSchema,
  learningNoteDeleteSchema, learningNoteInputSchema, learningNoteUpdateSchema,
} from "./schemas";
import { learningAreaRegistry } from "./registry";

export type LearningActionResult = { ok: true; id?: string; areaId?: string } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

function validationError(error: z.ZodError): LearningActionResult {
  return { ok: false, error: "Formu kontrol edin.", fieldErrors: error.flatten().fieldErrors };
}
function refresh(areaId?: string) {
  revalidatePath("/learning");
  revalidatePath("/learning", "layout");
  revalidatePath("/learning-center");
  revalidatePath("/dashboard");
  if (areaId) revalidatePath(`/learning/${areaId}`);
}
function slugify(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}
async function ownerOrFailure() {
  const owner = await getSessionOwner();
  return owner ?? null;
}
async function validTags(ownerId: string, tagIds: string[]) {
  if (!tagIds.length) return true;
  return (await db.tag.count({ where: { ownerId, id: { in: tagIds } } })) === tagIds.length;
}

const starterItems: Record<string, Array<{ title: string; type: "TOPIC" | "PRACTICE" | "LAB" | "MINI_PROJECT" | "QUIZ" | "READING" | "VIDEO" | "REVIEW"; description: string; summary?: string; content?: string; requirements?: string; goals?: string }>> = {
  "kali-linux": [
    { title: "Terminal ve dosya sistemi temelleri", type: "TOPIC", description: "Yetkili yerel makinede kullanıcı, dosya ve izinlerle güvenli çalışma.", summary: "Kali Linux terminalinde güvenli gezinme, dosya yönetimi ve yardım alma.", content: "pwd, ls, cd, cp, mv, mkdir, rm ve man komutlarını yalnızca kendi sanal makinen üzerinde dene. Her komutun etkisini çalıştırmadan önce tahmin et ve işlem sonrası dosya ağacını kontrol et.", requirements: "Kali Linux sanal makinesi veya kişisel Linux kurulumu; geri dönüş için snapshot.", goals: "Terminalde temel dosya işlemlerini açıklayabilmek ve geri dönüşü olmayan komutları ayırt edebilmek." },
    { title: "Kullanıcılar, izinler ve süreçler", type: "TOPIC", description: "Yetkili yerel sistemde kullanıcı, izin ve süreç yönetiminin temellerini öğren.", summary: "Dosya izinleri, kullanıcı bağlamı ve çalışan süreçleri güvenli biçimde gözlemleme.", content: "id, whoami, chmod, chown, ps ve top komutlarını kendi laboratuvarında incele. İzin değişikliklerini yalnızca oluşturduğun deneme dosyalarında yap; sistem dosyalarına dokunma.", requirements: "İzole Kali laboratuvarı ve test için oluşturulmuş bir kullanıcı/dosya.", goals: "rwx izinlerini okuyabilmek, süreç listesini yorumlayabilmek ve en az ayrıcalık ilkesini açıklayabilmek." },
    { title: "Paket yönetimi ve güncelleme güvenliği", type: "TOPIC", description: "Kali paketlerini kaynağını doğrulayarak ve geri dönüş planıyla yönet.", summary: "apt paket yöneticisini, depo kaynaklarını ve güncelleme öncesi kontrol adımlarını öğren.", content: "apt update, apt search ve apt install komutlarının farkını kendi sanal makinen üzerinde gözlemle. Kaynağı doğrulanmamış paket kurma; snapshot alıp yalnızca ihtiyaç duyduğun eğitim araçlarını yükle.", requirements: "İzole Kali sanal makinesi ve güncelleme öncesi snapshot.", goals: "Paket kaynağını kontrol etmek, güncelleme riskini değerlendirmek ve kurulumu kayıt altına almak." },
    { title: "Sistem günlüklerini okuma", type: "TOPIC", description: "Kendi laboratuvarındaki sistem günlüklerinden olayları ve hataları ayırt et.", summary: "journalctl ve temel günlük dosyalarıyla savunma odaklı gözlem yapma.", content: "journalctl --since, tail ve grep ile yalnızca kendi makinenin günlüklerini incele. Kişisel verileri maskeleyerek tarih, kaynak ve olay türünü not et; herhangi bir gerçek sisteme günlük toplama isteği gönderme.", requirements: "Kendi Kali makinen ve örnek bir uygulama günlüğü.", goals: "Bir olay kaydını zaman, kaynak ve sonuç bilgisiyle özetleyebilmek." },
    { title: "Temel sistem sertleştirme", type: "TOPIC", description: "Kali laboratuvarını eğitim amaçlı kullanım için temel güvenlik kontrolleriyle sertleştir.", summary: "Gereksiz servisleri azaltma, güncelleme ve yedekleme gibi savunma kontrolleri.", content: "Gereksiz kullanıcıları/servisleri belirle, güçlü parola ve kilit politikalarını kontrol et, firewall durumunu gözden geçir. Her değişikliği önce snapshot üzerinde dene ve geri alma adımını yaz.", requirements: "Yalnızca sana ait yerel sanal makine; yönetici yetkisini sınırlı ve bilinçli kullan.", goals: "Kendi lab ortamı için ölçülebilir bir sertleştirme kontrol listesi hazırlamak." },
    { title: "Güvenli sanal makine laboratuvarı kur", type: "LAB", description: "Ağ erişimi sınırlandırılmış bir yerel test makinesi hazırla.", summary: "Kali ile çalışırken veriyi ve ağı izole eden, geri alınabilir bir laboratuvar hazırlama.", content: "Sanal makine snapshot'ı al, ağ modunu host-only veya tamamen kapalı olacak şekilde ayarla ve yalnızca kendi oluşturduğun hedef makineleri kullan. Laboratuvar sınırlarını kısa bir dosyada kaydet.", requirements: "VirtualBox/VMware benzeri bir hypervisor; yalnızca sana ait yerel test makineleri.", goals: "Çalışma ortamını yeniden kurabilmek ve her deneyin yetkili/izole sınırlar içinde kaldığını doğrulamak." },
    { title: "Yerel ağ gözlemi ve günlükleme", type: "LAB", description: "Sadece kendi izole ağında temel ağ gözlemi ve günlük inceleme pratiği yap.", summary: "Ağ arayüzlerini tanıma ve kendi laboratuvarındaki trafiği savunma amacıyla gözlemleme.", content: "ip addr, ip route ve ss gibi araçlarla kendi makinenin durumunu incele. Paket yakalamayı yalnızca izinli lab arayüzünde, eğitim amacıyla ve kişisel verileri paylaşmadan yap; sonuçları savunma gözlemleri olarak not et.", requirements: "Host-only/izole ağ; açık rıza olmadan hiçbir gerçek sisteme veya internete tarama gönderme.", goals: "Kendi lab ağını belgelemek, beklenen trafiği anormal olandan ayırmaya başlamak ve bulguları güvenli şekilde raporlamak." },
    { title: "Bash ile günlük bakım betiği", type: "MINI_PROJECT", description: "Kendi bilgisayarındaki dosyaları yedekleyen küçük bir betik yaz.", summary: "Bash kullanarak kişisel çalışma klasörünü güvenli ve izlenebilir biçimde arşivleme.", content: "set -euo pipefail, değişken doğrulama, tarih damgası ve günlük çıktısı kullanan bir yedekleme betiği oluştur. Betiği sadece kendi deneme klasöründe çalıştır ve geri yükleme adımını test et.", requirements: "Kişisel deneme klasörü, yedekleme hedefi ve geri dönüş için örnek dosyalar.", goals: "Hata durumunda duran, ne yaptığını açıklayan ve geri yüklemesi doğrulanmış bir Bash betiği teslim etmek." },
  ],
  "tersine-muhendislik": [
    { title: "İkilik dosya ve assembly okuma", type: "TOPIC", description: "Küçük ve izinli örnek programlarda temel akışları incele." },
    { title: "Hata ayıklayıcı ile yerel analiz", type: "LAB", description: "Yalnızca kendin derlediğin örnek üzerinde durak noktaları kullan." },
    { title: "Fonksiyon akışını belgele", type: "PRACTICE", description: "Bir eğitim ikilisindeki fonksiyonları diyagramla." },
  ],
  "exploit-gelistirme": [
    { title: "Bellek güvenliği ve güvenli kod", type: "TOPIC", description: "Taşma, sınır kontrolü ve savunmacı programlama kavramlarını öğren." },
    { title: "CTF eğitim laboratuvarında kontrollü örnek", type: "LAB", description: "Sadece yetkili, izole ve eğitim amaçlı bir ortamda çalış." },
    { title: "Savunma kontrol listesi yaz", type: "MINI_PROJECT", description: "Örnek bir uygulama için risk ve düzeltme maddelerini listele." },
  ],
  "python-scripting": [
    { title: "Dosya ve klasör otomasyonu", type: "TOPIC", description: "Pathlib ve güvenli hata yönetimiyle tekrar eden işi otomatikleştir." },
    { title: "CSV raporlayıcı", type: "MINI_PROJECT", description: "Kendi verin için komut satırından çalışan basit bir rapor yaz." },
    { title: "Script testleri ve günlükleme", type: "PRACTICE", description: "Küçük betiğini test ve log çıktılarıyla güvenilir hale getir." },
  ],
  "python-programlama": [
    { title: "Python veri tipleri ve fonksiyonlar", type: "TOPIC", description: "Temel söz dizimi, koleksiyonlar ve fonksiyonları örneklerle çalış." },
    { title: "Küçük komut satırı uygulaması", type: "MINI_PROJECT", description: "Girdi doğrulamalı bir kişisel takip aracı geliştir." },
    { title: "Modül ve paket tasarımı", type: "PRACTICE", description: "Kodunu küçük, test edilebilir modüllere ayır." },
  ],
  bash: [
    { title: "Kabuk değişkenleri ve yönlendirme", type: "TOPIC", description: "Komut zincirleri, pipe ve güvenli tırnak kullanımını öğren." },
    { title: "Yedekleme betiği", type: "MINI_PROJECT", description: "Kendi çalışma klasörünü tarihli arşivleyen betik oluştur." },
    { title: "Bash hata kodları", type: "PRACTICE", description: "set -e ve açık hata kontrolleri ile script davranışını gözle." },
  ],
  git: [
    { title: "Commit, branch ve merge", type: "TOPIC", description: "Küçük bir repoda düzenli geçmiş oluşturma akışını öğren." },
    { title: "Güvenli feature branch akışı", type: "PRACTICE", description: "Kendi deneme projen üzerinde branch açıp birleştir." },
    { title: "Geçmişi inceleme ve geri alma", type: "LAB", description: "Yerel repoda log, diff ve güvenli geri dönüş pratiği yap." },
  ],
  "github-gitlab": [
    { title: "Uzak depo ve erişim anahtarları", type: "TOPIC", description: "Kendi repolarında güvenli kimlik doğrulama ve remote kullanımını öğren." },
    { title: "Issue ve pull request akışı", type: "PRACTICE", description: "Kişisel örnek repo üzerinde iş kaydı ve inceleme süreci kur." },
    { title: "Basit CI kontrolü", type: "MINI_PROJECT", description: "Test ve lint komutlarını çalıştıran temel bir iş akışı tanımla." },
  ],
  ingilizce: [
    { title: "Günlük 20 kelimelik kelime listesi", type: "PRACTICE", description: "Yeni kelimeleri örnek cümle ve tekrar tarihiyle kaydet." },
    { title: "Temel zamanlar dilbilgisi", type: "TOPIC", description: "Temel zamanları kısa cümlelerle ayırt et ve kullan." },
    { title: "Kısa metin okuma ve dinleme", type: "READING", description: "Seviyene uygun kısa bir içerikten ana fikri çıkar." },
  ],
  matematik: [
    { title: "Temel işlemler ve sayı kümeleri", type: "TOPIC", description: "Sayı kümelerini ve işlem önceliğini örneklerle pekiştir." },
    { title: "Günlük problem çözme", type: "PRACTICE", description: "Bir problemi verilen, çözüm ve kontrol adımlarıyla yaz." },
    { title: "Konu tekrar kartları", type: "REVIEW", description: "Zorlandığın kuralları kısa tekrar kartlarına dönüştür." },
  ],
  geometri: [
    { title: "Açılar ve üçgenler", type: "TOPIC", description: "Açı türlerini ve üçgen özelliklerini çizimle çalış." },
    { title: "Şekil çizim alıştırmaları", type: "PRACTICE", description: "Cetvel ve pergel ile temel şekilleri oluştur." },
    { title: "Alan ve çevre mini testi", type: "QUIZ", description: "Farklı şekiller için alan ve çevre hesabını kontrol et." },
  ],
  tarih: [
    { title: "Zaman çizelgesi oluşturma", type: "TOPIC", description: "Dönemleri tarih, yer ve neden-sonuç ilişkisiyle sırala." },
    { title: "Birincil ve ikincil kaynak okuma", type: "READING", description: "Kaynağın bağlamını ve güvenilirlik sınırlarını not et." },
    { title: "Kısa tarih anlatısı", type: "MINI_PROJECT", description: "Seçtiğin bir dönemi bir sayfada nedenleriyle anlat." },
  ],
  "fen-bilimleri": [
    { title: "Bilimsel yöntem", type: "TOPIC", description: "Soru, hipotez, deney ve sonuç adımlarını ayırt et." },
    { title: "Evde güvenli gözlem", type: "LAB", description: "Risk içermeyen bir gözlemi ölçüm ve notlarla kaydet." },
    { title: "Sonuçları grafikleştir", type: "PRACTICE", description: "Kendi gözlem verini basit bir grafikle yorumla." },
  ],
  "duygusal-sosyal-beceriler": [
    { title: "Duyguları adlandırma", type: "TOPIC", description: "Günlük olaylarda duygu, düşünce ve davranışı ayır." },
    { title: "Aktif dinleme alıştırması", type: "PRACTICE", description: "Bir konuşmada özetleme ve açık soru sorma pratiği yap." },
    { title: "Sınır ve ihtiyaç notu", type: "REVIEW", description: "Kendi sınırlarını ve ihtiyaçlarını açık bir dille yaz." },
  ],
  "yasam-becerileri": [
    { title: "Haftalık plan ve öncelik", type: "TOPIC", description: "Haftanı enerji, süre ve önceliklerine göre planla." },
    { title: "Kişisel bütçe pratiği", type: "PRACTICE", description: "Bir haftalık gelir ve giderlerini kategorilere ayır." },
    { title: "Acil durum kontrol listesi", type: "MINI_PROJECT", description: "Ev ve dijital yaşam için temel acil durum adımlarını yaz." },
  ],
};

const kaliTopicExamples = [
  { topic: "Terminal ve dosya sistemi temelleri", child: "Dizinlerde gezinme ve güvenli dosya işlemleri", summary: "Çalışma dizinini bul, deneme klasörü oluştur ve dosyaları kopyalayarak farkı gözlemle.", content: "Kendi ev dizininde kali-calisma adlı bir klasör oluştur. pwd ve ls ile nerede olduğunu doğrula; bir metin dosyasını cp ile kopyala, mv ile yeniden adlandır. Silme işleminden önce hedef yolu kontrol et.", requirements: "Kendi sanal makinen; yalnızca deneme dosyaları.", goal: "Bir dosyayı oluşturma, kopyalama ve taşıma adımlarını yardım almadan tamamla.", todos: ["Deneme klasörünü ve örnek dosyayı oluştur", "Kopyalama ve taşıma sonrası dosya ağacını kontrol et"], attached: "Bash ile günlük bakım betiği" },
  { topic: "Kullanıcılar, izinler ve süreçler", child: "rwx izinlerini okuma ve test kullanıcısı", summary: "Bir deneme dosyasının okuma, yazma ve çalıştırma izinlerini yorumla.", content: "ls -l çıktısındaki sahip, grup ve diğer kullanıcı izinlerini incele. Yalnızca kendi oluşturduğun test dosyasında chmod u+x ve chmod u-x farkını gözlemle; ps çıktısındaki süreç kimliklerini not et.", requirements: "Terminal temelleri; test için oluşturulmuş dosya.", goal: "rwx izinlerini açıklayıp bir süreç kimliğini doğru belirle.", todos: ["Deneme dosyasının başlangıç izinlerini kaydet", "İzin değişikliğini geri alıp sonucu doğrula"], attached: null },
  { topic: "Paket yönetimi ve güncelleme güvenliği", child: "Paket kaynaklarını ve kurulum planını doğrulama", summary: "Bir paketi kurmadan önce kaynak, boyut ve bağımlılıklarını incele.", content: "Resmi Kali depo tanımlarını kendi makinen üzerinde kontrol et. apt show ile seçtiğin eğitim paketinin açıklamasını ve bağımlılıklarını oku. Güncelleme öncesi snapshot adı ve geri alma adımını yaz.", requirements: "Sanal makine snapshot özelliği; güncelleme için kontrollü internet erişimi.", goal: "Bir paket için kaynak ve geri dönüş kontrol listesini tamamla.", todos: ["Güncelleme öncesi snapshot oluştur", "Seçilen paketin kaynağını ve bağımlılıklarını kontrol et"], attached: null },
  { topic: "Sistem günlüklerini okuma", child: "Bir günlük olayını tarih ve kaynakla özetleme", summary: "Kendi sistemindeki bir hata veya servis olayının kısa olay kaydını çıkar.", content: "journalctl ile sınırlı bir zaman aralığını incele. Tarih, servis adı ve hata mesajını ayır; kişisel verileri paylaşmadan olayın olası nedenini ve doğrulama adımını yaz.", requirements: "Kendi makinenin günlüklerine erişim; örnek bir servis olayı.", goal: "Bir olayın zaman çizelgesini anlaşılır bir özetle belgele.", todos: ["Yalnızca kendi makinen için bir günlük aralığı seç", "Olayın tarihini, kaynağını ve sonucunu özetle"], attached: "Yerel ağ gözlemi ve günlükleme" },
  { topic: "Temel sistem sertleştirme", child: "Laboratuvar sınırları ve geri dönüş kontrolü", summary: "Sanal makinenin sınırlarını, servislerini ve geri alma planını kontrol et.", content: "Host-only veya kapalı ağ modunu doğrula. Gereksiz servisleri belirle; bir değişikliği uygulamadan önce neyi etkileyeceğini ve nasıl geri alınacağını yaz. Gerçek sistemlerde veya izinsiz ağlarda deneme yapma.", requirements: "Sana ait izole sanal makine; snapshot ve yerel lab planı.", goal: "Lab kapsamını ve geri alma adımlarını içeren bir kontrol listesini tamamla.", todos: ["Lab ağının izole olduğunu doğrula", "Sertleştirme değişikliği için geri alma adımını yaz"], attached: "Güvenli sanal makine laboratuvarı kur" },
] as const;

async function ensureKaliTopicExamples(ownerId: string, areaId: string) {
  for (const example of kaliTopicExamples) {
    const topic = await db.learningItem.findFirst({ where: { ownerId, areaId, title: example.topic }, select: { id: true } });
    if (!topic) continue;
    const child = await db.learningItem.findFirst({ where: { ownerId, areaId, parentId: topic.id, title: example.child }, select: { id: true } });
    if (!child) await db.learningItem.create({ data: { ownerId, areaId, parentId: topic.id, title: example.child, description: example.summary, summary: example.summary, content: example.content, requirements: example.requirements, goals: example.goal, type: "TOPIC", position: 1, estimatedMinutes: 30 } });
    for (const title of example.todos) {
      const todo = await db.learningTodo.findFirst({ where: { ownerId, areaId, itemId: topic.id, title }, select: { id: true } });
      if (!todo) await db.learningTodo.create({ data: { ownerId, areaId, itemId: topic.id, title, priority: "MEDIUM" } });
    }
    const goal = await db.goal.findFirst({ where: { ownerId, learningAreaId: areaId, learningItemId: topic.id, title: example.goal }, select: { id: true } });
    if (!goal) await db.goal.create({ data: { ownerId, learningAreaId: areaId, learningItemId: topic.id, title: example.goal, description: "Bu başlangıç konusu için örnek öğrenme hedefi." } });
    if (example.attached) {
      // Existing starter labs retain their content and completion when nested.
      await db.learningItem.updateMany({ where: { ownerId, areaId, title: example.attached, parentId: null }, data: { parentId: topic.id } });
    }
  }
}

/** Idempotently creates the initial Turkish learning tracks and starter topics. */
export async function seedLearningRegistry(): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  try {
    for (const entry of learningAreaRegistry) {
      const area = await db.learningArea.upsert({
        where: { ownerId_slug: { ownerId: owner.id, slug: entry.slug } },
        create: { ownerId: owner.id, slug: entry.slug, name: entry.name, description: entry.description, group: entry.group, category: entry.category, level: entry.defaultLevel ?? "BEGINNER" },
        // Existing user edits are preserved when the page ensures starter data.
        update: {},
        select: { id: true },
      });
      for (const [position, starter] of (starterItems[entry.slug] ?? []).entries()) {
        const exists = await db.learningItem.findFirst({ where: { ownerId: owner.id, areaId: area.id, title: starter.title }, select: { id: true, summary: true, content: true, requirements: true, goals: true } });
        const starterDetails = { summary: starter.summary, content: starter.content, requirements: starter.requirements, goals: starter.goals };
        if (!exists) {
          await db.learningItem.create({ data: { ownerId: owner.id, areaId: area.id, title: starter.title, description: starter.description, ...starterDetails, type: starter.type, position: position + 1 } });
        } else if (Object.values(starterDetails).some((value) => value !== undefined)) {
          // Backfill newly added starter detail fields without overwriting user edits.
          await db.learningItem.update({ where: { id: exists.id }, data: {
            ...(exists.summary === null && starter.summary ? { summary: starter.summary } : {}),
            ...(exists.content === null && starter.content ? { content: starter.content } : {}),
            ...(exists.requirements === null && starter.requirements ? { requirements: starter.requirements } : {}),
            ...(exists.goals === null && starter.goals ? { goals: starter.goals } : {}),
          } });
        }
      }
      if (entry.slug === "kali-linux") await ensureKaliTopicExamples(owner.id, area.id);
    }
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Öğrenme başlangıç içeriği oluşturulamadı." };
  }
}

export async function createLearningArea(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningAreaInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  if (!(await validTags(owner.id, parsed.data.tagIds))) return { ok: false, error: "Geçersiz etiket seçimi." };
  const slug = parsed.data.slug ?? slugify(parsed.data.name);
  try {
    const area = await db.learningArea.create({
      data: {
        ownerId: owner.id, slug, name: parsed.data.name, description: parsed.data.description, group: parsed.data.group,
        category: parsed.data.category, subCategory: parsed.data.subCategory, level: parsed.data.level, status: parsed.data.status,
        progress: parsed.data.status === "COMPLETED" ? 100 : parsed.data.progress, estimatedMinutes: parsed.data.estimatedMinutes,
        prerequisites: parsed.data.prerequisites, notes: parsed.data.notes, resourceUrls: parsed.data.resourceUrls, lastWorkedAt: parsed.data.lastWorkedAt,
        completedAt: parsed.data.status === "COMPLETED" ? parsed.data.completedAt ?? new Date() : parsed.data.completedAt,
        englishLevel: parsed.data.englishLevel,
        tags: { create: parsed.data.tagIds.map((tagId) => ({ tagId })) },
      },
    });
    await recordActivity(owner.id, { type: "learning.area.created", title: `Öğrenme alanı eklendi: ${area.name}`, entityType: "learningArea", entityId: area.id });
    refresh();
    return { ok: true, id: area.id, areaId: area.id };
  } catch {
    return { ok: false, error: "Öğrenme alanı kaydedilemedi. Alan kodu daha önce kullanılmış olabilir." };
  }
}

export async function updateLearningArea(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningAreaUpdateSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  if (!(await validTags(owner.id, parsed.data.tagIds))) return { ok: false, error: "Geçersiz etiket seçimi." };
  const existing = await db.learningArea.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, completedAt: true } });
  if (!existing) return { ok: false, error: "Öğrenme alanı bulunamadı." };
  try {
    await db.learningArea.update({
      where: { id: existing.id },
      data: {
        slug: parsed.data.slug ?? slugify(parsed.data.name), name: parsed.data.name, description: parsed.data.description, group: parsed.data.group,
        category: parsed.data.category, subCategory: parsed.data.subCategory, level: parsed.data.level, status: parsed.data.status,
        progress: parsed.data.status === "COMPLETED" ? 100 : parsed.data.progress, estimatedMinutes: parsed.data.estimatedMinutes,
        prerequisites: parsed.data.prerequisites, notes: parsed.data.notes, resourceUrls: parsed.data.resourceUrls, lastWorkedAt: parsed.data.lastWorkedAt,
        completedAt: parsed.data.status === "COMPLETED" ? existing.completedAt ?? parsed.data.completedAt ?? new Date() : parsed.data.completedAt,
        englishLevel: parsed.data.englishLevel, tags: { deleteMany: {}, create: parsed.data.tagIds.map((tagId) => ({ tagId })) },
      },
    });
    refresh(existing.id);
    return { ok: true, id: existing.id, areaId: existing.id };
  } catch {
    return { ok: false, error: "Öğrenme alanı güncellenemedi." };
  }
}

export async function deleteLearningArea(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningAreaDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Öğrenme alanı bulunamadı." };
  const deleted = await db.learningArea.deleteMany({ where: { id: parsed.data.id, ownerId: owner.id } });
  if (!deleted.count) return { ok: false, error: "Öğrenme alanı bulunamadı." };
  refresh();
  return { ok: true, id: parsed.data.id, areaId: parsed.data.id };
}

export async function setLearningAreaProgress(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningProgressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "İlerleme 0 ile 100 arasında olmalı." };
  const area = await db.learningArea.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, status: true, lastWorkedAt: true } });
  if (!area) return { ok: false, error: "Öğrenme alanı bulunamadı." };
  const completed = parsed.data.progress >= 100;
  await db.learningArea.update({ where: { id: area.id }, data: { progress: parsed.data.progress, status: completed ? "COMPLETED" : area.status === "PLANNED" || area.status === "COMPLETED" ? "IN_PROGRESS" : area.status, lastWorkedAt: parsed.data.progress > 0 ? new Date() : area.lastWorkedAt, completedAt: completed ? new Date() : null } });
  refresh(area.id);
  return { ok: true, id: area.id, areaId: area.id };
}

async function ownedArea(ownerId: string, areaId: string) {
  return db.learningArea.findFirst({ where: { id: areaId, ownerId: ownerId }, select: { id: true } });
}

/** Ensures a nested topic stays inside the same owner-scoped learning area. */
async function validItemParent(ownerId: string, areaId: string, parentId: string | null | undefined, currentId?: string) {
  if (!parentId) return true;
  if (parentId === currentId) return false;
  const parent = await db.learningItem.findFirst({ where: { id: parentId, ownerId, areaId }, select: { id: true, parentId: true } });
  if (!parent) return false;
  // Walk ancestors so an item cannot become its own descendant.
  const seen = new Set<string>([parent.id]);
  let ancestorId = parent.parentId;
  for (let depth = 0; ancestorId && depth < 100; depth += 1) {
    if (ancestorId === currentId) return false;
    if (seen.has(ancestorId)) return false;
    seen.add(ancestorId);
    const ancestor = await db.learningItem.findFirst({ where: { id: ancestorId, ownerId, areaId }, select: { parentId: true } });
    if (!ancestor) return false;
    ancestorId = ancestor.parentId;
  }
  return !ancestorId;
}

async function ownedLearningItem(ownerId: string, areaId: string, itemId: string | null | undefined) {
  if (!itemId) return true;
  return Boolean(await db.learningItem.findFirst({ where: { id: itemId, ownerId, areaId }, select: { id: true } }));
}

export async function createLearningItem(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningItemInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const area = await ownedArea(owner.id, parsed.data.areaId);
  if (!area) return { ok: false, error: "Öğrenme alanı bulunamadı." };
  if (!(await validItemParent(owner.id, area.id, parsed.data.parentId))) return { ok: false, error: "Alt konu aynı öğrenme alanındaki geçerli bir konuya bağlanmalı." };
  if (!(await validTags(owner.id, parsed.data.tagIds))) return { ok: false, error: "Geçersiz etiket seçimi." };
  const max = await db.learningItem.aggregate({ where: { areaId: area.id, ownerId: owner.id }, _max: { position: true } });
  try {
    const item = await db.learningItem.create({ data: { ownerId: owner.id, areaId: area.id, parentId: parsed.data.parentId ?? null, title: parsed.data.title, description: parsed.data.description, summary: parsed.data.summary, content: parsed.data.content, requirements: parsed.data.requirements, goals: parsed.data.goals, type: parsed.data.type, position: parsed.data.position ?? ((max._max.position ?? 0) + 1), estimatedMinutes: parsed.data.estimatedMinutes, notes: parsed.data.notes, externalUrl: parsed.data.externalUrl, tags: { create: parsed.data.tagIds.map((tagId) => ({ tagId })) } } });
    refresh(area.id);
    return { ok: true, id: item.id, areaId: area.id };
  } catch {
    return { ok: false, error: "Konu kaydedilemedi." };
  }
}

export async function updateLearningItem(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningItemUpdateSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const item = await db.learningItem.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, areaId: true } });
  if (!item) return { ok: false, error: "Konu bulunamadı." };
  const area = await ownedArea(owner.id, parsed.data.areaId);
  if (!area || area.id !== item.areaId) return { ok: false, error: "Konu başka bir alana taşınamaz." };
  if (!(await validItemParent(owner.id, item.areaId, parsed.data.parentId, item.id))) return { ok: false, error: "Alt konu bağlantısı geçersiz veya döngü oluşturuyor." };
  if (!(await validTags(owner.id, parsed.data.tagIds))) return { ok: false, error: "Geçersiz etiket seçimi." };
  try {
    await db.learningItem.update({ where: { id: item.id }, data: { ...(parsed.data.parentId !== undefined ? { parentId: parsed.data.parentId } : {}), title: parsed.data.title, description: parsed.data.description, summary: parsed.data.summary, content: parsed.data.content, requirements: parsed.data.requirements, goals: parsed.data.goals, type: parsed.data.type, position: parsed.data.position, estimatedMinutes: parsed.data.estimatedMinutes, notes: parsed.data.notes, externalUrl: parsed.data.externalUrl, tags: { deleteMany: {}, create: parsed.data.tagIds.map((tagId) => ({ tagId })) } } });
    refresh(item.areaId);
    return { ok: true, id: item.id, areaId: item.areaId };
  } catch {
    return { ok: false, error: "Konu güncellenemedi." };
  }
}

export async function setLearningItemCompleted(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningItemCompletionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz konu işlemi." };
  const item = await db.learningItem.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, areaId: true } });
  if (!item) return { ok: false, error: "Konu bulunamadı." };
  await db.learningItem.update({ where: { id: item.id }, data: { completedAt: parsed.data.completed ? new Date() : null } });
  refresh(item.areaId);
  return { ok: true, id: item.id, areaId: item.areaId };
}

export async function deleteLearningItem(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningItemDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Konu bulunamadı." };
  const item = await db.learningItem.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, areaId: true } });
  if (!item) return { ok: false, error: "Konu bulunamadı." };
  await db.learningItem.delete({ where: { id: item.id } });
  refresh(item.areaId);
  return { ok: true, id: item.id, areaId: item.areaId };
}

export async function createLearningTodo(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningTodoInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const area = await ownedArea(owner.id, parsed.data.areaId);
  if (!area) return { ok: false, error: "Öğrenme alanı bulunamadı." };
  if (!(await ownedLearningItem(owner.id, area.id, parsed.data.itemId))) return { ok: false, error: "Yapılacak geçerli bir konuya bağlanmalı." };
  try {
    const todo = await db.learningTodo.create({
      data: {
        ownerId: owner.id, areaId: area.id, itemId: parsed.data.itemId ?? null, title: parsed.data.title,
        description: parsed.data.description, status: parsed.data.status, priority: parsed.data.priority,
        dueDate: parsed.data.dueDate, completedAt: parsed.data.status === "DONE" ? parsed.data.completedAt ?? new Date() : null,
      },
    });
    await recordActivity(owner.id, { type: "learning.todo.created", title: `Öğrenme yapılacağı eklendi: ${todo.title}`, entityType: "learningTodo", entityId: todo.id, metadata: { learningAreaId: area.id } });
    refresh(area.id);
    return { ok: true, id: todo.id, areaId: area.id };
  } catch {
    return { ok: false, error: "Yapılacak kaydedilemedi." };
  }
}

export async function updateLearningTodo(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningTodoUpdateSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const todo = await db.learningTodo.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, areaId: true } });
  if (!todo || todo.areaId !== parsed.data.areaId) return { ok: false, error: "Yapılacak bulunamadı." };
  if (!(await ownedLearningItem(owner.id, todo.areaId, parsed.data.itemId))) return { ok: false, error: "Yapılacak geçerli bir konuya bağlanmalı." };
  await db.learningTodo.update({
    where: { id: todo.id },
    data: {
      ...(parsed.data.itemId !== undefined ? { itemId: parsed.data.itemId } : {}), title: parsed.data.title, description: parsed.data.description,
      status: parsed.data.status, priority: parsed.data.priority, dueDate: parsed.data.dueDate,
      completedAt: parsed.data.status === "DONE" ? parsed.data.completedAt ?? new Date() : null,
    },
  });
  refresh(todo.areaId);
  return { ok: true, id: todo.id, areaId: todo.areaId };
}

export async function setLearningTodoCompleted(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningTodoCompletionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz yapılacak işlemi." };
  const todo = await db.learningTodo.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, areaId: true } });
  if (!todo) return { ok: false, error: "Yapılacak bulunamadı." };
  await db.learningTodo.update({ where: { id: todo.id }, data: { status: parsed.data.completed ? "DONE" : "TODO", completedAt: parsed.data.completed ? new Date() : null } });
  refresh(todo.areaId);
  return { ok: true, id: todo.id, areaId: todo.areaId };
}

export async function deleteLearningTodo(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningTodoDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Yapılacak bulunamadı." };
  const todo = await db.learningTodo.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, areaId: true } });
  if (!todo) return { ok: false, error: "Yapılacak bulunamadı." };
  await db.learningTodo.delete({ where: { id: todo.id } });
  refresh(todo.areaId);
  return { ok: true, id: todo.id, areaId: todo.areaId };
}

export async function createLearningStudySession(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningStudySessionInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const area = await ownedArea(owner.id, parsed.data.areaId);
  if (!area) return { ok: false, error: "Öğrenme alanı bulunamadı." };
  const session = await db.learningStudySession.create({ data: { ownerId: owner.id, areaId: area.id, startedAt: parsed.data.startedAt ?? new Date(), endedAt: parsed.data.endedAt, minutes: parsed.data.minutes, note: parsed.data.note } });
  await db.learningArea.update({ where: { id: area.id }, data: { lastWorkedAt: new Date(), status: "IN_PROGRESS" } });
  refresh(area.id);
  return { ok: true, id: session.id, areaId: area.id };
}

export async function deleteLearningStudySession(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningStudySessionDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Çalışma oturumu bulunamadı." };
  const session = await db.learningStudySession.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, areaId: true } });
  if (!session) return { ok: false, error: "Çalışma oturumu bulunamadı." };
  await db.learningStudySession.delete({ where: { id: session.id } });
  refresh(session.areaId);
  return { ok: true, id: session.id, areaId: session.areaId };
}

export async function createTravelPlace(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = travelPlaceInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  if (!(await validTags(owner.id, parsed.data.tagIds))) return { ok: false, error: "Geçersiz etiket seçimi." };
  try {
    const place = await db.travelPlace.create({ data: { ownerId: owner.id, placeName: parsed.data.placeName, city: parsed.data.city, country: parsed.data.country, status: parsed.data.status, priority: parsed.data.priority, estimatedBudget: parsed.data.estimatedBudget, currency: parsed.data.currency, notes: parsed.data.notes, photoUrl: parsed.data.photoUrl, externalUrl: parsed.data.externalUrl, visitedAt: parsed.data.status === "VISITED" ? parsed.data.visitedAt ?? new Date() : parsed.data.visitedAt, tags: { create: parsed.data.tagIds.map((tagId) => ({ tagId })) } } });
    refresh();
    return { ok: true, id: place.id };
  } catch {
    return { ok: false, error: "Gezilecek yer kaydedilemedi." };
  }
}

export async function updateTravelPlace(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = travelPlaceUpdateSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  if (!(await validTags(owner.id, parsed.data.tagIds))) return { ok: false, error: "Geçersiz etiket seçimi." };
  const place = await db.travelPlace.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, visitedAt: true } });
  if (!place) return { ok: false, error: "Gezilecek yer bulunamadı." };
  await db.travelPlace.update({ where: { id: place.id }, data: { placeName: parsed.data.placeName, city: parsed.data.city, country: parsed.data.country, status: parsed.data.status, priority: parsed.data.priority, estimatedBudget: parsed.data.estimatedBudget, currency: parsed.data.currency, notes: parsed.data.notes, photoUrl: parsed.data.photoUrl, externalUrl: parsed.data.externalUrl, visitedAt: parsed.data.status === "VISITED" ? place.visitedAt ?? parsed.data.visitedAt ?? new Date() : parsed.data.visitedAt, tags: { deleteMany: {}, create: parsed.data.tagIds.map((tagId) => ({ tagId })) } } });
  refresh();
  return { ok: true, id: place.id };
}

export async function deleteTravelPlace(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = travelPlaceDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Gezilecek yer bulunamadı." };
  const deleted = await db.travelPlace.deleteMany({ where: { id: parsed.data.id, ownerId: owner.id } });
  if (!deleted.count) return { ok: false, error: "Gezilecek yer bulunamadı." };
  refresh();
  return { ok: true, id: parsed.data.id };
}

export async function setTravelPlaceStatus(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = travelPlaceStatusSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const place = await db.travelPlace.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true } });
  if (!place) return { ok: false, error: "Gezilecek yer bulunamadı." };
  await db.travelPlace.update({ where: { id: place.id }, data: { status: parsed.data.status, visitedAt: parsed.data.status === "VISITED" ? parsed.data.visitedAt ?? new Date() : null } });
  refresh();
  return { ok: true, id: place.id };
}

export async function upsertEnglishSkillProgress(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = englishSkillProgressInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const area = await ownedArea(owner.id, parsed.data.areaId);
  if (!area) return { ok: false, error: "İngilizce alanı bulunamadı." };
  const skill = await db.englishSkillProgress.upsert({ where: { ownerId_areaId_skill: { ownerId: owner.id, areaId: area.id, skill: parsed.data.skill } }, create: { ownerId: owner.id, areaId: area.id, skill: parsed.data.skill, level: parsed.data.level, progress: parsed.data.progress, assessedAt: parsed.data.assessedAt }, update: { level: parsed.data.level, progress: parsed.data.progress, assessedAt: parsed.data.assessedAt } });
  refresh(area.id);
  return { ok: true, id: skill.id, areaId: area.id };
}

export async function createEnglishEntry(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = englishEntryInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const area = await ownedArea(owner.id, parsed.data.areaId);
  if (!area) return { ok: false, error: "İngilizce alanı bulunamadı." };
  const entry = await db.learningEnglishEntry.create({ data: { ownerId: owner.id, areaId: area.id, type: parsed.data.type, title: parsed.data.title, content: parsed.data.content, notes: parsed.data.notes, progress: parsed.data.progress, completedAt: parsed.data.progress >= 100 ? parsed.data.completedAt ?? new Date() : parsed.data.completedAt } });
  refresh(area.id);
  return { ok: true, id: entry.id, areaId: area.id };
}

export async function updateEnglishEntry(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = englishEntryUpdateSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const entry = await db.learningEnglishEntry.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, areaId: true } });
  if (!entry || entry.areaId !== parsed.data.areaId) return { ok: false, error: "İngilizce kaydı bulunamadı." };
  await db.learningEnglishEntry.update({ where: { id: entry.id }, data: { type: parsed.data.type, title: parsed.data.title, content: parsed.data.content, notes: parsed.data.notes, progress: parsed.data.progress, completedAt: parsed.data.progress >= 100 ? parsed.data.completedAt ?? new Date() : parsed.data.completedAt } });
  refresh(entry.areaId);
  return { ok: true, id: entry.id, areaId: entry.areaId };
}

export async function deleteEnglishEntry(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = englishEntryDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "İngilizce kaydı bulunamadı." };
  const entry = await db.learningEnglishEntry.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, areaId: true } });
  if (!entry) return { ok: false, error: "İngilizce kaydı bulunamadı." };
  await db.learningEnglishEntry.delete({ where: { id: entry.id } });
  refresh(entry.areaId);
  return { ok: true, id: entry.id, areaId: entry.areaId };
}

export async function createLearningNote(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningNoteInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const area = await ownedArea(owner.id, parsed.data.areaId);
  if (!area) return { ok: false, error: "Öğrenme alanı bulunamadı." };
  if (!(await ownedLearningItem(owner.id, area.id, parsed.data.itemId))) return { ok: false, error: "Not geçerli bir konuya bağlanmalı." };
  const note = await db.note.create({ data: { ownerId: owner.id, learningAreaId: area.id, learningItemId: parsed.data.itemId ?? null, title: parsed.data.title, content: parsed.data.content } });
  await recordActivity(owner.id, { type: "learning.note.created", title: `Öğrenme notu eklendi: ${note.title}`, entityType: "note", entityId: note.id, metadata: { learningAreaId: area.id } });
  refresh(area.id);
  return { ok: true, id: note.id, areaId: area.id };
}

export async function updateLearningNote(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningNoteUpdateSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const note = await db.note.findFirst({ where: { id: parsed.data.id, ownerId: owner.id, learningAreaId: parsed.data.areaId }, select: { id: true, learningAreaId: true, learningItemId: true } });
  if (!note?.learningAreaId) return { ok: false, error: "Öğrenme notu bulunamadı." };
  const itemId = parsed.data.itemId === undefined ? note.learningItemId : parsed.data.itemId;
  if (!(await ownedLearningItem(owner.id, note.learningAreaId, itemId))) return { ok: false, error: "Not geçerli bir konuya bağlanmalı." };
  await db.note.update({ where: { id: note.id }, data: { title: parsed.data.title, content: parsed.data.content, learningItemId: itemId } });
  refresh(note.learningAreaId);
  return { ok: true, id: note.id, areaId: note.learningAreaId };
}

export async function deleteLearningNote(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningNoteDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Öğrenme notu bulunamadı." };
  const note = await db.note.findFirst({ where: { id: parsed.data.id, ownerId: owner.id, learningAreaId: { not: null } }, select: { id: true, learningAreaId: true } });
  if (!note?.learningAreaId) return { ok: false, error: "Öğrenme notu bulunamadı." };
  await db.note.delete({ where: { id: note.id } });
  refresh(note.learningAreaId);
  return { ok: true, id: note.id, areaId: note.learningAreaId };
}

export async function createLearningGoal(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningGoalInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const area = await ownedArea(owner.id, parsed.data.areaId);
  if (!area) return { ok: false, error: "Öğrenme alanı bulunamadı." };
  if (!(await ownedLearningItem(owner.id, area.id, parsed.data.itemId))) return { ok: false, error: "Hedef geçerli bir konuya bağlanmalı." };
  const goal = await db.goal.create({ data: { ownerId: owner.id, learningAreaId: area.id, learningItemId: parsed.data.itemId ?? null, title: parsed.data.title, description: parsed.data.description, dueDate: parsed.data.dueDate } });
  await recordActivity(owner.id, { type: "learning.goal.created", title: `Öğrenme hedefi eklendi: ${goal.title}`, entityType: "goal", entityId: goal.id, metadata: { learningAreaId: area.id } });
  refresh(area.id);
  return { ok: true, id: goal.id, areaId: area.id };
}

export async function updateLearningGoal(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningGoalUpdateSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const goal = await db.goal.findFirst({ where: { id: parsed.data.id, ownerId: owner.id, learningAreaId: parsed.data.areaId }, select: { id: true, learningAreaId: true, learningItemId: true } });
  if (!goal?.learningAreaId) return { ok: false, error: "Öğrenme hedefi bulunamadı." };
  const itemId = parsed.data.itemId === undefined ? goal.learningItemId : parsed.data.itemId;
  if (!(await ownedLearningItem(owner.id, goal.learningAreaId, itemId))) return { ok: false, error: "Hedef geçerli bir konuya bağlanmalı." };
  await db.goal.update({ where: { id: goal.id }, data: { title: parsed.data.title, description: parsed.data.description, dueDate: parsed.data.dueDate, learningItemId: itemId } });
  refresh(goal.learningAreaId);
  return { ok: true, id: goal.id, areaId: goal.learningAreaId };
}

export async function setLearningGoalCompleted(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningGoalCompletionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz hedef işlemi." };
  const goal = await db.goal.findFirst({ where: { id: parsed.data.id, ownerId: owner.id, learningAreaId: { not: null } }, select: { id: true, learningAreaId: true } });
  if (!goal?.learningAreaId) return { ok: false, error: "Öğrenme hedefi bulunamadı." };
  await db.goal.update({ where: { id: goal.id }, data: { completedAt: parsed.data.completed ? new Date() : null } });
  refresh(goal.learningAreaId);
  return { ok: true, id: goal.id, areaId: goal.learningAreaId };
}

export async function deleteLearningGoal(input: unknown): Promise<LearningActionResult> {
  const owner = await ownerOrFailure();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = learningGoalDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Öğrenme hedefi bulunamadı." };
  const goal = await db.goal.findFirst({ where: { id: parsed.data.id, ownerId: owner.id, learningAreaId: { not: null } }, select: { id: true, learningAreaId: true } });
  if (!goal?.learningAreaId) return { ok: false, error: "Öğrenme hedefi bulunamadı." };
  await db.goal.delete({ where: { id: goal.id } });
  refresh(goal.learningAreaId);
  return { ok: true, id: goal.id, areaId: goal.learningAreaId };
}
