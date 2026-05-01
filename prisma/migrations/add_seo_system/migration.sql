-- Add blog model
CREATE TABLE "Blog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "excerpt" TEXT,
  "image" TEXT,
  "author" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "published" BOOLEAN NOT NULL DEFAULT false,
  "featuredImage" TEXT,
  "views" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "publishedAt" TIMESTAMP(3)
);

-- Create indexes for Blog
CREATE INDEX "Blog_slug_idx" ON "Blog"("slug");
CREATE INDEX "Blog_published_idx" ON "Blog"("published");
CREATE INDEX "Blog_category_idx" ON "Blog"("category");
CREATE INDEX "Blog_createdAt_idx" ON "Blog"("createdAt");

-- Add slug columns to Template and User
ALTER TABLE "Template" ADD COLUMN "slug" TEXT;
ALTER TABLE "User" ADD COLUMN "slug" TEXT;

-- Create unique indexes (after adding default values if needed)
CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");

-- Create indexes for slug columns
CREATE INDEX "Template_slug_idx" ON "Template"("slug");
CREATE INDEX "User_slug_idx" ON "User"("slug");
