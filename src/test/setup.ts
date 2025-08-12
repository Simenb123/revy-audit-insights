import '@testing-library/jest-dom/vitest';
import { beforeAll, afterAll, afterEach } from 'vitest';

// JSDOM polyfills and stubs commonly needed by Radix and others
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    dispatchEvent: () => false,
  } as any),
});

// Optional: MSW setup (no handlers by default)
// If needed, tests can import server and add handlers dynamically.
import { setupServer } from 'msw/node';
export const server = setupServer();

beforeAll(() => {
  try { server.listen({ onUnhandledRequest: 'bypass' }); } catch {}
});

afterEach(() => {
  try { server.resetHandlers(); } catch {}
});

afterAll(() => {
  try { server.close(); } catch {}
});

