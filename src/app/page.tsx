import Link from "next/link";
import { Inbox, Plus, Search } from "lucide-react";
import { RestaurantCard } from "@/components/RestaurantCard";
import { listRestaurants, listSources } from "@/lib/store";
import type { RestaurantFilters } from "@/lib/types";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters: RestaurantFilters = {
    q: asSingle(params.q),
    city: asSingle(params.city),
    neighbourhood: asSingle(params.neighbourhood),
    cuisine: asSingle(params.cuisine),
    status: asSingle(params.status) as RestaurantFilters["status"],
    tag: asSingle(params.tag),
    visited: asSingle(params.visited) as RestaurantFilters["visited"],
    priceLevel: asSingle(params.priceLevel)
  };
  const [restaurants, sources] = await Promise.all([listRestaurants(filters), listSources()]);
  const pendingCandidates = sources.reduce((count, source) => count + source.candidates.filter((candidate) => candidate.status === "pending").length, 0);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="label">Private restaurant memory</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Places worth remembering</h1>
          <p className="mt-2 text-sm font-semibold text-[var(--muted)]">{restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"} in library</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="button secondary" href="/sources">
            <Inbox size={16} />
            {pendingCandidates} to review
          </Link>
          <Link className="button" href="/restaurants/new">
            <Plus size={16} />
            Manual add
          </Link>
        </div>
      </section>

      <form className="panel grid gap-3 p-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <label className="field">
          <span className="label">Search</span>
          <span className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
            <input className="input pl-9" name="q" defaultValue={filters.q} placeholder="fancy Indian, Soho lunch, child-friendly Broadstairs..." />
          </span>
        </label>
        <FilterInput label="City" name="city" value={filters.city} />
        <FilterInput label="Neighbourhood" name="neighbourhood" value={filters.neighbourhood} />
        <label className="field">
          <span className="label">Status</span>
          <select className="input" name="status" defaultValue={filters.status ?? "all"}>
            <option value="all">All</option>
            <option value="want_to_go">Want to go</option>
            <option value="booked">Booked</option>
            <option value="visited">Visited</option>
            <option value="not_interested">Not interested</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <button className="button self-end" type="submit">
          Filter
        </button>
      </form>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((restaurant) => (
          <RestaurantCard restaurant={restaurant} key={restaurant.id} />
        ))}
        {!restaurants.length ? (
          <div className="panel col-span-full p-8 text-center text-[var(--muted)]">No restaurants match these filters yet.</div>
        ) : null}
      </section>
    </div>
  );
}

function FilterInput({ label, name, value }: { label: string; name: string; value?: string }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      <input className="input" name={name} defaultValue={value} />
    </label>
  );
}

function asSingle(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}
