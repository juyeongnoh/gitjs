import { createHash } from "crypto";
import { deflateSync } from "zlib";
import { existsSync, mkdirSync, writeFileSync } from "fs";

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
  const sha = createHash("SHA1")
    .update(Buffer.concat([header, content]))
    .digest("hex");

  if (mode === "write") {
    const dirName = sha.slice(0, 2);
    const fileName = sha.slice(2);
    const compressed = deflateSync(Buffer.concat([header, content]), {
      level: 1,
    });

    if (!existsSync(`.git/objects/${dirName}`)) {
      mkdirSync(`.git/objects/${dirName}`);
    }

    writeFileSync(`.git/objects/${dirName}/${fileName}`, compressed);
  }

  return sha;
}

export { hashObject };
