import { hashObject } from "../plumbings/hashObject.js";
import Entry from "./Entry.js";

class Tree {
  constructor() {
    this.tree = {};
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

  getHash(tree = this.tree) {
    const res = [];

    const objectNames = Object.keys(tree);
    objectNames.sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));

    // 0 4 0 0 0 0
    // 0x30 0x34 0x30 0x30 0x30 0x30

    // 1 0 0 6 4 4
    // 0x31	0x30	0x30	0x36	0x34	0x34

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

    return hashObject(Buffer.concat(res), "tree", "write");
  }
}
// 이전
//'53eb32ac59a83a9b9c9c8c25ac7d6c97e896ee47' test/ tree
//'0e6c44c5768026e6064a7e361a3137cebc3b2495' types/ tree
//'3d856a7b2e9a070479dbcc84c8cc50e8b33fa86f' root tree
// 이후
// "1980a89f72a89dca7738e3150344f07e09a7eab9" root
export default Tree;
