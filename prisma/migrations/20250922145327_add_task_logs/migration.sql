/*
  Warnings:

  - You are about to drop the column `createdAt` on the `TaskLog` table. All the data in the column will be lost.
  - You are about to drop the column `endedAt` on the `TaskLog` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `TaskLog` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `TaskLog` table. All the data in the column will be lost.
  - You are about to drop the column `workDate` on the `TaskLog` table. All the data in the column will be lost.
  - Added the required column `content` to the `TaskLog` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TaskLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "attachment" TEXT,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "TaskLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskLog" ("id", "taskId", "userId") SELECT "id", "taskId", "userId" FROM "TaskLog";
DROP TABLE "TaskLog";
ALTER TABLE "new_TaskLog" RENAME TO "TaskLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
