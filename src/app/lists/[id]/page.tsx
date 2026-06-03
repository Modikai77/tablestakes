import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash } from "lucide-react";
import { removeRestaurantFromListAction } from "@/app/actions";
import { RestaurantCard } from "@/components/RestaurantCard";
import { getRestaurantList } from "@/lib/store";

export default async function ListDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const list = await getRestaurantList(id);
  if (!list) notFound();

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="label">Personal list</p>
          <h1 className="mt-1 text-3xl font-semibold">{list.name}</h1>
          {list.description ? <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">{list.description}</p> : null}
        </div>
        <Link className="button secondary" href="/">
          Browse library
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.restaurants.map((restaurant) => {
          const removeAction = removeRestaurantFromListAction.bind(null, list.id, restaurant.id);
          return (
            <div className="grid gap-2" key={restaurant.id}>
              <RestaurantCard restaurant={restaurant} />
              <form action={removeAction}>
                <button className="button secondary w-full" type="submit">
                  <Trash size={16} />
                  Remove from list
                </button>
              </form>
            </div>
          );
        })}
        {!list.restaurants.length ? <div className="panel col-span-full p-8 text-center text-[var(--muted)]">This list is empty.</div> : null}
      </section>
    </div>
  );
}

