import { describe, it, expect } from 'vitest';

describe('Creator App Build', () => {
  it('should import App without errors', async () => {
    // This test verifies the App can be imported without build errors
    const App = await import('../App');
    expect(App.default).toBeDefined();
  });
});
