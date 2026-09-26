#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
default_root=$(cd "$script_dir/../../.." && pwd)
project_root=${1:-$default_root}
manifest_path="$project_root/.context/context-manifest.json"
max_manifest_bytes=32768

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required to validate the Context manifest" >&2
  exit 1
fi

if [[ ! -f "$manifest_path" ]]; then
  echo "ERROR: Context manifest not found: $manifest_path" >&2
  exit 1
fi

jq empty "$manifest_path"

manifest_bytes=$(wc -c < "$manifest_path")
if (( manifest_bytes > max_manifest_bytes )); then
  echo "ERROR: Context manifest is ${manifest_bytes} bytes; limit is ${max_manifest_bytes}" >&2
  exit 1
fi

if ! jq -e '[paths | select(.[-1] == "previous_sync")] | length == 0' "$manifest_path" >/dev/null; then
  echo "ERROR: previous_sync is forbidden; use the flat Context sync history" >&2
  exit 1
fi

history_rel=$(jq -r '.context_sync_history.path // empty' "$manifest_path")
if [[ -z "$history_rel" ]]; then
  echo "ERROR: context_sync_history.path is required" >&2
  exit 1
fi

history_path="$project_root/$history_rel"
if [[ ! -f "$history_path" ]]; then
  echo "ERROR: Context sync history not found: $history_path" >&2
  exit 1
fi

if ! jq -e -s '
  length > 0 and
  all(.[];
    type == "object" and
    (.event_type == "context_sync" or .event_type == "context_decision") and
    (.synced_at | type == "string" and length > 0) and
    (has("previous_sync") | not) and
    all(to_entries[]; (.value | type) != "object")
  )
' "$history_path" >/dev/null; then
  echo "ERROR: Context sync history must contain flat JSONL events" >&2
  exit 1
fi

history_lines=$(awk 'NF { count += 1 } END { print count + 0 }' "$history_path")
history_events=$(jq -s 'length' "$history_path")
if [[ "$history_lines" != "$history_events" ]]; then
  echo "ERROR: Context sync history must contain exactly one JSON event per non-empty line" >&2
  exit 1
fi

if ! jq -e -s '([.[].synced_at] == ([.[].synced_at] | sort))' "$history_path" >/dev/null; then
  echo "ERROR: Context sync history must be ordered by synced_at ascending" >&2
  exit 1
fi

latest_history_at=$(jq -r -s 'map(select(.event_type == "context_sync")) | last | .synced_at // empty' "$history_path")
latest_manifest_at=$(jq -r '.last_context_sync.synced_at // empty' "$manifest_path")
if [[ "$latest_history_at" != "$latest_manifest_at" ]]; then
  echo "ERROR: last_context_sync.synced_at does not match the latest context_sync history event" >&2
  exit 1
fi

echo "Context manifest OK (${manifest_bytes}/${max_manifest_bytes} bytes)"
echo "Context sync history OK ($(wc -l < "$history_path") flat events)"
