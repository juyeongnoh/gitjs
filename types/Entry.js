const { Stats } = require("node:fs");

/**
 * Entry (Version 2)
 */
class Entry {
  constructor({
    ctimeSec,
    ctimeNsec,
    mtimeSec,
    mtimeNsec,
    dev,
    ino,
    entryType,
    filePermission,
    uid,
    gid,
    fileSize,
    objectName,
    assumeValid,
    extended,
    stage,
    nameLength,
    entryPathname,
  }) {
    this.ctimeSec = ctimeSec;
    this.ctimeNsec = ctimeNsec;
    this.mtimeSec = mtimeSec;
    this.mtimeNsec = mtimeNsec;
    this.dev = dev;
    this.ino = ino;
    this.entryType = entryType;
    this.filePermission = filePermission;
    this.uid = uid;
    this.gid = gid;
    this.fileSize = fileSize;
    this.objectName = objectName;
    this.assumeValid = assumeValid;
    this.extended = extended;
    this.stage = stage;
    this.nameLength = nameLength;
    this.entryPathname = entryPathname;
  }

  /**
   * Create an Entry instance from file stats.
   * @param {Stats} stats
   * @param {string} objectName - 20 bytes of file hash (ex. `blob 12\0Hello world!`)
   * @param {number} nameLength - Length of the file name
   * @param {string} entryPathname - File path (with null terminator)
   * @returns {Entry}
   */
  static fromFileStats(stats, objectName, nameLength, entryPathname) {
    if (!(stats instanceof Stats)) {
      throw new Error("Invalid stats object");
    }

    const isSymlink = stats.isSymbolicLink();

    return new Entry({
      ctimeSec: parseInt(stats.ctimeMs / 1000),
      ctimeNsec: parseInt((stats.ctimeMs % 1000) * 1e6),
      mtimeSec: parseInt(stats.mtimeMs / 1000),
      mtimeNsec: parseInt((stats.mtimeMs % 1000) * 1e6),
      dev: stats.dev,
      ino: stats.ino,
      entryType: isSymlink ? "SYMLINK" : "REGULAR_FILE",
      filePermission: isSymlink ? 0 : stats.mode & 0o777,
      uid: stats.uid,
      gid: stats.gid,
      fileSize: isSymlink ? 0 : stats.size & 0xffffffff,
      objectName: objectName,
      assumeValid: false,
      extended: false,
      stage: 0,
      nameLength: nameLength & 0xfff,
      entryPathname: entryPathname + "\0",
    });
  }

  toBuffer() {
    const ctimeSecBuffer = Buffer.alloc(4);
    ctimeSecBuffer.writeUInt32BE(this.ctimeSec);
    const ctimeNsecBuffer = Buffer.alloc(4);
    ctimeNsecBuffer.writeUInt32BE(this.ctimeNsec);

    const mtimeSecBuffer = Buffer.alloc(4);
    mtimeSecBuffer.writeUInt32BE(this.mtimeSec);
    const mtimeNsecBuffer = Buffer.alloc(4);
    mtimeNsecBuffer.writeUInt32BE(this.mtimeNsec);

    const devBuffer = Buffer.alloc(4);
    devBuffer.writeUInt32BE(this.dev);
    const inoBuffer = Buffer.alloc(4);
    inoBuffer.writeUInt32BE(this.ino);

    const modeBuffer = Buffer.alloc(4);
    let entryTypeAndUnused;
    if (this.entryType === "REGULAR_FILE") {
      entryTypeAndUnused = 0b1000;
    } else if (this.entryType === "SYMLINK") {
      entryTypeAndUnused = 0b1010;
    } else if (this.entryType === "GITLINK") {
      entryTypeAndUnused = 0b1110;
    }
    entryTypeAndUnused = entryTypeAndUnused << 12;
    modeBuffer.writeUInt32BE(entryTypeAndUnused | this.filePermission);

    const uidBuffer = Buffer.alloc(4);
    uidBuffer.writeUInt32BE(this.uid);
    const gidBuffer = Buffer.alloc(4);
    gidBuffer.writeUInt32BE(this.gid);

    const fileSizeBuffer = Buffer.alloc(4);
    fileSizeBuffer.writeUInt32BE(this.fileSize);

    const objectNameBuffer = Buffer.alloc(20);
    objectNameBuffer.write(this.objectName, "hex");

    const flagsBuffer = Buffer.alloc(2);
    let assumeValid = this.assumeValid ? 1 : 0;
    assumeValid = assumeValid << 15;
    let extended = this.extended ? 1 : 0;
    extended = extended << 14;
    let stage = this.stage;
    stage = stage << 12;
    const flags = assumeValid | extended | stage | this.nameLength;
    flagsBuffer.writeUInt16BE(flags);

    const entryPathnameBuffer = Buffer.from(this.entryPathname);
    const paddingLength = (8 - ((62 + entryPathnameBuffer.length) % 8)) % 8;
    const paddingBuffer = Buffer.alloc(paddingLength);

    return Buffer.concat([
      ctimeSecBuffer,
      ctimeNsecBuffer,
      mtimeSecBuffer,
      mtimeNsecBuffer,
      devBuffer,
      inoBuffer,
      modeBuffer,
      uidBuffer,
      gidBuffer,
      fileSizeBuffer,
      objectNameBuffer,
      flagsBuffer,
      entryPathnameBuffer,
      paddingBuffer,
    ]);
  }

  isValid() {}
}

module.exports = Entry;
