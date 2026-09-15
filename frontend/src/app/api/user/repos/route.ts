import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    const isGitHub = (session as any)?.provider === 'github';
    const token = (session as any)?.githubAccessToken || (isGitHub ? (session as any)?.accessToken : undefined);

    const { searchParams } = new URL(request.url);
    const usernameParam = searchParams.get('username') || (!token && isGitHub && session?.user?.name ? session.user.name : null);

    let githubApiUrl = 'https://api.github.com/user/repos?sort=updated&per_page=100&type=all';
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Paradox-AI-Interview-Agent',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (usernameParam) {
      githubApiUrl = `https://api.github.com/users/${encodeURIComponent(usernameParam)}/repos?sort=updated&per_page=100`;
    } else {
      return NextResponse.json({
        connected: false,
        repos: [],
        message: 'No active GitHub OAuth token or username provided',
      });
    }

    const response = await fetch(githubApiUrl, {
      headers,
      next: { revalidate: 30 }, // cache for 30s to respect GitHub rate limits
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({
        connected: Boolean(token),
        repos: [],
        error: `GitHub API error: ${response.status} ${response.statusText}`,
        details: errText,
      }, { status: response.status });
    }

    const data = await response.json();
    const repos = (Array.isArray(data) ? data : []).map((r: any) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      lang: r.language || 'Code',
      stars: r.stargazers_count,
      updated: formatRelativeTime(r.updated_at),
      url: r.html_url,
      isPrivate: r.private,
      defaultBranch: r.default_branch || 'main',
      description: r.description || '',
    }));

    return NextResponse.json({
      connected: Boolean(token),
      repos,
    });
  } catch (error: any) {
    console.error('Error fetching user repos:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch repositories' }, { status: 500 });
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
