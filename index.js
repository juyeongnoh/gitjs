const readline = require("readline");
const { catFile } = require("./plumbings/catFile");
const { printIndex } = require("./plumbings/printIndex");
const { writeTree } = require("./plumbings/writeTree");
const { init } = require("./porcelains/init");
const { add } = require("./porcelains/add");

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
