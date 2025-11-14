# gitjs

## 🎯 Project Goal

To learn the internal workings of Git by implementing them from scratch using Node.js's fs module and Buffer.

## 🏃 How to Run

```Bash
$ git clone https://github.com/juyeongnoh/gitjs
$ cd gitjs
$ touch test.txt
$ node index

init                   // Initialize git repository
add test.txt           // Stage test.txt
print-index            // Check the current state of the staging area
commit my first commit // Create a commit with the message "my first commit"
cat-file <hash>        // View a git object
branch -c my-branch    // Create my-branch
branch -d my-branch    // Delete my-branch
```

## 💻 Implemented Features

### Porcelains (The Git Commands)

- init command ([/porcelains/init.js](https://github.com/juyeongnoh/gitjs/blob/main/porcelains/init.js))
  - Creates the basic git repository structure (`/objects`, `/refs`, `HEAD`, `index`)
- add command ([/porcelains/add.js](https://github.com/juyeongnoh/gitjs/blob/main/porcelains/add.js))
  - Creates a blob object when a file is added
  - Adds the file to the staging area (Index) in alphabetical order
- commit command ([/porcelains/commit.js](https://github.com/juyeongnoh/gitjs/blob/main/porcelains/commit.js))
  - Creates a tree object based on the files in the staging area
  - Determines the parent commit hash by referencing the current HEAD
  - Creates a new commit object from the generated tree object
  - Logic to update `.git/refs/heads`
- branch command ([/porcelains/branch.js](https://github.com/juyeongnoh/gitjs/blob/main/porcelains/branch.js))
  - List branches
    - Outputs a list of files stored in `.git/refs/heads/`
    - The current branch is marked with a `*`
  - Create branch
    - Adds a `.git/refs/heads/{branch-name}` file
    - Copies and stores the HEAD of the current branch (the last commit hash)
  - Rename branch
    - Renames the `.git/refs/heads/{branch-name}` file
    - Does not execute if the current HEAD is a regular commit (detached) instead of a symbolic ref
  - Delete branch
    - Recursively traverses the ancestors of the current branch to check if the commit of the branch to be deleted is included (this is the process of checking if the branch has been merged)
    - Deletes `.git/refs/heads/{branch-name}`

### Plumbings (Internal Logic)

- Function to create git objects ([/plumbings/hashObject.js](https://github.com/juyeongnoh/gitjs/blob/main/plumbings/hashObject.js))
  - Calculates the file's byteLength and adds a header
  - Performs zlib compression and generates a SHA hash

### Data Structures

- Entry Class ([/types/Entry.js](https://github.com/juyeongnoh/gitjs/blob/main/types/Entry.js))
  - Creates a file entry to be recorded in the staging area based on File Stats data
  - Ensures nanosecond precision is recorded for ctime and mtime
  - Function to convert to Buffer
- Index Class ([/types/Index.js](https://github.com/juyeongnoh/gitjs/blob/main/types/Index.js))
  - Implemented based on Index version 2
  - Function to add an Entry
  - Function to calculate SHA checksum
  - Function to convert to Buffer
- Tree Object Class ([/types/Tree.js](https://github.com/juyeongnoh/gitjs/blob/main/types/Tree.js))
  - Recursively creates a JS Object-based directory structure when adding Index Entries
  - Function to convert to Buffer
- Commit Object Class ([/types/Commit.js](https://github.com/juyeongnoh/gitjs/blob/main/types/Commit.js))
  - Function to convert to Buffer

## 📚 Lesson Learned

### Advantages of SHA Hash-Based File Management

- If we assume we create a file named test.txt and save the following content:
  ```
  Hello world!
  ```
- It is saved in the git repository as follows:

  | Key    | Value        |
  | ------ | ------------ |
  | 7a6dce | Hello world! |

- But if even one character is modified:

  ```
  Hello world~
  ```

- Due to the avalanche effect, the hash value changes completely, and it is saved separately from the original data.

  | Key    | Value        |
  | ------ | ------------ |
  | 7a6dce | Hello world! |
  | 2b785f | Hello world~ |

- Git manages files (blob), directories (tree), and commits (commit) all by hashing them with SHA.

  ```mermaid
  graph LR
  Commit["Commit[ab78e]: my-commit"] -->|tree| Tree1["Tree[d4fe5]: /"]
  Tree1 -->|tree| Tree2["Tree[8cea1]: src"]
  Tree2 -->|blob| Blob1["Blob[b4d1a]: main.js"]
  Tree1 -->|blob| Blob2["Blob[118ce]: README.md"]
  ```

- The advantage of this method is that previously calculated values can be reused.

- Even if you modify the text file and then change it back to "Hello world!", it won't be saved duplicatedly because the previously calculated hash already exists.

- This allows the repository to be managed relatively lightly.

### Why you shouldn't save sensitive files like `.env` in Git

- The moment you type `git add <filename>` in the terminal, the file is compressed and saved in `.git/objects/`.

- Even if you undo the add operation, the file that was saved once is not deleted.

- Although it might be deleted later by Garbage Collection, if the hash value is referenced somewhere, it's as good as being permanently imprinted.

- Therefore, never save sensitive data in Git (especially when pushing to a remote repository).

### How Git Handles Files

- A git repository is a Key-Value data structure where the SHA hash is the key.

- It connects those keys with pointers to create the graph we are familiar with.

- When creating a new commit, it doesn't add the current commit hash as a child node to the previous commit; instead, it registers the previous commit's hash as a parent node in the current commit.

### Git's Optimization

- When you type `git status`, it shows the difference between the files in the working directory and the files saved in git in the blink of an eye.

- This is possible because git does not directly compare the file contents (which is a very expensive operation).

- When recording a file in the staging area (Index), it records the file's last modification time (mtime) down to the nanosecond. It compares this value with the current file's Stats, so there is no need to perform the expensive content comparison.

### Why objects aren't stored directly in the .git/objects directory

- All objects managed in .git are saved with a 40-character SHA hash value.

  - However, it's not saved directly like: `.git/objects/0b8f46cff781c078336473ad3ec6fe275ad6e596`

  - Instead, it's saved by splitting it into 2 characters and 38 characters:`.git/objects/0b/8f46cff781c078336473ad3ec6fe275ad6e596`

- This is designed for compatibility with older file systems.

- In the FAT32 file system, the number of files in a single folder is limited to 2^14 (16,384).

- Therefore, by splitting the hash into 2 and 38 characters, up to 4,177,920 objects can be stored.

- (Range of hex representable by 2 chars (00 ~ FF => 255) \* 2^14 = 4,177,920)

## ✨ Implemented a VSCode Extension for Easy Debugging

- A git object is zlib-compressed data, so to view its contents, you must enter the command:

  - `git cat-file -p 020a23`

- However, I found that entering hash values one by one to view them was hurting development productivity.

- I wanted to compare the contents of the objects I made with actual git, but this process took a lot of time.

- So, I created an extension that can read them directly in VSCode to improve my workflow. (I handed over the logic for decompressing git objects to an AI).
  ![git-object-vscode-extension](https://github.com/user-attachments/assets/2eab2d44-81d5-478b-8b35-e01323ddb62a)

## ⚒️ Difficulties Encountered

### Managing Bit-Level Data with the Buffer Data Structure

- It was difficult as it was my first time handling pure binary data like the Index file.

- In particular, for cases involving bit-level values like the mode field of each entry, tasks like shifting with bitwise operators and inserting values were tricky.

  ```js
  // types/Entry.js
  // Within 4 bytes, 4 bits are allocated for the object type, 3 bits are unused,
  // and 9 bits are for Unix permissions.
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

## ❌ Limitations and Not Implemented

- Performance optimizations (like commit-graph) are not considered.
- Complex features like Merge, Reset, GC, and remote repository operations are not implemented.
