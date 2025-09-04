const Entry = require("./Entry");

class Tree {
  constructor(hashObject) {
    this.tree = {};
    this.hashObject = hashObject;
  }

  /**
   * @param {Entry} entry
   */
  addEntry(entry) {
    this.recursive(this.tree, entry, 0);
  }

  /**
   * @param {object} tree
   * @param {Entry} entry
   * @param {number} depth
   */
  recursive(tree, entry, depth) {
    const splittedPathname = entry.entryPathname.split("/");
    const isDirectory = depth !== splittedPathname.length - 1;

    if (isDirectory) {
      const directoryName = splittedPathname[depth] + "/";
      if (!tree[directoryName]) {
        tree[directoryName] = {};
      }
      this.recursive(tree[directoryName], entry, depth + 1);
    } else {
      const fileName = splittedPathname[depth].slice(0, -1);
      tree[fileName] = {
        objectName: entry.objectName,
        entryType: entry.entryType,
        filePermission: entry.filePermission.toString(8),
      };
    }
  }

  /**
   * @param {object} tree
   * @returns
   */
  getHash(tree = this.tree) {
    const res = [];

    const objectNames = Object.keys(tree);
    objectNames.sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));

    objectNames.forEach((objectName) => {
      const isDirectory = !tree[objectName].objectName;

      if (isDirectory) {
        // 040000 + space
        const modeBuffer = Buffer.from([
          0x30, 0x34, 0x30, 0x30, 0x30, 0x30, 0x20,
        ]);
        const nameBuffer = Buffer.from(objectName.slice(0, -1) + "\0");
        const hashBuffer = Buffer.alloc(20);
        hashBuffer.write(this.getHash(tree[objectName]), "hex");
        const buffer = Buffer.concat([modeBuffer, nameBuffer, hashBuffer]);
        res.push(buffer);
      } else {
        // 100644 + space
        const modeBuffer = Buffer.from([
          0x31, 0x30, 0x30, 0x36, 0x34, 0x34, 0x20,
        ]);
        const nameBuffer = Buffer.from(objectName + "\0");
        const hashBuffer = Buffer.alloc(20);
        hashBuffer.write(tree[objectName].objectName, "hex");
        const buffer = Buffer.concat([modeBuffer, nameBuffer, hashBuffer]);
        res.push(buffer);
      }
    });

    return this.hashObject(Buffer.concat(res), "tree", "write");
  }
}

module.exports = Tree;
