import { RestaurantForm } from "@/components/RestaurantForm";
import { createRestaurantAction } from "@/app/actions";

export default function NewRestaurantPage() {
  return (
    <div className="grid gap-5">
      <div>
        <p className="label">Manual add</p>
        <h1 className="mt-1 text-3xl font-semibold">Add restaurant</h1>
      </div>
      <RestaurantForm action={createRestaurantAction} />
    </div>
  );
}

