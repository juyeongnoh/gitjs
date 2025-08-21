// 저수준 명령어
// plumbing: 배관[수도 시설]
// 배관처럼 일반인이 쉽게 만지기 어려운 명령어 모음

const crypto = require("crypto");
const zlib = require("zlib");
const fs = require("fs");
const { Index, Entry } = require("./types");

function initIndex() {
  const index = new Index();
  index.setSignature("DIRC");
  index.setVersion(2);
  index.entryCount = 0;

  const header = index.getHeaderBuffer();
  const checksum = crypto.createHash("sha1").update(header).digest();

  const final = Buffer.concat([header, checksum]);
  fs.writeFileSync(".git/index", final);
}

function hashObject(string, type = "blob") {
  if (
    type !== "blob" &&
    type !== "commit" &&
    type !== "tree" &&
    type !== "tag"
  ) {
    throw new Error("Invalid type");
  }

  const bytes = string.length;
  const header = `${type} ${bytes}\0`;

  const hash = crypto
    .createHash("SHA1")
    .update(header + string)
    .digest("hex");

  // 저장 (-w 플래그가 주어졌다고 가정)
  const dirName = hash.slice(0, 2);
  const fileName = hash.slice(2);
  const compressed = zlib.deflateSync(Buffer.from(header + string));

  if (!fs.existsSync(`.git/objects/${dirName}`)) {
    fs.mkdirSync(`.git/objects/${dirName}`, { recursive: true });
  }

  fs.writeFileSync(`.git/objects/${dirName}/${fileName}`, compressed);

  return hash;
}

function updateIndex(filePath) {
  console.log(`updateIndex called for: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath);
  const hash = hashObject(fileContent, "blob");

  // 현재 index 읽기
  const currentIndex = getCurrentIndex();
  console.log(`Current index has ${currentIndex.entryCount} entries`);

  // 기존 엔트리들 출력
  console.log("Current entries:");
  currentIndex.entries.forEach((entry, i) => {
    console.log(
      `  ${i}: ${entry.entryPathname} (${entry.objectName.slice(0, 8)})`
    );
  });

  // 새 entry 생성 및 추가
  const entry = Entry.fromFile(filePath, hash);
  console.log(
    `Creating entry for: ${entry.entryPathname} (${entry.objectName.slice(
      0,
      8
    )})`
  );
  currentIndex.addEntry(entry);
  console.log(`After adding, index has ${currentIndex.entryCount} entries`);

  // index 파일 업데이트
  writeIndex(currentIndex);
}

function getCurrentIndex() {
  // index 파일이 없으면 새로운 빈 index 반환
  if (!fs.existsSync(".git/index")) {
    const index = new Index();
    index.setSignature("DIRC");
    index.setVersion(2);
    return index;
  }

  const indexFile = fs.readFileSync(".git/index");
  const index = new Index();

  let off = 0;

  // 헤더 파싱
  const signature = indexFile.toString("utf8", off, off + 4);
  off += 4; // 'DIRC'
  const version = indexFile.readUInt32BE(off);
  off += 4;
  const entryCount = indexFile.readUInt32BE(off);
  off += 4;

  index.setSignature(signature);
  index.setVersion(version);

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
    off += 2;

    // 파일명 길이는 flags의 하위 12비트
    const nameLength = flags & 0xfff;

    // 파일명 읽기
    if (off + nameLength > indexFile.length) break;
    const name = indexFile.toString("utf8", off, off + nameLength);
    off += nameLength;

    // null terminator 건너뛰기
    if (off < indexFile.length && indexFile[off] === 0) {
      off++;
    }

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
      mode,
      uid,
      gid,
      fileSize,
      objectName: sha.toString("hex"),
      flags,
      extendedFlags: 0,
      entryPathname: name,
    });

    index.addEntry(entry);
  }

  return index;
}

function writeIndex(index) {
  const entryBuffers = index.entries.map((entry) => entry.getBuffer());
  const entriesBuffer = Buffer.concat(entryBuffers);

  // 헤더 + 엔트리들
  const header = index.getHeaderBuffer();
  const content = Buffer.concat([header, entriesBuffer]);

  // 체크섬 계산
  const checksum = crypto.createHash("sha1").update(content).digest();

  // 최종 파일 생성
  const final = Buffer.concat([content, checksum]);
  fs.writeFileSync(".git/index", final);
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
  catFile,
  readEntriesFromIndex: getCurrentIndex,
};
