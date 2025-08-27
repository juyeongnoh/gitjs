// 저수준 명령어
// plumbing: 배관[수도 시설]
// 배관처럼 일반인이 쉽게 만지기 어려운 명령어 모음

const crypto = require("crypto");
const zlib = require("zlib");
const fs = require("fs");

const Index = require("./types/Index");
const Entry = require("./types/Entry");

function initIndex() {
  const index = new Index();
  fs.writeFileSync(".git/index", index.toBuffer());
}

function hashObject(string, type = "blob", mode = "write") {
  if (
    type !== "blob" &&
    type !== "commit" &&
    type !== "tree" &&
    type !== "tag"
  ) {
    throw new Error("Invalid type");
  }

  const bytes = Buffer.byteLength(string, "utf8");
  const header = `${type} ${bytes}\0`;
  const sha = crypto
    .createHash("SHA1")
    .update(header + string)
    .digest("hex");

  if (mode === "write") {
    const dirName = sha.slice(0, 2);
    const fileName = sha.slice(2);
    const compressed = zlib.deflateSync(Buffer.from(header + string));

    if (!fs.existsSync(`.git/objects/${dirName}`)) {
      fs.mkdirSync(`.git/objects/${dirName}`, { recursive: true });
    }

    fs.writeFileSync(`.git/objects/${dirName}/${fileName}`, compressed);
  }

  return sha;
}

function updateIndex(filePathname, hash) {
  if (!fs.existsSync(filePathname)) {
    throw new Error(`File not found: ${filePathname}`);
  }

  const currentIndex = getCurrentIndex();
  const fileStats = fs.lstatSync(filePathname);
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

function printIndex() {
  const currentIndex = getCurrentIndex();
  console.table(currentIndex.entries);
}

function getCurrentIndex() {
  // index 파일이 없으면 새로운 빈 index 반환
  if (!fs.existsSync(".git/index")) {
    initIndex();
  }

  const indexFile = fs.readFileSync(".git/index");
  const index = new Index();
  console.log("NEW INDEX CALLED!");

  // Signature, Version 스킵
  let off = 8;

  const entryCount = indexFile.readUInt32BE(off);
  off += 4;

  for (let i = 0; i < entryCount; i++) {
    // 범위 체크
    if (off + 62 > indexFile.length) {
      console.warn(`Entry ${i}: Not enough data remaining`);
      break;
    }

    const ctimeSec = indexFile.readUInt32BE(off);
    off += 4;
    const ctimeNsec = indexFile.readUInt32BE(off);
    off += 4;
    const mtimeSec = indexFile.readUInt32BE(off);
    off += 4;
    const mtimeNsec = indexFile.readUInt32BE(off);
    off += 4;

    const dev = indexFile.readUInt32BE(off);
    off += 4;
    const ino = indexFile.readUInt32BE(off);
    off += 4;

    const mode = indexFile.readUInt32BE(off);
    const entryType = (() => {
      let bit = mode & 0b00000000000000001111000000000000;
      bit >>= 12;
      if (bit === 0b1000) return "REGULAR_FILE";
      else if (bit === 0b1010) return "SYMLINK";
      else if (bit === 0b1110) return "GITLINK";
    })();

    const filePermission = mode & 0b00000000000000000000000111111111;
    off += 4;

    const uid = indexFile.readUInt32BE(off);
    off += 4;
    const gid = indexFile.readUInt32BE(off);
    off += 4;
    const fileSize = indexFile.readUInt32BE(off);
    off += 4;

    // SHA (20 bytes)
    if (off + 20 > indexFile.length) break;
    const sha = indexFile.slice(off, off + 20);
    off += 20;

    // flags (2 bytes)
    if (off + 2 > indexFile.length) break;
    const flags = indexFile.readUInt16BE(off);
    const assumeValid = (() => {
      let bit = flags & 0b1000000000000000;
      bit >>= 15;
      return bit === 1;
    })();
    const extended = (() => {
      let bit = flags & 0b0100000000000000;
      bit >>= 14;
      return bit === 1;
    })();
    const stage = (() => {
      let bit = flags & 0b0011000000000000;
      bit >>= 12;
      return bit;
    })();
    const nameLength = flags & 0b0000111111111111;
    off += 2;

    // 파일명 읽기
    if (off + nameLength > indexFile.length) break;
    const name = indexFile.toString("utf8", off, off + nameLength + 1);
    off += nameLength;

    // null terminator 건너뛰기
    // if (off < indexFile.length && indexFile[off] === 0) {
    //   off++;
    // }

    // 8-byte 정렬까지 패딩 건너뛰기
    const entryStart = off - nameLength - 1 - 2 - 20 - 40; // entry 시작점 계산
    const paddedSize = Math.ceil((62 + nameLength + 1) / 8) * 8;
    off = entryStart + paddedSize;

    const entry = new Entry({
      ctimeSec,
      ctimeNsec,
      mtimeSec,
      mtimeNsec,
      dev,
      ino,
      entryType,
      filePermission,
      uid,
      gid,
      fileSize,
      objectName: sha.toString("hex"),
      assumeValid,
      extended,
      stage,
      nameLength,
      entryPathname: name,
    });

    index.addEntry(entry);
  }

  return index;
}

function catFile(hash) {
  if (hash.length < 6) {
    throw new Error("Hash length must be longer than 6");
  }

  const baseObjectsDir = ".git/objects";

  let object;
  let unzippedObject;

  const dir = fs.readdirSync(baseObjectsDir);

  const dirName = hash.slice(0, 2);
  const fileName = hash.slice(2);

  if (dir.includes(dirName)) {
    const hashDir = fs.readdirSync(baseObjectsDir + "/" + dirName);
    const hashFile = hashDir.find((object) => object.startsWith(fileName));
    object = fs.readFileSync(baseObjectsDir + "/" + dirName + "/" + hashFile);
    unzippedObject = zlib.inflateSync(object);
  }

  if (!object) {
    console.log("오류: 해당 오브젝트를 찾을 수 없습니다.");
    return;
  }

  console.log(unzippedObject.toString());
}

module.exports = {
  initIndex,
  hashObject,
  updateIndex,
  printIndex,
  catFile,
  readEntriesFromIndex: getCurrentIndex,
};
