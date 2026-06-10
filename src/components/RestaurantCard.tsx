import Link from "next/link";
import { CalendarDays, MapPin, Sparkles, Star } from "lucide-react";
import { RestaurantStatusSelect } from "@/components/RestaurantStatusSelect";
import type { RestaurantRecord } from "@/lib/types";
import { formatDate, priceLabel } from "@/lib/utils";

export function RestaurantCard({ restaurant }: { restaurant: RestaurantRecord }) {
  const lastVisit = restaurant.visits[0];
  const restaurantHref = `/restaurants/${restaurant.id}`;
  const memory = restaurant.notes ?? restaurant.sourceSummary;

  return (
    <article className="panel p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Link href={restaurantHref} className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight">{restaurant.name}</h2>
          <p className="mt-1 flex items-start gap-1 text-sm text-[var(--muted)]">
            <MapPin className="mt-0.5 shrink-0" size={14} />
            {[restaurant.neighbourhood, restaurant.city].filter(Boolean).join(", ") || "Location to add"}
          </p>
        </Link>
        <RestaurantStatusSelect restaurantId={restaurant.id} status={restaurant.status} />
      </div>

      <Link href={restaurantHref} className="block">
        <div className="mt-3 flex flex-wrap gap-2 text-sm" aria-label="Restaurant metadata">
          {restaurant.cuisine ? <span className="chip">{restaurant.cuisine}</span> : null}
          <span className="chip">{priceLabel(restaurant.priceLevel)}</span>
          {restaurant.googleRating ? (
            <span className="chip">
              <Star size={13} fill="currentColor" /> Google {restaurant.googleRating.toFixed(1)}
            </span>
          ) : null}
          {lastVisit?.rating ? (
            <span className="chip">
              Last visit {lastVisit.rating}/5
            </span>
          ) : null}
        </div>
        {memory ? (
          <div className="mt-3 border-l-2 border-[var(--accent)] pl-3">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase text-[var(--muted)]">
              <Sparkles size={12} />
              Why it is here
            </p>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{memory}</p>
          </div>
        ) : null}
        {lastVisit ? (
          <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-[var(--muted)]">
            <CalendarDays size={13} />
            Last logged {formatDate(lastVisit.visitDate)}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {restaurant.tags.slice(0, 5).map((tag) => (
            <span className="chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </Link>
    </article>
  );
}
