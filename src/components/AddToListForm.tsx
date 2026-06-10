"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ListPlus } from "lucide-react";
import type { RestaurantListRecord } from "@/lib/types";

const createNewListValue = "__create_new_list__";

export function AddToListForm({
  action,
  lists
}: {
  action: (formData: FormData) => void | Promise<void>;
  lists: RestaurantListRecord[];
}) {
  const [selectedListId, setSelectedListId] = useState("");
  const creatingList = selectedListId === createNewListValue;

  return (
    <form action={action} className="mt-5 grid gap-2">
      <label className="field">
        <span className="label">Add to list</span>
        <select className="input" name="listId" onChange={(event) => setSelectedListId(event.target.value)} value={selectedListId}>
          <option value="">Choose a list</option>
          <option value={createNewListValue}>Create new list</option>
          {lists.map((list) => (
            <option value={list.id} key={list.id}>
              {list.name}
            </option>
          ))}
        </select>
      </label>
      {creatingList ? (
        <label className="field">
          <span className="label">New list name</span>
          <input className="input" name="newListName" placeholder="Weekend ideas, date nights..." required />
        </label>
      ) : null}
      <AddToListButton disabled={!selectedListId} />
    </form>
  );
}

function AddToListButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="button secondary w-fit" disabled={pending || disabled} type="submit">
      <ListPlus size={16} />
      {pending ? "Adding..." : "Add"}
    </button>
  );
}
