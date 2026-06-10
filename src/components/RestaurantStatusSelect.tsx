"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { updateRestaurantStatusAction } from "@/app/actions";
import type { RestaurantStatus } from "@/lib/types";

const statusOptions: { value: RestaurantStatus; label: string }[] = [
  { value: "want_to_go", label: "Want to go" },
  { value: "booked", label: "Booked" },
  { value: "visited", label: "Visited" },
  { value: "not_interested", label: "Not interested" },
  { value: "closed", label: "Closed" }
];

export function RestaurantStatusSelect({ restaurantId, status }: { restaurantId: string; status: RestaurantStatus }) {
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative">
      <select
        aria-label="Restaurant status"
        className={`chip status-${selectedStatus} h-8 max-w-36 cursor-pointer appearance-none truncate py-1 pl-3 pr-7 capitalize disabled:cursor-progress disabled:opacity-70`}
        disabled={isPending}
        name="status"
        value={selectedStatus}
        onChange={(event) => {
          const nextStatus = event.target.value as RestaurantStatus;
          const formData = new FormData();
          formData.set("status", nextStatus);
          setSelectedStatus(nextStatus);
          startTransition(() => {
            void updateRestaurantStatusAction(restaurantId, formData);
          });
        }}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={14} />
    </div>
  );
}
