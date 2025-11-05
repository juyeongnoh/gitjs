import { readdirSync, mkdirSync, writeFileSync } from "fs";

/**
 * init()
 * Creates Git Skeleton structure
 * HEAD, index, objects/, refs/
 */
const init = () => {
  // .git이 존재하지 않는 경우에만 initialize
  try {
    readdirSync(".git");
  } catch {
    const HEAD = "ref: refs/heads/main";

    mkdirSync(".git");

    mkdirSync(".git/objects");
    mkdirSync(".git/objects/info");
    mkdirSync(".git/objects/pack");

    mkdirSync(".git/refs");
    mkdirSync(".git/refs/heads");
    mkdirSync(".git/refs/tags");

    writeFileSync(".git/HEAD", HEAD);
  }
};

export { init };
