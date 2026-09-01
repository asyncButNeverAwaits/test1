export default {
  async scheduled(event, env, ctx) {
    const API_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
    const REPO = "asyncButNeverAwaits/test1";
    const BASE = `https://api.github.com/repos/${REPO}`;
    const headers = {
      Authorization: `token ${env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "cf-worker",
    };

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const dirPath = `${year}/${month}/${day}`;

    try {
      // === 1. Fetch source data ===
      const data = await fetch(API_URL).then(r => r.json());
      const jsonData = JSON.stringify(data, null, 2);
      const lastUpdate = `${Date.now()} success\n`;

      // === 2. Get latest commit SHA (HEAD of main) ===
      const refRes = await fetch(`${BASE}/git/ref/heads/main`, { headers });
      const { object } = await refRes.json();
      const baseCommitSha = object.sha;

      // === 3. Get the base tree SHA ===
      const commitRes = await fetch(`${BASE}/git/commits/${baseCommitSha}`, { headers });
      const { tree } = await commitRes.json();

      // === 4. Create new blobs ===
      const blob1 = await fetch(`${BASE}/git/blobs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: jsonData,
          encoding: "utf-8",
        }),
      }).then(r => r.json());

      const blob2 = await fetch(`${BASE}/git/blobs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: lastUpdate,
          encoding: "utf-8",
        }),
      }).then(r => r.json());

      // === 5. Create new tree containing both files ===
      const treeRes = await fetch(`${BASE}/git/trees`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          base_tree: tree.sha,
          tree: [
            {
              path: `${dirPath}/data.json`,
              mode: "100644",
              type: "blob",
              sha: blob1.sha,
            },
            {
              path: "last_update.txt",
              mode: "100644",
              type: "blob",
              sha: blob2.sha,
            },
          ],
        }),
      });
      const newTree = await treeRes.json();

      // === 6. Create new commit ===
      const commitRes2 = await fetch(`${BASE}/git/commits`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: "⸻",
          tree: newTree.sha,
          parents: [baseCommitSha],
        }),
      });
      const newCommit = await commitRes2.json();

      // === 7. Update main branch to point to new commit ===
      await fetch(`${BASE}/git/refs/heads/main`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ sha: newCommit.sha }),
      });
    } catch (err) {
      console.error("❌ Worker failed:", err);
    }
  },
};
