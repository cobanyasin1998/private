-- CreateEnum
CREATE TYPE "LearningAreaGroup" AS ENUM ('TECHNOLOGY', 'ACADEMIC', 'PERSONAL_LIFE');

-- CreateEnum
CREATE TYPE "LearningAreaLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "LearningAreaStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED');

-- CreateEnum
CREATE TYPE "LearningItemType" AS ENUM ('TOPIC', 'PRACTICE', 'LAB', 'MINI_PROJECT', 'QUIZ', 'READING', 'VIDEO', 'REVIEW');

-- CreateEnum
CREATE TYPE "TravelPlaceStatus" AS ENUM ('WISHLIST', 'VISITED');

-- CreateEnum
CREATE TYPE "TravelPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "EnglishSkill" AS ENUM ('VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING', 'SPEAKING', 'WRITING');

-- CreateEnum
CREATE TYPE "EnglishEntryType" AS ENUM ('VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING', 'SPEAKING', 'WRITING');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "learningAreaId" TEXT;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "learningAreaId" TEXT;

-- CreateTable
CREATE TABLE "LearningArea" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "group" "LearningAreaGroup" NOT NULL,
    "category" TEXT,
    "subCategory" TEXT,
    "level" "LearningAreaLevel" NOT NULL DEFAULT 'BEGINNER',
    "status" "LearningAreaStatus" NOT NULL DEFAULT 'PLANNED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER,
    "prerequisites" TEXT,
    "notes" TEXT,
    "resourceUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "lastWorkedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "englishLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningItem" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "LearningItemType" NOT NULL DEFAULT 'TOPIC',
    "position" INTEGER NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER,
    "notes" TEXT,
    "externalUrl" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningAreaTag" (
    "areaId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "LearningAreaTag_pkey" PRIMARY KEY ("areaId","tagId")
);

-- CreateTable
CREATE TABLE "LearningItemTag" (
    "itemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "LearningItemTag_pkey" PRIMARY KEY ("itemId","tagId")
);

-- CreateTable
CREATE TABLE "LearningStudySession" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,

    CONSTRAINT "LearningStudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelPlace" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "placeName" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "status" "TravelPlaceStatus" NOT NULL DEFAULT 'WISHLIST',
    "priority" "TravelPriority" NOT NULL DEFAULT 'MEDIUM',
    "estimatedBudget" DECIMAL(19,4),
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "notes" TEXT,
    "photoUrl" TEXT,
    "externalUrl" TEXT,
    "visitedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelPlaceTag" (
    "placeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TravelPlaceTag_pkey" PRIMARY KEY ("placeId","tagId")
);

-- CreateTable
CREATE TABLE "EnglishSkillProgress" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "skill" "EnglishSkill" NOT NULL,
    "level" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "assessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnglishSkillProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEnglishEntry" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "type" "EnglishEntryType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "notes" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningEnglishEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningArea_ownerId_group_status_updatedAt_idx" ON "LearningArea"("ownerId", "group", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "LearningArea_ownerId_name_idx" ON "LearningArea"("ownerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LearningArea_ownerId_slug_key" ON "LearningArea"("ownerId", "slug");

-- CreateIndex
CREATE INDEX "LearningItem_ownerId_areaId_position_idx" ON "LearningItem"("ownerId", "areaId", "position");

-- CreateIndex
CREATE INDEX "LearningItem_ownerId_completedAt_idx" ON "LearningItem"("ownerId", "completedAt");

-- CreateIndex
CREATE INDEX "LearningStudySession_ownerId_areaId_startedAt_idx" ON "LearningStudySession"("ownerId", "areaId", "startedAt");

-- CreateIndex
CREATE INDEX "TravelPlace_ownerId_status_priority_idx" ON "TravelPlace"("ownerId", "status", "priority");

-- CreateIndex
CREATE INDEX "TravelPlace_ownerId_placeName_idx" ON "TravelPlace"("ownerId", "placeName");

-- CreateIndex
CREATE INDEX "EnglishSkillProgress_ownerId_areaId_idx" ON "EnglishSkillProgress"("ownerId", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "EnglishSkillProgress_ownerId_areaId_skill_key" ON "EnglishSkillProgress"("ownerId", "areaId", "skill");

-- CreateIndex
CREATE INDEX "LearningEnglishEntry_ownerId_areaId_type_idx" ON "LearningEnglishEntry"("ownerId", "areaId", "type");

-- CreateIndex
CREATE INDEX "LearningEnglishEntry_ownerId_completedAt_idx" ON "LearningEnglishEntry"("ownerId", "completedAt");

-- CreateIndex
CREATE INDEX "Goal_ownerId_learningAreaId_idx" ON "Goal"("ownerId", "learningAreaId");

-- CreateIndex
CREATE INDEX "Note_ownerId_learningAreaId_idx" ON "Note"("ownerId", "learningAreaId");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_learningAreaId_fkey" FOREIGN KEY ("learningAreaId") REFERENCES "LearningArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_learningAreaId_fkey" FOREIGN KEY ("learningAreaId") REFERENCES "LearningArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningArea" ADD CONSTRAINT "LearningArea_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningItem" ADD CONSTRAINT "LearningItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningItem" ADD CONSTRAINT "LearningItem_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "LearningArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningAreaTag" ADD CONSTRAINT "LearningAreaTag_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "LearningArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningAreaTag" ADD CONSTRAINT "LearningAreaTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningItemTag" ADD CONSTRAINT "LearningItemTag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LearningItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningItemTag" ADD CONSTRAINT "LearningItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningStudySession" ADD CONSTRAINT "LearningStudySession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningStudySession" ADD CONSTRAINT "LearningStudySession_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "LearningArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelPlace" ADD CONSTRAINT "TravelPlace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelPlaceTag" ADD CONSTRAINT "TravelPlaceTag_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "TravelPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelPlaceTag" ADD CONSTRAINT "TravelPlaceTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnglishSkillProgress" ADD CONSTRAINT "EnglishSkillProgress_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnglishSkillProgress" ADD CONSTRAINT "EnglishSkillProgress_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "LearningArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEnglishEntry" ADD CONSTRAINT "LearningEnglishEntry_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEnglishEntry" ADD CONSTRAINT "LearningEnglishEntry_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "LearningArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
