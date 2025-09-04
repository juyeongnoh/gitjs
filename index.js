const readline = require("readline");
const { init, add } = require("./porcelains");
const { catFile, printIndex, writeTree } = require("./plumbings");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("line", (input) => {
  if (input === "init") {
    init();
  } else if (input.startsWith("add")) {
    const files = input.split(" ").slice(1);
    add(files);
  } else if (input.startsWith("cat-file")) {
    const hash = input.split(" ")[1];
    catFile(hash);
  } else if (input.startsWith("print-index")) {
    printIndex();
  } else if (input.startsWith("write-tree")) {
    writeTree();
  }
});
