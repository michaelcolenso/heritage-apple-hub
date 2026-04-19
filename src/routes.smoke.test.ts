import { describe, expect, it } from "vitest";
import { appRoutes } from "./routes";

describe("route smoke tests", () => {
  it("includes all key application routes", () => {
    const paths = appRoutes.map((route) => route.path);

    expect(paths).toEqual(expect.arrayContaining([
      "/",
      "/marketplace",
      "/cart",
      "/orders",
      "/dashboard/*",
      "*",
    ]));
  });

  it("has unique paths", () => {
    const paths = appRoutes.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
