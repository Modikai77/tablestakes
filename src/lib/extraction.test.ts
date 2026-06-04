import { describe, expect, it } from "vitest";
import { extractionTestInternals } from "@/lib/extraction";

describe("Google Maps saved-list extraction helpers", () => {
  it("finds the saved-list preload endpoint in Google Maps HTML", () => {
    const html =
      '<link rel="preload" href="/maps/preview/entitylist/getlist?authuser=0&amp;hl=en&amp;gl=uk&amp;pb=%211m1%211sabc%212e2">';

    expect(extractionTestInternals.extractGoogleMapsEntityListUrl(html, "https://www.google.com/maps/@/data=!3m1!4b1")).toBe(
      "https://www.google.com/maps/preview/entitylist/getlist?authuser=0&hl=en&gl=uk&pb=%211m1%211sabc%212e2"
    );
  });

  it("turns Google Maps entity-list payloads into restaurant evidence", () => {
    const payload = `)]}'
[[null,null,null,null,null,null,null,null,[[null,[null,null,"Bánh Bánh, 46 Peckham Rye, London SE15 4JR",null,"46 Peckham Rye, London SE15 4JR"],"Bánh Bánh","Good Vietnamese, like Coconut Cari"],[null,[null,null,"Fonda, 12 Heddon St, London W1B 4BZ",null,"12 Heddon St, London W1B 4BZ"],"Fonda",""]]]]`;

    const readable = extractionTestInternals.googleMapsEntityListToReadableText(payload);

    expect(readable).toContain("- Bánh Bánh — 46 Peckham Rye, London SE15 4JR; note: Good Vietnamese, like Coconut Cari");
    expect(readable).toContain("- Fonda — 12 Heddon St, London W1B 4BZ");
  });
});
