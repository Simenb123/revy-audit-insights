export function assert(condition: unknown, message?: string): void {
  if (!condition) throw new Error(message || 'Assertion failed');
}

export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected && JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${actual} === ${expected}`);
  }
}

export function assertStringIncludes(actual: string, expected: string, message?: string): void {
  if (!actual.includes(expected)) {
    throw new Error(message || `Expected "${actual}" to include "${expected}"`);
  }
}

export function stub<T extends Record<string, any>>(obj: T, method: keyof T, impl: any) {
  const original = obj[method];
  obj[method] = impl;
  return {
    restore() {
      obj[method] = original;
    }
  };
}

export function serve(_handler: (req: Request) => Response | Promise<Response>, _opts?: unknown): void {
  // no-op server stub for tests
}

// Redirect Deno.serve to this stub when running tests
if (typeof Deno !== 'undefined' && 'serve' in Deno) {
  // @ts-ignore overriding for tests
  Deno.serve = ((...args: [Parameters<typeof serve>[0], Parameters<typeof serve>[1]]) => serve(...args)) as typeof Deno.serve;
}

export function createClient(_url?: string, _key?: string, _opts?: unknown): any {
  return {};
}
