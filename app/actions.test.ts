import { describe, it, expect } from "vitest";
import { getServerPing } from "./actions";

describe("getServerPing", () => {
  it("returns pong and a timestamp", async () => {
    const result = await getServerPing();
    expect(result).toHaveProperty("pong", "ok");
    expect(result).toHaveProperty("at");
    expect(typeof result.at).toBe("string");
    expect(() => new Date(result.at).getTime()).not.toThrow();
  });
});
