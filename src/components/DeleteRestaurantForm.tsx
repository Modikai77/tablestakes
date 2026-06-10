"use client";

import { useFormStatus } from "react-dom";
import { Trash } from "lucide-react";

export function DeleteRestaurantForm({ action, restaurantName }: { action: () => void | Promise<void>; restaurantName: string }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${restaurantName}? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <DeleteButton />
    </form>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button className="button danger secondary w-full justify-center" disabled={pending} type="submit">
      <Trash size={16} />
      {pending ? "Deleting..." : "Delete restaurant"}
    </button>
  );
}
