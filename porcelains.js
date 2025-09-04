// 고수준 (사용자 수준) 명령어
// porcelain: 자기(磁器)
// 자기처럼 매끈하고 사용하기 좋은 명령어 모음
const fs = require("fs");
const { hashObject, updateIndex } = require("./plumbings");

/**
 * init()
 * Creates Git Skeleton structure
 * HEAD, index, objects/, refs/
 */
const init = () => {
  // .git이 존재하지 않는 경우에만 initialize
  try {
    fs.readdirSync(".git");
  } catch {
    const HEAD = "ref: refs/heads/main";

    fs.mkdirSync(".git");

    fs.mkdirSync(".git/objects");
    fs.mkdirSync(".git/objects/info");
    fs.mkdirSync(".git/objects/pack");

    fs.mkdirSync(".git/refs");
    fs.mkdirSync(".git/refs/heads");
    fs.mkdirSync(".git/refs/tags");

    fs.writeFileSync(".git/HEAD", HEAD);
  }
};

/**
 * @param  {string[]} filePathnames
 */
const add = (filePathnames) => {
  filePathnames.forEach((filePathname) => {
    const file = fs.readFileSync(filePathname);
    const hash = hashObject(file, "blob", "write");
    updateIndex(filePathname, hash);
  });
};

module.exports = { init, add };
