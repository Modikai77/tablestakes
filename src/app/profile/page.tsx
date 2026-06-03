import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { listRestaurantLists, listRestaurants, listSources } from "@/lib/store";

export default async function ProfilePage() {
  const user = await requireUser();
  const [restaurants, sources, lists] = await Promise.all([listRestaurants({}), listSources(), listRestaurantLists()]);
  const visits = restaurants.reduce((count, restaurant) => count + restaurant.visits.length, 0);

  return (
    <div className="grid gap-6">
      <section className="panel flex flex-col gap-4 p-5 md:flex-row md:items-center">
        {user.image ? (
          <Image src={user.image} alt="" width={72} height={72} className="rounded-full" />
        ) : (
          <div className="grid size-16 place-items-center rounded-full bg-[var(--soft)] text-2xl font-semibold">{user.email.slice(0, 1).toUpperCase()}</div>
        )}
        <div>
          <p className="label">User profile</p>
          <h1 className="mt-1 text-3xl font-semibold">{user.name || user.email}</h1>
          <p className="mt-1 text-[var(--muted)]">{user.email}</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Restaurants" value={restaurants.length} />
        <Stat label="Sources" value={sources.length} />
        <Stat label="Lists" value={lists.length} />
        <Stat label="Visits" value={visits} />
      </section>

      <section className="panel p-4">
        <h2 className="font-semibold">Privacy</h2>
        <p className="mt-2 leading-7 text-[var(--muted)]">
          Restaurants, source inbox items, extraction candidates, lists and visit logs are stored against your user id and queried only for your account.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-4">
      <p className="label">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

