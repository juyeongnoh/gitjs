const { hashObject } = require("../plumbings");
const fs = require("fs");

describe("hashObject() 함수", () => {
  test("SHA-1 HEX 해시 반환 여부 1 (testfile)", () => {
    const mytestfile = fs.readFileSync("testfile").toString();
    const sha = hashObject(mytestfile, "blob", null);
    expect(sha).toEqual("94743cdfefd33ab98abf8f09cf49141739eb8e52");
  });

  test("SHA-1 HEX 해시 반환 여부 1 (mytestfile)", () => {
    const mytestfile = fs.readFileSync("mytestfile").toString();
    const sha = hashObject(mytestfile, "blob", null);
    expect(sha).toEqual("a9ab52f2fdeb2670fd53d27cc58a4de2e96bb399");
  });
});
