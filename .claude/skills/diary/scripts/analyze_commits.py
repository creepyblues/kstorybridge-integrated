#!/usr/bin/env python3
"""
Analyze git commits for KStoryBridge project.

Extracts commit information for the specified date without including
actual code snippets (privacy).

Usage:
    python3 analyze_commits.py --date=2026-01-09
    python3 analyze_commits.py  # defaults to today
"""

import argparse
import json
import re
import subprocess
from datetime import datetime
from typing import TypedDict


class CommitInfo(TypedDict):
    hash: str
    message: str
    author: str
    timestamp: str
    files_changed: int
    insertions: int
    deletions: int
    files: list[str]
    category: str


# Category detection keywords
CATEGORY_KEYWORDS = {
    "Research": ["research", "investigate", "explore", "analyze", "study", "compare"],
    "Planning": ["plan", "design", "architect", "structure", "decide", "spec"],
    "Implementation": ["implement", "create", "add", "build", "develop", "feature", "feat"],
    "Bug Fix": ["fix", "bug", "issue", "error", "crash", "resolve", "debug", "hotfix"],
    "Refactoring": ["refactor", "cleanup", "reorganize", "simplify", "improve", "optimize"],
    "Documentation": ["doc", "document", "readme", "docs", "comment", "update doc"],
    "Testing": ["test", "e2e", "playwright", "unit test", "coverage", "spec"],
}


def categorize_commit(message: str) -> str:
    """Categorize a commit based on its message."""
    message_lower = message.lower()

    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in message_lower:
                return category

    # Default to Implementation if no match
    return "Implementation"


def get_commits_for_date(date: str, repo_path: str = ".") -> list[CommitInfo]:
    """Get all commits for a specific date."""
    commits = []

    # Git log format: hash|message|author|timestamp
    git_format = "%H|%s|%an|%ai"

    try:
        # Get commits for the date
        result = subprocess.run(
            [
                "git", "-C", repo_path, "log",
                f"--after={date} 00:00:00",
                f"--before={date} 23:59:59",
                f"--format={git_format}",
                "--shortstat",
            ],
            capture_output=True,
            text=True,
            check=True,
        )

        output = result.stdout.strip()
        if not output:
            return commits

        # Parse output
        lines = output.split("\n")
        i = 0

        while i < len(lines):
            line = lines[i].strip()

            if "|" in line:
                # This is a commit line
                parts = line.split("|")
                if len(parts) >= 4:
                    commit_hash = parts[0]
                    message = parts[1]
                    author = parts[2]
                    timestamp = parts[3]

                    # Look for stat line
                    files_changed = 0
                    insertions = 0
                    deletions = 0

                    # Skip empty lines and find stat line
                    i += 1
                    while i < len(lines) and not lines[i].strip():
                        i += 1

                    if i < len(lines):
                        stat_line = lines[i].strip()
                        # Parse stat line: "X files changed, Y insertions(+), Z deletions(-)"
                        files_match = re.search(r"(\d+) file", stat_line)
                        ins_match = re.search(r"(\d+) insertion", stat_line)
                        del_match = re.search(r"(\d+) deletion", stat_line)

                        if files_match:
                            files_changed = int(files_match.group(1))
                        if ins_match:
                            insertions = int(ins_match.group(1))
                        if del_match:
                            deletions = int(del_match.group(1))

                    # Get file list for this commit
                    files = get_commit_files(commit_hash, repo_path)

                    commits.append({
                        "hash": commit_hash[:8],
                        "message": message,
                        "author": author,
                        "timestamp": timestamp,
                        "files_changed": files_changed,
                        "insertions": insertions,
                        "deletions": deletions,
                        "files": files,
                        "category": categorize_commit(message),
                    })

            i += 1

    except subprocess.CalledProcessError:
        pass

    return commits


def get_commit_files(commit_hash: str, repo_path: str = ".") -> list[str]:
    """Get list of files changed in a commit."""
    try:
        result = subprocess.run(
            ["git", "-C", repo_path, "show", "--name-only", "--format=", commit_hash],
            capture_output=True,
            text=True,
            check=True,
        )

        files = [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
        return files

    except subprocess.CalledProcessError:
        return []


def summarize_commits(commits: list[CommitInfo]) -> dict:
    """Create summary statistics from commits."""
    total_files = sum(c["files_changed"] for c in commits)
    total_insertions = sum(c["insertions"] for c in commits)
    total_deletions = sum(c["deletions"] for c in commits)

    # Count by category
    categories: dict[str, int] = {}
    for commit in commits:
        cat = commit["category"]
        categories[cat] = categories.get(cat, 0) + 1

    # Find primary category
    primary_category = max(categories, key=categories.get) if categories else "Implementation"

    return {
        "commit_count": len(commits),
        "total_files_changed": total_files,
        "total_insertions": total_insertions,
        "total_deletions": total_deletions,
        "categories": categories,
        "primary_category": primary_category,
    }


def main():
    parser = argparse.ArgumentParser(description="Analyze git commits for KStoryBridge")
    parser.add_argument(
        "--date",
        type=str,
        default=datetime.now().strftime("%Y-%m-%d"),
        help="Date to analyze commits for (YYYY-MM-DD format)",
    )
    parser.add_argument(
        "--repo-path",
        type=str,
        default=".",
        help="Path to git repository",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Output JSON file path (defaults to stdout)",
    )

    args = parser.parse_args()

    # Get commits
    commits = get_commits_for_date(args.date, args.repo_path)

    # Build output
    output = {
        "date": args.date,
        "commits": commits,
        "summary": summarize_commits(commits),
    }

    # Output
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2)
    else:
        print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
