import Link from "next/link";
import { Inbox, Plus, Search, SlidersHorizontal, X } from "lucide-react";
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
    priceLevel: asSingle(params.priceLevel),
    score: asSingle(params.score) as RestaurantFilters["score"]
  };
  const [restaurants, sources] = await Promise.all([listRestaurants(filters), listSources()]);
  const pendingCandidates = sources.reduce((count, source) => count + source.candidates.filter((candidate) => candidate.status === "pending").length, 0);
  const activeFilters = getActiveFilters(filters);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="label">Private restaurant memory</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Places worth remembering</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="button secondary cursor-default" aria-label={`${restaurants.length} ${restaurants.length === 1 ? "restaurant" : "restaurants"} in library`}>
            {restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"}
          </div>
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

      <form className="panel grid gap-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(16rem,2fr)_1fr_1fr_auto_auto] md:items-end">
          <label className="field">
            <span className="label">Search library</span>
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
              <input className="input pl-10" name="q" defaultValue={filters.q} placeholder="Soho lunch, child-friendly, date night..." />
            </span>
          </label>
          <FilterInput label="City" name="city" value={filters.city} />
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
          <button className="button" type="submit">
            <SlidersHorizontal size={16} />
            Filter
          </button>
          {activeFilters.length ? (
            <Link className="button secondary" href="/">
              <X size={16} />
              Clear
            </Link>
          ) : null}
        </div>
        <details className="grid gap-3" open={Boolean(filters.neighbourhood || filters.cuisine || filters.tag || filters.score || filters.priceLevel)}>
          <summary className="cursor-pointer text-sm font-semibold text-[var(--muted)]">More filters</summary>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <FilterInput label="Neighbourhood" name="neighbourhood" value={filters.neighbourhood} />
            <FilterInput label="Cuisine" name="cuisine" value={filters.cuisine} />
            <FilterInput label="Tag" name="tag" value={filters.tag} />
            <label className="field">
              <span className="label">Visit score</span>
              <select className="input" name="score" defaultValue={filters.score ?? "all"}>
                <option value="all">Any</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5</option>
              </select>
            </label>
          </div>
        </details>
        {activeFilters.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--muted)]">{restaurants.length} shown</span>
            {activeFilters.map((filter) => (
              <span className="chip success" key={filter.label}>
                {filter.label}: {filter.value}
              </span>
            ))}
          </div>
        ) : null}
      </form>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((restaurant) => (
          <RestaurantCard restaurant={restaurant} key={restaurant.id} />
        ))}
        {!restaurants.length ? (
          <div className="panel col-span-full grid justify-items-center gap-3 p-8 text-center text-[var(--muted)]">
            <p>No restaurants match these filters yet.</p>
            {activeFilters.length ? (
              <Link className="button secondary" href="/">
                <X size={16} />
                Clear filters
              </Link>
            ) : null}
          </div>
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

function getActiveFilters(filters: RestaurantFilters) {
  const entries = [
    ["Search", filters.q],
    ["City", filters.city],
    ["Neighbourhood", filters.neighbourhood],
    ["Cuisine", filters.cuisine],
    ["Tag", filters.tag],
    ["Status", filters.status && filters.status !== "all" ? filters.status.replaceAll("_", " ") : undefined],
    ["Visit score", filters.score && filters.score !== "all" ? `${filters.score}+` : undefined],
    ["Price", filters.priceLevel]
  ];
  return entries.filter((entry): entry is [string, string] => Boolean(entry[1])).map(([label, value]) => ({ label, value }));
}
