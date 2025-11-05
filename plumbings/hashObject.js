const crypto = require("crypto");
const zlib = require("zlib");
const fs = require("fs");

/**
 * @param {Buffer} content
 * @param {string} type
 * @param {string} mode
 * @returns
 */
function hashObject(content, type = "blob", mode = "write") {
  if (
    type !== "blob" &&
    type !== "commit" &&
    type !== "tree" &&
    type !== "tag"
  ) {
    throw new Error("Invalid type");
  }

  const bytes = Buffer.byteLength(content);
  const header = Buffer.from(`${type} ${bytes}\0`);
  const sha = crypto
    .createHash("SHA1")
    .update(Buffer.concat([header, content]))
    .digest("hex");

  if (mode === "write") {
    const dirName = sha.slice(0, 2);
    const fileName = sha.slice(2);
    const compressed = zlib.deflateSync(Buffer.concat([header, content]), {
      level: 1,
    });

    if (!fs.existsSync(`.git/objects/${dirName}`)) {
      fs.mkdirSync(`.git/objects/${dirName}`);
    }

    fs.writeFileSync(`.git/objects/${dirName}/${fileName}`, compressed);
  }

  return sha;
}

module.exports = { hashObject };
