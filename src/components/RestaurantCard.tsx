import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import type { RestaurantRecord } from "@/lib/types";
import { priceLabel } from "@/lib/utils";

export function RestaurantCard({ restaurant }: { restaurant: RestaurantRecord }) {
  const lastVisit = restaurant.visits[0];

  return (
    <Link href={`/restaurants/${restaurant.id}`} className="panel block p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-tight">{restaurant.name}</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-[var(--muted)]">
            <MapPin size={14} />
            {[restaurant.neighbourhood, restaurant.city].filter(Boolean).join(", ") || "Location to add"}
          </p>
        </div>
        <span className="chip">{restaurant.status.replaceAll("_", " ")}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {restaurant.cuisine ? <span className="chip">{restaurant.cuisine}</span> : null}
        <span className="chip">{priceLabel(restaurant.priceLevel)}</span>
        {restaurant.googleRating ? (
          <span className="chip">
            <Star size={13} fill="currentColor" /> {restaurant.googleRating.toFixed(1)}
          </span>
        ) : null}
        {lastVisit?.rating ? (
          <span className="chip">
            Last visit {lastVisit.rating}/5
          </span>
        ) : null}
      </div>
      {restaurant.notes || restaurant.sourceSummary ? (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{restaurant.notes ?? restaurant.sourceSummary}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {restaurant.tags.slice(0, 5).map((tag) => (
          <span className="chip" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
