const Entry = require("../types/Entry");
const { getCurrentIndex } = require("./getCurrentIndex");
const fs = require("fs");

function updateIndex(filePathname, hash) {
  if (!fs.existsSync(filePathname)) {
    throw new Error(`File not found: ${filePathname}`);
  }

  const currentIndex = getCurrentIndex();
  const fileStats = fs.lstatSync(filePathname, { bigint: true });
  const entry = Entry.fromFileStats(
    fileStats,
    hash,
    filePathname.length,
    filePathname
  );
  currentIndex.addEntry(entry);

  // index 파일 업데이트
  fs.writeFileSync(".git/index", currentIndex.toBuffer());
}

module.exports = { updateIndex };
