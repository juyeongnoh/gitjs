const fs = require("fs");

/**
 * @param {string} hash
 * @returns {void}
 */
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

module.exports = { catFile };
