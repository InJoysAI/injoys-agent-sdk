import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

@service({
  title: "InJoys Agent SDK API",
  version: "0.1.0",
})
namespace InJoysAgentSdk;

@route("/health")
op health(): { status: "ok" };
