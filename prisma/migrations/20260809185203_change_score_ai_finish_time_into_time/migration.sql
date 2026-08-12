/*
  Warnings:

  - Changed the type of `aiFinishTime` on the `TABLE_SCORE` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "TABLE_SCORE" DROP COLUMN "aiFinishTime",
ADD COLUMN     "aiFinishTime" TIME NOT NULL;

-- AlterTable
ALTER TABLE "TABLE_TOPIC" ALTER COLUMN "description" SET DEFAULT 'ini deskripsi';
