"use client";

import { useState } from "react";

export function UserAvatar({ email, image }: { email: string; image?: string | null }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = email.slice(0, 1).toUpperCase();

  if (image && !imageFailed) {
    return <img alt="" className="size-7 rounded-full object-cover" height={28} onError={() => setImageFailed(true)} referrerPolicy="no-referrer" src={image} width={28} />;
  }

  return <span className="grid size-7 place-items-center rounded-full bg-[var(--soft)] text-xs font-semibold">{initial}</span>;
}
