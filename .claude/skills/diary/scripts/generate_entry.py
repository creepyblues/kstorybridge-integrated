#!/usr/bin/env python3
"""
Generate a diary entry from collected data.

Combines Claude Code history and git commits to create a markdown
diary entry using the template.

Usage:
    python3 generate_entry.py --date=2026-01-09
    python3 generate_entry.py --date=2026-01-09 --history=history.json --commits=commits.json
"""

import argparse
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any


def load_json_file(path: str) -> dict:
    """Load a JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_template(template_path: Path) -> str:
    """Load the diary entry template."""
    if template_path.exists():
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()

    # Default template if file not found
    return """---
date: {{DATE}}
status: draft
author: Sung Ho Lee
session_count: {{SESSION_COUNT}}
commit_count: {{COMMIT_COUNT}}
categories: {{CATEGORIES}}
highlight: "{{HIGHLIGHT}}"
tags: {{TAGS}}
---

# Development Diary - {{DATE_FORMATTED}}

## Daily Summary

{{DAILY_SUMMARY}}

---

## Work Sessions

{{WORK_SESSIONS}}

---

## Categorized Work

{{CATEGORIZED_WORK}}

---

## Statistics

| Metric | Value |
|--------|-------|
| Sessions | {{SESSION_COUNT}} |
| Commits | {{COMMIT_COUNT}} |
| Files Changed | {{FILES_CHANGED}} |
| Lines Added | {{LINES_ADDED}} |
| Lines Deleted | {{LINES_DELETED}} |
| Primary Category | {{PRIMARY_CATEGORY}} |

---

## Tomorrow's Focus

{{TOMORROW_FOCUS}}

---

*Generated with KStoryBridge Development Diary*
"""


def load_insights(insights_path: Path) -> list[dict]:
    """Load manually added insights for the date."""
    if insights_path.exists():
        with open(insights_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def format_date(date_str: str) -> str:
    """Format date as human-readable string."""
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    return dt.strftime("%B %d, %Y")


def generate_daily_summary(history: dict, commits: dict) -> str:
    """Generate a brief daily summary."""
    session_count = history.get("session_count", 0)
    commit_count = len(commits.get("commits", []))
    summary = commits.get("summary", {})
    primary_category = summary.get("primary_category", "Implementation")

    if commit_count == 0 and session_count == 0:
        return "No recorded activity for this day."

    parts = []

    if session_count > 0:
        parts.append(f"Worked across {session_count} development session{'s' if session_count > 1 else ''}")

    if commit_count > 0:
        parts.append(f"with {commit_count} commit{'s' if commit_count > 1 else ''}")
        parts.append(f"focused primarily on {primary_category.lower()}")

    return " ".join(parts) + "."


def generate_work_sessions(history: dict) -> str:
    """Generate work sessions section."""
    sessions = history.get("sessions", [])

    if not sessions:
        return "*No session data recorded.*"

    lines = []

    for i, session in enumerate(sessions, 1):
        start_time = session.get("start_time", "??:??")
        end_time = session.get("end_time", "??:??")
        prompts = session.get("prompts", [])

        lines.append(f"### Session {i} ({start_time} - {end_time} UTC)")
        lines.append("")

        if prompts:
            lines.append("**Key Prompts:**")
            # Show first 3 prompts (truncated)
            for prompt in prompts[:3]:
                truncated = prompt[:100] + "..." if len(prompt) > 100 else prompt
                # Escape any markdown
                truncated = truncated.replace("|", "\\|").replace("\n", " ")
                lines.append(f"- \"{truncated}\"")

            if len(prompts) > 3:
                lines.append(f"- *...and {len(prompts) - 3} more prompts*")
        else:
            lines.append("*No prompts recorded.*")

        lines.append("")

    return "\n".join(lines)


def generate_categorized_work(commits: dict) -> str:
    """Generate categorized work section."""
    commit_list = commits.get("commits", [])

    if not commit_list:
        return "*No commits recorded.*"

    # Group commits by category
    by_category: dict[str, list[dict]] = {}
    for commit in commit_list:
        cat = commit.get("category", "Implementation")
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(commit)

    lines = []

    for category in ["Implementation", "Bug Fix", "Refactoring", "Documentation", "Testing", "Research", "Planning"]:
        if category in by_category:
            lines.append(f"### {category}")
            for commit in by_category[category]:
                message = commit.get("message", "No message")
                files_changed = commit.get("files_changed", 0)
                lines.append(f"- {message} ({files_changed} file{'s' if files_changed != 1 else ''})")
            lines.append("")

    return "\n".join(lines)


def generate_insights_section(insights: list[dict]) -> str:
    """Generate insights section from manually added insights."""
    if not insights:
        return "*No insights recorded. Use `/diary add` to capture insights during sessions.*"

    lines = []

    for insight in insights:
        category = insight.get("category", "insight").title()
        text = insight.get("text", "")
        lines.append(f"> **{category}:** {text}")
        lines.append("")

    return "\n".join(lines)


def generate_screenshots_section(screenshots_dir: Path) -> str:
    """Generate screenshots section."""
    if not screenshots_dir.exists():
        return "*No screenshots captured. Use `/diary screenshot` to capture UI states.*"

    screenshots = list(screenshots_dir.glob("*.png")) + list(screenshots_dir.glob("*.jpg"))

    if not screenshots:
        return "*No screenshots captured. Use `/diary screenshot` to capture UI states.*"

    lines = []

    for screenshot in screenshots:
        name = screenshot.stem.replace("-", " ").replace("_", " ").title()
        rel_path = f"/marketing/development_diary/screenshots/{screenshots_dir.name}/{screenshot.name}"
        lines.append(f"![{name}]({rel_path})")
        lines.append(f"*{name}*")
        lines.append("")

    return "\n".join(lines)


def extract_categories(commits: dict) -> list[str]:
    """Extract unique categories from commits."""
    commit_list = commits.get("commits", [])
    categories = set()

    for commit in commit_list:
        categories.add(commit.get("category", "Implementation"))

    return sorted(list(categories))


def generate_highlight(commits: dict) -> str:
    """Generate a highlight from the day's work."""
    commit_list = commits.get("commits", [])

    if not commit_list:
        return "Development session"

    # Find the most significant commit (by lines changed)
    best_commit = max(
        commit_list,
        key=lambda c: c.get("insertions", 0) + c.get("deletions", 0),
        default=commit_list[0] if commit_list else None
    )

    if best_commit:
        message = best_commit.get("message", "Development work")
        # Clean up conventional commit prefixes
        for prefix in ["feat:", "fix:", "docs:", "refactor:", "test:", "chore:"]:
            if message.lower().startswith(prefix):
                message = message[len(prefix):].strip()
                break
        return message.capitalize()

    return "Development session"


def extract_tags(commits: dict) -> list[str]:
    """Extract tags from commit messages and files."""
    commit_list = commits.get("commits", [])
    tags = set()

    # Common tag patterns
    tag_keywords = {
        "ai": ["ai", "gemini", "openai", "llm", "chatbot", "embeddings"],
        "design": ["design", "style", "theme", "color"],
        "auth": ["auth", "login", "signup", "oauth"],
        "supabase": ["supabase", "migration", "edge function", "rls"],
        "ui": ["ui", "component", "button", "modal"],
        "api": ["api", "endpoint", "route", "fetch"],
        "deployment": ["vercel", "deploy", "staging", "production"],
        "dashboard": ["dashboard", "buyer", "tier"],
        "creator": ["creator", "title", "content"],
        "web": ["next", "vercel", "web", "website"],
    }

    for commit in commit_list:
        message = commit.get("message", "").lower()
        files = commit.get("files", [])

        for tag, keywords in tag_keywords.items():
            for keyword in keywords:
                if keyword in message or any(keyword in f.lower() for f in files):
                    tags.add(tag)
                    break

    return sorted(list(tags))[:5]  # Limit to 5 tags


def generate_entry(
    date: str,
    history: dict,
    commits: dict,
    insights: list[dict],
    template: str,
    screenshots_dir: Path,
) -> str:
    """Generate the full diary entry."""
    summary = commits.get("summary", {})

    # Prepare replacements
    replacements = {
        "{{DATE}}": date,
        "{{DATE_FORMATTED}}": format_date(date),
        "{{SESSION_COUNT}}": str(history.get("session_count", 0)),
        "{{COMMIT_COUNT}}": str(len(commits.get("commits", []))),
        "{{CATEGORIES}}": str(extract_categories(commits)),
        "{{HIGHLIGHT}}": generate_highlight(commits),
        "{{TAGS}}": str(extract_tags(commits)),
        "{{DAILY_SUMMARY}}": generate_daily_summary(history, commits),
        "{{WORK_SESSIONS}}": generate_work_sessions(history),
        "{{CATEGORIZED_WORK}}": generate_categorized_work(commits),
        "{{SCREENSHOTS}}": generate_screenshots_section(screenshots_dir),
        "{{INSIGHTS}}": generate_insights_section(insights),
        "{{FILES_CHANGED}}": str(summary.get("total_files_changed", 0)),
        "{{LINES_ADDED}}": str(summary.get("total_insertions", 0)),
        "{{LINES_DELETED}}": str(summary.get("total_deletions", 0)),
        "{{PRIMARY_CATEGORY}}": summary.get("primary_category", "Implementation"),
        "{{TOMORROW_FOCUS}}": "*To be filled in during review.*",
    }

    entry = template
    for placeholder, value in replacements.items():
        entry = entry.replace(placeholder, value)

    return entry


def main():
    parser = argparse.ArgumentParser(description="Generate diary entry")
    parser.add_argument(
        "--date",
        type=str,
        default=datetime.now().strftime("%Y-%m-%d"),
        help="Date for the entry (YYYY-MM-DD format)",
    )
    parser.add_argument(
        "--history",
        type=str,
        help="Path to history JSON (from collect_history.py)",
    )
    parser.add_argument(
        "--commits",
        type=str,
        help="Path to commits JSON (from analyze_commits.py)",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Output markdown file path",
    )
    parser.add_argument(
        "--diary-root",
        type=str,
        default="marketing/development_diary",
        help="Path to diary root directory",
    )

    args = parser.parse_args()

    diary_root = Path(args.diary_root)

    # Load history data
    if args.history:
        history = load_json_file(args.history)
    else:
        history = {"session_count": 0, "sessions": []}

    # Load commits data
    if args.commits:
        commits = load_json_file(args.commits)
    else:
        commits = {"commits": [], "summary": {}}

    # Load template
    template_path = diary_root / "templates" / "daily-entry.md"
    template = load_template(template_path)

    # Load insights
    insights_path = diary_root / "drafts" / f".insights-{args.date}.json"
    insights = load_insights(insights_path)

    # Screenshots directory
    screenshots_dir = diary_root / "screenshots" / args.date

    # Generate entry
    entry = generate_entry(
        args.date,
        history,
        commits,
        insights,
        template,
        screenshots_dir,
    )

    # Output
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(entry)
        print(f"Entry written to: {output_path}")
    else:
        print(entry)


if __name__ == "__main__":
    main()
