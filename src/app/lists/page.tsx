import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { createListAction } from "@/app/actions";
import { listRestaurantLists } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default async function ListsPage() {
  const lists = await listRestaurantLists();

  return (
    <div className="grid gap-6">
      <section>
        <p className="label">Personal collections</p>
        <h1 className="mt-1 text-3xl font-semibold">Your lists</h1>
      </section>

      <form action={createListAction} className="panel grid gap-4 p-4 md:grid-cols-[1fr_2fr_auto]">
        <label className="field">
          <span className="label">List name</span>
          <input className="input" name="name" placeholder="Date nights, Paris ideas, family lunches..." required />
        </label>
        <label className="field">
          <span className="label">Description</span>
          <input className="input" name="description" />
        </label>
        <button className="button self-end" type="submit">
          <Plus size={16} />
          Create list
        </button>
      </form>

      <section className="grid gap-3 md:grid-cols-2">
        {lists.map((list) => (
          <Link className="panel flex items-center justify-between gap-4 p-4" href={`/lists/${list.id}`} key={list.id}>
            <div>
              <h2 className="text-lg font-semibold">{list.name}</h2>
              {list.description ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{list.description}</p> : null}
              <p className="mt-3 text-xs text-[var(--muted)]">
                {list.restaurants.length} restaurants · updated {formatDate(list.updatedAt)}
              </p>
            </div>
            <ArrowRight className="shrink-0 text-[var(--muted)]" size={18} />
          </Link>
        ))}
        {!lists.length ? <div className="panel p-8 text-center text-[var(--muted)]">Create your first personal list.</div> : null}
      </section>
    </div>
  );
}

