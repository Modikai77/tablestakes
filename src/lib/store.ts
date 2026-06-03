import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { extractCandidates } from "@/lib/extraction";
import { findPlaceMatches } from "@/lib/places";
import { demoCandidates, demoLists, demoRestaurants, demoSources } from "@/lib/demo-data";
import type {
  CandidateRecord,
  RestaurantFilters,
  RestaurantListRecord,
  RestaurantRecord,
  RestaurantStatus,
  SourceRecord,
  SourceType,
  VisitRecord
} from "@/lib/types";

type AppState = {
  restaurants: RestaurantRecord[];
  sources: SourceRecord[];
  candidates: CandidateRecord[];
  lists: RestaurantListRecord[];
};

declare global {
  var __tablestakesState: Record<string, AppState> | undefined;
}

function state(userId: string) {
  if (!globalThis.__tablestakesState) {
    globalThis.__tablestakesState = {};
  }
  if (!globalThis.__tablestakesState[userId]) {
    const restaurants = structuredClone(demoRestaurants).map((restaurant) => ({ ...restaurant, userId }));
    const sources = structuredClone(demoSources).map((source) => ({ ...source, userId }));
    const candidates = structuredClone(demoCandidates);
    const lists = structuredClone(demoLists).map((list) => ({
      ...list,
      userId,
      restaurants: list.restaurants.map((restaurant) => restaurants.find((item) => item.id === restaurant.id)).filter(Boolean) as RestaurantRecord[]
    }));

    globalThis.__tablestakesState[userId] = {
      restaurants,
      sources,
      candidates,
      lists
    };
    globalThis.__tablestakesState[userId].sources.forEach((source) => {
      source.candidates = globalThis.__tablestakesState![userId].candidates.filter((candidate) => candidate.sourceId === source.id);
    });
  }
  return globalThis.__tablestakesState[userId];
}

const restaurantInclude = {
  tags: { include: { tag: true } },
  visits: { include: { photos: { orderBy: { displayOrder: "asc" } } }, orderBy: { visitDate: "desc" } },
  restaurantSources: { include: { source: { include: { candidates: true } } } },
  listItems: { include: { list: true } }
};

const sourceInclude = {
  candidates: { orderBy: { createdAt: "desc" } },
  restaurants: { include: { restaurant: true } }
};

const listInclude = {
  items: {
    include: {
      restaurant: { include: restaurantInclude }
    },
    orderBy: { createdAt: "desc" }
  }
};

export async function listRestaurants(filters: RestaurantFilters = {}) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const restaurants = await db.restaurant.findMany({
      where: { userId: user.id },
      include: restaurantInclude,
      orderBy: { updatedAt: "desc" }
    } as never);
    return filterRestaurants(restaurants.map(mapRestaurant), filters);
  }
  return filterRestaurants(state(user.id).restaurants, filters);
}

export async function getRestaurant(id: string) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const restaurant = await db.restaurant.findFirst({
      where: { id, userId: user.id },
      include: restaurantInclude
    } as never);
    return restaurant ? mapRestaurant(restaurant) : null;
  }
  return state(user.id).restaurants.find((restaurant) => restaurant.id === id) ?? null;
}

export async function listSources() {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const sources = await db.source.findMany({
      where: { userId: user.id },
      include: sourceInclude,
      orderBy: { createdAt: "desc" }
    } as never);
    return sources.map(mapSource);
  }
  return state(user.id).sources.map((source) => ({ ...source, candidates: state(user.id).candidates.filter((candidate) => candidate.sourceId === source.id) }));
}

export async function getSource(id: string) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const source = await db.source.findFirst({
      where: { id, userId: user.id },
      include: sourceInclude
    } as never);
    return source ? mapSource(source) : null;
  }
  return (await listSources()).find((source) => source.id === id) ?? null;
}

export async function createRestaurant(input: {
  name: string;
  canonicalName?: string;
  address?: string;
  city?: string;
  neighbourhood?: string;
  country?: string;
  cuisine?: string;
  priceLevel?: number;
  website?: string;
  phone?: string;
  googleMapsUrl?: string;
  status?: RestaurantStatus;
  notes?: string;
  sourceSummary?: string;
  tags?: string[];
}) {
  const user = await requireUser();
  const tags = cleanTags(input.tags ?? []);
  const db = getPrisma();
  if (db) {
    const restaurant = await db.restaurant.create({
      data: {
        ...input,
        userId: user.id,
        tags: {
          create: tags.map((name) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } }
          }))
        }
      },
      include: restaurantInclude
    } as never);
    revalidateAll();
    return mapRestaurant(restaurant);
  }

  const now = new Date();
  const restaurant: RestaurantRecord = {
    id: id("rst"),
    userId: user.id,
    name: input.name,
    canonicalName: input.canonicalName,
    address: input.address,
    city: input.city,
    neighbourhood: input.neighbourhood,
    country: input.country ?? "United Kingdom",
    latitude: null,
    longitude: null,
    cuisine: input.cuisine,
    priceLevel: input.priceLevel,
    website: input.website,
    phone: input.phone,
    googlePlaceId: null,
    googleMapsUrl: input.googleMapsUrl,
    openingHours: null,
    status: input.status ?? "want_to_go",
    notes: input.notes,
    sourceSummary: input.sourceSummary,
    googleRating: null,
    googleReviewCount: null,
    enrichmentMetadata: null,
    enrichmentConfidence: null,
    tags,
    visits: [],
    sources: [],
    createdAt: now,
    updatedAt: now
  };
  state(user.id).restaurants.unshift(restaurant);
  revalidateAll();
  return restaurant;
}

export async function updateRestaurant(idValue: string, input: Partial<RestaurantRecord> & { tags?: string[] }) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const existing = await db.restaurant.findFirst({ where: { id: idValue, userId: user.id } });
    if (!existing) return null;
    await db.restaurantTag.deleteMany({ where: { restaurantId: idValue } } as never);
    const restaurant = await db.restaurant.update({
      where: { id: idValue },
      data: {
        name: input.name,
        canonicalName: input.canonicalName,
        address: input.address,
        city: input.city,
        neighbourhood: input.neighbourhood,
        country: input.country,
        cuisine: input.cuisine,
        priceLevel: input.priceLevel,
        website: input.website,
        phone: input.phone,
        googleMapsUrl: input.googleMapsUrl,
        status: input.status,
        notes: input.notes,
        sourceSummary: input.sourceSummary,
        tags: {
          create: cleanTags(input.tags ?? []).map((name) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } }
          }))
        }
      },
      include: restaurantInclude
    } as never);
    revalidateAll();
    return mapRestaurant(restaurant);
  }

  const existing = state(user.id).restaurants.find((restaurant) => restaurant.id === idValue);
  if (!existing) return null;
  Object.assign(existing, input, { updatedAt: new Date(), tags: cleanTags(input.tags ?? existing.tags) });
  revalidateAll();
  return existing;
}

export async function deleteRestaurant(idValue: string) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const existing = await db.restaurant.findFirst({ where: { id: idValue, userId: user.id } });
    if (existing) await db.restaurant.delete({ where: { id: idValue } });
  } else {
    const appState = state(user.id);
    appState.restaurants = appState.restaurants.filter((restaurant) => restaurant.id !== idValue);
    appState.lists.forEach((list) => {
      list.restaurants = list.restaurants.filter((restaurant) => restaurant.id !== idValue);
    });
  }
  revalidateAll();
}

export async function addSource(input: {
  type: SourceType;
  rawText?: string;
  originalUrl?: string;
  sourceLabel?: string;
  image?: File | null;
}) {
  const user = await requireUser();
  const uploadedImageUrl = await uploadImage(input.image, "sources");
  const db = getPrisma();
  if (db) {
    const source = await db.source.create({
      data: {
        userId: user.id,
        type: input.type,
        rawText: input.rawText,
        originalUrl: input.originalUrl,
        sourceLabel: input.sourceLabel,
        uploadedImageUrl,
        processingStatus: "pending"
      },
      include: sourceInclude
    } as never);
    revalidateAll();
    return mapSource(source);
  }

  const now = new Date();
  const source: SourceRecord = {
    id: id("src"),
    userId: user.id,
    type: input.type,
    rawText: input.rawText,
    originalUrl: input.originalUrl,
    uploadedImageUrl,
    sourceLabel: input.sourceLabel,
    createdAt: now,
    processedAt: null,
    processingStatus: "pending",
    extractionError: null,
    candidates: []
  };
  state(user.id).sources.unshift(source);
  revalidateAll();
  return source;
}

export async function processSource(idValue: string) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const sourceOwner = await db.source.findFirst({ where: { id: idValue, userId: user.id } });
    if (!sourceOwner) throw new Error("Source not found");
    await db.source.update({ where: { id: idValue }, data: { processingStatus: "processing" } as never });
    const source = await getSource(idValue);
    if (!source) throw new Error("Source not found");
    try {
      const candidates = await extractCandidates(source);
      await db.extractedCandidate.deleteMany({ where: { sourceId: idValue, status: "pending" } } as never);
      await db.extractedCandidate.createMany({
        data: candidates.map((candidate) => ({
          sourceId: idValue,
          ...candidate,
          tags: candidate.tags ?? [],
          occasionTags: candidate.occasionTags ?? []
        }))
      } as never);
      await db.source.update({
        where: { id: idValue },
        data: { processingStatus: "processed", processedAt: new Date(), extractionError: null } as never
      });
    } catch (error) {
      await db.source.update({
        where: { id: idValue },
        data: { processingStatus: "failed", extractionError: error instanceof Error ? error.message : "Extraction failed" } as never
      });
    }
    revalidateAll();
    return getSource(idValue);
  }

  const source = state(user.id).sources.find((item) => item.id === idValue);
  if (!source) throw new Error("Source not found");
  source.processingStatus = "processing";
  try {
    const extracted = await extractCandidates(source);
    state(user.id).candidates = state(user.id).candidates.filter((candidate) => candidate.sourceId !== idValue || candidate.status !== "pending");
    const now = new Date();
    const candidates = extracted.map((candidate) => ({
      ...candidate,
      id: id("cand"),
      sourceId: idValue,
      status: "pending" as const,
      createdAt: now,
      updatedAt: now
    }));
    state(user.id).candidates.push(...candidates);
    source.candidates = candidates;
    source.processingStatus = "processed";
    source.processedAt = now;
    source.extractionError = null;
  } catch (error) {
    source.processingStatus = "failed";
    source.extractionError = error instanceof Error ? error.message : "Extraction failed";
  }
  revalidateAll();
  return getSource(idValue);
}

export async function approveCandidate(candidateId: string, mergeRestaurantId?: string) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const candidate = await db.extractedCandidate.findFirst({
      where: { id: candidateId, source: { userId: user.id } },
      include: { source: true }
    } as never);
    if (!candidate) throw new Error("Candidate not found");
    const mergeTarget = mergeRestaurantId ? await db.restaurant.findFirst({ where: { id: mergeRestaurantId, userId: user.id } }) : null;
    const targetId = mergeTarget?.id || (await findDuplicateId(candidate.name, candidate.city ?? undefined));
    let restaurantId = targetId;
    if (!restaurantId) {
      const restaurant = await createRestaurant({
        name: candidate.name,
        city: candidate.city ?? undefined,
        neighbourhood: candidate.neighbourhood ?? undefined,
        address: candidate.address ?? undefined,
        cuisine: candidate.cuisine ?? undefined,
        priceLevel: candidate.priceLevel ?? undefined,
        sourceSummary: candidate.recommendationReason ?? candidate.evidenceSnippet ?? undefined,
        tags: [...candidate.tags, ...candidate.occasionTags]
      });
      restaurantId = restaurant.id;
    }
    await db.restaurantSource.upsert({
      where: { restaurantId_sourceId: { restaurantId, sourceId: candidate.sourceId } },
      update: { evidence: candidate.evidenceSnippet },
      create: { restaurantId, sourceId: candidate.sourceId, evidence: candidate.evidenceSnippet }
    } as never);
    await db.extractedCandidate.update({
      where: { id: candidateId },
      data: { status: mergeRestaurantId ? "merged" : "approved", restaurantId } as never
    });
    revalidateAll();
    return restaurantId;
  }

  const candidate = state(user.id).candidates.find((item) => item.id === candidateId);
  if (!candidate) throw new Error("Candidate not found");
  const duplicate = mergeRestaurantId ? state(user.id).restaurants.find((item) => item.id === mergeRestaurantId) : findMemoryDuplicate(user.id, candidate.name, candidate.city);
  let restaurant = duplicate;
  if (!restaurant) {
    restaurant = await createRestaurant({
      name: candidate.name,
      city: candidate.city ?? undefined,
      neighbourhood: candidate.neighbourhood ?? undefined,
      address: candidate.address ?? undefined,
      cuisine: candidate.cuisine ?? undefined,
      priceLevel: candidate.priceLevel ?? undefined,
      sourceSummary: candidate.recommendationReason ?? candidate.evidenceSnippet ?? undefined,
      tags: [...candidate.tags, ...candidate.occasionTags]
    });
  }
  const source = state(user.id).sources.find((item) => item.id === candidate.sourceId);
  if (source && !restaurant.sources.some((item) => item.id === source.id)) restaurant.sources.push(source);
  candidate.restaurantId = restaurant.id;
  candidate.status = mergeRestaurantId ? "merged" : "approved";
  candidate.updatedAt = new Date();
  revalidateAll();
  return restaurant.id;
}

export async function rejectCandidate(candidateId: string) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const candidate = await db.extractedCandidate.findFirst({ where: { id: candidateId, source: { userId: user.id } } });
    if (candidate) await db.extractedCandidate.update({ where: { id: candidateId }, data: { status: "rejected" } as never });
  } else {
    const candidate = state(user.id).candidates.find((item) => item.id === candidateId);
    if (candidate) candidate.status = "rejected";
  }
  revalidateAll();
}

export async function enrichRestaurant(idValue: string, placeId?: string) {
  const restaurant = await getRestaurant(idValue);
  if (!restaurant) throw new Error("Restaurant not found");
  const matches = await findPlaceMatches(restaurant);
  const match = matches.find((item) => item.placeId === placeId) ?? matches[0];
  if (!match) return null;

  const updates: Partial<RestaurantRecord> = {
    canonicalName: match.name,
    address: match.address,
    latitude: match.latitude,
    longitude: match.longitude,
    googlePlaceId: match.placeId,
    googleMapsUrl: match.googleMapsUrl,
    website: match.website,
    phone: match.phone,
    openingHours: match.openingHours,
    priceLevel: match.priceLevel ?? restaurant.priceLevel,
    googleRating: match.rating,
    googleReviewCount: match.reviewCount,
    enrichmentMetadata: { provider: "google_places", match },
    enrichmentConfidence: match.confidence
  };

  const db = getPrisma();
  if (db) {
    await db.restaurant.update({ where: { id: idValue }, data: updates as never });
  } else {
    Object.assign(restaurant, updates, { updatedAt: new Date() });
  }
  revalidateAll();
  return match;
}

export async function addVisit(input: {
  restaurantId: string;
  visitDate: Date;
  rating?: number;
  companions?: string;
  notes?: string;
  dishes?: string;
  wineNotes?: string;
  wouldReturn?: boolean;
  occasion?: string;
  photos?: File[];
}) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const restaurantOwner = await db.restaurant.findFirst({ where: { id: input.restaurantId, userId: user.id } });
    if (!restaurantOwner) throw new Error("Restaurant not found");
    const visit = await db.visit.create({
      data: {
        restaurantId: input.restaurantId,
        visitDate: input.visitDate,
        rating: input.rating,
        companions: input.companions,
        notes: input.notes,
        dishes: input.dishes,
        wineNotes: input.wineNotes,
        wouldReturn: input.wouldReturn,
        occasion: input.occasion,
        photos: {
          create: await Promise.all(
            (input.photos ?? []).map(async (file, index) => ({
              url: await uploadImage(file, "visits"),
              displayOrder: index
            }))
          )
        }
      },
      include: { photos: true }
    } as never);
    await db.restaurant.update({ where: { id: input.restaurantId }, data: { status: "visited" } as never });
    revalidateAll();
    return visit;
  }

  const restaurant = state(user.id).restaurants.find((item) => item.id === input.restaurantId);
  if (!restaurant) throw new Error("Restaurant not found");
  const now = new Date();
  const visit: VisitRecord = {
    id: id("visit"),
    restaurantId: input.restaurantId,
    visitDate: input.visitDate,
    rating: input.rating,
    companions: input.companions,
    notes: input.notes,
    dishes: input.dishes,
    wineNotes: input.wineNotes,
    wouldReturn: input.wouldReturn,
    occasion: input.occasion,
    createdAt: now,
    updatedAt: now,
    photos: await Promise.all(
      (input.photos ?? []).map(async (file, index) => ({
        id: id("photo"),
        url: (await uploadImage(file, "visits")) ?? "",
        thumbnailUrl: null,
        caption: null,
        dishName: null,
        tags: [],
        displayOrder: index,
        createdAt: now,
        updatedAt: now
      }))
    )
  };
  restaurant.visits.unshift(visit);
  restaurant.status = "visited";
  restaurant.updatedAt = now;
  revalidateAll();
  return visit;
}

export async function deleteVisitPhoto(photoId: string) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const photo = await db.visitPhoto.findFirst({ where: { id: photoId, visit: { restaurant: { userId: user.id } } } });
    if (photo) await db.visitPhoto.delete({ where: { id: photoId } });
  } else {
    for (const restaurant of state(user.id).restaurants) {
      for (const visit of restaurant.visits) {
        visit.photos = visit.photos.filter((photo) => photo.id !== photoId);
      }
    }
  }
  revalidateAll();
}

export async function reorderVisitPhotos(visitId: string, photoIds: string[]) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const visit = await db.visit.findFirst({ where: { id: visitId, restaurant: { userId: user.id } } });
    if (!visit) throw new Error("Visit not found");
    await Promise.all(
      photoIds.map((photoId, index) =>
        db.visitPhoto.update({
          where: { id: photoId },
          data: { displayOrder: index } as never
        })
      )
    );
  } else {
    for (const restaurant of state(user.id).restaurants) {
      const visit = restaurant.visits.find((item) => item.id === visitId);
      if (visit) {
        visit.photos = [...visit.photos].sort((a, b) => photoIds.indexOf(a.id) - photoIds.indexOf(b.id));
        visit.photos.forEach((photo, index) => {
          photo.displayOrder = index;
        });
      }
    }
  }
  revalidateAll();
}

export async function listRestaurantLists() {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const lists = await db.restaurantList.findMany({
      where: { userId: user.id },
      include: listInclude,
      orderBy: { updatedAt: "desc" }
    } as never);
    return lists.map(mapList);
  }
  return state(user.id).lists;
}

export async function getRestaurantList(idValue: string) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const list = await db.restaurantList.findFirst({
      where: { id: idValue, userId: user.id },
      include: listInclude
    } as never);
    return list ? mapList(list) : null;
  }
  return state(user.id).lists.find((list) => list.id === idValue) ?? null;
}

export async function createRestaurantList(input: { name: string; description?: string }) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const list = await db.restaurantList.upsert({
      where: { userId_name: { userId: user.id, name: input.name } },
      update: input.description === undefined ? {} : { description: input.description },
      create: {
        userId: user.id,
        name: input.name,
        description: input.description
      },
      include: listInclude
    } as never);
    revalidateAll();
    return mapList(list);
  }

  const existing = state(user.id).lists.find((list) => normalise(list.name) === normalise(input.name));
  if (existing) return existing;

  const now = new Date();
  const list: RestaurantListRecord = {
    id: id("list"),
    userId: user.id,
    name: input.name,
    description: input.description,
    restaurants: [],
    createdAt: now,
    updatedAt: now
  };
  state(user.id).lists.unshift(list);
  revalidateAll();
  return list;
}

export async function addRestaurantToList(listId: string, restaurantId: string) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const [list, restaurant] = await Promise.all([
      db.restaurantList.findFirst({ where: { id: listId, userId: user.id } }),
      db.restaurant.findFirst({ where: { id: restaurantId, userId: user.id } })
    ]);
    if (!list || !restaurant) throw new Error("List or restaurant not found");
    await db.restaurantListItem.upsert({
      where: { listId_restaurantId: { listId, restaurantId } },
      update: {},
      create: { listId, restaurantId }
    } as never);
    revalidateAll();
    return;
  }

  const appState = state(user.id);
  const list = appState.lists.find((item) => item.id === listId);
  const restaurant = appState.restaurants.find((item) => item.id === restaurantId);
  if (!list || !restaurant) throw new Error("List or restaurant not found");
  if (!list.restaurants.some((item) => item.id === restaurant.id)) list.restaurants.unshift(restaurant);
  revalidateAll();
}

export async function removeRestaurantFromList(listId: string, restaurantId: string) {
  const user = await requireUser();
  const db = getPrisma();
  if (db) {
    const list = await db.restaurantList.findFirst({ where: { id: listId, userId: user.id } });
    if (list) {
      await db.restaurantListItem.deleteMany({ where: { listId, restaurantId } } as never);
    }
  } else {
    const list = state(user.id).lists.find((item) => item.id === listId);
    if (list) list.restaurants = list.restaurants.filter((restaurant) => restaurant.id !== restaurantId);
  }
  revalidateAll();
}

export async function findDuplicateId(name: string, city?: string) {
  await requireUser();
  const restaurants = await listRestaurants({});
  const duplicate = restaurants.find((restaurant) => normalise(restaurant.name) === normalise(name) && (!city || normalise(restaurant.city) === normalise(city)));
  return duplicate?.id;
}

function filterRestaurants(restaurants: RestaurantRecord[], filters: RestaurantFilters) {
  const query = filters.q?.toLowerCase().trim();
  return restaurants.filter((restaurant) => {
    const haystack = [
      restaurant.name,
      restaurant.canonicalName,
      restaurant.address,
      restaurant.city,
      restaurant.neighbourhood,
      restaurant.cuisine,
      restaurant.notes,
      restaurant.sourceSummary,
      restaurant.tags.join(" ")
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (query && !scoreSemantic(haystack, query)) return false;
    if (filters.cuisine && restaurant.cuisine?.toLowerCase() !== filters.cuisine.toLowerCase()) return false;
    if (filters.neighbourhood && restaurant.neighbourhood?.toLowerCase() !== filters.neighbourhood.toLowerCase()) return false;
    if (filters.city && restaurant.city?.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.status && filters.status !== "all" && restaurant.status !== filters.status) return false;
    if (filters.tag && !restaurant.tags.some((tag) => tag.toLowerCase() === filters.tag?.toLowerCase())) return false;
    if (filters.priceLevel && String(restaurant.priceLevel ?? "") !== filters.priceLevel) return false;
    if (filters.visited === "visited" && restaurant.visits.length === 0) return false;
    if (filters.visited === "unvisited" && restaurant.visits.length > 0) return false;
    return true;
  });
}

function scoreSemantic(haystack: string, query: string) {
  const terms = query.split(/\s+/).filter((term) => term.length > 2);
  const synonyms: Record<string, string[]> = {
    fancy: ["special", "date", "wine", "£££"],
    child: ["family", "casual"],
    "child-friendly": ["family", "casual"],
    lunch: ["lunch", "business"],
    south: ["peckham", "brixton", "borough"],
    unvisited: ["want_to_go", "saved"],
    visited: ["visited"]
  };
  return terms.some((term) => haystack.includes(term) || (synonyms[term] ?? []).some((synonym) => haystack.includes(synonym)));
}

async function uploadImage(file: File | null | undefined, folder: string) {
  if (!file || file.size === 0) return undefined;
  if (!file.type.startsWith("image/")) throw new Error("Only image uploads are supported.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Images must be 8MB or smaller.");
  if (!blobUploadsConfigured()) return `/uploads/demo-${Date.now()}-${file.name}`;
  const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, { access: "public" });
  return blob.url;
}

function blobUploadsConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function mapRestaurant(raw: any): RestaurantRecord {
  return {
    id: raw.id,
    userId: raw.userId,
    name: raw.name,
    canonicalName: raw.canonicalName,
    address: raw.address,
    city: raw.city,
    neighbourhood: raw.neighbourhood,
    country: raw.country,
    latitude: raw.latitude,
    longitude: raw.longitude,
    cuisine: raw.cuisine,
    priceLevel: raw.priceLevel,
    website: raw.website,
    phone: raw.phone,
    googlePlaceId: raw.googlePlaceId,
    googleMapsUrl: raw.googleMapsUrl,
    openingHours: raw.openingHours,
    status: raw.status,
    notes: raw.notes,
    sourceSummary: raw.sourceSummary,
    googleRating: raw.googleRating,
    googleReviewCount: raw.googleReviewCount,
    enrichmentMetadata: raw.enrichmentMetadata,
    enrichmentConfidence: raw.enrichmentConfidence,
    tags: raw.tags?.map((item: any) => item.tag?.name ?? item.name).filter(Boolean) ?? [],
    visits:
      raw.visits?.map((visit: any) => ({
        id: visit.id,
        restaurantId: visit.restaurantId,
        visitDate: visit.visitDate,
        rating: visit.rating,
        companions: visit.companions,
        notes: visit.notes,
        dishes: visit.dishes,
        wineNotes: visit.wineNotes,
        wouldReturn: visit.wouldReturn,
        occasion: visit.occasion,
        createdAt: visit.createdAt,
        updatedAt: visit.updatedAt,
        photos: visit.photos ?? []
      })) ?? [],
    sources: raw.restaurantSources?.map((item: any) => mapSource(item.source)) ?? raw.sources ?? [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
}

function mapSource(raw: any): SourceRecord {
  return {
    id: raw.id,
    userId: raw.userId,
    type: raw.type,
    rawText: raw.rawText,
    originalUrl: raw.originalUrl,
    uploadedImageUrl: raw.uploadedImageUrl,
    sourceLabel: raw.sourceLabel,
    createdAt: raw.createdAt,
    processedAt: raw.processedAt,
    processingStatus: raw.processingStatus,
    extractionError: raw.extractionError,
    candidates: raw.candidates?.map(mapCandidate) ?? []
  };
}

function mapList(raw: any): RestaurantListRecord {
  return {
    id: raw.id,
    userId: raw.userId,
    name: raw.name,
    description: raw.description,
    restaurants: raw.items?.map((item: any) => mapRestaurant(item.restaurant)) ?? raw.restaurants ?? [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
}

function mapCandidate(raw: any): CandidateRecord {
  return {
    id: raw.id,
    sourceId: raw.sourceId,
    restaurantId: raw.restaurantId,
    name: raw.name,
    city: raw.city,
    neighbourhood: raw.neighbourhood,
    address: raw.address,
    cuisine: raw.cuisine,
    priceLevel: raw.priceLevel,
    tags: raw.tags ?? [],
    occasionTags: raw.occasionTags ?? [],
    evidenceSnippet: raw.evidenceSnippet,
    confidence: raw.confidence,
    recommendationReason: raw.recommendationReason,
    status: raw.status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
}

function findMemoryDuplicate(userId: string, name: string, city?: string | null) {
  return state(userId).restaurants.find((restaurant) => normalise(restaurant.name) === normalise(name) && (!city || normalise(restaurant.city) === normalise(city)));
}

function normalise(value?: string | null) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cleanTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)));
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/restaurants");
  revalidatePath("/sources");
  revalidatePath("/lists");
}
