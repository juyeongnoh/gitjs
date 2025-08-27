const crypto = require("crypto");
const Entry = require("./Entry");

/** Index version 2 */
class Index {
  #signature = "DIRC";
  #version = 2;

  constructor() {
    /** @type {Array<Entry>} */
    this.entries = [];
  }

  addEntry(entry) {
    if (!(entry instanceof Entry)) {
      throw new Error("Invalid entry type");
    }

    this.entries = this.entries.filter(
      (previousEntry) => previousEntry.entryPathname !== entry.entryPathname
    );

    this.entries.push(entry);
    this.entries.sort((a, b) => {
      const pathCompareFunction = Buffer.compare(
        Buffer.from(a.entryPathname),
        Buffer.from(b.entryPathname)
      );

      if (pathCompareFunction !== 0) {
        console.log(a.entryPathname, b.entryPathname, pathCompareFunction);
        return pathCompareFunction;
      }

      return a.stage - b.stage;
    });
  }

  toBuffer() {
    const signatureBuffer = Buffer.alloc(4);
    signatureBuffer.write(this.#signature);
    const versionBuffer = Buffer.alloc(4);
    versionBuffer.writeUInt32BE(this.#version);
    const entryCountBuffer = Buffer.alloc(4);
    entryCountBuffer.writeUInt32BE(this.entries.length);

    const entriesBuffer = Buffer.concat(
      this.entries.map((entry) => entry.toBuffer())
    );

    const contentBuffer = Buffer.concat([
      signatureBuffer,
      versionBuffer,
      entryCountBuffer,
      entriesBuffer,
    ]);

    const checksum = crypto.createHash("sha1").update(contentBuffer).digest();

    return Buffer.concat([contentBuffer, checksum]);
  }

  #getChecksum() {
    const signatureBuffer = Buffer.alloc(4);
    signatureBuffer.write(this.#signature);
    const versionBuffer = Buffer.alloc(4);
    versionBuffer.writeUInt32BE(this.#version);
    const entryCountBuffer = Buffer.alloc(4);
    entryCountBuffer.writeUInt32BE(this.entries.length);

    const entriesBuffer = Buffer.concat(
      this.entries.map((entry) => entry.toBuffer())
    );

    const contentBuffer = Buffer.concat([
      signatureBuffer,
      versionBuffer,
      entryCountBuffer,
      entriesBuffer,
    ]);

    const checksum = crypto.createHash("sha1").update(contentBuffer).digest();

    return checksum;
  }

  prettyPrint() {
    console.log("HEADER--------");
    console.log(
      `Signature: ${this.#signature}, Version: ${this.#version}, Entry Count: ${
        this.entries.length
      }\n`
    );

    console.log("CONTENT-------");
    console.table(this.entries);
    console.log();

    console.log("CHECKSUM------");
    console.log(this.#getChecksum().toString("hex"));
  }
}

module.exports = Index;
