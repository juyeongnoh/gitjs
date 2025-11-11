import { join } from "path";
import { readFileSync, writeFileSync } from "fs";
import { commitTree } from "../plumbings/commitTree.js";
import { writeTree } from "../plumbings/writeTree.js";

function commit(commitMessage, username, email) {
  const tree = writeTree();

  // 현재 HEAD가 가리키는 커밋을 부모로 추가
  const parents = [];
  const gitDir = join(process.cwd(), ".git");
  const headPath = join(gitDir, "HEAD");

  // head가 ref인지 직접 커밋 해시인지 확인
  const ref = (() => {
    const headContent = readFileSync(headPath).toString().trim();
    if (headContent.startsWith("ref: ")) {
      return headContent.slice(5);
    }
    return null;
  })();

  // 실제로 존재하는지 찾아야 함
  if (ref) {
    const refPath = join(gitDir, ref);
    let parentCommit;
    try {
      // 존재한다면 부모 커밋으로 추가
      parentCommit = readFileSync(refPath).toString().trim();
      parents.push(parentCommit);
    } catch {
      // 존재하지 않는다면 새로운 main 파일 생성
      writeFileSync(refPath, "");
    }
  } else {
    // 직접 커밋 해시인 경우
    const headContent = readFileSync(headPath).toString().trim();
    if (headContent) {
      parents.push(headContent);
    }
  }

  const commit = commitTree(tree, username, email, commitMessage, parents);

  // HEAD 업데이트
  if (ref) {
    const refPath = join(gitDir, ref);
    writeFileSync(refPath, commit + "\n");
  } else {
    writeFileSync(headPath, commit + "\n");
  }

  return commit;
}

export { commit };
