"use client";

import { useState } from "react";
import { Link2, Mail, StickyNote, Upload } from "lucide-react";
import { addSourceAction } from "@/app/actions";
import type { SourceType } from "@/lib/types";

const sourceTypes: { value: SourceType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "url", label: "URL" },
  { value: "image", label: "Image" },
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram" },
  { value: "google_maps", label: "Google Maps" },
  { value: "manual", label: "Manual note" }
];

export function SourceCaptureForm() {
  const [type, setType] = useState<SourceType>("text");
  const showUrl = type === "url" || type === "instagram" || type === "google_maps";
  const showImage = type === "image";
  const showText = type !== "image";
  const Icon = type === "email" ? Mail : showUrl ? Link2 : StickyNote;

  return (
    <form action={addSourceAction} className="panel grid gap-4 p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="field">
          <span className="label">Type</span>
          <select className="input" name="type" value={type} onChange={(event) => setType(event.target.value as SourceType)}>
            {sourceTypes.map((sourceType) => (
              <option value={sourceType.value} key={sourceType.value}>
                {sourceType.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field md:col-span-2">
          <span className="label">Label</span>
          <input className="input" name="sourceLabel" placeholder="Article, friend, email thread..." />
        </label>
      </div>
      {showUrl ? (
        <label className="field">
          <span className="label">URL</span>
          <input className="input" name="originalUrl" placeholder="https://..." />
        </label>
      ) : null}
      {showText ? (
        <label className="field">
          <span className="label">{type === "manual" ? "Note" : "Messy text"}</span>
          <span className="relative">
            <Icon className="pointer-events-none absolute left-3 top-3 text-[var(--muted)]" size={16} />
            <textarea className="input min-h-36 pl-10" name="rawText" placeholder="Paste snippets, captions, emails or recommendations." />
          </span>
        </label>
      ) : null}
      {showImage ? (
        <label className="field">
          <span className="label">Screenshot or photo</span>
          <input className="input" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" />
        </label>
      ) : null}
      <button className="button w-fit" type="submit">
        <Upload size={16} />
        Add to inbox
      </button>
    </form>
  );
}
