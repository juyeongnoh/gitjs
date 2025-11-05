import { existsSync, readFileSync } from "fs";
import Index from "../types/Index.js";
import Entry from "../types/Entry.js";
import { initIndex } from "./initIndex.js";

function getCurrentIndex() {
  // index 파일이 없으면 새로운 빈 index 반환
  if (!existsSync(".git/index")) {
    initIndex();
  }

  const indexFile = readFileSync(".git/index");
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

export { getCurrentIndex };
