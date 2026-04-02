// Shared models reused by both API and IPC layers.
// Both SSoT/api/main.tsp and SSoT/ipc/main.tsp should import this file.
//
// Define types here that appear in both server API contracts and client IPC contracts.
// This prevents type duplication and keeps API/IPC layers decoupled from each other.

namespace Shared;

// Example: shared enum used by both API and IPC
// enum VideoTaskStatus { queued, processing, succeeded, failed }

// Example: shared model
// model SubtitleSegment {
//   segment_id?: string;
//   text?: string;
//   order?: int64;
//   start_ms?: int64;
//   end_ms?: int64;
// }
