-- Add rich, topic-scoped content fields and note/goal links.
ALTER TABLE "LearningItem"
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "content" TEXT,
  ADD COLUMN "requirements" TEXT,
  ADD COLUMN "goals" TEXT;

ALTER TABLE "Note" ADD COLUMN "learningItemId" TEXT;
ALTER TABLE "Goal" ADD COLUMN "learningItemId" TEXT;

CREATE INDEX "Note_ownerId_learningItemId_idx" ON "Note"("ownerId", "learningItemId");
CREATE INDEX "Goal_ownerId_learningItemId_idx" ON "Goal"("ownerId", "learningItemId");

ALTER TABLE "Note" ADD CONSTRAINT "Note_learningItemId_fkey" FOREIGN KEY ("learningItemId") REFERENCES "LearningItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_learningItemId_fkey" FOREIGN KEY ("learningItemId") REFERENCES "LearningItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
