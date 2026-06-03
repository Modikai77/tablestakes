import type { RestaurantRecord } from "@/lib/types";

export type PlaceMatch = {
  placeId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  website?: string;
  phone?: string;
  openingHours?: unknown;
  priceLevel?: number;
  rating?: number;
  reviewCount?: number;
  confidence: number;
};

export async function findPlaceMatches(restaurant: Pick<RestaurantRecord, "name" | "city" | "neighbourhood" | "address">): Promise<PlaceMatch[]> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return [
      {
        placeId: `demo-${restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: restaurant.name,
        address: restaurant.address ?? [restaurant.neighbourhood, restaurant.city].filter(Boolean).join(", "),
        confidence: 0.25
      }
    ];
  }

  const query = [restaurant.name, restaurant.address, restaurant.neighbourhood, restaurant.city].filter(Boolean).join(" ");
  const searchUrl = new URL("https://places.googleapis.com/v1/places:searchText");
  const searchResponse = await fetch(searchUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.websiteUri,places.nationalPhoneNumber,places.regularOpeningHours,places.priceLevel,places.rating,places.userRatingCount"
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 5 })
  });

  if (!searchResponse.ok) {
    throw new Error(`Google Places lookup failed: ${searchResponse.status}`);
  }

  const data = (await searchResponse.json()) as {
    places?: Array<{
      id: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      googleMapsUri?: string;
      websiteUri?: string;
      nationalPhoneNumber?: string;
      regularOpeningHours?: unknown;
      priceLevel?: string;
      rating?: number;
      userRatingCount?: number;
    }>;
  };

  return (data.places ?? []).map((place, index) => ({
    placeId: place.id,
    name: place.displayName?.text ?? restaurant.name,
    address: place.formattedAddress,
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    googleMapsUrl: place.googleMapsUri,
    website: place.websiteUri,
    phone: place.nationalPhoneNumber,
    openingHours: place.regularOpeningHours,
    priceLevel: mapGooglePrice(place.priceLevel),
    rating: place.rating,
    reviewCount: place.userRatingCount,
    confidence: Math.max(0.45, 0.9 - index * 0.12)
  }));
}

function mapGooglePrice(price?: string) {
  if (!price) return undefined;
  const match = price.match(/[1-4]/);
  return match ? Number(match[0]) : undefined;
}

