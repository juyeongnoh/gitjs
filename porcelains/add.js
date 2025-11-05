import { readFileSync } from "fs";
import { hashObject } from "../plumbings/hashObject.js";
import { updateIndex } from "../plumbings/updateIndex.js";

/**
 * @param  {string[]} filePathnames
 */
const add = (filePathnames) => {
  filePathnames.forEach((filePathname) => {
    const file = readFileSync(filePathname);
    const sha = hashObject(file, "blob", "write");
    updateIndex(filePathname, sha);
  });
};

export { add };
