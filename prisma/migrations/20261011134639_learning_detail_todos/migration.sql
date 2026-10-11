-- CreateEnum
CREATE TYPE "LearningTodoStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELED');

-- CreateEnum
CREATE TYPE "LearningTodoPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "LearningItem" ADD COLUMN     "parentId" TEXT;

-- CreateTable
CREATE TABLE "LearningTodo" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "itemId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "LearningTodoStatus" NOT NULL DEFAULT 'TODO',
    "priority" "LearningTodoPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningTodo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningTodo_ownerId_areaId_status_dueDate_idx" ON "LearningTodo"("ownerId", "areaId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "LearningTodo_ownerId_itemId_idx" ON "LearningTodo"("ownerId", "itemId");

-- CreateIndex
CREATE INDEX "LearningItem_ownerId_areaId_parentId_position_idx" ON "LearningItem"("ownerId", "areaId", "parentId", "position");

-- AddForeignKey
ALTER TABLE "LearningItem" ADD CONSTRAINT "LearningItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LearningItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningTodo" ADD CONSTRAINT "LearningTodo_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningTodo" ADD CONSTRAINT "LearningTodo_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "LearningArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningTodo" ADD CONSTRAINT "LearningTodo_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LearningItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
