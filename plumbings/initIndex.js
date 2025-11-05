import { writeFileSync } from "fs";
import Index from "../types/Index.js";

function initIndex() {
  const index = new Index();
  writeFileSync(".git/index", index.toBuffer());
}

export { initIndex };
