import { describe, expect, it, vi } from "vitest";
import {
  claimMessageEmailDelivery,
  markMessageEmailFailed,
  markMessageEmailSent,
} from "../../supabase/functions/send-message-email/idempotency";

describe("message email idempotency", () => {
  it("does not send when the database says a delivery is already claimed or sent", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });

    await expect(claimMessageEmailDelivery({ rpc }, "message-1")).resolves.toBe(false);
    expect(rpc).toHaveBeenCalledWith("claim_message_email_delivery", { p_message_id: "message-1" });
  });

  it("marks successful and failed delivery outcomes through server RPCs", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    await markMessageEmailSent({ rpc }, "message-1");
    await markMessageEmailFailed({ rpc }, "message-1", "provider error");

    expect(rpc).toHaveBeenNthCalledWith(1, "mark_message_email_sent", { p_message_id: "message-1" });
    expect(rpc).toHaveBeenNthCalledWith(2, "mark_message_email_failed", {
      p_message_id: "message-1",
      p_error: "provider error",
    });
  });
});
