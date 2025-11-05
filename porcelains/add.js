const hashObject = require("../plumbings/hashObject");
const updateIndex = require("../plumbings/updateIndex");

/**
 * @param  {string[]} filePathnames
 */
const add = (filePathnames) => {
  filePathnames.forEach((filePathname) => {
    const file = fs.readFileSync(filePathname);
    const sha = hashObject(file, "blob", "write");
    updateIndex(filePathname, sha);
  });
};

module.exports = { add };
