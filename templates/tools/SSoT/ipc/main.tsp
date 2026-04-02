import "@typespec/json-schema";
import "../shared/models.tsp";

using TypeSpec.JsonSchema;

@jsonSchema
namespace Ipc;

// IPC-only types (client-local concepts: Session, Config, UI events, etc.)
// Shared types should be defined in SSoT/shared/ and imported here.
//
// Example:
// model SessionManifest {
//   session_id: string;
//   created_at: string;
//   updated_at: string;
//   status: "active" | "inactive" | "completed";
// }
