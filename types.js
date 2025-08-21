const fs = require("fs");

class Index {
  constructor(signature = "DIRC", version = 2) {
    this.signature = signature;
    this.version = version;
    this.entries = [];
    this.entryCount = 0;
  }

  setSignature(signature) {
    this.signature = signature;
  }

  setVersion(version) {
    this.version = version;
  }

  getHeaderBuffer() {
    const signatureBuffer = Buffer.from(this.signature, "utf8");
    const versionBuffer = Buffer.alloc(4);
    versionBuffer.writeUInt32BE(this.version, 0);
    const entryCountBuffer = Buffer.alloc(4);
    entryCountBuffer.writeUInt32BE(this.entryCount, 0);

    return Buffer.concat([signatureBuffer, versionBuffer, entryCountBuffer]);
  }

  getEntriesBuffer() {
    if (this.entries.length === 0) {
      return Buffer.alloc(0);
    }
    return Buffer.concat(this.entries.map((entry) => entry.getBuffer()));
  }

  /**
   * @param {Entry} entry
   */
  addEntry(entry) {
    if (!(entry instanceof Entry)) {
      throw new Error("Invalid entry type");
    }

    // 기존 동일한 파일의 엔트리가 있는지 확인하고 제거
    this.entries = this.entries.filter(
      (existingEntry) => existingEntry.entryPathname !== entry.entryPathname
    );

    // 단순히 추가 후 정렬
    this.entries.push(entry);
    this.entries.sort((a, b) => {
      if (a.entryPathname < b.entryPathname) return -1;
      if (a.entryPathname > b.entryPathname) return 1;
      return 0;
    });

    this.entryCount = this.entries.length;
  }
}

class Entry {
  constructor({
    ctimeSec = 0,
    ctimeNsec = 0,
    mtimeSec = 0,
    mtimeNsec = 0,
    dev = 0,
    ino = 0,
    mode = 0,
    uid = 0,
    gid = 0,
    fileSize = 0,
    objectName = "",
    flags = 0,
    extendedFlags = 0,
    entryPathname = "",
  } = {}) {
    this.ctimeSec = ctimeSec;
    this.ctimeNsec = ctimeNsec;
    this.mtimeSec = mtimeSec;
    this.mtimeNsec = mtimeNsec;
    this.dev = dev;
    this.ino = ino;
    this.mode = mode;
    this.uid = uid;
    this.gid = gid;
    this.fileSize = fileSize;
    this.objectName = objectName;
    this.flags = flags;
    this.extendedFlags = extendedFlags;
    this.entryPathname = entryPathname;
  }

  setFile(filePath, hash) {
    const stat = fs.statSync(filePath);

    if (!stat.isFile()) {
      throw new Error("Provided path is not a file");
    }

    // 시간을 정확히 설정
    this.ctimeSec = Math.floor(stat.ctime.getTime() / 1000);
    this.ctimeNsec = Math.floor((stat.ctime.getTime() % 1000) * 1000000);
    this.mtimeSec = Math.floor(stat.mtime.getTime() / 1000);
    this.mtimeNsec = Math.floor((stat.mtime.getTime() % 1000) * 1000000);

    this.dev = stat.dev;
    this.ino = stat.ino;
    this.mode = 0o100644; // 일반 파일 모드
    this.uid = stat.uid;
    this.gid = stat.gid;
    this.fileSize = stat.size;
    this.objectName = hash;

    // flags는 getBuffer에서 계산하므로 여기서는 설정하지 않음
    this.flags = 0;
    this.extendedFlags = 0;
    this.entryPathname = filePath;
  }

  static fromFile(filePath, hash) {
    const entry = new Entry();

    const stat = fs.statSync(filePath);

    if (!stat.isFile()) {
      throw new Error("Provided path is not a file");
    }

    // 시간을 정확히 설정
    entry.ctimeSec = Math.floor(stat.ctime.getTime() / 1000);
    entry.ctimeNsec = Math.floor((stat.ctime.getTime() % 1000) * 1000000);
    entry.mtimeSec = Math.floor(stat.mtime.getTime() / 1000);
    entry.mtimeNsec = Math.floor((stat.mtime.getTime() % 1000) * 1000000);

    entry.dev = stat.dev;
    entry.ino = stat.ino;
    entry.mode = 0o100644; // 일반 파일 모드
    entry.uid = stat.uid;
    entry.gid = stat.gid;
    entry.fileSize = stat.size;
    entry.objectName = hash;

    // flags는 getBuffer에서 계산하므로 여기서는 설정하지 않음
    entry.flags = 0;
    entry.extendedFlags = 0;
    entry.entryPathname = filePath;

    return entry;
  }

  getBuffer() {
    // 파일명 바이트 길이 계산
    const nameBytes = Buffer.from(this.entryPathname, "utf8");
    const nameLen = nameBytes.length;

    // flags 설정 (파일명 길이, 최대 0xfff)
    const flags = Math.min(nameLen, 0xfff);

    // 엔트리 전체 크기 계산 (8바이트 정렬)
    const baseSize = 62; // 고정 필드
    const totalBeforePadding = baseSize + nameLen + 1; // +1 for null terminator
    const paddedSize = Math.ceil(totalBeforePadding / 8) * 8;

    const buffer = Buffer.alloc(paddedSize);
    let pos = 0;

    // ctime (8 bytes)
    buffer.writeUInt32BE(this.ctimeSec, pos);
    pos += 4;
    buffer.writeUInt32BE(this.ctimeNsec, pos);
    pos += 4;

    // mtime (8 bytes)
    buffer.writeUInt32BE(this.mtimeSec, pos);
    pos += 4;
    buffer.writeUInt32BE(this.mtimeNsec, pos);
    pos += 4;

    // device, inode, mode, uid, gid, size (24 bytes)
    buffer.writeUInt32BE(this.dev, pos);
    pos += 4;
    buffer.writeUInt32BE(this.ino, pos);
    pos += 4;
    buffer.writeUInt32BE(this.mode, pos);
    pos += 4;
    buffer.writeUInt32BE(this.uid, pos);
    pos += 4;
    buffer.writeUInt32BE(this.gid, pos);
    pos += 4;
    buffer.writeUInt32BE(this.fileSize, pos);
    pos += 4;

    // SHA-1 해시 (20 bytes)
    if (this.objectName && this.objectName.length >= 40) {
      const sha = Buffer.from(this.objectName.slice(0, 40), "hex");
      sha.copy(buffer, pos);
    }
    pos += 20;

    // flags (2 bytes)
    buffer.writeUInt16BE(flags, pos);
    pos += 2;

    // 파일명 (variable length)
    nameBytes.copy(buffer, pos);
    pos += nameLen;

    // null terminator
    buffer[pos] = 0;
    pos += 1;

    // 패딩은 이미 Buffer.alloc으로 0으로 초기화됨

    return buffer;
  }
}

module.exports = { Index, Entry };
