#!/usr/bin/env python3
"""
Collect Claude Code history entries for KStoryBridge project.

Parses ~/.claude/history.jsonl and extracts entries for the specified date
that are related to the KStoryBridge project.

Usage:
    python3 collect_history.py --date=2026-01-09
    python3 collect_history.py  # defaults to today
"""

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import TypedDict


class HistoryEntry(TypedDict):
    display: str
    timestamp: int
    project: str
    sessionId: str | None


class CollectedSession(TypedDict):
    session_id: str | None
    start_time: str
    end_time: str
    prompts: list[str]
    prompt_count: int


def get_history_path() -> Path:
    """Get the path to Claude Code history file."""
    return Path.home() / ".claude" / "history.jsonl"


def parse_history_file(history_path: Path) -> list[HistoryEntry]:
    """Parse the JSONL history file."""
    entries = []

    if not history_path.exists():
        return entries

    with open(history_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    entry = json.loads(line)
                    entries.append(entry)
                except json.JSONDecodeError:
                    continue

    return entries


def filter_by_project(entries: list[HistoryEntry], project_filter: str) -> list[HistoryEntry]:
    """Filter entries by project path."""
    return [e for e in entries if project_filter in e.get("project", "")]


def filter_by_date(entries: list[HistoryEntry], target_date: str) -> list[HistoryEntry]:
    """Filter entries by date (YYYY-MM-DD format)."""
    filtered = []

    for entry in entries:
        timestamp = entry.get("timestamp")
        if timestamp:
            # Convert milliseconds to datetime
            dt = datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc)
            entry_date = dt.strftime("%Y-%m-%d")
            if entry_date == target_date:
                filtered.append(entry)

    return filtered


def group_by_session(entries: list[HistoryEntry]) -> list[CollectedSession]:
    """Group entries by session ID and create session summaries."""
    sessions: dict[str, list[HistoryEntry]] = {}
    no_session: list[HistoryEntry] = []

    for entry in entries:
        session_id = entry.get("sessionId")
        if session_id:
            if session_id not in sessions:
                sessions[session_id] = []
            sessions[session_id].append(entry)
        else:
            no_session.append(entry)

    result: list[CollectedSession] = []

    # Process sessions with IDs
    for session_id, session_entries in sessions.items():
        # Sort by timestamp
        session_entries.sort(key=lambda x: x.get("timestamp", 0))

        prompts = [e.get("display", "") for e in session_entries if e.get("display")]

        if session_entries:
            start_ts = session_entries[0].get("timestamp", 0)
            end_ts = session_entries[-1].get("timestamp", 0)

            start_time = datetime.fromtimestamp(start_ts / 1000, tz=timezone.utc).strftime("%H:%M")
            end_time = datetime.fromtimestamp(end_ts / 1000, tz=timezone.utc).strftime("%H:%M")

            result.append({
                "session_id": session_id,
                "start_time": start_time,
                "end_time": end_time,
                "prompts": prompts,
                "prompt_count": len(prompts),
            })

    # Process entries without session IDs
    if no_session:
        no_session.sort(key=lambda x: x.get("timestamp", 0))
        prompts = [e.get("display", "") for e in no_session if e.get("display")]

        if no_session:
            start_ts = no_session[0].get("timestamp", 0)
            end_ts = no_session[-1].get("timestamp", 0)

            start_time = datetime.fromtimestamp(start_ts / 1000, tz=timezone.utc).strftime("%H:%M")
            end_time = datetime.fromtimestamp(end_ts / 1000, tz=timezone.utc).strftime("%H:%M")

            result.append({
                "session_id": None,
                "start_time": start_time,
                "end_time": end_time,
                "prompts": prompts,
                "prompt_count": len(prompts),
            })

    # Sort sessions by start time
    result.sort(key=lambda x: x["start_time"])

    return result


def main():
    parser = argparse.ArgumentParser(description="Collect Claude Code history for KStoryBridge")
    parser.add_argument(
        "--date",
        type=str,
        default=datetime.now().strftime("%Y-%m-%d"),
        help="Date to collect history for (YYYY-MM-DD format)",
    )
    parser.add_argument(
        "--project-filter",
        type=str,
        default="/code/kstorybridge",
        help="Project path filter",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Output JSON file path (defaults to stdout)",
    )

    args = parser.parse_args()

    history_path = get_history_path()

    if not history_path.exists():
        print(json.dumps({"error": f"History file not found: {history_path}"}))
        return

    # Parse and filter
    entries = parse_history_file(history_path)
    entries = filter_by_project(entries, args.project_filter)
    entries = filter_by_date(entries, args.date)

    # Group by session
    sessions = group_by_session(entries)

    # Build output
    output = {
        "date": args.date,
        "project_filter": args.project_filter,
        "total_entries": len(entries),
        "session_count": len(sessions),
        "sessions": sessions,
    }

    # Output
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2)
    else:
        print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
