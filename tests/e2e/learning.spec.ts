import { expect, prisma, test } from "./learning-fixture";

test("öğrenme merkezinde gezi kaydı modal içinde eklenip düzenlenir", async ({ page, ownerId }) => {
  await page.goto("/learning");
  await expect(page.getByRole("heading", { name: "Öğrenme Merkezi" })).toBeVisible();

  await page.getByRole("button", { name: "Yer ekle" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Gezilecek yer ekle" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Yer adı *").fill("Kapadokya");
  await dialog.getByLabel("Şehir").fill("Nevşehir");
  await dialog.getByRole("button", { name: "Yeri kaydet" }).click();

  await expect(page.getByText("Kapadokya", { exact: true })).toBeVisible();
  const created = await prisma.travelPlace.findFirst({ where: { ownerId, placeName: "Kapadokya" } });
  expect(created).not.toBeNull();

  await page.getByRole("button", { name: "Kapadokya düzenle" }).click();
  const editDialog = page.getByRole("dialog", { name: "Gezilecek yeri düzenle" });
  await expect(editDialog).toBeVisible();
  await editDialog.getByLabel("Yer adı *").fill("Kapadokya gezisi");
  await editDialog.getByRole("button", { name: "Yeri kaydet" }).click();
  await expect(page.getByText("Kapadokya gezisi", { exact: true })).toBeVisible();
  expect(await prisma.travelPlace.count({ where: { ownerId, placeName: "Kapadokya gezisi" } })).toBe(1);
});

test("öğrenme alanı kartı kendi detay ekranını ve başlangıç derslerini açar", async ({ page, ownerId }) => {
  await page.goto("/learning");
  await expect(page.getByRole("heading", { name: "Öğrenme Merkezi" })).toBeVisible();

  // Kartın tamamı detay bağlantısıdır; başlığa tıklamak erişilebilir kart akışını doğrular.
  await page.getByText("Kali Linux", { exact: true }).first().click();
  await expect(page).toHaveURL(/\/learning\/kali-linux$/);
  await expect(page.getByRole("heading", { name: "Kali Linux", exact: true })).toBeVisible();
  await expect(page.getByText("Terminal ve dosya sistemi temelleri", { exact: true })).toBeVisible();
  expect(await prisma.learningItem.count({ where: { ownerId, area: { slug: "kali-linux" }, type: "TOPIC" } })).toBeGreaterThanOrEqual(5);
});

test("öğrenme alanı detayında konu modalı yeni konu kaydeder", async ({ page, ownerId }) => {
  await page.goto("/learning/kali-linux");
  await expect(page.getByRole("heading", { name: "Kali Linux", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Konu ekle" }).click();
  const dialog = page.getByRole("dialog", { name: "Konu veya alt konu ekle" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Konu başlığı *").fill("İzinli yerel laboratuvar alıştırması");
  await dialog.getByLabel("Kısa açıklama").fill("Yalnızca izole ve yetkili eğitim ortamında çalış.");
  await dialog.getByRole("button", { name: "Konuyu ekle" }).click();

  await expect(dialog).not.toBeVisible();
  const created = await prisma.learningItem.findFirst({ where: { ownerId, title: "İzinli yerel laboratuvar alıştırması" } });
  expect(created?.type).toBe("TOPIC");
});

test("Kali Linux alanı yalnız konu ve alt konuları gösterir, tamamlanma durumunu kaydeder", async ({ page, ownerId }) => {
  await page.goto("/learning/kali-linux");
  await expect(page.getByRole("heading", { name: "Kali Linux", exact: true })).toBeVisible();

  const topics = await prisma.learningItem.findMany({
    where: { ownerId, area: { slug: "kali-linux" }, type: "TOPIC" },
    orderBy: { position: "asc" },
    select: { id: true, title: true },
  });
  // Kali başlangıç içeriği, konu detay akışını gösterecek kadar gerçek örnek içerir.
  expect(topics.length).toBeGreaterThanOrEqual(5);
  await expect(page.getByText(/Konular/i).first()).toBeVisible();
  await expect(page.getByText("Laboratuvar dersleri", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Çalışma geçmişi", { exact: true })).toHaveCount(0);

  const topic = topics[0];
  const topicEntry = page.getByText(topic.title, { exact: true }).first();
  await expect(topicEntry).toBeVisible();
  const completion = page.getByRole("checkbox", { name: `${topic.title} tamamlandı` });
  await expect(completion).not.toBeChecked();
  await completion.check();
  await expect.poll(async () => (await prisma.learningItem.findUnique({ where: { id: topic.id }, select: { completedAt: true } }))?.completedAt).not.toBeNull();
});

test("konu bağlantısı, konunun kendi ayrıntı ekranını açar", async ({ page, ownerId }) => {
  await page.goto("/learning/kali-linux");
  const topic = await prisma.learningItem.findFirst({
    where: { ownerId, area: { slug: "kali-linux" }, type: "TOPIC" },
    orderBy: { position: "asc" },
    select: { id: true, title: true, description: true },
  });
  expect(topic).not.toBeNull();
  if (!topic) return;

  await page.getByText(topic.title, { exact: true }).first().click();
  await expect(page).toHaveURL(new RegExp(`/learning/kali-linux/items/${topic.id}$`));
  await expect(page.getByRole("heading", { name: topic.title, exact: true })).toBeVisible();
  if (topic.description) await expect(page.getByText(topic.description, { exact: true }).first()).toBeVisible();

  // Konuya ait kapsam bu ekranda kalır; alan listesi yalnızca başlık ve durum gösterir.
  for (const section of [/özet/i, /detay/i, /yapılacak/i, /gereksinim/i, /hedef/i, /notlar/i]) {
    await expect(page.getByText(section).first()).toBeVisible();
  }
});

test("konu detayında yapılacak, hedef ve not modal üzerinden konuya bağlanır", async ({ page, ownerId }) => {
  await page.goto("/learning/kali-linux");
  const topic = await prisma.learningItem.findFirst({ where: { ownerId, area: { slug: "kali-linux" }, type: "TOPIC" }, orderBy: { position: "asc" }, select: { id: true, title: true } });
  expect(topic).not.toBeNull();
  if (!topic) return;
  await page.getByText(topic.title, { exact: true }).first().click();
  await expect(page.getByRole("heading", { name: topic.title, exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Yapılacak ekle" }).click();
  const todoDialog = page.getByRole("dialog", { name: "Yapılacak ekle" });
  await todoDialog.getByLabel("Yapılacak başlığı *").fill("İzinli laboratuvar adımlarını tamamla");
  await todoDialog.getByRole("button", { name: /kaydet/i }).click();
  await expect(page.getByText("İzinli laboratuvar adımlarını tamamla", { exact: true })).toBeVisible();
  expect(await prisma.learningTodo.count({ where: { ownerId, itemId: topic.id, title: "İzinli laboratuvar adımlarını tamamla" } })).toBe(1);

  await page.getByRole("button", { name: "Hedef ekle" }).click();
  const goalDialog = page.getByRole("dialog", { name: "Hedef ekle" });
  await goalDialog.getByLabel("Hedef başlığı *").fill("Konu özetini kendi cümlelerinle yaz");
  await goalDialog.getByRole("button", { name: /kaydet/i }).click();
  await expect(page.getByText("Konu özetini kendi cümlelerinle yaz", { exact: true })).toBeVisible();
  expect(await prisma.goal.count({ where: { ownerId, learningItemId: topic.id, title: "Konu özetini kendi cümlelerinle yaz" } })).toBe(1);

  await page.getByRole("button", { name: "Not ekle" }).click();
  const noteDialog = page.getByRole("dialog", { name: "Not ekle" });
  await noteDialog.getByLabel("Not başlığı *").fill("İlk çalışma notu");
  await noteDialog.getByLabel("Not içeriği *").fill("Bu not doğrudan konuya bağlıdır.");
  await noteDialog.getByRole("button", { name: /kaydet/i }).click();
  await expect(page.getByText("İlk çalışma notu", { exact: true })).toBeVisible();
  expect(await prisma.note.count({ where: { ownerId, learningItemId: topic.id, title: "İlk çalışma notu" } })).toBe(1);
});

test("alt konunun tamamlanması üst konuyu değiştirmez", async ({ page, ownerId }) => {
  await page.goto("/learning/kali-linux");
  await expect(page.getByRole("heading", { name: "Kali Linux", exact: true })).toBeVisible();
  const parent = await prisma.learningItem.findFirst({ where: { ownerId, area: { slug: "kali-linux" }, type: "TOPIC", parentId: null }, orderBy: { position: "asc" }, select: { id: true, title: true, areaId: true } });
  expect(parent).not.toBeNull();
  if (!parent) return;
  const child = await prisma.learningItem.create({ data: { ownerId, areaId: parent.areaId, parentId: parent.id, type: "TOPIC", title: "Alt konu tamamlama testi", position: 999 } });
  await page.reload();
  await page.getByRole("checkbox", { name: `${child.title} tamamlandı` }).check();
  await expect.poll(async () => (await prisma.learningItem.findUnique({ where: { id: child.id }, select: { completedAt: true } }))?.completedAt).not.toBeNull();
  expect((await prisma.learningItem.findUnique({ where: { id: parent.id }, select: { completedAt: true } }))?.completedAt).toBeNull();
  await expect(page.getByRole("checkbox", { name: `${parent.title} tamamlandı` })).not.toBeChecked();
});
