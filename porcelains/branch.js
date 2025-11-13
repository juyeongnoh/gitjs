import {
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import Commit from "../types/Commit.js";

const gitDir = join(process.cwd(), ".git");

function branch(flag, args) {
  const branchName = args[0];

  switch (flag) {
    case undefined:
      listBranches();
      break;
    // 브랜치 생성
    case "-c":
      createBranch(branchName);
      break;
    // 브랜치 이름 변경
    case "-m":
      const currentHead = readFileSync(join(gitDir, "HEAD")).toString().trim();
      let currentBranchName;
      if (currentHead.startsWith("ref:")) {
        currentBranchName = currentHead.split("/").pop();
      } else {
        console.log("오류: 현재 어떤 브랜치에도 속해 있지 않습니다.");
        return;
      }
      changeBranchName(currentBranchName, branchName);
      break;
    // 브랜치 삭제
    case "-d":
      if (!isValidBranchName(branchName)) {
        console.log("오류: 브랜치명을 찾을 수 없습니다.");
        return;
      }

      if (isCurrentBranch(branchName)) {
        console.log("오류: 현재 브랜치를 삭제할 수 없습니다.");
        return;
      }

      if (!checkBranchMerged(branchName)) {
        console.log("오류: 브랜치가 병합되지 않았습니다.");
        return;
      }

      deleteBranch(branchName);
      break;
    default:
      console.log(`오류: 알 수 없는 플래그 '${flag}' 입니다.`);
      return;
  }
}

function isValidBranchName(branchName) {
  const headsDir = join(gitDir, "refs", "heads");
  const branches = readdirSync(headsDir);

  return branches.includes(branchName);
}

function checkBranchMerged(branchName) {
  const branchHeadDir = join(gitDir, "refs", "heads", branchName);
  const branchHead = readFileSync(branchHeadDir).toString().trim();

  const headDir = join(gitDir, "HEAD");
  const head = readFileSync(headDir).toString().trim();
  let currentBranch;

  if (head.startsWith("ref:")) {
    currentBranch = head.split("/").pop();
  } else {
    return true;
  }

  const currentBranchHeadDir = join(gitDir, "refs", "heads", currentBranch);
  const currentBranchHead = readFileSync(currentBranchHeadDir)
    .toString()
    .trim();

  const currentBranchHeadObjectDir = join(
    gitDir,
    "objects",
    currentBranchHead.slice(0, 2),
    currentBranchHead.slice(2)
  );

  const currentCommit = Commit.fromObject(
    readFileSync(currentBranchHeadObjectDir)
  );

  if (traverseCommits(currentBranchHead, branchHead)) {
    return true;
  }

  return false;
}

function traverseCommits(commitHash, targetHash, visited = new Set()) {
  if (commitHash === targetHash) {
    return true;
  }

  if (visited.has(commitHash)) {
    return false;
  }

  visited.add(commitHash);

  const commitObjectDir = join(
    gitDir,
    "objects",
    commitHash.slice(0, 2),
    commitHash.slice(2)
  );

  const commit = Commit.fromObject(readFileSync(commitObjectDir));
  for (const parentHash of commit.parents) {
    if (traverseCommits(parentHash, targetHash, visited)) {
      return true;
    }
  }

  return false;
}

function listBranches() {
  const headsDir = join(gitDir, "refs", "heads");
  const branches = readdirSync(headsDir);

  branches.forEach((branch) => {
    const headContent = readFileSync(join(gitDir, "HEAD")).toString().trim();
    let currentBranchName;
    if (headContent.startsWith("ref:")) {
      currentBranchName = headContent.split("/").pop();
    }

    if (branch === currentBranchName) {
      console.log(`* ${branch}`);
    } else {
      console.log(`  ${branch}`);
    }
  });
}

function isCurrentBranch(branchName) {
  const currentHead = readFileSync(join(gitDir, "HEAD")).toString().trim();

  let currentBranchName;

  if (currentHead.startsWith("ref:")) {
    currentBranchName = currentHead.split("/").pop();
  }

  if (branchName === currentBranchName) {
    return true;
  }

  return false;
}

function deleteBranch(branchName) {
  try {
    rmSync(join(gitDir, `refs/heads/${branchName}`));
  } catch {
    console.log("오류: 브랜치를 삭제할 수 없습니다.");
  }
}

function changeBranchName(oldName, newName) {
  try {
    renameSync(
      join(gitDir, `refs/heads/${oldName}`),
      join(gitDir, `refs/heads/${newName}`)
    );
  } catch {
    console.log("오류: 브랜치 이름을 변경할 수 없습니다.");
  }

  try {
    const headContent = readFileSync(join(gitDir, "HEAD")).toString();
    if (headContent === `ref: refs/heads/${oldName}`) {
      writeFileSync(join(gitDir, "HEAD"), `ref: refs/heads/${newName}`);
    }
  } catch {
    console.log("오류: HEAD 참조를 업데이트할 수 없습니다.");
  }
}

function createBranch(branchName) {
  let currentCommit;
  const isDuplicate = (() => {
    try {
      readFileSync(join(gitDir, `refs/heads/${branchName}`));
      return true;
    } catch {
      return false;
    }
  })();

  if (isDuplicate) {
    console.log(`오류: '${branchName}' 이름의 브랜치가 이미 존재합니다.`);
    return;
  }

  try {
    writeFileSync(join(gitDir, `refs/heads/${branchName}`), "");
  } catch {
    console.log("오류: 브랜치를 생성할 수 없습니다.");
    return;
  }

  const isCurrentHeadSymbolic = readFileSync(join(gitDir, "HEAD"))
    .toString()
    .startsWith("ref:");

  if (isCurrentHeadSymbolic) {
    const currentRef = readFileSync(join(gitDir, "HEAD"))
      .toString()
      .split(" ")[1]
      .trim();
    currentCommit = readFileSync(join(gitDir, currentRef)).toString().trim();
  } else {
    currentCommit = readFileSync(join(gitDir, "HEAD")).toString().trim();
  }

  try {
    writeFileSync(join(gitDir, `refs/heads/${branchName}`), currentCommit);
  } catch {
    console.log("오류: 브랜치 포인터를 설정할 수 없습니다.");
  }
}

export { branch };
