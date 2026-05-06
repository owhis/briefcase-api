import { describe, it, expect } from "vitest";
import { normalizeItem, normalizeList, createNormalizer } from "./normalize";

interface RawUser {
  user_id: number;
  user_name: string;
  email_address: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

const toUser = (raw: RawUser): User => ({
  id: raw.user_id,
  name: raw.user_name,
  email: raw.email_address,
});

const rawUser: RawUser = { user_id: 1, user_name: "Alice", email_address: "alice@example.com" };

describe("normalizeItem", () => {
  it("transforms a valid item successfully", () => {
    const result = normalizeItem(rawUser, { transform: toUser });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ id: 1, name: "Alice", email: "alice@example.com" });
  });

  it("returns fallback on null input", () => {
    const fallback: User = { id: 0, name: "", email: "" };
    const result = normalizeItem(null as unknown as RawUser, { transform: toUser, fallback });
    expect(result.ok).toBe(false);
    expect(result.data).toEqual(fallback);
  });

  it("returns null data when no fallback and input is null", () => {
    const result = normalizeItem(null as unknown as RawUser, { transform: toUser });
    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
  });

  it("catches transform errors and returns error message", () => {
    const boom = () => { throw new Error("bad transform"); };
    const result = normalizeItem(rawUser, { transform: boom as unknown as (r: RawUser) => User });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("bad transform");
  });

  it("rethrows in strict mode", () => {
    const boom = () => { throw new Error("strict error"); };
    expect(() =>
      normalizeItem(rawUser, { transform: boom as unknown as (r: RawUser) => User, strict: true })
    ).toThrow("strict error");
  });
});

describe("normalizeList", () => {
  it("normalizes all valid items", () => {
    const raw = [rawUser, { user_id: 2, user_name: "Bob", email_address: "bob@example.com" }];
    const { results, errors, total, failed } = normalizeList(raw, { transform: toUser });
    expect(results).toHaveLength(2);
    expect(errors).toHaveLength(0);
    expect(total).toBe(2);
    expect(failed).toBe(0);
  });

  it("collects errors for failed items and continues", () => {
    const bad = null as unknown as RawUser;
    const { results, errors, failed } = normalizeList([rawUser, bad], { transform: toUser });
    expect(results).toHaveLength(1);
    expect(failed).toBe(1);
    expect(errors[0]).toBeTruthy();
  });
});

describe("createNormalizer", () => {
  it("creates a bound normalizer with one() and many()", () => {
    const userNormalizer = createNormalizer(toUser);
    const single = userNormalizer.one(rawUser);
    expect(single.ok).toBe(true);
    expect(single.data?.name).toBe("Alice");

    const list = userNormalizer.many([rawUser]);
    expect(list.results).toHaveLength(1);
  });

  it("respects default options passed at creation", () => {
    const fallback: User = { id: -1, name: "unknown", email: "" };
    const normalizer = createNormalizer(toUser, { fallback });
    const result = normalizer.one(null as unknown as RawUser);
    expect(result.data).toEqual(fallback);
  });
});
