"use client";

import { useFormStatus } from "react-dom";
import { RefreshCw } from "lucide-react";

export function ProcessSourceButton() {
  const { pending } = useFormStatus();

  return (
    <button className="button" disabled={pending} type="submit">
      <RefreshCw className={pending ? "animate-spin" : undefined} size={16} />
      {pending ? "Extracting..." : "Extract restaurants"}
    </button>
  );
}
