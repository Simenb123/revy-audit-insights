import { assertEquals, stub } from "../../test_deps.ts";
import { handler } from "../index.ts";

Deno.test("normal query returns articles", async () => {

  const serveMod = await import("../../test_deps.ts");
  const serveStub = stub(serveMod, "serve", () => {});
  const supabaseStub = {
    from() {
      return this;
    },
    select() { return this; },
    eq() { return this; },
    or() { return this; },
    order() { return this; },
    limit() { return { data: [{ id: 1, title: "Hello" }], error: null }; },
    rpc() { return { data: [], error: null }; },
  };

  const createClient = () => supabaseStub;
  const createStub = stub(
    await import("../../test_deps.ts"),
    "createClient",
    createClient,
  );

  const fetchStub = stub(globalThis, "fetch", async (input: RequestInfo) => {
    if (typeof input === "string" && input.includes("openai")) {
      return new Response(JSON.stringify({ data: [{ embedding: [0] }] }));
    }
    return new Response("", { status: 200 });
  });

  const res = await handler(new Request("http://localhost", { method: "POST", body: JSON.stringify({ query: "hello" }) }));
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.articles.length, 1);

  createStub.restore();
  fetchStub.restore();
  serveStub.restore();
});


Deno.test("query with punctuation is sanitized", async () => {

  const serveMod = await import("../../test_deps.ts");
  const serveStub = stub(serveMod, "serve", () => {});
  const supabaseStub = {
    from() { return this; },
    select() { return this; },
    eq() { return this; },
    or() { return this; },
    order() { return this; },
    limit() {
      return { data: [{ id: 2, title: "Revisjon av inntekter" }], error: null };
    },
    rpc() { return { data: [], error: null }; },
  };

  const createStub = stub(
    await import("../../test_deps.ts"),
    "createClient",
    () => supabaseStub,
  );

  const fetchStub = stub(globalThis, "fetch", async (input: RequestInfo) => {
    if (typeof input === "string" && input.includes("openai")) {
      return new Response(JSON.stringify({ data: [{ embedding: [0] }] }));
    }
    return new Response("", { status: 200 });
  });

  const res = await handler(new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ query: "revisjon av inntekter?" }),
  }));
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.articles.length, 1);

  createStub.restore();
  fetchStub.restore();
  serveStub.restore();
});

Deno.test("query with no results returns empty array", async () => {

  const serveMod = await import("../../test_deps.ts");
  const serveStub = stub(serveMod, "serve", () => {});
  const supabaseStub = {
    from() { return this; },
    select() { return this; },
    eq() { return this; },
    or() { return this; },
    order() { return this; },
    limit() { return { data: [], error: null }; },
    rpc() { return { data: [], error: null }; },
  };
  const createStub = stub(
    await import("../../test_deps.ts"),
    "createClient",
    () => supabaseStub,
  );
  const fetchStub = stub(globalThis, "fetch", async () => new Response("", { status: 200 }));

  const res = await handler(new Request("http://localhost", { method: "POST", body: JSON.stringify({ query: "none" }) }));
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.articles.length, 0);

  createStub.restore();
  fetchStub.restore();
  serveStub.restore();
});


Deno.test("invalid JSON results in 400", async () => {


  const serveMod = await import("../../test_deps.ts");
  const serveStub = stub(serveMod, "serve", () => {});
  const res = await handler(new Request("http://localhost", { method: "POST", body: "{" }));
  assertEquals(res.status, 400);
  serveStub.restore();
});

Deno.test("openai error handled", async () => {

  const serveMod = await import("../../test_deps.ts");
  const serveStub = stub(serveMod, "serve", () => {});
  const supabaseStub = {
    from() { return this; },
    select() { return this; },
    eq() { return this; },
    or() { return this; },
    order() { return this; },
    limit() { return { data: [], error: null }; },
    rpc() { return { data: [], error: null }; },
  };
  const createStub = stub(
    await import("../../test_deps.ts"),
    "createClient",
    () => supabaseStub,
  );
  const fetchStub = stub(globalThis, "fetch", async () => new Response("fail", { status: 500 }));
  const res = await handler(new Request("http://localhost", { method: "POST", body: JSON.stringify({ query: "hello" }) }));
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.articles.length, 0);
  createStub.restore();
  fetchStub.restore();
  serveStub.restore();
});

Deno.test("supabase error handled", async () => {

  const serveMod = await import("../../test_deps.ts");
  const serveStub = stub(serveMod, "serve", () => {});
  const supabaseStub = {
    from() { return this; },
    select() { return this; },
    eq() { return this; },
    or() { return this; },
    order() { return this; },
    limit() { return { data: null, error: new Error("db fail") }; },
    rpc() { return { data: [], error: null }; },
  };
  const createStub = stub(
    await import("../../test_deps.ts"),
    "createClient",
    () => supabaseStub,
  );
  const fetchStub = stub(globalThis, "fetch", async () => new Response("", { status: 200 }));
  const res = await handler(new Request("http://localhost", { method: "POST", body: JSON.stringify({ query: "hello" }) }));
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.error, 'Knowledge search temporarily unavailable');
  createStub.restore();
  fetchStub.restore();
  serveStub.restore();
});
