/**
 * GitHub Contents API client
 * ---------------------------
 * Used by the cron to write updated data files back to the repo.
 * The push triggers Vercel's auto-rebuild webhook.
 *
 * Required env vars:
 *   GITHUB_TOKEN          Fine-grained PAT with Contents:Read+Write on this repo only
 *   GITHUB_REPO           Format: "owner/repo" (e.g., "epiphany/unlimit-podcast-site")
 *   GITHUB_BRANCH         Branch to commit to (default: "main")
 */

const GITHUB_API = "https://api.github.com";

type FileResponse = {
  sha: string;
  content: string;      // base64-encoded
  encoding: "base64";
};

type CommitResponse = {
  content: { sha: string; path: string };
  commit: { sha: string; html_url: string };
};

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? "main";
  if (!token) throw new Error("Missing GITHUB_TOKEN env var");
  if (!repo) throw new Error("Missing GITHUB_REPO env var (format: owner/repo)");
  return { token, repo, branch };
}

function headers(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/** Fetch a file from the repo. Returns parsed JSON content. */
export async function fetchJsonFile<T>(path: string): Promise<{ content: T; sha: string }> {
  const { token, repo, branch } = getConfig();
  const url = `${GITHUB_API}/repos/${repo}/contents/${path}?ref=${branch}`;
  const response = await fetch(url, { headers: headers(token) });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub fetch failed for ${path}: ${response.status} ${text}`);
  }
  const data = (await response.json()) as FileResponse;
  const decoded = Buffer.from(data.content, "base64").toString("utf-8");
  return { content: JSON.parse(decoded) as T, sha: data.sha };
}

/**
 * Write an updated JSON file to the repo.
 * Requires the current `sha` to prevent overwriting concurrent edits.
 */
export async function commitJsonFile(
  path: string,
  content: unknown,
  sha: string,
  message: string
): Promise<CommitResponse> {
  const { token, repo, branch } = getConfig();
  const url = `${GITHUB_API}/repos/${repo}/contents/${path}`;
  const body = {
    message,
    content: Buffer.from(JSON.stringify(content, null, 2) + "\n", "utf-8").toString("base64"),
    sha,
    branch,
    committer: {
      name: "Unlimit Cron Bot",
      email: "cron@unlimitpodcast.com",
    },
  };
  const response = await fetch(url, {
    method: "PUT",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub commit failed for ${path}: ${response.status} ${text}`);
  }
  return (await response.json()) as CommitResponse;
}
