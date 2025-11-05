import { createInterface } from "readline";
import { catFile } from "./plumbings/catFile.js";
import { printIndex } from "./plumbings/printIndex.js";
import { writeTree } from "./plumbings/writeTree.js";
import { init } from "./porcelains/init.js";
import { add } from "./porcelains/add.js";

const rl = createInterface({
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
