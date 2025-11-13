import { inflateSync } from "zlib";
import { hashObject } from "../plumbings/hashObject.js";

class Commit {
  constructor(tree, parents, author, committer, message) {
    this.tree = tree;
    this.parents = parents;
    this.author = author;
    this.committer = committer;
    this.message = message;
  }

  /**
   * @param {Buffer} commit
   */
  static fromObject(commit) {
    const unzippedObjectBuffer = inflateSync(commit);

    let offset = 0;
    let header = "";

    while (unzippedObjectBuffer[offset] !== 0) {
      header += String.fromCharCode(unzippedObjectBuffer[offset]);
      offset++;
    }
    offset++;

    const [type, sizeStr] = header.split(" ");
    const size = parseInt(sizeStr, 10);

    if (type !== "commit" || size !== unzippedObjectBuffer.length - offset) {
      throw new Error("Invalid commit object");
    }

    let content = unzippedObjectBuffer.reduce((acc, byte, idx) => {
      if (idx >= offset) {
        acc += String.fromCharCode(byte);
      }
      return acc;
    }, "");
    const lines = content.split("\n");

    let tree = "";
    const parents = [];
    let author = "";
    let committer = "";
    let messageLines = [];
    let i = 0;

    for (; i < lines.length; i++) {
      const line = lines[i];
      if (line === "") {
        break;
      }

      const [key, ...rest] = line.split(" ");
      const value = rest.join(" ");

      if (key === "tree") {
        tree = value;
      } else if (key === "parent") {
        parents.push(value);
      } else if (key === "author") {
        author = value;
      } else if (key === "committer") {
        committer = value;
      }
    }

    messageLines = lines.slice(i + 1);
    const message = messageLines.join("\n");

    return new Commit(tree, parents, author, committer, message);
  }
  getContent() {
    let content = `tree ${this.tree}\n`;
    this.parents.forEach((parent) => {
      content += `parent ${parent}\n`;
    });
    content += `author ${this.author}\n`;
    content += `committer ${this.committer}\n\n`;
    content += `${this.message}\n`;
    return content;
  }

  getHash() {
    const content = this.getContent();
    return hashObject(Buffer.from(content), "commit", "write");
  }
}

export default Commit;
