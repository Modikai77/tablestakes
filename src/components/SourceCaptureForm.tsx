import { Upload } from "lucide-react";
import { addSourceAction } from "@/app/actions";

export function SourceCaptureForm() {
  return (
    <form action={addSourceAction} className="panel grid gap-4 p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="field">
          <span className="label">Type</span>
          <select className="input" name="type" defaultValue="text">
            <option value="text">Text</option>
            <option value="url">URL</option>
            <option value="image">Image</option>
            <option value="email">Email</option>
            <option value="instagram">Instagram</option>
            <option value="google_maps">Google Maps</option>
            <option value="manual">Manual note</option>
          </select>
        </label>
        <label className="field md:col-span-2">
          <span className="label">Label</span>
          <input className="input" name="sourceLabel" placeholder="Article, friend, email thread..." />
        </label>
      </div>
      <label className="field">
        <span className="label">URL</span>
        <input className="input" name="originalUrl" placeholder="https://..." />
      </label>
      <label className="field">
        <span className="label">Messy text</span>
        <textarea className="input min-h-36" name="rawText" placeholder="Paste article snippets, emails, captions, Google Maps text or recommendations." />
      </label>
      <label className="field">
        <span className="label">Screenshot or photo</span>
        <input className="input" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" />
      </label>
      <button className="button w-fit" type="submit">
        <Upload size={16} />
        Add to inbox
      </button>
    </form>
  );
}

