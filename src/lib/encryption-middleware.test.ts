import Dexie, { type Table } from "dexie";
import { describe, it, expect, beforeEach } from "vitest";
import { applyFieldEncryption } from "./encryption-middleware";

interface Person {
  id: string;
  country: string;
  name: string;
  ssn: string;
}

function makeEncryptedDb(dbName: string, key: Uint8Array | Promise<Uint8Array>) {
  const db = new Dexie(dbName) as Dexie & { people: Table<Person, string> };
  applyFieldEncryption(db, key, { people: ["name", "ssn"] });
  db.version(1).stores({ people: "id, country" });
  return db;
}

function randomKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

describe("applyFieldEncryption", () => {
  let dbCounter = 0;
  function freshDbName() {
    return `encryption-test-${Date.now()}-${dbCounter++}`;
  }

  it("round-trips encrypted fields through put/get", async () => {
    const db = makeEncryptedDb(freshDbName(), randomKey());
    await db.people.put({ id: "1", country: "ng", name: "Amara Okafor", ssn: "A012345678Z" });

    const result = await db.people.get("1");

    expect(result?.name).toBe("Amara Okafor");
    expect(result?.ssn).toBe("A012345678Z");
  });

  it("never stores encrypted field values in plaintext", async () => {
    const dbName = freshDbName();
    const db = makeEncryptedDb(dbName, randomKey());
    await db.people.put({ id: "1", country: "ng", name: "Amara Okafor", ssn: "A012345678Z" });

    // Bypass the middleware and inspect the raw IndexedDB record directly.
    const raw = await new Promise<Person>((resolve, reject) => {
      const openReq = indexedDB.open(dbName);
      openReq.onsuccess = () => {
        const idb = openReq.result;
        const tx = idb.transaction("people", "readonly");
        const getReq = tx.objectStore("people").get("1");
        getReq.onsuccess = () => resolve(getReq.result);
        getReq.onerror = () => reject(getReq.error);
      };
      openReq.onerror = () => reject(openReq.error);
    });

    expect(raw.name).not.toBe("Amara Okafor");
    expect(raw.ssn).not.toBe("A012345678Z");
    expect(typeof raw.name).toBe("string");
    expect(raw.name).toMatch(/^enc:v1:/);
  });

  it("keeps non-encrypted indexed fields plaintext and queryable", async () => {
    const db = makeEncryptedDb(freshDbName(), randomKey());
    await db.people.put({ id: "1", country: "ng", name: "Amara Okafor", ssn: "A012345678Z" });
    await db.people.put({ id: "2", country: "ke", name: "Wanjiru Kamau", ssn: "B098765432Y" });

    const nigerians = await db.people.where("country").equals("ng").toArray();

    expect(nigerians).toHaveLength(1);
    expect(nigerians[0].name).toBe("Amara Okafor");
  });

  it("decrypts all rows returned by toArray()", async () => {
    const db = makeEncryptedDb(freshDbName(), randomKey());
    await db.people.put({ id: "1", country: "ng", name: "Amara Okafor", ssn: "A012345678Z" });
    await db.people.put({ id: "2", country: "gh", name: "Kwame Mensah", ssn: "C011122233X" });

    const all = await db.people.toArray();

    expect(all.map((p) => p.name).sort()).toEqual(["Amara Okafor", "Kwame Mensah"]);
  });

  it("fails to decrypt data written with a different key", async () => {
    const dbName = freshDbName();
    const dbWriter = makeEncryptedDb(dbName, randomKey());
    await dbWriter.people.put({ id: "1", country: "ng", name: "Amara Okafor", ssn: "A012345678Z" });
    await dbWriter.close();

    const dbReader = makeEncryptedDb(dbName, randomKey()); // different random key
    await expect(dbReader.people.get("1")).rejects.toThrow();
  });
});
