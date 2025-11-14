# gitjs

한국어 | [English](https://github.com/juyeongnoh/gitjs/blob/main/README-en.md)

## 🎯 프로젝트 목표

Node.js의 fs 모듈과 Buffer를 활용하여, Git의 내부 동작 원리를 바닥부터 직접 구현해보며 학습

## 🏃 실행하기

```bash
$ git clone https://github.com/juyeongnoh/gitjs
$ cd gitjs
$ touch test.txt
$ node index

init                   // git 저장소 초기화
add test.txt           // test1.txt 스테이징
print-index            // 현재 스테이징 영역 상태 조회
commit my first commit // "my first commit"이라는 커밋 생성
cat-file <hash>        // git object 열람
branch -c my-branch    // my-branch 생성
branch -d my-branch    // my-branch 삭제
```

## 💻 구현 내용

### Porcelains (git 명령어)

- init 명령어 ([/porcelains/init.js](https://github.com/juyeongnoh/gitjs/blob/main/porcelains/init.js))
  - git 저장소의 기본 조건 (`/objects`, `/refs`, `HEAD`, `index`) 생성
- add 명령어 ([/porcelains/add.js](https://github.com/juyeongnoh/gitjs/blob/main/porcelains/add.js))
  - 파일 추가 시 blob 오브젝트 생성
  - 스테이징 영역(Index)에 파일 이름 순서대로 추가
- commit 명령어 ([/porcelains/commit.js](https://github.com/juyeongnoh/gitjs/blob/main/porcelains/commit.js))
  - 스테이징 영역에 저장된 파일을 기반으로 tree 오브젝트 생성
  - 현재 HEAD를 참조하여 부모 커밋 해시 판별
  - 생성된 tree 오브젝트로 새로운 commit 오브젝트 생성
  - `.git/refs/heads` 업데이트 로직
- branch 명령어 ([/porcelains/branch.js](https://github.com/juyeongnoh/gitjs/blob/main/porcelains/branch.js))
  - 브랜치 조회
    - `.git/refs/heads/`에 저장되어 있는 파일 목록을 리스트 형식으로 출력
    - 현재 브랜치는 브랜치명 앞에 `*` 표시
  - 브랜치 생성
    - `.git/refs/heads/{브랜치명}` 파일 추가
    - 현재 브랜치의 HEAD (마지막 커밋 해시) 복사하여 저장
  - 브랜치명 변경
    - `.git/refs/heads/{브랜치명}` 이름 변경
    - 현재 HEAD가 심볼릭 참조가 아닌 일반 커밋인 경우 실행하지 않음
  - 브랜치 삭제
    - 현재 브랜치의 조상 커밋을 재귀적으로 탐색하며 삭제하려는 브랜치의 커밋이 포함되어 있는지 확인 (삭제하려는 브랜치가 병합되었는지 확인하는 과정)
    - `.git/refs/heads/{브랜치명}` 삭제

### Plumbings (내부 로직)

- git object 생성 함수 ([/plumbings/hashObject.js](https://github.com/juyeongnoh/gitjs/blob/main/plumbings/hashObject.js))
  - 파일의 byteLength 값 계산하여 헤더 추가
  - zlib 압축 및 SHA 해시 생성

### 자료구조

- Entry 클래스 ([/types/Entry.js](https://github.com/juyeongnoh/gitjs/blob/main/types/Entry.js))
  - File Stats 데이터를 기반으로 스테이징 영역에 기록할 파일 엔트리 생성
  - ctime, mtime의 나노초 정밀도 기록 보장
  - Buffer로 변환 기능
- Index 클래스 ([/types/Index.js](https://github.com/juyeongnoh/gitjs/blob/main/types/Index.js))
  - Index 버전 2를 기준으로 구현
  - Entry 추가 기능
  - SHA 체크섬 연산 기능
  - Buffer로 변환 기능
- Tree 오브젝트 클래스 ([/types/Tree.js](https://github.com/juyeongnoh/gitjs/blob/main/types/Tree.js))
  - Index Entry 추가 시 재귀적으로 JS Object 기반 디렉토리 구조 생성
  - Buffer로 변환 기능
- Commit 오브젝트 클래스 ([/types/Commit.js](https://github.com/juyeongnoh/gitjs/blob/main/types/Commit.js))
  - Buffer로 변환 기능

## 📚 배운 점

### SHA 해시 기반 파일 관리의 이점

- test.txt라는 파일을 만들고 아래와 같은 파일을 저장한다고 가정하면

  ```
  Hello world!
  ```

- git 저장소에 아래와 같이 저장된다.

  | Key    | Value        |
  | ------ | ------------ |
  | 7a6dce | Hello world! |

- 하지만 한글자라도 수정하게 된다면

  ```
  Hello world~
  ```

- 눈사태 효과에 의해 해시값이 크게 바뀌어 기존 데이터와 별도로 저장되게 된다.

  | Key    | Value        |
  | ------ | ------------ |
  | 7a6dce | Hello world! |
  | 2b785f | Hello world~ |

- git에서는 파일(blob), 디렉토리(tree), 커밋(commit)을 모두 SHA 해시하여 관리한다.
  ```mermaid
  graph LR
    Commit["Commit[ab78e]: my-commit"] -->|tree| Tree1["Tree[d4fe5]: /"]
    Tree1 -->|tree| Tree2["Tree[8cea1]: src"]
    Tree2 -->|blob| Blob1["Blob[b4d1a]: main.js"]
    Tree1 -->|blob| Blob2["Blob[118ce]: README.md"]
  ```
- 이 방식의 이점은 이전의 연산한 값을 그대로 사용할 수 있다는 의미이다.
- 텍스트 파일을 수정하여 다시 "Hello world!"로 돌아가더라도 이미 이전에 연산한 해시가 존재하기 때문에 중복저장하지 않는다.
- 그렇기 때문에 저장소를 비교적 가볍게 관리할 수 있다.

### git에 `.env`처럼 민감한 파일을 저장하면 안되는 이유

- `git add 파일명`을 터미널에 입력하는 순간 파일이 압축되어 `.git/objects/`에 저장된다.
- add 작업을 취소한다고 하더라도 한번 저장된 파일이 삭제되지 않는다.
- 추후 Garbage Collection에 의해 자동 삭제될 여지가 있지만 해시값이 어딘가에서 참조되고 있다면 영구적으로 박제되는 것이나 다름없다.
- 그러니 민감한 자료는 절대 git에 저장하면 안된다. (원격 저장소에 push 하는 경우)

### git이 파일을 다루는 방식

- git 저장소는 SHA를 키 값으로 갖는 Key-Value 자료구조이다.
- 그 Key들을 포인터로 연결하여 우리가 알고 있는 그래프를 만든다.
- 새로운 커밋을 만들 때, 이전 커밋에 현재 커밋 해시를 자녀 노드로 추가하는 것이 아닌, 이전 커밋 해시를 현재 커밋에 부모 노드로 등록한다.

### git의 최적화

- `git status`를 입력하면 작업 영역에 있는 파일과 git에 저장된 파일의 차이를 눈깜짝할 사이에 보여준다.
- 이것은 git이 파일의 내용을 직접 비교하지 않기 때문에 가능한 일이다. (굉장히 비싼 연산이다)
- 스테이징 영역(Index)에 파일을 기록할 때 파일의 마지막 수정 시각인 mtime을 나노초 단위까지 기록하는데, 이 값을 현재 파일의 Stats과 대조하기 때문에 굳이 비싼 연산을 할 필요가 없다.

### .git/objects 디렉토리 안에 바로 오브젝트를 저장하지 않는 이유

- .git에서 관리되는 모든 오브젝트들은 40자 길이의 SHA 해시값으로 저장된다.
- 하지만,
  - `.git/objects/0b8f46cff781c078336473ad3ec6fe275ad6e596` 처럼 바로 저장되지 않고
  - `.git/objects/0b/8f46cff781c078336473ad3ec6fe275ad6e596` 처럼 2자, 38자 끊어서 저장된다.
- 이는 구형 파일 시스템과의 호환성을 위해 설계된 것이다.
- FAT32 파일 시스템에서는 한 폴더 안에 파일 개수가 2^14(16,384)개로 제한된다.
- 그렇기 때문에, 해시를 2자, 38자로 끊어서 저장하면 최대 4,177,920개의 오브젝트까지 저장할 수 있게 된다.
- (2자로 표현할 수 있는 16진수 범위(00 ~ FF => 255) \* 2^14 = 4,177,920)

## ✨ 간편한 디버깅을 위한 vscode 익스텐션 구현

- git object는 zlib으로 압축된 데이터이기 때문에 내용을 열람하려면 아래 명령어를 입력해야한다.
  - `git cat-file -p 020a23`
- 하지만 해시값을 일일이 입력해가며 열람하다 보니 개발 생산성이 떨어지는 문제가 있었다.
- 직접 만든 오브젝트의 내용을 실제 git과 비교하고 싶은데, 이러한 점 때문에 구현에 많은 시간이 들었다.
- 그래서 git object를 만드는 로직을 AI에게 넘겨주어 vscode 상에서 바로 읽을 수 있는 익스텐션을 만들어서 작업했다.
  ![git-object-vscode-extension](https://github.com/user-attachments/assets/2eab2d44-81d5-478b-8b35-e01323ddb62a)

## ⚒️ 어려웠던 점

### Buffer 자료구조를 통한 비트 단위 데이터 관리

- Index 파일처럼 순수 바이너리 데이터를 처음 핸들링해봐서 어려웠다.
- 특히, 각 엔트리의 mode 필드처럼 비트 단위의 값이 포함된 경우 쉬프트 연산자를 이용해 밀고, 값을 끼워넣고 하는 작업이 까다로웠다.
  ```js
  // types/Entry.js
  // 4바이트 안에서 4비트는 오브젝트 타입, 3비트는 공백, 9비트는 유닉스 권한 영역으로 할당된다.
  const modeBuffer = Buffer.alloc(4);
  let entryTypeAndUnused;
  if (this.entryType === "REGULAR_FILE") {
    entryTypeAndUnused = 0b1000;
  } else if (this.entryType === "SYMLINK") {
    entryTypeAndUnused = 0b1010;
  } else if (this.entryType === "GITLINK") {
    entryTypeAndUnused = 0b1110;
  }
  entryTypeAndUnused = entryTypeAndUnused << 12;
  modeBuffer.writeUInt32BE(entryTypeAndUnused | this.filePermission);
  ```

## ❌ 한계 및 미구현

- 성능 최적화(commit-graph 등)는 고려되지 않음.
- Merge, Reset, GC, 원격 저장소 대응 등 복잡한 기능은 구현되지 않음.
