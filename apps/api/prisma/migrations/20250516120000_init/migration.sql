-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "nextAction" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Feedback_sentiment_idx" ON "Feedback"("sentiment");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");
