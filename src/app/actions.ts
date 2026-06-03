"use server";

import { redirect } from "next/navigation";
import {
  addSource,
  addVisit,
  addRestaurantToList,
  approveCandidate,
  createRestaurantList,
  createRestaurant,
  deleteRestaurant,
  enrichRestaurant,
  processSource,
  removeRestaurantFromList,
  rejectCandidate,
  updateRestaurant
} from "@/lib/store";
import { asNumber, asString, splitList } from "@/lib/utils";
import type { RestaurantStatus, SourceType } from "@/lib/types";

export async function createRestaurantAction(formData: FormData) {
  const restaurant = await createRestaurant(readRestaurantForm(formData));
  redirect(`/restaurants/${restaurant.id}`);
}

export async function updateRestaurantAction(id: string, formData: FormData) {
  await updateRestaurant(id, readRestaurantForm(formData));
  redirect(`/restaurants/${id}`);
}

export async function deleteRestaurantAction(id: string) {
  await deleteRestaurant(id);
  redirect("/");
}

export async function addSourceAction(formData: FormData) {
  const source = await addSource({
    type: (asString(formData.get("type")) ?? "text") as SourceType,
    rawText: asString(formData.get("rawText")),
    originalUrl: asString(formData.get("originalUrl")),
    sourceLabel: asString(formData.get("sourceLabel")),
    image: formData.get("image") instanceof File ? (formData.get("image") as File) : null
  });
  redirect(`/sources/${source.id}`);
}

export async function processSourceAction(id: string) {
  await processSource(id);
  redirect(`/sources/${id}`);
}

export async function approveCandidateAction(candidateId: string, formData: FormData) {
  const restaurantId = await approveCandidate(candidateId, asString(formData.get("mergeRestaurantId")));
  redirect(`/restaurants/${restaurantId}`);
}

export async function rejectCandidateAction(sourceId: string, candidateId: string) {
  await rejectCandidate(candidateId);
  redirect(`/sources/${sourceId}`);
}

export async function enrichRestaurantAction(id: string) {
  await enrichRestaurant(id);
  redirect(`/restaurants/${id}`);
}

export async function addVisitAction(restaurantId: string, formData: FormData) {
  const photos = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File && item.size > 0);

  await addVisit({
    restaurantId,
    visitDate: asString(formData.get("visitDate")) ? new Date(asString(formData.get("visitDate"))!) : new Date(),
    rating: asNumber(formData.get("rating")),
    companions: asString(formData.get("companions")),
    notes: asString(formData.get("notes")),
    dishes: asString(formData.get("dishes")),
    wineNotes: asString(formData.get("wineNotes")),
    wouldReturn: formData.get("wouldReturn") === "on",
    occasion: asString(formData.get("occasion")),
    photos
  });
  redirect(`/restaurants/${restaurantId}`);
}

export async function createListAction(formData: FormData) {
  const list = await createRestaurantList({
    name: asString(formData.get("name")) ?? "Untitled list",
    description: asString(formData.get("description"))
  });
  redirect(`/lists/${list.id}`);
}

export async function addRestaurantToListAction(restaurantId: string, formData: FormData) {
  const listId = asString(formData.get("listId"));
  if (listId) await addRestaurantToList(listId, restaurantId);
  redirect(`/restaurants/${restaurantId}`);
}

export async function removeRestaurantFromListAction(listId: string, restaurantId: string) {
  await removeRestaurantFromList(listId, restaurantId);
  redirect(`/lists/${listId}`);
}

function readRestaurantForm(formData: FormData) {
  return {
    name: asString(formData.get("name")) ?? "Untitled restaurant",
    canonicalName: asString(formData.get("canonicalName")),
    address: asString(formData.get("address")),
    city: asString(formData.get("city")),
    neighbourhood: asString(formData.get("neighbourhood")),
    country: asString(formData.get("country")) ?? "United Kingdom",
    cuisine: asString(formData.get("cuisine")),
    priceLevel: asNumber(formData.get("priceLevel")),
    website: asString(formData.get("website")),
    phone: asString(formData.get("phone")),
    googleMapsUrl: asString(formData.get("googleMapsUrl")),
    status: (asString(formData.get("status")) ?? "want_to_go") as RestaurantStatus,
    notes: asString(formData.get("notes")),
    sourceSummary: asString(formData.get("sourceSummary")),
    tags: splitList(formData.get("tags"))
  };
}
