-- CreateEnum
CREATE TYPE "RestaurantStatus" AS ENUM ('want_to_go', 'booked', 'visited', 'not_interested', 'closed');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('text', 'url', 'image', 'email', 'instagram', 'google_maps', 'manual');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('pending', 'processing', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('pending', 'approved', 'rejected', 'merged');

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "canonical_name" TEXT,
    "address" TEXT,
    "city" TEXT,
    "neighbourhood" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "cuisine" TEXT,
    "price_level" INTEGER,
    "website" TEXT,
    "phone" TEXT,
    "google_place_id" TEXT,
    "google_maps_url" TEXT,
    "opening_hours" JSONB,
    "status" "RestaurantStatus" NOT NULL DEFAULT 'want_to_go',
    "notes" TEXT,
    "source_summary" TEXT,
    "google_rating" DOUBLE PRECISION,
    "google_review_count" INTEGER,
    "enrichment_metadata" JSONB,
    "enrichment_confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "raw_text" TEXT,
    "original_url" TEXT,
    "uploaded_image_url" TEXT,
    "source_label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "processing_status" "ProcessingStatus" NOT NULL DEFAULT 'pending',
    "extraction_error" TEXT,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "email_verified" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracted_candidates" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "restaurant_id" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "neighbourhood" TEXT,
    "address" TEXT,
    "cuisine" TEXT,
    "price_level" INTEGER,
    "tags" TEXT[],
    "occasion_tags" TEXT[],
    "evidence_snippet" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "recommendation_reason" TEXT,
    "status" "CandidateStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extracted_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_sources" (
    "restaurant_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "evidence" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_sources_pkey" PRIMARY KEY ("restaurant_id","source_id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "rating" INTEGER,
    "companions" TEXT,
    "notes" TEXT,
    "dishes" TEXT,
    "wine_notes" TEXT,
    "would_return" BOOLEAN,
    "occasion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_photos" (
    "id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "caption" TEXT,
    "dish_name" TEXT,
    "tags" TEXT[],
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_tags" (
    "restaurant_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "restaurant_tags_pkey" PRIMARY KEY ("restaurant_id","tag_id")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "embedding" vector,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_lists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_list_items" (
    "list_id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_list_items_pkey" PRIMARY KEY ("list_id","restaurant_id")
);

-- CreateIndex
CREATE INDEX "restaurants_user_id_idx" ON "restaurants"("user_id");

-- CreateIndex
CREATE INDEX "restaurants_city_idx" ON "restaurants"("city");

-- CreateIndex
CREATE INDEX "restaurants_neighbourhood_idx" ON "restaurants"("neighbourhood");

-- CreateIndex
CREATE INDEX "restaurants_status_idx" ON "restaurants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_user_id_google_place_id_key" ON "restaurants"("user_id", "google_place_id");

-- CreateIndex
CREATE INDEX "sources_user_id_idx" ON "sources"("user_id");

-- CreateIndex
CREATE INDEX "sources_type_idx" ON "sources"("type");

-- CreateIndex
CREATE INDEX "sources_processing_status_idx" ON "sources"("processing_status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "extracted_candidates_source_id_idx" ON "extracted_candidates"("source_id");

-- CreateIndex
CREATE INDEX "visits_restaurant_id_idx" ON "visits"("restaurant_id");

-- CreateIndex
CREATE INDEX "visits_visit_date_idx" ON "visits"("visit_date");

-- CreateIndex
CREATE INDEX "visit_photos_visit_id_idx" ON "visit_photos"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "embeddings_owner_type_owner_id_idx" ON "embeddings"("owner_type", "owner_id");

-- CreateIndex
CREATE INDEX "restaurant_lists_user_id_idx" ON "restaurant_lists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_lists_user_id_name_key" ON "restaurant_lists"("user_id", "name");

-- CreateIndex
CREATE INDEX "restaurant_list_items_restaurant_id_idx" ON "restaurant_list_items"("restaurant_id");

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracted_candidates" ADD CONSTRAINT "extracted_candidates_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracted_candidates" ADD CONSTRAINT "extracted_candidates_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_sources" ADD CONSTRAINT "restaurant_sources_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_sources" ADD CONSTRAINT "restaurant_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_photos" ADD CONSTRAINT "visit_photos_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_tags" ADD CONSTRAINT "restaurant_tags_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_tags" ADD CONSTRAINT "restaurant_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_lists" ADD CONSTRAINT "restaurant_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_list_items" ADD CONSTRAINT "restaurant_list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "restaurant_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_list_items" ADD CONSTRAINT "restaurant_list_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
