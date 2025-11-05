const fs = require("fs");
const Index = require("../types/Index");

function initIndex() {
  const index = new Index();
  fs.writeFileSync(".git/index", index.toBuffer());
}

module.exports = { initIndex };
