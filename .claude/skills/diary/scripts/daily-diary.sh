#!/bin/bash
#
# Daily Development Diary Generator
#
# Runs at 4am PST to generate diary entry for the previous day.
# This script collects Claude Code history, analyzes git commits,
# and generates a markdown diary entry.
#
# Usage:
#   ./daily-diary.sh                    # Generate for yesterday
#   ./daily-diary.sh 2026-01-25         # Generate for specific date
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
DIARY_ROOT="$REPO_ROOT/marketing/development_diary"
LOG_FILE="$DIARY_ROOT/logs/daily-diary.log"

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Calculate target date (yesterday if no argument provided)
if [ -n "$1" ]; then
    TARGET_DATE="$1"
else
    # Get yesterday's date (works on macOS)
    TARGET_DATE=$(date -v-1d '+%Y-%m-%d')
fi

log "=========================================="
log "Starting diary generation for $TARGET_DATE"
log "=========================================="

# Create necessary directories
mkdir -p "$DIARY_ROOT/drafts"
mkdir -p "$DIARY_ROOT/screenshots/$TARGET_DATE"
mkdir -p "$DIARY_ROOT/tmp"

# Step 1: Collect Claude Code history
log "Step 1: Collecting Claude Code history..."
HISTORY_FILE="$DIARY_ROOT/tmp/history-$TARGET_DATE.json"

if python3 "$SCRIPT_DIR/collect_history.py" --date="$TARGET_DATE" --output="$HISTORY_FILE" 2>&1 | tee -a "$LOG_FILE"; then
    log "History collected successfully"
else
    log "Warning: History collection failed, continuing with empty history"
    echo '{"session_count": 0, "sessions": []}' > "$HISTORY_FILE"
fi

# Step 2: Analyze git commits
log "Step 2: Analyzing git commits..."
COMMITS_FILE="$DIARY_ROOT/tmp/commits-$TARGET_DATE.json"

cd "$REPO_ROOT"
if python3 "$SCRIPT_DIR/analyze_commits.py" --date="$TARGET_DATE" --output="$COMMITS_FILE" 2>&1 | tee -a "$LOG_FILE"; then
    log "Commits analyzed successfully"
else
    log "Warning: Commit analysis failed, continuing with empty commits"
    echo '{"commits": [], "summary": {}}' > "$COMMITS_FILE"
fi

# Step 3: Generate diary entry
log "Step 3: Generating diary entry..."
OUTPUT_FILE="$DIARY_ROOT/drafts/$TARGET_DATE.md"

if python3 "$SCRIPT_DIR/generate_entry.py" \
    --date="$TARGET_DATE" \
    --history="$HISTORY_FILE" \
    --commits="$COMMITS_FILE" \
    --diary-root="$DIARY_ROOT" \
    --output="$OUTPUT_FILE" 2>&1 | tee -a "$LOG_FILE"; then
    log "Diary entry generated: $OUTPUT_FILE"
else
    log "Error: Failed to generate diary entry"
    exit 1
fi

# Step 4: Cleanup temp files
log "Step 4: Cleaning up..."
rm -f "$HISTORY_FILE" "$COMMITS_FILE"

# Step 5: Send to Slack
log "Step 5: Sending to Slack..."

# Load Slack webhook from config
if [ -f "$SKILL_DIR/config.env" ]; then
    source "$SKILL_DIR/config.env"
    log "Loaded config from $SKILL_DIR/config.env"
fi

if [ -n "$SLACK_WEBHOOK_URL" ]; then
    # Extract stats from the generated entry
    SESSION_COUNT=$(grep -E "^session_count:" "$OUTPUT_FILE" | sed 's/session_count: //' || echo "0")
    COMMIT_COUNT=$(grep -E "^commit_count:" "$OUTPUT_FILE" | sed 's/commit_count: //' || echo "0")
    HIGHLIGHT=$(grep -E "^highlight:" "$OUTPUT_FILE" | sed 's/highlight: "//' | sed 's/"$//' || echo "Development work")
    CATEGORIES=$(grep -E "^categories:" "$OUTPUT_FILE" | sed 's/categories: //' || echo "[]")

    # Extract daily summary (line after "## Daily Summary")
    DAILY_SUMMARY=$(awk '/^## Daily Summary/{getline; getline; print}' "$OUTPUT_FILE" | head -1)

    # Format date for display
    DATE_FORMATTED=$(date -j -f "%Y-%m-%d" "$TARGET_DATE" "+%B %d, %Y" 2>/dev/null || echo "$TARGET_DATE")

    # Web link to diary (will be live after publishing)
    DIARY_LINK="https://kstorybridge.com/development_diary/$TARGET_DATE"

    # Create Slack message with rich formatting
    SLACK_MESSAGE=$(cat <<EOF
{
    "blocks": [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "📓 Development Diary - $DATE_FORMATTED",
                "emoji": true
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Highlight:* $HIGHLIGHT"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "$DAILY_SUMMARY"
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": "*Sessions:* $SESSION_COUNT"
                },
                {
                    "type": "mrkdwn",
                    "text": "*Commits:* $COMMIT_COUNT"
                },
                {
                    "type": "mrkdwn",
                    "text": "*Categories:* $CATEGORIES"
                }
            ]
        },
        {
            "type": "divider"
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": "📁 Draft: \`$OUTPUT_FILE\`"
                }
            ]
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "View on Web",
                        "emoji": true
                    },
                    "url": "$DIARY_LINK"
                }
            ]
        }
    ]
}
EOF
)

    # Send to Slack
    if curl -s -X POST -H 'Content-type: application/json' --data "$SLACK_MESSAGE" "$SLACK_WEBHOOK_URL" > /dev/null; then
        log "Slack notification sent successfully"
    else
        log "Warning: Failed to send Slack notification"
    fi
else
    log "Skipping Slack notification (SLACK_WEBHOOK_URL not set)"
fi

# Step 6: Auto-publish draft
log "Step 6: Publishing draft..."
PUBLISH_YEAR=$(echo "$TARGET_DATE" | cut -d'-' -f1)
PUBLISH_MONTH=$(echo "$TARGET_DATE" | cut -d'-' -f2)
PUBLISH_DIR="$DIARY_ROOT/published/$PUBLISH_YEAR/$PUBLISH_MONTH"
mkdir -p "$PUBLISH_DIR"
sed 's/^status: draft$/status: published/' "$OUTPUT_FILE" > "$PUBLISH_DIR/$TARGET_DATE.md"
rm -f "$OUTPUT_FILE"
log "Published to $PUBLISH_DIR/$TARGET_DATE.md"

# Step 7: Summary
log "=========================================="
log "Diary generation complete!"
PUBLISHED_FILE="$PUBLISH_DIR/$TARGET_DATE.md"
log "Output: $PUBLISHED_FILE"
log "=========================================="

# Print entry preview (first 20 lines)
echo ""
echo "=== Entry Preview ==="
head -20 "$PUBLISHED_FILE"
echo "..."
echo ""
echo "Full entry at: $PUBLISHED_FILE"
