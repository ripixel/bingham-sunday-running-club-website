#!/bin/bash
set -e

MODE=$1

if [ "$MODE" = "hosting_only" ]; then
  echo "--only hosting"
  exit 0
fi

if [ "$MODE" = "auto" ]; then
  # Check if functions directory has changed in the latest commit
  # We use HEAD^ HEAD to check the last commit relative to its parent.
  # In CircleCI, we might need to fetch enough history.
  # However, common practice for PRs/Pushes is to check changes.
  # For a simple push, diffing HEAD^ HEAD is reasonable if we assume
  # the build is triggered by that push.

  if git diff --name-only HEAD^ HEAD | grep -q "^functions/"; then
    # Functions changed, deploy everything (default)
    echo ""
  else
    # No functions changed, only deploy hosting
    echo "--only hosting"
  fi
  exit 0
fi

# Fallback/Default (deploy everything)
echo ""
