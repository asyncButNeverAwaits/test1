const fs = require("fs");
const https = require("https");
const { execSync } = require("child_process");

// URL to fetch
const URL = Buffer.from("aHR0cHM6Ly9uZnMuZmFpcmVjb25vbXkubWVkaWEvZmZfY2FsZW5kYXJfdGhpc3dlZWsuanNvbg==", 'base64').toString('utf8');

https.get(URL, res => {
  let data = "";

  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    try {
      const json = JSON.parse(data);

      // Build time-based folder path
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, "0");
      const day = String(now.getUTCDate()).padStart(2, "0");

      const dirPath = `${year}/${month}/${day}`;
      const filePath = `${dirPath}/data.json`;

      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
    } catch (err) {
      console.error("❌ Error parsing JSON:", err.message);
    }
  });
}).on("error", err => {
  console.error("❌ HTTPS request failed:", err.message);
});
