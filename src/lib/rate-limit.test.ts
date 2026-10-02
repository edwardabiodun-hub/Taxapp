import { describe, expect, it, vi } from "vitest";
import { enforceDualLimit, getTrustedClientIp } from "../../supabase/functions/_shared/rate-limit";

describe("dual-layer rate limiting", () => {
  it("requires both the account and IP budgets", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });

    const result = await enforceDualLimit(
      { rpc },
      {
        accountKey: "account-hash",
        ipKey: "ip-hash",
        accountLimit: 5,
        ipLimit: 30,
        windowSeconds: 900,
        salt: "test-salt",
      },
    );

    expect(result.allowed).toBe(true);
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledWith("consume_rate_limit", expect.objectContaining({ p_limit: 5 }));
    expect(rpc).toHaveBeenCalledWith("consume_rate_limit", expect.objectContaining({ p_limit: 30 }));
  });

  it("denies when either budget is exhausted", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: false, error: null });

    await expect(
      enforceDualLimit(
        { rpc },
        {
          accountKey: "account-hash",
          ipKey: "ip-hash",
          accountLimit: 5,
          ipLimit: 30,
          windowSeconds: 900,
          salt: "test-salt",
        },
      ),
    ).resolves.toEqual({ allowed: false });
  });

  it("uses the platform-provided Cloudflare IP before fallback headers", () => {
    const request = new Request("https://example.test", {
      headers: {
        "cf-connecting-ip": "203.0.113.7",
        "x-forwarded-for": "198.51.100.4",
      },
    });

    expect(getTrustedClientIp(request)).toBe("203.0.113.7");
  });
});
