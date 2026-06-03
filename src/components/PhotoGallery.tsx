"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { PhotoRecord } from "@/lib/types";

export function PhotoGallery({ photos }: { photos: PhotoRecord[] }) {
  const [active, setActive] = useState<PhotoRecord | null>(null);
  if (!photos.length) return null;

  return (
    <>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <button key={photo.id} type="button" className="aspect-square overflow-hidden rounded-md border border-[var(--line)] bg-[var(--soft)]" onClick={() => setActive(photo)}>
            <img src={photo.thumbnailUrl ?? photo.url} alt={photo.caption ?? photo.dishName ?? "Visit photo"} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      {active ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setActive(null)}>
          <button className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white text-black" type="button" aria-label="Close">
            <X size={18} />
          </button>
          <img src={active.url} alt={active.caption ?? active.dishName ?? "Visit photo"} className="max-h-[86vh] max-w-[92vw] rounded-md object-contain" />
        </div>
      ) : null}
    </>
  );
}
