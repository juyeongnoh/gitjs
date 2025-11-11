import { readdirSync, mkdirSync, writeFileSync } from "fs";
import { join } from "node:path";

/**
 * init()
 * Creates Git Skeleton structure
 * HEAD, index, objects/, refs/
 */
const init = () => {
  const gitDir = join(process.cwd(), ".git");

  // .git이 존재하지 않는 경우에만 initialize
  try {
    readdirSync(gitDir);
  } catch {
    const defaultRef = join("refs", "heads", "main");

    mkdirSync(gitDir);

    mkdirSync(join(gitDir, "objects"));
    mkdirSync(join(gitDir, "objects", "info"));
    mkdirSync(join(gitDir, "objects", "pack"));

    mkdirSync(join(gitDir, "refs"));
    mkdirSync(join(gitDir, "refs", "heads"));
    mkdirSync(join(gitDir, "refs", "tags"));

    writeFileSync(join(gitDir, "HEAD"), `ref: ${defaultRef}`);
  }
};

export { init };
