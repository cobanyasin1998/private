import type { LearningAreaRegistryEntry } from "./types";

/**
 * Add a new track here and the learning center can seed/render it without
 * adding another database table. The registry is intentionally Turkish-only.
 */
export const learningAreaRegistry: LearningAreaRegistryEntry[] = [
  { slug: "kali-linux", name: "Kali Linux", group: "TECHNOLOGY", category: "Teknoloji ve yazılım", description: "Yetkili yerel laboratuvarlarda Linux ve güvenlik araçları.", defaultLevel: "BEGINNER" },
  { slug: "tersine-muhendislik", name: "Tersine mühendislik", group: "TECHNOLOGY", category: "Teknoloji ve yazılım", description: "Program davranışlarını eğitim ve analiz amacıyla inceleme.", defaultLevel: "BEGINNER" },
  { slug: "exploit-gelistirme", name: "Exploit geliştirme", group: "TECHNOLOGY", category: "Teknoloji ve yazılım", description: "Yalnızca yetkili laboratuvar ve CTF senaryolarında güvenlik araştırması.", defaultLevel: "BEGINNER" },
  { slug: "python-scripting", name: "Python ile scripting", group: "TECHNOLOGY", category: "Teknoloji ve yazılım", description: "Tekrarlı işleri otomatikleştiren Python betikleri.", defaultLevel: "BEGINNER" },
  { slug: "python-programlama", name: "Python programlama", group: "TECHNOLOGY", category: "Teknoloji ve yazılım", description: "Python temelleri ve uygulama geliştirme.", defaultLevel: "BEGINNER" },
  { slug: "bash", name: "Bash", group: "TECHNOLOGY", category: "Teknoloji ve yazılım", description: "Terminal, kabuk betikleri ve otomasyon.", defaultLevel: "BEGINNER" },
  { slug: "git", name: "Git", group: "TECHNOLOGY", category: "Teknoloji ve yazılım", description: "Sürüm kontrolü, dallar ve güvenli çalışma akışları.", defaultLevel: "BEGINNER" },
  { slug: "github-gitlab", name: "GitHub ve GitLab", group: "TECHNOLOGY", category: "Teknoloji ve yazılım", description: "Uzak depolar, iş birliği ve CI süreçleri.", defaultLevel: "BEGINNER" },
  { slug: "ingilizce", name: "İngilizce", group: "ACADEMIC", category: "Akademik", description: "Kelime, dilbilgisi, okuma, dinleme, konuşma ve yazma.", defaultLevel: "BEGINNER" },
  { slug: "matematik", name: "Matematik", group: "ACADEMIC", category: "Akademik", description: "Temel matematikten problem çözmeye uzanan çalışma planı.", defaultLevel: "BEGINNER" },
  { slug: "geometri", name: "Geometri", group: "ACADEMIC", category: "Akademik", description: "Şekiller, ölçüler ve geometrik akıl yürütme.", defaultLevel: "BEGINNER" },
  { slug: "tarih", name: "Tarih", group: "ACADEMIC", category: "Akademik", description: "Tarihsel dönemleri ve neden-sonuç ilişkilerini takip et.", defaultLevel: "BEGINNER" },
  { slug: "fen-bilimleri", name: "Fen bilimleri", group: "ACADEMIC", category: "Akademik", description: "Bilimsel düşünme, gözlem ve temel fen konuları.", defaultLevel: "BEGINNER" },
  { slug: "duygusal-sosyal-beceriler", name: "Duygusal ve sosyal beceriler", group: "PERSONAL_LIFE", category: "Kişisel gelişim", description: "Duyguları tanıma, iletişim ve sosyal farkındalık.", defaultLevel: "BEGINNER" },
  { slug: "yasam-becerileri", name: "Yaşam becerileri", group: "PERSONAL_LIFE", category: "Yaşam", description: "Günlük hayatı kolaylaştıran pratik beceriler.", defaultLevel: "BEGINNER" },
];

export const learningAreaBySlug = new Map(learningAreaRegistry.map((entry) => [entry.slug, entry]));
