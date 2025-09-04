const { hashObject } = require("../plumbings");
const Entry = require("../types/Entry");

describe("Entry 클래스", () => {
  const testEntryBuffer1 = Buffer.concat([
    // ctime
    Buffer.from([0x68, 0xae, 0x89, 0x91, 0x31, 0x1c, 0x40, 0x53]),
    // mtime
    Buffer.from([0x68, 0xae, 0x89, 0x91, 0x31, 0x1c, 0x40, 0x53]),
    // dev
    Buffer.from([0x01, 0x00, 0x00, 0x0f]),
    // ino
    Buffer.from([0x00, 0x3f, 0x1f, 0xad]),
    // mode
    Buffer.from([0x00, 0x00, 0x81, 0xa4]),
    // uid
    Buffer.from([0x00, 0x00, 0x01, 0xf5]),
    // gid
    Buffer.from([0x00, 0x00, 0x00, 0x14]),
    // fileSize
    Buffer.from([0x00, 0x00, 0x00, 0x10]),
    // objectName
    Buffer.from([
      0x94, 0x74, 0x3c, 0xdf, 0xef, 0xd3, 0x3a, 0xb9, 0x8a, 0xbf, 0x8f, 0x09,
      0xcf, 0x49, 0x14, 0x17, 0x39, 0xeb, 0x8e, 0x52,
    ]),
    // flags
    Buffer.from([0x00, 0x08]),
    // entryPathname
    Buffer.from([0x74, 0x65, 0x73, 0x74, 0x66, 0x69, 0x6c, 0x65, 0x00, 0x00]),
  ]);

  const testEntryBuffer2 = Buffer.concat([
    // ctime
    Buffer.from([0x68, 0xae, 0x89, 0xa2, 0x22, 0x87, 0xad, 0x91]),
    // mtime
    Buffer.from([0x68, 0xae, 0x89, 0xa2, 0x22, 0x87, 0xad, 0x91]),
    // dev
    Buffer.from([0x01, 0x00, 0x00, 0x0f]),
    // ino
    Buffer.from([0x00, 0x3f, 0x1f, 0xca]),
    // mode
    Buffer.from([0x00, 0x00, 0x81, 0xa4]),
    // uid
    Buffer.from([0x00, 0x00, 0x01, 0xf5]),
    // gid
    Buffer.from([0x00, 0x00, 0x00, 0x14]),
    // fileSize
    Buffer.from([0x00, 0x00, 0x00, 0x17]),
    // objectName
    Buffer.from([
      0xa9, 0xab, 0x52, 0xf2, 0xfd, 0xeb, 0x26, 0x70, 0xfd, 0x53, 0xd2, 0x7c,
      0xc5, 0x8a, 0x4d, 0xe2, 0xe9, 0x6b, 0xb3, 0x99,
    ]),
    // flags
    Buffer.from([0x00, 0x0a]),
    // entryPathname
    Buffer.from([
      0x6d, 0x79, 0x74, 0x65, 0x73, 0x74, 0x66, 0x69, 0x6c, 0x65, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]),
  ]);

  const createMockFileStats = (options) => {
    return {
      dev: options.dev,
      ino: options.ino,
      mode: options.mode,
      uid: options.uid,
      gid: options.gid,
      size: options.size,
      ctimeMs: options.ctimeMs,
      mtimeMs: options.mtimeMs,
      isSymbolicLink: options.isSymbolicLink,
    };
  };

  test("fromFileStats() 유효성 테스트 1 (testfile)", () => {
    const mockStats = createMockFileStats({
      dev: 16777231,
      ino: 4136877,
      mode: 33188,
      uid: 501,
      gid: 20,
      size: 16,
      ctimeMs: 1756268945823.935,
      mtimeMs: 1756268945823.935,
      isSymbolicLink: () => false,
    });

    // content: can't touch this
    const testfile = Buffer.from([
      0x63, 0x61, 0x6e, 0x27, 0x74, 0x20, 0x74, 0x6f, 0x75, 0x63, 0x68, 0x20,
      0x74, 0x68, 0x69, 0x73,
    ]);

    const entry = Entry.fromFileStats(
      mockStats,
      hashObject(testfile, "blob", null),
      "testfile".length,
      "testfile"
    );

    // ctime, mtime, dev, ino는 비교 대상에서 제외
    expect(
      Buffer.compare(testEntryBuffer1.slice(24), entry.toBuffer().slice(24))
    ).toEqual(0);
  });

  test("객체 생성 테스트 2 (mytestfile)", () => {
    const mockStats = createMockFileStats({
      dev: 16777231,
      ino: 4136906,
      mode: 33188,
      uid: 501,
      gid: 20,
      size: 23,
      ctimeMs: 1756268962579.3171,
      mtimeMs: 1756268962579.3171,
      isSymbolicLink: () => false,
    });

    // content: don't touch this either
    const mytestfile = Buffer.from([
      0x64, 0x6f, 0x6e, 0x27, 0x74, 0x20, 0x74, 0x6f, 0x75, 0x63, 0x68, 0x20,
      0x74, 0x68, 0x69, 0x73, 0x20, 0x65, 0x69, 0x74, 0x68, 0x65, 0x72,
    ]);

    const entry = Entry.fromFileStats(
      mockStats,
      hashObject(mytestfile, "blob", null),
      "mytestfile".length,
      "mytestfile"
    );

    // ctime, mtime, dev, ino는 비교 대상에서 제외
    expect(
      Buffer.compare(testEntryBuffer2.slice(24), entry.toBuffer().slice(24))
    ).toEqual(0);
  });
});
