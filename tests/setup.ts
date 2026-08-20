import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill chrome API for test environments if missing
if (!('chrome' in globalThis)) {
  const storageStore: Record<string, unknown> = {};

  Object.defineProperty(globalThis, 'chrome', {
    configurable: true,
    value: {
      runtime: {
        id: 'test-extension-id',
        getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
        sendMessage: vi.fn(),
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
      storage: {
        local: {
          get: vi.fn(
            async (keys?: string | string[] | Record<string, unknown> | null) => {
              if (!keys) return { ...storageStore };
              if (typeof keys === 'string') {
                return { [keys]: storageStore[keys] };
              }
              if (Array.isArray(keys)) {
                const res: Record<string, unknown> = {};
                for (const k of keys) {
                  res[k] = storageStore[k];
                }
                return res;
              }
              const res: Record<string, unknown> = {};
              for (const [k, defaultVal] of Object.entries(keys)) {
                res[k] = storageStore[k] !== undefined ? storageStore[k] : defaultVal;
              }
              return res;
            },
          ),
          set: vi.fn(async (items: Record<string, unknown>) => {
            Object.assign(storageStore, items);
          }),
          clear: vi.fn(async () => {
            for (const key of Object.keys(storageStore)) {
              delete storageStore[key];
            }
          }),
          remove: vi.fn(async (keys: string | string[]) => {
            const list = Array.isArray(keys) ? keys : [keys];
            for (const k of list) {
              delete storageStore[k];
            }
          }),
        },
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
      action: {
        setBadgeText: vi.fn(),
        setBadgeBackgroundColor: vi.fn(),
        setTitle: vi.fn(),
      },
      tabs: {
        query: vi.fn(async () => []),
        sendMessage: vi.fn(),
      },
    },
  });
}
