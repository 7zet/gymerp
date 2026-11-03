import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "./index";

describe("@sport/billing-core", () => {
  it("exports its package name", () => {
    expect(PACKAGE_NAME).toBe("@sport/billing-core");
  });
});
