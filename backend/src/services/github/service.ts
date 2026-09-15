import { Octokit } from '@octokit/rest';
import ignore from 'ignore';
import { redactSecrets } from './scanner.js';

export interface ParsedRepoUrl {
  owner: string;
  repo: string;
}

export function parseGitHubUrl(url: string): ParsedRepoUrl | null {
  if (!url) return null;
  const match = url.trim().match(/github\.com\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)/i);
  if (!match) return null;
  const owner = match[1];
  let repo = match[2];
  if (repo.endsWith('.git')) repo = repo.slice(0, -4);
  return { owner, repo };
}

const DEFAULT_DENYLIST = [
  'node_modules/**',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.git/**',
  '*.lock',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '*.min.js',
  '*.min.css',
  '*.map',
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.gif',
  '*.svg',
  '*.ico',
  '*.pdf',
  '*.woff',
  '*.woff2',
  '*.ttf',
  '*.eot',
  '*.mp4',
  '*.webm',
  '*.zip',
  '*.tar.gz',
];

export async function fetchRepoTree(
  owner: string,
  repo: string,
  branch?: string,
  token?: string
) {
  const octokit = new Octokit({ auth: token });

  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const targetBranch = branch || repoData.default_branch;

  const { data: treeData } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: targetBranch,
    recursive: '1',
  });

  const ig = ignore().add(DEFAULT_DENYLIST);

  const allPaths: string[] = [];
  const sourcePaths: string[] = [];

  for (const item of treeData.tree) {
    if (item.type === 'blob' && item.path) {
      allPaths.push(item.path);
      if (!ig.ignores(item.path) && (item.size || 0) < 300000) {
        sourcePaths.push(item.path);
      }
    }
  }

  return {
    repoData,
    targetBranch,
    allPaths,
    filteredSourcePaths: sourcePaths.slice(0, 50),
  };
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
  token?: string
): Promise<string> {
  const octokit = new Octokit({ auth: token });
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if ('content' in data && data.content) {
      const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
      const { redactedText } = redactSecrets(decoded);
      return redactedText;
    }
    return '';
  } catch (err) {
    console.error(`Failed to fetch ${path}:`, err);
    return '';
  }
}
