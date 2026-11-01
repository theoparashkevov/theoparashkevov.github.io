import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const GITHUB_USERNAME = 'theoparashkevov';
const MAX_SPARKLINE_REPOS = 12;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_PATH = join(process.cwd(), '.cache', 'github-activity.json');

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GitHubRepo {
  name: string;
  url: string;
  description: string | null;
  homepage: string | null;
  stars: number;
  forks: number;
  language: string | null;
  pushedAt: string;
  isArchived: boolean;
  weekly: number[];
  monthly: number[];
  sparkline: boolean;
}

export interface GitHubActivity {
  generatedAt: string;
  hasCalendar: boolean;
  totals: {
    contributionsYear: number;
    streakDays: number;
    activeDays: number;
    repoCount: number;
  };
  calendar: ContributionDay[][];
  monthly: { label: string; count: number }[];
  repos: GitHubRepo[];
}

/** Bucket a contribution count into a 0–4 level relative to the max count. */
export function levelFor(count: number, max: number): ContributionDay['level'] {
  if (count <= 0 || max <= 0) return 0;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

/** Convert GraphQL contributionCalendar weeks into leveled day columns. */
export function buildCalendar(
  weeks: { contributionDays: { date: string; contributionCount: number }[] }[]
): ContributionDay[][] {
  const max = Math.max(
    1,
    ...weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount))
  );
  return weeks.map((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: levelFor(day.contributionCount, max),
    }))
  );
}

/**
 * Current consecutive-day contribution streak, counting backwards from today.
 * Days after `today` (the calendar's last week may include future days) are
 * ignored; a zero-contribution day ends the streak.
 */
export function currentStreak(days: ContributionDay[], today?: string): number {
  const cutoff = (today ?? new Date().toISOString().slice(0, 10)) + 'T';
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].date > cutoff) continue;
    if (days[i].count > 0) streak++;
    else break;
  }
  return streak;
}

/** Aggregate calendar days into the last 12 calendar months (oldest first). */
export function calendarMonthly(weeks: ContributionDay[][]): { label: string; count: number }[] {
  const buckets = new Map<string, number>();
  for (const week of weeks) {
    for (const day of week) {
      const key = day.date.slice(0, 7);
      buckets.set(key, (buckets.get(key) ?? 0) + day.count);
    }
  }
  const keys = [...buckets.keys()].sort().slice(-12);
  return keys.map((key) => ({
    label: new Date(`${key}-02`).toLocaleDateString('en-US', { month: 'short' }),
    count: buckets.get(key) ?? 0,
  }));
}

/** Aggregate 52 weekly commit totals into 12 months (oldest first). */
export function weeklyToMonthly(weekly: number[], weekEpochs?: number[]): number[] {
  const buckets = new Map<string, number>();
  weekly.forEach((total, i) => {
    const epoch = weekEpochs?.[i];
    const key =
      epoch != null
        ? new Date(epoch * 1000).toISOString().slice(0, 7)
        : new Date(Date.now() - (weekly.length - 1 - i) * 7 * 86400_000).toISOString().slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + total);
  });
  return [...buckets.keys()]
    .sort()
    .slice(-12)
    .map((key) => buckets.get(key) ?? 0);
}

const GRAPHQL_QUERY = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
      repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, orderBy: { field: PUSHED_AT, direction: DESC }) {
        nodes {
          name
          url
          description
          homepageUrl
          isPrivate
          stargazerCount
          forkCount
          pushedAt
          isArchived
          primaryLanguage { name }
        }
      }
    }
  }
`;

async function githubGraphql<T>(
  token: string,
  query: string,
  variables: Record<string, string>
): Promise<T> {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'theoparashkevov-site',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (body.errors?.length)
    throw new Error(`GitHub GraphQL errors: ${body.errors.map((e) => e.message).join('; ')}`);
  return body.data as T;
}

async function githubRest<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      ...(token ? { Authorization: `bearer ${token}` } : {}),
      Accept: 'application/vnd.github+json',
      'User-Agent': 'theoparashkevov-site',
    },
  });
  if (!res.ok) throw new Error(`GitHub REST ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

interface RestRepo {
  name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  pushed_at: string;
  archived: boolean;
  fork: boolean;
}

interface CommitActivityWeek {
  week: number;
  total: number;
}

async function fetchRepoWeekly(owner: string, repo: string, token?: string): Promise<number[]> {
  try {
    const stats = await githubRest<CommitActivityWeek[] | { message?: string }>(
      `/repos/${owner}/${repo}/stats/commit_activity`,
      token
    );
    if (!Array.isArray(stats)) return [];
    return stats.map((week) => week.total);
  } catch {
    return [];
  }
}

async function fetchActivity(token?: string): Promise<GitHubActivity> {
  interface Node {
    name: string;
    url: string;
    description: string | null;
    homepageUrl: string | null;
    isPrivate: boolean;
    stargazerCount: number;
    forkCount: number;
    pushedAt: string;
    isArchived: boolean;
    primaryLanguage: { name: string } | null;
  }

  let calendar: ContributionDay[][] = [];
  let totalContributions = 0;
  let nodes: Node[];

  if (token) {
    const data = await githubGraphql<{
      user: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: number;
            weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
          };
        };
        repositories: { nodes: Node[] };
      };
    }>(token, GRAPHQL_QUERY, { login: GITHUB_USERNAME });
    const cal = data.user.contributionsCollection.contributionCalendar;
    totalContributions = cal.totalContributions;
    calendar = buildCalendar(cal.weeks);
    nodes = data.user.repositories.nodes.filter((repo) => !repo.isArchived && !repo.isPrivate);
  } else {
    const restRepos = await githubRest<RestRepo[]>(
      `/users/${GITHUB_USERNAME}/repos?per_page=100&sort=pushed`
    );
    nodes = restRepos
      .filter((repo) => !repo.fork && !repo.archived)
      .map((repo) => ({
        name: repo.name,
        url: repo.html_url,
        description: repo.description,
        homepageUrl: repo.homepage || null,
        // /users/{login}/repos only ever returns public repos.
        isPrivate: false,
        stargazerCount: repo.stargazers_count,
        forkCount: repo.forks_count,
        pushedAt: repo.pushed_at,
        isArchived: repo.archived,
        primaryLanguage: repo.language ? { name: repo.language } : null,
      }));
  }

  const sorted = [...nodes].sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));
  const repos: GitHubRepo[] = [];
  for (const [index, node] of sorted.entries()) {
    const weekly =
      index < MAX_SPARKLINE_REPOS ? await fetchRepoWeekly(GITHUB_USERNAME, node.name, token) : [];
    repos.push({
      name: node.name,
      url: node.url,
      description: node.description,
      homepage: node.homepageUrl,
      stars: node.stargazerCount,
      forks: node.forkCount,
      language: node.primaryLanguage?.name ?? null,
      pushedAt: node.pushedAt,
      isArchived: node.isArchived,
      weekly,
      monthly: weeklyToMonthly(weekly),
      sparkline: weekly.length > 0,
    });
  }

  const flatDays = calendar.flat();
  return {
    generatedAt: new Date().toISOString(),
    hasCalendar: calendar.length > 0,
    totals: {
      contributionsYear: totalContributions,
      streakDays: currentStreak(flatDays),
      activeDays: flatDays.filter((day) => day.count > 0).length,
      repoCount: repos.length,
    },
    calendar,
    monthly: calendarMonthly(calendar),
    repos,
  };
}

function readCache(): GitHubActivity | null {
  if (!existsSync(CACHE_PATH)) return null;
  try {
    const cached = JSON.parse(readFileSync(CACHE_PATH, 'utf8')) as GitHubActivity & {
      cachedAt?: string;
    };
    if (!cached.cachedAt || Date.now() - Date.parse(cached.cachedAt) > CACHE_TTL_MS) return null;
    const { cachedAt: _cachedAt, ...activity } = cached;
    return activity;
  } catch {
    return null;
  }
}

function writeCache(activity: GitHubActivity): void {
  try {
    mkdirSync(join(process.cwd(), '.cache'), { recursive: true });
    writeFileSync(CACHE_PATH, JSON.stringify({ ...activity, cachedAt: Date.now() }));
  } catch {
    // Caching is best-effort; never break the build over it.
  }
}

/**
 * Load GitHub activity for the site. Prefers a fresh cache, then the GitHub API.
 * Without a token the contribution calendar is unavailable and only the
 * repository list (with per-repo commit sparklines) is fetched.
 */
export async function loadGitHubActivity(): Promise<GitHubActivity | null> {
  const cached = readCache();
  if (cached) return cached;
  const token = process.env.GITHUB_TOKEN ?? import.meta.env?.GITHUB_TOKEN;
  try {
    const activity = await fetchActivity(token || undefined);
    writeCache(activity);
    return activity;
  } catch (error) {
    console.warn(`[github] failed to load activity: ${(error as Error).message}`);
    return null;
  }
}
