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
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2));

        try {
          execSync('git config user.name . && git config user.email .');
          execSync("git add -A");
          execSync('git commit -m "."', { stdio: "pipe" });
          execSync("git push", { stdio: "pipe" });
        } catch (err) {
          const output = err.stdout?.toString() || "";
          const errorOut = err.stderr?.toString() || "";
          if (output.includes("nothing to commit") || errorOut.includes("nothing to commit")) {
            console.log("No changes to commit.");
          } else {
            console.error("Git commit/push failed:");
            if (output) console.error("stdout:", output.trim());
            if (errorOut) console.error("stderr:", errorOut.trim());
            process.exit(1);
          }
        }
      } catch (err) {
        console.error("JSON or file error:", err.message);
        process.exit(1);
      }
    });
  })
  .on("error", (err) => {
    console.error("HTTPS request error:", err.message);
    process.exit(1);
  });
