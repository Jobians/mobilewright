import { test, expect } from '@playwright/test';
import { MobileNextDriver } from './driver.js';

const INSECURE_URL = 'http://localhost:1234';

function withApiKeyEnv(value: string, fn: () => void): void {
  const previous = process.env.MOBILENEXT_API_KEY;
  process.env.MOBILENEXT_API_KEY = value;
  try {
    fn();
  } finally {
    if (previous === undefined) {
      delete process.env.MOBILENEXT_API_KEY;
    } else {
      process.env.MOBILENEXT_API_KEY = previous;
    }
  }
}

// The https guard only fires when an api key is in effect, so it tells us which key was picked.
test('falls back to MOBILENEXT_API_KEY when apiKey is not provided', () => {
  withApiKeyEnv('mob_from_env', () => {
    expect(() => new MobileNextDriver({ apiUrl: INSECURE_URL })).toThrow(/must use https/);
  });
});

test('explicit apiKey overrides MOBILENEXT_API_KEY', () => {
  withApiKeyEnv('mob_from_env', () => {
    expect(() => new MobileNextDriver({ apiKey: '', apiUrl: INSECURE_URL, testResult: { uploadReport: 'off' } })).not.toThrow();
  });
});
