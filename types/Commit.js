import { hashObject } from "../plumbings/hashObject.js";

class Commit {
  constructor(tree, parents, author, committer, message) {
    this.tree = tree;
    this.parents = parents;
    this.author = author;
    this.committer = committer;
    this.message = message;
  }

  getContent() {
    let content = `tree ${this.tree}\n`;
    this.parents.forEach((parent) => {
      content += `parent ${parent}\n`;
    });
    content += `author ${this.author}\n`;
    content += `committer ${this.committer}\n\n`;
    content += `${this.message}\n`;
    return content;
  }

  getHash() {
    const content = this.getContent();
    return hashObject(Buffer.from(content), "commit", "write");
  }
}

export default Commit;
