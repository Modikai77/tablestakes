import { notFound } from "next/navigation";
import { RestaurantForm } from "@/components/RestaurantForm";
import { updateRestaurantAction } from "@/app/actions";
import { getRestaurant } from "@/lib/store";

export default async function EditRestaurantPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurant = await getRestaurant(id);
  if (!restaurant) notFound();
  const action = updateRestaurantAction.bind(null, restaurant.id);

  return (
    <div className="grid gap-5">
      <div>
        <p className="label">Edit</p>
        <h1 className="mt-1 text-3xl font-semibold">{restaurant.name}</h1>
      </div>
      <RestaurantForm restaurant={restaurant} action={action} />
    </div>
  );
}

