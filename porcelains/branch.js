import {
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const gitDir = join(process.cwd(), ".git");

function branch(flag, args) {
  switch (flag) {
    case undefined:
      listBranches();
      break;
    // 브랜치 생성
    case "-c":
      const branchName = args[0];
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
      const newBranchName = args[0];
      changeBranchName(currentBranchName, newBranchName);
      break;
    // 브랜치 삭제
    case "-d":
      // 삭제 전 확인 로직
      const delBranchName = args[0];
      deleteBranch(delBranchName);
      break;
    default:
      console.log(`오류: 알 수 없는 플래그 '${flag}' 입니다.`);
      return;
  }
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

/**
 * @todo unmerge된 커밋이 있는지 확인하는 로직 추가하기
 */
function deleteBranch(branchName) {
  const currentHead = readFileSync(join(gitDir, "HEAD")).toString().trim();

  let currentBranchName;
  if (currentHead.startsWith("ref:")) {
    currentBranchName = currentHead.split("/").pop();
  }

  if (branchName === currentBranchName) {
    console.log(
      `오류: 현재 '${branchName}' 브랜치에 있습니다. 해당 브랜치를 삭제할 수 없습니다.`
    );
    return;
  }

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
