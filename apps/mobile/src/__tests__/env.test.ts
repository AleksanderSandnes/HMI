import {
  resolveJavaApiBaseUrl,
  LOCAL_JAVA_API,
  RENDER_JAVA_API,
} from '../lib/env';

describe('resolveJavaApiBaseUrl', () => {
  it('an explicit override always wins', () => {
    expect(
      resolveJavaApiBaseUrl({
        override: 'https://custom.example',
        dataMode: 'production',
        isDev: false,
      }),
    ).toBe('https://custom.example');
  });

  it('uses localhost only for a local dev build whose mode is not production', () => {
    expect(
      resolveJavaApiBaseUrl({ dataMode: 'development', isDev: true }),
    ).toBe(LOCAL_JAVA_API);
  });

  it('falls back to Render for installed builds (isDev false)', () => {
    expect(
      resolveJavaApiBaseUrl({ dataMode: 'development', isDev: false }),
    ).toBe(RENDER_JAVA_API);
  });

  it('falls back to Render in production mode even during dev', () => {
    expect(
      resolveJavaApiBaseUrl({ dataMode: 'production', isDev: true }),
    ).toBe(RENDER_JAVA_API);
  });
});
