import { notFound } from "next/navigation";
import { Check, X } from "lucide-react";
import { approveCandidateAction, processSourceAction, rejectCandidateAction } from "@/app/actions";
import { ProcessSourceButton } from "@/components/ProcessSourceButton";
import { getSource, listRestaurants } from "@/lib/store";
import { priceLabel } from "@/lib/utils";

export default async function SourceDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [source, restaurants] = await Promise.all([getSource(id), listRestaurants({})]);
  if (!source) notFound();
  const processAction = processSourceAction.bind(null, source.id);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">{source.type.replaceAll("_", " ")}</span>
            <span className="chip">{source.processingStatus}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold">{source.sourceLabel || "Source review"}</h1>
        </div>
        <form action={processAction}>
          <ProcessSourceButton />
        </form>
      </section>

      <section className="panel p-4">
        <h2 className="font-semibold">Original evidence</h2>
        {source.originalUrl ? <p className="mt-2 text-sm"><strong>URL:</strong> {source.originalUrl}</p> : null}
        {source.uploadedImageUrl ? <p className="mt-2 text-sm"><strong>Image:</strong> {source.uploadedImageUrl}</p> : null}
        <p className="mt-3 whitespace-pre-wrap leading-7 text-[var(--muted)]">{source.rawText || "No pasted text."}</p>
        {source.extractionError ? <p className="mt-3 text-sm text-[var(--accent-2)]">{source.extractionError}</p> : null}
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">Candidates</h2>
        {source.candidates.map((candidate) => {
          const approveAction = approveCandidateAction.bind(null, candidate.id);
          const rejectAction = rejectCandidateAction.bind(null, source.id, candidate.id);
          return (
            <article className="panel grid gap-4 p-4" key={candidate.id}>
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="chip">{candidate.status}</span>
                    <span className="chip">{Math.round(candidate.confidence * 100)}% confidence</span>
                    {candidate.cuisine ? <span className="chip">{candidate.cuisine}</span> : null}
                    <span className="chip">{priceLabel(candidate.priceLevel)}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold">{candidate.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{[candidate.neighbourhood, candidate.city, candidate.address].filter(Boolean).join(", ")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={approveAction} className="flex gap-2">
                    <select className="input min-w-44" name="mergeRestaurantId" defaultValue="">
                      <option value="">Save as new or auto-merge</option>
                      {restaurants.map((restaurant) => (
                        <option value={restaurant.id} key={restaurant.id}>
                          Merge: {restaurant.name}
                        </option>
                      ))}
                    </select>
                    <button className="button" type="submit">
                      <Check size={16} />
                      Approve
                    </button>
                  </form>
                  <form action={rejectAction}>
                    <button className="button secondary" type="submit">
                      <X size={16} />
                      Reject
                    </button>
                  </form>
                </div>
              </div>
              {candidate.evidenceSnippet ? <blockquote className="border-l-2 border-[var(--accent)] pl-3 text-sm leading-6 text-[var(--muted)]">{candidate.evidenceSnippet}</blockquote> : null}
              {candidate.recommendationReason ? <p className="text-sm">{candidate.recommendationReason}</p> : null}
              <div className="flex flex-wrap gap-1.5">
                {[...candidate.tags, ...candidate.occasionTags].map((tag) => (
                  <span className="chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
        {!source.candidates.length ? <div className="panel p-6 text-[var(--muted)]">Run extraction to review candidates.</div> : null}
      </section>
    </div>
  );
}
