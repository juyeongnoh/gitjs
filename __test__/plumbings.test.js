import { describe, expect, test } from "vitest";
import { hashObject } from "../plumbings/hashObject.js";

describe("hashObject()", () => {
  // content: can't touch this
  const testfile = Buffer.from([
    0x63, 0x61, 0x6e, 0x27, 0x74, 0x20, 0x74, 0x6f, 0x75, 0x63, 0x68, 0x20,
    0x74, 0x68, 0x69, 0x73,
  ]);

  test("returns valid SHA-1 HEX 1", () => {
    const sha = hashObject(testfile, "blob", null);
    expect(sha).toEqual("94743cdfefd33ab98abf8f09cf49141739eb8e52");
  });
});
