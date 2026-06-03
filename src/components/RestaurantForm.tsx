import { Save } from "lucide-react";
import type { RestaurantRecord } from "@/lib/types";

export function RestaurantForm({
  restaurant,
  action
}: {
  restaurant?: RestaurantRecord;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="panel grid gap-4 p-4 md:grid-cols-2">
      <Field label="Name" name="name" defaultValue={restaurant?.name} required />
      <Field label="Canonical name" name="canonicalName" defaultValue={restaurant?.canonicalName ?? undefined} />
      <Field label="Address" name="address" defaultValue={restaurant?.address ?? undefined} className="md:col-span-2" />
      <Field label="Neighbourhood" name="neighbourhood" defaultValue={restaurant?.neighbourhood ?? undefined} />
      <Field label="City" name="city" defaultValue={restaurant?.city ?? undefined} />
      <Field label="Country" name="country" defaultValue={restaurant?.country ?? "United Kingdom"} />
      <Field label="Cuisine" name="cuisine" defaultValue={restaurant?.cuisine ?? undefined} />
      <label className="field">
        <span className="label">Price</span>
        <select className="input" name="priceLevel" defaultValue={restaurant?.priceLevel ?? ""}>
          <option value="">Unknown</option>
          <option value="1">£</option>
          <option value="2">££</option>
          <option value="3">£££</option>
          <option value="4">££££</option>
        </select>
      </label>
      <label className="field">
        <span className="label">Status</span>
        <select className="input" name="status" defaultValue={restaurant?.status ?? "want_to_go"}>
          <option value="want_to_go">Want to go</option>
          <option value="booked">Booked</option>
          <option value="visited">Visited</option>
          <option value="not_interested">Not interested</option>
          <option value="closed">Closed</option>
        </select>
      </label>
      <Field label="Website" name="website" defaultValue={restaurant?.website ?? undefined} />
      <Field label="Phone" name="phone" defaultValue={restaurant?.phone ?? undefined} />
      <Field label="Google Maps URL" name="googleMapsUrl" defaultValue={restaurant?.googleMapsUrl ?? undefined} className="md:col-span-2" />
      <Field label="Tags" name="tags" defaultValue={restaurant?.tags.join(", ")} className="md:col-span-2" />
      <label className="field md:col-span-2">
        <span className="label">Notes</span>
        <textarea className="input min-h-28" name="notes" defaultValue={restaurant?.notes ?? undefined} />
      </label>
      <label className="field md:col-span-2">
        <span className="label">Source summary</span>
        <textarea className="input min-h-20" name="sourceSummary" defaultValue={restaurant?.sourceSummary ?? undefined} />
      </label>
      <div className="md:col-span-2">
        <button className="button" type="submit">
          <Save size={16} />
          Save restaurant
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  className,
  ...props
}: {
  label: string;
  name: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`field ${className ?? ""}`}>
      <span className="label">{label}</span>
      <input className="input" name={name} {...props} />
    </label>
  );
}

