import Tree from "../types/Tree.js";
import { getCurrentIndex } from "./getCurrentIndex.js";

/**
 * Writes tree with the index entries.
 */
function writeTree() {
  const currentIndex = getCurrentIndex();
  const tree = new Tree();

  currentIndex.entries.forEach((entry) => {
    tree.addEntry(entry);
  });

  console.log(tree.tree);

  return tree.getHash();
}

export { writeTree };
