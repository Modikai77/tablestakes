import { notFound } from "next/navigation";
import { Check, CircleAlert, X } from "lucide-react";
import { approveCandidateAction, processSourceAction, rejectCandidateAction } from "@/app/actions";
import { ProcessSourceButton } from "@/components/ProcessSourceButton";
import { getSource, listRestaurants } from "@/lib/store";
import { priceLabel } from "@/lib/utils";
import type { CandidateRecord, RestaurantRecord } from "@/lib/types";

export default async function SourceDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [source, restaurants] = await Promise.all([getSource(id), listRestaurants({})]);
  if (!source) notFound();
  const processAction = processSourceAction.bind(null, source.id);
  const pendingCandidates = source.candidates.filter((candidate) => candidate.status === "pending");

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
        <h2 className="text-xl font-semibold">Restaurants to review</h2>
        {pendingCandidates.map((candidate) => {
          const duplicate = findLikelyDuplicate(candidate, restaurants);
          const approveAction = approveCandidateAction.bind(null, source.id, candidate.id);
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
                    {duplicate ? (
                      <span className="chip text-[var(--accent-2)]">
                        <CircleAlert size={13} />
                        Likely already in library
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold">{candidate.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{[candidate.neighbourhood, candidate.city, candidate.address].filter(Boolean).join(", ")}</p>
                  {duplicate ? <p className="mt-2 text-sm text-[var(--accent-2)]">Possible match: {duplicate.name}{duplicate.city ? `, ${duplicate.city}` : ""}. Approving will merge into this restaurant unless you choose another option.</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={approveAction} className="flex gap-2">
                    <select className="input min-w-44" name="mergeRestaurantId" defaultValue={duplicate?.id ?? ""}>
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
        {!pendingCandidates.length ? <div className="panel p-6 text-[var(--muted)]">{source.candidates.length ? "All extracted restaurants have been reviewed." : "Run extraction to review candidates."}</div> : null}
      </section>
    </div>
  );
}

function findLikelyDuplicate(candidate: CandidateRecord, restaurants: RestaurantRecord[]) {
  return restaurants.find((restaurant) => {
    if (normalise(restaurant.name) !== normalise(candidate.name)) return false;
    return !candidate.city || !restaurant.city || normalise(restaurant.city) === normalise(candidate.city);
  });
}

function normalise(value?: string | null) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
