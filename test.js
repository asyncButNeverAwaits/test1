const fs = require("fs");
const https = require("https");
const { execSync } = require("child_process");

const URL = Buffer.from(
  "aHR0cHM6Ly9uZnMuZmFpcmVjb25vbXkubWVkaWEvZmZfY2FsZW5kYXJfdGhpc3dlZWsuanNvbg==",
  "base64"
).toString("utf8");

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
        fs.writeFileSync(filePath, JSON.stringify(json));

        try {
          execSync('git config user.name "github-actions[bot]"');
          execSync(
            'git config user.email "github-actions[bot]@users.noreply.github.com"'
          );
          execSync("git add -A");
          execSync('git commit -m "."', { stdio: "ignore" });
          execSync("git push", { stdio: "ignore" });
        } catch (err) {
          if (!err.message.includes("nothing to commit")) process.exit(1);
        }
      } catch {
        process.exit(1);
      }
    });
  })
  .on("error", () => process.exit(1));
