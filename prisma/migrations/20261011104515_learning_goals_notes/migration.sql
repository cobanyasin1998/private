-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "courseId" TEXT;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "lessonId" TEXT;

-- CreateIndex
CREATE INDEX "Goal_ownerId_courseId_idx" ON "Goal"("ownerId", "courseId");

-- CreateIndex
CREATE INDEX "Note_ownerId_courseId_idx" ON "Note"("ownerId", "courseId");

-- CreateIndex
CREATE INDEX "Note_ownerId_lessonId_idx" ON "Note"("ownerId", "lessonId");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CourseLesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
