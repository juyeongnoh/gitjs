const Tree = require("../types/Tree");
const { getCurrentIndex } = require("./getCurrentIndex");

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

module.exports = { writeTree };
