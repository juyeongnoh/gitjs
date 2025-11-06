import { join } from "path";
import { writeFileSync } from "fs";
import { commitTree } from "../plumbings/commitTree.js";
import { writeTree } from "../plumbings/writeTree.js";

function commit(commitMessage, username, email, parents = []) {
  const tree = writeTree();
  const commit = commitTree(tree, username, email, commitMessage, parents);

  // set HEAD to the new commit
  const gitDir = join(process.cwd(), ".git");
  writeFileSync(join(gitDir, "HEAD"), commit);

  console.log(`Committed as ${commit}`);

  return commit;
}

export { commit };
