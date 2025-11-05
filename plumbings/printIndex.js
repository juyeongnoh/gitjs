import { getCurrentIndex } from "./getCurrentIndex.js";

function printIndex() {
  const currentIndex = getCurrentIndex();
  currentIndex.prettyPrint();
}

export { printIndex };
