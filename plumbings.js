// 저수준 명령어
// plumbing: 배관[수도 시설]
// 배관처럼 일반인이 쉽게 만지기 어려운 명령어 모음

const crypto = require("crypto");
const zlib = require("zlib");
const fs = require("fs");

const Index = require("./types/Index");
const Entry = require("./types/Entry");
const Tree = require("./types/Tree");

function initIndex() {
  const index = new Index();
  fs.writeFileSync(".git/index", index.toBuffer());
}

/**
 * @param {Buffer} content
 * @param {string} type
 * @param {string} mode
 * @returns
 */
function hashObject(content, type = "blob", mode = "write") {
  if (
    type !== "blob" &&
    type !== "commit" &&
    type !== "tree" &&
    type !== "tag"
  ) {
    throw new Error("Invalid type");
  }

  const bytes = Buffer.byteLength(content);
  const header = Buffer.from(`${type} ${bytes}\0`);
  const sha = crypto
    .createHash("SHA1")
    .update(Buffer.concat([header, content]))
    .digest("hex");

  if (mode === "write") {
    const dirName = sha.slice(0, 2);
    const fileName = sha.slice(2);
    const compressed = zlib.deflateSync(Buffer.concat([header, content]), {
      level: 1,
    });

    if (!fs.existsSync(`.git/objects/${dirName}`)) {
      fs.mkdirSync(`.git/objects/${dirName}`);
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
  currentIndex.prettyPrint();
}

function getCurrentIndex() {
  // index 파일이 없으면 새로운 빈 index 반환
  if (!fs.existsSync(".git/index")) {
    initIndex();
  }

  const indexFile = fs.readFileSync(".git/index");
  const index = new Index();

  // Signature, Version 스킵
  let offset = 8;
  const entryCount = indexFile.readUInt32BE(offset);
  offset += 4;

  for (let i = 0; i < entryCount; i++) {
    // 범위 체크
    if (offset + 62 > indexFile.length) {
      console.warn(`Entry ${i}: Not enough data remaining`);
      break;
    }

    const ctimeSec = indexFile.readUInt32BE(offset);
    offset += 4;
    const ctimeNsec = indexFile.readUInt32BE(offset);
    offset += 4;
    const mtimeSec = indexFile.readUInt32BE(offset);
    offset += 4;
    const mtimeNsec = indexFile.readUInt32BE(offset);
    offset += 4;

    const dev = indexFile.readUInt32BE(offset);
    offset += 4;
    const ino = indexFile.readUInt32BE(offset);
    offset += 4;

    const mode = indexFile.readUInt32BE(offset);
    const entryType = (() => {
      let bit = mode & 0b00000000000000001111000000000000;
      bit >>= 12;
      if (bit === 0b1000) return "REGULAR_FILE";
      else if (bit === 0b1010) return "SYMLINK";
      else if (bit === 0b1110) return "GITLINK";
    })();

    const filePermission = mode & 0b00000000000000000000000111111111;
    offset += 4;

    const uid = indexFile.readUInt32BE(offset);
    offset += 4;
    const gid = indexFile.readUInt32BE(offset);
    offset += 4;
    const fileSize = indexFile.readUInt32BE(offset);
    offset += 4;

    // SHA (20 bytes)
    if (offset + 20 > indexFile.length) break;
    const sha = indexFile.slice(offset, offset + 20);
    offset += 20;

    // flags (2 bytes)
    if (offset + 2 > indexFile.length) break;
    const flags = indexFile.readUInt16BE(offset);
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
    offset += 2;

    // 파일명 읽기
    if (offset + nameLength > indexFile.length) break;
    const entryPathname = indexFile.toString(
      "utf8",
      offset,
      offset + nameLength + 1
    );
    offset += nameLength;

    // null terminator 건너뛰기
    if (offset < indexFile.length && indexFile[offset] === 0) {
      offset++;
    }

    // 8-byte 정렬까지 패딩 건너뛰기
    const entryStart = offset - nameLength - 1 - 2 - 20 - 40; // entry 시작점 계산
    const paddedSize = Math.ceil((62 + nameLength + 1) / 8) * 8;
    offset = entryStart + paddedSize;

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
      entryPathname,
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
  let unzippedObjectBuffer;

  const dir = fs.readdirSync(baseObjectsDir);

  const dirName = hash.slice(0, 2);
  const fileName = hash.slice(2);

  if (dir.includes(dirName)) {
    const hashDir = fs.readdirSync(baseObjectsDir + "/" + dirName);
    const hashFile = hashDir.find((object) => object.startsWith(fileName));
    object = fs.readFileSync(baseObjectsDir + "/" + dirName + "/" + hashFile);
    unzippedObjectBuffer = zlib.inflateSync(object);
  }

  if (!object) {
    console.log("오류: 해당 오브젝트를 찾을 수 없습니다.");
    return;
  }

  if (
    unzippedObjectBuffer[0] === 0x74 &&
    unzippedObjectBuffer[1] === 0x72 &&
    unzippedObjectBuffer[2] === 0x65 &&
    unzippedObjectBuffer[3] === 0x65
  ) {
    let header = "";
    let offset = 0;
    const result = [];

    while (unzippedObjectBuffer[offset] !== 0) {
      header += String.fromCharCode(unzippedObjectBuffer[offset]);
      offset++;
    }

    offset++;

    while (offset < unzippedObjectBuffer.length) {
      let permission = "";
      let fileName = "";
      let hash = "";

      // 스페이스를 만나기 전까지
      while (unzippedObjectBuffer[offset] !== 0x20) {
        permission += String.fromCharCode(unzippedObjectBuffer[offset]);
        offset++;
      }

      offset++;

      while (unzippedObjectBuffer[offset] !== 0) {
        fileName += String.fromCharCode(unzippedObjectBuffer[offset]);
        offset++;
      }

      offset++;

      hash = unzippedObjectBuffer.slice(offset, offset + 20).toString("hex");

      offset += 20;

      result.push({ permission, fileName, hash });
    }

    console.log(header);
    console.table(result);
  } else {
    // blob | commit
    console.log(unzippedObjectBuffer.toString());
  }
}

/**
 * Writes tree with the index entries.
 */
function writeTree() {
  const currentIndex = getCurrentIndex();
  const tree = new Tree(hashObject);

  currentIndex.entries.forEach((entry) => {
    tree.addEntry(entry);
  });

  return tree.getHash();
}

module.exports = {
  initIndex,
  hashObject,
  updateIndex,
  printIndex,
  catFile,
  getCurrentIndex,
  writeTree,
};
