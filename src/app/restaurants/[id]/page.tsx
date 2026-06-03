import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CircleAlert, CircleCheck, ExternalLink, MapPin, Pencil, Sparkles, Star, Trash } from "lucide-react";
import { AddToListForm } from "@/components/AddToListForm";
import { PhotoGallery } from "@/components/PhotoGallery";
import { VisitForm } from "@/components/VisitForm";
import { addRestaurantToListAction, deleteRestaurantAction, enrichRestaurantAction } from "@/app/actions";
import { getRestaurant, listRestaurantLists } from "@/lib/store";
import { formatDate, priceLabel } from "@/lib/utils";

export default async function RestaurantDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const notice = asSingle((await searchParams).notice);
  const [restaurant, lists] = await Promise.all([getRestaurant(id), listRestaurantLists()]);
  if (!restaurant) notFound();
  const enrichAction = enrichRestaurantAction.bind(null, restaurant.id);
  const deleteAction = deleteRestaurantAction.bind(null, restaurant.id);
  const addToListAction = addRestaurantToListAction.bind(null, restaurant.id);
  const enriched = restaurant.enrichmentConfidence !== null && restaurant.enrichmentConfidence !== undefined;

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">{restaurant.status.replaceAll("_", " ")}</span>
            {restaurant.cuisine ? <span className="chip">{restaurant.cuisine}</span> : null}
            <span className="chip">{priceLabel(restaurant.priceLevel)}</span>
            {restaurant.googleRating ? (
              <span className="chip">
                <Star size={13} fill="currentColor" />
                {restaurant.googleRating.toFixed(1)} ({restaurant.googleReviewCount ?? 0})
              </span>
            ) : null}
            {enriched ? (
              <span className="chip">
                <Sparkles size={13} />
                Enriched
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">{restaurant.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-[var(--muted)]">
            <MapPin size={17} />
            {[restaurant.address, restaurant.neighbourhood, restaurant.city].filter(Boolean).join(", ") || "Location to add"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="button secondary" href={`/restaurants/${restaurant.id}/edit`}>
            <Pencil size={16} />
            Edit
          </Link>
          <form action={enrichAction}>
            <button className="button secondary" type="submit">
              <Sparkles size={16} />
              Enrich
            </button>
          </form>
          <form action={deleteAction}>
            <button className="button danger" type="submit">
              <Trash size={16} />
              Delete
            </button>
          </form>
        </div>
      </section>

      {notice ? <Notice message={notice} /> : null}

      <section className="grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
        <div className="panel p-4">
          <h2 className="font-semibold">Memory</h2>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-[var(--muted)]">{restaurant.notes || restaurant.sourceSummary || "No notes yet."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {restaurant.tags.map((tag) => (
              <span className="chip" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <h2 className="font-semibold">Details</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row label="Canonical" value={restaurant.canonicalName} />
            <Row label="Phone" value={restaurant.phone} />
            <Row label="Website" value={restaurant.website ? <Link className="underline" href={restaurant.website}>Open <ExternalLink className="inline" size={12} /></Link> : null} />
            <Row label="Maps" value={restaurant.googleMapsUrl ? <Link className="underline" href={restaurant.googleMapsUrl}>Open <ExternalLink className="inline" size={12} /></Link> : null} />
            <Row label="Enrichment" value={enriched ? `Google Places run · ${Math.round(restaurant.enrichmentConfidence! * 100)}% confidence` : "Not enriched"} />
          </dl>
          <AddToListForm action={addToListAction} lists={lists} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} />
            <h2 className="text-xl font-semibold">Visit timeline</h2>
          </div>
          {restaurant.visits.map((visit) => (
            <article className="panel p-4" key={visit.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{formatDate(visit.visitDate)}</h3>
                  <p className="text-sm text-[var(--muted)]">{[visit.occasion, visit.companions].filter(Boolean).join(" with ")}</p>
                </div>
                {visit.rating ? <span className="chip">{visit.rating}/5</span> : null}
              </div>
              {visit.notes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{visit.notes}</p> : null}
              {visit.dishes ? <p className="mt-3 text-sm"><strong>Dishes:</strong> {visit.dishes}</p> : null}
              {visit.wineNotes ? <p className="mt-1 text-sm"><strong>Wine:</strong> {visit.wineNotes}</p> : null}
              <PhotoGallery photos={visit.photos} />
            </article>
          ))}
          {!restaurant.visits.length ? <div className="panel p-6 text-[var(--muted)]">No visits logged yet.</div> : null}
        </div>
        <div className="grid gap-3 self-start">
          <h2 className="text-xl font-semibold">Log a visit</h2>
          <VisitForm restaurantId={restaurant.id} />
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: React.ReactNode | null }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

function Notice({ message }: { message: string }) {
  const successful = message === "enriched";
  return (
    <div className={`panel flex items-start gap-2 p-3 text-sm ${successful ? "text-[var(--accent)]" : "text-[var(--accent-2)]"}`}>
      {successful ? <CircleCheck className="mt-0.5 shrink-0" size={16} /> : <CircleAlert className="mt-0.5 shrink-0" size={16} />}
      <span>{successful ? "Restaurant details enriched." : message}</span>
    </div>
  );
}

function asSingle(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}
