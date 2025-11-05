import Entry from "../types/Entry.js";
import { getCurrentIndex } from "./getCurrentIndex.js";
import { existsSync, lstatSync, writeFileSync } from "fs";

function updateIndex(filePathname, hash) {
  if (!existsSync(filePathname)) {
    throw new Error(`File not found: ${filePathname}`);
  }

  const currentIndex = getCurrentIndex();
  const fileStats = lstatSync(filePathname, { bigint: true });
  const entry = Entry.fromFileStats(
    fileStats,
    hash,
    filePathname.length,
    filePathname
  );
  currentIndex.addEntry(entry);

  // index 파일 업데이트
  writeFileSync(".git/index", currentIndex.toBuffer());
}

export { updateIndex };
