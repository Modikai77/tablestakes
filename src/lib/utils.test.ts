import { describe, expect, it } from "vitest";
import { priceLabel, splitList } from "@/lib/utils";

describe("utils", () => {
  it("splits comma separated tags", () => {
    const form = new FormData();
    form.set("tags", "wine, date night, , lunch");
    expect(splitList(form.get("tags"))).toEqual(["wine", "date night", "lunch"]);
  });

  it("formats price labels", () => {
    expect(priceLabel(3)).toBe("£££");
    expect(priceLabel(null)).toBe("Price unknown");
  });
});

