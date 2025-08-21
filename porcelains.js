// 고수준 (사용자 수준) 명령어
// porcelain: 자기(磁器)
// 자기처럼 매끈하고 사용하기 좋은 명령어 모음
const fs = require("fs");
const { hashObject, updateIndex, initIndex } = require("./plumbings");

/**
 * init()
 * Git의 핵심은 HEAD, index, objects/, refs/
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

    initIndex();
  }
};

/**
 *
 * @param  {string[]} files
 */
const add = (files) => {
  files.forEach((file) => {
    const fileString = fs.readFileSync(file).toString();
    const hash = hashObject(fileString);
    updateIndex(file, hash);
  });
};

module.exports = { init, add };
