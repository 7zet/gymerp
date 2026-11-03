import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "./index";

describe("@sport/shared", () => {
  it("exports its package name", () => {
    expect(PACKAGE_NAME).toBe("@sport/shared");
  });
});
