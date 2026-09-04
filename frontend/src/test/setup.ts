import '@testing-library/jest-dom';

// Polyfill localStorage if not available in testing environment
if (typeof window !== 'undefined' && (!window.localStorage || typeof window.localStorage.clear !== 'function')) {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
}
