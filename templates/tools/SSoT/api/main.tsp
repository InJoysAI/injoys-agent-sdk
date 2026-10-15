import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

// {{project_name}} 的 API 契约入口。由 /context-init 初始化，后续通过提案演进。
// 初始化时把 {{project_name}} / {{project_namespace}} 替换为实际项目名。
@service({
  title: "{{project_name}} API",
  version: "0.1.0",
})
namespace {{project_namespace}};

@route("/health")
op health(): { status: "ok" };

// 统一响应结构：.context/criterion.md §5 若约定了统一成功/错误响应，必须在这里定义，
// 而不是只写在文档里（否则文档与契约会各存一份）。示例：
//
// model ApiResponse<T> {
//   code: string;
//   message: string;
//   data: T;
//   requestId: string;
// }
//
// model ApiError {
//   code: string;
//   message: string;
//   err?: string;
//   requestId: string;
// }
