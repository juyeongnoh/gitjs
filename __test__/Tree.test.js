const Entry = require("../types/Entry");

describe("Tree Class", () => {
  test("saves file in hierarchical structure", () => {
    const entry = new Entry({
      ctimeSec: 1696118400,
      ctimeNsec: 0,
      mtimeSec: 1696118400,
      mtimeNsec: 0,
      dev: 16777220,
      ino: 123456,
      entryType: "blob",
      filePermission: 0o100644,
      uid: 1000,
      gid: 1000,
      fileSize: 13,
      objectName: "e965047f5c8fa6c1d3f4e8b9c8f8e8e8e8e8e8e8",
      assumeValid: 0,
      extended: 0,
      stage: 0,
      nameLength: 15,
      entryPathname: "src/utils/helpers.js\0",
    });
  });
});
