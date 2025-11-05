const { getCurrentIndex } = require("./getCurrentIndex");

function printIndex() {
  const currentIndex = getCurrentIndex();
  currentIndex.prettyPrint();
}

module.exports = { printIndex };
