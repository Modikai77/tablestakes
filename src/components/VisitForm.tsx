import { Camera, Plus } from "lucide-react";
import { addVisitAction } from "@/app/actions";

export function VisitForm({ restaurantId }: { restaurantId: string }) {
  const action = addVisitAction.bind(null, restaurantId);
  return (
    <form action={action} className="panel grid gap-4 p-4 md:grid-cols-2">
      <label className="field">
        <span className="label">Visit date</span>
        <input className="input" name="visitDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </label>
      <label className="field">
        <span className="label">Rating</span>
        <select className="input" name="rating" defaultValue="">
          <option value="">Not rated</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </label>
      <label className="field">
        <span className="label">Companions</span>
        <input className="input" name="companions" />
      </label>
      <label className="field">
        <span className="label">Occasion</span>
        <input className="input" name="occasion" placeholder="date night, family, lunch..." />
      </label>
      <label className="field md:col-span-2">
        <span className="label">Dishes</span>
        <input className="input" name="dishes" placeholder="Comma separated dishes" />
      </label>
      <label className="field md:col-span-2">
        <span className="label">Wine notes</span>
        <input className="input" name="wineNotes" />
      </label>
      <label className="field md:col-span-2">
        <span className="label">Notes</span>
        <textarea className="input min-h-24" name="notes" />
      </label>
      <label className="field md:col-span-2">
        <span className="label">Photos</span>
        <span className="flex items-center gap-2">
          <Camera size={17} />
          <input className="input" name="photos" type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" />
        </span>
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input name="wouldReturn" type="checkbox" />
        Would return
      </label>
      <div className="md:col-span-2">
        <button className="button" type="submit">
          <Plus size={16} />
          Add visit
        </button>
      </div>
    </form>
  );
}

