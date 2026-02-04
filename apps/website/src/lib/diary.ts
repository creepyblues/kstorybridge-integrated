export interface DiaryEntry {
  date: string;
  highlight: string;
  categories: string[];
  tags: string[];
  sessionCount: number;
  commitCount: number;
  content: string;
  author?: string;
}

const mdFiles = import.meta.glob(
  "../../../../marketing/development_diary/published/**/*.md",
  { query: "?raw", eager: true }
);

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const yaml = match[1];
  const content = match[2];
  const data: Record<string, unknown> = {};
  for (const line of yaml.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const [, key, val] = m;
    const trimmed = val.trim();
    if (trimmed === "[]") {
      data[key] = [];
    } else if (trimmed.startsWith("[")) {
      data[key] = trimmed.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
      data[key] = trimmed.slice(1, -1);
    } else if (/^\d+$/.test(trimmed)) {
      data[key] = parseInt(trimmed, 10);
    } else {
      data[key] = trimmed;
    }
  }
  return { data, content };
}

function parseEntry(raw: string): DiaryEntry | null {
  const parsed = parseFrontmatter(raw);
  if (!parsed) return null;
  const { data, content } = parsed;
  if (data.status !== "published") return null;
  const date = data.date instanceof Date
    ? data.date.toISOString().split("T")[0]
    : String(data.date);
  return {
    date,
    highlight: (data.highlight as string) || "",
    categories: (data.categories as string[]) || [],
    tags: (data.tags as string[]) || [],
    sessionCount: (data.session_count as number) ?? 0,
    commitCount: (data.commit_count as number) ?? 0,
    content,
    author: data.author as string | undefined,
  };
}

export function getAllEntries(): DiaryEntry[] {
  const entries: DiaryEntry[] = [];
  for (const path in mdFiles) {
    const raw = (mdFiles[path] as { default: string }).default;
    const entry = parseEntry(raw);
    if (entry) entries.push(entry);
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

export function getEntryByDate(date: string): DiaryEntry | null {
  const entries = getAllEntries();
  return entries.find((e) => e.date === date) || null;
}
