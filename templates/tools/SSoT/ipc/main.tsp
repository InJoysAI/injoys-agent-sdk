import "@typespec/json-schema";
// 仅当已初始化共享层（SSoT/shared/）时才取消下一行注释；
// 纯桌面应用（没有服务端 API）没有共享层，保持注释，否则编译会找不到文件。
// import "../shared/models.tsp";

using TypeSpec.JsonSchema;

@jsonSchema
namespace Ipc;

// IPC-only types (client-local concepts: Session, Config, UI events, etc.)
// Shared types should be defined in SSoT/shared/ and imported here.
//
// IPC 契约不只是数据结构，还应覆盖“命令与事件”（名称、方向、入参、返回、错误）。
// 工具无法直接表达时，用统一的结构化写法约定，并写入 .context/criterion.md。示例：
//
// model CommandGetSession {
//   command: "get_session";      // 前端 → 核心
//   payload: { session_id: string };
// }
// model EventSessionUpdated {
//   event: "session_updated";    // 核心 → 前端
//   payload: SessionManifest;
// }
//
// Example:
// model SessionManifest {
//   session_id: string;
//   created_at: string;
//   updated_at: string;
//   status: "active" | "inactive" | "completed";
// }
