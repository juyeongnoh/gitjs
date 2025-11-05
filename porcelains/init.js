const fs = require("fs");

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

module.exports = { init };
