import Commit from "../types/Commit.js";

function commitTree(tree, username, email, commitMessage, parents = []) {
  const unixEpoch = Math.floor(Date.now() / 1000);
  const timezoneOffset = new Date().getTimezoneOffset();
  const offsetHours = String(
    Math.floor(Math.abs(timezoneOffset) / 60)
  ).padStart(2, "0");
  const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, "0");
  const offsetSign = timezoneOffset <= 0 ? "+" : "-";

  const commit = new Commit(
    tree,
    parents,
    `${username} <${email}> ${unixEpoch} ${offsetSign}${offsetHours}${offsetMinutes}`,
    `${username} <${email}> ${unixEpoch} ${offsetSign}${offsetHours}${offsetMinutes}`,
    commitMessage
  );

  return commit.getHash();
}

export { commitTree };
