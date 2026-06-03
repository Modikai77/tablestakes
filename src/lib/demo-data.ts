import type { CandidateRecord, RestaurantListRecord, RestaurantRecord, SourceRecord } from "@/lib/types";

const now = new Date("2026-06-01T08:00:00.000Z");

export const demoSources: SourceRecord[] = [
  {
    id: "src-london-wine",
    type: "text",
    sourceLabel: "Wine article notes",
    rawText:
      "Noble Rot in Bloomsbury is still brilliant for wine and a long lunch. Also saved Kolae near Borough Market for Thai food with friends.",
    createdAt: now,
    processedAt: now,
    processingStatus: "processed",
    candidates: []
  },
  {
    id: "src-broadstairs-friend",
    type: "manual",
    sourceLabel: "Claire's Broadstairs list",
    rawText: "Wyatt & Jones on the seafront is great for seafood and a family lunch. Book ahead.",
    createdAt: now,
    processedAt: now,
    processingStatus: "processed",
    candidates: []
  }
];

export const demoCandidates: CandidateRecord[] = [
  {
    id: "cand-kolae",
    sourceId: "src-london-wine",
    name: "Kolae",
    city: "London",
    neighbourhood: "Borough",
    cuisine: "Thai",
    priceLevel: 2,
    tags: ["thai", "friends"],
    occasionTags: ["group", "casual"],
    evidenceSnippet: "saved Kolae near Borough Market for Thai food with friends",
    confidence: 0.86,
    recommendationReason: "Mentioned as a saved place for Thai food with friends.",
    status: "pending",
    createdAt: now,
    updatedAt: now
  }
];

export const demoRestaurants: RestaurantRecord[] = [
  {
    id: "rst-noble-rot",
    name: "Noble Rot",
    canonicalName: "Noble Rot Lamb's Conduit",
    address: "51 Lamb's Conduit St, London WC1N 3NB",
    city: "London",
    neighbourhood: "Bloomsbury",
    country: "United Kingdom",
    latitude: 51.5221,
    longitude: -0.1186,
    cuisine: "Modern British",
    priceLevel: 3,
    website: "https://noblerot.co.uk",
    phone: null,
    googlePlaceId: null,
    googleMapsUrl: "https://maps.google.com/?q=Noble+Rot+London",
    openingHours: null,
    status: "visited",
    notes: "Excellent wine list. Better for slow lunches than a quick bite.",
    sourceSummary: "Saved from wine article notes.",
    googleRating: 4.6,
    googleReviewCount: 1500,
    enrichmentMetadata: null,
    enrichmentConfidence: 0.8,
    tags: ["wine", "date night", "lunch"],
    sources: [demoSources[0]],
    visits: [
      {
        id: "visit-noble-rot-1",
        restaurantId: "rst-noble-rot",
        visitDate: new Date("2026-04-19T12:30:00.000Z"),
        rating: 5,
        companions: "Amit, Sarah",
        notes: "Terrific set lunch. The terrine and Jura by the glass were the winners.",
        dishes: "Terrine, roast chicken, lemon tart",
        wineNotes: "Jura chardonnay by the glass.",
        wouldReturn: true,
        occasion: "long lunch",
        createdAt: now,
        updatedAt: now,
        photos: []
      }
    ],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "rst-wyatt-jones",
    name: "Wyatt & Jones",
    canonicalName: "Wyatt & Jones",
    address: "23-27 Harbour St, Broadstairs CT10 1EU",
    city: "Broadstairs",
    neighbourhood: "Harbour",
    country: "United Kingdom",
    latitude: 51.3594,
    longitude: 1.4452,
    cuisine: "Seafood",
    priceLevel: 3,
    website: "https://wyattandjones.co.uk",
    phone: null,
    googlePlaceId: null,
    googleMapsUrl: "https://maps.google.com/?q=Wyatt+%26+Jones+Broadstairs",
    openingHours: null,
    status: "want_to_go",
    notes: "Friend recommendation for a good family lunch by the water.",
    sourceSummary: "Claire recommended it for Broadstairs seafood.",
    googleRating: null,
    googleReviewCount: null,
    enrichmentMetadata: null,
    enrichmentConfidence: null,
    tags: ["seafood", "family", "coastal"],
    sources: [demoSources[1]],
    visits: [],
    createdAt: now,
    updatedAt: now
  }
];

export const demoLists: RestaurantListRecord[] = [
  {
    id: "list-date-night",
    name: "Date nights",
    description: "Places that feel worth booking ahead for a proper evening out.",
    restaurants: [demoRestaurants[0]],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "list-coastal-weekends",
    name: "Coastal weekends",
    description: "Restaurants to remember for Broadstairs and seaside trips.",
    restaurants: [demoRestaurants[1]],
    createdAt: now,
    updatedAt: now
  }
];
