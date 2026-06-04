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
const maxFetchedSourceCharacters = 80_000;
const maxFetchedSourceBytes = 1_000_000;

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export async function extractCandidates(source: SourceRecord): Promise<Omit<CandidateRecord, "id" | "sourceId" | "status" | "createdAt" | "updatedAt">[]> {
  const evidence = await collectEvidence(source);
  const client = getOpenAI();
  if (!client) return heuristicExtract(evidence.text);

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
        content: buildInputContent(evidence)
      }
    ] as never,
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
                required: [
                  "name",
                  "city",
                  "neighbourhood",
                  "address",
                  "cuisine",
                  "priceLevel",
                  "tags",
                  "occasionTags",
                  "evidenceSnippet",
                  "recommendationReason",
                  "confidence"
                ],
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

type Evidence = {
  text: string;
  imageUrl?: string;
};

async function collectEvidence(source: SourceRecord): Promise<Evidence> {
  const parts = [
    `Source type: ${source.type}`,
    providerGuidance(source),
    source.sourceLabel ? `Label: ${source.sourceLabel}` : "",
    source.originalUrl ? `URL: ${source.originalUrl}` : "",
    source.rawText ? `Pasted text:\n${source.rawText}` : ""
  ].filter(Boolean);

  if (source.originalUrl) {
    const articleText = await fetchReadableUrlText(source.originalUrl);
    parts.push(articleText ? `Fetched URL content:\n${articleText}` : "Fetched URL content: unavailable.");
  }

  const imageUrl = normaliseImageUrl(source.uploadedImageUrl);
  if (source.uploadedImageUrl) {
    parts.push(imageUrl ? "Uploaded image: inspect the attached image for restaurant names, locations, menus, captions, handles, and visible recommendations." : `Uploaded image URL could not be sent to the model: ${source.uploadedImageUrl}`);
  }

  return {
    text: parts.join("\n\n").slice(0, maxFetchedSourceCharacters),
    imageUrl
  };
}

function providerGuidance(source: SourceRecord) {
  if (source.type === "google_maps" || (source.originalUrl && isGoogleMapsUrl(source.originalUrl))) {
    return [
      "Google Maps extraction guidance:",
      "- Treat this URL as primary evidence, even if there is no pasted text.",
      "- For saved lists, this app follows the Google Maps list-data preload endpoint when it is visible in the fetched page.",
      "- If the URL is a saved list, extract every restaurant/place visible in fetched metadata, page text, embedded data, or user-provided screenshots.",
      "- If the URL is a single place, extract that place as one restaurant candidate.",
      "- Google Maps pages can be sparse when fetched server-side; use URL/title/metadata/image evidence and keep confidence honest."
    ].join("\n");
  }

  if (source.type === "instagram" || (source.originalUrl && isInstagramUrl(source.originalUrl))) {
    return [
      "Instagram extraction guidance:",
      "- Treat this URL as primary evidence, even if there is no pasted text.",
      "- Extract restaurant recommendations from captions, profile/page metadata, visible text in uploaded screenshots, hashtags, location names, and account/post context.",
      "- Instagram pages can be sparse when fetched server-side; use metadata/image evidence and keep confidence honest."
    ].join("\n");
  }

  if (source.type === "url") {
    return "URL extraction guidance: fetch and read the linked page as the primary source of restaurant recommendations, even if there is no pasted text.";
  }

  if (source.type === "image") {
    return "Image extraction guidance: inspect the uploaded image as the primary evidence for visible restaurant names, locations, menus, captions, handles, and recommendation text.";
  }

  return "";
}

function buildInputContent(evidence: Evidence) {
  const content: Array<{ type: "input_text"; text: string } | { type: "input_image"; image_url: string; detail: "high" }> = [
    {
      type: "input_text",
      text: evidence.text
    }
  ];
  if (evidence.imageUrl) {
    content.push({
      type: "input_image",
      image_url: evidence.imageUrl,
      detail: "high"
    });
  }
  return content;
}

async function fetchReadableUrlText(url: string) {
  if (!canFetchUrl(url)) return "URL fetch skipped because the URL is not a public HTTP(S) URL.";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Tablestakes recommendation extractor/1.0"
      },
      signal: controller.signal
    });
    if (!response.ok) return `URL fetch failed with HTTP ${response.status}.`;
    const contentType = response.headers.get("content-type") ?? "";
    if (!/text\/html|text\/plain|application\/xhtml\+xml/i.test(contentType)) {
      return `URL content type was not readable text (${contentType || "unknown"}).`;
    }
    const text = await readResponseText(response);
    const parts = [`Final fetched URL: ${response.url}`, htmlToReadableText(text)];
    if (isGoogleMapsUrl(url) || isGoogleMapsUrl(response.url)) {
      const mapsListText = await fetchGoogleMapsSavedListText(text, response.url, controller.signal);
      if (mapsListText) parts.push(mapsListText);
    }
    return parts.join("\n\n").slice(0, maxFetchedSourceCharacters);
  } catch (error) {
    return `URL fetch failed: ${error instanceof Error ? error.message : "unknown error"}.`;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGoogleMapsSavedListText(pageHtml: string, finalUrl: string, signal: AbortSignal) {
  const endpoint = extractGoogleMapsEntityListUrl(pageHtml, finalUrl);
  if (!endpoint || !canFetchUrl(endpoint)) return "";

  try {
    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "Tablestakes recommendation extractor/1.0"
      },
      signal
    });
    if (!response.ok) return `Google Maps saved-list endpoint failed with HTTP ${response.status}.`;

    const text = await readResponseText(response);
    const readable = googleMapsEntityListToReadableText(text);
    if (!readable) return "Google Maps saved-list endpoint returned no readable places.";

    return `Google Maps saved-list data:\n${readable}`;
  } catch (error) {
    return `Google Maps saved-list endpoint failed: ${error instanceof Error ? error.message : "unknown error"}.`;
  }
}

function extractGoogleMapsEntityListUrl(pageHtml: string, finalUrl: string) {
  const candidates = Array.from(pageHtml.matchAll(/["']([^"']*\/maps\/preview\/entitylist\/getlist(?!participants)\?[^"']+)["']/gi)).map((match) =>
    decodeGoogleMapsEndpoint(match[1])
  );
  const candidate = candidates.find((value) => value.includes("pb=")) ?? candidates[0];
  if (!candidate) return null;

  try {
    return new URL(candidate, new URL(finalUrl).origin).toString();
  } catch {
    return null;
  }
}

function decodeGoogleMapsEndpoint(value: string) {
  return decodeHtml(value)
    .replace(/\\u003d/gi, "=")
    .replace(/\\u0026/gi, "&")
    .replace(/\\\//g, "/");
}

function googleMapsEntityListToReadableText(value: string) {
  const jsonText = value.replace(/^\)\]\}'\s*/, "").trim();
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    const places = extractGoogleMapsPlaces(parsed);
    if (places.length) {
      return places
        .map((place) => {
          const details = [place.address, place.note ? `note: ${place.note}` : ""].filter(Boolean).join("; ");
          return details ? `- ${place.name} — ${details}` : `- ${place.name}`;
        })
        .join("\n");
    }
  } catch {
    // Fall through to a quoted-string fallback for non-standard Maps payloads.
  }

  return extractReadableGoogleMapsStrings(value)
    .slice(0, 120)
    .map((item) => `- ${item}`)
    .join("\n");
}

type GoogleMapsPlace = {
  name: string;
  address?: string;
  note?: string;
};

function extractGoogleMapsPlaces(value: unknown) {
  const places: GoogleMapsPlace[] = [];
  const seen = new Set<string>();

  function visit(node: unknown) {
    if (!Array.isArray(node)) return;

    const detail = Array.isArray(node[1]) ? node[1] : null;
    const name = cleanGoogleMapsString(typeof node[2] === "string" ? node[2] : "");
    const address = cleanGoogleMapsString(typeof detail?.[4] === "string" ? detail[4] : "");
    const note = cleanGoogleMapsString(typeof node[3] === "string" ? node[3] : "");

    if (name && address && isLikelyGoogleMapsPlaceName(name)) {
      const key = `${name.toLowerCase()}|${address.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        places.push({ name, address, note });
      }
    }

    for (const child of node) visit(child);
  }

  visit(value);
  return places.slice(0, 500);
}

function extractReadableGoogleMapsStrings(value: string) {
  const strings = Array.from(value.matchAll(/"((?:[^"\\]|\\.){3,180})"/g)).map((match) => cleanGoogleMapsString(match[1]));
  return Array.from(new Set(strings.filter((item) => isLikelyGoogleMapsPlaceName(item))));
}

function cleanGoogleMapsString(value: string) {
  return decodeHtml(value)
    .replace(/\\u([\da-f]{4})/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\\(["\\/])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyGoogleMapsPlaceName(value: string) {
  if (value.length < 2 || value.length > 140) return false;
  if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(value)) return false;
  if (/^https?:|google|gstatic|maps|usercontent|schema|roadmap|satellite/i.test(value)) return false;
  if (/^[\d\s,.'-]+$/.test(value)) return false;
  if (/^[A-Za-z0-9_-]{24,}$/.test(value)) return false;
  return true;
}

async function readResponseText(response: Response) {
  if (!response.body) return response.text();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";

  while (received < maxFetchedSourceBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    text += decoder.decode(value, { stream: true });
  }

  await reader.cancel().catch(() => undefined);
  return text + decoder.decode();
}

function canFetchUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase();
    if (hostname === "localhost" || hostname.endsWith(".local")) return false;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0$)/.test(hostname)) return false;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return false;
    if (hostname === "::1" || hostname.startsWith("fc") || hostname.startsWith("fd")) return false;
    return true;
  } catch {
    return false;
  }
}

function isGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return hostname === "maps.app.goo.gl" || hostname === "goo.gl" || hostname.startsWith("maps.google.") || ((hostname === "www.google.com" || hostname === "google.com") && url.pathname.startsWith("/maps"));
  } catch {
    return false;
  }
}

function isInstagramUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "instagram.com" || hostname.endsWith(".instagram.com");
  } catch {
    return false;
  }
}

function htmlToReadableText(value: string) {
  const title = value.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const metadata = extractMetadata(value);
  const embeddedText = extractEmbeddedTextHints(value);
  const body = value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|section|article|header|footer|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  const parts = [
    title ? `Title: ${decodeHtml(title)}` : "",
    metadata.length ? `Page metadata:\n${metadata.join("\n")}` : "",
    embeddedText ? `Embedded page data:\n${embeddedText}` : "",
    decodeHtml(body)
  ].filter(Boolean);

  return parts
    .join("\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractMetadata(value: string) {
  const matches = value.matchAll(/<meta\b[^>]*>/gi);
  const interesting = new Set(["description", "og:title", "og:description", "twitter:title", "twitter:description", "al:ios:url", "al:android:url"]);
  const metadata: string[] = [];

  for (const match of matches) {
    const tag = match[0];
    const key = getAttribute(tag, "name") ?? getAttribute(tag, "property");
    const content = getAttribute(tag, "content");
    if (key && content && interesting.has(key.toLowerCase())) {
      metadata.push(`${key}: ${decodeHtml(content)}`);
    }
  }

  return Array.from(new Set(metadata)).slice(0, 30);
}

function extractEmbeddedTextHints(value: string) {
  const hints = [
    ...Array.from(value.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)).map((match) => match[1]),
    ...Array.from(value.matchAll(/\b(?:aria-label|title)=["']([^"']{3,240})["']/gi)).map((match) => match[1]),
    ...Array.from(value.matchAll(/\\u0026q=([^"&\\]{3,160})/gi)).map((match) => decodeURIComponentSafe(match[1])),
    ...Array.from(value.matchAll(/(?:\/place\/|\/maps\/place\/)([^"'?&<]{3,160})/gi)).map((match) => decodeURIComponentSafe(match[1].replace(/\+/g, " ")))
  ];

  return Array.from(new Set(hints.map((hint) => decodeHtml(hint).replace(/\s+/g, " ").trim()).filter(Boolean)))
    .slice(0, 120)
    .join("\n");
}

function getAttribute(tag: string, attribute: string) {
  return tag.match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"))?.[1];
}

function decodeURIComponentSafe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function normaliseImageUrl(value?: string | null) {
  if (!value) return undefined;
  if (value.startsWith("data:image/")) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    return undefined;
  }
  return undefined;
}

function heuristicExtract(text: string) {
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

export const extractionTestInternals = {
  extractGoogleMapsEntityListUrl,
  googleMapsEntityListToReadableText
};
