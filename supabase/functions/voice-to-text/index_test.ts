import { assertEquals, stub } from "../test_deps.ts";

Deno.test("returns transcribed text in JSON", async () => {
  let handler: (req: Request) => Promise<Response> | Response = () => new Response();
  const serveMod = await import("../deps.ts");
  const serveStub = stub(serveMod, "serve", (h: typeof handler) => { handler = h; });

  const fetchStub = stub(globalThis, "fetch", async () =>
    new Response(JSON.stringify({ text: "hello world" }), { status: 200, headers: { "Content-Type": "application/json" } })
  );

  try {
    Deno.env.set("OPENAI_API_KEY", "test");
    await import("./index.ts");
    const audio = btoa("dummy audio");
    const res = await handler(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ audio }),
    }));
    const data = await res.json();
    assertEquals(data.text, "hello world");
  } finally {
    serveStub.restore();
    fetchStub.restore();
  }
});
