import { test, expect } from '@playwright/test';
import { terminateAppIfRunning } from './launchers.js';

function createDeviceWhoseTerminateFails(message: string) {
  return {
    terminateApp: async () => {
      throw new Error(message);
    },
  };
}

test.describe('terminateAppIfRunning', () => {
  test('ignores a physical iOS device reporting the app is not running', async () => {
    const device = createDeviceWhoseTerminateFails('process of com.example not found');
    await expect(terminateAppIfRunning(device, 'com.example')).resolves.toBeUndefined();
  });

  test('rethrows when the app is not installed', async () => {
    const device = createDeviceWhoseTerminateFails('com.example not installed');
    await expect(terminateAppIfRunning(device, 'com.example')).rejects.toThrow('com.example not installed');
  });

  test('rethrows connection failures', async () => {
    const device = createDeviceWhoseTerminateFails('WebSocket is not connected');
    await expect(terminateAppIfRunning(device, 'com.example')).rejects.toThrow('WebSocket is not connected');
  });
});
