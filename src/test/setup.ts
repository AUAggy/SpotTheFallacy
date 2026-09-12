import "@testing-library/jest-dom";

// jsdom as configured here does not provide a working localStorage: reading
// or writing it silently fails, which means the progress store - the one piece
// of state that actually matters - is never exercised by a test. Install a
// real in-memory implementation and clear it between tests so suites cannot
// leak progress into each other.
const memory = new Map<string, string>();

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => void memory.set(key, String(value)),
    removeItem: (key: string) => void memory.delete(key),
    clear: () => memory.clear(),
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() {
      return memory.size;
    },
  },
});

beforeEach(() => {
  memory.clear();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
