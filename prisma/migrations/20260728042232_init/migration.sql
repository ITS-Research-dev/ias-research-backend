-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CompileStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('WAITING', 'PASSED', 'FAILED');

-- CreateTable
CREATE TABLE "table_role" (
    "id" UUID NOT NULL,
    "rCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_class" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "countTotal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_user" (
    "id" UUID NOT NULL,
    "idRole" UUID NOT NULL,
    "idClass" UUID,
    "fullName" TEXT NOT NULL,
    "uCredentials" TEXT NOT NULL,
    "uPassword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_topic" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderNo" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_material" (
    "id" UUID NOT NULL,
    "idTopic" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "cp" TEXT,
    "concept" TEXT,
    "example1" TEXT,
    "example2" TEXT,
    "summary" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_test" (
    "id" UUID NOT NULL,
    "idClass" UUID NOT NULL,
    "idTopic" UUID NOT NULL,
    "idRubric" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "expOutput" TEXT NOT NULL,
    "maxTries" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_test_case" (
    "id" UUID NOT NULL,
    "idTest" UUID NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_test_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_hint" (
    "id" UUID NOT NULL,
    "idQuestion" UUID NOT NULL,
    "hint1" TEXT,
    "hint2" TEXT,
    "hint3" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_hint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_submission" (
    "id" UUID NOT NULL,
    "idUser" UUID NOT NULL,
    "idTest" UUID NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "compileStatus" "CompileStatus" NOT NULL DEFAULT 'PENDING',
    "executionStatus" "ExecutionStatus" NOT NULL DEFAULT 'WAITING',
    "executionTime" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_score" (
    "id" UUID NOT NULL,
    "idSubmission" UUID NOT NULL,
    "level" TEXT,
    "flagOverride" BOOLEAN NOT NULL DEFAULT false,
    "overallScore" INTEGER NOT NULL,
    "aiSuggestion" TEXT,
    "aiScore" INTEGER,
    "teacherSuggestion" TEXT,
    "teacherScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_verification" (
    "id" UUID NOT NULL,
    "idScore" UUID NOT NULL,
    "verifiedBy" UUID NOT NULL,
    "oldScore" INTEGER NOT NULL,
    "newScore" INTEGER NOT NULL,
    "note" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_progress" (
    "id" UUID NOT NULL,
    "idUser" UUID NOT NULL,
    "idTopic" UUID NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "lastAccess" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_activity_log" (
    "id" UUID NOT NULL,
    "idUser" UUID NOT NULL,
    "activity" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_rubric" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_rubric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "table_role_rCode_key" ON "table_role"("rCode");

-- CreateIndex
CREATE UNIQUE INDEX "table_user_uCredentials_key" ON "table_user"("uCredentials");

-- CreateIndex
CREATE UNIQUE INDEX "table_score_idSubmission_key" ON "table_score"("idSubmission");

-- AddForeignKey
ALTER TABLE "table_user" ADD CONSTRAINT "table_user_idRole_fkey" FOREIGN KEY ("idRole") REFERENCES "table_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_user" ADD CONSTRAINT "table_user_idClass_fkey" FOREIGN KEY ("idClass") REFERENCES "table_class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_material" ADD CONSTRAINT "table_material_idTopic_fkey" FOREIGN KEY ("idTopic") REFERENCES "table_topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_test" ADD CONSTRAINT "table_test_idClass_fkey" FOREIGN KEY ("idClass") REFERENCES "table_class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_test" ADD CONSTRAINT "table_test_idTopic_fkey" FOREIGN KEY ("idTopic") REFERENCES "table_topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_test" ADD CONSTRAINT "table_test_idRubric_fkey" FOREIGN KEY ("idRubric") REFERENCES "table_rubric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_test_case" ADD CONSTRAINT "table_test_case_idTest_fkey" FOREIGN KEY ("idTest") REFERENCES "table_test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_hint" ADD CONSTRAINT "table_hint_idQuestion_fkey" FOREIGN KEY ("idQuestion") REFERENCES "table_test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_submission" ADD CONSTRAINT "table_submission_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "table_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_submission" ADD CONSTRAINT "table_submission_idTest_fkey" FOREIGN KEY ("idTest") REFERENCES "table_test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_score" ADD CONSTRAINT "table_score_idSubmission_fkey" FOREIGN KEY ("idSubmission") REFERENCES "table_submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_verification" ADD CONSTRAINT "table_verification_idScore_fkey" FOREIGN KEY ("idScore") REFERENCES "table_score"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_verification" ADD CONSTRAINT "table_verification_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "table_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_progress" ADD CONSTRAINT "table_progress_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "table_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_progress" ADD CONSTRAINT "table_progress_idTopic_fkey" FOREIGN KEY ("idTopic") REFERENCES "table_topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_activity_log" ADD CONSTRAINT "table_activity_log_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "table_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
