-- CreateTable
CREATE TABLE "analytics_insights" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "insightType" TEXT NOT NULL,
    "category" TEXT,
    "content" TEXT NOT NULL,
    "score" REAL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "keyword" TEXT NOT NULL,
    "category" TEXT,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "trend" TEXT,
    "lastUpdated" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "topic_clusters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clusterName" TEXT NOT NULL,
    "description" TEXT,
    "sessionIds" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "percentage" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "keywords_keyword_key" ON "keywords"("keyword");
