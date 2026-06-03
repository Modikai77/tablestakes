import OpenAI from "openai";
import { z } from "zod";
import type { CandidateRecord, SourceRecord } from "@/lib/types";

const candidateSchema = z.object({
  restaurants: z.array(
    z.object({
      name: z.string(),
      city: z.string().nullable().optional(),
      neighbourhood: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      cuisine: z.string().nullable().optional(),
      priceLevel: z.number().int().min(1).max(4).nullable().optional(),
      tags: z.array(z.string()).default([]),
      occasionTags: z.array(z.string()).default([]),
      evidenceSnippet: z.string().nullable().optional(),
      confidence: z.number().min(0).max(1).default(0.55),
      recommendationReason: z.string().nullable().optional()
    })
  )
});

let openai: OpenAI | null = null;

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export async function extractCandidates(source: SourceRecord): Promise<Omit<CandidateRecord, "id" | "sourceId" | "status" | "createdAt" | "updatedAt">[]> {
  const client = getOpenAI();
  if (!client) return heuristicExtract(source);

  const content = buildSourceContent(source);
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Extract restaurant recommendations from messy user sources. Return concise JSON only. Prefer recall over perfection, but set confidence honestly. Preserve evidence snippets."
      },
      {
        role: "user",
        content
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "restaurant_candidates",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["restaurants"],
          properties: {
            restaurants: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "tags", "occasionTags", "confidence"],
                properties: {
                  name: { type: "string" },
                  city: { type: ["string", "null"] },
                  neighbourhood: { type: ["string", "null"] },
                  address: { type: ["string", "null"] },
                  cuisine: { type: ["string", "null"] },
                  priceLevel: { type: ["number", "null"] },
                  tags: { type: "array", items: { type: "string" } },
                  occasionTags: { type: "array", items: { type: "string" } },
                  evidenceSnippet: { type: ["string", "null"] },
                  recommendationReason: { type: ["string", "null"] },
                  confidence: { type: "number" }
                }
              }
            }
          }
        }
      }
    }
  });

  const parsed = candidateSchema.parse(JSON.parse(response.output_text));
  return parsed.restaurants.map((candidate) => ({
    restaurantId: null,
    name: candidate.name,
    city: candidate.city,
    neighbourhood: candidate.neighbourhood,
    address: candidate.address,
    cuisine: candidate.cuisine,
    priceLevel: candidate.priceLevel,
    tags: candidate.tags,
    occasionTags: candidate.occasionTags,
    evidenceSnippet: candidate.evidenceSnippet,
    confidence: candidate.confidence,
    recommendationReason: candidate.recommendationReason
  }));
}

function buildSourceContent(source: SourceRecord) {
  const parts = [
    `Source type: ${source.type}`,
    source.sourceLabel ? `Label: ${source.sourceLabel}` : "",
    source.originalUrl ? `URL: ${source.originalUrl}` : "",
    source.rawText ? `Text:\n${source.rawText}` : "",
    source.uploadedImageUrl ? `Image URL: ${source.uploadedImageUrl}` : ""
  ].filter(Boolean);

  return parts.join("\n\n");
}

function heuristicExtract(source: SourceRecord) {
  const text = [source.sourceLabel, source.rawText, source.originalUrl].filter(Boolean).join("\n");
  const matches = text.match(/([A-Z][A-Za-z'&.-]+(?:\s+[A-Z][A-Za-z'&.-]+){0,4})/g) ?? [];
  const stopWords = new Set(["London", "Broadstairs", "Instagram", "Google Maps", "Restaurant", "Sunday", "Friday"]);
  const names = Array.from(new Set(matches.map((item) => item.trim()).filter((item) => item.length > 3 && !stopWords.has(item)))).slice(0, 5);

  return names.map((name) => ({
    restaurantId: null,
    name,
    city: /broadstairs/i.test(text) ? "Broadstairs" : /london/i.test(text) ? "London" : null,
    neighbourhood: text.match(/soho|peckham|shoreditch|brixton|broadstairs|fitzrovia/i)?.[0] ?? null,
    address: null,
    cuisine: text.match(/indian|italian|thai|japanese|wine|seafood|bistro|modern british/i)?.[0] ?? null,
    priceLevel: text.includes("£££") ? 3 : text.includes("££") ? 2 : null,
    tags: ["needs-review"],
    occasionTags: text.match(/date|lunch|family|wine|group|business/i) ? [text.match(/date|lunch|family|wine|group|business/i)![0]] : [],
    evidenceSnippet: text.slice(0, 220),
    confidence: 0.42,
    recommendationReason: "Detected by local fallback extraction because OPENAI_API_KEY is not configured."
  }));
}

