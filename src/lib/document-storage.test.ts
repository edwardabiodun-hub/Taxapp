import { describe, it, expect, vi } from "vitest";

vi.mock("@aparajita/capacitor-secure-storage", () => {
  const store: Record<string, string> = {};
  return {
    SecureStorage: {
      get: vi.fn(async (key: string) => store[key] ?? null),
      set: vi.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
    },
  };
});

async function readRawDocumentFile(id: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const openReq = indexedDB.open("TaxEaseAfrica");
    openReq.onsuccess = () => {
      const idb = openReq.result;
      const tx = idb.transaction("documentFiles", "readonly");
      const getReq = tx.objectStore("documentFiles").get(id);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    openReq.onerror = () => reject(openReq.error);
  });
}

describe("document-storage", () => {
  it("round-trips a file's bytes, name, and type through save/get", async () => {
    const { saveDocumentFile, getDocumentFile } = await import("./document-storage");

    const content = "this is a payslip";
    const file = new File([content], "payslip.pdf", { type: "application/pdf" });

    const id = await saveDocumentFile("decl-1", file);
    const loaded = await getDocumentFile(id);

    expect(loaded?.name).toBe("payslip.pdf");
    expect(loaded?.type).toBe("application/pdf");
    expect(await loaded?.text()).toBe(content);
  });

  it("stores the file bytes encrypted at rest, not as plaintext", async () => {
    const { saveDocumentFile } = await import("./document-storage");

    const id = await saveDocumentFile("decl-1", new File(["sensitive content"], "doc.txt"));
    const raw = await readRawDocumentFile(id);

    expect(raw.name).toBe("doc.txt"); // metadata stays plain, it's not sensitive on its own
    const rawBytes = new Uint8Array(raw.ciphertext as ArrayBuffer);
    const rawText = new TextDecoder().decode(rawBytes);
    expect(rawText).not.toContain("sensitive content");
  });

  it("returns undefined for a deleted or unknown file id", async () => {
    const { saveDocumentFile, getDocumentFile, deleteDocumentFile } = await import("./document-storage");

    const id = await saveDocumentFile("decl-1", new File(["x"], "x.txt"));
    await deleteDocumentFile(id);

    expect(await getDocumentFile(id)).toBeUndefined();
    expect(await getDocumentFile("no-such-id")).toBeUndefined();
  });
});
