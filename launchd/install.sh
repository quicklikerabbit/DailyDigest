#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

# The plist in this directory is a template, so no machine-specific paths
# get committed. This fills it in for the current machine, installs it as a
# launchd agent, and (re)starts it. Safe to re-run, e.g. after switching
# node versions with nvm.

REPO_DIR="$(cd .. && pwd)"
LOG_DIR="$HOME/Library/Logs/DailyDigest"
AGENTS_DIR="$HOME/Library/LaunchAgents"
NPM="$(command -v npm)"
FIREBASE="$(command -v firebase)"
PATH_FOR_AGENT="$(dirname "$NPM"):$(dirname "$FIREBASE"):/usr/bin:/bin:/usr/sbin:/sbin"
DOMAIN="gui/$(id -u)"

mkdir -p "$LOG_DIR" "$AGENTS_DIR"

for template in com.dailydigest.*.plist; do
  label="${template%.plist}"
  target="$AGENTS_DIR/$template"
  sed -e "s#__REPO_DIR__#$REPO_DIR#g" \
    -e "s#__LOG_DIR__#$LOG_DIR#g" \
    -e "s#__NPM__#$NPM#g" \
    -e "s#__PATH__#$PATH_FOR_AGENT#g" \
    "$template" >"$target"
  plutil -lint -s "$target"
  # bootout fails if the agent isn't loaded yet, which is fine on first install.
  launchctl bootout "$DOMAIN/$label" 2>/dev/null || true
  launchctl bootstrap "$DOMAIN" "$target"
  echo "Installed $label (logs: $LOG_DIR)"
done
