import { assertEquals, stub } from "../test_deps.ts";

Deno.test("responds with audio/mpeg for valid input", async () => {
  let handler: (req: Request) => Promise<Response> | Response = () => new Response();
  const serveMod = await import("../deps.ts");
  const serveStub = stub(serveMod, "serve", (h: typeof handler) => {
    handler = h;
  });

  const fetchStub = stub(globalThis, "fetch", async () =>
    new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "Content-Type": "audio/mpeg" } })
  );

  try {
    Deno.env.set("OPENAI_API_KEY", "test");
    await import("./index.ts");
    const res = await handler(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ text: "hello" }),
    }));
    assertEquals(res.headers.get("Content-Type"), "audio/mpeg");
  } finally {
    serveStub.restore();
    fetchStub.restore();
  }
});
