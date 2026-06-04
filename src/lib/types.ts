export type RestaurantStatus = "want_to_go" | "booked" | "visited" | "not_interested" | "closed";
export type SourceType = "text" | "url" | "image" | "email" | "instagram" | "google_maps" | "manual";
export type ProcessingStatus = "pending" | "processing" | "processed" | "failed";
export type CandidateStatus = "pending" | "approved" | "rejected" | "merged";

export type PhotoRecord = {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  dishName?: string | null;
  tags: string[];
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type VisitRecord = {
  id: string;
  restaurantId: string;
  visitDate: Date;
  rating?: number | null;
  companions?: string | null;
  notes?: string | null;
  dishes?: string | null;
  wineNotes?: string | null;
  wouldReturn?: boolean | null;
  occasion?: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos: PhotoRecord[];
};

export type RestaurantRecord = {
  id: string;
  userId?: string;
  name: string;
  canonicalName?: string | null;
  address?: string | null;
  city?: string | null;
  neighbourhood?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cuisine?: string | null;
  priceLevel?: number | null;
  website?: string | null;
  phone?: string | null;
  googlePlaceId?: string | null;
  googleMapsUrl?: string | null;
  openingHours?: unknown;
  status: RestaurantStatus;
  notes?: string | null;
  sourceSummary?: string | null;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  enrichmentMetadata?: unknown;
  enrichmentConfidence?: number | null;
  tags: string[];
  visits: VisitRecord[];
  sources: SourceRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export type SourceRecord = {
  id: string;
  userId?: string;
  type: SourceType;
  rawText?: string | null;
  originalUrl?: string | null;
  uploadedImageUrl?: string | null;
  sourceLabel?: string | null;
  createdAt: Date;
  processedAt?: Date | null;
  processingStatus: ProcessingStatus;
  extractionError?: string | null;
  candidates: CandidateRecord[];
};

export type CandidateRecord = {
  id: string;
  sourceId: string;
  restaurantId?: string | null;
  name: string;
  city?: string | null;
  neighbourhood?: string | null;
  address?: string | null;
  cuisine?: string | null;
  priceLevel?: number | null;
  tags: string[];
  occasionTags: string[];
  evidenceSnippet?: string | null;
  confidence: number;
  recommendationReason?: string | null;
  status: CandidateStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type RestaurantFilters = {
  q?: string;
  cuisine?: string;
  neighbourhood?: string;
  city?: string;
  status?: RestaurantStatus | "all";
  tag?: string;
  visited?: "visited" | "unvisited" | "all";
  priceLevel?: string;
  score?: "3" | "4" | "5" | "all";
  lastVisitScore?: "1" | "2" | "3" | "4" | "5" | "all";
};

export type RestaurantListRecord = {
  id: string;
  userId?: string;
  name: string;
  description?: string | null;
  restaurants: RestaurantRecord[];
  createdAt: Date;
  updatedAt: Date;
};
