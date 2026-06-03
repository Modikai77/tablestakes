import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import { SourceCaptureForm } from "@/components/SourceCaptureForm";
import { listSources } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default async function SourcesPage() {
  const sources = await listSources();

  return (
    <div className="grid gap-6">
      <section>
        <p className="label">Capture first</p>
        <h1 className="mt-1 text-3xl font-semibold">Source inbox</h1>
      </section>
      <SourceCaptureForm />
      <section className="grid gap-3">
        {sources.map((source) => (
          <Link className="panel flex items-center justify-between gap-4 p-4" href={`/sources/${source.id}`} key={source.id}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip">{source.type.replaceAll("_", " ")}</span>
                <span className="chip">{source.processingStatus}</span>
                {source.extractionError ? (
                  <span className="chip text-[var(--accent-2)]">
                    <CircleAlert size={13} /> error
                  </span>
                ) : null}
              </div>
              <h2 className="mt-2 font-semibold">{source.sourceLabel || source.originalUrl || "Untitled source"}</h2>
              <p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">{source.rawText || source.originalUrl || source.uploadedImageUrl}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">{formatDate(source.createdAt)} · {source.candidates.length} candidates</p>
            </div>
            <ArrowRight className="shrink-0 text-[var(--muted)]" size={18} />
          </Link>
        ))}
      </section>
    </div>
  );
}

