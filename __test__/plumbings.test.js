const { hashObject } = require("../plumbings");
const Entry = require("../types/Entry");
const Index = require("../types/Index");

describe("hashObject()", () => {
  // content: can't touch this
  const testfile1 = Buffer.from([
    0x63, 0x61, 0x6e, 0x27, 0x74, 0x20, 0x74, 0x6f, 0x75, 0x63, 0x68, 0x20,
    0x74, 0x68, 0x69, 0x73,
  ]);

  // content: don't touch this either
  const testfile2 = Buffer.from([
    0x64, 0x6f, 0x6e, 0x27, 0x74, 0x20, 0x74, 0x6f, 0x75, 0x63, 0x68, 0x20,
    0x74, 0x68, 0x69, 0x73, 0x20, 0x65, 0x69, 0x74, 0x68, 0x65, 0x72,
  ]);

  test("returns valid SHA-1 HEX 1", () => {
    const sha = hashObject(testfile1, "blob", null);
    expect(sha).toEqual("94743cdfefd33ab98abf8f09cf49141739eb8e52");
  });

  test("returns valid SHA-1 HEX 2", () => {
    const sha = hashObject(testfile2, "blob", null);
    expect(sha).toEqual("a9ab52f2fdeb2670fd53d27cc58a4de2e96bb399");
  });
});
