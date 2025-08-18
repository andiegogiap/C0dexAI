
import { GitTreeItem, RepoInfo } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

const commonHeaders = (token: string) => ({
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
});

export const getRepoDetails = async (token: string, owner: string, repo: string) => {
    const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
        headers: commonHeaders(token),
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch repo details: ${response.statusText}`);
    }
    const data = await response.json();
    return {
        defaultBranch: data.default_branch,
    }
};

export const getRepoTree = async (token: string, { owner, repo, branch }: RepoInfo): Promise<GitTreeItem[]> => {
    const details = await getRepoDetails(token, owner, repo);
    const branchToFetch = branch || details.defaultBranch;

    const branchResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/branches/${branchToFetch}`, {
        headers: commonHeaders(token),
    });
    if (!branchResponse.ok) throw new Error('Branch not found');
    const branchData = await branchResponse.json();
    const treeSha = branchData.commit.commit.tree.sha;

    const treeResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, {
        headers: commonHeaders(token),
    });

    if (!treeResponse.ok) {
        throw new Error('Could not fetch repository file tree.');
    }

    const treeData = await treeResponse.json();
    if (treeData.truncated) {
        console.warn("File tree is truncated. Some files may not be displayed.");
    }
    return treeData.tree as GitTreeItem[];
};

export const getFileContent = async (token: string, { owner, repo }: RepoInfo, path: string): Promise<{ content: string; sha: string }> => {
    const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
        headers: commonHeaders(token),
    });

    if (!response.ok) {
        throw new Error(`Could not fetch file content for: ${path}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
        throw new Error("Path is a directory, not a file.");
    }
    // Content is base64 encoded
    const content = atob(data.content);
    return { content, sha: data.sha };
};

export const updateFile = async (
    token: string,
    { owner, repo, branch }: RepoInfo,
    path: string,
    content: string,
    sha: string,
    commitMessage: string
): Promise<void> => {
    const details = await getRepoDetails(token, owner, repo);
    const branchToCommit = branch || details.defaultBranch;

    const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
            ...commonHeaders(token),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: commitMessage,
            content: btoa(content), // content must be base64 encoded
            sha: sha,
            branch: branchToCommit,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to update file: ${error.message}`);
    }
};

export const createFile = async (
    token: string,
    { owner, repo, branch }: RepoInfo,
    path: string,
    content: string,
    commitMessage: string
): Promise<void> => {
    const details = await getRepoDetails(token, owner, repo);
    const branchToCommit = branch || details.defaultBranch;
    
    const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
            ...commonHeaders(token),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: commitMessage,
            content: btoa(content),
            branch: branchToCommit,
        }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        // Check if file already exists, which comes back as a 422
        if (response.status === 422 && error.message.includes('sha')) {
            throw new Error(`File already exists at path: ${path}. Use modify instead of create.`);
        }
        throw new Error(`Failed to create file: ${error.message}`);
    }
};

export const downloadRepoZip = async (token: string, { owner, repo, branch }: RepoInfo): Promise<Blob> => {
    const details = await getRepoDetails(token, owner, repo);
    const branchToFetch = branch || details.defaultBranch;

    const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/zipball/${branchToFetch}`, {
        headers: commonHeaders(token),
    });

    if (!response.ok) {
        throw new Error(`Failed to download repository zip: ${response.statusText}`);
    }
    return response.blob();
};
