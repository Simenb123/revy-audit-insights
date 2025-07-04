import { assert, assertEquals, assertStringIncludes, stub } from "../test_deps.ts";

function mockFetch(responseText: string) {
  return (_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(responseText, { status: 200, headers: { "Content-Type": "application/json" } }));
}

Deno.test("returns response for valid payload", async () => {
  let handler: (req: Request) => Promise<Response> | Response = () => new Response();
  const serveMod = await import("../test_deps.ts");
  const serveStub = stub(serveMod, "serve", (h: typeof handler) => { handler = h; });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch(JSON.stringify({ choices: [{ message: { content: "Test reply" } }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }));

  try {
    Deno.env.set("OPENAI_API_KEY", "test-key");
    await import("./index.ts");
    const req = new Request("http://localhost", { method: "POST", body: JSON.stringify({ message: "Hello", systemPrompt: "You are helpful" }) });
    const res = await handler(req);
    const data = await res.json();

    assertEquals(res.status, 200);
    assert("response" in data);
  } finally {
    serveStub.restore();
    globalThis.fetch = originalFetch;
  }
});

Deno.test("returns 400 for malformed json", async () => {
  let handler: (req: Request) => Promise<Response> | Response = () => new Response();
  const serveMod = await import("../test_deps.ts");
  const serveStub = stub(serveMod, "serve", (h: typeof handler) => { handler = h; });

  try {
    await import("./index.ts");
    const req = new Request("http://localhost", { method: "POST", body: "{" });
    const res = await handler(req);
    assertEquals(res.status, 400);
  } finally {
    serveStub.restore();
  }
});

Deno.test("returns 400 when message missing", async () => {
  let handler: (req: Request) => Promise<Response> | Response = () => new Response();
  const serveMod = await import("../test_deps.ts");
  const serveStub = stub(serveMod, "serve", (h: typeof handler) => { handler = h; });

  try {
    await import("./index.ts");
    const req = new Request("http://localhost", { method: "POST", body: JSON.stringify({}) });
    const res = await handler(req);
    assertEquals(res.status, 400);
  } finally {
    serveStub.restore();
  }
});

Deno.test("includes knowledge article metadata when provided", async () => {
  let handler: (req: Request) => Promise<Response> | Response = () => new Response();
  const serveMod = await import("../test_deps.ts");
  const serveStub = stub(serveMod, "serve", (h: typeof handler) => { handler = h; });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch(JSON.stringify({ choices: [{ message: { content: "Article info" } }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }));

  try {
    Deno.env.set("OPENAI_API_KEY", "test-key");
    await import("./index.ts");
    const payload = {
      message: "Hello",
      systemPrompt: "You are helpful",
      knowledgeArticles: [{ id: "1", title: "Test", category: { name: "cat" }, similarity: 0.9, reference_code: "REF1" }]
    };
    const req = new Request("http://localhost", { method: "POST", body: JSON.stringify(payload) });
    const res = await handler(req);
    const data = await res.json();
    assertStringIncludes(data.response, "KNOWLEDGE_ARTICLES");
  } finally {
    serveStub.restore();
    globalThis.fetch = originalFetch;
  }
});
