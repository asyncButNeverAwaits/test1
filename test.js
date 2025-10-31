const fs = require("fs");
const https = require("https");
const { execSync } = require("child_process");

const URL = Buffer.from(
  "aHR0cHM6Ly9uZnMuZmFpcmVjb25vbXkubWVkaWEvZmZfY2FsZW5kYXJfdGhpc3dlZWsuanNvbg==",
  "base64"
).toString("utf8");

function writeLastUpdate(success) {
  const timestamp = Date.now();
  const status = success ? "success" : "failed";
  fs.writeFileSync("last_update.txt", `${timestamp} ${status}\n`);
}

function gitCommitAndPush(message = "⸻") {
  try {
    execSync('git config user.name "." && git config user.email "."');
    execSync("git add -A");
    execSync("git add -f last_update.txt");
    execSync(`git commit -m "${message}"`, { stdio: "pipe" });
    execSync("git push", { stdio: "pipe" });
  } catch (err) {
    const out = err.stdout?.toString() || "";
    const errOut = err.stderr?.toString() || "";
    if (out.includes("nothing to commit") || errOut.includes("nothing to commit")) {
      console.log("No changes to commit.");
    } else {
      console.error("Git push failed:", errOut || out);
    }
  }
}

function handleFailure(msg, err) {
  console.error(msg, err?.message || err);
  writeLastUpdate(false);
  gitCommitAndPush("update last_update.txt (failed)");
  process.exit(1);
}

https
  .get(URL, (res) => {
    let data = "";

    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        const json = JSON.parse(data);

        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, "0");
        const day = String(now.getUTCDate()).padStart(2, "0");

        const dirPath = `${year}/${month}/${day}`;
        const filePath = `${dirPath}/data.json`;

        fs.mkdirSync(dirPath, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2));

        writeLastUpdate(true);
        gitCommitAndPush("⸻");
      } catch (err) {
        handleFailure("JSON or file error:", err);
      }
    });
  })
  .on("error", (err) => handleFailure("HTTPS request error:", err));
